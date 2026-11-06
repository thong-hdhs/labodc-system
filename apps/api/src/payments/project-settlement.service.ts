import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { JwtPayload, ProjectStatus, UserRole } from '@labodc/shared-types';
import { ProjectProposalRepository } from '../projects/project-proposal.repository';
import { FinanceEscrowService } from './finance-escrow.service';
import { LedgerEntryType } from './finance-escrow.types';
import {
  CreateProjectProgressReportDto,
  ProgressReportReviewStatus,
  ProjectHealthStatus,
  ProjectProgressReportEntity,
  ProjectSettlementCertificateDto,
  ReviewProjectProgressReportDto,
} from './project-settlement.types';

const VALID_HEALTH_STATUSES = new Set<string>(
  Object.values(ProjectHealthStatus),
);

@Injectable()
export class ProjectSettlementService {
  private readonly progressReports = new Map<
    string,
    ProjectProgressReportEntity
  >();
  private reportSequence = 1;

  constructor(
    private readonly proposalRepository: ProjectProposalRepository,
    private readonly financeEscrowService: FinanceEscrowService,
  ) {}

  submitProgressReport(
    user: JwtPayload,
    dto: CreateProjectProgressReportDto,
  ): ProjectProgressReportEntity {
    if (
      user.role !== UserRole.TALENT &&
      user.role !== UserRole.TALENT_LEADER &&
      user.role !== UserRole.MENTOR &&
      user.role !== UserRole.LAB_ADMIN
    ) {
      throw new ForbiddenException(
        'Chỉ Nhóm sinh viên (TALENT / TALENT_LEADER), MENTOR hoặc LAB_ADMIN mới được nộp báo cáo tiến độ thực thi dự án.',
      );
    }

    const project = this.proposalRepository.findById(dto.projectId);
    if (!project) {
      throw new NotFoundException(`Không tìm thấy dự án ${dto.projectId}.`);
    }

    const allowedStatuses = new Set<ProjectStatus>([
      ProjectStatus.APPROVED,
      ProjectStatus.PUBLISHED,
      ProjectStatus.RECRUITMENT_CLOSED,
      ProjectStatus.IN_PROGRESS,
    ]);

    if (!allowedStatuses.has(project.status)) {
      throw new ConflictException({
        code: 'INVALID_PROJECT_STATE_FOR_PROGRESS_REPORT',
        message: `Không thể nộp báo cáo tiến độ khi dự án đang ở trạng thái ${project.status}.`,
      });
    }

    if (!Number.isInteger(dto.reportingWeek) || dto.reportingWeek < 1) {
      throw new BadRequestException(
        'Tuần báo cáo (reportingWeek) phải là số nguyên dương (>= 1).',
      );
    }

    if (
      !Number.isInteger(dto.completionPercentage) ||
      dto.completionPercentage < 0 ||
      dto.completionPercentage > 100
    ) {
      throw new BadRequestException(
        'Tỷ lệ hoàn thành (completionPercentage) phải là số nguyên từ 0 đến 100.',
      );
    }

    if (!dto.healthStatus || !VALID_HEALTH_STATUSES.has(dto.healthStatus)) {
      throw new BadRequestException(
        'Trạng thái sức khỏe dự án (healthStatus) phải là ON_TRACK, AT_RISK hoặc DELAYED.',
      );
    }

    if (!dto.summary || dto.summary.trim().length < 15) {
      throw new BadRequestException(
        'Nội dung tóm tắt tiến độ (summary) bắt buộc tối thiểu 15 ký tự.',
      );
    }

    const now = new Date().toISOString();
    const id = `prp-${String(this.reportSequence++).padStart(4, '0')}`;

    const entity: ProjectProgressReportEntity = {
      id,
      projectId: project.id,
      milestoneId: dto.milestoneId?.trim() || null,
      reportingWeek: dto.reportingWeek,
      completionPercentage: dto.completionPercentage,
      healthStatus: dto.healthStatus,
      summary: dto.summary.trim(),
      blockers: dto.blockers?.trim() || null,
      evidenceUrl: dto.evidenceUrl?.trim() || null,
      submittedBy: user.sub,
      submittedRole: user.role,
      reviewStatus: ProgressReportReviewStatus.SUBMITTED,
      reviewedBy: null,
      reviewNote: null,
      reviewedAt: null,
      createdAt: now,
    };

    this.progressReports.set(id, entity);

    this.proposalRepository.appendAuditLog({
      projectId: project.id,
      actorUserId: user.sub,
      actorRole: user.role,
      action: 'SUBMIT_PROGRESS_REPORT',
      fromStatus: project.status,
      toStatus: project.status,
      reasonNote: `[${id}] Báo cáo tuần ${entity.reportingWeek} (${entity.completionPercentage}% - ${entity.healthStatus}).`,
    });

    return entity;
  }

