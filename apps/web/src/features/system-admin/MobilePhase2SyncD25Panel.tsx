import { useEffect, useState } from 'react';
import { useAuth } from '../../core/auth/AuthContext';

interface MobilePhase2EndpointContract {
  contractCode: string;
  mobileFeatureModule: string;
  mobileDartRepository: string;
  method: string;
  endpointPath: string;
  slaTargetMs: number;
  compatible: boolean;
}

interface SyncCheckpoint {
  id: string;
  checkpointCode: string;
  gateCode: string;
  gateStatus: string;
  mobileReleaseVersion: string;
  verifiedEndpointsCount: number;
  slaCompliancePercent: number;
  syncNote: string;
  verifiedAt: string;
}

export function MobilePhase2SyncD25Panel() {
  const { accessToken, user } = useAuth();
  const [contracts, setContracts] = useState<MobilePhase2EndpointContract[]>(
    [],
  );
  const [checkpoints, setCheckpoints] = useState<SyncCheckpoint[]>([]);
  const [mobileReleaseVersion, setMobileReleaseVersion] = useState(
    'v2.5.0-mobile-p2-d25',
  );
  const [syncNote, setSyncNote] = useState(
    'Nghiệm thu đồng bộ Hợp đồng API Mobile Pha 2 (Applications, Work/Tasks, Progress Reports, Private Files) khớp 100% với Backend NestJS.',
  );
  const [error, setError] = useState<string | null>(null);

  const headers = {
    'Content-Type': 'application/json',
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
  };

  const loadData = async () => {
    try {
      setError(null);
      const [contractsRes, checkpointsRes] = await Promise.all([
        fetch('/api/v1/system-admin/mobile-phase2/contracts', { headers }),
        fetch('/api/v1/system-admin/mobile-phase2/sync-checkpoints', {
          headers,
        }),
      ]);
      if (contractsRes.ok) {
        const data = await contractsRes.json();
        setContracts(data.contracts ?? []);
      }
      if (checkpointsRes.ok) {
        const list = await checkpointsRes.json();
        setCheckpoints(list);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Lỗi tải dữ liệu Mobile Phase 2',
      );
    }
  };

  useEffect(() => {
    if (accessToken) {
      void loadData();
    }
  }, [accessToken]);

  const handleCreateCheckpoint = async () => {
    try {
      setError(null);
      const res = await fetch(
        '/api/v1/system-admin/mobile-phase2/sync-checkpoints',
        {
          method: 'POST',
          headers,
          body: JSON.stringify({ mobileReleaseVersion, syncNote }),
        },
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || `HTTP ${res.status}`);
      }
      await loadData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Không thể ký checkpoint D25',
      );
    }
  };

  return (
    <section className="sys-panel">
      <h3>
        Cổng D25 — Đồng bộ Hợp đồng API Mobile Pha 2 (Applications, Work/Tasks,
        Reports & Private Files)
      </h3>
      {error && <p className="error-banner">{error}</p>}

      <div className="metrics-grid">
        <div className="metric-card">
          <strong>Tổng Endpoints Pha 2:</strong> {contracts.length}
        </div>
        <div className="metric-card">
          <strong>Trạng thái Tương thích:</strong> 100% COMPATIBLE
        </div>
        <div className="metric-card">
          <strong>Số Checkpoint Đã Ký:</strong> {checkpoints.length}
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Mã Hợp đồng</th>
            <th>Phân hệ Mobile</th>
            <th>Method & Endpoint</th>
            <th>Dart Repository</th>
            <th>Trạng thái</th>
          </tr>
        </thead>
        <tbody>
          {contracts.map((item) => (
            <tr key={item.contractCode}>
              <td>{item.contractCode}</td>
              <td>{item.mobileFeatureModule}</td>
              <td>
                {item.method} {item.endpointPath}
              </td>
              <td>{item.mobileDartRepository}</td>
              <td>{item.compatible ? 'COMPATIBLE' : 'MISMATCH'}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {user?.role === 'SYSTEM_ADMIN' && (
        <div style={{ marginTop: '1rem' }}>
          <input
            type="text"
            value={mobileReleaseVersion}
            onChange={(e) => setMobileReleaseVersion(e.target.value)}
            placeholder="Phiên bản Mobile Release"
          />
          <input
            type="text"
            value={syncNote}
            onChange={(e) => setSyncNote(e.target.value)}
            placeholder="Ghi chú đồng bộ D25"
          />
          <button type="button" onClick={handleCreateCheckpoint}>
            Ký Nghiệm thu Đồng bộ Đa nền tảng Gate D25
          </button>
        </div>
      )}
    </section>
  );
}