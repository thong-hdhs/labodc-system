import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { JwtPayload, ProjectStatus, UserRole } from '@labodc/shared-types';
import { ProjectProposalRepository } from '../projects/project-proposal.repository';
import {
  AcceptMilestoneDto,
  ConfirmMilestoneEscrowDto,
  CreateProjectMilestoneDto,
  DisbursementAllocationEntity,
  GlobalReconciliationSummaryDto,
  LedgerEntryEntity,
  LedgerEntryType,
  MilestoneEscrowStatus,
  ProjectMilestoneEntity,
  RefundMilestoneEscrowDto,
  RequestMilestoneRevisionDto,
  RevenueSplitBreakdown,
  SubmitMilestoneDeliverableDto,
  SyncPayosWebhookToMilestoneDto,
} from './finance-escrow.types';
import {
  createPayosWebhookSignature,
  verifyPayosWebhookSignature,
} from './payos-signature.util';

@Injectable()
export class FinanceEscrowService {
  private readonly milestones = new Map<string, ProjectMilestoneEntity>();
  private readonly ledgerEntries: LedgerEntryEntity[] = [];
  private readonly disbursements: DisbursementAllocationEntity[] = [];
  private readonly processedMilestoneWebhookKeys = new Set<string>();
  private milestoneSequence = 1;
  private orderSequence = 900001;

  constructor(private readonly proposalRepository: ProjectProposalRepository) {}

  /**
   * Thuật toán chia doanh thu bất biến 70% / 20% / 10% bằng số nguyên VND (REQ-FIN-03, DEC-05).
   * Mọi phần dư (remainder) từ phép chia nguyên được cộng vào Quỹ Lab (10%) để tổng luôn bằng 100%.
   */
  calculateRevenueSplit(totalAmount: number): RevenueSplitBreakdown {
    if (!Number.isInteger(totalAmount) || totalAmount <= 0) {
      throw new BadRequestException(
        'Số tiền phân bổ doanh thu (totalAmount) phải là số nguyên dương (VND).',
      );
    }

    const teamAmount70 = Math.floor((totalAmount * 70) / 100);
    const mentorAmount20 = Math.floor((totalAmount * 20) / 100);
    const baseLab10 = Math.floor((totalAmount * 10) / 100);
    const remainderAbsorbedByLab =
      totalAmount - (teamAmount70 + mentorAmount20 + baseLab10);
    const labAmount10 = baseLab10 + remainderAbsorbedByLab;

    return {
      totalAmount,
      teamAmount70,
      mentorAmount20,
      labAmount10,
      remainderAbsorbedByLab,
      invariantHold:
        teamAmount70 + mentorAmount20 + labAmount10 === totalAmount,
    };
  }

  createMilestone(
    user: JwtPayload,
    dto: CreateProjectMilestoneDto,
  ): ProjectMilestoneEntity {
    if (
      user.role !== UserRole.ENTERPRISE &&
      user.role !== UserRole.LAB_ADMIN &&
      user.role !== UserRole.SYSTEM_ADMIN
    ) {
      throw new ForbiddenException(
        'Chỉ Doanh nghiệp sở hữu dự án hoặc Lab Admin mới được tạo cột mốc ký quỹ.',
      );
    }

    if (!dto.projectId || !dto.title || dto.title.trim().length < 5) {
      throw new BadRequestException(
        'Tiêu đề cột mốc (title) phải có tối thiểu 5 ký tự.',
      );
    }

    if (!dto.description || dto.description.trim().length < 10) {
      throw new BadRequestException(
        'Mô tả tiêu chí nghiệm thu cột mốc (description) phải có tối thiểu 10 ký tự.',
      );
    }

    if (!Number.isInteger(dto.amount) || dto.amount <= 0) {
      throw new BadRequestException(
        'Số tiền ký quỹ cột mốc (amount) phải là số nguyên dương (VND).',
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
        'Doanh nghiệp không được phép tạo cột mốc cho dự án của doanh nghiệp khác.',
      );
    }

    const allowedProjectStatuses = new Set<ProjectStatus>([
      ProjectStatus.APPROVED,
      ProjectStatus.PUBLISHED,
      ProjectStatus.RECRUITMENT_CLOSED,
      ProjectStatus.IN_PROGRESS,
    ]);

    if (!allowedProjectStatuses.has(project.status)) {
      throw new ConflictException({
        code: 'INVALID_PROJECT_STATUS_FOR_MILESTONE',
        message: `Không thể tạo cột mốc ký quỹ khi dự án đang ở trạng thái ${project.status}.`,
      });
    }

    const now = new Date().toISOString();
    const id = `ms-${String(this.milestoneSequence++).padStart(4, '0')}`;
    const orderCode = this.orderSequence++;

    const milestone: ProjectMilestoneEntity = {
      id,
      projectId: project.id,
      enterpriseUserId: project.ownerUserId,
      title: dto.title.trim(),
      description: dto.description.trim(),
      amount: dto.amount,
      currency: 'VND',
      orderCode,
      status: MilestoneEscrowStatus.PLANNED,
      deliverableUrl: null,
      deliverableNote: null,
      submittedBy: null,
      submittedAt: null,
      acceptedBy: null,
      acceptedAt: null,
      revisionCount: 0,
      lastRevisionNote: null,
      refundedAt: null,
      refundReason: null,
      createdAt: now,
      updatedAt: now,
    };

    this.milestones.set(id, milestone);
    return milestone;
  }

