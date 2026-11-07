import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../core/auth/AuthContext';

const API_BASE = 'http://localhost:3000/api/v1';

interface TeamView {
  id: string;
  status: string;
  project: { code: string; title: string };
  members: Array<{ userId: string; fullName: string; role: 'MEMBER' | 'LEADER' }>;
}

interface TaskView {
  id: string;
  title: string;
  description: string;
  status: string;
  dueAt: string | null;
  assignmentType: 'INDIVIDUAL' | 'TEAM' | null;
  assignedUserId: string | null;
  templateId: string;
  templateVersion: string;
  submissions: Array<{
    id: string;
    version: number;
    content: string;
    templateVersion: string;
    submittedAt: string;
  }>;
  stateHistory: Array<{
    id: string;
    fromStatus: string;
    toStatus: string;
    action: string;
    note: string | null;
  }>;
  milestones: Array<{
    id: string;
    title: string;
    status: string;
    dueAt: string | null;
    assignmentType: 'INDIVIDUAL' | 'TEAM' | null;
    assignedUserId: string | null;
    templateVersion: string;
    submissions: TaskView['submissions'];
    stateHistory: TaskView['stateHistory'];
  }>;
}

async function requestJson<T>(
  path: string,
  token: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
  });
  const body: unknown = await response.json();
  if (!response.ok) {
    const message =
      typeof body === 'object' &&
      body !== null &&
      'message' in body &&
      typeof body.message === 'string'
        ? body.message
        : `Yêu cầu thất bại (${response.status}).`;
    throw new Error(`${response.status}: ${message}`);
  }
  return body as T;
}

