import React, { useEffect, useState } from 'react';
import { useAuth } from '../../core/auth/AuthContext';

interface ProbesData {
  liveness: string;
  readiness: string;
  uptimeTargetPercent: number;
  currentUptimeSeconds: number;
  paymentGatewayMode: string;
}

interface SlaReportData {
  totalMeasured: number;
  passedCount: number;
  complianceRatePercent: number;
}

export const ProductionReadinessChecklistPanel: React.FC = () => {
  const { accessToken } = useAuth();
  const [probes, setProbes] = useState<ProbesData | null>(null);
  const [slaReport, setSlaReport] = useState<SlaReportData | null>(null);
  const [releaseVersion, setReleaseVersion] = useState('v1.0.0-rc1');
  const [note, setNote] = useState(
    'Đã hoàn tất kiểm định SLA P95, bảo mật RBAC 6 vai trò và bất biến sổ cái 70/20/10.',
  );
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadReadinessData = async () => {
    const probeRes = await fetch(
      'http://localhost:3000/api/v1/system-admin/readiness/probes',
    );
    if (probeRes.ok) {
      setProbes(await probeRes.json());
    }

    if (!accessToken) return;
    const slaRes = await fetch(
      'http://localhost:3000/api/v1/system-admin/readiness/sla-benchmarks',
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );
    if (slaRes.ok) {
      setSlaReport(await slaRes.json());
    }
  };

  useEffect(() => {
    loadReadinessData();
  }, [accessToken]);

  const handleSignOff = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);
    setErrorMsg(null);

    const res = await fetch(
      'http://localhost:3000/api/v1/system-admin/readiness/sign-off',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ releaseVersion, note }),
      },
    );

    const body = await res.json();
    if (!res.ok) {
      setErrorMsg(body.message || 'Ký chứng nhận sẵn sàng Production thất bại.');
      return;
    }

    setStatusMsg(
      `Đã ký Chứng nhận Sẵn sàng Production #${body.signoffCode} cho phiên bản ${body.releaseVersion}!`,
    );
    await loadReadinessData();
  };

  return (
    <section
      style={{
        marginTop: 24,
        padding: 16,
        border: '1px solid #cbd5e1',
        borderRadius: 8,
        background: '#f8fafc',
      }}
    >
      <h2>
        Giám sát SLA Phi chức năng, Kiểm toán Bảo mật RBAC & Sẵn sàng Production (Ngày D19 — REQ-NFR-01/02/03)
      </h2>

      {statusMsg && (
        <div style={{ padding: 10, background: '#dcfce7', color: '#166534', marginBottom: 12 }}>
          {statusMsg}
        </div>
      )}
      {errorMsg && (
        <div style={{ padding: 10, background: '#fee2e2', color: '#991b1b', marginBottom: 12 }}>
          {errorMsg}
        </div>
      )}

      {probes && (
        <p style={{ margin: '6px 0', fontSize: 14 }}>
          Liveness: <strong>{probes.liveness}</strong> | Readiness:{' '}
          <strong>{probes.readiness}</strong> | Uptime SLA:{' '}
          <strong>{probes.uptimeTargetPercent}%</strong> (Hiện tại: {probes.currentUptimeSeconds}s) |
          PayOS Mode: <strong>{probes.paymentGatewayMode}</strong>
          {slaReport && (
            <>
              {' '}
              | Tuân thủ SLA P95:{' '}
              <strong>
                {slaReport.passedCount}/{slaReport.totalMeasured} ({slaReport.complianceRatePercent}%)
              </strong>
            </>
          )}
        </p>
      )}

      <form
        onSubmit={handleSignOff}
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 3fr auto',
          gap: 10,
          alignItems: 'end',
          marginTop: 12,
        }}
      >
        <label>
          Phiên bản Release
          <input
            type="text"
            value={releaseVersion}
            onChange={(e) => setReleaseVersion(e.target.value)}
            style={{ width: '100%', padding: 6 }}
          />
        </label>
        <label>
          Ghi chú Nghiệm thu Production Readiness (Tối thiểu 15 ký tự)
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            style={{ width: '100%', padding: 6 }}
          />
        </label>
        <button type="submit" style={{ padding: '8px 14px', fontWeight: 600 }}>
          Ký Chứng nhận Production (D19)
        </button>
      </form>
    </section>
  );
};