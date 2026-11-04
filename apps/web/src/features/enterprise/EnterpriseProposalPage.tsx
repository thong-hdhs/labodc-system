import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ProjectStatus } from '@labodc/shared-types';
import { useAuth } from '../../core/auth/AuthContext';

interface ProposalItem {
  id: string;
  code: string;
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
  reviewNote?: string | null;
  submittedAt?: string | null;
  updatedAt: string;
}

interface ChangeRequestItem {
  id: string;
  code: string;
  projectId: string;
  projectCode: string;
  projectTitle: string;
  requestType: 'SCOPE_CHANGE' | 'CANCEL';
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'WITHDRAWN';
  reason: string;
  impactSummary: string;
  proposedDeliverables?: string | null;
  proposedBudgetAmount?: number | null;
  proposedDurationWeeks?: number | null;
  financialSettlementNote?: string | null;
  reviewNote?: string | null;
  createdAt: string;
}

export const EnterpriseProposalPage: React.FC = () => {
  const { user, accessToken, logout } = useAuth();
  const [proposals, setProposals] = useState<ProposalItem[]>([]);
  const [changeRequests, setChangeRequests] = useState<ChangeRequestItem[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [description, setDescription] = useState('');
  const [deliverables, setDeliverables] = useState('');
  const [skillsInput, setSkillsInput] = useState('NestJS, React, PostgreSQL');
  const [minTeamSize, setMinTeamSize] = useState(3);
  const [maxTeamSize, setMaxTeamSize] = useState(5);
  const [durationWeeks, setDurationWeeks] = useState(8);
  const [budgetAmount, setBudgetAmount] = useState(30000000);

  // State cho form Yêu cầu Đổi phạm vi / Hủy dự án (REQ-ENT-03 - D11)
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [requestType, setRequestType] = useState<'SCOPE_CHANGE' | 'CANCEL'>(
    'SCOPE_CHANGE',
  );
  const [crReason, setCrReason] = useState('');
  const [crImpact, setCrImpact] = useState('');
  const [proposedDeliverables, setProposedDeliverables] = useState('');
  const [proposedBudget, setProposedBudget] = useState<number>(35000000);
  const [proposedWeeks, setProposedWeeks] = useState<number>(10);

  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    if (!accessToken) return;
    const [propRes, crRes] = await Promise.all([
      fetch('http://localhost:3000/api/v1/projects/proposals/me', {
        headers: { Authorization: `Bearer ${accessToken}` },
      }),
      fetch('http://localhost:3000/api/v1/projects/change-requests/me', {
        headers: { Authorization: `Bearer ${accessToken}` },
      }),
    ]);

    if (propRes.ok) {
      const data: ProposalItem[] = await propRes.json();
      setProposals(data);
      if (!selectedProjectId && data.length > 0) {
        setSelectedProjectId(data[0].id);
      }
    }
    if (crRes.ok) {
      setChangeRequests(await crRes.json());
    }
  };

  useEffect(() => {
    loadData();
  }, [accessToken]);

  const resetForm = () => {
    setEditingId(null);
    setTitle('');
    setSummary('');
    setDescription('');
    setDeliverables('');
    setSkillsInput('NestJS, React, PostgreSQL');
    setMinTeamSize(3);
    setMaxTeamSize(5);
    setDurationWeeks(8);
    setBudgetAmount(30000000);
  };

  const handleSaveDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);
    setErrorMsg(null);
    setLoading(true);

    const payload = {
      title,
      summary,
      description,
      deliverables,
      requiredSkills: skillsInput
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      minTeamSize: Number(minTeamSize),
      maxTeamSize: Number(maxTeamSize),
      durationWeeks: Number(durationWeeks),
      budgetAmount: Number(budgetAmount),
    };

    try {
      const url = editingId
        ? `http://localhost:3000/api/v1/projects/proposals/${editingId}`
        : 'http://localhost:3000/api/v1/projects/proposals';
      const method = editingId ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      });

      const body = await res.json();
      if (!res.ok) {
        throw new Error(body.message || 'Lưu bản nháp đề xuất thất bại');
      }

      setStatusMsg(
        editingId
          ? `Đã cập nhật bản nháp ${body.code} thành công!`
          : `Đã tạo bản nháp đề xuất ${body.code} (DRAFT)!`,
      );
      resetForm();
      await loadData();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Lỗi không xác định');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitToLab = async (id: string) => {
    setStatusMsg(null);
    setErrorMsg(null);
    setLoading(true);
    try {
      const res = await fetch(
        `http://localhost:3000/api/v1/projects/proposals/${id}/submit`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );
      const body = await res.json();
      if (!res.ok) {
        throw new Error(body.message || 'Gửi duyệt đề xuất thất bại');
      }
      setStatusMsg(
        `Đề xuất ${body.code} đã được gửi sang Hàng đợi Xét duyệt của Lab (SUBMITTED)!`,
      );
      await loadData();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Không thể gửi duyệt');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateChangeRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId) return;
    setStatusMsg(null);
    setErrorMsg(null);
    setLoading(true);

    try {
      const payload =
        requestType === 'SCOPE_CHANGE'
          ? {
              requestType,
              reason: crReason,
              impactSummary: crImpact,
              proposedDeliverables: proposedDeliverables.trim() || undefined,
              proposedBudgetAmount: Number(proposedBudget),
              proposedDurationWeeks: Number(proposedWeeks),
            }
          : {
              requestType,
              reason: crReason,
              impactSummary: crImpact,
            };

      const res = await fetch(
        `http://localhost:3000/api/v1/projects/${selectedProjectId}/change-requests`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(payload),
        },
      );
      const body = await res.json();
      if (!res.ok) {
        throw new Error(body.message || 'Không thể gửi yêu cầu thay đổi/hủy');
      }

      setStatusMsg(
        `Đã gửi yêu cầu ${body.code} (${body.requestType}) sang Lab Admin chờ phê duyệt!`,
      );
      setCrReason('');
      setCrImpact('');
      setProposedDeliverables('');
      await loadData();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Lỗi gửi yêu cầu');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdrawChangeRequest = async (requestId: string) => {
    setStatusMsg(null);
    setErrorMsg(null);
    const res = await fetch(
      `http://localhost:3000/api/v1/projects/change-requests/${requestId}/withdraw`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );
    const body = await res.json();
    if (!res.ok) {
      setErrorMsg(body.message || 'Không thể rút yêu cầu.');
      return;
    }
    setStatusMsg(`Đã rút lại yêu cầu ${body.code} (WITHDRAWN).`);
    await loadData();
  };

  const handleSelectEdit = (item: ProposalItem) => {
    setEditingId(item.id);
    setTitle(item.title);
    setSummary(item.summary);
    setDescription(item.description);
    setDeliverables(item.deliverables);
    setSkillsInput(item.requiredSkills.join(', '));
    setMinTeamSize(item.minTeamSize);
    setMaxTeamSize(item.maxTeamSize);
    setDurationWeeks(item.durationWeeks);
    setBudgetAmount(item.budgetAmount);
  };

  return (
    <div style={{ maxWidth: 920, margin: '32px auto', padding: 24 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <h1>
          Quản lý Đề xuất Dự án & Yêu cầu Đổi phạm vi / Hủy (REQ-ENT-02 &
          REQ-ENT-03)
        </h1>
        <div style={{ display: 'flex', gap: 12 }}>
          <Link to="/enterprise" style={{ padding: '6px 12px' }}>
            Hồ sơ Pháp nhân
          </Link>
          <Link to="/finance/payos-spike" style={{ padding: '6px 12px' }}>
            Thanh toán PayOS
          </Link>
          <button onClick={logout} style={{ padding: '6px 12px' }}>
            Đăng xuất ({user?.email})
          </button>
        </div>
      </div>

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

      <form
        onSubmit={handleSaveDraft}
        style={{
          display: 'grid',
          gap: 12,
          padding: 16,
          border: '1px solid #cbd5e1',
          borderRadius: 8,
          marginBottom: 24,
        }}
      >
        <h3>
          {editingId
            ? 'Chỉnh sửa Bản nháp Đề xuất'
            : '1. Tạo Bản nháp Đề xuất Dự án Mới (DRAFT)'}
        </h3>

        <label>
          Tiêu đề dự án *
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{ width: '100%', padding: 8, marginTop: 4 }}
          />
        </label>

        <label>
          Tóm tắt mục tiêu (Summary) *
          <input
            type="text"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            style={{ width: '100%', padding: 8, marginTop: 4 }}
          />
        </label>

        <label>
          Mô tả bài toán chi tiết (Description) *
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={{ width: '100%', padding: 8, marginTop: 4 }}
          />
        </label>

        <label>
          Phạm vi sản phẩm bàn giao (Deliverables) *
          <textarea
            rows={2}
            value={deliverables}
            onChange={(e) => setDeliverables(e.target.value)}
            style={{ width: '100%', padding: 8, marginTop: 4 }}
          />
        </label>

        <label>
          Kỹ năng / Công nghệ yêu cầu (phân cách bằng dấu phẩy) *
          <input
            type="text"
            value={skillsInput}
            onChange={(e) => setSkillsInput(e.target.value)}
            style={{ width: '100%', padding: 8, marginTop: 4 }}
          />
        </label>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr 1fr',
            gap: 12,
          }}
        >
          <label>
            SV tối thiểu
            <input
              type="number"
              min={1}
              value={minTeamSize}
              onChange={(e) => setMinTeamSize(Number(e.target.value))}
              style={{ width: '100%', padding: 8, marginTop: 4 }}
            />
          </label>
          <label>
            SV tối đa
            <input
              type="number"
              min={1}
              value={maxTeamSize}
              onChange={(e) => setMaxTeamSize(Number(e.target.value))}
              style={{ width: '100%', padding: 8, marginTop: 4 }}
            />
          </label>
          <label>
            Thời lượng (tuần)
            <input
              type="number"
              min={1}
              value={durationWeeks}
              onChange={(e) => setDurationWeeks(Number(e.target.value))}
              style={{ width: '100%', padding: 8, marginTop: 4 }}
            />
          </label>
          <label>
            Ngân sách đóng góp (VNĐ)
            <input
              type="number"
              min={0}
              step={1000000}
              value={budgetAmount}
              onChange={(e) => setBudgetAmount(Number(e.target.value))}
              style={{ width: '100%', padding: 8, marginTop: 4 }}
            />
          </label>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <button
            type="submit"
            disabled={loading}
            style={{ padding: '10px 16px', fontWeight: 600 }}
          >
            {editingId ? 'Lưu cập nhật bản nháp' : 'Lưu Bản nháp (DRAFT)'}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              style={{ padding: '10px 16px' }}
            >
              Hủy chỉnh sửa
            </button>
          )}
        </div>
      </form>

      <h3>2. Danh sách Đề xuất & Dự án của Doanh nghiệp ({proposals.length})</h3>
      {proposals.map((item) => {
        const isEditable =
          item.status === ProjectStatus.DRAFT ||
          item.status === ProjectStatus.CHANGES_REQUESTED;
        return (
          <div
            key={item.id}
            style={{
              border: '1px solid #e2e8f0',
              borderRadius: 8,
              padding: 16,
              marginBottom: 12,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <strong>
                [{item.code}] {item.title}
              </strong>
              <span>
                Trạng thái: <strong>{item.status}</strong>
              </span>
            </div>
            <p style={{ margin: '6px 0' }}>{item.summary}</p>
            <p style={{ margin: '4px 0', fontSize: 14 }}>
              Deliverables: {item.deliverables} | Kỹ năng:{' '}
              {item.requiredSkills.join(', ')} | Thời lượng: {item.durationWeeks}{' '}
              tuần | Ngân sách: {item.budgetAmount.toLocaleString('vi-VN')} VNĐ
            </p>
            {item.reviewNote && (
              <p style={{ color: '#b91c1c' }}>
                Phản hồi từ Lab Admin: {item.reviewNote}
              </p>
            )}
            {isEditable && (
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button
                  onClick={() => handleSelectEdit(item)}
                  style={{ padding: '6px 12px' }}
                >
                  Chỉnh sửa nháp
                </button>
                <button
                  onClick={() => handleSubmitToLab(item.id)}
                  style={{ padding: '6px 12px', fontWeight: 600 }}
                >
                  Gửi Lab xét duyệt (Submit)
                </button>
              </div>
            )}
          </div>
        );
      })}

      <form
        onSubmit={handleCreateChangeRequest}
        style={{
          display: 'grid',
          gap: 12,
          padding: 16,
          border: '1px solid #cbd5e1',
          borderRadius: 8,
          marginTop: 28,
          marginBottom: 24,
          background: '#f8fafc',
        }}
      >
        <h3>
          3. Gửi Yêu cầu Đổi phạm vi (SCOPE_CHANGE) hoặc Hủy dự án (CANCEL) —
          Ngày D11 (REQ-ENT-03)
        </h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr',
            gap: 12,
          }}
        >
          <label>
            Chọn dự án cần gửi yêu cầu *
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              style={{ width: '100%', padding: 8, marginTop: 4 }}
            >
              {proposals.map((p) => (
                <option key={p.id} value={p.id}>
                  [{p.code}] {p.title} ({p.status})
                </option>
              ))}
            </select>
          </label>
          <label>
            Loại yêu cầu *
            <select
              value={requestType}
              onChange={(e) =>
                setRequestType(e.target.value as 'SCOPE_CHANGE' | 'CANCEL')
              }
              style={{ width: '100%', padding: 8, marginTop: 4 }}
            >
              <option value="SCOPE_CHANGE">
                SCOPE_CHANGE (Đổi phạm vi / ngân sách / thời gian)
              </option>
              <option value="CANCEL">CANCEL (Xin hủy dự án)</option>
            </select>
          </label>
        </div>

        <label>
          Lý do yêu cầu thay đổi / hủy (Tối thiểu 15 ký tự) *
          <input
            type="text"
            required
            placeholder="Ví dụ: Mở rộng thêm phân hệ Mobile App và tăng ngân sách tài trợ thêm 15 triệu VNĐ..."
            value={crReason}
            onChange={(e) => setCrReason(e.target.value)}
            style={{ width: '100%', padding: 8, marginTop: 4 }}
          />
        </label>

        <label>
          Đánh giá tác động tới tiến độ / nhóm thực hiện (Tối thiểu 10 ký tự) *
          <input
            type="text"
            required
            placeholder="Ví dụ: Cần kéo dài thêm 2 tuần ở Sprint cuối và bổ sung 10 triệu VNĐ vào quỹ nhóm..."
            value={crImpact}
            onChange={(e) => setCrImpact(e.target.value)}
            style={{ width: '100%', padding: 8, marginTop: 4 }}
          />
        </label>

        {requestType === 'SCOPE_CHANGE' && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1fr 1fr',
              gap: 12,
            }}
          >
            <label>
              Deliverables đề xuất mới
              <input
                type="text"
                placeholder="Web Portal + REST API + Mobile App"
                value={proposedDeliverables}
                onChange={(e) => setProposedDeliverables(e.target.value)}
                style={{ width: '100%', padding: 8, marginTop: 4 }}
              />
            </label>
            <label>
              Ngân sách mới (VNĐ)
              <input
                type="number"
                min={1000000}
                step={1000000}
                value={proposedBudget}
                onChange={(e) => setProposedBudget(Number(e.target.value))}
                style={{ width: '100%', padding: 8, marginTop: 4 }}
              />
            </label>
            <label>
              Thời lượng mới (tuần)
              <input
                type="number"
                min={1}
                value={proposedWeeks}
                onChange={(e) => setProposedWeeks(Number(e.target.value))}
                style={{ width: '100%', padding: 8, marginTop: 4 }}
              />
            </label>
          </div>
        )}

        <div>
          <button
            type="submit"
            disabled={loading || proposals.length === 0}
            style={{ padding: '10px 16px', fontWeight: 600 }}
          >
            Gửi Yêu cầu sang Lab Admin
          </button>
        </div>
      </form>

      <h3>
        4. Lịch sử Yêu cầu Đổi phạm vi / Hủy dự án của Doanh nghiệp (
        {changeRequests.length})
      </h3>
      {changeRequests.map((cr) => (
        <div
          key={cr.id}
          style={{
            border: '1px solid #cbd5e1',
            borderRadius: 8,
            padding: 14,
            marginBottom: 10,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <strong>
              [{cr.code}] Dự án {cr.projectCode}: {cr.requestType}
            </strong>
            <span>
              Trạng thái: <strong>{cr.status}</strong>
            </span>
          </div>
          <p style={{ margin: '6px 0', fontSize: 14 }}>
            Lý do: {cr.reason} | Tác động: {cr.impactSummary}
          </p>
          {cr.reviewNote && (
            <p style={{ margin: '4px 0', fontSize: 14, color: '#0369a1' }}>
              Quyết định của Lab Admin: {cr.reviewNote}{' '}
              {cr.financialSettlementNote
                ? `(${cr.financialSettlementNote})`
                : ''}
            </p>
          )}
          {cr.status === 'PENDING_APPROVAL' && (
            <button
              onClick={() => handleWithdrawChangeRequest(cr.id)}
              style={{ padding: '6px 12px', marginTop: 6 }}
            >
              Rút lại yêu cầu (Withdraw)
            </button>
          )}
        </div>
      ))}
    </div>
  );
};