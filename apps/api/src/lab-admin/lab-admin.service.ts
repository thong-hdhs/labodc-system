import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  JwtPayload,
  ProjectStatus,
  ProposalRejectionReasonCode,
  UserRole,
} from '@labodc/shared-types';
import { ProjectProposalRepository } from '../projects/project-proposal.repository';
import {
  ChangeRequestStatus,
  ChangeRequestType,
  ProjectAuditLogEntity,
  ProjectChangeRequestEntity,
  ProjectProposalEntity,
} from '../projects/project-proposal.types';
import {
  ApproveChangeRequestDto,
  ApproveProposalDto,
  LifecycleNoteDto,
  PublishProjectDto,
  RejectChangeRequestDto,
  ReviewDecisionWithReasonDto,
} from './lab-admin.types';

const VALID_REASON_CODES = new Set<string>(
  Object.values(ProposalRejectionReasonCode),
);

@Injectable()
export class LabAdminService {
  constructor(private readonly proposalRepository: ProjectProposalRepository) {}

  private ensureLabAdminRole(user: JwtPayload): void {
    if (
      user.role !== UserRole.LAB_ADMIN &&
      user.role !== UserRole.SYSTEM_ADMIN
    ) {
      throw new ForbiddenException(
        'Chỉ LAB_ADMIN hoặc SYSTEM_ADMIN mới có quyền thực hiện nghiệp vụ xét duyệt của Lab.',
      );
    }
  }

  private validateReasonPayload(dto: ReviewDecisionWithReasonDto): void {
    if (!dto.reasonCode || !VALID_REASON_CODES.has(dto.reasonCode)) {
      throw new BadRequestException(
        'Mã lý do (reasonCode) không hợp lệ. Phải thuộc danh mục chuẩn của LabOdc.',
      );
    }

    if (!dto.reasonNote || dto.reasonNote.trim().length < 15) {
      throw new BadRequestException(
        'Ghi chú lý do (reasonNote) là bắt buộc và phải có tối thiểu 15 ký tự.',
      );
    }
  }

  listReviewQueue(
    user: JwtPayload,
    status?: ProjectStatus,
  ): ProjectProposalEntity[] {
    this.ensureLabAdminRole(user);
    return this.proposalRepository.findAll(status);
  }

  getProposalReviewDetail(
    user: JwtPayload,
    projectId: string,
  ): {
    proposal: ProjectProposalEntity;
    auditLogs: ProjectAuditLogEntity[];
  } {
    this.ensureLabAdminRole(user);
    const proposal = this.proposalRepository.findById(projectId);
    if (!proposal) {
      throw new NotFoundException(`Không tìm thấy đề xuất dự án ${projectId}.`);
    }

    return {
      proposal,
      auditLogs: this.proposalRepository.getAuditLogs(projectId),
    };
  }

  approveProposal(
    user: JwtPayload,
    projectId: string,
    dto?: ApproveProposalDto,
  ): ProjectProposalEntity {
    this.ensureLabAdminRole(user);
    const proposal = this.proposalRepository.findById(projectId);
    if (!proposal) {
      throw new NotFoundException(`Không tìm thấy đề xuất dự án ${projectId}.`);
    }

    if (proposal.status !== ProjectStatus.SUBMITTED) {
      throw new ConflictException({
        code: 'INVALID_STATE_TRANSITION',
        message: `Chỉ có thể phê duyệt đề xuất đang ở trạng thái SUBMITTED (trạng thái hiện tại: ${proposal.status}).`,
      });
    }

    const now = new Date().toISOString();
    const note =
      dto?.reviewNote?.trim() ||
      'Lab Admin đã phê duyệt nội dung đề xuất dự án.';

    const updated = this.proposalRepository.saveEntity({
      ...proposal,
      status: ProjectStatus.APPROVED,
      reasonCode: null,
      reviewNote: note,
      approvedBy: user.sub,
      approvedAt: now,
    });

    this.proposalRepository.appendAuditLog({
      projectId: updated.id,
      actorUserId: user.sub,
      actorRole: user.role,
      action: 'APPROVE_PROPOSAL',
      fromStatus: ProjectStatus.SUBMITTED,
      toStatus: ProjectStatus.APPROVED,
      reasonNote: note,
    });

    return updated;
  }