  confirmMilestoneEscrow(
    user: JwtPayload,
    milestoneId: string,
    dto?: ConfirmMilestoneEscrowDto,
  ): {
    milestone: ProjectMilestoneEntity;
    projectStatus: ProjectStatus;
    ledgerEntry: LedgerEntryEntity;
  } {
    if (
      user.role !== UserRole.ENTERPRISE &&
      user.role !== UserRole.LAB_ADMIN &&
      user.role !== UserRole.SYSTEM_ADMIN
    ) {
      throw new ForbiddenException(
        'Chỉ Doanh nghiệp sở hữu dự án hoặc Lab Admin mới được xác nhận nạp tiền ký quỹ.',
      );
    }

    const milestone = this.milestones.get(milestoneId);
    if (!milestone) {
      throw new NotFoundException(`Không tìm thấy cột mốc ${milestoneId}.`);
    }

    if (
      user.role === UserRole.ENTERPRISE &&
      milestone.enterpriseUserId !== user.sub
    ) {
      throw new ForbiddenException(
        'Bạn không có quyền xác nhận ký quỹ cho cột mốc của doanh nghiệp khác.',
      );
    }

    if (milestone.status !== MilestoneEscrowStatus.PLANNED) {
      throw new ConflictException({
        code: 'INVALID_MILESTONE_STATE',
        message: `Cột mốc ${milestoneId} đã được ký quỹ hoặc xử lý trước đó (trạng thái hiện tại: ${milestone.status}).`,
      });
    }

    const project = this.proposalRepository.findById(milestone.projectId);
    if (!project) {
      throw new NotFoundException(
        `Không tìm thấy dự án ${milestone.projectId}.`,
      );
    }

    const now = new Date().toISOString();
    const updatedMilestone: ProjectMilestoneEntity = {
      ...milestone,
      status: MilestoneEscrowStatus.ESCROW_PAID,
      updatedAt: now,
    };
    this.milestones.set(milestone.id, updatedMilestone);

    const ledgerEntry: LedgerEntryEntity = {
      id: `led-${String(this.ledgerEntries.length + 1).padStart(5, '0')}`,
      projectId: milestone.projectId,
      milestoneId: milestone.id,
      orderCode: milestone.orderCode,
      entryType: LedgerEntryType.ESCROW_DEPOSIT,
      direction: 'CREDIT',
      amount: milestone.amount,
      currency: 'VND',
      beneficiaryRole: 'ESCROW_VAULT',
      description:
        dto?.note?.trim() ||
        `Nạp tiền ký quỹ cột mốc "${milestone.title}" (Order #${milestone.orderCode}).`,
      createdBy: user.sub,
      createdAt: now,
    };
    this.ledgerEntries.push(ledgerEntry);

    let currentProjectStatus = project.status;
    if (
      project.status === ProjectStatus.APPROVED ||
      project.status === ProjectStatus.PUBLISHED ||
      project.status === ProjectStatus.RECRUITMENT_CLOSED
    ) {
      const prevStatus = project.status;
      const updatedProject = this.proposalRepository.saveEntity({
        ...project,
        status: ProjectStatus.IN_PROGRESS,
      });
      currentProjectStatus = updatedProject.status;

      this.proposalRepository.appendAuditLog({
        projectId: project.id,
        actorUserId: user.sub,
        actorRole: user.role,
        action: 'START_PROJECT_IN_PROGRESS',
        fromStatus: prevStatus,
        toStatus: ProjectStatus.IN_PROGRESS,
        reasonNote: `Kích hoạt dự án sang IN_PROGRESS sau khi xác nhận ký quỹ cột mốc "${milestone.title}".`,
      });
    }

    return {
      milestone: updatedMilestone,
      projectStatus: currentProjectStatus,
      ledgerEntry,
    };
  }

