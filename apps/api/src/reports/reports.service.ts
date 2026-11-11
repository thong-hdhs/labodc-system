import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { JwtPayload, UserRole } from '@labodc/shared-types';
import { ProjectProposalRepository } from '../projects/project-proposal.repository';
import { TeamEntity } from '../teams/team.types';
import { TeamsService } from '../teams/teams.service';
import { ReportRepository } from './report.repository';
import {
  CreateContributionInput,
  CreateEvaluationInput,
  ProgressReport,
  ReportContentInput,
  ReportStatus,
  TeamAllocationProposal,
  TeamAllocationProposalInput,
  TeamPerformanceSummary,
} from './report.types';

const REPORT_TEXT_LIMIT = 5000;
const FEEDBACK_LIMIT = 2000;

@Injectable()
export class ReportsService {
  constructor(
    private readonly repository: ReportRepository,
    private readonly teams: TeamsService,
    private readonly projects: ProjectProposalRepository,
  ) {}

  createMentorReport(
    user: JwtPayload,
    projectId: string,
    input: ReportContentInput,
  ): ProgressReport {
    this.assertMentorProject(user, projectId);
    this.validateReportInput(input);
    let teamId: string | null = null;
    if (input.teamId) {
      const team = this.teams.getMentorTeam(user, input.teamId);
      if (team.projectId !== projectId) {
        throw new BadRequestException('Team không thuộc dự án báo cáo.');
      }
      teamId = team.id;
    }
    return this.repository.createReport(
      projectId,
      teamId,
      user.sub,
      'MENTOR',
      input,
    );
  }

  createTeamReport(user: JwtPayload, input: ReportContentInput): ProgressReport {
    if (user.role !== UserRole.TALENT_LEADER || input?.teamId) {
      throw new ForbiddenException('Chỉ Leader hiện tại mới được tạo báo cáo nhóm.');
    }
    const team = this.teams.getMyTeamEntity(user.sub);
    if (this.teams.getTeamMemberRole(team.id, user.sub) !== 'LEADER') {
      throw new ForbiddenException('Bạn không phải Leader hiện tại của Team.');
    }
    this.validateReportInput(input);
    return this.repository.createReport(
      team.projectId,
      team.id,
      user.sub,
      'TALENT_LEADER',
      input,
    );
  }

  updateReport(
    user: JwtPayload,
    reportId: string,
    input: ReportContentInput,
  ): ProgressReport {
    const report = this.getReport(reportId);
    this.assertReportAuthor(user, report);
    this.validateReportInput(input);
    if (report.authorRole === 'TALENT_LEADER' && input.teamId !== undefined) {
      throw new BadRequestException('Leader không được chỉ định lại Team của báo cáo.');
    }
    if (report.teamId && input.teamId && report.teamId !== input.teamId) {
      throw new BadRequestException('Không thể đổi Team của báo cáo đã tạo.');
    }
    if (report.authorRole === 'MENTOR' && input.teamId) {
      const team = this.teams.getMentorTeam(user, input.teamId);
      if (team.projectId !== report.projectId || team.id !== report.teamId) {
        throw new BadRequestException('Team không thuộc phạm vi báo cáo.');
      }
    }
    return this.repository.updateReport(reportId, user.sub, input);
  }

  submitReport(user: JwtPayload, reportId: string): ProgressReport {
    const report = this.getReport(reportId);
    this.assertReportAuthor(user, report);
    if (!['DRAFT', 'CHANGES_REQUESTED'].includes(report.status)) {
      throw new ConflictException('Chỉ báo cáo nháp hoặc được trả lại mới có thể gửi.');
    }
    const status: ReportStatus = 'SUBMITTED';
    const action = report.status === 'CHANGES_REQUESTED' ? 'RESUBMITTED' : 'SUBMITTED';
    return this.repository.transitionReport(
      reportId,
      user.sub,
      action,
      status,
      null,
    );
  }

