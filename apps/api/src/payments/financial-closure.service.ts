import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { JwtPayload, UserRole } from '@labodc/shared-types';
import { ProjectProposalRepository } from '../projects/project-proposal.repository';
import { FinanceEscrowService } from './finance-escrow.service';
import { MilestoneEscrowStatus } from './finance-escrow.types';
import { ProjectSettlementService } from './project-settlement.service';
import {
  CreateFinancialDisputeDto,
  CreateProjectClosureDossierDto,
  FinancialDisputeStatus,
  FinancialDisputeTicketEntity,
  LabFundTransparencyReportDto,
  ProjectClosureDossierEntity,
  ResolveFinancialDisputeDto,
} from './financial-closure.types';

@Injectable()
export class FinancialClosureService {
  private readonly disputesById = new Map<
    string,
    FinancialDisputeTicketEntity
  >();
  private readonly closureDossiersByProjectId = new Map<
    string,
    ProjectClosureDossierEntity
  >();
  private disputeSequence = 1;
  private dossierSequence = 1;

  constructor(
    private readonly proposalRepository: ProjectProposalRepository,
    private readonly financeEscrowService: FinanceEscrowService,
    private readonly projectSettlementService: ProjectSettlementService,
  ) {}

  raiseFinancialDispute(
    user: JwtPayload,
    dto: CreateFinancialDisputeDto,
  ): FinancialDisputeTicketEntity {
    if (
      user.role !== UserRole.ENTERPRISE &&
      user.role !== UserRole.TALENT_LEADER &&
      user.role !== UserRole.TALENT &&
      user.role !== UserRole.MENTOR
    ) {
      throw new ForbiddenException(
        'Chỉ Doanh nghiệp, Nhóm sinh viên hoặc Mentor mới có quyền gửi phiếu yêu cầu đối soát/khiếu nại cột mốc.',
      );
    }

    const project = this.proposalRepository.findById(dto.projectId);
    if (!project) {
      throw new NotFoundException(`Không tìm thấy dự án ${dto.projectId}.`);
    }

    if (
      user.role === UserRole.ENTERPRISE &&
      project.ownerUserId !== user.sub
    ) {
      throw new ForbiddenException(
        'Doanh nghiệp không được gửi khiếu nại cho dự án của doanh nghiệp khác.',
      );
    }

    if (!dto.reason || dto.reason.trim().length < 15) {
      throw new BadRequestException(
        'Lý do khiếu nại/đối soát (reason) bắt buộc tối thiểu 15 ký tự.',
      );
    }

    const sysReader: JwtPayload = {
      sub: user.sub,
      email: user.email,
      role: UserRole.SYSTEM_ADMIN,
      status: user.status,
    };
    const ledger = this.financeEscrowService.getProjectFinanceLedger(
      sysReader,
      project.id,
    );
    const milestone = ledger.milestones.find((m) => m.id === dto.milestoneId);
    if (!milestone) {
      throw new NotFoundException(
        `Không tìm thấy cột mốc ${dto.milestoneId} trong dự án ${project.id}.`,
      );
    }

    if (
      milestone.status !== MilestoneEscrowStatus.ESCROW_PAID &&
      milestone.status !== MilestoneEscrowStatus.SUBMITTED
    ) {
      throw new ConflictException({
        code: 'INVALID_MILESTONE_STATE_FOR_DISPUTE',
        message: `Chỉ có thể mở phiếu khiếu nại khi cột mốc đang ở trạng thái ESCROW_PAID hoặc SUBMITTED chưa giải ngân (hiện tại: ${milestone.status}).`,
      });
    }

    const existingOpen = Array.from(this.disputesById.values()).find(
      (d) =>
        d.milestoneId === milestone.id &&
        d.status === FinancialDisputeStatus.OPEN,
    );
    if (existingOpen) {
      throw new ConflictException({
        code: 'ACTIVE_DISPUTE_ALREADY_EXISTS',
        message: `Cột mốc ${milestone.id} đang có phiếu khiếu nại ${existingOpen.code} chờ phân xử (OPEN).`,
      });
    }

    const seq = this.disputeSequence++;
    const id = `disp-${String(seq).padStart(4, '0')}`;
    const code = `DSP-2026-${String(seq).padStart(3, '0')}`;
    const now = new Date().toISOString();

    const ticket: FinancialDisputeTicketEntity = {
      id,
      code,
      projectId: project.id,
      milestoneId: milestone.id,
      raisedByUserId: user.sub,
      raisedByRole: user.role,
      reason: dto.reason.trim(),
      evidenceUrl: dto.evidenceUrl?.trim() || null,
      status: FinancialDisputeStatus.OPEN,
      resolutionNote: null,
      resolvedBy: null,
      resolvedAt: null,
      createdAt: now,
    };

    this.disputesById.set(id, ticket);

    this.proposalRepository.appendAuditLog({
      projectId: project.id,
      actorUserId: user.sub,
      actorRole: user.role,
      action: 'OPEN_FINANCIAL_DISPUTE',
      fromStatus: project.status,
      toStatus: project.status,
      reasonNote: `[${code}] Khiếu nại cột mốc ${milestone.id}: ${ticket.reason}`,
    });

    return ticket;
  }