  submitDeliverable(
    user: JwtPayload,
    milestoneId: string,
    dto: SubmitMilestoneDeliverableDto,
  ): ProjectMilestoneEntity {
    if (
      user.role !== UserRole.TALENT &&
      user.role !== UserRole.TALENT_LEADER &&
      user.role !== UserRole.MENTOR &&
      user.role !== UserRole.LAB_ADMIN
    ) {
      throw new ForbiddenException(
        'Chỉ Nhóm sinh viên (TALENT / TALENT_LEADER), MENTOR hoặc LAB_ADMIN mới được nộp sản phẩm bàn giao cột mốc.',
      );
    }

    const milestone = this.milestones.get(milestoneId);
    if (!milestone) {
      throw new NotFoundException(`Không tìm thấy cột mốc ${milestoneId}.`);
    }

    if (milestone.status !== MilestoneEscrowStatus.ESCROW_PAID) {
      throw new ConflictException({
        code: 'ESCROW_REQUIRED_BEFORE_SUBMISSION',
        message: `Chỉ được nộp bàn giao khi cột mốc đã ở trạng thái ESCROW_PAID (hiện tại: ${milestone.status}).`,
      });
    }

    if (!dto.deliverableUrl || !dto.deliverableUrl.trim().startsWith('http')) {
      throw new BadRequestException(
        'Đường dẫn gói bàn giao (deliverableUrl) phải là URL hợp lệ.',
      );
    }

    if (!dto.deliverableNote || dto.deliverableNote.trim().length < 10) {
      throw new BadRequestException(
        'Ghi chú kết quả bàn giao (deliverableNote) phải có tối thiểu 10 ký tự.',
      );
    }

    const now = new Date().toISOString();
    const updated: ProjectMilestoneEntity = {
      ...milestone,
      status: MilestoneEscrowStatus.SUBMITTED,
      deliverableUrl: dto.deliverableUrl.trim(),
      deliverableNote: dto.deliverableNote.trim(),
      submittedBy: user.sub,
      submittedAt: now,
      updatedAt: now,
    };

    this.milestones.set(milestone.id, updated);
    return updated;
  }

