import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../core/auth/AuthContext';
import './talent-pages.css';

interface TalentApplication {
  id: string;
  projectId: string;
  status: string;
  createdAt: string;
  withdrawnAt: string | null;
  project: {
    id: string;
    code: string;
    title: string;
    companyName: string;
    status: string;
  } | null;
}

export const TalentApplicationsPage: React.FC = () => {
  const { accessToken } = useAuth();
  const [applications, setApplications] = useState<TalentApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadApplications = useCallback(async () => {
    if (!accessToken) {
      setError('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await fetch('http://localhost:3000/api/v1/talent/me/applications', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!response.ok) throw new Error(await readError(response));
      setApplications((await response.json()) as TalentApplication[]);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Không thể tải đơn ứng tuyển.');
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    void loadApplications();
  }, [loadApplications]);

  const withdraw = async (applicationId: string) => {
    if (!accessToken) return;
    setError('');
    setNotice('');
    try {
      const response = await fetch(
        `http://localhost:3000/api/v1/applications/${encodeURIComponent(applicationId)}/withdraw`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );
      if (!response.ok) throw new Error(await readError(response));
      setNotice('Đã rút đơn ứng tuyển.');
      await loadApplications();
    } catch (withdrawError) {
      setError(withdrawError instanceof Error ? withdrawError.message : 'Không thể rút đơn.');
    }
  };

  return (
    <main className="talent-page">
      <h1>Đơn ứng tuyển của tôi</h1>
      <nav>
        <Link to="/talent">Hồ sơ</Link>{' | '}
        <Link to="/talent/projects">Khám phá dự án</Link>
      </nav>
      <button type="button" onClick={() => void loadApplications()} disabled={loading}>
        Làm mới trạng thái
      </button>
      {error && <p role="alert">{error}</p>}
      {notice && <p role="status">{notice}</p>}
      {loading ? (
        <p role="status">Đang tải đơn ứng tuyển...</p>
      ) : applications.length === 0 ? (
        <p>Bạn chưa có đơn ứng tuyển nào.</p>
      ) : (
        <ul>
          {applications.map((application) => (
            <li key={application.id}>
              <h2>{application.project?.title ?? `Dự án ${application.projectId}`}</h2>
              <p>{application.project?.companyName ?? 'Thông tin dự án không còn công khai'}</p>
              <p>Mã dự án: {application.project?.code ?? application.projectId}</p>
              <p>Trạng thái đơn: <strong>{application.status}</strong></p>
              <p>Ngày gửi: {new Date(application.createdAt).toLocaleString()}</p>
              {['SUBMITTED', 'UNDER_REVIEW', 'INTERVIEW'].includes(application.status) && (
                <button type="button" onClick={() => void withdraw(application.id)}>
                  Rút đơn
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
};

async function readError(response: Response): Promise<string> {
  const body = await response.json().catch(() => ({} as { message?: string }));
  return body.message || `Yêu cầu thất bại (${response.status}).`;
}
