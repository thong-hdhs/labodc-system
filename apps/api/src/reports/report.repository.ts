import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  ContributionRecord,
  CreateContributionInput,
  CreateEvaluationInput,
  EvaluationEvent,
  ProgressReport,
  ReportContentInput,
  ReportStateEvent,
  ReportStatus,
  AllocationProposalStatus,
  TeamAllocationProposal,
  TeamAllocationProposalEvent,
  TeamAllocationProposalInput,
  TalentEvaluation,
} from './report.types';

@Injectable()
export class ReportRepository {
  private readonly reports = new Map<string, ProgressReport>();
  private readonly reportEvents = new Map<string, ReportStateEvent[]>();
  private readonly evaluations = new Map<string, TalentEvaluation>();
  private readonly contributions = new Map<string, ContributionRecord>();
  private readonly allocationProposals = new Map<string, TeamAllocationProposal>();

  createReport(
    projectId: string,
    teamId: string | null,
    authorUserId: string,
    authorRole: ProgressReport['authorRole'],
    input: ReportContentInput,
  ): ProgressReport {
    const now = new Date().toISOString();
    const report: ProgressReport = {
      id: randomUUID(),
      projectId,
      teamId,
      authorUserId,
      authorRole,
      periodType: input.periodType,
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
      summary: input.summary,
      progress: input.progress,
      blockers: input.blockers,
      nextSteps: input.nextSteps,
      status: 'DRAFT',
      version: 1,
      reviewerUserId: null,
      reviewNote: null,
      createdAt: now,
      updatedAt: now,
      revisions: [],
    };
    this.reports.set(report.id, report);
    this.saveRevision(report, authorUserId, now);
    this.appendReportEvent(report, authorUserId, 'CREATED', null, 'DRAFT', null);
    return this.cloneReport(report);
  }

  findReportById(id: string): ProgressReport | null {
    const report = this.reports.get(id);
    return report ? this.cloneReport(report) : null;
  }

  findReportsByProject(projectId: string): ProgressReport[] {
    return [...this.reports.values()]
      .filter((report) => report.projectId === projectId)
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
      .map((report) => this.cloneReport(report));
  }

  findAllReports(): ProgressReport[] {
    return [...this.reports.values()]
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
      .map((report) => this.cloneReport(report));
  }

  updateReport(
    reportId: string,
    actorUserId: string,
    input: ReportContentInput,
  ): ProgressReport {
    const existing = this.requireReport(reportId);
    if (!['DRAFT', 'CHANGES_REQUESTED'].includes(existing.status)) {
      throw new ConflictException('Chỉ có thể sửa báo cáo nháp hoặc bị yêu cầu chỉnh sửa.');
    }

    const updated: ProgressReport = {
      ...existing,
      periodType: input.periodType,
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
      summary: input.summary,
      progress: input.progress,
      blockers: input.blockers,
      nextSteps: input.nextSteps,
      version: existing.version + 1,
      reviewNote: existing.status === 'CHANGES_REQUESTED' ? existing.reviewNote : null,
      updatedAt: new Date().toISOString(),
    };
    this.reports.set(reportId, updated);
    this.saveRevision(updated, actorUserId, updated.updatedAt);
    this.appendReportEvent(
      updated,
      actorUserId,
      'UPDATED',
      existing.status,
      existing.status,
      null,
    );
    return this.cloneReport(updated);
  }

  transitionReport(
    reportId: string,
    actorUserId: string,
    action: ReportStateEvent['action'],
    toStatus: ReportStatus,
    note: string | null,
    reviewerUserId?: string | null,
  ): ProgressReport {
    const existing = this.requireReport(reportId);
    const updated: ProgressReport = {
      ...existing,
      status: toStatus,
      reviewNote:
        action === 'CHANGES_REQUESTED'
          ? note
          : action === 'RESUBMITTED' || action === 'APPROVED'
            ? null
            : existing.reviewNote,
      reviewerUserId:
        reviewerUserId === undefined
          ? action === 'RESUBMITTED'
            ? null
            : existing.reviewerUserId
          : reviewerUserId,
      updatedAt: new Date().toISOString(),
    };
    this.reports.set(reportId, updated);
    this.appendReportEvent(
      updated,
      actorUserId,
      action,
      existing.status,
      toStatus,
      note,
    );
    return this.cloneReport(updated);
  }