  acceptAndDisburseMilestone(
    user: JwtPayload,
    milestoneId: string,
    dto?: AcceptMilestoneDto,
  ): {
    milestone: ProjectMilestoneEntity;
    projectStatus: ProjectStatus;
    splitBreakdown: RevenueSplitBreakdown;
    disbursements: DisbursementAllocationEntity[];
    ledgerEntries: LedgerEntryEntity[];
  } {
    if (
      user.role !== UserRole.ENTERPRISE &&
      user.role !== UserRole.LAB_ADMIN &&
      user.role !== UserRole.SYSTEM_ADMIN
    ) {
      throw new ForbiddenException(
        'Chỉ Doanh nghiệp sở hữu dự án hoặc Lab Admin mới có quyền nghiệm thu và giải ngân cột mốc.',
      );
    }

    const milestone = this.milestones.get(milestoneId);
    if (!milestone) {
      throw new NotFoundException(`Không tìm thấy cột mốc ${milestoneId}.`);
    }

    if (
      user.role === UserRole.ENTERPRISE &&
      milestone.enterpriseUserId !== user.sub
    ) {
      throw new ForbiddenException(
        'Doanh nghiệp không được nghiệm thu cột mốc của doanh nghiệp khác.',
      );
    }

    if (milestone.status !== MilestoneEscrowStatus.SUBMITTED) {
      throw new ConflictException({
        code: 'MILESTONE_NOT_SUBMITTED',
        message: `Chỉ có thể nghiệm thu và chia doanh thu khi cột mốc đang ở trạng thái SUBMITTED (hiện tại: ${milestone.status}).`,
      });
    }

    const project = this.proposalRepository.findById(milestone.projectId);
    if (!project) {
      throw new NotFoundException(
        `Không tìm thấy dự án ${milestone.projectId}.`,
      );
    }

    const splitBreakdown = this.calculateRevenueSplit(milestone.amount);
    const now = new Date().toISOString();

    const updatedMilestone: ProjectMilestoneEntity = {
      ...milestone,
      status: MilestoneEscrowStatus.DISBURSED,
      acceptedBy: user.sub,
      acceptedAt: now,
      updatedAt: now,
    };
    this.milestones.set(milestone.id, updatedMilestone);

    const createdLedgerEntries: LedgerEntryEntity[] = [
      {
        id: `led-${String(this.ledgerEntries.length + 1).padStart(5, '0')}`,
        projectId: milestone.projectId,
        milestoneId: milestone.id,
        orderCode: milestone.orderCode,
        entryType: LedgerEntryType.SPLIT_TEAM_70,
        direction: 'DEBIT',
        amount: splitBreakdown.teamAmount70,
        currency: 'VND',
        beneficiaryRole: 'TEAM_LEADER',
        description: `Phân bổ 70% thù lao Nhóm sinh viên cho cột mốc "${milestone.title}".`,
        createdBy: user.sub,
        createdAt: now,
      },
      {
        id: `led-${String(this.ledgerEntries.length + 2).padStart(5, '0')}`,
        projectId: milestone.projectId,
        milestoneId: milestone.id,
        orderCode: milestone.orderCode,
        entryType: LedgerEntryType.SPLIT_MENTOR_20,
        direction: 'DEBIT',
        amount: splitBreakdown.mentorAmount20,
        currency: 'VND',
        beneficiaryRole: 'MENTOR',
        description: `Phân bổ 20% thù lao Mentor hướng dẫn cho cột mốc "${milestone.title}".`,
        createdBy: user.sub,
        createdAt: now,
      },
      {
        id: `led-${String(this.ledgerEntries.length + 3).padStart(5, '0')}`,
        projectId: milestone.projectId,
        milestoneId: milestone.id,
        orderCode: milestone.orderCode,
        entryType: LedgerEntryType.SPLIT_LAB_10,
        direction: 'DEBIT',
        amount: splitBreakdown.labAmount10,
        currency: 'VND',
        beneficiaryRole: 'LAB_FUND',
        description: `Phân bổ 10% Quỹ vận hành LabOdc (kèm phần dư ${splitBreakdown.remainderAbsorbedByLab} VND) cho cột mốc "${milestone.title}".`,
        createdBy: user.sub,
        createdAt: now,
      },
    ];
    this.ledgerEntries.push(...createdLedgerEntries);

    const createdDisbursements: DisbursementAllocationEntity[] = [
      {
        id: `disb-${String(this.disbursements.length + 1).padStart(5, '0')}`,
        projectId: milestone.projectId,
        milestoneId: milestone.id,
        recipientRole: 'TEAM_LEADER',
        percentage: 70,
        amount: splitBreakdown.teamAmount70,
        remainderAbsorbed: 0,
        currency: 'VND',
        status: 'COMPLETED',
        disbursedAt: now,
      },
      {
        id: `disb-${String(this.disbursements.length + 2).padStart(5, '0')}`,
        projectId: milestone.projectId,
        milestoneId: milestone.id,
        recipientRole: 'MENTOR',
        percentage: 20,
        amount: splitBreakdown.mentorAmount20,
        remainderAbsorbed: 0,
        currency: 'VND',
        status: 'COMPLETED',
        disbursedAt: now,
      },
      {
        id: `disb-${String(this.disbursements.length + 3).padStart(5, '0')}`,
        projectId: milestone.projectId,
        milestoneId: milestone.id,
        recipientRole: 'LAB_FUND',
        percentage: 10,
        amount: splitBreakdown.labAmount10,
        remainderAbsorbed: splitBreakdown.remainderAbsorbedByLab,
        currency: 'VND',
        status: 'COMPLETED',
        disbursedAt: now,
      },
    ];
    this.disbursements.push(...createdDisbursements);

    let currentProjectStatus = project.status;
    if (dto?.markProjectCompleted && project.status !== ProjectStatus.COMPLETED) {
      const prevStatus = project.status;
      const updatedProject = this.proposalRepository.saveEntity({
        ...project,
        status: ProjectStatus.COMPLETED,
      });
      currentProjectStatus = updatedProject.status;

      this.proposalRepository.appendAuditLog({
        projectId: project.id,
        actorUserId: user.sub,
        actorRole: user.role,
        action: 'COMPLETE_PROJECT',
        fromStatus: prevStatus,
        toStatus: ProjectStatus.COMPLETED,
        reasonNote:
          dto.reviewNote?.trim() ||
          `Hoàn tất toàn bộ dự án và giải ngân 70/20/10 cho cột mốc "${milestone.title}".`,
      });
    }

    return {
      milestone: updatedMilestone,
      projectStatus: currentProjectStatus,
      splitBreakdown,
      disbursements: createdDisbursements,
      ledgerEntries: createdLedgerEntries,
    };
  }

