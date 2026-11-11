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
  candidateAcknowledgedAt?: string | null;
  candidateFeedback?: string | null;
  candidateFeedbackAt?: string | null;
}

interface Contribution {
  id: string;
  projectId: string;
  userId: string;
  periodStart: string;
  periodEnd: string;
  description: string;
}

type AllocationProposalStatus = 'PENDING' | 'APPROVED' | 'CHANGES_REQUESTED';

interface AllocationProposal {
  id: string;
  teamId: string;
  proposerUserId: string;
  periodStart: string;
  periodEnd: string;
  allocations: Array<{ userId: string; shareBps: number }>;
  rationale: string;
  status: AllocationProposalStatus;
  reviewNote: string | null;
  events: Array<{
    actorUserId: string;
    action: string;
    createdAt: string;
    note: string | null;
  }>;
}

interface TeamPerformanceSummary {
  teamId: string;
  periodStart: string;
  periodEnd: string;
  totals: {
    contributionCount: number;
    finalizedEvaluationCount: number;
  };
  members: Array<{
    userId: string;
    contributionCount: number;
    contributions: Array<{
      periodStart: string;
      periodEnd: string;
      description: string;
    }>;
    finalizedEvaluationCount: number;
  }>;
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

function defaultAllocationShares(members: TeamMember[]): Record<string, string> {
  if (members.length === 0) return {};
  const baseShare = Math.floor(10000 / members.length);
  const remainder = 10000 - baseShare * members.length;
  return Object.fromEntries(
    members.map((member, index) => [
      member.userId,
      ((baseShare + (index < remainder ? 1 : 0)) / 100).toFixed(2),
    ]),
  );
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

export const ProgressReportsPage: React.FC = () => {
  const { accessToken, user, logout } = useAuth();
  const [projects, setProjects] = useState<ProjectTeamView[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [reports, setReports] = useState<ProgressReport[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [allocationProposals, setAllocationProposals] = useState<AllocationProposal[]>([]);
  const [allocationShares, setAllocationShares] = useState<Record<string, string>>({});
  const [allocationPeriodStart, setAllocationPeriodStart] = useState('');
  const [allocationPeriodEnd, setAllocationPeriodEnd] = useState('');
  const [allocationRationale, setAllocationRationale] = useState('');
  const [editingAllocationProposalId, setEditingAllocationProposalId] = useState('');
  const [allocationReviewNote, setAllocationReviewNote] = useState('');
  const [performancePeriodStart, setPerformancePeriodStart] = useState('');
  const [performancePeriodEnd, setPerformancePeriodEnd] = useState('');
  const [performanceSummary, setPerformanceSummary] = useState<TeamPerformanceSummary | null>(null);
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
            const projectTeam = assignedProjects.find(
              (item) => item.project.id === project.id,
            )?.team;
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
              team: projectTeam,
              reports: projectReports,
              evaluations: projectEvaluations,
              contributions: projectContributions,
            };
          }),
        );
        setReports(data.flatMap((item) => item.reports));
        setEvaluations(data.flatMap((item) => item.evaluations));
        setContributions(data.flatMap((item) => item.contributions));
        const teamForRequests =
          assignedProjects.find((item) => item.project.id === projectId)?.team;
        const proposalLists = await Promise.all(
          data.map((item) =>
            item.team
              ? apiRequest<AllocationProposal[]>(
                  `/mentor/teams/${item.team.id}/allocation-proposals`,
                  accessToken,
                )
              : Promise.resolve([]),
          ),
        );
        setAllocationProposals(proposalLists.flat());
        if (teamForRequests) {
          setAllocationShares(defaultAllocationShares(teamForRequests.members));
        }
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
        setAllocationProposals([]);
      } else {
        const [myTeam, myReports, myEvaluations, myContributions, proposals] =
          await Promise.all([
            apiRequest<MyTeamView>('/talent/me/team', accessToken),
            apiRequest<ProgressReport[]>('/talent/me/reports', accessToken),
            apiRequest<Evaluation[]>('/talent/me/evaluations', accessToken),
            apiRequest<Contribution[]>('/talent/me/contributions', accessToken),
            isLeader
              ? apiRequest<AllocationProposal[]>(
                  '/talent/me/team/allocation-proposals',
                  accessToken,
                )
              : Promise.resolve([]),
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
        setAllocationProposals(proposals);
        setAllocationShares(defaultAllocationShares(myTeam.members));
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
  }, [accessToken, isLabAdmin, isLeader, isMentor, role, selectedProjectId]);

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
  const enteredAllocationBps =
    selectedProject?.team?.members.reduce((total, member) => {
      const basisPoints = Number(allocationShares[member.userId]) * 100;
      return total + (Number.isInteger(basisPoints) ? basisPoints : 0);
    }, 0) ?? 0;

  const saveAllocationProposal = async (event: FormEvent) => {
    event.preventDefault();
    if (!accessToken || !selectedProject?.team) return;
    const allocations = selectedProject.team.members.map((member) => {
      const percent = Number(allocationShares[member.userId]);
      return {
        userId: member.userId,
        shareBps: Number.isFinite(percent) ? percent * 100 : Number.NaN,
      };
    });
    if (
      allocations.some((allocation) => !Number.isInteger(allocation.shareBps)) ||
      allocations.reduce((total, allocation) => total + allocation.shareBps, 0) !==
        10000
    ) {
      setError('Tổng tỷ lệ phân bổ phải đúng 100,00%.');
      return;
    }
    const input = {
      periodStart: allocationPeriodStart,
      periodEnd: allocationPeriodEnd,
      allocations,
      rationale: allocationRationale,
    };
    await runAction(
      'save-allocation',
      () =>
        apiRequest(
          editingAllocationProposalId
            ? `/talent/me/team/allocation-proposals/${editingAllocationProposalId}`
            : '/talent/me/team/allocation-proposals',
          accessToken,
          {
            method: editingAllocationProposalId ? 'PATCH' : 'POST',
            body: JSON.stringify(input),
          },
        ),
      'Đã lưu đề xuất phân bổ để Mentor xem xét. Chưa có giao dịch tài chính nào được thực hiện.',
    );
    setEditingAllocationProposalId('');
    setAllocationRationale('');
  };

  const editAllocationProposal = (proposal: AllocationProposal) => {
    setEditingAllocationProposalId(proposal.id);
    setAllocationPeriodStart(proposal.periodStart);
    setAllocationPeriodEnd(proposal.periodEnd);
    setAllocationRationale(proposal.rationale);
    setAllocationShares(
      Object.fromEntries(
        proposal.allocations.map((allocation) => [
          allocation.userId,
          (allocation.shareBps / 100).toFixed(2),
        ]),
      ),
    );
  };

  const reviewAllocationProposal = (
    proposal: AllocationProposal,
    action: 'approve' | 'request-changes',
  ) =>
    runAction(
      `${action}-${proposal.id}`,
      () =>
        apiRequest(
          `/mentor/allocation-proposals/${proposal.id}/${action}`,
          accessToken ?? '',
          {
            method: 'POST',
            ...(action === 'request-changes'
              ? { body: JSON.stringify({ note: allocationReviewNote }) }
              : {}),
          },
        ),
      action === 'approve'
        ? 'Đã duyệt đề xuất nội bộ; không có giao dịch tài chính nào được thực hiện.'
        : 'Đã yêu cầu Leader chỉnh sửa đề xuất.',
    );

  const loadPerformanceSummary = () => {
    if (!accessToken || !selectedProject) return;
    const teamId = selectedProject.team?.id;
    if (isMentor && !teamId) {
      setError('Dự án chưa có Team để tổng hợp hiệu suất.');
      return;
    }
    void runAction(
      'team-performance',
      async () => {
        const query = new URLSearchParams({
          periodStart: performancePeriodStart,
          periodEnd: performancePeriodEnd,
        });
        const endpoint = isMentor
          ? `/mentor/teams/${teamId}/performance?${query}`
          : `/talent/me/team/performance?${query}`;
        const summary = await apiRequest<TeamPerformanceSummary>(
          endpoint,
          accessToken,
        );
        setPerformanceSummary(summary);
      },
      'Đã tổng hợp đóng góp và số đánh giá đã chốt.',
    );
  };

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

      {isLeader && selectedProject?.team && (
        <section>
          <h2>Đề xuất phân bổ nội bộ</h2>
          <p>
            Tỷ lệ áp dụng trong phần 70% của Team, tổng tỷ lệ thành viên phải là
            100%. Đây chỉ là đề xuất cần Mentor duyệt, không tạo thanh toán và
            không thay đổi ledger.
          </p>
          <form onSubmit={saveAllocationProposal}>
            <label>
              Từ ngày
              <input
                type="date"
                required
                value={allocationPeriodStart}
                onChange={(event) => setAllocationPeriodStart(event.target.value)}
              />
            </label>
            <label>
              Đến ngày
              <input
                type="date"
                required
                value={allocationPeriodEnd}
                onChange={(event) => setAllocationPeriodEnd(event.target.value)}
              />
            </label>
            {selectedProject.team.members.map((member) => (
              <label key={member.userId} style={{ display: 'block', marginTop: 8 }}>
                {member.fullName} — tỷ lệ (%)
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  required
                  value={allocationShares[member.userId] ?? ''}
                  onChange={(event) =>
                    setAllocationShares({
                      ...allocationShares,
                      [member.userId]: event.target.value,
                    })
                  }
                />
              </label>
            ))}
            <p>Tổng tỷ lệ: {(enteredAllocationBps / 100).toFixed(2)}% / 100,00%</p>
            <label style={{ display: 'block', marginTop: 8 }}>
              Lý do đề xuất
              <textarea
                required
                minLength={3}
                maxLength={2000}
                value={allocationRationale}
                onChange={(event) => setAllocationRationale(event.target.value)}
              />
            </label>
            <button type="submit" disabled={Boolean(busy)}>
              {editingAllocationProposalId
                ? 'Cập nhật đề xuất'
                : 'Gửi đề xuất'}
            </button>
            {editingAllocationProposalId && (
              <button
                type="button"
                onClick={() => {
                  setEditingAllocationProposalId('');
                  setAllocationRationale('');
                  setAllocationShares(
                    defaultAllocationShares(selectedProject.team!.members),
                  );
                }}
              >
                Hủy chỉnh sửa
              </button>
            )}
          </form>
          <h3>Lịch sử đề xuất</h3>
          {allocationProposals.length === 0 && <p>Chưa có đề xuất phân bổ.</p>}
          {allocationProposals.map((proposal) => (
            <article
              key={proposal.id}
              style={{ border: '1px solid #ddd', padding: 12, margin: '12px 0' }}
            >
              <p>
                Kỳ: {proposal.periodStart} — {proposal.periodEnd} ·{' '}
                <strong>{proposal.status}</strong>
              </p>
              <p>{proposal.rationale}</p>
              <ul>
                {proposal.allocations.map((allocation) => (
                  <li key={allocation.userId}>
                    {selectedProject.team!.members.find(
                      (member) => member.userId === allocation.userId,
                    )?.fullName ?? allocation.userId}
                    : {(allocation.shareBps / 100).toFixed(2)}%
                  </li>
                ))}
              </ul>
              {proposal.reviewNote && <p>Phản hồi Mentor: {proposal.reviewNote}</p>}
              {proposal.events.map((event) => (
                <p key={`${proposal.id}-${event.createdAt}-${event.action}`}>
                  {event.createdAt} — {event.action}
                  {event.note ? `: ${event.note}` : ''}
                </p>
              ))}
              {proposal.status !== 'APPROVED' && (
                <button
                  type="button"
                  disabled={Boolean(busy)}
                  onClick={() => editAllocationProposal(proposal)}
                >
                  Chỉnh sửa đề xuất
                </button>
              )}
            </article>
          ))}
        </section>
      )}

      {isMentor && selectedProject?.team && (
        <section>
          <h2>Duyệt đề xuất phân bổ nội bộ</h2>
          {allocationProposals
            .filter((proposal) => proposal.teamId === selectedProject.team?.id)
            .map((proposal) => (
              <article
                key={proposal.id}
                style={{ border: '1px solid #ddd', padding: 12, margin: '12px 0' }}
              >
                <p>
                  Kỳ: {proposal.periodStart} — {proposal.periodEnd} ·{' '}
                  <strong>{proposal.status}</strong>
                </p>
                <p>Leader: {proposal.proposerUserId}</p>
                <p>{proposal.rationale}</p>
                <ul>
                  {proposal.allocations.map((allocation) => (
                    <li key={allocation.userId}>
                      {selectedProject.team!.members.find(
                        (member) => member.userId === allocation.userId,
                      )?.fullName ?? allocation.userId}
                      : {(allocation.shareBps / 100).toFixed(2)}%
                    </li>
                  ))}
                </ul>
                {proposal.reviewNote && <p>Ghi chú: {proposal.reviewNote}</p>}
                {proposal.status === 'PENDING' && (
                  <>
                    <button
                      type="button"
                      disabled={Boolean(busy)}
                      onClick={() => void reviewAllocationProposal(proposal, 'approve')}
                    >
                      Duyệt đề xuất
                    </button>
                    <label>
                      Yêu cầu chỉnh sửa
                      <input
                        value={allocationReviewNote}
                        onChange={(event) =>
                          setAllocationReviewNote(event.target.value)
                        }
                      />
                    </label>
                    <button
                      type="button"
                      disabled={Boolean(busy) || allocationReviewNote.trim().length < 3}
                      onClick={() =>
                        void reviewAllocationProposal(proposal, 'request-changes')
                      }
                    >
                      Trả yêu cầu chỉnh sửa
                    </button>
                  </>
                )}
              </article>
            ))}
          {allocationProposals.filter(
            (proposal) =>
              proposal.teamId === selectedProject.team?.id &&
              proposal.status === 'PENDING',
          ).length === 0 && <p>Không có đề xuất đang chờ duyệt.</p>}
        </section>
      )}

      {(isLeader || (isMentor && Boolean(selectedProject?.team))) && (
        <section>
          <h2>Báo cáo hiệu suất nhóm</h2>
          <p>
            Tổng hợp đóng góp và số đánh giá đã chốt trong kỳ; không hiển thị
            nội dung phản hồi đánh giá hoặc tự tạo điểm số.
          </p>
          <label>
            Từ ngày
            <input
              type="date"
              required
              value={performancePeriodStart}
              onChange={(event) => {
                setPerformancePeriodStart(event.target.value);
                setPerformanceSummary(null);
              }}
            />
          </label>
          <label>
            Đến ngày
            <input
              type="date"
              required
              value={performancePeriodEnd}
              onChange={(event) => {
                setPerformancePeriodEnd(event.target.value);
                setPerformanceSummary(null);
              }}
            />
          </label>
          <button
            type="button"
            disabled={Boolean(busy) || !performancePeriodStart || !performancePeriodEnd}
            onClick={loadPerformanceSummary}
          >
            Tổng hợp hiệu suất
          </button>
          {performanceSummary && (
            <div>
              <p>
                Kỳ: {performanceSummary.periodStart} — {performanceSummary.periodEnd}
              </p>
              <p>
                Tổng: {performanceSummary.totals.contributionCount} đóng góp ·{' '}
                {performanceSummary.totals.finalizedEvaluationCount} đánh giá đã chốt
              </p>
              {performanceSummary.members.map((member) => (
                <article key={member.userId}>
                  <h3>
                    {selectedProject?.team?.members.find(
                      (item) => item.userId === member.userId,
                    )?.fullName ?? member.userId}
                  </h3>
                  <p>
                    {member.contributionCount} đóng góp ·{' '}
                    {member.finalizedEvaluationCount} đánh giá đã chốt
                  </p>
                  <ul>
                    {member.contributions.map((item, index) => (
                      <li key={`${member.userId}-${item.periodStart}-${index}`}>
                        {item.periodStart} — {item.periodEnd}: {item.description}
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          )}
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
            {isMentor && (
              <>
                <p>
                  Talent xác nhận đã nhận:{' '}
                  {evaluation.candidateAcknowledgedAt ?? 'Chưa xác nhận'}
                </p>
                <p>
                  Phản hồi từ Talent:{' '}
                  {evaluation.candidateFeedback ?? 'Chưa có phản hồi'}
                </p>
              </>
            )}
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
