import React, { useState } from 'react';
import { useAuth } from '../../core/auth/AuthContext';

interface TransparencyReport {
  reportCode: string;
  labFundSummary: {
    totalLabFund10CollectedVnd: number;
    totalRemainderAbsorbedVnd: number;
    totalGrossDisbursedVnd: number;
    invariantHold: boolean;
  };
  disputeGovernance: {
    totalDisputes: number;
    openDisputes: number;
    resolvedReleaseCount: number;
    resolvedRefundCount: number;
  };
  closureGovernance: {
    totalClosedDossiers: number;
    averageSatisfactionScore: number;
    wouldSponsorAgainRatePercent: number;
  };
}

export const FinancialClosureAndTransparencyPanel: React.FC<{
  defaultProjectId?: string;
}> = ({ defaultProjectId = 'proj-1' }) => {
  const { accessToken } = useAuth();
  const [projectId, setProjectId] = useState(defaultProjectId);
  const [satisfactionScore, setSatisfactionScore] = useState(5);
  const [feedbackSummary, setFeedbackSummary] = useState(
    'Nhóm sinh viên và Mentor bàn giao sản phẩm đúng tiến độ, chất lượng vượt kỳ vọng của doanh nghiệp.',
  );
  const [report, setReport] = useState<TransparencyReport | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadTransparencyReport = async () => {
    if (!accessToken) return;
    setErrorMsg(null);
    const res = await fetch(
      'http://localhost:3000/api/v1/payments/lab-fund/transparency-report',
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );
    const body = await res.json();
    if (!res.ok) {
      setErrorMsg(body.message || 'Không thể tải Báo cáo Minh bạch Quỹ Lab 10%.');
      return;
    }
    setReport(body);
  };

  const handleSignClosureDossier = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);
    setErrorMsg(null);

    const res = await fetch(
      `http://localhost:3000/api/v1/payments/projects/${projectId}/closure-dossier`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          satisfactionScore: Number(satisfactionScore),
          wouldSponsorAgain: true,
          feedbackSummary,
        }),
      },
    );

    const body = await res.json();
    if (!res.ok) {
      setErrorMsg(body.message || 'Ký Hồ sơ Đóng Dự án thất bại.');
      return;
    }

    setStatusMsg(
      `Đã ký Hồ sơ Nghiệm thu Đóng Dự án #${body.dossierCode} (Điểm hài lòng: ${body.satisfactionScore}/5)!`,
    );
    await loadTransparencyReport();
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
        Hồ sơ Đóng Dự án, Phân xử Khiếu nại & Minh bạch Quỹ Lab 10% (Ngày D18 — REQ-FIN-03 / REQ-LAB-02)
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

      <form onSubmit={handleSignClosureDossier} style={{ display: 'grid', gap: 10, marginBottom: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 10, alignItems: 'end' }}>
          <label>
            Mã Dự án (Project ID)
            <input
              type="text"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              style={{ width: '100%', padding: 6 }}
            />
          </label>
          <label>
            Điểm hài lòng Doanh nghiệp (1–5)
            <input
              type="number"
              min={1}
              max={5}
              value={satisfactionScore}
              onChange={(e) => setSatisfactionScore(Number(e.target.value))}
              style={{ width: '100%', padding: 6 }}
            />
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="submit" style={{ padding: '8px 12px', fontWeight: 600 }}>
              Ký Hồ sơ Đóng Dự án
            </button>
            <button type="button" onClick={loadTransparencyReport} style={{ padding: '8px 12px' }}>
              Tải Báo cáo Quỹ Lab 10%
            </button>
          </div>
        </div>
        <label>
          Nhận xét nghiệm thu tổng kết của Doanh nghiệp
          <input
            type="text"
            value={feedbackSummary}
            onChange={(e) => setFeedbackSummary(e.target.value)}
            style={{ width: '100%', padding: 6 }}
          />
        </label>
      </form>

      {report && (
        <div style={{ border: '1px solid #94a3b8', borderRadius: 6, padding: 14, background: '#fff' }}>
          <h4>Báo cáo Minh bạch Quỹ Vận hành LabOdc 10% ({report.reportCode})</h4>
          <p style={{ margin: '4px 0', fontSize: 14 }}>
            Tổng thu Quỹ Lab 10%:{' '}
            <strong>
              {report.labFundSummary.totalLabFund10CollectedVnd.toLocaleString('vi-VN')} VNĐ
            </strong>{' '}
            (Phần dư làm tròn: {report.labFundSummary.totalRemainderAbsorbedVnd} VNĐ) | Tổng giải
            ngân toàn hệ thống:{' '}
            <strong>
              {report.labFundSummary.totalGrossDisbursedVnd.toLocaleString('vi-VN')} VNĐ
            </strong>{' '}
            | Bất biến Sổ cái: <strong>{report.labFundSummary.invariantHold ? 'PASS' : 'FAIL'}</strong>
          </p>
          <p style={{ margin: '4px 0', fontSize: 14 }}>
            Hồ sơ đã đóng: <strong>{report.closureGovernance.totalClosedDossiers}</strong> | Điểm
            hài lòng TB: <strong>{report.closureGovernance.averageSatisfactionScore}/5</strong> | Tỷ
            lệ tài trợ lại: <strong>{report.closureGovernance.wouldSponsorAgainRatePercent}%</strong>
          </p>
        </div>
      )}
    </section>
  );
};