  resolveFinancialDispute(
    user: JwtPayload,
    disputeId: string,
    dto: ResolveFinancialDisputeDto,
  ): {
    dispute: FinancialDisputeTicketEntity;
    milestoneStatusAfterResolution: MilestoneEscrowStatus;
  } {
    if (
      user.role !== UserRole.LAB_ADMIN &&
      user.role !== UserRole.SYSTEM_ADMIN
    ) {
      throw new ForbiddenException(
        'Chỉ LAB_ADMIN hoặc SYSTEM_ADMIN mới có thẩm quyền phân xử phiếu khiếu nại tài chính.',
      );
    }

    const ticket = this.disputesById.get(disputeId);
    if (!ticket) {
      throw new NotFoundException(
        `Không tìm thấy phiếu khiếu nại ${disputeId}.`,
      );
    }

    if (ticket.status !== FinancialDisputeStatus.OPEN) {
      throw new ConflictException({
        code: 'DISPUTE_ALREADY_RESOLVED',
        message: `Phiếu khiếu nại ${ticket.code} đã được xử lý trước đó (trạng thái: ${ticket.status}).`,
      });
    }

    if (!dto.resolutionNote || dto.resolutionNote.trim().length < 15) {
      throw new BadRequestException(
        'Ghi chú kết luận phân xử (resolutionNote) bắt buộc tối thiểu 15 ký tự.',
      );
    }

    let finalMilestoneStatus: MilestoneEscrowStatus;

    if (
      dto.decision === FinancialDisputeStatus.RESOLVED_RELEASE_TO_TEAM
    ) {
      const released = this.financeEscrowService.acceptAndDisburseMilestone(
        user,
        ticket.milestoneId,
        {
          reviewNote: `[Phân xử ${ticket.code}] ${dto.resolutionNote.trim()}`,
          markProjectCompleted: dto.markProjectCompleted,
        },
      );
      finalMilestoneStatus = released.milestone.status;
    } else if (
      dto.decision === FinancialDisputeStatus.RESOLVED_REFUND_TO_ENTERPRISE
    ) {
      const refunded = this.financeEscrowService.refundMilestoneEscrow(
        user,
        ticket.milestoneId,
        {
          refundReason: `[Phân xử ${ticket.code}] ${dto.resolutionNote.trim()}`,
        },
      );
      finalMilestoneStatus = refunded.milestone.status;
    } else if (dto.decision === FinancialDisputeStatus.REJECTED) {
      const ledger = this.financeEscrowService.getProjectFinanceLedger(
        user,
        ticket.projectId,
      );
      const ms = ledger.milestones.find((m) => m.id === ticket.milestoneId);
      finalMilestoneStatus = ms ? ms.status : MilestoneEscrowStatus.SUBMITTED;
    } else {
      throw new BadRequestException(
        'Quyết định phân xử (decision) không hợp lệ.',
      );
    }

    const now = new Date().toISOString();
    const updatedTicket: FinancialDisputeTicketEntity = {
      ...ticket,
      status: dto.decision,
      resolutionNote: dto.resolutionNote.trim(),
      resolvedBy: user.sub,
      resolvedAt: now,
    };

    this.disputesById.set(ticket.id, updatedTicket);

    const project = this.proposalRepository.findById(ticket.projectId);
    if (project) {
      this.proposalRepository.appendAuditLog({
        projectId: project.id,
        actorUserId: user.sub,
        actorRole: user.role,
        action: `RESOLVE_DISPUTE_${dto.decision}`,
        fromStatus: project.status,
        toStatus: project.status,
        reasonNote: `[${ticket.code}] ${dto.resolutionNote.trim()}`,
      });
    }

    return {
      dispute: updatedTicket,
      milestoneStatusAfterResolution: finalMilestoneStatus,
    };
  }

