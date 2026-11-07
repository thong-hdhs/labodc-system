import React, { useState } from 'react';
import { useAuth } from '../../core/auth/AuthContext';

interface MemberAllocationItem {
  id: string;
  memberUserId: string;
  memberName: string;
  memberRole: 'TALENT_LEADER' | 'TALENT';
  contributionPercentage: number;
  allocatedAmount: number;
  remainderAbsorbed: number;
}

interface ReceiptData {
  receiptNumber: string;
  projectCode: string;
  projectTitle: string;
  milestoneTitle: string;
  companyName: string;
  grossAmountVnd: number;
  payoutExecutionStatus: string;
  teamMemberAllocations: MemberAllocationItem[];
}

export const TeamPayoutDistributionPanel: React.FC<{
  defaultMilestoneId?: string;
}> = ({ defaultMilestoneId = 'ms-0001' }) => {
  const { accessToken } = useAuth();
  const [milestoneId, setMilestoneId] = useState(defaultMilestoneId);
  const [leaderPct, setLeaderPct] = useState(40);
  const [member2Pct, setMember2Pct] = useState(35);
  const [member3Pct, setMember3Pct] = useState(25);
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadReceipt = async (targetMsId = milestoneId) => {
    if (!accessToken || !targetMsId) return;
    const res = await fetch(
      `http://localhost:3000/api/v1/payments/milestones/${targetMsId}/financial-receipt`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );
    const body = await res.json();
    if (!res.ok) {
      setErrorMsg(body.message || 'Không thể tải biên lai quyết toán cột mốc.');
      return;
    }
    setReceipt(body);
  };

  const handleDistributePool = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);
    setErrorMsg(null);

    const res = await fetch(
      `http://localhost:3000/api/v1/payments/milestones/${milestoneId}/distribute-team-pool`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          members: [
            {
              memberUserId: 'talent-leader-01',
              memberName: 'Nguyễn Nhóm Trưởng',
              memberRole: 'TALENT_LEADER',
              contributionPercentage: Number(leaderPct),
            },
            {
              memberUserId: 'talent-member-02',
              memberName: 'Trần Thành Viên Backend',
              memberRole: 'TALENT',
              contributionPercentage: Number(member2Pct),
            },
            {
              memberUserId: 'talent-member-03',
              memberName: 'Lê Thành Viên Frontend',
              memberRole: 'TALENT',
              contributionPercentage: Number(member3Pct),
            },
          ],
        }),
      },
    );

    const body = await res.json();
    if (!res.ok) {
      setErrorMsg(body.message || 'Phân bổ quỹ 70% thất bại.');
      return;
    }

    setStatusMsg(
      `Đã phân bổ quỹ 70% (${body.teamPool70AmountVnd.toLocaleString('vi-VN')} VNĐ) cho 3 thành viên — Bất biến: ${body.invariantHold ? 'PASS' : 'FAIL'}!`,
    );
    await loadReceipt(milestoneId);
  };

  const handleExecutePayouts = async () => {
    setStatusMsg(null);
    setErrorMsg(null);

    const res = await fetch(
      `http://localhost:3000/api/v1/payments/milestones/${milestoneId}/execute-payouts`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          bankTransferRefPrefix: `BNK-D17-${milestoneId.toUpperCase()}`,
        }),
      },
    );

    const body = await res.json();
    if (!res.ok) {
      setErrorMsg(body.message || 'Thực thi lệnh chi trả ngân hàng thất bại.');
      return;
    }

    setStatusMsg(
      `Đã thực thi 3 lệnh chi trả ngân hàng (Tổng: ${body.totalPaidOutVnd.toLocaleString('vi-VN')} VNĐ)!`,
    );
    await loadReceipt(milestoneId);
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
        Phân bổ Quỹ 70% Theo Đóng góp Thành viên, Chi trả Ngân hàng & Biên lai Doanh nghiệp (Ngày D17 — REQ-FIN-03)
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
        onSubmit={handleDistributePool}
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr 1fr auto',
          gap: 10,
          alignItems: 'end',
          marginBottom: 16,
        }}
      >
        <label>
          Mã Cột mốc (Milestone ID)
          <input
            type="text"
            value={milestoneId}
            onChange={(e) => setMilestoneId(e.target.value)}
            style={{ width: '100%', padding: 6 }}
          />
        </label>
        <label>
          % Nhóm trưởng (Leader)
          <input
            type="number"
            value={leaderPct}
            onChange={(e) => setLeaderPct(Number(e.target.value))}
            style={{ width: '100%', padding: 6 }}
          />
        </label>
        <label>
          % Thành viên 2
          <input
            type="number"
            value={member2Pct}
            onChange={(e) => setMember2Pct(Number(e.target.value))}
            style={{ width: '100%', padding: 6 }}
          />
        </label>
        <label>
          % Thành viên 3
          <input
            type="number"
            value={member3Pct}
            onChange={(e) => setMember3Pct(Number(e.target.value))}
            style={{ width: '100%', padding: 6 }}
          />
        </label>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="submit" style={{ padding: '8px 12px', fontWeight: 600 }}>
            Chia Quỹ 70% Nhóm
          </button>
          <button type="button" onClick={handleExecutePayouts} style={{ padding: '8px 12px' }}>
            Chi trả Ngân hàng
          </button>
        </div>
      </form>

      {receipt && (
        <div style={{ border: '1px solid #94a3b8', borderRadius: 6, padding: 14, background: '#fff' }}>
          <h4>
            Biên lai Tài chính #{receipt.receiptNumber} — {receipt.companyName} ({receipt.payoutExecutionStatus})
          </h4>
          <p style={{ margin: '4px 0', fontSize: 14 }}>
            Dự án: [{receipt.projectCode}] {receipt.projectTitle} — Cột mốc: {receipt.milestoneTitle}{' '}
            ({receipt.grossAmountVnd.toLocaleString('vi-VN')} VNĐ)
          </p>
          {receipt.teamMemberAllocations.length > 0 && (
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 8, fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f1f5f9', textAlign: 'left' }}>
                  <th style={{ padding: 6, border: '1px solid #cbd5e1' }}>Thành viên</th>
                  <th style={{ padding: 6, border: '1px solid #cbd5e1' }}>Vai trò</th>
                  <th style={{ padding: 6, border: '1px solid #cbd5e1' }}>% Đóng góp</th>
                  <th style={{ padding: 6, border: '1px solid #cbd5e1' }}>Thù lao nhận (VNĐ)</th>
                  <th style={{ padding: 6, border: '1px solid #cbd5e1' }}>Phần dư cộng vào Leader</th>
                </tr>
              </thead>
              <tbody>
                {receipt.teamMemberAllocations.map((alloc) => (
                  <tr key={alloc.id}>
                    <td style={{ padding: 6, border: '1px solid #cbd5e1' }}>{alloc.memberName}</td>
                    <td style={{ padding: 6, border: '1px solid #cbd5e1' }}>{alloc.memberRole}</td>
                    <td style={{ padding: 6, border: '1px solid #cbd5e1' }}>
                      {alloc.contributionPercentage}%
                    </td>
                    <td style={{ padding: 6, border: '1px solid #cbd5e1', fontWeight: 600 }}>
                      {alloc.allocatedAmount.toLocaleString('vi-VN')} VNĐ
                    </td>
                    <td style={{ padding: 6, border: '1px solid #cbd5e1' }}>
                      {alloc.remainderAbsorbed} VNĐ
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </section>
  );
};