  createEvaluation(
    projectId: string,
    teamId: string,
    mentorUserId: string,
    input: CreateEvaluationInput,
  ): TalentEvaluation {
    const evaluation: TalentEvaluation = {
      id: randomUUID(),
      projectId,
      teamId,
      subjectUserId: input.subjectUserId,
      mentorUserId,
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
      criteria: input.criteria.map((criterion) => ({ ...criterion })),
      overallFeedback: input.overallFeedback,
      status: 'EVALUATION_DRAFT',
      createdAt: new Date().toISOString(),
      finalizedAt: null,
      candidateAcknowledgedAt: null,
      candidateFeedback: null,
      candidateFeedbackAt: null,
      events: [],
    };
    this.evaluations.set(evaluation.id, evaluation);
    return this.cloneEvaluation(evaluation);
  }

  findEvaluationById(id: string): TalentEvaluation | null {
    const evaluation = this.evaluations.get(id);
    return evaluation ? this.cloneEvaluation(evaluation) : null;
  }

  findEvaluationsByProject(projectId: string): TalentEvaluation[] {
    return [...this.evaluations.values()]
      .filter((evaluation) => evaluation.projectId === projectId)
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
      .map((evaluation) => this.cloneEvaluation(evaluation));
  }

  findAllEvaluations(): TalentEvaluation[] {
    return [...this.evaluations.values()]
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
      .map((evaluation) => this.cloneEvaluation(evaluation));
  }

  finalizeEvaluation(id: string, actorUserId: string): TalentEvaluation {
    const evaluation = this.evaluations.get(id);
    if (!evaluation) throw new NotFoundException('Không tìm thấy đánh giá.');
    if (evaluation.status !== 'EVALUATION_DRAFT') {
      throw new ConflictException('Đánh giá đã chốt và không thể sửa.');
    }
    const finalized: TalentEvaluation = {
      ...evaluation,
      status: 'EVALUATION_FINAL',
      finalizedAt: new Date().toISOString(),
      events: evaluation.events.map((event) => ({ ...event })),
    };
    this.appendEvaluationEvent(finalized, actorUserId, 'FINALIZED');
    this.evaluations.set(id, finalized);
    return this.cloneEvaluation(finalized);
  }

  acknowledgeEvaluation(id: string, actorUserId: string): TalentEvaluation {
    const evaluation = this.requireEvaluation(id);
    if (evaluation.candidateAcknowledgedAt) {
      return this.cloneEvaluation(evaluation);
    }
    const acknowledgedAt = new Date().toISOString();
    const acknowledged: TalentEvaluation = {
      ...evaluation,
      candidateAcknowledgedAt: acknowledgedAt,
      events: evaluation.events.map((event) => ({ ...event })),
    };
    this.appendEvaluationEvent(
      acknowledged,
      actorUserId,
      'CANDIDATE_ACKNOWLEDGED',
    );
    this.evaluations.set(id, acknowledged);
    return this.cloneEvaluation(acknowledged);
  }

  submitEvaluationFeedback(
    id: string,
    actorUserId: string,
    feedback: string,
  ): TalentEvaluation {
    const evaluation = this.requireEvaluation(id);
    if (evaluation.candidateFeedbackAt) {
      throw new ConflictException(
        'Bạn đã gửi phản hồi cho đánh giá này; không thể gửi trùng.',
      );
    }
    const updated: TalentEvaluation = {
      ...evaluation,
      candidateFeedback: feedback,
      candidateFeedbackAt: new Date().toISOString(),
      events: evaluation.events.map((event) => ({ ...event })),
    };
    this.appendEvaluationEvent(
      updated,
      actorUserId,
      'CANDIDATE_FEEDBACK_SUBMITTED',
    );
    this.evaluations.set(id, updated);
    return this.cloneEvaluation(updated);
  }

  createContribution(
    projectId: string,
    teamId: string,
    recordedBy: string,
    input: CreateContributionInput,
  ): ContributionRecord {
    const record: ContributionRecord = {
      id: randomUUID(),
      projectId,
      teamId,
      userId: input.userId,
      recordedBy,
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
      description: input.description,
      createdAt: new Date().toISOString(),
    };
    this.contributions.set(record.id, record);
    return { ...record };
  }

  findContributionsByProject(projectId: string): ContributionRecord[] {
    return [...this.contributions.values()]
      .filter((record) => record.projectId === projectId)
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
      .map((record) => ({ ...record }));
  }