  reviewProgressReport(
    user: JwtPayload,
    reportId: string,
    dto: ReviewProjectProgressReportDto,
  ): ProjectProgressReportEntity {
    if (
      user.role !== UserRole.LAB_ADMIN &&
      user.role !== UserRole.SYSTEM_ADMIN &&
      user.role !== UserRole.ENTERPRISE
    ) {
      throw new ForbiddenException(
        'Chỉ LAB_ADMIN, SYSTEM_ADMIN hoặc Doanh nghiệp sở hữu dự án mới có quyền đánh giá báo cáo tiến độ.',
      );
    }

    const report = this.progressReports.get(reportId);
    if (!report) {
      throw new NotFoundException(
        `Không tìm thấy báo cáo tiến độ ${reportId}.`,
      );
    }

    const project = this.proposalRepository.findById(report.projectId);
    if (!project) {
      throw new NotFoundException(`Không tìm thấy dự án ${report.projectId}.`);
    }

    if (
      user.role === UserRole.ENTERPRISE &&
      project.ownerUserId !== user.sub
    ) {
      throw new ForbiddenException(
        'Doanh nghiệp không được phép đánh giá báo cáo tiến độ của dự án thuộc doanh nghiệp khác.',
      );
    }

    if (
      dto.decision !== ProgressReportReviewStatus.REVIEWED_OK &&
      dto.decision !== ProgressReportReviewStatus.FLAGGED_ACTION_REQUIRED
    ) {
      throw new BadRequestException(
        'Quyết định đánh giá (decision) phải là REVIEWED_OK hoặc FLAGGED_ACTION_REQUIRED.',
      );
    }

    if (!dto.reviewNote || dto.reviewNote.trim().length < 10) {
      throw new BadRequestException(
        'Nhận xét đánh giá báo cáo tiến độ (reviewNote) bắt buộc tối thiểu 10 ký tự.',
      );
    }

    const now = new Date().toISOString();
    const updated: ProjectProgressReportEntity = {
      ...report,
      reviewStatus: dto.decision,
      reviewedBy: user.sub,
      reviewNote: dto.reviewNote.trim(),
      reviewedAt: now,
    };

    this.progressReports.set(report.id, updated);

    this.proposalRepository.appendAuditLog({
      projectId: project.id,
      actorUserId: user.sub,
      actorRole: user.role,
      action:
        dto.decision === ProgressReportReviewStatus.FLAGGED_ACTION_REQUIRED
          ? 'FLAG_PROGRESS_REPORT'
          : 'REVIEW_PROGRESS_REPORT_OK',
      fromStatus: project.status,
      toStatus: project.status,
      reasonNote: `[${report.id}] ${dto.reviewNote.trim()}`,
    });

    return updated;
  }

  listProjectProgressReports(
    user: JwtPayload,
    projectId: string,
  ): ProjectProgressReportEntity[] {
    const project = this.proposalRepository.findById(projectId);
    if (!project) {
      throw new NotFoundException(`Không tìm thấy dự án ${projectId}.`);
    }

    if (
      user.role === UserRole.ENTERPRISE &&
      project.ownerUserId !== user.sub
    ) {
      throw new ForbiddenException(
        'Doanh nghiệp không có quyền xem báo cáo tiến độ của doanh nghiệp khác.',
      );
    }

    return Array.from(this.progressReports.values()).filter(
      (r) => r.projectId === projectId,
    );
  }

