import React, { FormEvent, useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { UserRole } from '@labodc/shared-types';
import { useAuth } from '../../core/auth/AuthContext';
import { FileAttachmentsPanel } from '../files/FileAttachmentsPanel';

const API_BASE = 'http://localhost:3000/api/v1';

type ReportStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'IN_REVIEW'
  | 'CHANGES_REQUESTED'
  | 'APPROVED';

interface TeamMember {
  userId: string;
  fullName: string;
  role: 'MEMBER' | 'LEADER';
}

interface Team {
  id: string;
  members: TeamMember[];
}

interface ProjectTeamView {
  project: { id: string; code: string; title: string };
  team: Team | null;
}

interface MyTeamView {
  id: string;
  members: TeamMember[];
  project: ProjectTeamView['project'];
}

interface ProgressReport {
  id: string;
  projectId: string;
  teamId: string | null;
  authorUserId: string;
  authorRole: 'MENTOR' | 'TALENT_LEADER';
  periodType: 'MONTH' | 'PHASE';
  periodStart: string;
  periodEnd: string;
  summary: string;
  progress: string;
  blockers: string;
  nextSteps: string;
  status: ReportStatus;
  version: number;
  reviewerUserId: string | null;
  reviewNote: string | null;
}

interface ReportStateEvent {
  id: string;
  actorUserId: string;
  action: string;
  fromStatus: ReportStatus | null;
  toStatus: ReportStatus;
  note: string | null;
  createdAt: string;
}

interface Evaluation {
  id: string;
  projectId: string;
  subjectUserId: string;
  periodStart: string;
  periodEnd: string;
  criteria: Array<{ criterion: string; feedback: string }>;
  overallFeedback: string;
  status: 'EVALUATION_DRAFT' | 'EVALUATION_FINAL';
}

interface Contribution {
  id: string;
  projectId: string;
  userId: string;
  periodStart: string;
  periodEnd: string;
  description: string;
}

interface ReportForm {
  periodType: 'MONTH' | 'PHASE';
  periodStart: string;
  periodEnd: string;
  summary: string;
  progress: string;
  blockers: string;
  nextSteps: string;
}

const emptyReportForm: ReportForm = {
  periodType: 'MONTH',
  periodStart: '',
  periodEnd: '',
  summary: '',
  progress: '',
  blockers: '',
  nextSteps: '',
};

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

export const ProgressReportsPage: React.FC = () => {
  const { accessToken, user, logout } = useAuth();
  const [projects, setProjects] = useState<ProjectTeamView[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [reports, setReports] = useState<ProgressReport[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [reportForm, setReportForm] = useState<ReportForm>(emptyReportForm);
  const [editReportId, setEditReportId] = useState('');
  const [mentorReportScope, setMentorReportScope] = useState<'TEAM' | 'PROJECT'>('TEAM');
  const [criterion, setCriterion] = useState('');
  const [criterionFeedback, setCriterionFeedback] = useState('');
  const [overallFeedback, setOverallFeedback] = useState('');
  const [subjectUserId, setSubjectUserId] = useState('');
  const [contributionUserId, setContributionUserId] = useState('');
  const [contributionDescription, setContributionDescription] = useState('');
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [contributionPeriodStart, setContributionPeriodStart] = useState('');
  const [contributionPeriodEnd, setContributionPeriodEnd] = useState('');
  const [reviewNote, setReviewNote] = useState('');
  const [historyReportId, setHistoryReportId] = useState('');
  const [reportHistory, setReportHistory] = useState<ReportStateEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const role = user?.role;
  const isMentor = role === UserRole.MENTOR;
  const isLabAdmin = role === UserRole.LAB_ADMIN;
  const isLeader = role === UserRole.TALENT_LEADER;

  const load = useCallback(async () => {
    if (!accessToken || !role) {
      setLoading(false);
      setError('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      if (isMentor) {
        const assignedProjects = await apiRequest<ProjectTeamView[]>(
          '/mentor/me/teams',
          accessToken,
        );
        setProjects(assignedProjects);
        const selected = assignedProjects.find(
          (item) => item.project.id === selectedProjectId,
        );
        const projectId = selected?.project.id ?? assignedProjects[0]?.project.id;
        if (projectId !== selectedProjectId) {
          setSelectedProjectId(projectId ?? '');
        }
        const data = await Promise.all(
          assignedProjects.map(async ({ project }) => {
            const [projectReports, projectEvaluations, projectContributions] =
              await Promise.all([
                apiRequest<ProgressReport[]>(
                  `/mentor/projects/${project.id}/reports`,
                  accessToken,
                ),
                apiRequest<Evaluation[]>(
                  `/mentor/projects/${project.id}/evaluations`,
                  accessToken,
                ),
                apiRequest<Contribution[]>(
                  `/mentor/projects/${project.id}/contributions`,
                  accessToken,
                ),
              ]);
            return {
              reports: projectReports,
              evaluations: projectEvaluations,
              contributions: projectContributions,
            };
          }),
        );
        setReports(data.flatMap((item) => item.reports));
        setEvaluations(data.flatMap((item) => item.evaluations));
        setContributions(data.flatMap((item) => item.contributions));
      } else if (isLabAdmin) {
        const [allReports, allEvaluations, allContributions] = await Promise.all([
          apiRequest<ProgressReport[]>('/lab-admin/reports', accessToken),
          apiRequest<Evaluation[]>('/lab-admin/evaluations', accessToken),
          apiRequest<Contribution[]>('/lab-admin/contributions', accessToken),
        ]);
        setProjects([]);
        setReports(allReports);
        setEvaluations(allEvaluations);
        setContributions(allContributions);
      } else {
        const [myTeam, myReports, myEvaluations, myContributions] =
          await Promise.all([
            apiRequest<MyTeamView>('/talent/me/team', accessToken),
            apiRequest<ProgressReport[]>('/talent/me/reports', accessToken),
            apiRequest<Evaluation[]>('/talent/me/evaluations', accessToken),
            apiRequest<Contribution[]>('/talent/me/contributions', accessToken),
          ]);
        setProjects([
          {
            project: myTeam.project,
            team: { id: myTeam.id, members: myTeam.members },
          },
        ]);
        setReports(myReports);
        setEvaluations(myEvaluations);
        setContributions(myContributions);
        setSelectedProjectId(myTeam.project.id);
      }
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Không thể tải báo cáo và đánh giá.',
      );
    } finally {
      setLoading(false);
    }
  }, [accessToken, isLabAdmin, isMentor, role, selectedProjectId]);

  useEffect(() => {
    void load();
  }, [load]);

  const runAction = async (
    key: string,
    action: () => Promise<unknown>,
    successMessage: string,
  ) => {
    setBusy(key);
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
      setBusy('');
    }
  };

  const saveReport = async (event: FormEvent) => {
    event.preventDefault();
    if (!accessToken || !selectedProjectId) return;
    const selected = projects.find(
      (item) => item.project.id === selectedProjectId,
    );
    const editingReport = reports.find((report) => report.id === editReportId);
    const reportTeamId = editReportId
      ? editingReport?.teamId
      : mentorReportScope === 'TEAM'
        ? selected?.team?.id
        : undefined;
    const body = {
      ...reportForm,
      ...(isMentor && reportTeamId ? { teamId: reportTeamId } : {}),
    };
    await runAction(
      'save-report',
      async () => {
        const report = editReportId
          ? await apiRequest<ProgressReport>(
              `/reports/${editReportId}`,
              accessToken,
              { method: 'PATCH', body: JSON.stringify(body) },
            )
          : await apiRequest<ProgressReport>(
              isMentor
                ? `/mentor/projects/${selectedProjectId}/reports`
                : '/talent/me/reports',
              accessToken,
              { method: 'POST', body: JSON.stringify(body) },
            );
        if (report.status === 'DRAFT' || report.status === 'CHANGES_REQUESTED') {
          await apiRequest(`/reports/${report.id}/submit`, accessToken, {
            method: 'POST',
          });
        }
      },
      'Đã lưu và gửi báo cáo.',
    );
    setReportForm(emptyReportForm);
    setEditReportId('');
  };

  const startEditing = (report: ProgressReport) => {
    setEditReportId(report.id);
    setReportForm({
      periodType: report.periodType,
      periodStart: report.periodStart,
      periodEnd: report.periodEnd,
      summary: report.summary,
      progress: report.progress,
      blockers: report.blockers,
      nextSteps: report.nextSteps,
    });
  };

  const saveEvaluation = async (event: FormEvent) => {
    event.preventDefault();
    if (!accessToken || !selectedProjectId) return;
    await runAction(
      'save-evaluation',
      async () => {
        const draft = await apiRequest<Evaluation>(
          `/mentor/projects/${selectedProjectId}/evaluations`,
          accessToken,
          {
            method: 'POST',
            body: JSON.stringify({
              subjectUserId,
              periodStart,
              periodEnd,
              criteria: [{ criterion, feedback: criterionFeedback }],
              overallFeedback,
            }),
          },
        );
        await apiRequest(
          `/mentor/evaluations/${draft.id}/finalize`,
          accessToken,
          { method: 'POST' },
        );
      },
      'Đã chốt đánh giá và phản hồi.',
    );
    setCriterion('');
    setCriterionFeedback('');
    setOverallFeedback('');
    setSubjectUserId('');
  };

  const saveContribution = async (event: FormEvent) => {
    event.preventDefault();
    if (!accessToken || !selectedProjectId) return;
    await runAction(
      'save-contribution',
      () =>
        apiRequest(
          `/mentor/projects/${selectedProjectId}/contributions`,
          accessToken,
          {
            method: 'POST',
            body: JSON.stringify({
              userId: contributionUserId,
              periodStart: contributionPeriodStart,
              periodEnd: contributionPeriodEnd,
              description: contributionDescription,
            }),
          },
        ),
      'Đã ghi nhận đóng góp.',
    );
    setContributionDescription('');
    setContributionUserId('');
  };

  const selectedProject = projects.find(
    (item) => item.project.id === selectedProjectId,
  );

  const reviewAction = (
    report: ProgressReport,
    endpoint: string,
    body?: unknown,
  ) =>
    runAction(
      `${report.id}-${endpoint}`,
      () =>
        apiRequest(`/reports/${report.id}/${endpoint}`, accessToken ?? '', {
          method: 'POST',
          ...(body ? { body: JSON.stringify(body) } : {}),
        }),
      endpoint === 'approve' ? 'Đã duyệt báo cáo.' : 'Đã cập nhật trạng thái báo cáo.',
    );

  const finalizeEvaluation = (evaluation: Evaluation) =>
    runAction(
      `finalize-${evaluation.id}`,
      () =>
        apiRequest(
          `/mentor/evaluations/${evaluation.id}/finalize`,
          accessToken ?? '',
          { method: 'POST' },
        ),
      'Đã chốt đánh giá.',
    );

  const viewReportHistory = (reportId: string) =>
    runAction(
      `history-${reportId}`,
      async () => {
        const history = await apiRequest<ReportStateEvent[]>(
          `/reports/${reportId}/history`,
          accessToken ?? '',
        );
        setHistoryReportId(reportId);
        setReportHistory(history);
      },
      'Đã tải lịch sử báo cáo.',
    );

  if (loading) return <main><p>Đang tải báo cáo...</p></main>;

  return (
    <main style={{ maxWidth: 1100, margin: '0 auto', padding: 24 }}>
      <header style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div>
          <Link to={isMentor ? '/mentor/teams' : isLabAdmin ? '/lab-admin' : '/talent/team'}>
            Quay lại
          </Link>
          <h1>Báo cáo, đánh giá và đóng góp</h1>
          <p>Đăng nhập: {user?.email}</p>
        </div>
        <button onClick={logout}>Đăng xuất</button>
      </header>

      {error && <p role="alert" style={{ color: '#b42318' }}>{error}</p>}
      {notice && <p role="status" style={{ color: '#067647' }}>{notice}</p>}

      {isMentor && projects.length > 0 && (
        <label>
          Dự án
          <select
            value={selectedProjectId}
            onChange={(event) => setSelectedProjectId(event.target.value)}
          >
            {projects.map(({ project }) => (
              <option key={project.id} value={project.id}>
                {project.code} — {project.title}
              </option>
            ))}
          </select>
        </label>
      )}

      {isMentor && projects.length === 0 && (
        <p>Chưa có dự án được phân công cho Mentor.</p>
      )}

      {(isLeader || (isMentor && Boolean(selectedProject))) && (
        <section>
          <h2>{editReportId ? 'Cập nhật báo cáo' : 'Tạo báo cáo tháng/giai đoạn'}</h2>
          <form onSubmit={saveReport}>
            {isMentor && (
              <label>
                Phạm vi báo cáo
                <select
                  value={mentorReportScope}
                  disabled={Boolean(editReportId)}
                  onChange={(event) =>
                    setMentorReportScope(
                      event.target.value === 'PROJECT' ? 'PROJECT' : 'TEAM',
                    )
                  }
                >
                  <option value="TEAM" disabled={!selectedProject?.team}>
                    Team
                  </option>
                  <option value="PROJECT">Project</option>
                </select>
              </label>
            )}
            <label>
              Loại kỳ
              <select
                value={reportForm.periodType}
                onChange={(event) =>
                  setReportForm({
                    ...reportForm,
                    periodType: event.target.value as ReportForm['periodType'],
                  })
                }
              >
                <option value="MONTH">Tháng</option>
                <option value="PHASE">Giai đoạn</option>
              </select>
            </label>
            <label>
              Từ ngày
              <input
                type="date"
                required
                value={reportForm.periodStart}
                onChange={(event) =>
                  setReportForm({ ...reportForm, periodStart: event.target.value })
                }
              />
            </label>
            <label>
              Đến ngày
              <input
                type="date"
                required
                value={reportForm.periodEnd}
                onChange={(event) =>
                  setReportForm({ ...reportForm, periodEnd: event.target.value })
                }
              />
            </label>
            {([
              ['summary', 'Tóm tắt'],
              ['progress', 'Tiến độ'],
              ['blockers', 'Vướng mắc'],
              ['nextSteps', 'Bước tiếp theo'],
            ] as const).map(([field, label]) => (
              <label key={field} style={{ display: 'block', marginTop: 8 }}>
                {label}
                <textarea
                  required={field !== 'blockers'}
                  maxLength={5000}
                  value={reportForm[field]}
                  onChange={(event) =>
                    setReportForm({ ...reportForm, [field]: event.target.value })
                  }
                />
              </label>
            ))}
            <button type="submit" disabled={busy === 'save-report'}>
              {busy === 'save-report' ? 'Đang lưu...' : 'Lưu và gửi báo cáo'}
            </button>
            {editReportId && (
              <button
                type="button"
                onClick={() => {
                  setEditReportId('');
                  setReportForm(emptyReportForm);
                }}
              >
                Hủy sửa
              </button>
            )}
          </form>
        </section>
      )}

      {isMentor && selectedProject?.team && (
        <section>
          <h2>Đánh giá Mentor và ghi nhận đóng góp</h2>
          <form onSubmit={saveEvaluation}>
            <label>
              Thành viên
              <select
                required
                value={subjectUserId}
                onChange={(event) => setSubjectUserId(event.target.value)}
              >
                <option value="">Chọn thành viên</option>
                {selectedProject.team.members.map((member) => (
                  <option key={member.userId} value={member.userId}>
                    {member.fullName} ({member.role})
                  </option>
                ))}
              </select>
            </label>
            <label>
              Từ ngày
              <input type="date" required value={periodStart} onChange={(event) => setPeriodStart(event.target.value)} />
            </label>
            <label>
              Đến ngày
              <input type="date" required value={periodEnd} onChange={(event) => setPeriodEnd(event.target.value)} />
            </label>
            <label>
              Tiêu chí rubric
              <input required value={criterion} onChange={(event) => setCriterion(event.target.value)} />
            </label>
            <label>
              Feedback tiêu chí
              <textarea required value={criterionFeedback} onChange={(event) => setCriterionFeedback(event.target.value)} />
            </label>
            <label>
              Feedback tổng quan
              <textarea required value={overallFeedback} onChange={(event) => setOverallFeedback(event.target.value)} />
            </label>
            <button type="submit" disabled={busy === 'save-evaluation'}>
              {busy === 'save-evaluation' ? 'Đang lưu...' : 'Chốt đánh giá'}
            </button>
          </form>

          <form onSubmit={saveContribution}>
            <h3>Ghi nhận đóng góp</h3>
            <label>
              Thành viên
              <select
                required
                value={contributionUserId}
                onChange={(event) => setContributionUserId(event.target.value)}
              >
                <option value="">Chọn thành viên</option>
                {selectedProject.team.members.map((member) => (
                  <option key={member.userId} value={member.userId}>
                    {member.fullName}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Từ ngày
              <input
                type="date"
                required
                value={contributionPeriodStart}
                onChange={(event) => setContributionPeriodStart(event.target.value)}
              />
            </label>
            <label>
              Đến ngày
              <input
                type="date"
                required
                value={contributionPeriodEnd}
                onChange={(event) => setContributionPeriodEnd(event.target.value)}
              />
            </label>
            <label>
              Mô tả đóng góp
              <textarea
                required
                maxLength={2000}
                value={contributionDescription}
                onChange={(event) => setContributionDescription(event.target.value)}
              />
            </label>
            <button type="submit" disabled={busy === 'save-contribution'}>
              Ghi nhận đóng góp
            </button>
          </form>
        </section>
      )}

      <section>
        <h2>Báo cáo ({reports.length})</h2>
        {reports.length === 0 && <p>Chưa có báo cáo.</p>}
        {reports.map((report) => (
          <article key={report.id} style={{ border: '1px solid #ddd', padding: 12, margin: '12px 0' }}>
            <h3>{report.periodType === 'MONTH' ? 'Báo cáo tháng' : 'Báo cáo giai đoạn'} · {report.periodStart} — {report.periodEnd}</h3>
            {(isLabAdmin || isMentor) && <p>Project: {report.projectId}</p>}
            <p>Trạng thái: <strong>{report.status}</strong> · phiên bản {report.version}</p>
            <p>{report.summary}</p>
            <p>Tiến độ: {report.progress}</p>
            {report.blockers && <p>Vướng mắc: {report.blockers}</p>}
            <p>Bước tiếp theo: {report.nextSteps}</p>
            {report.reviewNote && <p>Ghi chú review: {report.reviewNote}</p>}
            <FileAttachmentsPanel
              category="REPORT_DOCUMENT"
              reportId={report.id}
              canUpload={
                isMentor || isLabAdmin || report.authorUserId === user?.id
              }
            />
            <button
              disabled={Boolean(busy)}
              onClick={() => void viewReportHistory(report.id)}
            >
              Xem lịch sử
            </button>
            {(isMentor || isLabAdmin) && report.status === 'SUBMITTED' && (
              <button
                disabled={Boolean(busy)}
                onClick={() => void reviewAction(report, 'start-review')}
              >
                Tiếp nhận review
              </button>
            )}
            {(isMentor || isLabAdmin) && report.status === 'IN_REVIEW' && (
              <>
                <button
                  disabled={Boolean(busy)}
                  onClick={() => void reviewAction(report, 'approve')}
                >
                  Duyệt
                </button>
                <input
                  aria-label="Nhận xét yêu cầu chỉnh sửa"
                  placeholder="Ghi chú bắt buộc khi trả chỉnh sửa"
                  value={reviewNote}
                  onChange={(event) => setReviewNote(event.target.value)}
                />
                <button
                  disabled={Boolean(busy) || !reviewNote.trim()}
                  onClick={() =>
                    void reviewAction(report, 'request-changes', { note: reviewNote })
                  }
                >
                  Yêu cầu chỉnh sửa
                </button>
              </>
            )}
            {isLeader &&
              report.authorUserId === user?.id &&
              ['DRAFT', 'CHANGES_REQUESTED'].includes(report.status) && (
                <button onClick={() => startEditing(report)}>Sửa và gửi lại</button>
              )}
            {isMentor &&
              report.authorUserId === user?.id &&
              ['DRAFT', 'CHANGES_REQUESTED'].includes(report.status) && (
                <button onClick={() => startEditing(report)}>Sửa và gửi lại</button>
              )}
            {historyReportId === report.id && (
              <ol>
                {reportHistory.map((event) => (
                  <li key={event.id}>
                    {event.createdAt} — {event.action} ({event.fromStatus ?? '—'} → {event.toStatus})
                    {event.note && `: ${event.note}`}
                  </li>
                ))}
              </ol>
            )}
          </article>
        ))}
      </section>

      <section>
        <h2>Đánh giá ({evaluations.length})</h2>
        {evaluations.map((evaluation) => (
          <article key={evaluation.id} style={{ border: '1px solid #ddd', padding: 12, margin: '12px 0' }}>
            <p>Kỳ: {evaluation.periodStart} — {evaluation.periodEnd}</p>
            {(isLabAdmin || isMentor) && <p>Thành viên: {evaluation.subjectUserId}</p>}
            <p>Trạng thái: {evaluation.status}</p>
            {evaluation.criteria.map((item, index) => (
              <p key={`${evaluation.id}-${index}`}>
                <strong>{item.criterion}:</strong> {item.feedback}
              </p>
            ))}
            <p>{evaluation.overallFeedback}</p>
            {isMentor && evaluation.status === 'EVALUATION_DRAFT' && (
              <button
                disabled={Boolean(busy)}
                onClick={() => void finalizeEvaluation(evaluation)}
              >
                Chốt đánh giá
              </button>
            )}
          </article>
        ))}
        {evaluations.length === 0 && <p>Chưa có đánh giá được phép hiển thị.</p>}
      </section>

      <section>
        <h2>Ghi nhận đóng góp ({contributions.length})</h2>
        {contributions.map((record) => (
          <article key={record.id}>
            <p>
              {record.periodStart} — {record.periodEnd}
              {(isLabAdmin || isMentor) && ` · Thành viên ${record.userId}`}: {record.description}
            </p>
          </article>
        ))}
        {contributions.length === 0 && <p>Chưa có ghi nhận đóng góp.</p>}
      </section>
    </main>
  );
};