  startReportReview(user: JwtPayload, reportId: string): ProgressReport {
    const report = this.getReport(reportId);
    this.assertReviewer(user, report.projectId);
    if (report.status !== 'SUBMITTED') {
      throw new ConflictException('Chỉ báo cáo đã gửi mới được tiếp nhận xét duyệt.');
    }
    return this.repository.transitionReport(
      reportId,
      user.sub,
      'REVIEW_STARTED',
      'IN_REVIEW',
      null,
      user.sub,
    );
  }

  requestReportChanges(
    user: JwtPayload,
    reportId: string,
    note: unknown,
  ): ProgressReport {
    const report = this.getReport(reportId);
    this.assertReviewer(user, report.projectId);
    if (report.status !== 'IN_REVIEW') {
      throw new ConflictException('Chỉ báo cáo đang được review mới có thể trả chỉnh sửa.');
    }
    if (report.reviewerUserId !== user.sub) {
      throw new ForbiddenException('Chỉ reviewer đã tiếp nhận mới được xử lý báo cáo.');
    }
    if (!this.isText(note, 3, FEEDBACK_LIMIT)) {
      throw new BadRequestException('Nhận xét yêu cầu chỉnh sửa phải từ 3 đến 2000 ký tự.');
    }
    return this.repository.transitionReport(
      reportId,
      user.sub,
      'CHANGES_REQUESTED',
      'CHANGES_REQUESTED',
      note.trim(),
    );
  }

  approveReport(user: JwtPayload, reportId: string): ProgressReport {
    const report = this.getReport(reportId);
    this.assertReviewer(user, report.projectId);
    if (report.status !== 'IN_REVIEW') {
      throw new ConflictException('Chỉ báo cáo đang được review mới có thể duyệt.');
    }
    if (report.reviewerUserId !== user.sub) {
      throw new ForbiddenException('Chỉ reviewer đã tiếp nhận mới được xử lý báo cáo.');
    }
    return this.repository.transitionReport(
      reportId,
      user.sub,
      'APPROVED',
      'APPROVED',
      null,
    );
  }

  listMentorReports(user: JwtPayload, projectId: string): ProgressReport[] {
    this.assertMentorProject(user, projectId);
    return this.repository.findReportsByProject(projectId);
  }

  listLabReports(user: JwtPayload, projectId?: string): ProgressReport[] {
    this.assertLabAdmin(user);
    if (projectId && !this.projects.findById(projectId)) {
      throw new NotFoundException('Không tìm thấy dự án.');
    }
    return projectId
      ? this.repository.findReportsByProject(projectId)
      : this.repository.findAllReports();
  }

  listTalentReports(user: JwtPayload): ProgressReport[] {
    const team = this.teams.getMyTeamEntity(user.sub);
    return this.repository
      .findReportsByProject(team.projectId)
      .filter((report) => report.teamId === team.id);
  }

  assertCanAccessReportFiles(
    user: JwtPayload,
    reportId: string,
    action: 'READ' | 'UPLOAD',
  ): ProgressReport {
    const report = this.getReport(reportId);
    if (user.role === UserRole.LAB_ADMIN) return report;
    if (user.role === UserRole.MENTOR) {
      this.assertMentorProject(user, report.projectId);
      return report;
    }

    const team = this.teams.getMyTeamEntity(user.sub);
    if (!report.teamId || report.teamId !== team.id) {
      throw new ForbiddenException('Bạn không có quyền truy cập tệp báo cáo này.');
    }
    if (
      action === 'UPLOAD' &&
      (report.authorRole !== 'TALENT_LEADER' ||
        report.authorUserId !== user.sub ||
        this.teams.getTeamMemberRole(team.id, user.sub) !== 'LEADER')
    ) {
      throw new ForbiddenException('Chỉ Leader là tác giả mới được đính kèm tệp báo cáo.');
    }
    return report;
  }

  getReportHistory(user: JwtPayload, reportId: string) {
    const report = this.getReport(reportId);
    if (user.role === UserRole.LAB_ADMIN) {
      return this.repository.getReportHistory(reportId);
    }
    if (user.role === UserRole.MENTOR) {
      this.assertMentorProject(user, report.projectId);
      return this.repository.getReportHistory(reportId);
    }
    const team = this.teams.getMyTeamEntity(user.sub);
    if (report.teamId !== team.id) {
      throw new ForbiddenException('Bạn không có quyền xem lịch sử báo cáo này.');
    }
    return this.repository.getReportHistory(reportId);
  }

