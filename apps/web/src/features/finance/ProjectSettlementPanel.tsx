import React, { useState } from 'react';
import { useAuth } from '../../core/auth/AuthContext';

interface SettlementCertificate {
  certificateCode: string;
  projectId: string;
  projectCode: string;
  projectTitle: string;
  projectStatus: string;
  companyName: string;
  financialTotals: {
    totalEscrowDepositedVnd: number;
    totalDisbursedVnd: number;
    totalRefundedVnd: number;
    escrowRemainingBalanceVnd: number;
  };
  revenueSplitSummary: {
    teamLeader70Vnd: number;
    mentor20Vnd: number;
    labFund10Vnd: number;
    remainderAbsorbedByLabVnd: number;
    splitInvariantHold: boolean;
  };
  progressOverview: {
    totalReports: number;
    latestCompletionPercentage: number;
    latestHealthStatus: string;
    flaggedReportsCount: number;
  };
  isFullySettled: boolean;
}

export const ProjectSettlementPanel: React.FC<{ defaultProjectId?: string }> = ({
  defaultProjectId = 'proj-1',
}) => {
  const { accessToken } = useAuth();
  const [projectId, setProjectId] = useState(defaultProjectId);
  const [reportingWeek, setReportingWeek] = useState(1);
  const [completionPercentage, setCompletionPercentage] = useState(100);
  const [healthStatus, setHealthStatus] = useState<'ON_TRACK' | 'AT_RISK' | 'DELAYED'>('ON_TRACK');
  const [summary, setSummary] = useState(
    'Đã hoàn tất toàn bộ các hạng mục kỹ thuật và bàn giao nghiệm thu cột mốc.',
  );
  const [certificate, setCertificate] = useState<SettlementCertificate | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadCertificate = async () => {
    if (!accessToken || !projectId) return;
    setErrorMsg(null);
    const res = await fetch(
      `http://localhost:3000/api/v1/payments/projects/${projectId}/settlement-certificate`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );
    const body = await res.json();
    if (!res.ok) {
      setErrorMsg(body.message || 'Không thể tải Biên bản Quyết toán dự án.');
      return;
    }
    setCertificate(body);
  };

  const handleSubmitProgressReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);
    setErrorMsg(null);

    const res = await fetch('http://localhost:3000/api/v1/payments/progress-reports', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        projectId,
        reportingWeek: Number(reportingWeek),
        completionPercentage: Number(completionPercentage),
        healthStatus,
        summary,
      }),
    });

    const body = await res.json();
    if (!res.ok) {
      setErrorMsg(body.message || 'Nộp báo cáo tiến độ thất bại.');
      return;
    }

    setStatusMsg(
      `Đã nộp báo cáo tiến độ tuần ${body.reportingWeek} (${body.completionPercentage}% - ${body.healthStatus})!`,
    );
    await loadCertificate();
  };

  return (
    <section
      style={{
        marginTop: 28,
        padding: 16,
        border: '1px solid #cbd5e1',
        borderRadius: 8,
        background: '#f8fafc',
      }}
    >
      <h2>
        Báo cáo Tiến độ Thực thi & Biên bản Quyết toán Dự án 70/20/10 (Ngày D15 — REQ-LAB-02 / REQ-FIN-03)
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

      <form
        onSubmit={handleSubmitProgressReport}
        style={{ display: 'grid', gap: 10, marginBottom: 16 }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto', gap: 10 }}>
          <label>
            Mã Dự án
            <input
              type="text"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              style={{ width: '100%', padding: 6 }}
            />
          </label>
          <label>
            Tuần báo cáo
            <input
              type="number"
              min={1}
              value={reportingWeek}
              onChange={(e) => setReportingWeek(Number(e.target.value))}
              style={{ width: '100%', padding: 6 }}
            />
          </label>
          <label>
            Tiến độ (%)
            <input
              type="number"
              min={0}
              max={100}
              value={completionPercentage}
              onChange={(e) => setCompletionPercentage(Number(e.target.value))}
              style={{ width: '100%', padding: 6 }}
            />
          </label>
          <label>
            Trạng thái Sức khỏe
            <select
              value={healthStatus}
              onChange={(e) =>
                setHealthStatus(e.target.value as 'ON_TRACK' | 'AT_RISK' | 'DELAYED')
              }
              style={{ width: '100%', padding: 6 }}
            >
              <option value="ON_TRACK">ON_TRACK</option>
              <option value="AT_RISK">AT_RISK</option>
              <option value="DELAYED">DELAYED</option>
            </select>
          </label>
          <div style={{ display: 'flex', gap: 8, alignItems: 'end' }}>
            <button type="submit" style={{ padding: '8px 12px', fontWeight: 600 }}>
              Gửi Báo cáo Tiến độ
            </button>
            <button type="button" onClick={loadCertificate} style={{ padding: '8px 12px' }}>
              Xuất Biên bản Quyết toán
            </button>
          </div>
        </div>
        <label>
          Tóm tắt kết quả thực hiện trong tuần (Tối thiểu 15 ký tự)
          <input
            type="text"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            style={{ width: '100%', padding: 6 }}
          />
        </label>
      </form>

      {certificate && (
        <div style={{ border: '1px solid #94a3b8', borderRadius: 6, padding: 14, background: '#fff' }}>
          <h4>
            Biên bản Quyết toán #{certificate.certificateCode} — [{certificate.projectCode}]{' '}
            {certificate.projectTitle} ({certificate.projectStatus})
          </h4>
          <p style={{ margin: '4px 0', fontSize: 14 }}>
            Tổng nạp Ký quỹ:{' '}
            <strong>
              {certificate.financialTotals.totalEscrowDepositedVnd.toLocaleString('vi-VN')} VNĐ
            </strong>{' '}
            | Đã giải ngân 70/20/10:{' '}
            <strong>
              {certificate.financialTotals.totalDisbursedVnd.toLocaleString('vi-VN')} VNĐ
            </strong>{' '}
            | Đã hoàn trả DN:{' '}
            <strong>
              {certificate.financialTotals.totalRefundedVnd.toLocaleString('vi-VN')} VNĐ
            </strong>{' '}
            | Số dư còn giữ:{' '}
            <strong>
              {certificate.financialTotals.escrowRemainingBalanceVnd.toLocaleString('vi-VN')} VNĐ
            </strong>
          </p>
          <p style={{ margin: '4px 0', fontSize: 14 }}>
            Sao kê Thù lao: 70% Nhóm SV ={' '}
            <strong>
              {certificate.revenueSplitSummary.teamLeader70Vnd.toLocaleString('vi-VN')} VNĐ
            </strong>{' '}
            | 20% Mentor ={' '}
            <strong>
              {certificate.revenueSplitSummary.mentor20Vnd.toLocaleString('vi-VN')} VNĐ
            </strong>{' '}
            | 10% Quỹ Lab ={' '}
            <strong>
              {certificate.revenueSplitSummary.labFund10Vnd.toLocaleString('vi-VN')} VNĐ
            </strong>{' '}
            (Phần dư cộng vào Lab: {certificate.revenueSplitSummary.remainderAbsorbedByLabVnd} VNĐ)
          </p>
          <p style={{ margin: '4px 0', fontSize: 14 }}>
            Tiến độ: {certificate.progressOverview.latestCompletionPercentage}% (
            {certificate.progressOverview.latestHealthStatus}) — Trạng thái tất toán:{' '}
            <strong>{certificate.isFullySettled ? 'ĐÃ TẤT TOÁN 100%' : 'ĐANG VẬN HÀNH'}</strong>
          </p>
        </div>
      )}
    </section>
  );
};