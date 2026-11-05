import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../core/auth/AuthContext';

interface PayosOrderItem {
  id: string;
  orderCode: number;
  projectId: string;
  milestoneName: string;
  amount: number;
  paymentMode: string;
  status: 'PENDING_PAYMENT' | 'PAID' | 'FAILED' | 'CANCELLED';
  checkoutUrl: string;
  qrCode: string;
  signature: string;
  paidAt?: string | null;
}

interface MilestoneItem {
  id: string;
  projectId: string;
  title: string;
  description: string;
  amount: number;
  orderCode: number;
  status:
    | 'PLANNED'
    | 'ESCROW_PAID'
    | 'SUBMITTED'
    | 'ACCEPTED'
    | 'DISBURSED'
    | 'REFUNDED';
  deliverableUrl?: string | null;
  deliverableNote?: string | null;
  revisionCount?: number;
  lastRevisionNote?: string | null;
  refundReason?: string | null;
}

interface LedgerEntryItem {
  id: string;
  entryType: string;
  direction: 'CREDIT' | 'DEBIT';
  amount: number;
  beneficiaryRole: string;
  description: string;
  createdAt: string;
}

interface ProjectLedgerResponse {
  projectId: string;
  projectCode: string;
  projectStatus: string;
  escrowSummary: {
    totalEscrowDeposited: number;
    totalDisbursed: number;
    escrowBalance: number;
    currency: string;
  };
  milestones: MilestoneItem[];
  ledgerEntries: LedgerEntryItem[];
}

interface GlobalReconciliationSummary {
  totalMilestones: number;
  milestonesByStatus: {
    planned: number;
    escrowPaid: number;
    submitted: number;
    disbursed: number;
    refunded: number;
  };
  ledgerTotals: {
    totalEscrowDeposited: number;
    totalDisbursed702010: number;
    totalTeam70: number;
    totalMentor20: number;
    totalLab10: number;
    totalRemainderAbsorbedByLab: number;
    totalRefundedToEnterprise: number;
    totalEscrowHeldBalance: number;
    currency: string;
  };
  invariantHold: boolean;
}