  createEvaluation(
    user: JwtPayload,
    projectId: string,
    input: CreateEvaluationInput,
  ) {
    const team = this.getMentorTeam(user, projectId);
    this.validateEvaluationInput(input);
    this.assertTeamMember(team, input.subjectUserId);
    return this.repository.createEvaluation(
      projectId,
      team.id,
      user.sub,
      input,
    );
  }

  finalizeEvaluation(user: JwtPayload, evaluationId: string) {
    const evaluation = this.getEvaluation(evaluationId);
    this.assertMentorProject(user, evaluation.projectId);
    if (evaluation.mentorUserId !== user.sub) {
      throw new ForbiddenException('Chỉ tác giả Mentor mới được chốt đánh giá.');
    }
    if (evaluation.criteria.length === 0 || !evaluation.overallFeedback.trim()) {
      throw new BadRequestException('Cần có rubric và phản hồi tổng quan trước khi chốt.');
    }
    return this.repository.finalizeEvaluation(evaluationId, user.sub);
  }

  acknowledgeEvaluation(user: JwtPayload, evaluationId: string) {
    const evaluation = this.getEvaluation(evaluationId);
    this.assertEvaluationSubject(user, evaluation.subjectUserId);
    if (evaluation.status !== 'EVALUATION_FINAL') {
      throw new ConflictException('Chỉ có thể xác nhận đánh giá đã được Mentor chốt.');
    }
    return this.repository.acknowledgeEvaluation(evaluationId, user.sub);
  }

  submitEvaluationFeedback(
    user: JwtPayload,
    evaluationId: string,
    feedback: unknown,
  ) {
    const evaluation = this.getEvaluation(evaluationId);
    this.assertEvaluationSubject(user, evaluation.subjectUserId);
    if (evaluation.status !== 'EVALUATION_FINAL') {
      throw new ConflictException('Chỉ có thể phản hồi đánh giá đã được Mentor chốt.');
    }
    if (!this.isText(feedback, 3, FEEDBACK_LIMIT)) {
      throw new BadRequestException('Phản hồi cần từ 3 đến 2000 ký tự.');
    }
    return this.repository.submitEvaluationFeedback(
      evaluationId,
      user.sub,
      feedback.trim(),
    );
  }

  listMentorEvaluations(user: JwtPayload, projectId: string) {
    this.assertMentorProject(user, projectId);
    return this.repository.findEvaluationsByProject(projectId);
  }

  listLabEvaluations(user: JwtPayload, projectId?: string) {
    this.assertLabAdmin(user);
    if (projectId && !this.projects.findById(projectId)) {
      throw new NotFoundException('Không tìm thấy dự án.');
    }
    const evaluations = projectId
      ? this.repository.findEvaluationsByProject(projectId)
      : this.repository.findAllEvaluations();
    return evaluations.map((evaluation) => ({
      id: evaluation.id,
      projectId: evaluation.projectId,
      teamId: evaluation.teamId,
      subjectUserId: evaluation.subjectUserId,
      mentorUserId: evaluation.mentorUserId,
      periodStart: evaluation.periodStart,
      periodEnd: evaluation.periodEnd,
      criteria: evaluation.criteria,
      overallFeedback: evaluation.overallFeedback,
      status: evaluation.status,
      createdAt: evaluation.createdAt,
      finalizedAt: evaluation.finalizedAt,
    }));
  }

  listTalentEvaluations(user: JwtPayload) {
    return this.repository
      .findAllEvaluations()
      .filter(
        (evaluation) =>
          evaluation.subjectUserId === user.sub &&
          evaluation.status === 'EVALUATION_FINAL',
      );
  }

  createContribution(
    user: JwtPayload,
    projectId: string,
    input: CreateContributionInput,
  ) {
    const team = this.getMentorTeam(user, projectId);
    this.validateContributionInput(input);
    this.assertTeamMember(team, input.userId);
    return this.repository.createContribution(
      projectId,
      team.id,
      user.sub,
      input,
    );
  }

