import React, { useEffect, useState } from 'react';
import { UserRole, UserStatus } from '@labodc/shared-types';
import { useAuth } from '../../core/auth/AuthContext';

interface Sprint2ReadinessReport {
  checkpointCode: string;
  generatedAt: string;
  systemConfig: {
    paymentMode: string;
    revenueSplitPolicy: {
      teamPercentage: number;
      mentorPercentage: number;
      labFundPercentage: number;
      remainderPolicy: string;
      immutable: boolean;
    };
    projectLimits: {
      minDurationWeeks: number;
      maxDurationWeeks: number;
    };
    securityPolicy: {
      requireReasonNoteMinLength: number;
      webhookSignatureAlgorithm: string;
    };
  };
  projectLifecycleSummary: {
    totalProjects: number;
    inProgress: number;
    completed: number;
    cancelled: number;
  };
  escrowAndLedgerAudit: {
    totalMilestones: number;
    disbursedMilestones: number;
    refundedMilestones: number;
    totalEscrowDepositedVnd: number;
    totalDisbursed702010Vnd: number;
    totalRefundedVnd: number;
    escrowHeldBalanceVnd: number;
    ledgerInvariantHold: boolean;
  };
  governanceAuditCount: number;
}

export const SystemGovernancePanel: React.FC = () => {
  const { accessToken } = useAuth();
  const [report, setReport] = useState<Sprint2ReadinessReport | null>(null);
  const [minWeeks, setMinWeeks] = useState(4);
  const [maxWeeks, setMaxWeeks] = useState(24);
  const [configReason, setConfigReason] = useState(
    'Cập nhật khung thời lượng chuẩn cho dự án thực tập ODC Sprint 2.',
  );
  const [targetUserId, setTargetUserId] = useState('user-ent-demo-01');
  const [targetEmail, setTargetEmail] = useState('partner@enterprise.vn');
  const [targetStatus, setTargetStatus] = useState<UserStatus>(
    UserStatus.LOCKED,
  );
  const [accountReason, setAccountReason] = useState(
    'Tạm khóa tài khoản để rà soát hồ sơ pháp nhân định kỳ.',
  );
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadGovernanceReport = async () => {
    if (!accessToken) return;
    const res = await fetch(
      'http://localhost:3000/api/v1/system-admin/governance/sprint2-readiness',
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );
    if (res.ok) {
      const data: Sprint2ReadinessReport = await res.json();
      setReport(data);
      setMinWeeks(data.systemConfig.projectLimits.minDurationWeeks);
      setMaxWeeks(data.systemConfig.projectLimits.maxDurationWeeks);
    }
  };

  useEffect(() => {
    loadGovernanceReport();
  }, [accessToken]);

  const handleUpdateConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);
    setErrorMsg(null);

    const res = await fetch(
      'http://localhost:3000/api/v1/system-admin/governance/config',
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          minDurationWeeks: Number(minWeeks),
          maxDurationWeeks: Number(maxWeeks),
          reasonNote: configReason,
        }),
      },
    );

    const body = await res.json();
    if (!res.ok) {
      setErrorMsg(body.message || 'Cập nhật cấu hình hệ thống thất bại.');
      return;
    }

    setStatusMsg(
      `Đã cập nhật cấu hình thời lượng dự án (${body.projectLimits.minDurationWeeks}–${body.projectLimits.maxDurationWeeks} tuần)!`,
    );
    await loadGovernanceReport();
  };

  const handleUpdateAccountStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);
    setErrorMsg(null);

    const res = await fetch(
      `http://localhost:3000/api/v1/system-admin/governance/users/${targetUserId}/status`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          targetEmail,
          targetRole: UserRole.ENTERPRISE,
          newStatus: targetStatus,
          reasonNote: accountReason,
        }),
      },
    );

    const body = await res.json();
    if (!res.ok) {
      setErrorMsg(body.message || 'Cập nhật trạng thái tài khoản thất bại.');
      return;
    }

    setStatusMsg(
      `Đã chuyển trạng thái tài khoản ${body.email} sang ${body.status}!`,
    );
    await loadGovernanceReport();
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
        Quản trị Cấu hình Vận hành, Khóa/Mở Tài khoản & Kiểm toán Liên thông Sprint 2 (Ngày D14 — REQ-SYS-01)
      </h2>

      {statusMsg && (
        <div
          style={{
            padding: 10,
            background: '#dcfce7',
            color: '#166534',
            marginBottom: 12,
          }}
        >
          {statusMsg}
        </div>
      )}
      {errorMsg && (
        <div
          style={{
            padding: 10,
            background: '#fee2e2',
            color: '#991b1b',
            marginBottom: 12,
          }}
        >
          {errorMsg}
        </div>
      )}

      {report && (
        <div style={{ marginBottom: 16, fontSize: 14 }}>
          <p style={{ margin: '4px 0' }}>
            Chính sách Chia doanh thu Bất biến:{' '}
            <strong>
              {report.systemConfig.revenueSplitPolicy.teamPercentage}% SV /{' '}
              {report.systemConfig.revenueSplitPolicy.mentorPercentage}% Mentor /{' '}
              {report.systemConfig.revenueSplitPolicy.labFundPercentage}% Quỹ Lab
            </strong>{' '}
            ({report.systemConfig.revenueSplitPolicy.remainderPolicy})
          </p>
          <p style={{ margin: '4px 0' }}>
            Kiểm toán Sổ cái Sprint 2: Tổng nạp{' '}
            <strong>
              {report.escrowAndLedgerAudit.totalEscrowDepositedVnd.toLocaleString(
                'vi-VN',
              )}{' '}
              VNĐ
            </strong>{' '}
            | Đã giải ngân 70/20/10:{' '}
            <strong>
              {report.escrowAndLedgerAudit.totalDisbursed702010Vnd.toLocaleString(
                'vi-VN',
              )}{' '}
              VNĐ
            </strong>{' '}
            | Đã hoàn trả:{' '}
            <strong>
              {report.escrowAndLedgerAudit.totalRefundedVnd.toLocaleString(
                'vi-VN',
              )}{' '}
              VNĐ
            </strong>{' '}
            | Bất biến Sổ cái:{' '}
            <strong>
              {report.escrowAndLedgerAudit.ledgerInvariantHold ? 'PASS' : 'FAIL'}
            </strong>
          </p>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <form
          onSubmit={handleUpdateConfig}
          style={{
            border: '1px solid #e2e8f0',
            borderRadius: 6,
            padding: 12,
            background: '#fff',
          }}
        >
          <h4>1. Cập nhật Cấu hình Tham số Dự án</h4>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <label style={{ flex: 1 }}>
              Tuần tối thiểu
              <input
                type="number"
                value={minWeeks}
                onChange={(e) => setMinWeeks(Number(e.target.value))}
                style={{ width: '100%', padding: 6 }}
              />
            </label>
            <label style={{ flex: 1 }}>
              Tuần tối đa
              <input
                type="number"
                value={maxWeeks}
                onChange={(e) => setMaxWeeks(Number(e.target.value))}
                style={{ width: '100%', padding: 6 }}
              />
            </label>
          </div>
          <label style={{ display: 'block', marginBottom: 8 }}>
            Lý do cập nhật cấu hình (Tối thiểu 10 ký tự)
            <input
              type="text"
              value={configReason}
              onChange={(e) => setConfigReason(e.target.value)}
              style={{ width: '100%', padding: 6 }}
            />
          </label>
          <button type="submit" style={{ padding: '8px 12px', fontWeight: 600 }}>
            Lưu Cấu hình Hệ thống
          </button>
        </form>

        <form
          onSubmit={handleUpdateAccountStatus}
          style={{
            border: '1px solid #e2e8f0',
            borderRadius: 6,
            padding: 12,
            background: '#fff',
          }}
        >
          <h4>2. Khóa / Mở khóa Tài khoản Người dùng</h4>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <label style={{ flex: 1 }}>
              User ID
              <input
                type="text"
                value={targetUserId}
                onChange={(e) => setTargetUserId(e.target.value)}
                style={{ width: '100%', padding: 6 }}
              />
            </label>
            <label style={{ flex: 1 }}>
              Trạng thái mới
              <select
                value={targetStatus}
                onChange={(e) => setTargetStatus(e.target.value as UserStatus)}
                style={{ width: '100%', padding: 6 }}
              >
                <option value={UserStatus.LOCKED}>LOCKED (Khóa)</option>
                <option value={UserStatus.ACTIVE}>ACTIVE (Mở khóa)</option>
              </select>
            </label>
          </div>
          <label style={{ display: 'block', marginBottom: 8 }}>
            Email tài khoản & Lý do (Tối thiểu 10 ký tự)
            <input
              type="text"
              value={accountReason}
              onChange={(e) => setAccountReason(e.target.value)}
              style={{ width: '100%', padding: 6 }}
            />
          </label>
          <button type="submit" style={{ padding: '8px 12px', fontWeight: 600 }}>
            Cập nhật Trạng thái Tài khoản
          </button>
        </form>
      </div>
    </section>
  );
};