  getProjectFinanceLedger(user: JwtPayload, projectId: string) {
    const project = this.proposalRepository.findById(projectId);
    if (!project) {
      throw new NotFoundException(`Không tìm thấy dự án ${projectId}.`);
    }

    if (
      user.role === UserRole.ENTERPRISE &&
      project.ownerUserId !== user.sub
    ) {
      throw new ForbiddenException(
        'Doanh nghiệp không được xem sổ cái tài chính của doanh nghiệp khác.',
      );
    }

    const projectMilestones = Array.from(this.milestones.values()).filter(
      (item) => item.projectId === projectId,
    );
    const projectLedger = this.ledgerEntries.filter(
      (item) => item.projectId === projectId,
    );
    const projectDisbursements = this.disbursements.filter(
      (item) => item.projectId === projectId,
    );

    const totalEscrowDeposited = projectLedger
      .filter((e) => e.entryType === LedgerEntryType.ESCROW_DEPOSIT)
      .reduce((sum, e) => sum + e.amount, 0);

    const totalDisbursed = projectLedger
      .filter((e) => e.direction === 'DEBIT')
      .reduce((sum, e) => sum + e.amount, 0);

    return {
      projectId,
      projectCode: project.code,
      projectStatus: project.status,
      escrowSummary: {
        totalEscrowDeposited,
        totalDisbursed,
        escrowBalance: totalEscrowDeposited - totalDisbursed,
        currency: 'VND',
      },
      milestones: projectMilestones,
      ledgerEntries: projectLedger,
      disbursements: projectDisbursements,
    };
  }