  requestChanges(
    user: JwtPayload,
    projectId: string,
    dto: ReviewDecisionWithReasonDto,
  ): ProjectProposalEntity {
    this.ensureLabAdminRole(user);
    const proposal = this.proposalRepository.findById(projectId);
    if (!proposal) {
      throw new NotFoundException(`Không tìm thấy đề xuất dự án ${projectId}.`);
    }

    if (proposal.status !== ProjectStatus.SUBMITTED) {
      throw new ConflictException({
        code: 'INVALID_STATE_TRANSITION',
        message: `Chỉ có thể yêu cầu bổ sung đối với đề xuất đang ở trạng thái SUBMITTED (hiện tại: ${proposal.status}).`,
      });
    }

    this.validateReasonPayload(dto);

    const updated = this.proposalRepository.saveEntity({
      ...proposal,
      status: ProjectStatus.CHANGES_REQUESTED,
      reasonCode: dto.reasonCode,
      reviewNote: dto.reasonNote.trim(),
    });

    this.proposalRepository.appendAuditLog({
      projectId: updated.id,
      actorUserId: user.sub,
      actorRole: user.role,
      action: 'REQUEST_CHANGES',
      fromStatus: ProjectStatus.SUBMITTED,
      toStatus: ProjectStatus.CHANGES_REQUESTED,
      reasonCode: dto.reasonCode,
      reasonNote: dto.reasonNote.trim(),
    });

    return updated;
  }

  rejectProposal(
    user: JwtPayload,
    projectId: string,
    dto: ReviewDecisionWithReasonDto,
  ): ProjectProposalEntity {
    this.ensureLabAdminRole(user);
    const proposal = this.proposalRepository.findById(projectId);
    if (!proposal) {
      throw new NotFoundException(`Không tìm thấy đề xuất dự án ${projectId}.`);
    }

    if (proposal.status !== ProjectStatus.SUBMITTED) {
      throw new ConflictException({
        code: 'INVALID_STATE_TRANSITION',
        message: `Chỉ có thể từ chối đề xuất đang ở trạng thái SUBMITTED (hiện tại: ${proposal.status}).`,
      });
    }

    this.validateReasonPayload(dto);

    const updated = this.proposalRepository.saveEntity({
      ...proposal,
      status: ProjectStatus.REJECTED,
      reasonCode: dto.reasonCode,
      reviewNote: dto.reasonNote.trim(),
    });

    this.proposalRepository.appendAuditLog({
      projectId: updated.id,
      actorUserId: user.sub,
      actorRole: user.role,
      action: 'REJECT_PROPOSAL',
      fromStatus: ProjectStatus.SUBMITTED,
      toStatus: ProjectStatus.REJECTED,
      reasonCode: dto.reasonCode,
      reasonNote: dto.reasonNote.trim(),
    });

    return updated;
  }

