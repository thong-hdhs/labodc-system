import React, { useEffect, useState } from 'react';
import { useAuth } from '../../core/auth/AuthContext';

interface MobileEndpointItem {
  featureModule: string;
  mobileSourceFile: string;
  method: string;
  endpointPath: string;
  contractCompatible: boolean;
}

interface SmokeCheckItem {
  subsystemCode: string;
  description: string;
  status: 'PASS' | 'FAIL';
  latencyMs: number;
  verificationDetail: string;
}

interface SmokeRunItem {
  id: string;
  runCode: string;
  releaseTag: string;
  environmentName: string;
  passRatePercent: number;
  checks: SmokeCheckItem[];
  executedAt: string;
}

export const ProductionGoLiveGateD21Panel: React.FC = () => {
  const { accessToken, user } = useAuth();
  const [mobileEndpoints, setMobileEndpoints] = useState<MobileEndpointItem[]>(
    [],
  );
  const [latestSmokeRun, setLatestSmokeRun] = useState<SmokeRunItem | null>(
    null,
  );
  const [gateSignedOff, setGateSignedOff] = useState(false);
  const [releaseTag, setReleaseTag] = useState('v1.0.0-golive-d21');
  const [signoffNote, setSignoffNote] = useState(
    'Hoàn tất kiểm thử khói 6 phân hệ, đồng bộ Mobile Companion và đóng cổng Sprint 3 Gate D21.',
  );
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadGateD21Data = async () => {
    if (!accessToken) return;
    try {
      const [mobRes, gateRes] = await Promise.all([
        fetch('/api/v1/system-admin/golive/mobile-contract', {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
        fetch('/api/v1/system-admin/golive/gate-d21-status', {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
      ]);

      if (mobRes.ok) {
        const mobData = await mobRes.json();
        setMobileEndpoints(mobData.endpoints || []);
      }
      if (gateRes.ok) {
        const gateData = await gateRes.json();
        setGateSignedOff(Boolean(gateData.gateSignedOff));
        setLatestSmokeRun(gateData.latestSmokeRun || null);
      }
    } catch (err: any) {
      setError(err.message || 'Lỗi tải dữ liệu Cổng Nghiệm thu Gate D21.');
    }
  };

  useEffect(() => {
    loadGateD21Data();
  }, [accessToken]);

  const handleRunSmokeSuite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;
    setError(null);
    setMessage(null);
    try {
      const res = await fetch('/api/v1/system-admin/golive/smoke-runs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          releaseTag,
          environmentName: 'PRODUCTION',
        }),
      });
      const body = await res.json();
      if (!res.ok) {
        throw new Error(body.message || 'Không thể chạy Smoke Test.');
      }
      setMessage(
        `Đã chạy thành công phiên Smoke Test ${body.runCode} (Tỷ lệ đạt: ${body.passRatePercent}%).`,
      );
      await loadGateD21Data();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleSignOffGateD21 = async () => {
    if (!accessToken || !latestSmokeRun) return;
    setError(null);
    setMessage(null);
    try {
      const res = await fetch('/api/v1/system-admin/golive/gate-d21-signoff', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          smokeRunId: latestSmokeRun.id,
          signoffNote,
        }),
      });
      const body = await res.json();
      if (!res.ok) {
        throw new Error(body.message || 'Không thể ký đóng cổng Gate D21.');
      }
      setMessage(
        `Chính thức ký duyệt đóng cổng ${body.gateCode} (${body.gateStatus})!`,
      );
      await loadGateD21Data();
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
        Kiểm định Hợp đồng Mobile Companion, Smoke Test & Đóng Cổng Gate D21
      </h3>
      {message && <p style={{ color: '#15803d', fontWeight: 600 }}>{message}</p>}
      {error && <p style={{ color: '#b91c1c', fontWeight: 600 }}>{error}</p>}

      <div style={{ marginBottom: '1rem' }}>
        <strong>
          Trạng thái Cổng Sprint 3 Gate D21:{' '}
          {gateSignedOff ? 'PASSED (ĐÃ KÝ NGHIỆM THU GO-LIVE)' : 'PENDING'}
        </strong>
      </div>

      <h4>1. Hợp đồng API tương thích với Flutter Mobile (`apps/mobile`)</h4>
      <ul>
        {mobileEndpoints.map((ep, idx) => (
          <li key={idx}>
            <strong>[{ep.featureModule}]</strong> {ep.method} {ep.endpointPath} —{' '}
            {ep.mobileSourceFile} (
            {ep.contractCompatible ? 'Tương thích 100%' : 'Lỗi'})
          </li>
        ))}
      </ul>

      <form onSubmit={handleRunSmokeSuite} style={{ marginTop: '1rem' }}>
        <h4>2. Kích hoạt Bộ Kiểm thử Khói Sau Triển khai (Smoke Suite)</h4>
        <input
          type="text"
          value={releaseTag}
          onChange={(e) => setReleaseTag(e.target.value)}
          placeholder="Nhãn phát hành (v1.0.0-golive-d21)"
          style={{ marginRight: '0.5rem', padding: '0.35rem' }}
        />
        <button type="submit">Chạy Smoke Test 6 Phân hệ</button>
      </form>

      {latestSmokeRun && (
        <div style={{ marginTop: '1rem' }}>
          <p>
            Phiên gần nhất: <strong>{latestSmokeRun.runCode}</strong> (
            {latestSmokeRun.passRatePercent}% PASS)
          </p>
          {user?.role === 'SYSTEM_ADMIN' && !gateSignedOff && (
            <div>
              <input
                type="text"
                value={signoffNote}
                onChange={(e) => setSignoffNote(e.target.value)}
                style={{ width: '100%', marginBottom: '0.5rem' }}
              />
              <button type="button" onClick={handleSignOffGateD21}>
                Ký Nghiệm thu Đóng Cổng Sprint 3 Gate D21
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
};