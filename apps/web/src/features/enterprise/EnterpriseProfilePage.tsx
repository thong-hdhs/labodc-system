import React, { useEffect, useState } from 'react';
import { useAuth } from '../../core/auth/AuthContext';

interface EnterpriseProfileForm {
  id?: string;
  companyName: string;
  taxCode: string;
  industry: string;
  address: string;
  website: string;
  description: string;
  representativeName: string;
  contactEmail: string;
  contactPhone: string;
  verificationStatus?: 'PENDING_VERIFICATION' | 'VERIFIED' | 'REJECTED';
  verificationNote?: string | null;
}

export const EnterpriseProfilePage: React.FC = () => {
  const { user, accessToken, logout } = useAuth();
  const [form, setForm] = useState<EnterpriseProfileForm>({
    companyName: '',
    taxCode: '',
    industry: '',
    address: '',
    website: '',
    description: '',
    representativeName: user?.fullName || '',
    contactEmail: user?.email || '',
    contactPhone: '',
  });
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!accessToken) return;
    fetch('http://localhost:3000/api/v1/enterprises/profile/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          setForm({
            id: data.id,
            companyName: data.companyName || '',
            taxCode: data.taxCode || '',
            industry: data.industry || '',
            address: data.address || '',
            website: data.website || '',
            description: data.description || '',
            representativeName: data.representativeName || '',
            contactEmail: data.contactEmail || '',
            contactPhone: data.contactPhone || '',
            verificationStatus: data.verificationStatus,
            verificationNote: data.verificationNote,
          });
        }
      })
      .catch(() => {
        // Chưa có hồ sơ, cho phép điền mới
      });
  }, [accessToken]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);
    setErrorMsg(null);
    setLoading(true);

    try {
      const res = await fetch('http://localhost:3000/api/v1/enterprises/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(form),
      });

      const body = await res.json();
      if (!res.ok) {
        throw new Error(body.message || 'Cập nhật hồ sơ doanh nghiệp thất bại');
      }

      setForm((prev) => ({
        ...prev,
        id: body.id,
        verificationStatus: body.verificationStatus,
        verificationNote: body.verificationNote,
      }));
      setStatusMsg('Lưu hồ sơ pháp nhân doanh nghiệp thành công!');
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Lỗi không xác định');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 760, margin: '32px auto', padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Hồ sơ Pháp nhân Doanh nghiệp (REQ-ENT-01)</h1>
        <button onClick={logout} style={{ padding: '6px 12px' }}>
          Đăng xuất
        </button>
      </div>

      <p>
        Tài khoản: <strong>{user?.email}</strong> | Trạng thái xác thực Lab:{' '}
        <strong>{form.verificationStatus || 'CHƯA KHỞI TẠO'}</strong>
      </p>
      {form.verificationNote && (
        <p style={{ color: '#0369a1' }}>Ghi chú từ Lab Admin: {form.verificationNote}</p>
      )}

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

      <form onSubmit={handleSave} style={{ display: 'grid', gap: 12 }}>
        <label>
          Tên pháp nhân công ty *
          <input
            type="text"
            required
            value={form.companyName}
            onChange={(e) => setForm({ ...form, companyName: e.target.value })}
            style={{ width: '100%', padding: 8, marginTop: 4 }}
          />
        </label>

        <label>
          Mã số thuế (10 hoặc 10-3 chữ số) *
          <input
            type="text"
            required
            value={form.taxCode}
            onChange={(e) => setForm({ ...form, taxCode: e.target.value })}
            style={{ width: '100%', padding: 8, marginTop: 4 }}
          />
        </label>

        <label>
          Lĩnh vực hoạt động *
          <input
            type="text"
            required
            value={form.industry}
            onChange={(e) => setForm({ ...form, industry: e.target.value })}
            style={{ width: '100%', padding: 8, marginTop: 4 }}
          />
        </label>

        <label>
          Địa chỉ trụ sở *
          <input
            type="text"
            required
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            style={{ width: '100%', padding: 8, marginTop: 4 }}
          />
        </label>

        <label>
          Website
          <input
            type="url"
            value={form.website}
            onChange={(e) => setForm({ ...form, website: e.target.value })}
            style={{ width: '100%', padding: 8, marginTop: 4 }}
          />
        </label>

        <label>
          Người đại diện liên hệ *
          <input
            type="text"
            required
            value={form.representativeName}
            onChange={(e) => setForm({ ...form, representativeName: e.target.value })}
            style={{ width: '100%', padding: 8, marginTop: 4 }}
          />
        </label>

        <label>
          Email liên hệ doanh nghiệp *
          <input
            type="email"
            required
            value={form.contactEmail}
            onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
            style={{ width: '100%', padding: 8, marginTop: 4 }}
          />
        </label>

        <label>
          Số điện thoại liên hệ *
          <input
            type="tel"
            required
            value={form.contactPhone}
            onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
            style={{ width: '100%', padding: 8, marginTop: 4 }}
          />
        </label>

        <label>
          Giới thiệu doanh nghiệp
          <textarea
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            style={{ width: '100%', padding: 8, marginTop: 4 }}
          />
        </label>

        <button type="submit" disabled={loading} style={{ padding: 10, fontWeight: 600 }}>
          {loading ? 'Đang lưu...' : 'Lưu Hồ sơ Doanh nghiệp'}
        </button>
      </form>
    </div>
  );
};