  publishProject(
    user: JwtPayload,
    projectId: string,
    dto: PublishProjectDto,
  ): ProjectProposalEntity {
    this.ensureLabAdminRole(user);
    const proposal = this.proposalRepository.findById(projectId);
    if (!proposal) {
      throw new NotFoundException(`Không tìm thấy dự án ${projectId}.`);
    }

    if (
      proposal.status !== ProjectStatus.APPROVED &&
      proposal.status !== ProjectStatus.UNPUBLISHED &&
      proposal.status !== ProjectStatus.RECRUITMENT_CLOSED
    ) {
      throw new ConflictException({
        code: 'INVALID_STATE_TRANSITION',
        message: `Chỉ có thể công bố (PUBLISH) dự án đang ở trạng thái APPROVED, UNPUBLISHED hoặc RECRUITMENT_CLOSED (hiện tại: ${proposal.status}).`,
      });
    }

    if (!dto.registrationCloseAt) {
      throw new BadRequestException(
        'Bắt buộc thiết lập hạn đóng nhận đơn ứng tuyển (registrationCloseAt) khi công bố dự án.',
      );
    }

    const closeDate = new Date(dto.registrationCloseAt);
    const openDate = dto.registrationOpenAt
      ? new Date(dto.registrationOpenAt)
      : new Date();

    if (
      Number.isNaN(closeDate.getTime()) ||
      Number.isNaN(openDate.getTime()) ||
      closeDate.getTime() <= Date.now() ||
      closeDate.getTime() <= openDate.getTime()
    ) {
      throw new BadRequestException(
        'Thời hạn đóng nhận đơn (registrationCloseAt) phải là thời điểm hợp lệ trong tương lai và sau ngày mở đơn.',
      );
    }

    const fromStatus = proposal.status;
    const now = new Date().toISOString();
    const updated = this.proposalRepository.saveEntity({
      ...proposal,
      status: ProjectStatus.PUBLISHED,
      registrationOpenAt: openDate.toISOString(),
      registrationCloseAt: closeDate.toISOString(),
      publishedAt: now,
      reviewNote: dto.note?.trim() || proposal.reviewNote,
    });

    this.proposalRepository.appendAuditLog({
      projectId: updated.id,
      actorUserId: user.sub,
      actorRole: user.role,
      action: 'PUBLISH_PROJECT',
      fromStatus,
      toStatus: ProjectStatus.PUBLISHED,
      reasonNote:
        dto.note?.trim() ||
        `Công bố dự án mở nhận đơn đến ${closeDate.toISOString()}.`,
    });

    return updated;
  }

  unpublishProject(
    user: JwtPayload,
    projectId: string,
    dto?: LifecycleNoteDto,
  ): ProjectProposalEntity {
    this.ensureLabAdminRole(user);
    const proposal = this.proposalRepository.findById(projectId);
    if (!proposal) {
      throw new NotFoundException(`Không tìm thấy dự án ${projectId}.`);
    }

    if (proposal.status !== ProjectStatus.PUBLISHED) {
      throw new ConflictException({
        code: 'INVALID_STATE_TRANSITION',
        message: `Chỉ có thể tạm ẩn (UNPUBLISH) dự án đang ở trạng thái PUBLISHED (hiện tại: ${proposal.status}).`,
      });
    }

    const updated = this.proposalRepository.saveEntity({
      ...proposal,
      status: ProjectStatus.UNPUBLISHED,
    });

    this.proposalRepository.appendAuditLog({
      projectId: updated.id,
      actorUserId: user.sub,
      actorRole: user.role,
      action: 'UNPUBLISH_PROJECT',
      fromStatus: ProjectStatus.PUBLISHED,
      toStatus: ProjectStatus.UNPUBLISHED,
      reasonNote: dto?.note?.trim() || 'Lab Admin tạm ẩn dự án khỏi cổng công khai.',
    });

    return updated;
  }

  closeRecruitment(
    user: JwtPayload,
    projectId: string,
    dto?: LifecycleNoteDto,
  ): ProjectProposalEntity {
    this.ensureLabAdminRole(user);
    const proposal = this.proposalRepository.findById(projectId);
    if (!proposal) {
      throw new NotFoundException(`Không tìm thấy dự án ${projectId}.`);
    }

    if (proposal.status !== ProjectStatus.PUBLISHED) {
      throw new ConflictException({
        code: 'INVALID_STATE_TRANSITION',
        message: `Chỉ có thể đóng nhận đơn (RECRUITMENT_CLOSED) khi dự án đang ở trạng thái PUBLISHED (hiện tại: ${proposal.status}).`,
      });
    }

    const updated = this.proposalRepository.saveEntity({
      ...proposal,
      status: ProjectStatus.RECRUITMENT_CLOSED,
    });

    this.proposalRepository.appendAuditLog({
      projectId: updated.id,
      actorUserId: user.sub,
      actorRole: user.role,
      action: 'CLOSE_RECRUITMENT',
      fromStatus: ProjectStatus.PUBLISHED,
      toStatus: ProjectStatus.RECRUITMENT_CLOSED,
      reasonNote:
        dto?.note?.trim() || 'Lab Admin đóng cổng nhận đơn ứng tuyển của dự án.',
    });

    return updated;
  }

