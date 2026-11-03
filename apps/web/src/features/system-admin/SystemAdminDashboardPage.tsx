import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../core/auth/AuthContext';

interface GateSummaryResponse {
  gateCode: string;
  health: {
    status: string;
    service: string;
    sprintGate: string;
    paymentMode: string;
    uptimeSeconds: number;
    timestamp: string;
  };
  enterprises: {
    total: number;
    verified: number;
    pendingVerification: number;
    rejected: number;
  };
  projects: {
    total: number;
    draft: number;
    submitted: number;
    changesRequested: number;
    approved: number;
    published: number;
    unpublished: number;
    recruitmentClosed: number;
    rejected: number;
  };
  paymentsSandbox: {
    totalOrders: number;
    paidOrders: number;
    pendingOrders: number;
    totalPaidAmountVnd: number;
  };
  securityAudit: {
    totalAuthAuditEvents: number;
  };
}

interface AuditLogItem {
  id: string;
  actorId: string;
  actorRole: string;
  action: string;
  entityType: string;
  createdAt: string;
}

export const SystemAdminDashboardPage: React.FC = () => {
  const { user, accessToken, logout } = useAuth();
  const [summary, setSummary] = useState<GateSummaryResponse | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadDashboard = async () => {
    if (!accessToken) return;
    setErrorMsg(null);

    try {
      const [sumRes, logRes] = await Promise.all([
        fetch('http://localhost:3000/api/v1/system-admin/mvp-gate-summary', {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
        fetch('http://localhost:3000/api/v1/system-admin/audit-logs', {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
      ]);

      if (!sumRes.ok) {
        throw new Error('Không thể tải dữ liệu tổng hợp MVP Gate D10.');
      }

      setSummary(await sumRes.json());
      if (logRes.ok) {
        setAuditLogs(await logRes.json());
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi kết nối máy chủ API.');
    }
  };

  useEffect(() => {
    loadDashboard();
  }, [accessToken]);

  return (
    <div style={{ maxWidth: 1024, margin: '32px auto', padding: 24 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 20,
        }}
      >
        <div>
          <h1 style={{ margin: 0 }}>
            System Admin & Cổng Nghiệm thu MVP Gate D10 (Sprint 1)
          </h1>
          <p style={{ margin: '4px 0 0', color: '#475569' }}>
            Giám sát Health Check, Vòng đời Dự án Doanh nghiệp, PayOS Sandbox &
            Audit Logs
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <Link to="/lab-admin" style={{ padding: '6px 12px' }}>
            Hàng đợi Lab Admin
          </Link>
          <Link to="/finance/payos-spike" style={{ padding: '6px 12px' }}>
            PayOS Sandbox Spike
          </Link>
          <button onClick={loadDashboard} style={{ padding: '6px 12px' }}>
            Làm mới
          </button>
          <button onClick={logout} style={{ padding: '6px 12px' }}>
            Đăng xuất ({user?.email})
          </button>
        </div>
      </div>

      {errorMsg && (
        <div
          style={{
            padding: 12,
            background: '#fee2e2',
            color: '#991b1b',
            borderRadius: 6,
            marginBottom: 16,
          }}
        >
          {errorMsg}
        </div>
      )}

      {summary && (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 16,
              marginBottom: 24,
            }}
          >
            <div
              style={{
                border: '1px solid #cbd5e1',
                borderRadius: 8,
                padding: 16,
                background: '#f8fafc',
              }}
            >
              <h3 style={{ marginTop: 0 }}>1. Trạng thái Hạ tầng</h3>
              <p>
                Health: <strong>{summary.health.status}</strong>
              </p>
              <p>
                Chế độ PayOS: <strong>{summary.health.paymentMode}</strong>
              </p>
              <p>
                Uptime: <strong>{summary.health.uptimeSeconds}s</strong>
              </p>
            </div>

            <div
              style={{
                border: '1px solid #cbd5e1',
                borderRadius: 8,
                padding: 16,
                background: '#f8fafc',
              }}
            >
              <h3 style={{ marginTop: 0 }}>2. Pháp nhân Doanh nghiệp</h3>
              <p>
                Tổng số DN: <strong>{summary.enterprises.total}</strong>
              </p>
              <p>
                Đã xác thực (VERIFIED):{' '}
                <strong>{summary.enterprises.verified}</strong>
              </p>
              <p>
                Chờ duyệt:{' '}
                <strong>{summary.enterprises.pendingVerification}</strong>
              </p>
            </div>

            <div
              style={{
                border: '1px solid #cbd5e1',
                borderRadius: 8,
                padding: 16,
                background: '#f8fafc',
              }}
            >
              <h3 style={{ marginTop: 0 }}>3. Vòng đời Dự án (A & B)</h3>
              <p>
                Tổng số đề xuất/dự án: <strong>{summary.projects.total}</strong>
              </p>
              <p>
                Đang công bố (PUBLISHED):{' '}
                <strong>{summary.projects.published}</strong>
              </p>
              <p>
                Đã duyệt / Đóng đơn:{' '}
                <strong>
                  {summary.projects.approved} /{' '}
                  {summary.projects.recruitmentClosed}
                </strong>
              </p>
            </div>

            <div
              style={{
                border: '1px solid #cbd5e1',
                borderRadius: 8,
                padding: 16,
                background: '#f8fafc',
              }}
            >
              <h3 style={{ marginTop: 0 }}>4. Thanh toán PayOS Sandbox</h3>
              <p>
                Đơn PAID / Tổng đơn:{' '}
                <strong>
                  {summary.paymentsSandbox.paidOrders} /{' '}
                  {summary.paymentsSandbox.totalOrders}
                </strong>
              </p>
              <p>
                Tổng tiền đã đối soát:{' '}
                <strong>
                  {summary.paymentsSandbox.totalPaidAmountVnd.toLocaleString(
                    'vi-VN',
                  )}{' '}
                  VNĐ
                </strong>
              </p>
            </div>
          </div>

          <h3>
            Nhật ký Bảo mật & Xác thực Hệ thống ({auditLogs.length} sự kiện)
          </h3>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              border: '1px solid #e2e8f0',
            }}
          >
            <thead>
              <tr style={{ background: '#f1f5f9', textAlign: 'left' }}>
                <th style={{ padding: 10, borderBottom: '1px solid #cbd5e1' }}>
                  Mã Sự kiện
                </th>
                <th style={{ padding: 10, borderBottom: '1px solid #cbd5e1' }}>
                  Vai trò (Role)
                </th>
                <th style={{ padding: 10, borderBottom: '1px solid #cbd5e1' }}>
                  Hành động
                </th>
                <th style={{ padding: 10, borderBottom: '1px solid #cbd5e1' }}>
                  Thời gian
                </th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.slice(-10).map((log) => (
                <tr key={log.id}>
                  <td style={{ padding: 10, borderBottom: '1px solid #e2e8f0' }}>
                    {log.id}
                  </td>
                  <td style={{ padding: 10, borderBottom: '1px solid #e2e8f0' }}>
                    <strong>{log.actorRole}</strong>
                  </td>
                  <td style={{ padding: 10, borderBottom: '1px solid #e2e8f0' }}>
                    {log.action}
                  </td>
                  <td style={{ padding: 10, borderBottom: '1px solid #e2e8f0' }}>
                    {new Date(log.createdAt).toLocaleString('vi-VN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
};