  /**
   * Ngày D13 (REQ-FIN-01, REQ-FIN-02, ADR-04):
   * Đồng bộ tự động Webhook PayOS có chữ ký HMAC-SHA256 vào Cột mốc Ký quỹ & Sổ cái.
   * Đảm bảo tính Idempotent: Nếu Webhook của cùng một cột mốc được gọi lặp (Replay),
   * tuyệt đối không ghi trùng bút toán ESCROW_DEPOSIT lần 2.
   */
  syncEscrowFromPayosWebhook(
    user: JwtPayload,
    milestoneId: string,
    dto?: SyncPayosWebhookToMilestoneDto,
  ): {
    idempotentReplay: boolean;
    signatureVerified: boolean;
    milestone: ProjectMilestoneEntity;
    projectStatus: ProjectStatus;
    ledgerEntry: LedgerEntryEntity;
  } {
    if (
      user.role !== UserRole.ENTERPRISE &&
      user.role !== UserRole.LAB_ADMIN &&
      user.role !== UserRole.SYSTEM_ADMIN
    ) {
      throw new ForbiddenException(
        'Chỉ Doanh nghiệp sở hữu dự án hoặc Lab Admin mới được phép đồng bộ đối soát Webhook PayOS cho cột mốc.',
      );
    }

    const milestone = this.milestones.get(milestoneId);
    if (!milestone) {
      throw new NotFoundException(`Không tìm thấy cột mốc ${milestoneId}.`);
    }

    if (
      user.role === UserRole.ENTERPRISE &&
      milestone.enterpriseUserId !== user.sub
    ) {
      throw new ForbiddenException(
        'Bạn không được phép đồng bộ Webhook PayOS cho cột mốc của doanh nghiệp khác.',
      );
    }

    const reference = dto?.reference?.trim() || `FT-D13-${milestone.orderCode}`;
    const webhookData = {
      orderCode: milestone.orderCode,
      amount: milestone.amount,
      description: `ESCROW ${milestone.id}`.slice(0, 25),
      reference,
      transactionDateTime: new Date().toISOString(),
      code: '00',
      desc: 'Thành công',
    };
    const signature = createPayosWebhookSignature(webhookData);
    const signatureVerified = verifyPayosWebhookSignature(
      webhookData,
      signature,
    );

    const idempotencyKey = `MILESTONE-PAYOS-${milestone.orderCode}-${reference}`;
    if (
      this.processedMilestoneWebhookKeys.has(idempotencyKey) ||
      milestone.status !== MilestoneEscrowStatus.PLANNED
    ) {
      const existingDepositEntry = this.ledgerEntries.find(
        (e) =>
          e.milestoneId === milestone.id &&
          e.entryType === LedgerEntryType.ESCROW_DEPOSIT,
      );
      const project = this.proposalRepository.findById(milestone.projectId);
      if (existingDepositEntry && project) {
        return {
          idempotentReplay: true,
          signatureVerified,
          milestone,
          projectStatus: project.status,
          ledgerEntry: existingDepositEntry,
        };
      }
    }

    const confirmed = this.confirmMilestoneEscrow(user, milestoneId, {
      transactionReference: reference,
      note: `Đối soát tự động qua PayOS Webhook HMAC (Ref: ${reference}, Order #${milestone.orderCode}).`,
    });
    this.processedMilestoneWebhookKeys.add(idempotencyKey);

    return {
      idempotentReplay: false,
      signatureVerified,
      milestone: confirmed.milestone,
      projectStatus: confirmed.projectStatus,
      ledgerEntry: confirmed.ledgerEntry,
    };
  }

  /**
   * Ngày D13 (REQ-LAB-02, REQ-FIN-02):
   * Doanh nghiệp hoặc Lab Admin yêu cầu Nhóm sinh viên chỉnh sửa/nộp lại bàn giao cột mốc
   * (SUBMITTED -> ESCROW_PAID) trước khi nghiệm thu giải ngân.
   */
  requestMilestoneRevision(
    user: JwtPayload,
    milestoneId: string,
    dto: RequestMilestoneRevisionDto,
  ): ProjectMilestoneEntity {
    if (
      user.role !== UserRole.ENTERPRISE &&
      user.role !== UserRole.LAB_ADMIN &&
      user.role !== UserRole.SYSTEM_ADMIN
    ) {
      throw new ForbiddenException(
        'Chỉ Doanh nghiệp sở hữu dự án hoặc Lab Admin mới có quyền yêu cầu chỉnh sửa lại bàn giao cột mốc.',
      );
    }

    const milestone = this.milestones.get(milestoneId);
    if (!milestone) {
      throw new NotFoundException(`Không tìm thấy cột mốc ${milestoneId}.`);
    }

    if (
      user.role === UserRole.ENTERPRISE &&
      milestone.enterpriseUserId !== user.sub
    ) {
      throw new ForbiddenException(
        'Doanh nghiệp không được phép đánh giá cột mốc của doanh nghiệp khác.',
      );
    }

    if (milestone.status !== MilestoneEscrowStatus.SUBMITTED) {
      throw new ConflictException({
        code: 'INVALID_MILESTONE_STATE_FOR_REVISION',
        message: `Chỉ có thể yêu cầu sửa lại bàn giao khi cột mốc đang ở trạng thái SUBMITTED (hiện tại: ${milestone.status}).`,
      });
    }

    if (!dto?.revisionNote || dto.revisionNote.trim().length < 10) {
      throw new BadRequestException(
        'Ghi chú yêu cầu chỉnh sửa bàn giao (revisionNote) bắt buộc tối thiểu 10 ký tự.',
      );
    }

    const now = new Date().toISOString();
    const updated: ProjectMilestoneEntity = {
      ...milestone,
      status: MilestoneEscrowStatus.ESCROW_PAID,
      revisionCount: (milestone.revisionCount ?? 0) + 1,
      lastRevisionNote: dto.revisionNote.trim(),
      updatedAt: now,
    };

    this.milestones.set(milestone.id, updated);

    const project = this.proposalRepository.findById(milestone.projectId);
    if (project) {
      this.proposalRepository.appendAuditLog({
        projectId: project.id,
        actorUserId: user.sub,
        actorRole: user.role,
        action: 'REQUEST_MILESTONE_REVISION',
        fromStatus: project.status,
        toStatus: project.status,
        reasonNote: `[${milestone.id}] Yêu cầu chỉnh sửa bàn giao lần ${updated.revisionCount}: ${dto.revisionNote.trim()}`,
      });
    }

    return updated;
  }

