import React, { useEffect, useState } from 'react';
import { useAuth } from '../../core/auth/AuthContext';

interface DrDrillItem {
  id: string;
  drillCode: string;
  scenarioName: string;
  measuredRtoSeconds: number;
  targetRtoSeconds: number;
  withinDrSla: boolean;
  executedAt: string;
}

export const PostGoLiveHypercareD23Panel: React.FC = () => {
  const { accessToken, user } = useAuth();
  const [drDrills, setDrDrills] = useState<DrDrillItem[]>([]);
  const [gateD23SignedOff, setGateD23SignedOff] = useState(false);
  const [scenarioName, setScenarioName] = useState(
    'Khôi phục Snapshot PostgreSQL & Đối soát Sổ cái 70/20/10',
  );
  const [measuredRtoSeconds, setMeasuredRtoSeconds] = useState(42);
  const [drillNote, setDrillNote] = useState(
    'Hoàn tất diễn tập sao lưu và khôi phục sổ cái bất biến với RPO = 0, RTO = 42s.',
  );
  const [defenseNote, setDefenseNote] = useState(
    'Hệ thống vận hành ổn định sau Go-Live, vượt qua diễn tập DR Drill và sẵn sàng bảo vệ đồ án D23.',
  );
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadHypercareData = async () => {
    if (!accessToken) return;
    try {
      const [statusRes, drillsRes] = await Promise.all([
        fetch('/api/v1/system-admin/hypercare/status', {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
        fetch('/api/v1/system-admin/hypercare/dr-drills', {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
      ]);

      if (statusRes.ok) {
        const statusData = await statusRes.json();
        setGateD23SignedOff(Boolean(statusData.gateD23SignedOff));
      }
      if (drillsRes.ok) {
        const drillsData = await drillsRes.json();
        setDrDrills(Array.isArray(drillsData) ? drillsData : []);
      }
    } catch (err: any) {
      setError(err.message || 'Lỗi tải dữ liệu Vận hành Hypercare D23.');
    }
  };

  useEffect(() => {
    loadHypercareData();
  }, [accessToken]);

  const handleExecuteDrDrill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;
    setError(null);
    setMessage(null);
    try {
      const res = await fetch('/api/v1/system-admin/hypercare/dr-drills', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          scenarioName,
          measuredRtoSeconds: Number(measuredRtoSeconds),
          drillNote,
        }),
      });
      const body = await res.json();
      if (!res.ok) {
        throw new Error(body.message || 'Không thể chạy diễn tập DR Drill.');
      }
      setMessage(
        `Đã hoàn tất diễn tập ${body.drillCode} (RTO: ${body.measuredRtoSeconds}s / ${body.targetRtoSeconds}s).`,
      );
      await loadHypercareData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleSignOffDefenseGateD23 = async () => {
    if (!accessToken || drDrills.length === 0) return;
    setError(null);
    setMessage(null);
    const latestDrill = drDrills[drDrills.length - 1];
    try {
      const res = await fetch(
        '/api/v1/system-admin/hypercare/gate-d23-defense-signoff',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            drDrillId: latestDrill.id,
            releaseVersion: 'v1.0.0-hypercare-d23',
            defenseNote,
          }),
        },
      );
      const body = await res.json();
      if (!res.ok) {
        throw new Error(body.message || 'Không thể ký đóng cổng Gate D23.');
      }
      setMessage(
        `Đã ký nghiệm thu ${body.defenseCode} (${body.gateStatus})!`,
      );
      await loadHypercareData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <section
      style={{
        marginTop: '1.5rem',
        padding: '1.25rem',
        border: '1px solid #cbd5e1',
        borderRadius: '8px',
        backgroundColor: '#f8fafc',
      }}
    >
      <h3>
        Vận hành Hypercare Sau Go-Live, Diễn tập DR Sổ cái & Nghiệm thu Bảo vệ Đồ án (Gate D23)
      </h3>
      {message && <p style={{ color: '#15803d', fontWeight: 600 }}>{message}</p>}
      {error && <p style={{ color: '#b91c1c', fontWeight: 600 }}>{error}</p>}

      <div style={{ marginBottom: '1rem' }}>
        <strong>
          Trạng thái Cổng Gate D23:{' '}
          {gateD23SignedOff ? 'PASSED_AND_DEFENSE_READY' : 'PENDING'}
        </strong>
      </div>

      <form onSubmit={handleExecuteDrDrill} style={{ marginTop: '1rem' }}>
        <h4>1. Thực thi Diễn tập Sao lưu & Khôi phục Sổ cái (DR Drill)</h4>
        <input
          type="text"
          value={scenarioName}
          onChange={(e) => setScenarioName(e.target.value)}
          style={{ width: '45%', marginRight: '0.5rem', padding: '0.35rem' }}
        />
        <input
          type="number"
          value={measuredRtoSeconds}
          onChange={(e) => setMeasuredRtoSeconds(Number(e.target.value))}
          style={{ width: '90px', marginRight: '0.5rem', padding: '0.35rem' }}
        />
        <button type="submit">Chạy Diễn tập DR Drill</button>
      </form>

      {drDrills.length > 0 && (
        <div style={{ marginTop: '1rem' }}>
          <ul>
            {drDrills.map((d) => (
              <li key={d.id}>
                <strong>{d.drillCode}</strong> — {d.scenarioName} | RTO:{' '}
                {d.measuredRtoSeconds}s/{d.targetRtoSeconds}s (
                {d.withinDrSla ? 'ĐẠT SLA' : 'VƯỢT SLA'})
              </li>
            ))}
          </ul>
          {user?.role === 'SYSTEM_ADMIN' && !gateD23SignedOff && (
            <div style={{ marginTop: '0.75rem' }}>
              <input
                type="text"
                value={defenseNote}
                onChange={(e) => setDefenseNote(e.target.value)}
                style={{ width: '100%', marginBottom: '0.5rem' }}
              />
              <button type="button" onClick={handleSignOffDefenseGateD23}>
                Ký Nghiệm thu Bảo vệ Đồ án Gate D23
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
};