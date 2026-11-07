import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../core/auth/AuthContext';
import { FileAttachmentsPanel } from '../files/FileAttachmentsPanel';

const API_BASE = 'http://localhost:3000/api/v1';

interface TeamMember {
  userId: string;
  applicationId: string;
  fullName: string;
  role: 'MEMBER' | 'LEADER';
}

interface Team {
  id: string;
  status: 'FORMING' | 'ACTIVE';
  members: TeamMember[];
  leaderHistory: Array<{ subjectUserId: string; previousUserId: string | null }>;
}

interface EligibleApplication {
  applicationId: string;
  userId: string;
  fullName: string;
}

interface ProjectTeamView {
  project: {
    id: string;
    code: string;
    title: string;
    minTeamSize: number;
    maxTeamSize: number;
  };
  team: Team | null;
  eligibleApplications: EligibleApplication[];
}

interface TemplateMetadata {
  id: string;
  name: string;
  kind: 'TASK' | 'MILESTONE';
  version: string;
  approvalStatus: 'DEMO/NOT_APPROVED';
  documentName: string;
  fileReference: null;
}

interface Task {
  id: string;
  title: string;
  description: string;
  dueAt: string | null;
  status: string;
  assignmentType: 'INDIVIDUAL' | 'TEAM' | null;
  assignedUserId: string | null;
  templateId: string;
  templateVersion: string;
  submissions: Array<{
    id: string;
    version: number;
    content: string;
    templateVersion: string;
    submittedBy: string;
    submittedAt: string;
  }>;
  stateHistory: Array<{
    id: string;
    fromStatus: string;
    toStatus: string;
    action: string;
    actorUserId: string;
    note: string | null;
  }>;
  milestones: Array<{
    id: string;
    title: string;
    status: string;
    dueAt: string | null;
    assignmentType: 'INDIVIDUAL' | 'TEAM' | null;
    assignedUserId: string | null;
    templateId: string;
    templateVersion: string;
    submissions: Task['submissions'];
    stateHistory: Task['stateHistory'];
  }>;
}

interface ProjectWorkspace extends ProjectTeamView {
  templates: TemplateMetadata[];
  tasks: Task[];
}

async function apiRequest<T>(
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
    throw new Error(message);
  }
  return body as T;
}