  listProjectDisputes(
    user: JwtPayload,
    projectId: string,
  ): FinancialDisputeTicketEntity[] {
    const project = this.proposalRepository.findById(projectId);
    if (!project) {
      throw new NotFoundException(`Không tìm thấy dự án ${projectId}.`);
    }

    if (
      user.role === UserRole.ENTERPRISE &&
      project.ownerUserId !== user.sub
    ) {
      throw new ForbiddenException(
        'Doanh nghiệp không được xem danh sách khiếu nại của doanh nghiệp khác.',
      );
    }

    return Array.from(this.disputesById.values()).filter(
      (d) => d.projectId === projectId,
    );
  }

  createProjectClosureDossier(
    user: JwtPayload,
    projectId: string,
    dto: CreateProjectClosureDossierDto,
  ): ProjectClosureDossierEntity {
    if (
      user.role !== UserRole.ENTERPRISE &&
      user.role !== UserRole.LAB_ADMIN &&
      user.role !== UserRole.SYSTEM_ADMIN
    ) {
      throw new ForbiddenException(
        'Chỉ Doanh nghiệp sở hữu dự án hoặc Lab Admin mới được ký Hồ sơ Nghiệm thu Đóng Dự án.',
      );
    }

    const project = this.proposalRepository.findById(projectId);
    if (!project) {
      throw new NotFoundException(`Không tìm thấy dự án ${projectId}.`);
    }

    if (
      user.role === UserRole.ENTERPRISE &&
      project.ownerUserId !== user.sub
    ) {
      throw new ForbiddenException(
        'Doanh nghiệp không được ký đóng hồ sơ dự án của doanh nghiệp khác.',
      );
    }

    if (this.closureDossiersByProjectId.has(projectId)) {
      throw new ConflictException({
        code: 'PROJECT_CLOSURE_DOSSIER_ALREADY_EXISTS',
        message: `Dự án ${project.code} đã được ký Hồ sơ Nghiệm thu Đóng Dự án trước đó.`,
      });
    }

    const openDisputes = Array.from(this.disputesById.values()).filter(
      (d) =>
        d.projectId === projectId && d.status === FinancialDisputeStatus.OPEN,
    );
    if (openDisputes.length > 0) {
      throw new ConflictException({
        code: 'OPEN_DISPUTE_BLOCKS_CLOSURE',
        message: `Không thể đóng hồ sơ dự án khi vẫn còn ${openDisputes.length} phiếu khiếu nại đang chờ xử lý (OPEN).`,
      });
    }

    const cert = this.projectSettlementService.getProjectSettlementCertificate(
      user,
      projectId,
    );
    if (!cert.isFullySettled) {
      throw new ConflictException({
        code: 'PROJECT_NOT_FULLY_SETTLED',
        message: `Chỉ có thể ký Hồ sơ Đóng Dự án khi dự án đã hoàn tất tất toán 100% và số dư ký quỹ bằng 0 VND (số dư hiện tại: ${cert.financialTotals.escrowRemainingBalanceVnd} VND, trạng thái: ${project.status}).`,
      });
    }

    if (
      !Number.isInteger(dto.satisfactionScore) ||
      dto.satisfactionScore < 1 ||
      dto.satisfactionScore > 5
    ) {
      throw new BadRequestException(
        'Điểm đánh giá mức độ hài lòng của Doanh nghiệp (satisfactionScore) phải là số nguyên từ 1 đến 5.',
      );
    }

    if (!dto.feedbackSummary || dto.feedbackSummary.trim().length < 10) {
      throw new BadRequestException(
        'Nhận xét tổng kết dự án (feedbackSummary) bắt buộc tối thiểu 10 ký tự.',
      );
    }

    const seq = this.dossierSequence++;
    const now = new Date().toISOString();
    const dossier: ProjectClosureDossierEntity = {
      id: `clos-${String(seq).padStart(4, '0')}`,
      dossierCode: `CLS-${project.code}`,
      projectId: project.id,
      projectCode: project.code,
      projectTitle: project.title,
      projectStatus: project.status,
      enterpriseUserId: project.ownerUserId,
      companyName: project.companyName,
      satisfactionScore: dto.satisfactionScore,
      wouldSponsorAgain: Boolean(dto.wouldSponsorAgain),
      feedbackSummary: dto.feedbackSummary.trim(),
      finalDeliverableArchiveUrl:
        dto.finalDeliverableArchiveUrl?.trim() || null,
      totalEscrowDepositedVnd: cert.financialTotals.totalEscrowDepositedVnd,
      totalDisbursed702010Vnd: cert.financialTotals.totalDisbursedVnd,
      totalRefundedVnd: cert.financialTotals.totalRefundedVnd,
      signedOffBy: user.sub,
      signedOffRole: user.role,
      signedOffAt: now,
    };

    this.closureDossiersByProjectId.set(projectId, dossier);

    this.proposalRepository.appendAuditLog({
      projectId: project.id,
      actorUserId: user.sub,
      actorRole: user.role,
      action: 'SIGN_PROJECT_CLOSURE_DOSSIER',
      fromStatus: project.status,
      toStatus: project.status,
      reasonNote: `[${dossier.dossierCode}] Đánh giá hài lòng: ${dossier.satisfactionScore}/5 — ${dossier.feedbackSummary}`,
    });

    return dossier;
  }