  listMentorContributions(user: JwtPayload, projectId: string) {
    this.assertMentorProject(user, projectId);
    return this.repository
      .findContributionsByProject(projectId)
      .filter((record) => record.teamId === this.getMentorTeam(user, projectId).id);
  }

  listLabContributions(user: JwtPayload, projectId?: string) {
    this.assertLabAdmin(user);
    if (projectId && !this.projects.findById(projectId)) {
      throw new NotFoundException('Không tìm thấy dự án.');
    }
    return projectId
      ? this.repository.findContributionsByProject(projectId)
      : this.repository.findAllContributions();
  }

  listTalentContributions(user: JwtPayload) {
    return this.repository
      .findAllContributions()
      .filter((record) => record.userId === user.sub);
  }

  listLeaderAllocationProposals(user: JwtPayload) {
    const team = this.getLeaderTeam(user);
    return this.repository.findAllocationProposalsByTeam(team.id);
  }

  createAllocationProposal(
    user: JwtPayload,
    input: TeamAllocationProposalInput,
  ): TeamAllocationProposal {
    const team = this.getLeaderTeam(user);
    this.validateAllocationProposalInput(
      input,
      team.members.map((member) => member.userId),
    );
    const reviewerUserId = this.teams.getAssignedMentorUserId(team.projectId);
    return this.repository.createAllocationProposal(
      team.projectId,
      team.id,
      user.sub,
      reviewerUserId,
      team.updatedAt,
      team.members.map((member) => member.userId),
      input,
    );
  }

  updateAllocationProposal(
    user: JwtPayload,
    proposalId: string,
    input: TeamAllocationProposalInput,
  ): TeamAllocationProposal {
    const proposal = this.getAllocationProposal(proposalId);
    const team = this.getLeaderTeam(user);
    if (proposal.teamId !== team.id) {
      throw new ForbiddenException('Đề xuất không thuộc Team hiện tại của Leader.');
    }
    this.validateAllocationProposalInput(
      input,
      team.members.map((member) => member.userId),
    );
    const reviewerUserId = this.teams.getAssignedMentorUserId(team.projectId);
    return this.repository.updateAllocationProposal(
      proposalId,
      user.sub,
      reviewerUserId,
      team.updatedAt,
      team.members.map((member) => member.userId),
      input,
    );
  }

  listMentorAllocationProposals(user: JwtPayload, teamId: string) {
    const team = this.teams.getMentorTeam(user, teamId);
    return this.repository.findAllocationProposalsByTeam(team.id);
  }

  approveAllocationProposal(
    user: JwtPayload,
    proposalId: string,
  ): TeamAllocationProposal {
    const proposal = this.getAllocationProposal(proposalId);
    this.assertAllocationProposalReviewer(user, proposal);
    this.assertProposalTeamIsCurrent(user, proposal);
    return this.repository.transitionAllocationProposal(
      proposalId,
      user.sub,
      'APPROVED',
      'APPROVED',
      null,
    );
  }

  requestAllocationProposalChanges(
    user: JwtPayload,
    proposalId: string,
    note: unknown,
  ): TeamAllocationProposal {
    const proposal = this.getAllocationProposal(proposalId);
    this.assertAllocationProposalReviewer(user, proposal);
    this.assertProposalTeamIsCurrent(user, proposal);
    if (!this.isText(note, 3, FEEDBACK_LIMIT)) {
      throw new BadRequestException('Ghi chú yêu cầu chỉnh sửa phải từ 3 đến 2000 ký tự.');
    }
    return this.repository.transitionAllocationProposal(
      proposalId,
      user.sub,
      'CHANGES_REQUESTED',
      'CHANGES_REQUESTED',
      note.trim(),
    );
  }

  getLeaderTeamPerformance(
    user: JwtPayload,
    periodStart: unknown,
    periodEnd: unknown,
  ): TeamPerformanceSummary {
    const team = this.getLeaderTeam(user);
    return this.buildTeamPerformanceSummary(team, periodStart, periodEnd);
  }