export const MentorTeamsPage: React.FC = () => {
  const { accessToken, logout } = useAuth();
  const [workspaces, setWorkspaces] = useState<ProjectWorkspace[]>([]);
  const [selectedApplications, setSelectedApplications] = useState<
    Record<string, string[]>
  >({});
  const [newMemberApplications, setNewMemberApplications] = useState<
    Record<string, string>
  >({});
  const [taskDrafts, setTaskDrafts] = useState<
    Record<string, { title: string; description: string; dueAt: string }>
  >({});
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    if (!accessToken) {
      setLoading(false);
      setError('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const projects = await apiRequest<ProjectTeamView[]>(
        '/mentor/me/teams',
        accessToken,
      );
      const fullWorkspaces = await Promise.all(
        projects.map(async (project) => {
          const [templates, tasks] = await Promise.all([
            apiRequest<TemplateMetadata[]>(
              `/mentor/projects/${project.project.id}/templates`,
              accessToken,
            ),
            apiRequest<Task[]>(
              `/mentor/projects/${project.project.id}/tasks`,
              accessToken,
            ),
          ]);
          return { ...project, templates, tasks };
        }),
      );
      setWorkspaces(fullWorkspaces);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Không thể tải dữ liệu Team và công việc.',
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
    successMessage: string,
  ) => {
    setBusyKey(key);
    setError('');
    setNotice('');
    try {
      await action();
      await load();
      setNotice(successMessage);
    } catch (actionError) {
      setError(
        actionError instanceof Error
          ? actionError.message
          : 'Thao tác không thành công.',
      );
    } finally {
      setBusyKey('');
    }
  };

  const toggleApplication = (projectId: string, applicationId: string) => {
    setSelectedApplications((current) => {
      const selected = current[projectId] ?? [];
      return {
        ...current,
        [projectId]: selected.includes(applicationId)
          ? selected.filter((item) => item !== applicationId)
          : [...selected, applicationId],
      };
    });
  };

  const updateTaskDraft = (
    projectId: string,
    field: 'title' | 'description' | 'dueAt',
    value: string,
  ) => {
    setTaskDrafts((current) => {
      const draft = current[projectId] ?? { title: '', description: '', dueAt: '' };
      return {
        ...current,
        [projectId]: { ...draft, [field]: value },
      };
    });
  };

  if (loading) return <main className="ops-page">Đang tải Team và kế hoạch công việc...</main>;

  return (
    <main className="ops-page">
      <header className="ops-header">
        <div>
          <h1>Quản lý Team và kế hoạch dự án</h1>
          <p>Chỉ thao tác trên dự án được phân công cho Mentor.</p>
        </div>
        <div className="ops-inline">
          <Link to="/mentor/applications">Ứng viên</Link>
          <Link to="/mentor/reports">Báo cáo & đánh giá</Link>
          <button onClick={logout}>Đăng xuất</button>
        </div>
      </header>
      {error && <p role="alert" className="ops-alert">{error}</p>}
      {notice && <p role="status" className="ops-notice">{notice}</p>}
      {workspaces.length === 0 && !error && (
        <p>Chưa có dự án được phân công cho bạn.</p>
      )}
      {workspaces.map((workspace) => {
        const { project, team, eligibleApplications, templates, tasks } = workspace;
        const selected = selectedApplications[project.id] ?? [];
        const taskTemplate = templates.find((item) => item.kind === 'TASK');
        return (
          <section className="ops-card" key={project.id}>
            <h2>{project.code} — {project.title}</h2>
            <p>Quy mô Team: {project.minTeamSize}–{project.maxTeamSize}</p>
            {!team ? (
              <div>
                <h3>Thành lập Team</h3>
                {eligibleApplications.length === 0 ? (
                  <p>Chưa có đủ đơn ACCEPTED chưa thuộc Team khác.</p>
                ) : (
                  <fieldset>
                    <legend>Chọn thành viên có đơn ACCEPTED</legend>
                    {eligibleApplications.map((candidate) => (
                      <label className="ops-option" key={candidate.applicationId}>
                        <input
                          type="checkbox"
                          checked={selected.includes(candidate.applicationId)}
                          onChange={() =>
                            toggleApplication(project.id, candidate.applicationId)
                          }
                        />
                        {candidate.fullName}
                      </label>
                    ))}
                  </fieldset>
                )}
                <button
                  disabled={
                    busyKey === `team-${project.id}` ||
                    selected.length < project.minTeamSize ||
                    selected.length > project.maxTeamSize
                  }
                  onClick={() =>
                    void runAction(
                      `team-${project.id}`,
                      () =>
                        apiRequest(`/mentor/projects/${project.id}/team`, accessToken!, {
                          method: 'POST',
                          body: JSON.stringify({ applicationIds: selected }),
                        }),
                      'Đã thành lập Team.',
                    )
                  }
                >
                  Tạo Team
                </button>
              </div>
            ) : (
              <div>
                <h3>Team — {team.status === 'ACTIVE' ? 'Đang hoạt động' : 'Đang hình thành'}</h3>
                <ul>
                  {team.members.map((member) => (
                    <li key={member.userId}>
                      {member.fullName} {member.role === 'LEADER' ? '(Leader)' : '(Thành viên)'}
                      {team.status === 'FORMING' &&
                        team.members.length - 1 >= project.minTeamSize && (
                          <button
                            disabled={busyKey === `remove-${member.userId}`}
                            onClick={() =>
                              void runAction(
                                `remove-${member.userId}`,
                                () =>
                                  apiRequest(
                                    `/mentor/teams/${team.id}/members/${member.userId}`,
                                    accessToken!,
                                    { method: 'DELETE' },
                                  ),
                                'Đã cập nhật thành viên Team.',
                              )
                            }
                          >
                            Xóa khỏi Team
                          </button>
                        )}
                    </li>
                  ))}
                </ul>
                {eligibleApplications.length > 0 && team.status === 'FORMING' && (
                  <div className="ops-inline">
                    <select
                      aria-label={`Thêm thành viên cho ${project.title}`}
                      value={newMemberApplications[project.id] ?? ''}
                      onChange={(event) =>
                        setNewMemberApplications((current) => ({
                          ...current,
                          [project.id]: event.target.value,
                        }))
                      }
                    >
                      <option value="">Chọn ứng viên ACCEPTED</option>
                      {eligibleApplications.map((candidate) => (
                        <option key={candidate.applicationId} value={candidate.applicationId}>
                          {candidate.fullName}
                        </option>
                      ))}
                    </select>
                    <button
                      disabled={
                        !newMemberApplications[project.id] ||
                        team.members.length >= project.maxTeamSize
                      }
                      onClick={() =>
                        void runAction(
                          `add-${project.id}`,
                          () =>
                            apiRequest(`/mentor/teams/${team.id}/members`, accessToken!, {
                              method: 'POST',
                              body: JSON.stringify({
                                applicationId: newMemberApplications[project.id],
                              }),
                            }),
                          'Đã thêm thành viên vào Team.',
                        )
                      }
                    >
                      Thêm thành viên
                    </button>
                  </div>
                )}
                {team.members.length > 0 && (
                  <div className="ops-inline">
                    <select
                      aria-label={`Chọn Leader cho ${project.title}`}
                      value=""
                      onChange={(event) => {
                        const userId = event.target.value;
                        if (!userId) return;
                        void runAction(
                          `leader-${project.id}`,
                          () =>
                            apiRequest(`/mentor/teams/${team.id}/leader`, accessToken!, {
                              method: 'POST',
                              body: JSON.stringify({ userId }),
                            }),
                          'Đã bổ nhiệm Leader.',
                        );
                      }}
                    >
                      <option value="">Bổ nhiệm Leader...</option>
                      {team.members.map((member) => (
                        <option key={member.userId} value={member.userId}>
                          {member.fullName}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}

            <hr />
            <h3>Template và lập kế hoạch</h3>
            <p className="ops-warning">
              Template đang ở trạng thái DEMO/NOT_APPROVED; không phải tài liệu chính thức của Lab.
              File thật chỉ được tích hợp sau khi Lab cung cấp.
            </p>
            <ul>
              {templates.map((template) => (
                <li key={`${template.id}-${template.version}`}>
                  {template.name} · v{template.version} · {template.approvalStatus}
                  {template.fileReference === null && ' · Chưa có file/reference tải xuống'}
                </li>
              ))}
            </ul>
            {team?.status === 'ACTIVE' && taskTemplate && (
              <form
                className="ops-form"
                onSubmit={(event) => {
                  event.preventDefault();
                  const draft = taskDrafts[project.id] ?? {
                    title: '',
                    description: '',
                    dueAt: '',
                  };
                  void runAction(
                    `task-${project.id}`,
                    () =>
                      apiRequest(`/mentor/projects/${project.id}/tasks`, accessToken!, {
                        method: 'POST',
                        body: JSON.stringify({
                          title: draft.title,
                          description: draft.description,
                          dueAt: draft.dueAt
                            ? new Date(draft.dueAt).toISOString()
                            : null,
                          templateId: taskTemplate.id,
                          templateVersion: taskTemplate.version,
                        }),
                      }),
                    'Đã tạo công việc ở trạng thái PLANNED.',
                  );
                }}
              >
                <label>
                  Tên công việc
                  <input
                    required
                    value={taskDrafts[project.id]?.title ?? ''}
                    onChange={(event) => updateTaskDraft(project.id, 'title', event.target.value)}
                  />
                </label>
                <label>
                  Mô tả
                  <textarea
                    value={taskDrafts[project.id]?.description ?? ''}
                    onChange={(event) =>
                      updateTaskDraft(project.id, 'description', event.target.value)
                    }
                  />
                </label>
                <label>
                  Hạn dự kiến
                  <input
                    type="datetime-local"
                    value={taskDrafts[project.id]?.dueAt ?? ''}
                    onChange={(event) => updateTaskDraft(project.id, 'dueAt', event.target.value)}
                  />
                </label>
                <button disabled={busyKey === `task-${project.id}`}>Tạo công việc (PLANNED)</button>
              </form>
            )}
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                members={team?.members ?? []}
                templates={templates}
                token={accessToken!}
                onAction={runAction}
              />
            ))}
          </section>
        );
      })}
      <style>{`
        .ops-page{max-width:1000px;margin:32px auto;padding:0 20px;font-family:Arial,sans-serif;color:#1f2937}
        .ops-header,.ops-inline{display:flex;align-items:center;justify-content:space-between;gap:12px}
        .ops-card{border:1px solid #d1d5db;border-radius:10px;padding:20px;margin:20px 0;background:#fff}
        .ops-option{display:block;margin:8px 0}
        .ops-form{display:grid;gap:12px;max-width:600px;margin:16px 0}
        .ops-form label{display:grid;gap:5px}
        .ops-form input,.ops-form textarea,.ops-inline select{padding:8px}
        .ops-form textarea{min-height:64px}
        .ops-warning{padding:10px;background:#fff7ed;border-left:4px solid #f59e0b}
        .ops-alert{color:#991b1b;background:#fee2e2;padding:10px}
        .ops-notice{color:#166534;background:#dcfce7;padding:10px}
        button{margin:4px;padding:7px 10px;cursor:pointer}
      `}</style>
    </main>
  );
};

interface TaskCardProps {
  task: Task;
  members: TeamMember[];
  templates: TemplateMetadata[];
  token: string;
  onAction: (
    key: string,
    action: () => Promise<unknown>,
    successMessage: string,
  ) => Promise<void>;
}

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  members,
  templates,
  token,
  onAction,
}) => {
  const [milestoneTitle, setMilestoneTitle] = useState('');
  const [selectedAssignee, setSelectedAssignee] = useState('');
  const [milestoneAssignees, setMilestoneAssignees] = useState<Record<string, string>>({});
  const [reviewNote, setReviewNote] = useState('');
  const milestoneTemplate = templates.find((template) => template.kind === 'MILESTONE');
  const taskAssignee = members.find((member) => member.userId === task.assignedUserId);

  return (
    <article className="ops-task">
      <h4>{task.title} · {task.status}</h4>
      <p>{task.description}</p>
      <FileAttachmentsPanel category="TASK_DOCUMENT" taskId={task.id} />
      <small>
        Template {task.templateId} v{task.templateVersion} · Người thực hiện:{' '}
        {task.assignmentType === 'TEAM'
          ? 'Cả Team'
          : taskAssignee?.fullName ?? 'Chưa giao'}
      </small>
      {task.status === 'PLANNED' && (
        <form
          className="ops-inline"
          onSubmit={(event) => {
            event.preventDefault();
            void onAction(
              `assign-${task.id}`,
              () =>
                apiRequest(`/mentor/tasks/${task.id}/assignment`, token, {
                  method: 'POST',
                  body: JSON.stringify(
                    selectedAssignee === 'TEAM'
                      ? { assignmentType: 'TEAM' }
                      : {
                          assignmentType: 'INDIVIDUAL',
                          userId: selectedAssignee.replace(/^USER:/, ''),
                        },
                  ),
                }),
              'Đã giao công việc; trạng thái chuyển sang ASSIGNED.',
            );
          }}
        >
          <select
            required
            aria-label={`Giao công việc ${task.title}`}
            value={selectedAssignee}
            onChange={(event) => setSelectedAssignee(event.target.value)}
          >
            <option value="">Chọn thành viên thực hiện</option>
            <option value="TEAM">Cả Team</option>
            {members.map((member) => (
              <option key={member.userId} value={`USER:${member.userId}`}>{member.fullName}</option>
            ))}
          </select>
          <button disabled={!selectedAssignee}>Giao task</button>
        </form>
      )}
      {task.submissions.map((submission) => (
        <section className="ops-submission" key={submission.id}>
          <h5>Bản nộp v{submission.version} · {new Date(submission.submittedAt).toLocaleString('vi-VN')}</h5>
          <p>Template version: {submission.templateVersion}</p>
          <pre>{submission.content}</pre>
        </section>
      ))}
      {task.status === 'SUBMITTED_FOR_REVIEW' && (
        <div className="ops-inline">
          <input
            aria-label={`Ghi chú phản hồi ${task.title}`}
            value={reviewNote}
            onChange={(event) => setReviewNote(event.target.value)}
            placeholder="Ghi chú bắt buộc nếu yêu cầu sửa"
          />
          <button
            onClick={() =>
              void onAction(
                `review-${task.id}`,
                () =>
                  apiRequest(`/mentor/tasks/${task.id}/review`, token, {
                    method: 'POST',
                    body: JSON.stringify({ decision: 'APPROVE' }),
                  }),
                'Đã duyệt đầu ra; task hoàn tất.',
              )
            }
          >
            Duyệt hoàn thành
          </button>
          <button
            disabled={!reviewNote.trim()}
            onClick={() =>
              void onAction(
                `review-${task.id}`,
                () =>
                  apiRequest(`/mentor/tasks/${task.id}/review`, token, {
                    method: 'POST',
                    body: JSON.stringify({
                      decision: 'REQUEST_CHANGES',
                      note: reviewNote,
                    }),
                  }),
                'Đã yêu cầu chỉnh sửa.',
              )
            }
          >
            Yêu cầu chỉnh sửa
          </button>
        </div>
      )}
      <details>
        <summary>Lịch sử trạng thái công việc</summary>
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
          <li key={milestone.id} className="ops-milestone">
            {milestone.title} · {milestone.status} · {milestone.templateId} v{milestone.templateVersion}
            {' · Người thực hiện: '}
            {milestone.assignmentType === 'TEAM'
              ? 'Cả Team'
              : members.find((member) => member.userId === milestone.assignedUserId)?.fullName ??
                'Chưa giao'}
            {milestone.status === 'PLANNED' && (
              <form
                className="ops-inline"
                onSubmit={(event) => {
                  event.preventDefault();
                  void onAction(
                    `assign-milestone-${milestone.id}`,
                    () =>
                      apiRequest(
                        `/mentor/tasks/${task.id}/milestones/${milestone.id}/assignment`,
                        token,
                        {
                          method: 'POST',
                          body: JSON.stringify(
                            milestoneAssignees[milestone.id] === 'TEAM'
                              ? { assignmentType: 'TEAM' }
                              : {
                                  assignmentType: 'INDIVIDUAL',
                                  userId: milestoneAssignees[milestone.id]?.replace(
                                    /^USER:/,
                                    '',
                                  ),
                                },
                          ),
                        },
                      ),
                    'Đã giao cột mốc.',
                  );
                }}
              >
                <select
                  required
                  aria-label={`Giao cột mốc ${milestone.title}`}
                  value={milestoneAssignees[milestone.id] ?? ''}
                  onChange={(event) =>
                    setMilestoneAssignees((current) => ({
                      ...current,
                      [milestone.id]: event.target.value,
                    }))
                  }
                >
                  <option value="">Chọn thành viên thực hiện</option>
                  <option value="TEAM">Cả Team</option>
                  {members.map((member) => (
                    <option key={member.userId} value={`USER:${member.userId}`}>{member.fullName}</option>
                  ))}
                </select>
                <button>Giao milestone</button>
              </form>
            )}
            {milestone.submissions.map((submission) => (
              <div className="ops-submission" key={submission.id}>
                <strong>Bản nộp v{submission.version}</strong>
                <p>{submission.content}</p>
              </div>
            ))}
            {milestone.status === 'SUBMITTED_FOR_REVIEW' && (
              <div className="ops-inline">
                <button
                  onClick={() =>
                    void onAction(
                      `review-milestone-${milestone.id}`,
                      () =>
                        apiRequest(
                          `/mentor/tasks/${task.id}/milestones/${milestone.id}/review`,
                          token,
                          {
                            method: 'POST',
                            body: JSON.stringify({ decision: 'APPROVE' }),
                          },
                        ),
                      'Đã duyệt cột mốc.',
                    )
                  }
                >
                  Duyệt milestone
                </button>
                <button
                  disabled={!reviewNote.trim()}
                  onClick={() =>
                    void onAction(
                      `review-milestone-${milestone.id}`,
                      () =>
                        apiRequest(
                          `/mentor/tasks/${task.id}/milestones/${milestone.id}/review`,
                          token,
                          {
                            method: 'POST',
                            body: JSON.stringify({
                              decision: 'REQUEST_CHANGES',
                              note: reviewNote,
                            }),
                          },
                        ),
                      'Đã yêu cầu chỉnh sửa milestone.',
                    )
                  }
                >
                  Yêu cầu sửa
                </button>
              </div>
            )}
            <details>
              <summary>Lịch sử trạng thái milestone</summary>
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
      {milestoneTemplate && (
        <form
          className="ops-inline"
          onSubmit={(event) => {
            event.preventDefault();
            void onAction(
              `milestone-${task.id}`,
              () =>
                apiRequest(`/mentor/tasks/${task.id}/milestones`, token, {
                  method: 'POST',
                  body: JSON.stringify({
                    title: milestoneTitle,
                    templateId: milestoneTemplate.id,
                    templateVersion: milestoneTemplate.version,
                  }),
                }),
              'Đã thêm cột mốc PLANNED.',
            );
            setMilestoneTitle('');
          }}
        >
          <input
            required
            aria-label={`Tên cột mốc cho ${task.title}`}
            value={milestoneTitle}
            onChange={(event) => setMilestoneTitle(event.target.value)}
            placeholder="Tên cột mốc"
          />
          <button>Thêm cột mốc</button>
        </form>
      )}
      <style>{`.ops-task{border:1px solid #e5e7eb;padding:12px;margin:12px 0;border-radius:8px}`}</style>
      <style>{`.ops-milestone{margin:12px 0}.ops-submission{background:#f9fafb;padding:10px;margin:8px 0;white-space:pre-wrap}.ops-submission pre{white-space:pre-wrap;overflow-wrap:anywhere}`}</style>
    </article>
  );
};