  /**
   * Chuyển dự án sang trạng thái đang thực hiện (IN_PROGRESS)
   */
  startProjectProgress(
    user: JwtPayload,
    projectId: string,
    dto?: LifecycleNoteDto,
  ): ProjectProposalEntity {
    this.ensureLabAdminRole(user);
    const proposal = this.proposalRepository.findById(projectId);
    if (!proposal) {
      throw new NotFoundException(`Không tìm thấy dự án ${projectId}.`);
    }

    if (
      proposal.status !== ProjectStatus.PUBLISHED &&
      proposal.status !== ProjectStatus.RECRUITMENT_CLOSED
    ) {
      throw new ConflictException({
        code: 'INVALID_STATE_TRANSITION',
        message: `Chỉ có thể bắt đầu triển khai (IN_PROGRESS) khi dự án đang ở trạng thái PUBLISHED hoặc RECRUITMENT_CLOSED (hiện tại: ${proposal.status}).`,
      });
    }

    const fromStatus = proposal.status;
    const updated = this.proposalRepository.saveEntity({
      ...proposal,
      status: ProjectStatus.IN_PROGRESS,
      reviewNote: dto?.note?.trim() || proposal.reviewNote,
    });

    this.proposalRepository.appendAuditLog({
      projectId: updated.id,
      actorUserId: user.sub,
      actorRole: user.role,
      action: 'START_PROJECT_PROGRESS',
      fromStatus,
      toStatus: ProjectStatus.IN_PROGRESS,
      reasonNote:
        dto?.note?.trim() || 'Lab Admin kích hoạt dự án sang trạng thái IN_PROGRESS.',
    });

    return updated;
  }

  /**
   * REQ-LAB-02 (Ngày D11): Hàng đợi xét duyệt yêu cầu Đổi phạm vi / Hủy dự án
   */
  listChangeRequestsQueue(
    user: JwtPayload,
    status?: ChangeRequestStatus,
  ): ProjectChangeRequestEntity[] {
    this.ensureLabAdminRole(user);
    return this.proposalRepository.findAllChangeRequests(status);
  }