  getProjectSettlementCertificate(
    user: JwtPayload,
    projectId: string,
  ): ProjectSettlementCertificateDto {
    const project = this.proposalRepository.findById(projectId);
    if (!project) {
      throw new NotFoundException(`Không tìm thấy dự án ${projectId}.`);
    }

    if (
      user.role === UserRole.ENTERPRISE &&
      project.ownerUserId !== user.sub
    ) {
      throw new ForbiddenException(
        'Doanh nghiệp không được phép truy cập Biên bản Quyết toán của doanh nghiệp khác.',
      );
    }

    const ledgerView = this.financeEscrowService.getProjectFinanceLedger(
      user,
      projectId,
    );

    const teamLeader70Vnd = ledgerView.ledgerEntries
      .filter((e) => e.entryType === LedgerEntryType.SPLIT_TEAM_70)
      .reduce((sum, e) => sum + e.amount, 0);

    const mentor20Vnd = ledgerView.ledgerEntries
      .filter((e) => e.entryType === LedgerEntryType.SPLIT_MENTOR_20)
      .reduce((sum, e) => sum + e.amount, 0);

    const labFund10Vnd = ledgerView.ledgerEntries
      .filter((e) => e.entryType === LedgerEntryType.SPLIT_LAB_10)
      .reduce((sum, e) => sum + e.amount, 0);

    const totalRefundedVnd = ledgerView.ledgerEntries
      .filter((e) => e.entryType === LedgerEntryType.ESCROW_REFUND)
      .reduce((sum, e) => sum + e.amount, 0);

    const remainderAbsorbedByLabVnd = ledgerView.disbursements
      .filter((d) => d.recipientRole === 'LAB_FUND')
      .reduce((sum, d) => sum + d.remainderAbsorbed, 0);

    const totalSplitDisbursedVnd = teamLeader70Vnd + mentor20Vnd + labFund10Vnd;
    const totalEscrowDepositedVnd =
      ledgerView.escrowSummary.totalEscrowDeposited;
    const escrowRemainingBalanceVnd = ledgerView.escrowSummary.escrowBalance;

    const splitInvariantHold =
      totalEscrowDepositedVnd ===
      totalSplitDisbursedVnd + totalRefundedVnd + escrowRemainingBalanceVnd;

    const reports = Array.from(this.progressReports.values()).filter(
      (r) => r.projectId === projectId,
    );
    const latestReport =
      reports.length > 0 ? reports[reports.length - 1] : null;

    return {
      certificateCode: `SETTLE-${project.code}`,
      projectId: project.id,
      projectCode: project.code,
      projectTitle: project.title,
      projectStatus: project.status,
      companyName: project.companyName,
      financialTotals: {
        totalEscrowDepositedVnd,
        totalDisbursedVnd: totalSplitDisbursedVnd,
        totalRefundedVnd,
        escrowRemainingBalanceVnd,
        currency: 'VND',
      },
      revenueSplitSummary: {
        teamLeader70Vnd,
        mentor20Vnd,
        labFund10Vnd,
        remainderAbsorbedByLabVnd,
        splitInvariantHold,
      },
      progressOverview: {
        totalReports: reports.length,
        latestCompletionPercentage: latestReport
          ? latestReport.completionPercentage
          : 0,
        latestHealthStatus: latestReport
          ? latestReport.healthStatus
          : 'NO_REPORT',
        flaggedReportsCount: reports.filter(
          (r) =>
            r.reviewStatus ===
            ProgressReportReviewStatus.FLAGGED_ACTION_REQUIRED,
        ).length,
      },
      isFullySettled:
        escrowRemainingBalanceVnd === 0 &&
        (project.status === ProjectStatus.COMPLETED ||
          project.status === ProjectStatus.CANCELLED),
      generatedAt: new Date().toISOString(),
    };
  }
}