import { useEffect, useState } from 'react';
import { useAuth } from '../../core/auth/AuthContext';

interface ParityStatusDto {
  statusCode: string;
  mobileModulesVerified: string[];
  mobileFeatureParityPercent: number;
  totalReconciliations: number;
  gateD26SignedOff: boolean;
}

export function MobileEvaluationBridgeD26Panel() {
  const { accessToken, user } = useAuth();
  const [status, setStatus] = useState<ParityStatusDto | null>(null);
  const [projectCode, setProjectCode] = useState('PRJ-MOB-EVAL-D26');
  const [milestoneAmountVnd, setMilestoneAmountVnd] = useState(20000003);
  const [error, setError] = useState<string | null>(null);

  const headers = {
    'Content-Type': 'application/json',
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
  };

  const loadStatus = async () => {
    try {
      setError(null);
      const res = await fetch(
        '/api/v1/system-admin/mobile-eval-bridge/parity-status',
        { headers },
      );
      if (res.ok) {
        setStatus(await res.json());
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Lỗi tải trạng thái Gate D26',
      );
    }
  };

  useEffect(() => {
    if (accessToken) {
      void loadStatus();
    }
  }, [accessToken]);

  const handleReconcileAndSign = async () => {
    try {
      setError(null);
      const reconRes = await fetch(
        '/api/v1/system-admin/mobile-eval-bridge/reconcile-payout',
        {
          method: 'POST',
          headers,
          body: JSON.stringify({
            projectCode,
            milestoneAmountVnd,
            members: [
              {
                memberEmail: 'leader.d26@labodc.edu.vn',
                evaluationGrade: 'EXCELLENT',
                contributionPercent: 60,
              },
              {
                memberEmail: 'member.d26@labodc.edu.vn',
                evaluationGrade: 'GOOD',
                contributionPercent: 40,
              },
            ],
          }),
        },
      );
      if (!reconRes.ok) {
        const body = await reconRes.json().catch(() => ({}));
        throw new Error(body.message || `HTTP ${reconRes.status}`);
      }
      const recon = await reconRes.json();

      if (user?.role === 'SYSTEM_ADMIN') {
        await fetch(
          '/api/v1/system-admin/mobile-eval-bridge/gate-d26-signoff',
          {
            method: 'POST',
            headers,
            body: JSON.stringify({
              reconciliationId: recon.id,
              signoffNote:
                'Nghiệm thu liên thông Đánh giá Hiệu suất Mobile (Evaluations) với Sổ cái Quỹ 70% Nhóm Sinh viên và Bảo mật Private Files D26.',
            }),
          },
        );
      }
      await loadStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi xử lý Gate D26');
    }
  };

  return (
    <section className="sys-panel">
      <h3>
        Cổng D26 — Liên thông Đánh giá Hiệu suất Mobile (Evaluations) & Quyết
        toán Quỹ 70% Nhóm Sinh viên
      </h3>
      {error && <p className="error-banner">{error}</p>}

      {status && (
        <div className="metrics-grid">
          <div className="metric-card">
            <strong>Tương đương Tính năng Mobile:</strong>{' '}
            {status.mobileFeatureParityPercent}%
          </div>
          <div className="metric-card">
            <strong>Số Phiên Đối soát:</strong> {status.totalReconciliations}
          </div>
          <div className="metric-card">
            <strong>Trạng thái Cổng D26:</strong>{' '}
            {status.gateD26SignedOff ? 'PASSED_FULL_PARITY' : 'PENDING'}
          </div>
        </div>
      )}

      <div style={{ marginTop: '1rem' }}>
        <input
          type="text"
          value={projectCode}
          onChange={(e) => setProjectCode(e.target.value)}
          placeholder="Mã dự án"
        />
        <input
          type="number"
          value={milestoneAmountVnd}
          onChange={(e) => setMilestoneAmountVnd(Number(e.target.value))}
          placeholder="Giá trị cột mốc (VND)"
        />
        <button type="button" onClick={handleReconcileAndSign}>
          Đối soát Evaluations-Payout 70% & Ký Gate D26
        </button>
      </div>
    </section>
  );
}