  getProjectClosureDossier(
    user: JwtPayload,
    projectId: string,
  ): ProjectClosureDossierEntity {
    const project = this.proposalRepository.findById(projectId);
    if (!project) {
      throw new NotFoundException(`Không tìm thấy dự án ${projectId}.`);
    }

    if (
      user.role === UserRole.ENTERPRISE &&
      project.ownerUserId !== user.sub
    ) {
      throw new ForbiddenException(
        'Doanh nghiệp không được xem Hồ sơ Đóng Dự án của doanh nghiệp khác.',
      );
    }

    const dossier = this.closureDossiersByProjectId.get(projectId);
    if (!dossier) {
      throw new NotFoundException(
        `Dự án ${projectId} chưa có Hồ sơ Nghiệm thu Đóng Dự án.`,
      );
    }

    return dossier;
  }

  getLabFundTransparencyReport(
    user: JwtPayload,
  ): LabFundTransparencyReportDto {
    if (
      user.role !== UserRole.LAB_ADMIN &&
      user.role !== UserRole.SYSTEM_ADMIN
    ) {
      throw new ForbiddenException(
        'Chỉ LAB_ADMIN hoặc SYSTEM_ADMIN mới có quyền truy xuất Báo cáo Minh bạch Quỹ Vận hành LabOdc 10%.',
      );
    }

    const globalRecon =
      this.financeEscrowService.getGlobalReconciliationSummary(user);
    const allDisputes = Array.from(this.disputesById.values());
    const allDossiers = Array.from(this.closureDossiersByProjectId.values());

    const totalClosedDossiers = allDossiers.length;
    const averageSatisfactionScore =
      totalClosedDossiers > 0
        ? Number(
            (
              allDossiers.reduce((sum, d) => sum + d.satisfactionScore, 0) /
              totalClosedDossiers
            ).toFixed(2),
          )
        : 0;

    const sponsorAgainCount = allDossiers.filter(
      (d) => d.wouldSponsorAgain,
    ).length;
    const wouldSponsorAgainRatePercent =
      totalClosedDossiers > 0
        ? Math.round((sponsorAgainCount * 100) / totalClosedDossiers)
        : 0;

    return {
      reportCode: 'LAB_FUND_10_TRANSPARENCY_REPORT_D18',
      generatedAt: new Date().toISOString(),
      labFundSummary: {
        totalLabFund10CollectedVnd: globalRecon.ledgerTotals.totalLab10,
        totalRemainderAbsorbedVnd:
          globalRecon.ledgerTotals.totalRemainderAbsorbedByLab,
        totalTeam70DisbursedVnd: globalRecon.ledgerTotals.totalTeam70,
        totalMentor20DisbursedVnd: globalRecon.ledgerTotals.totalMentor20,
        totalGrossDisbursedVnd: globalRecon.ledgerTotals.totalDisbursed702010,
        currency: 'VND',
        invariantHold: globalRecon.invariantHold,
      },
      disputeGovernance: {
        totalDisputes: allDisputes.length,
        openDisputes: allDisputes.filter(
          (d) => d.status === FinancialDisputeStatus.OPEN,
        ).length,
        resolvedReleaseCount: allDisputes.filter(
          (d) => d.status === FinancialDisputeStatus.RESOLVED_RELEASE_TO_TEAM,
        ).length,
        resolvedRefundCount: allDisputes.filter(
          (d) =>
            d.status === FinancialDisputeStatus.RESOLVED_REFUND_TO_ENTERPRISE,
        ).length,
        rejectedCount: allDisputes.filter(
          (d) => d.status === FinancialDisputeStatus.REJECTED,
        ).length,
      },
      closureGovernance: {
        totalClosedDossiers,
        averageSatisfactionScore,
        wouldSponsorAgainRatePercent,
      },
    };
  }
}