  getMentorTeamPerformance(
    user: JwtPayload,
    teamId: string,
    periodStart: unknown,
    periodEnd: unknown,
  ): TeamPerformanceSummary {
    const team = this.teams.getMentorTeam(user, teamId);
    return this.buildTeamPerformanceSummary(team, periodStart, periodEnd);
  }

  private getReport(reportId: string): ProgressReport {
    const report = this.repository.findReportById(reportId);
    if (!report) throw new NotFoundException('Không tìm thấy báo cáo.');
    return report;
  }

  private getEvaluation(evaluationId: string) {
    const evaluation = this.repository.findEvaluationById(evaluationId);
    if (!evaluation) throw new NotFoundException('Không tìm thấy đánh giá.');
    return evaluation;
  }

  private getAllocationProposal(proposalId: string): TeamAllocationProposal {
    const proposal = this.repository.findAllocationProposalById(proposalId);
    if (!proposal) throw new NotFoundException('Không tìm thấy đề xuất phân bổ.');
    return proposal;
  }

  private getLeaderTeam(user: JwtPayload): TeamEntity {
    if (user.role !== UserRole.TALENT_LEADER) {
      throw new ForbiddenException('Chỉ Leader hiện tại mới được truy cập chức năng này.');
    }
    const team = this.teams.getMyTeamEntity(user.sub);
    if (
      team.status !== 'ACTIVE' ||
      this.teams.getTeamMemberRole(team.id, user.sub) !== 'LEADER'
    ) {
      throw new ForbiddenException('Chỉ Leader hiện tại của Team đang hoạt động mới được phép.');
    }
    return team;
  }

  private assertAllocationProposalReviewer(
    user: JwtPayload,
    proposal: TeamAllocationProposal,
  ): void {
    if (user.role !== UserRole.MENTOR) {
      throw new ForbiddenException('Chỉ Mentor được phân công mới được duyệt đề xuất.');
    }
    this.teams.assertMentorProject(user, proposal.projectId);
    if (proposal.reviewerUserId !== user.sub) {
      throw new ForbiddenException('Chỉ Mentor được ghi nhận trên đề xuất mới được xử lý.');
    }
  }

  private assertProposalTeamIsCurrent(
    user: JwtPayload,
    proposal: TeamAllocationProposal,
  ): void {
    const team = this.teams.getMentorTeamForProject(user, proposal.projectId);
    const currentMemberIds = team.members.map((member) => member.userId).sort();
    if (
      team.status !== 'ACTIVE' ||
      team.id !== proposal.teamId ||
      team.updatedAt !== proposal.teamUpdatedAt ||
      this.teams.getTeamMemberRole(team.id, proposal.proposerUserId) !== 'LEADER' ||
      currentMemberIds.length !== proposal.memberUserIds.length ||
      currentMemberIds.some(
        (userId, index) => userId !== proposal.memberUserIds[index],
      )
    ) {
      throw new ConflictException(
        'Đề xuất đã cũ do thay đổi thành viên hoặc Leader; yêu cầu cập nhật lại.',
      );
    }
  }

  private validateAllocationProposalInput(
    input: TeamAllocationProposalInput,
    currentMemberIds: string[],
  ): void {
    const allocationIds = Array.isArray(input?.allocations)
      ? input.allocations.map((allocation) => allocation?.userId)
      : [];
    if (
      !input ||
      !this.isValidPeriod(input.periodStart, input.periodEnd) ||
      !Array.isArray(input.allocations) ||
      input.allocations.length !== currentMemberIds.length ||
      allocationIds.some((id) => typeof id !== 'string') ||
      new Set(allocationIds).size !== allocationIds.length ||
      allocationIds.some(
        (id) => typeof id !== 'string' || !currentMemberIds.includes(id),
      ) ||
      input.allocations.some(
        (allocation) =>
          !allocation ||
          Object.keys(allocation).some(
            (key) => key !== 'userId' && key !== 'shareBps',
          ) ||
          typeof allocation.userId !== 'string' ||
          !Number.isInteger(allocation.shareBps) ||
          allocation.shareBps < 0 ||
          allocation.shareBps > 10000,
      ) ||
      input.allocations.reduce(
        (total, allocation) =>
          total +
          (Number.isInteger(allocation?.shareBps) ? allocation.shareBps : 0),
        0,
      ) !== 10000 ||
      !this.isText(input.rationale, 3, FEEDBACK_LIMIT)
    ) {
      throw new BadRequestException(
        'Đề xuất cần kỳ hợp lệ, đủ mỗi thành viên đúng một lần, tổng tỷ lệ đúng 10000 điểm cơ bản và lý do từ 3 đến 2000 ký tự.',
      );
    }
  }

