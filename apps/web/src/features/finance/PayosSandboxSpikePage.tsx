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

export const PayosSandboxSpikePage: React.FC = () => {
  const { user, accessToken, logout } = useAuth();
  const [orders, setOrders] = useState<PayosOrderItem[]>([]);
  const [projectId, setProjectId] = useState('proj-1');
  const [milestoneName, setMilestoneName] = useState('Đợt 1 - Khởi động dự án');
  const [amount, setAmount] = useState(20000000);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadOrders = async () => {
    if (!accessToken) return;
    const res = await fetch('http://localhost:3000/api/v1/payments/orders', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (res.ok) {
      setOrders(await res.json());
    }
  };

  useEffect(() => {
    loadOrders();
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
    </div>
  );
};