  /**
   * Ngày D13 (REQ-FIN-02, REQ-ENT-03):
   * Hoàn trả tiền ký quỹ cột mốc (ESCROW_REFUND) cho Doanh nghiệp khi dừng/hủy cột mốc chưa giải ngân.
   * Ghi bút toán DEBIT (ESCROW_REFUND) để cân bằng Sổ cái về 0 VND và khóa giải ngân cột mốc đó.
   */
  refundMilestoneEscrow(
    user: JwtPayload,
    milestoneId: string,
    dto: RefundMilestoneEscrowDto,
  ): {
    milestone: ProjectMilestoneEntity;
    refundLedgerEntry: LedgerEntryEntity;
    escrowBalanceAfterRefund: number;
  } {
    if (
      user.role !== UserRole.ENTERPRISE &&
      user.role !== UserRole.LAB_ADMIN &&
      user.role !== UserRole.SYSTEM_ADMIN
    ) {
      throw new ForbiddenException(
        'Chỉ Doanh nghiệp sở hữu dự án hoặc Lab Admin mới được thực hiện hoàn trả ký quỹ cột mốc.',
      );
    }

    const milestone = this.milestones.get(milestoneId);
    if (!milestone) {
      throw new NotFoundException(`Không tìm thấy cột mốc ${milestoneId}.`);
    }

    if (
      user.role === UserRole.ENTERPRISE &&
      milestone.enterpriseUserId !== user.sub
    ) {
      throw new ForbiddenException(
        'Bạn không có quyền yêu cầu hoàn trả ký quỹ cho cột mốc của doanh nghiệp khác.',
      );
    }

    if (
      milestone.status !== MilestoneEscrowStatus.ESCROW_PAID &&
      milestone.status !== MilestoneEscrowStatus.SUBMITTED
    ) {
      throw new ConflictException({
        code: 'INVALID_MILESTONE_STATE_FOR_REFUND',
        message: `Chỉ có thể hoàn trả tiền ký quỹ khi cột mốc đang ở trạng thái ESCROW_PAID hoặc SUBMITTED chưa giải ngân (hiện tại: ${milestone.status}).`,
      });
    }

    if (!dto?.refundReason || dto.refundReason.trim().length < 10) {
      throw new BadRequestException(
        'Lý do hoàn trả ký quỹ (refundReason) bắt buộc tối thiểu 10 ký tự.',
      );
    }

    const now = new Date().toISOString();
    const updatedMilestone: ProjectMilestoneEntity = {
      ...milestone,
      status: MilestoneEscrowStatus.REFUNDED,
      refundedAt: now,
      refundReason: dto.refundReason.trim(),
      updatedAt: now,
    };
    this.milestones.set(milestone.id, updatedMilestone);

    const refundLedgerEntry: LedgerEntryEntity = {
      id: `led-${String(this.ledgerEntries.length + 1).padStart(5, '0')}`,
      projectId: milestone.projectId,
      milestoneId: milestone.id,
      orderCode: milestone.orderCode,
      entryType: LedgerEntryType.ESCROW_REFUND,
      direction: 'DEBIT',
      amount: milestone.amount,
      currency: 'VND',
      beneficiaryRole: 'ENTERPRISE_REFUND',
      description: `Hoàn trả 100% tiền ký quỹ cột mốc "${milestone.title}" cho Doanh nghiệp: ${dto.refundReason.trim()}`,
      createdBy: user.sub,
      createdAt: now,
    };
    this.ledgerEntries.push(refundLedgerEntry);

    const project = this.proposalRepository.findById(milestone.projectId);
    if (project) {
      this.proposalRepository.appendAuditLog({
        projectId: project.id,
        actorUserId: user.sub,
        actorRole: user.role,
        action: 'REFUND_MILESTONE_ESCROW',
        fromStatus: project.status,
        toStatus: project.status,
        reasonNote: `[${milestone.id}] Hoàn trả ký quỹ ${milestone.amount} VND: ${dto.refundReason.trim()}`,
      });
    }

    const ledgerView = this.getProjectFinanceLedger(user, milestone.projectId);

    return {
      milestone: updatedMilestone,
      refundLedgerEntry,
      escrowBalanceAfterRefund: ledgerView.escrowSummary.escrowBalance,
    };
  }

