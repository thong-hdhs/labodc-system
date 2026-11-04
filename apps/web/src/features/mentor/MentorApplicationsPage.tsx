import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../core/auth/AuthContext';
import './mentor-applications.css';

type ApplicationStatus =
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'INTERVIEW'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'WITHDRAWN';

interface ReviewEvent {
  id: string;
  action: string;
  interviewOutcome: 'PASS' | 'FAIL' | null;
  internalNote: string | null;
  createdAt: string;
}

interface MentorApplication {
  id: string;
  applicantUserId: string;
  status: ApplicationStatus;
  project: { title: string; code: string } | null;
  candidate: {
    fullName: string;
    email: string;
    profile: {
      studentId: string;
      faculty: string | null;
      major: string | null;
      cohort: string | null;
      bio: string | null;
      skills: string[];
      certifications: string[];
      portfolioItems: Array<{ fileName: string; status: string }>;
    } | null;
  };
  reviewEvents: ReviewEvent[];
  requiresInterview: boolean;
}

export const MentorApplicationsPage: React.FC = () => {
  const { accessToken, logout, user } = useAuth();
  const [applications, setApplications] = useState<MentorApplication[]>([]);
  const [interviewOutcomes, setInterviewOutcomes] = useState<
    Record<string, 'PASS' | 'FAIL'>
  >({});
  const [internalNotes, setInternalNotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [busyApplicationId, setBusyApplicationId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadApplications = useCallback(async () => {
    if (!accessToken) {
      setLoading(false);
      setError('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await fetch(
        'http://localhost:3000/api/v1/mentor/me/applications',
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      if (!response.ok) throw new Error(await readError(response));
      setApplications((await response.json()) as MentorApplication[]);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Không thể tải danh sách ứng viên.',
      );
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    void loadApplications();
  }, [loadApplications]);

  const performAction = async (
    applicationId: string,
    action: string,
    body?: Record<string, string>,
  ) => {
    if (!accessToken) return;
    setBusyApplicationId(applicationId);
    setError('');
    setNotice('');
    try {
      const response = await fetch(
        `http://localhost:3000/api/v1/mentor/applications/${encodeURIComponent(applicationId)}/${action}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            ...(body ? { 'Content-Type': 'application/json' } : {}),
          },
          ...(body ? { body: JSON.stringify(body) } : {}),
        },
      );
      if (!response.ok) throw new Error(await readError(response));
      setNotice('Đã cập nhật trạng thái xét duyệt.');
      await loadApplications();
    } catch (actionError) {
      setError(
        actionError instanceof Error
          ? actionError.message
          : 'Không thể cập nhật đơn ứng tuyển.',
      );
    } finally {
      setBusyApplicationId(null);
    }
  };

  const recordInterview = (applicationId: string) => {
    const outcome = interviewOutcomes[applicationId];
    if (!outcome) {
      setError('Hãy chọn kết quả phỏng vấn PASS hoặc FAIL.');
      return;
    }
    void performAction(applicationId, 'interview-result', {
      outcome,
      internalNote: internalNotes[applicationId] ?? '',
    });
  };

  return (
    <main className="mentor-applications-page">
      <header className="mentor-applications-header">
        <div>
          <h1>Ứng viên dự án được phân công</h1>
          <p>Mentor: {user?.fullName ?? user?.email}</p>
        </div>
        <div className="mentor-applications-actions">
          <button type="button" onClick={() => void loadApplications()} disabled={loading}>
            Làm mới
          </button>
          <button type="button" onClick={logout}>
            Đăng xuất
          </button>
        </div>
      </header>

      {error && <p role="alert">{error}</p>}
      {notice && <p role="status">{notice}</p>}
      {loading ? (
        <p role="status">Đang tải đơn ứng tuyển...</p>
      ) : applications.length === 0 ? (
        <p>Chưa có đơn ứng tuyển trong các dự án bạn đang phụ trách.</p>
      ) : (
        <ul className="mentor-application-list">
          {applications.map((application) => {
            const busy = busyApplicationId === application.id;
            const canStart = application.status === 'SUBMITTED';
            const canRecordInterview =
              application.status === 'UNDER_REVIEW' &&
              application.requiresInterview;
            const canDecide =
              application.status ===
              (application.requiresInterview ? 'INTERVIEW' : 'UNDER_REVIEW');

            return (
              <li key={application.id} className="mentor-application-card">
                <h2>{application.candidate.fullName}</h2>
                <p>{application.candidate.email}</p>
                <p>
                  Dự án: {application.project?.title ?? application.id}
                  {application.project && ` · ${application.project.code}`}
                </p>
                <p>
                  Mã ứng viên: <code>{application.applicantUserId}</code>
                </p>
                {application.candidate.profile && (
                  <section className="mentor-candidate-profile">
                    <h3>Hồ sơ Talent</h3>
                    <p>
                      {application.candidate.profile.studentId}
                      {application.candidate.profile.faculty &&
                        ` · ${application.candidate.profile.faculty}`}
                      {application.candidate.profile.major &&
                        ` · ${application.candidate.profile.major}`}
                      {application.candidate.profile.cohort &&
                        ` · ${application.candidate.profile.cohort}`}
                    </p>
                    {application.candidate.profile.bio && (
                      <p>{application.candidate.profile.bio}</p>
                    )}
                    <p>
                      Kỹ năng: {application.candidate.profile.skills.join(', ') || 'Chưa khai báo'}
                    </p>
                    <p>
                      Chứng chỉ:{' '}
                      {application.candidate.profile.certifications.join(', ') || 'Chưa khai báo'}
                    </p>
                    <p>
                      Portfolio metadata:{' '}
                      {application.candidate.profile.portfolioItems
                        .map((item) => `${item.fileName} (${item.status})`)
                        .join(', ') || 'Chưa có'}
                    </p>
                  </section>
                )}
                <p>
                  Trạng thái đơn: <strong>{application.status}</strong>
                </p>

                {canStart && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      void performAction(application.id, 'start-review')
                    }
                  >
                    Bắt đầu xét duyệt
                  </button>
                )}

                {canRecordInterview && (
                  <section className="mentor-interview-form">
                    <h3>Kết quả phỏng vấn</h3>
                    <label>
                      Kết quả
                      <select
                        value={interviewOutcomes[application.id] ?? ''}
                        onChange={(event) => {
                          const value = event.target.value;
                          if (value === 'PASS' || value === 'FAIL') {
                            setInterviewOutcomes((current) => ({
                              ...current,
                              [application.id]: value,
                            }));
                          }
                        }}
                      >
                        <option value="">Chọn kết quả</option>
                        <option value="PASS">Đạt (PASS)</option>
                        <option value="FAIL">Không đạt (FAIL)</option>
                      </select>
                    </label>
                    <label>
                      Ghi chú nội bộ (tối đa 2.000 ký tự)
                      <textarea
                        maxLength={2000}
                        value={internalNotes[application.id] ?? ''}
                        onChange={(event) =>
                          setInternalNotes((current) => ({
                            ...current,
                            [application.id]: event.target.value,
                          }))
                        }
                      />
                    </label>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => recordInterview(application.id)}
                    >
                      Lưu kết quả phỏng vấn
                    </button>
                  </section>
                )}

                {canDecide && (
                  <div className="mentor-decision-actions">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        void performAction(application.id, 'decision', {
                          status: 'ACCEPTED',
                        })
                      }
                    >
                      Chấp nhận
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        void performAction(application.id, 'decision', {
                          status: 'REJECTED',
                        })
                      }
                    >
                      Từ chối
                    </button>
                  </div>
                )}

                {application.reviewEvents.length > 0 && (
                  <details>
                    <summary>Ghi chú nội bộ Mentor</summary>
                    <ul>
                      {application.reviewEvents.map((event) => (
                        <li key={event.id}>
                          <strong>{event.action}</strong>
                          {event.interviewOutcome && (
                            <span> · {event.interviewOutcome}</span>
                          )}
                          {event.internalNote && <p>{event.internalNote}</p>}
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
};

async function readError(response: Response): Promise<string> {
  const body = (await response.json().catch(() => ({}))) as {
    message?: string | string[];
  };
  return Array.isArray(body.message)
    ? body.message.join(', ')
    : body.message || `Yêu cầu thất bại (${response.status}).`;
}
