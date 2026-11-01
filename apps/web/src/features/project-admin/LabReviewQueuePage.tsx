import React, { useEffect, useState } from 'react';
import {
  ProjectStatus,
  ProposalRejectionReasonCode,
} from '@labodc/shared-types';
import { useAuth } from '../../core/auth/AuthContext';

interface EnterpriseItem {
  id: string;
  companyName: string;
  taxCode: string;
  industry: string;
  representativeName: string;
  contactEmail: string;
  verificationStatus: 'PENDING_VERIFICATION' | 'VERIFIED' | 'REJECTED';
}

interface ProposalQueueItem {
  id: string;
  code: string;
  companyName: string;
  title: string;
  summary: string;
  description: string;
  deliverables: string;
  requiredSkills: string[];
  minTeamSize: number;
  maxTeamSize: number;
  durationWeeks: number;
  budgetAmount: number;
  status: ProjectStatus;
  reasonCode?: ProposalRejectionReasonCode | null;
  reviewNote?: string | null;
  registrationCloseAt?: string | null;
}

export const LabReviewQueuePage: React.FC = () => {
  const { user, accessToken, logout } = useAuth();
  const [enterprises, setEnterprises] = useState<EnterpriseItem[]>([]);
  const [proposals, setProposals] = useState<ProposalQueueItem[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [reasonCode, setReasonCode] = useState<ProposalRejectionReasonCode>(
    ProposalRejectionReasonCode.MISSING_SCOPE,
  );
  const [reasonNote, setReasonNote] = useState<string>('');
  const [closeDateInput, setCloseDateInput] = useState<string>(() => {
    const d = new Date(Date.now() + 14 * 86400000);
    return d.toISOString().slice(0, 10);
  });
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadData = async () => {
    if (!accessToken) return;
    const query = statusFilter ? `?status=${statusFilter}` : '';
    const [entRes, propRes] = await Promise.all([
      fetch('http://localhost:3000/api/v1/enterprises', {
        headers: { Authorization: `Bearer ${accessToken}` },
      }),
      fetch(`http://localhost:3000/api/v1/lab-admin/proposals${query}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      }),
    ]);

    if (entRes.ok) {
      setEnterprises(await entRes.json());
    }
    if (propRes.ok) {
      setProposals(await propRes.json());
    }
  };

  useEffect(() => {
    loadData();
  }, [accessToken, statusFilter]);

  const handleVerifyEnterprise = async (id: string) => {
    setStatusMsg(null);
    setErrorMsg(null);
    const res = await fetch(`http://localhost:3000/api/v1/enterprises/${id}/verify`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        status: 'VERIFIED',
        note: 'Đã xác minh pháp nhân và mã số thuế doanh nghiệp.',
      }),
    });
    if (res.ok) {
      setStatusMsg('Đã xác thực pháp nhân doanh nghiệp (VERIFIED) thành công!');
      await loadData();
    } else {
      const err = await res.json().catch(() => ({}));
      setErrorMsg(err.message || 'Không thể xác thực doanh nghiệp.');
    }
  };

  const handleApproveProposal = async (id: string) => {
    setStatusMsg(null);
    setErrorMsg(null);
    const res = await fetch(
      `http://localhost:3000/api/v1/lab-admin/proposals/${id}/approve`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          reviewNote: reasonNote.trim() || 'Đề xuất đạt yêu cầu xét duyệt của Lab.',
        }),
      },
    );
    const body = await res.json();
    if (!res.ok) {
      setErrorMsg(body.message || 'Phê duyệt thất bại.');
      return;
    }
    setStatusMsg(`Đã phê duyệt đề xuất ${body.code} (APPROVED)!`);
    await loadData();
  };

  const handleDecisionWithReason = async (
    id: string,
    action: 'request-info' | 'reject',
  ) => {
    setStatusMsg(null);
    setErrorMsg(null);
    const res = await fetch(
      `http://localhost:3000/api/v1/lab-admin/proposals/${id}/${action}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ reasonCode, reasonNote }),
      },
    );
    const body = await res.json();
    if (!res.ok) {
      setErrorMsg(body.message || 'Thao tác thất bại.');
      return;
    }
    setStatusMsg(
      action === 'request-info'
        ? `Đã gửi yêu cầu bổ sung cho đề xuất ${body.code} (CHANGES_REQUESTED).`
        : `Đã từ chối đề xuất ${body.code} (REJECTED).`,
    );
    setReasonNote('');
    await loadData();
  };

  const handlePublishProject = async (id: string) => {
    setStatusMsg(null);
    setErrorMsg(null);
    const isoClose = new Date(`${closeDateInput}T23:59:59.000Z`).toISOString();
    const res = await fetch(
      `http://localhost:3000/api/v1/lab-admin/projects/${id}/publish`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          registrationCloseAt: isoClose,
          note: reasonNote.trim() || 'Công bố dự án mở nhận đơn ứng tuyển.',
        }),
      },
    );
    const body = await res.json();
    if (!res.ok) {
      setErrorMsg(body.message || 'Công bố dự án thất bại.');
      return;
    }
    setStatusMsg(`Dự án ${body.code} đã được công bố (PUBLISHED) cho sinh viên!`);
    await loadData();
  };

  const handleLifecycleControl = async (
    id: string,
    endpoint: 'unpublish' | 'close-recruitment',
  ) => {
    setStatusMsg(null);
    setErrorMsg(null);
    const res = await fetch(
      `http://localhost:3000/api/v1/lab-admin/projects/${id}/${endpoint}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ note: reasonNote.trim() || undefined }),
      },
    );
    const body = await res.json();
    if (!res.ok) {
      setErrorMsg(body.message || 'Cập nhật trạng thái thất bại.');
      return;
    }
    setStatusMsg(`Đã chuyển trạng thái dự án ${body.code} sang ${body.status}.`);
    await loadData();
  };

  return (
    <div style={{ maxWidth: 980, margin: '32px auto', padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Bảng điều khiển Lab Admin — Xét duyệt & Công bố Dự án (REQ-LAB-01)</h1>
        <button onClick={logout} style={{ padding: '6px 12px' }}>
          Đăng xuất ({user?.email})
        </button>
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

      <section style={{ marginBottom: 28 }}>
        <h3>1. Hàng đợi Xác thực Pháp nhân Doanh nghiệp ({enterprises.length})</h3>
        {enterprises.map((ent) => (
          <div
            key={ent.id}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: 12,
              border: '1px solid #cbd5e1',
              borderRadius: 6,
              marginBottom: 8,
            }}
          >
            <div>
              <strong>{ent.companyName}</strong> — MST: {ent.taxCode} ({ent.industry}) | Đại diện:{' '}
              {ent.representativeName} ({ent.contactEmail})
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <span>
                Trạng thái: <strong>{ent.verificationStatus}</strong>
              </span>
              {ent.verificationStatus !== 'VERIFIED' && (
                <button
                  onClick={() => handleVerifyEnterprise(ent.id)}
                  style={{ padding: '6px 12px', fontWeight: 600 }}
                >
                  Xác thực (VERIFIED)
                </button>
              )}
            </div>
          </div>
        ))}
      </section>

      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>2. Hàng đợi Xét duyệt Đề xuất & Điều khiển Công bố Dự án ({proposals.length})</h3>
          <label>
            Lọc trạng thái:{' '}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ padding: 6 }}
            >
              <option value="">Tất cả trạng thái</option>
              <option value={ProjectStatus.SUBMITTED}>SUBMITTED (Chờ xét duyệt)</option>
              <option value={ProjectStatus.CHANGES_REQUESTED}>CHANGES_REQUESTED</option>
              <option value={ProjectStatus.APPROVED}>APPROVED (Chờ công bố)</option>
              <option value={ProjectStatus.PUBLISHED}>PUBLISHED (Đang mở đơn)</option>
              <option value={ProjectStatus.RECRUITMENT_CLOSED}>RECRUITMENT_CLOSED</option>
              <option value={ProjectStatus.REJECTED}>REJECTED</option>
            </select>
          </label>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 2fr 1fr',
            gap: 12,
            padding: 12,
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: 8,
            marginBottom: 16,
          }}
        >
          <label>
            Mã lý do (Khi Yêu cầu bổ sung / Từ chối)
            <select
              value={reasonCode}
              onChange={(e) =>
                setReasonCode(e.target.value as ProposalRejectionReasonCode)
              }
              style={{ width: '100%', padding: 8, marginTop: 4 }}
            >
              <option value={ProposalRejectionReasonCode.MISSING_SCOPE}>
                MISSING_SCOPE (Thiếu phạm vi)
              </option>
              <option value={ProposalRejectionReasonCode.BUDGET_MISMATCH}>
                BUDGET_MISMATCH (Ngân sách chưa phù hợp)
              </option>
              <option value={ProposalRejectionReasonCode.TECH_STACK_UNSUPPORTED}>
                TECH_STACK_UNSUPPORTED (Công nghệ ngoài phạm vi)
              </option>
              <option value={ProposalRejectionReasonCode.UNVERIFIED_ENTERPRISE}>
                UNVERIFIED_ENTERPRISE (Chưa xác minh DN)
              </option>
              <option value={ProposalRejectionReasonCode.OTHER}>OTHER (Lý do khác)</option>
            </select>
          </label>

          <label>
            Ghi chú xét duyệt / Lý do phản hồi (Tối thiểu 15 ký tự khi Reject / Request Info)
            <input
              type="text"
              placeholder="Nhập ghi chú xét duyệt hoặc lý do yêu cầu bổ sung / từ chối..."
              value={reasonNote}
              onChange={(e) => setReasonNote(e.target.value)}
              style={{ width: '100%', padding: 8, marginTop: 4 }}
            />
          </label>

          <label>
            Hạn đóng nhận đơn (Khi Publish)
            <input
              type="date"
              value={closeDateInput}
              onChange={(e) => setCloseDateInput(e.target.value)}
              style={{ width: '100%', padding: 8, marginTop: 4 }}
            />
          </label>
        </div>

        {proposals.map((item) => (
          <div
            key={item.id}
            style={{
              border: '1px solid #cbd5e1',
              borderRadius: 8,
              padding: 16,
              marginBottom: 12,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <strong>
                [{item.code}] {item.title} — Doanh nghiệp: {item.companyName}
              </strong>
              <span>
                Trạng thái: <strong>{item.status}</strong>
              </span>
            </div>
            <p style={{ margin: '6px 0' }}>{item.summary}</p>
            <p style={{ margin: '4px 0', fontSize: 14 }}>
              Deliverables: {item.deliverables} | Kỹ năng: {item.requiredSkills.join(', ')} | Ngân
              sách: {item.budgetAmount.toLocaleString('vi-VN')} VNĐ
            </p>
            {item.reviewNote && (
              <p style={{ color: '#0369a1', fontSize: 14 }}>
                Ghi chú Lab ({item.reasonCode || 'NOTE'}): {item.reviewNote}
              </p>
            )}

            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              {item.status === ProjectStatus.SUBMITTED && (
                <>
                  <button
                    onClick={() => handleApproveProposal(item.id)}
                    style={{ padding: '6px 12px', fontWeight: 600 }}
                  >
                    Phê duyệt (Approve)
                  </button>
                  <button
                    onClick={() => handleDecisionWithReason(item.id, 'request-info')}
                    style={{ padding: '6px 12px' }}
                  >
                    Yêu cầu bổ sung (Request Info)
                  </button>
                  <button
                    onClick={() => handleDecisionWithReason(item.id, 'reject')}
                    style={{ padding: '6px 12px', color: '#991b1b' }}
                  >
                    Từ chối (Reject)
                  </button>
                </>
              )}

              {(item.status === ProjectStatus.APPROVED ||
                item.status === ProjectStatus.UNPUBLISHED) && (
                <button
                  onClick={() => handlePublishProject(item.id)}
                  style={{ padding: '6px 12px', fontWeight: 600 }}
                >
                  Công bố Dự án (Publish)
                </button>
              )}

              {item.status === ProjectStatus.PUBLISHED && (
                <>
                  <button
                    onClick={() => handleLifecycleControl(item.id, 'unpublish')}
                    style={{ padding: '6px 12px' }}
                  >
                    Tạm ẩn (Unpublish)
                  </button>
                  <button
                    onClick={() => handleLifecycleControl(item.id, 'close-recruitment')}
                    style={{ padding: '6px 12px', fontWeight: 600 }}
                  >
                    Đóng nhận đơn (Close Recruitment)
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
};