  findAllContributions(): ContributionRecord[] {
    return [...this.contributions.values()]
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
      .map((record) => ({ ...record }));
  }

  createAllocationProposal(
    projectId: string,
    teamId: string,
    proposerUserId: string,
    reviewerUserId: string,
    teamUpdatedAt: string,
    memberUserIds: string[],
    input: TeamAllocationProposalInput,
  ): TeamAllocationProposal {
    const existing = this.findAllocationProposalByTeamAndPeriod(
      teamId,
      input.periodStart,
      input.periodEnd,
    );
    if (existing) {
      throw new ConflictException(
        'Đã có đề xuất phân bổ cho Team trong kỳ trùng hoặc giao nhau; hãy cập nhật đề xuất hiện có.',
      );
    }
    const now = new Date().toISOString();
    const proposal: TeamAllocationProposal = {
      id: randomUUID(),
      projectId,
      teamId,
      proposerUserId,
      reviewerUserId,
      teamUpdatedAt,
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
      allocations: input.allocations.map((allocation) => ({ ...allocation })),
      memberUserIds: [...memberUserIds].sort(),
      rationale: input.rationale.trim(),
      status: 'PENDING',
      reviewNote: null,
      createdAt: now,
      updatedAt: now,
      events: [],
    };
    this.allocationProposals.set(proposal.id, proposal);
    this.appendAllocationProposalEvent(
      proposal,
      proposerUserId,
      'CREATED',
      null,
      'PENDING',
      null,
    );
    return this.cloneAllocationProposal(proposal);
  }

  findAllocationProposalById(id: string): TeamAllocationProposal | null {
    const proposal = this.allocationProposals.get(id);
    return proposal ? this.cloneAllocationProposal(proposal) : null;
  }

  findAllocationProposalsByTeam(teamId: string): TeamAllocationProposal[] {
    return [...this.allocationProposals.values()]
      .filter((proposal) => proposal.teamId === teamId)
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
      .map((proposal) => this.cloneAllocationProposal(proposal));
  }

  findAllocationProposalByTeamAndPeriod(
    teamId: string,
    periodStart: string,
    periodEnd: string,
  ): TeamAllocationProposal | null {
    const proposal = [...this.allocationProposals.values()].find(
      (item) =>
        item.teamId === teamId &&
        item.periodStart <= periodEnd &&
        item.periodEnd >= periodStart,
    );
    return proposal ? this.cloneAllocationProposal(proposal) : null;
  }

  updateAllocationProposal(
    id: string,
    actorUserId: string,
    reviewerUserId: string,
    teamUpdatedAt: string,
    memberUserIds: string[],
    input: TeamAllocationProposalInput,
  ): TeamAllocationProposal {
    const existing = this.requireAllocationProposal(id);
    if (!['PENDING', 'CHANGES_REQUESTED'].includes(existing.status)) {
      throw new ConflictException('Đề xuất đã duyệt và không thể sửa.');
    }
    const duplicate = this.findAllocationProposalByTeamAndPeriod(
      existing.teamId,
      input.periodStart,
      input.periodEnd,
    );
    if (duplicate && duplicate.id !== id) {
      throw new ConflictException(
        'Đã có đề xuất phân bổ cho Team trong kỳ trùng hoặc giao nhau.',
      );
    }
    const fromStatus = existing.status;
    const proposal: TeamAllocationProposal = {
      ...existing,
      proposerUserId: actorUserId,
      reviewerUserId,
      teamUpdatedAt,
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
      allocations: input.allocations.map((allocation) => ({ ...allocation })),
      memberUserIds: [...memberUserIds].sort(),
      rationale: input.rationale.trim(),
      status: 'PENDING',
      reviewNote: null,
      updatedAt: new Date().toISOString(),
      events: existing.events.map((event) => ({ ...event })),
    };
    this.allocationProposals.set(id, proposal);
    this.appendAllocationProposalEvent(
      proposal,
      actorUserId,
      'UPDATED',
      fromStatus,
      'PENDING',
      null,
    );
    return this.cloneAllocationProposal(proposal);
  }