  private buildTeamPerformanceSummary(
    team: TeamEntity,
    periodStart: unknown,
    periodEnd: unknown,
  ): TeamPerformanceSummary {
    if (
      typeof periodStart !== 'string' ||
      typeof periodEnd !== 'string' ||
      !this.isValidPeriod(periodStart, periodEnd)
    ) {
      throw new BadRequestException('Khoảng ngày báo cáo không hợp lệ.');
    }
    const start = periodStart;
    const end = periodEnd;
    const memberUserIds = new Set(team.members.map((member) => member.userId));
    const contributions = this.repository
      .findContributionsByProject(team.projectId)
      .filter(
        (record) =>
          record.teamId === team.id &&
          memberUserIds.has(record.userId) &&
          record.periodStart <= end &&
          record.periodEnd >= start,
      );
    const evaluations = this.repository
      .findEvaluationsByProject(team.projectId)
      .filter(
        (evaluation) =>
          evaluation.teamId === team.id &&
          memberUserIds.has(evaluation.subjectUserId) &&
          evaluation.status === 'EVALUATION_FINAL' &&
          evaluation.periodStart <= end &&
          evaluation.periodEnd >= start,
      );
    const members = team.members.map((member) => {
      const memberContributions = contributions
        .filter((record) => record.userId === member.userId)
        .map((record) => ({
          periodStart: record.periodStart,
          periodEnd: record.periodEnd,
          description: record.description,
        }));
      return {
        userId: member.userId,
        contributionCount: memberContributions.length,
        contributions: memberContributions,
        finalizedEvaluationCount: evaluations.filter(
          (evaluation) => evaluation.subjectUserId === member.userId,
        ).length,
      };
    });
    return {
      teamId: team.id,
      periodStart: start,
      periodEnd: end,
      totals: {
        contributionCount: contributions.length,
        finalizedEvaluationCount: evaluations.length,
      },
      members,
    };
  }

  private getMentorTeam(user: JwtPayload, projectId: string): TeamEntity {
    this.assertMentorProject(user, projectId);
    return this.teams.getMentorTeamForProject(user, projectId);
  }

  private assertMentorProject(user: JwtPayload, projectId: string): void {
    if (user.role !== UserRole.MENTOR) {
      throw new ForbiddenException('Chỉ Mentor được phân công mới có quyền.');
    }
    this.teams.assertMentorProject(user, projectId);
  }

  private assertReviewer(user: JwtPayload, projectId: string): void {
    if (user.role === UserRole.MENTOR) {
      this.assertMentorProject(user, projectId);
      return;
    }
    if (user.role === UserRole.LAB_ADMIN) {
      this.assertLabAdmin(user);
      if (!this.projects.findById(projectId)) {
        throw new NotFoundException('Không tìm thấy dự án.');
      }
      return;
    }
    throw new ForbiddenException('Chỉ Mentor phụ trách hoặc Lab Admin mới được review.');
  }

  private assertLabAdmin(user: JwtPayload): void {
    if (user.role !== UserRole.LAB_ADMIN) {
      throw new ForbiddenException('Chỉ Lab Admin mới có quyền truy cập.');
    }
  }

