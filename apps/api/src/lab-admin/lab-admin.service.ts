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
  ProjectAuditLogEntity,
  ProjectProposalEntity,
} from '../projects/project-proposal.types';
import {
  ApproveProposalDto,
  LifecycleNoteDto,
  PublishProjectDto,
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

    // Cho phép công bố dự án từ APPROVED, UNPUBLISHED hoặc RECRUITMENT_CLOSED.
    if (
      proposal.status !== ProjectStatus.APPROVED &&
      proposal.status !== ProjectStatus.UNPUBLISHED &&
      proposal.status !== ProjectStatus.RECRUITMENT_CLOSED
    ) {
      throw new ConflictException({
        code: 'INVALID_STATE_TRANSITION',
        message: `Chỉ có thể công bố (PUBLISH) dự án đang ở trạng thái APPROVED, UNPUBLISHED hoặc RECRUITMENT\_CLOSED (hiện tại: ${proposal.status}).`,
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
      reasonNote:
        dto?.note?.trim() || 'Lab Admin tạm ẩn dự án khỏi cổng công khai.',
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
        message: `Chỉ có thể đóng nhận đơn (RECRUITMENT\_CLOSED) khi dự án đang ở trạng thái PUBLISHED (hiện tại: ${proposal.status}).`,
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
}