  transitionAllocationProposal(
    id: string,
    actorUserId: string,
    action: 'APPROVED' | 'CHANGES_REQUESTED',
    status: AllocationProposalStatus,
    note: string | null,
  ): TeamAllocationProposal {
    const existing = this.requireAllocationProposal(id);
    if (existing.status !== 'PENDING') {
      throw new ConflictException('Chỉ đề xuất đang chờ mới được xử lý.');
    }
    const proposal: TeamAllocationProposal = {
      ...existing,
      status,
      reviewNote: status === 'CHANGES_REQUESTED' ? note : null,
      updatedAt: new Date().toISOString(),
      events: existing.events.map((event) => ({ ...event })),
    };
    this.allocationProposals.set(id, proposal);
    this.appendAllocationProposalEvent(
      proposal,
      actorUserId,
      action,
      existing.status,
      status,
      note,
    );
    return this.cloneAllocationProposal(proposal);
  }

  getReportHistory(reportId: string): ReportStateEvent[] {
    return (this.reportEvents.get(reportId) ?? []).map((event) => ({ ...event }));
  }

  clearAll(): void {
    this.reports.clear();
    this.reportEvents.clear();
    this.evaluations.clear();
    this.contributions.clear();
    this.allocationProposals.clear();
  }

  private requireReport(id: string): ProgressReport {
    const report = this.reports.get(id);
    if (!report) throw new NotFoundException('Không tìm thấy báo cáo.');
    return report;
  }

  private requireEvaluation(id: string): TalentEvaluation {
    const evaluation = this.evaluations.get(id);
    if (!evaluation) throw new NotFoundException('Không tìm thấy đánh giá.');
    return evaluation;
  }

  private appendEvaluationEvent(
    evaluation: TalentEvaluation,
    actorUserId: string,
    action: EvaluationEvent['action'],
  ): void {
    evaluation.events.push({
      id: randomUUID(),
      actorUserId,
      action,
      createdAt: new Date().toISOString(),
    });
  }

  private requireAllocationProposal(id: string): TeamAllocationProposal {
    const proposal = this.allocationProposals.get(id);
    if (!proposal) throw new NotFoundException('Không tìm thấy đề xuất phân bổ.');
    return proposal;
  }

  private appendAllocationProposalEvent(
    proposal: TeamAllocationProposal,
    actorUserId: string,
    action: TeamAllocationProposalEvent['action'],
    fromStatus: AllocationProposalStatus | null,
    toStatus: AllocationProposalStatus,
    note: string | null,
  ): void {
    proposal.events.push({
      id: randomUUID(),
      actorUserId,
      action,
      fromStatus,
      toStatus,
      note,
      createdAt: new Date().toISOString(),
    });
  }

  private cloneAllocationProposal(
    proposal: TeamAllocationProposal,
  ): TeamAllocationProposal {
    return {
      ...proposal,
      allocations: proposal.allocations.map((allocation) => ({ ...allocation })),
      memberUserIds: [...proposal.memberUserIds],
      events: proposal.events.map((event) => ({ ...event })),
    };
  }

  private saveRevision(
    report: ProgressReport,
    updatedBy: string,
    updatedAt: string,
  ): void {
    report.revisions.push({
      version: report.version,
      content: {
        periodType: report.periodType,
        periodStart: report.periodStart,
        periodEnd: report.periodEnd,
        summary: report.summary,
        progress: report.progress,
        blockers: report.blockers,
        nextSteps: report.nextSteps,
      },
      updatedBy,
      updatedAt,
    });
  }

  private appendReportEvent(
    report: ProgressReport,
    actorUserId: string,
    action: ReportStateEvent['action'],
    fromStatus: ReportStatus | null,
    toStatus: ReportStatus,
    note: string | null,
  ): void {
    const events = this.reportEvents.get(report.id) ?? [];
    events.push({
      id: randomUUID(),
      reportId: report.id,
      actorUserId,
      action,
      fromStatus,
      toStatus,
      note,
      createdAt: new Date().toISOString(),
    });
    this.reportEvents.set(report.id, events);
  }

  private cloneReport(report: ProgressReport): ProgressReport {
    return {
      ...report,
      revisions: report.revisions.map((revision) => ({
        ...revision,
        content: { ...revision.content },
      })),
    };
  }

  private cloneEvaluation(evaluation: TalentEvaluation): TalentEvaluation {
    return {
      ...evaluation,
      criteria: evaluation.criteria.map((criterion) => ({ ...criterion })),
      events: evaluation.events.map((event) => ({ ...event })),
    };
  }
}