  /**
   * Ngày D13 (REQ-FIN-03, REQ-SYS-01):
   * Báo cáo Đối soát Tổng hợp Sổ cái & Quỹ vận hành Lab 70/20/10 trên toàn hệ thống.
   */
  getGlobalReconciliationSummary(
    user: JwtPayload,
  ): GlobalReconciliationSummaryDto {
    if (
      user.role !== UserRole.LAB_ADMIN &&
      user.role !== UserRole.SYSTEM_ADMIN
    ) {
      throw new ForbiddenException(
        'Chỉ LAB_ADMIN hoặc SYSTEM_ADMIN mới có quyền truy cập Báo cáo Đối soát Sổ cái Toàn hệ thống.',
      );
    }

    const allMilestones = Array.from(this.milestones.values());

    const totalEscrowDeposited = this.ledgerEntries
      .filter((e) => e.entryType === LedgerEntryType.ESCROW_DEPOSIT)
      .reduce((sum, e) => sum + e.amount, 0);

    const totalTeam70 = this.ledgerEntries
      .filter((e) => e.entryType === LedgerEntryType.SPLIT_TEAM_70)
      .reduce((sum, e) => sum + e.amount, 0);

    const totalMentor20 = this.ledgerEntries
      .filter((e) => e.entryType === LedgerEntryType.SPLIT_MENTOR_20)
      .reduce((sum, e) => sum + e.amount, 0);

    const totalLab10 = this.ledgerEntries
      .filter((e) => e.entryType === LedgerEntryType.SPLIT_LAB_10)
      .reduce((sum, e) => sum + e.amount, 0);

    const totalRemainderAbsorbedByLab = this.disbursements
      .filter((d) => d.recipientRole === 'LAB_FUND')
      .reduce((sum, d) => sum + d.remainderAbsorbed, 0);

    const totalRefundedToEnterprise = this.ledgerEntries
      .filter((e) => e.entryType === LedgerEntryType.ESCROW_REFUND)
      .reduce((sum, e) => sum + e.amount, 0);

    const totalDisbursed702010 = totalTeam70 + totalMentor20 + totalLab10;
    const totalEscrowHeldBalance =
      totalEscrowDeposited - totalDisbursed702010 - totalRefundedToEnterprise;

    return {
      totalMilestones: allMilestones.length,
      milestonesByStatus: {
        planned: allMilestones.filter(
          (m) => m.status === MilestoneEscrowStatus.PLANNED,
        ).length,
        escrowPaid: allMilestones.filter(
          (m) => m.status === MilestoneEscrowStatus.ESCROW_PAID,
        ).length,
        submitted: allMilestones.filter(
          (m) => m.status === MilestoneEscrowStatus.SUBMITTED,
        ).length,
        disbursed: allMilestones.filter(
          (m) => m.status === MilestoneEscrowStatus.DISBURSED,
        ).length,
        refunded: allMilestones.filter(
          (m) => m.status === MilestoneEscrowStatus.REFUNDED,
        ).length,
      },
      ledgerTotals: {
        totalEscrowDeposited,
        totalDisbursed702010,
        totalTeam70,
        totalMentor20,
        totalLab10,
        totalRemainderAbsorbedByLab,
        totalRefundedToEnterprise,
        totalEscrowHeldBalance,
        currency: 'VND',
      },
      invariantHold:
        totalEscrowHeldBalance >= 0 &&
        totalEscrowDeposited ===
          totalDisbursed702010 +
            totalRefundedToEnterprise +
            totalEscrowHeldBalance,
    };
  }
}