  private assertReportAuthor(user: JwtPayload, report: ProgressReport): void {
    if (
      user.sub !== report.authorUserId ||
      user.role !== report.authorRole
    ) {
      throw new ForbiddenException('Chỉ tác giả báo cáo mới được chỉnh sửa hoặc gửi.');
    }
    if (report.authorRole === 'MENTOR') {
      this.assertMentorProject(user, report.projectId);
      return;
    }
    const team = this.teams.getMyTeamEntity(user.sub);
    if (
      team.id !== report.teamId ||
      this.teams.getTeamMemberRole(team.id, user.sub) !== 'LEADER'
    ) {
      throw new ForbiddenException('Chỉ Leader hiện tại của Team mới được gửi báo cáo.');
    }
  }

  private assertTeamMember(team: TeamEntity, userId: string): void {
    if (!team.members.some((member) => member.userId === userId)) {
      throw new BadRequestException('Thành viên phải thuộc Team của dự án.');
    }
  }

  private assertEvaluationSubject(user: JwtPayload, subjectUserId: string): void {
    if (
      (user.role !== UserRole.TALENT &&
        user.role !== UserRole.TALENT_LEADER) ||
      user.sub !== subjectUserId
    ) {
      throw new ForbiddenException(
        'Chỉ Talent được đánh giá mới có thể xác nhận hoặc gửi phản hồi.',
      );
    }
  }

  private validateReportInput(input: ReportContentInput): void {
    if (
      !input ||
      !['MONTH', 'PHASE'].includes(input.periodType) ||
      !this.isValidPeriod(input.periodStart, input.periodEnd) ||
      !this.isText(input.summary, 1, REPORT_TEXT_LIMIT) ||
      !this.isText(input.progress, 1, REPORT_TEXT_LIMIT) ||
      !this.isText(input.blockers, 0, REPORT_TEXT_LIMIT) ||
      !this.isText(input.nextSteps, 1, REPORT_TEXT_LIMIT)
    ) {
      throw new BadRequestException(
        'Báo cáo cần kỳ hợp lệ, ngày bắt đầu/kết thúc đúng thứ tự và đủ tóm tắt, tiến độ, bước tiếp theo.',
      );
    }
  }

  private validateEvaluationInput(input: CreateEvaluationInput): void {
    if (
      !input ||
      !this.isValidPeriod(input.periodStart, input.periodEnd) ||
      !Array.isArray(input.criteria) ||
      input.criteria.length === 0 ||
      input.criteria.length > 30 ||
      input.criteria.some(
        (item) =>
          !item ||
          Object.keys(item).some(
            (key) => key !== 'criterion' && key !== 'feedback',
          ) ||
          !this.isText(item.criterion, 1, 200) ||
          !this.isText(item.feedback, 1, FEEDBACK_LIMIT),
      ) ||
      !this.isText(input.overallFeedback, 1, FEEDBACK_LIMIT)
    ) {
      throw new BadRequestException(
        'Đánh giá cần kỳ hợp lệ, ít nhất một tiêu chí rubric có feedback và phản hồi tổng quan.',
      );
    }
  }

  private validateContributionInput(input: CreateContributionInput): void {
    if (
      !input ||
      !this.isValidPeriod(input.periodStart, input.periodEnd) ||
      !this.isText(input.description, 1, FEEDBACK_LIMIT)
    ) {
      throw new BadRequestException(
        'Ghi nhận đóng góp cần kỳ hợp lệ và mô tả từ 1 đến 2000 ký tự.',
      );
    }
  }

  private isValidPeriod(start: unknown, end: unknown): boolean {
    if (
      typeof start !== 'string' ||
      typeof end !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}$/.test(start) ||
      !/^\d{4}-\d{2}-\d{2}$/.test(end)
    ) {
      return false;
    }
    const startDate = new Date(`${start}T00:00:00.000Z`);
    const endDate = new Date(`${end}T00:00:00.000Z`);
    return (
      !Number.isNaN(startDate.getTime()) &&
      !Number.isNaN(endDate.getTime()) &&
      startDate.toISOString().slice(0, 10) === start &&
      endDate.toISOString().slice(0, 10) === end &&
      start <= end
    );
  }

  private isText(value: unknown, minLength: number, maxLength: number): value is string {
    return (
      typeof value === 'string' &&
      value.trim().length >= minLength &&
      value.trim().length <= maxLength
    );
  }
}