  approveChangeRequest(
    user: JwtPayload,
    requestId: string,
    dto?: ApproveChangeRequestDto,
  ): {
    changeRequest: ProjectChangeRequestEntity;
    project: ProjectProposalEntity;
  } {
    this.ensureLabAdminRole(user);
    const reqEntity = this.proposalRepository.findChangeRequestById(requestId);
    if (!reqEntity) {
      throw new NotFoundException(
        `Không tìm thấy yêu cầu thay đổi/hủy ${requestId}.`,
      );
    }

    if (reqEntity.status !== ChangeRequestStatus.PENDING_APPROVAL) {
      throw new ConflictException({
        code: 'INVALID_CHANGE_REQUEST_STATE',
        message: `Chỉ có thể phê duyệt yêu cầu đang ở trạng thái PENDING_APPROVAL (hiện tại: ${reqEntity.status}).`,
      });
    }

    const project = this.proposalRepository.findById(reqEntity.projectId);
    if (!project) {
      throw new NotFoundException(
        `Không tìm thấy dự án ${reqEntity.projectId}.`,
      );
    }

    const now = new Date().toISOString();
    const reviewNote =
      dto?.reviewNote?.trim() ||
      'Lab Admin đã phê duyệt yêu cầu thay đổi/hủy dự án.';

    let updatedProject: ProjectProposalEntity;

    if (reqEntity.requestType === ChangeRequestType.CANCEL) {
      const fromStatus = project.status;
      const settlementNote =
        dto?.financialSettlementNote?.trim() ||
        (fromStatus === ProjectStatus.IN_PROGRESS
          ? 'Quyết toán theo tỷ lệ khối lượng công việc đã nghiệm thu và khóa các đợt phân bổ quỹ mới (DEC-A04).'
          : 'Hủy trước khi triển khai: Hoàn trả 100% khoản đóng góp nếu doanh nghiệp đã tạm nộp.');

      updatedProject = this.proposalRepository.saveEntity({
        ...project,
        status: ProjectStatus.CANCELLED,
        reviewNote: `${reviewNote} | Quyết toán: ${settlementNote}`,
      });

      this.proposalRepository.appendAuditLog({
        projectId: project.id,
        actorUserId: user.sub,
        actorRole: user.role,
        action: 'APPROVE_PROJECT_CANCELLATION',
        fromStatus,
        toStatus: ProjectStatus.CANCELLED,
        reasonNote: `[${reqEntity.code}] ${reviewNote} (${settlementNote})`,
      });

      const updatedReq = this.proposalRepository.saveChangeRequest({
        ...reqEntity,
        status: ChangeRequestStatus.APPROVED,
        financialSettlementNote: settlementNote,
        reviewedBy: user.sub,
        reviewNote,
        reviewedAt: now,
      });

      return { changeRequest: updatedReq, project: updatedProject };
    }

    // Xử lý phê duyệt Đổi phạm vi (SCOPE_CHANGE)
    updatedProject = this.proposalRepository.saveEntity({
      ...project,
      deliverables:
        reqEntity.proposedDeliverables ?? project.deliverables,
      budgetAmount:
        reqEntity.proposedBudgetAmount ?? project.budgetAmount,
      durationWeeks:
        reqEntity.proposedDurationWeeks ?? project.durationWeeks,
      maxTeamSize:
        reqEntity.proposedMaxTeamSize ?? project.maxTeamSize,
      reviewNote,
    });

    this.proposalRepository.appendAuditLog({
      projectId: project.id,
      actorUserId: user.sub,
      actorRole: user.role,
      action: 'APPROVE_SCOPE_CHANGE',
      fromStatus: project.status,
      toStatus: updatedProject.status,
      reasonNote: `[${reqEntity.code}] Đã áp dụng thay đổi phạm vi dự án: ${reviewNote}`,
    });

    const updatedReq = this.proposalRepository.saveChangeRequest({
      ...reqEntity,
      status: ChangeRequestStatus.APPROVED,
      financialSettlementNote: dto?.financialSettlementNote?.trim() || null,
      reviewedBy: user.sub,
      reviewNote,
      reviewedAt: now,
    });

    return { changeRequest: updatedReq, project: updatedProject };
  }

  rejectChangeRequest(
    user: JwtPayload,
    requestId: string,
    dto: RejectChangeRequestDto,
  ): ProjectChangeRequestEntity {
    this.ensureLabAdminRole(user);
    const reqEntity = this.proposalRepository.findChangeRequestById(requestId);
    if (!reqEntity) {
      throw new NotFoundException(
        `Không tìm thấy yêu cầu thay đổi/hủy ${requestId}.`,
      );
    }

    if (reqEntity.status !== ChangeRequestStatus.PENDING_APPROVAL) {
      throw new ConflictException({
        code: 'INVALID_CHANGE_REQUEST_STATE',
        message: `Chỉ có thể từ chối yêu cầu đang ở trạng thái PENDING_APPROVAL (hiện tại: ${reqEntity.status}).`,
      });
    }

    if (!dto?.reviewNote || dto.reviewNote.trim().length < 10) {
      throw new BadRequestException(
        'Lý do từ chối yêu cầu thay đổi/hủy (reviewNote) bắt buộc tối thiểu 10 ký tự.',
      );
    }

    const project = this.proposalRepository.findById(reqEntity.projectId);
    const now = new Date().toISOString();

    const updatedReq = this.proposalRepository.saveChangeRequest({
      ...reqEntity,
      status: ChangeRequestStatus.REJECTED,
      reviewedBy: user.sub,
      reviewNote: dto.reviewNote.trim(),
      reviewedAt: now,
    });

    if (project) {
      this.proposalRepository.appendAuditLog({
        projectId: project.id,
        actorUserId: user.sub,
        actorRole: user.role,
        action: 'REJECT_CHANGE_REQUEST',
        fromStatus: project.status,
        toStatus: project.status,
        reasonNote: `[${reqEntity.code}] Từ chối yêu cầu ${reqEntity.requestType}: ${dto.reviewNote.trim()}`,
      });
    }

    return updatedReq;
  }
}