import React, { FormEvent, useEffect, useState } from 'react';
import { useAuth } from '../../core/auth/AuthContext';

interface PortfolioItem {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  status: 'PENDING_UPLOAD';
  createdAt: string;
}

interface TalentProfile {
  userId: string;
  email: string;
  studentId: string;
  fullName: string;
  faculty: string | null;
  major: string | null;
  cohort: string | null;
  bio: string | null;
  skills: string[];
  certifications: string[];
  portfolioItems: PortfolioItem[];
}

interface ProfileForm {
  studentId: string;
  fullName: string;
  faculty: string;
  major: string;
  cohort: string;
  bio: string;
  skills: string;
  certifications: string;
}

const emptyForm = (fullName = ''): ProfileForm => ({
  studentId: '',
  fullName,
  faculty: '',
  major: '',
  cohort: '',
  bio: '',
  skills: '',
  certifications: '',
});

const splitItems = (value: string): string[] =>
  value.split(',').map((item) => item.trim()).filter(Boolean);

export const TalentProfilePage: React.FC = () => {
  const { user, accessToken } = useAuth();
  const [form, setForm] = useState<ProfileForm>(() => emptyForm(user?.fullName));
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    const loadProfile = async () => {
      if (!accessToken) {
        setError('Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.');
        setLoading(false);
        return;
      }
      try {
        const response = await fetch('http://localhost:3000/api/v1/talent/me/profile', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!response.ok) {
          throw new Error(await readError(response));
        }
        const result = (await response.json()) as { profile: TalentProfile | null };
        const profile = result.profile;
        if (profile) {
          setForm({
            studentId: profile.studentId,
            fullName: profile.fullName,
            faculty: profile.faculty ?? '',
            major: profile.major ?? '',
            cohort: profile.cohort ?? '',
            bio: profile.bio ?? '',
            skills: profile.skills.join(', '),
            certifications: profile.certifications.join(', '),
          });
          setPortfolioItems(profile.portfolioItems);
        }
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Không thể tải hồ sơ.');
      } finally {
        setLoading(false);
      }
    };
    void loadProfile();
  }, [accessToken]);

  const saveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!accessToken) return;
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const response = await fetch('http://localhost:3000/api/v1/talent/me/profile', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId: form.studentId,
          fullName: form.fullName,
          faculty: form.faculty,
          major: form.major,
          cohort: form.cohort,
          bio: form.bio,
          skills: splitItems(form.skills),
          certifications: splitItems(form.certifications),
        }),
      });
      if (!response.ok) throw new Error(await readError(response));
      setNotice('Đã lưu hồ sơ Talent.');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Không thể lưu hồ sơ.');
    } finally {
      setSaving(false);
    }
  };

  const addPortfolio = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !accessToken) return;
    setError('');
    setNotice('');
    try {
      const response = await fetch('http://localhost:3000/api/v1/talent/me/portfolio', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName: file.name,
          mimeType: file.type,
          sizeBytes: file.size,
        }),
      });
      if (!response.ok) throw new Error(await readError(response));
      const profile = (await response.json()) as TalentProfile;
      setPortfolioItems(profile.portfolioItems);
      setNotice('Đã ghi nhận tệp. Upload nội dung thật sẽ được tích hợp với Cloudinary sau.');
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Không thể ghi nhận tệp.');
    }
  };

  if (loading) return <main><p role="status">Đang tải hồ sơ...</p></main>;

  return (
    <main>
      <h1>Hồ sơ Talent</h1>
      <p>Email tài khoản: {user?.email}</p>
      {error && <p role="alert">{error}</p>}
      {notice && <p role="status">{notice}</p>}
      <form onSubmit={saveProfile}>
        <label>
          Mã sinh viên *
          <input required maxLength={64} value={form.studentId} onChange={(event) => setForm({ ...form, studentId: event.target.value })} />
        </label>
        <label>
          Họ và tên *
          <input required maxLength={160} value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} />
        </label>
        <label>
          Khoa
          <input maxLength={160} value={form.faculty} onChange={(event) => setForm({ ...form, faculty: event.target.value })} />
        </label>
        <label>
          Ngành học
          <input maxLength={160} value={form.major} onChange={(event) => setForm({ ...form, major: event.target.value })} />
        </label>
        <label>
          Khóa / năm học
          <input maxLength={80} value={form.cohort} onChange={(event) => setForm({ ...form, cohort: event.target.value })} />
        </label>
        <label>
          Giới thiệu
          <textarea maxLength={2000} value={form.bio} onChange={(event) => setForm({ ...form, bio: event.target.value })} />
        </label>
        <label>
          Kỹ năng (phân cách bằng dấu phẩy)
          <input value={form.skills} onChange={(event) => setForm({ ...form, skills: event.target.value })} />
        </label>
        <label>
          Chứng chỉ (phân cách bằng dấu phẩy)
          <input value={form.certifications} onChange={(event) => setForm({ ...form, certifications: event.target.value })} />
        </label>
        <button type="submit" disabled={saving}>{saving ? 'Đang lưu...' : 'Lưu hồ sơ'}</button>
      </form>

      <section aria-labelledby="portfolio-heading">
        <h2 id="portfolio-heading">Portfolio</h2>
        <p>Chấp nhận PDF/JPEG/PNG tối đa 10 MiB. D5/D6 chỉ ghi nhận metadata, chưa upload nội dung.</p>
        <label>
          Chọn tệp
          <input type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" onChange={addPortfolio} />
        </label>
        {portfolioItems.length === 0 ? (
          <p>Chưa có tài liệu portfolio.</p>
        ) : (
          <ul>
            {portfolioItems.map((item) => (
              <li key={item.id}>{item.fileName} — {item.status}</li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
};

async function readError(response: Response): Promise<string> {
  const body = await response.json().catch(() => ({} as { message?: string }));
  return body.message || `Yêu cầu thất bại (${response.status}).`;
}