export const TalentTeamTasksPage: React.FC = () => {
  const { accessToken, logout, user } = useAuth();
  const [team, setTeam] = useState<TeamView | null>(null);
  const [tasks, setTasks] = useState<TaskView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState('');

  const load = useCallback(async () => {
    if (!accessToken) {
      setError('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
      setLoading(false);
      return;
    }
    try {
      const [myTeam, myTasks] = await Promise.all([
        requestJson<TeamView>('/talent/me/team', accessToken),
        requestJson<TaskView[]>('/talent/me/tasks', accessToken),
      ]);
      setTeam(myTeam);
      setTasks(myTasks);
      setError('');
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Không thể tải Team và công việc.',
      );
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    void load();
  }, [load]);

  const runAction = async (
    key: string,
    action: () => Promise<unknown>,
    message: string,
  ) => {
    setBusy(key);
    setError('');
    setNotice('');
    try {
      await action();
      await load();
      setNotice(message);
    } catch (actionError) {
      setError(
        actionError instanceof Error
          ? actionError.message
          : 'Thao tác không thành công.',
      );
    } finally {
      setBusy('');
    }
  };

  return (
    <main className="talent-workspace">
      <header>
        <h1>Team và công việc của tôi</h1>
        <nav>
          <Link to="/talent">Hồ sơ</Link>{' '}
          <Link to="/talent/projects">Dự án</Link>{' '}
          <Link to="/talent/applications">Đơn ứng tuyển</Link>{' '}
          <Link to="/talent/reports">Báo cáo & đánh giá</Link>{' '}
          <button onClick={logout}>Đăng xuất</button>
        </nav>
      </header>
      {loading && <p>Đang tải dữ liệu...</p>}
      {error && <p role="alert">{error}</p>}
      {notice && <p role="status">{notice}</p>}
      {team && (
        <section>
          <h2>{team.project.code} — {team.project.title}</h2>
          <p>Trạng thái Team: {team.status}</p>
          <ul>
            {team.members.map((member) => (
              <li key={member.userId}>
                {member.fullName} {member.role === 'LEADER' ? '(Leader)' : '(Thành viên)'}
              </li>
            ))}
          </ul>
        </section>
      )}
      {team && (
        <section>
          <h2>Công việc và cột mốc</h2>
          {tasks.length === 0 && <p>Mentor chưa tạo kế hoạch công việc.</p>}
          {tasks.map((task) => (
            <article key={task.id}>
              <h3>{task.title} · {task.status}</h3>
              <p>{task.description}</p>
              <small>
                Template {task.templateId} v{task.templateVersion} · Người thực hiện:{' '}
                {task.assignmentType === 'TEAM'
                  ? 'Cả Team'
                  : team.members.find((member) => member.userId === task.assignedUserId)?.fullName ??
                    'Chưa giao'}
              </small>
              {team.members.find((member) => member.userId === user?.id)?.role ===
                'LEADER' &&
                task.status === 'PLANNED' && (
                  <LeaderAssignment
                    members={team.members}
                    busy={busy === `assign-${task.id}`}
                    onAssign={(assignment) =>
                      runAction(
                        `assign-${task.id}`,
                        () =>
                          requestJson(
                            `/talent/me/team/tasks/${task.id}/assignment`,
                            accessToken!,
                            {
                              method: 'POST',
                              body: JSON.stringify(assignment),
                            },
                          ),
                        'Leader đã phân công công việc.',
                      )
                    }
                  />
                )}
              {(task.assignmentType === 'TEAM' || task.assignedUserId === user?.id) &&
                (task.status === 'ASSIGNED' || task.status === 'CHANGES_REQUESTED') && (
                  <button
                    disabled={busy === `start-${task.id}`}
                    onClick={() =>
                      void runAction(
                        `start-${task.id}`,
                        () =>
                          requestJson(`/talent/tasks/${task.id}/start`, accessToken!, {
                            method: 'POST',
                          }),
                        'Đã bắt đầu công việc.',
                      )
                    }
                  >
                    {task.status === 'CHANGES_REQUESTED' ? 'Tiếp tục chỉnh sửa' : 'Bắt đầu'}
                  </button>
                )}
              {(task.assignmentType === 'TEAM' || task.assignedUserId === user?.id) &&
                task.status === 'IN_PROGRESS' && (
                <SubmissionForm
                  key={`${task.id}-${task.submissions.length}-${task.status}`}
                  busy={busy === `submit-${task.id}`}
                  templateVersion={task.templateVersion}
                  onSubmit={(content, templateVersion) =>
                    runAction(
                      `submit-${task.id}`,
                      () =>
                        requestJson(`/talent/tasks/${task.id}/submissions`, accessToken!, {
                          method: 'POST',
                          body: JSON.stringify({ content, templateVersion }),
                        }),
                      'Đã nộp đầu ra, đang chờ Mentor xem xét.',
                    )
                  }
                />
              )}
              {task.submissions.map((submission) => (
                <section key={submission.id} className="submission">
                  <h4>Bản nộp v{submission.version}</h4>
                  <small>
                    Template v{submission.templateVersion} ·{' '}
                    {new Date(submission.submittedAt).toLocaleString('vi-VN')}
                  </small>
                  <pre>{submission.content}</pre>
                </section>
              ))}
              <details>
                <summary>Lịch sử Task</summary>
                <ul>
                  {task.stateHistory.map((event) => (
                    <li key={event.id}>
                      {event.fromStatus} → {event.toStatus} · {event.action}
                      {event.note ? ` · ${event.note}` : ''}
                    </li>
                  ))}
                </ul>
              </details>
              <ul>
                {task.milestones.map((milestone) => (
                  <li key={milestone.id} className="milestone">
                    <strong>{milestone.title} · {milestone.status}</strong>
                    <p>
                      Người thực hiện:{' '}
                      {milestone.assignmentType === 'TEAM'
                        ? 'Cả Team'
                        : team.members.find((member) => member.userId === milestone.assignedUserId)?.fullName ??
                          'Chưa giao'}
                    </p>
                    {team.members.find((member) => member.userId === user?.id)?.role ===
                      'LEADER' &&
                      milestone.status === 'PLANNED' && (
                        <LeaderAssignment
                          members={team.members}
                          busy={busy === `assign-milestone-${milestone.id}`}
                          onAssign={(assignment) =>
                            runAction(
                              `assign-milestone-${milestone.id}`,
                              () =>
                                requestJson(
                                  `/talent/me/team/tasks/${task.id}/milestones/${milestone.id}/assignment`,
                                  accessToken!,
                                  {
                                    method: 'POST',
                                    body: JSON.stringify(assignment),
                                  },
                                ),
                              'Leader đã phân công cột mốc.',
                            )
                          }
                        />
                      )}
                    {(milestone.assignmentType === 'TEAM' ||
                      milestone.assignedUserId === user?.id) &&
                      (milestone.status === 'ASSIGNED' ||
                        milestone.status === 'CHANGES_REQUESTED') && (
                        <button
                          disabled={busy === `start-milestone-${milestone.id}`}
                          onClick={() =>
                            void runAction(
                              `start-milestone-${milestone.id}`,
                              () =>
                                requestJson(
                                  `/talent/tasks/${task.id}/milestones/${milestone.id}/start`,
                                  accessToken!,
                                  { method: 'POST' },
                                ),
                              'Đã bắt đầu cột mốc.',
                            )
                          }
                        >
                          Bắt đầu cột mốc
                        </button>
                      )}
                    {(milestone.assignmentType === 'TEAM' ||
                      milestone.assignedUserId === user?.id) &&
                      milestone.status === 'IN_PROGRESS' && (
                        <SubmissionForm
                          key={`${milestone.id}-${milestone.submissions.length}-${milestone.status}`}
                          busy={busy === `submit-milestone-${milestone.id}`}
                          templateVersion={milestone.templateVersion}
                          onSubmit={(content, templateVersion) =>
                            runAction(
                              `submit-milestone-${milestone.id}`,
                              () =>
                                requestJson(
                                  `/talent/tasks/${task.id}/milestones/${milestone.id}/submissions`,
                                  accessToken!,
                                  {
                                    method: 'POST',
                                    body: JSON.stringify({ content, templateVersion }),
                                  },
                                ),
                              'Đã nộp đầu ra cột mốc, đang chờ Mentor xem xét.',
                            )
                          }
                        />
                      )}
                    {milestone.submissions.map((submission) => (
                      <section key={submission.id} className="submission">
                        <strong>Bản nộp v{submission.version}</strong>
                        <pre>{submission.content}</pre>
                      </section>
                    ))}
                    <details>
                      <summary>Lịch sử cột mốc</summary>
                      <ul>
                        {milestone.stateHistory.map((event) => (
                          <li key={event.id}>
                            {event.fromStatus} → {event.toStatus} · {event.action}
                            {event.note ? ` · ${event.note}` : ''}
                          </li>
                        ))}
                      </ul>
                    </details>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </section>
      )}
      <style>{`
        .talent-workspace{max-width:900px;margin:32px auto;padding:0 20px;font-family:Arial,sans-serif}
        .talent-workspace header{display:flex;align-items:center;justify-content:space-between}
        .talent-workspace section,.talent-workspace article{border:1px solid #d1d5db;border-radius:8px;padding:16px;margin:16px 0}
        .talent-workspace .milestone{margin:12px 0;padding:12px;background:#f9fafb}
        .talent-workspace .submission{background:#eef2ff;padding:12px;margin:12px 0}
        .talent-workspace pre{white-space:pre-wrap;overflow-wrap:anywhere}
        .talent-workspace form{display:grid;gap:8px;max-width:640px;margin:12px 0}
      `}</style>
    </main>
  );
};

interface LeaderAssignmentProps {
  members: TeamView['members'];
  busy: boolean;
  onAssign: (assignment: {
    assignmentType: 'INDIVIDUAL' | 'TEAM';
    userId?: string;
  }) => Promise<void>;
}

const LeaderAssignment: React.FC<LeaderAssignmentProps> = ({
  members,
  busy,
  onAssign,
}) => {
  const [userId, setUserId] = useState('');
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (userId === 'TEAM') {
          void onAssign({ assignmentType: 'TEAM' });
        } else if (userId.startsWith('USER:')) {
          void onAssign({
            assignmentType: 'INDIVIDUAL',
            userId: userId.replace(/^USER:/, ''),
          });
        }
      }}
    >
      <label>
        Giao cho thành viên
        <select
          required
          value={userId}
          onChange={(event) => setUserId(event.target.value)}
        >
          <option value="">Chọn thành viên</option>
          <option value="TEAM">Cả Team</option>
          {members.map((member) => (
            <option key={member.userId} value={`USER:${member.userId}`}>
              {member.fullName}
            </option>
          ))}
        </select>
      </label>
      <button disabled={busy || !userId}>Phân công</button>
    </form>
  );
};

interface SubmissionFormProps {
  busy: boolean;
  templateVersion: string;
  onSubmit: (content: string, templateVersion: string) => Promise<void>;
}

const SubmissionForm: React.FC<SubmissionFormProps> = ({
  busy,
  templateVersion,
  onSubmit,
}) => {
  const [content, setContent] = useState('');
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (content.trim()) void onSubmit(content, templateVersion);
      }}
    >
      <label>
        Nội dung đầu ra (tệp đính kèm sẽ được tích hợp ở bước D19)
        <textarea
          required
          maxLength={10000}
          value={content}
          onChange={(event) => setContent(event.target.value)}
        />
      </label>
      <button disabled={busy || !content.trim()}>
        Nộp bản v{templateVersion}
      </button>
    </form>
  );
};