export const PayosSandboxSpikePage: React.FC = () => {
  const { user, accessToken, logout } = useAuth();
  const [orders, setOrders] = useState<PayosOrderItem[]>([]);
  const [projectId, setProjectId] = useState('proj-1');
  const [milestoneName, setMilestoneName] = useState('Đợt 1 - Khởi động dự án');
  const [amount, setAmount] = useState(20000000);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // State của Ngày D12 (Cột mốc Ký quỹ & Sổ cái 70/20/10)
  const [milestoneDesc, setMilestoneDesc] = useState(
    'Hoàn thành bàn giao gói sản phẩm và tài liệu nghiệm thu cột mốc.',
  );
  const [deliverableUrl, setDeliverableUrl] = useState(
    'https://github.com/thong-hdhs/labodc-system/releases/tag/v1.0',
  );
  const [deliverableNote, setDeliverableNote] = useState(
    'Đã hoàn tất mã nguồn, tài liệu hướng dẫn và bộ kiểm thử E2E.',
  );
  const [ledgerData, setLedgerData] = useState<ProjectLedgerResponse | null>(
    null,
  );

  // State mở rộng cho Ngày D13 (Yêu cầu sửa lại bàn giao, Hoàn trả ký quỹ & Đối soát toàn cục)
  const [revisionOrRefundNote, setRevisionOrRefundNote] = useState(
    'Bổ sung tài liệu hướng dẫn cài đặt hoặc hoàn trả ký quỹ do điều chỉnh kế hoạch.',
  );
  const [reconciliationSummary, setReconciliationSummary] =
    useState<GlobalReconciliationSummary | null>(null);

  const loadOrders = async () => {
    if (!accessToken) return;
    const res = await fetch('http://localhost:3000/api/v1/payments/orders', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (res.ok) {
      setOrders(await res.json());
    }
  };

  const loadProjectLedger = async (targetProjectId = projectId) => {
    if (!accessToken || !targetProjectId) return;
    const res = await fetch(
      `http://localhost:3000/api/v1/payments/projects/${targetProjectId}/ledger`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );
    if (res.ok) {
      setLedgerData(await res.json());
    }
  };

  const loadGlobalReconciliation = async () => {
    if (!accessToken) return;
    const res = await fetch(
      'http://localhost:3000/api/v1/payments/reconciliation/summary',
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );
    if (res.ok) {
      setReconciliationSummary(await res.json());
    }
  };

  useEffect(() => {
    loadOrders();
    loadProjectLedger();
    loadGlobalReconciliation();
  }, [accessToken]);

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);
    setErrorMsg(null);

    const res = await fetch('http://localhost:3000/api/v1/payments/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        projectId,
        milestoneName,
        amount: Number(amount),
      }),
    });

    const body = await res.json();
    if (!res.ok) {
      setErrorMsg(body.message || 'Không thể tạo lệnh PayOS Sandbox.');
      return;
    }

    setStatusMsg(
      `Đã tạo lệnh PayOS Sandbox #${body.orderCode} (Chế độ: ${body.paymentMode})!`,
    );
    await loadOrders();
  };

  const handleSimulateWebhook = async (orderCode: number) => {
    setStatusMsg(null);
    setErrorMsg(null);

    const res = await fetch(
      `http://localhost:3000/api/v1/payments/orders/${orderCode}/simulate-signed-webhook`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ reference: 'FT26309888999' }),
      },
    );

    const body = await res.json();
    if (!res.ok) {
      setErrorMsg(body.message || 'Gửi Webhook thất bại.');
      return;
    }

    setStatusMsg(
      body.idempotentReplay
        ? `Webhook #${orderCode} đã được xử lý trước đó (Idempotent Replay = true, không cộng tiền trùng)!`
        : `Webhook HMAC-SHA256 hợp lệ: Đơn #${orderCode} đã chuyển sang trạng thái ${body.orderStatus}!`,
    );
    await loadOrders();
  };

  // Các hàm xử lý nghiệp vụ Ngày D12 (Cột mốc Ký quỹ & Chia doanh thu 70/20/10)
  const handleCreateMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);
    setErrorMsg(null);

    const res = await fetch('http://localhost:3000/api/v1/payments/milestones', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        projectId,
        title: milestoneName,
        description: milestoneDesc,
        amount: Number(amount),
      }),
    });

    const body = await res.json();
    if (!res.ok) {
      setErrorMsg(body.message || 'Không thể tạo cột mốc ký quỹ.');
      return;
    }

    setStatusMsg(`Đã khởi tạo cột mốc ký quỹ "${body.title}" (${body.id})!`);
    await loadProjectLedger(projectId);
    await loadGlobalReconciliation();
  };

  const handleConfirmEscrow = async (milestoneId: string) => {
    setStatusMsg(null);
    setErrorMsg(null);

    const res = await fetch(
      `http://localhost:3000/api/v1/payments/milestones/${milestoneId}/confirm-escrow`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          note: 'Xác nhận nạp tiền ký quỹ cột mốc vào Sổ cái.',
        }),
      },
    );

    const body = await res.json();
    if (!res.ok) {
      setErrorMsg(body.message || 'Xác nhận ký quỹ thất bại.');
      return;
    }

    setStatusMsg(
      `Đã xác nhận ký quỹ cột mốc ${milestoneId} (ESCROW_PAID) — Trạng thái dự án: ${body.projectStatus}!`,
    );
    await loadProjectLedger(projectId);
    await loadGlobalReconciliation();
  };

  const handleSubmitDeliverable = async (milestoneId: string) => {
    setStatusMsg(null);
    setErrorMsg(null);

    const res = await fetch(
      `http://localhost:3000/api/v1/payments/milestones/${milestoneId}/submit-deliverable`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          deliverableUrl,
          deliverableNote,
        }),
      },
    );

    const body = await res.json();
    if (!res.ok) {
      setErrorMsg(body.message || 'Nộp sản phẩm bàn giao thất bại.');
      return;
    }

    setStatusMsg(`Đã nộp bàn giao cho cột mốc ${milestoneId} (SUBMITTED)!`);
    await loadProjectLedger(projectId);
    await loadGlobalReconciliation();
  };

  const handleAcceptAndSplit = async (
    milestoneId: string,
    markProjectCompleted: boolean,
  ) => {
    setStatusMsg(null);
    setErrorMsg(null);

    const res = await fetch(
      `http://localhost:3000/api/v1/payments/milestones/${milestoneId}/accept-and-split`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          reviewNote: 'Nghiệm thu đạt yêu cầu và giải ngân tự động 70/20/10.',
          markProjectCompleted,
        }),
      },
    );

    const body = await res.json();
    if (!res.ok) {
      setErrorMsg(body.message || 'Nghiệm thu và giải ngân thất bại.');
      return;
    }

    setStatusMsg(
      `Đã nghiệm thu & chia doanh thu 70/20/10 cho cột mốc ${milestoneId} (70% SV: ${body.splitBreakdown.teamAmount70.toLocaleString('vi-VN')} VNĐ | 20% Mentor: ${body.splitBreakdown.mentorAmount20.toLocaleString('vi-VN')} VNĐ | 10% Lab: ${body.splitBreakdown.labAmount10.toLocaleString('vi-VN')} VNĐ) — Dự án: ${body.projectStatus}!`,
    );
    await loadProjectLedger(projectId);
    await loadGlobalReconciliation();
  };

  // Các hàm xử lý nghiệp vụ Ngày D13 (Đồng bộ Webhook vào Sổ cái, Yêu cầu sửa bàn giao & Hoàn trả ký quỹ)
  const handleSyncPayosWebhookToMilestone = async (milestoneId: string) => {
    setStatusMsg(null);
    setErrorMsg(null);

    const res = await fetch(
      `http://localhost:3000/api/v1/payments/milestones/${milestoneId}/sync-payos-webhook`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ reference: 'FT-WEBHOOK-D13' }),
      },
    );

    const body = await res.json();
    if (!res.ok) {
      setErrorMsg(body.message || 'Đồng bộ PayOS Webhook thất bại.');
      return;
    }

    setStatusMsg(
      body.idempotentReplay
        ? `Đối soát PayOS Webhook cho cột mốc ${milestoneId}: Idempotent Replay = true (Không cộng tiền trùng vào Sổ cái)!`
        : `Đã đối soát tự động PayOS Webhook HMAC cho cột mốc ${milestoneId} -> ESCROW_PAID!`,
    );
    await loadProjectLedger(projectId);
    await loadGlobalReconciliation();
  };

  const handleRequestRevision = async (milestoneId: string) => {
    setStatusMsg(null);
    setErrorMsg(null);

    const res = await fetch(
      `http://localhost:3000/api/v1/payments/milestones/${milestoneId}/request-revision`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ revisionNote: revisionOrRefundNote }),
      },
    );

    const body = await res.json();
    if (!res.ok) {
      setErrorMsg(body.message || 'Yêu cầu chỉnh sửa bàn giao thất bại.');
      return;
    }

    setStatusMsg(
      `Đã yêu cầu sửa lại bàn giao cột mốc ${milestoneId} (Lần ${body.revisionCount}) — Trạng thái quay về ESCROW_PAID để nộp lại!`,
    );
    await loadProjectLedger(projectId);
    await loadGlobalReconciliation();
  };

  const handleRefundEscrow = async (milestoneId: string) => {
    setStatusMsg(null);
    setErrorMsg(null);

    const res = await fetch(
      `http://localhost:3000/api/v1/payments/milestones/${milestoneId}/refund-escrow`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ refundReason: revisionOrRefundNote }),
      },
    );

    const body = await res.json();
    if (!res.ok) {
      setErrorMsg(body.message || 'Hoàn trả ký quỹ thất bại.');
      return;
    }

    setStatusMsg(
      `Đã hoàn trả 100% ký quỹ cột mốc ${milestoneId} (REFUNDED) — Số dư ký quỹ còn lại: ${body.escrowBalanceAfterRefund.toLocaleString('vi-VN')} VNĐ!`,
    );
    await loadProjectLedger(projectId);
    await loadGlobalReconciliation();
  };

  return (
    <div style={{ maxWidth: 920, margin: '32px auto', padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>PayOS Sandbox & Webhook HMAC Spike (Ngày D9 — REQ-FIN-01/02)</h1>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link to="/lab-admin" style={{ padding: '6px 12px' }}>
            Lab Admin
          </Link>
          <Link to="/enterprise/proposals" style={{ padding: '6px 12px' }}>
            Đề xuất DN
          </Link>
          <button onClick={logout} style={{ padding: '6px 12px' }}>
            Đăng xuất ({user?.email})
          </button>
        </div>
      </div>

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
        onSubmit={handleCreateOrder}
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 2fr 1fr auto',
          gap: 12,
          alignItems: 'end',
          padding: 16,
          border: '1px solid #cbd5e1',
          borderRadius: 8,
          marginBottom: 24,
        }}
      >
        <label>
          Mã Dự án (Project ID)
          <input
            type="text"
            required
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            style={{ width: '100%', padding: 8, marginTop: 4 }}
          />
        </label>
        <label>
          Đợt thanh toán (Milestone)
          <input
            type="text"
            required
            value={milestoneName}
            onChange={(e) => setMilestoneName(e.target.value)}
            style={{ width: '100%', padding: 8, marginTop: 4 }}
          />
        </label>
        <label>
          Số tiền (VNĐ)
          <input
            type="number"
            min={10000}
            step={500000}
            required
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            style={{ width: '100%', padding: 8, marginTop: 4 }}
          />
        </label>
        <button type="submit" style={{ padding: '10px 16px', fontWeight: 600 }}>
          Tạo Lệnh PayOS Sandbox
        </button>
      </form>

      <h3>Danh sách Đơn hàng PayOS Sandbox ({orders.length})</h3>
      {orders.map((ord) => (
        <div
          key={ord.id}
          style={{
            border: '1px solid #e2e8f0',
            borderRadius: 8,
            padding: 16,
            marginBottom: 12,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <strong>
              Order #{ord.orderCode} — Dự án: {ord.projectId} ({ord.milestoneName})
            </strong>
            <span>
              Chế độ: <strong>{ord.paymentMode}</strong> | Trạng thái:{' '}
              <strong>{ord.status}</strong>
            </span>
          </div>
          <p style={{ margin: '6px 0', fontSize: 14 }}>
            Số tiền: <strong>{ord.amount.toLocaleString('vi-VN')} VNĐ</strong> | Checkout URL:{' '}
            <a href={ord.checkoutUrl} target="_blank" rel="noreferrer">
              {ord.checkoutUrl}
            </a>
          </p>
          <p style={{ margin: '4px 0', fontSize: 12, color: '#475569' }}>
            HMAC-SHA256 Signature: {ord.signature}
          </p>
          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button
              onClick={() => handleSimulateWebhook(ord.orderCode)}
              style={{ padding: '6px 12px', fontWeight: 600 }}
            >
              Mô phỏng PayOS bắn Webhook HMAC (Test PAID & Idempotency)
            </button>
          </div>
        </div>
      ))}

      <hr style={{ margin: '32px 0', borderColor: '#cbd5e1' }} />

      <h2>
        Quản lý Cột mốc Ký quỹ, Nghiệm thu & Sổ cái Phân bổ 70/20/10 (Ngày D12 & D13 — REQ-FIN-01/02/03)
      </h2>

      <form
        onSubmit={handleCreateMilestone}
        style={{
          display: 'grid',
          gap: 12,
          padding: 16,
          border: '1px solid #cbd5e1',
          borderRadius: 8,
          marginBottom: 20,
          background: '#f8fafc',
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr auto', gap: 12 }}>
          <label>
            Mô tả tiêu chí nghiệm thu cột mốc
            <input
              type="text"
              required
              value={milestoneDesc}
              onChange={(e) => setMilestoneDesc(e.target.value)}
              style={{ width: '100%', padding: 8, marginTop: 4 }}
            />
          </label>
          <label>
            URL gói bàn giao (dùng khi nộp Deliverable)
            <input
              type="text"
              value={deliverableUrl}
              onChange={(e) => setDeliverableUrl(e.target.value)}
              style={{ width: '100%', padding: 8, marginTop: 4 }}
            />
          </label>
          <div style={{ display: 'flex', gap: 8, alignItems: 'end' }}>
            <button type="submit" style={{ padding: '10px 14px', fontWeight: 600 }}>
              Tạo Cột mốc Ký quỹ (D12)
            </button>
            <button
              type="button"
              onClick={() => {
                loadProjectLedger(projectId);
                loadGlobalReconciliation();
              }}
              style={{ padding: '10px 14px' }}
            >
              Tải Sổ cái Dự án
            </button>
          </div>
        </div>
        <label>
          Ghi chú bàn giao sản phẩm (Deliverable Note)
          <input
            type="text"
            value={deliverableNote}
            onChange={(e) => setDeliverableNote(e.target.value)}
            style={{ width: '100%', padding: 8, marginTop: 4 }}
          />
        </label>
        <label>
          Ghi chú Yêu cầu sửa lại bàn giao / Lý do Hoàn trả ký quỹ (D13 - Tối thiểu 10 ký tự)
          <input
            type="text"
            value={revisionOrRefundNote}
            onChange={(e) => setRevisionOrRefundNote(e.target.value)}
            style={{ width: '100%', padding: 8, marginTop: 4 }}
          />
        </label>
      </form>

      {ledgerData && (
        <div style={{ border: '1px solid #cbd5e1', borderRadius: 8, padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <strong>
              Dự án: [{ledgerData.projectCode}] ({ledgerData.projectId}) — Trạng thái:{' '}
              {ledgerData.projectStatus}
            </strong>
            <span>
              Đã ký quỹ:{' '}
              <strong>
                {ledgerData.escrowSummary.totalEscrowDeposited.toLocaleString('vi-VN')} VNĐ
              </strong>{' '}
              | Đã giải ngân/hoàn trả:{' '}
              <strong>
                {ledgerData.escrowSummary.totalDisbursed.toLocaleString('vi-VN')} VNĐ
              </strong>{' '}
              | Số dư Ký quỹ:{' '}
              <strong>
                {ledgerData.escrowSummary.escrowBalance.toLocaleString('vi-VN')} VNĐ
              </strong>
            </span>
          </div>

          <h4>Danh sách Cột mốc Nghiệm thu ({ledgerData.milestones.length})</h4>
          {ledgerData.milestones.map((ms) => (
            <div
              key={ms.id}
              style={{
                border: '1px solid #e2e8f0',
                borderRadius: 6,
                padding: 12,
                marginBottom: 10,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <strong>
                  [{ms.id}] {ms.title} — {ms.amount.toLocaleString('vi-VN')} VNĐ
                </strong>
                <span>
                  Trạng thái cột mốc: <strong>{ms.status}</strong>
                  {ms.revisionCount ? ` (Đã sửa ${ms.revisionCount} lần)` : ''}
                </span>
              </div>
              <p style={{ margin: '4px 0', fontSize: 14 }}>{ms.description}</p>
              {ms.deliverableUrl && (
                <p style={{ margin: '4px 0', fontSize: 13, color: '#0369a1' }}>
                  Bàn giao: {ms.deliverableUrl} ({ms.deliverableNote})
                </p>
              )}
              {ms.lastRevisionNote && (
                <p style={{ margin: '4px 0', fontSize: 13, color: '#b45309' }}>
                  Yêu cầu chỉnh sửa gần nhất: {ms.lastRevisionNote}
                </p>
              )}
              {ms.refundReason && (
                <p style={{ margin: '4px 0', fontSize: 13, color: '#991b1b' }}>
                  Lý do hoàn trả ký quỹ: {ms.refundReason}
                </p>
              )}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                {ms.status === 'PLANNED' && (
                  <>
                    <button
                      onClick={() => handleConfirmEscrow(ms.id)}
                      style={{ padding: '6px 12px', fontWeight: 600 }}
                    >
                      1a. Xác nhận Ký quỹ & Kích hoạt IN_PROGRESS
                    </button>
                    <button
                      onClick={() => handleSyncPayosWebhookToMilestone(ms.id)}
                      style={{ padding: '6px 12px' }}
                    >
                      1b. Đồng bộ tự động từ PayOS Webhook (D13)
                    </button>
                  </>
                )}
                {ms.status === 'ESCROW_PAID' && (
                  <>
                    <button
                      onClick={() => handleSubmitDeliverable(ms.id)}
                      style={{ padding: '6px 12px', fontWeight: 600 }}
                    >
                      2. Nộp Bàn giao Cột mốc (SUBMITTED)
                    </button>
                    <button
                      onClick={() => handleRefundEscrow(ms.id)}
                      style={{ padding: '6px 12px', color: '#991b1b' }}
                    >
                      Hoàn trả Ký quỹ (ESCROW_REFUND - D13)
                    </button>
                  </>
                )}
                {ms.status === 'SUBMITTED' && (
                  <>
                    <button
                      onClick={() => handleAcceptAndSplit(ms.id, false)}
                      style={{ padding: '6px 12px', fontWeight: 600 }}
                    >
                      3a. Nghiệm thu & Chia 70/20/10
                    </button>
                    <button
                      onClick={() => handleAcceptAndSplit(ms.id, true)}
                      style={{ padding: '6px 12px', fontWeight: 600 }}
                    >
                      3b. Nghiệm thu, Chia 70/20/10 & Đóng dự án (COMPLETED)
                    </button>
                    <button
                      onClick={() => handleRequestRevision(ms.id)}
                      style={{ padding: '6px 12px' }}
                    >
                      3c. Yêu cầu Sửa lại Bàn giao (D13)
                    </button>
                    <button
                      onClick={() => handleRefundEscrow(ms.id)}
                      style={{ padding: '6px 12px', color: '#991b1b' }}
                    >
                      3d. Hoàn trả Ký quỹ (D13)
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}

          <h4>Sổ cái Tài chính Bất biến ({ledgerData.ledgerEntries.length} bút toán)</h4>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ background: '#f1f5f9', textAlign: 'left' }}>
                <th style={{ padding: 8, border: '1px solid #cbd5e1' }}>Mã Bút toán</th>
                <th style={{ padding: 8, border: '1px solid #cbd5e1' }}>Loại</th>
                <th style={{ padding: 8, border: '1px solid #cbd5e1' }}>Chiều</th>
                <th style={{ padding: 8, border: '1px solid #cbd5e1' }}>Thụ hưởng</th>
                <th style={{ padding: 8, border: '1px solid #cbd5e1' }}>Số tiền (VNĐ)</th>
                <th style={{ padding: 8, border: '1px solid #cbd5e1' }}>Diễn giải</th>
              </tr>
            </thead>
            <tbody>
              {ledgerData.ledgerEntries.map((entry) => (
                <tr key={entry.id}>
                  <td style={{ padding: 8, border: '1px solid #cbd5e1' }}>{entry.id}</td>
                  <td style={{ padding: 8, border: '1px solid #cbd5e1' }}>{entry.entryType}</td>
                  <td style={{ padding: 8, border: '1px solid #cbd5e1' }}>{entry.direction}</td>
                  <td style={{ padding: 8, border: '1px solid #cbd5e1' }}>
                    {entry.beneficiaryRole}
                  </td>
                  <td style={{ padding: 8, border: '1px solid #cbd5e1', fontWeight: 600 }}>
                    {entry.amount.toLocaleString('vi-VN')}
                  </td>
                  <td style={{ padding: 8, border: '1px solid #cbd5e1' }}>{entry.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {reconciliationSummary && (
        <div
          style={{
            marginTop: 24,
            border: '1px solid #94a3b8',
            borderRadius: 8,
            padding: 16,
            background: '#f8fafc',
          }}
        >
          <h3>
            Báo cáo Đối soát Tổng hợp Sổ cái & Quỹ Lab Toàn Hệ thống (D13 — LAB_ADMIN / SYSTEM_ADMIN)
          </h3>
          <p style={{ margin: '6px 0', fontSize: 14 }}>
            Tổng cột mốc: <strong>{reconciliationSummary.totalMilestones}</strong> | Đã nạp ký quỹ:{' '}
            <strong>
              {reconciliationSummary.ledgerTotals.totalEscrowDeposited.toLocaleString('vi-VN')} VNĐ
            </strong>{' '}
            | Đã giải ngân 70/20/10:{' '}
            <strong>
              {reconciliationSummary.ledgerTotals.totalDisbursed702010.toLocaleString('vi-VN')} VNĐ
            </strong>{' '}
            | Đã hoàn trả DN:{' '}
            <strong>
              {reconciliationSummary.ledgerTotals.totalRefundedToEnterprise.toLocaleString('vi-VN')}{' '}
              VNĐ
            </strong>{' '}
            | Số dư Ký quỹ đang giữ:{' '}
            <strong>
              {reconciliationSummary.ledgerTotals.totalEscrowHeldBalance.toLocaleString('vi-VN')}{' '}
              VNĐ
            </strong>{' '}
            | Bất biến Sổ cái:{' '}
            <strong>{reconciliationSummary.invariantHold ? 'PASS (Cân bằng 100%)' : 'FAIL'}</strong>
          </p>
        </div>
      )}
    </div>
  );
};