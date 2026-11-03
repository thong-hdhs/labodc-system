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
  PublicProjectDetailDto,
  PublicProjectSummaryDto,
  UserRole,
} from '@labodc/shared-types';
import { EnterpriseProfileRepository } from '../enterprise/enterprise-profile.repository';
import { EnterpriseVerificationStatus } from '../enterprise/enterprise-profile.types';
import { ProjectProposalRepository } from './project-proposal.repository';
import {
  CreateProjectProposalDto,
  ProjectAuditLogEntity,
  ProjectProposalEntity,
  UpdateProjectProposalDto,
} from './project-proposal.types';

export interface PublicProjectFilterQuery {
  keyword?: string;
  skill?: string;
}

export interface ProjectRecruitmentEligibilityDto {
  projectId: string;
  code: string;
  status: ProjectStatus;
  isOpenForApplications: boolean;
  reason: string;
  registrationOpenAt?: string | null;
  registrationCloseAt?: string | null;
}

export interface ApplicationProjectSummary {
  id: string;
  code: string;
  title: string;
  companyName: string;
  status: ProjectStatus;
}

@Injectable()
export class ProjectsService {
  constructor(
    private readonly proposalRepository: ProjectProposalRepository,
    private readonly enterpriseRepository: EnterpriseProfileRepository,
  ) {}

  createDraftProposal(
    user: JwtPayload,
    dto: CreateProjectProposalDto,
  ): ProjectProposalEntity {
    if (user.role !== UserRole.ENTERPRISE) {
      throw new ForbiddenException(
        'Chỉ tài khoản Doanh nghiệp (ENTERPRISE) mới được phép tạo đề xuất dự án.',
      );
    }

    if (!dto.title || dto.title.trim().length < 5) {
      throw new BadRequestException(
        'Tiêu đề đề xuất dự án (title) bắt buộc và tối thiểu 5 ký tự.',
      );
    }

    const enterpriseProfile = this.enterpriseRepository.findByOwnerUserId(
      user.sub,
    );

    return this.proposalRepository.createDraft({
      ownerUserId: user.sub,
      enterpriseId: enterpriseProfile?.id ?? null,
      companyName: enterpriseProfile?.companyName ?? user.email,
      dto,
    });
  }

  updateProposal(
    user: JwtPayload,
    proposalId: string,
    dto: UpdateProjectProposalDto,
  ): ProjectProposalEntity {
    const proposal = this.proposalRepository.findById(proposalId);
    if (!proposal) {
      throw new NotFoundException(`Không tìm thấy đề xuất dự án ${proposalId}.`);
    }

    if (proposal.ownerUserId !== user.sub) {
      throw new ForbiddenException(
        'Vi phạm quyền sở hữu: Bạn không được phép chỉnh sửa đề xuất dự án của doanh nghiệp khác.',
      );
    }

    if (
      proposal.status !== ProjectStatus.DRAFT &&
      proposal.status !== ProjectStatus.CHANGES_REQUESTED
    ) {
      throw new ConflictException({
        code: 'INVALID_STATE_TRANSITION',
        message: `Không thể chỉnh sửa đề xuất dự án khi đang ở trạng thái ${proposal.status}. Chỉ cho phép sửa ở trạng thái DRAFT hoặc CHANGES_REQUESTED.`,
      });
    }

    if (dto.title !== undefined && dto.title.trim().length < 5) {
      throw new BadRequestException(
        'Tiêu đề đề xuất dự án (title) bắt buộc và tối thiểu 5 ký tự.',
      );
    }

    const enterpriseProfile = this.enterpriseRepository.findByOwnerUserId(
      user.sub,
    );

    const updated = this.proposalRepository.updateDraftContent(
      proposalId,
      dto,
      enterpriseProfile
        ? {
            enterpriseId: enterpriseProfile.id,
            companyName: enterpriseProfile.companyName,
          }
        : undefined,
    );

    return updated!;
  }

  private validateCompleteProposalBeforeSubmit(
    proposal: ProjectProposalEntity,
  ): void {
    if (!proposal.title || proposal.title.trim().length < 5) {
      throw new BadRequestException(
        'Tiêu đề dự án (title) phải có ít nhất 5 ký tự trước khi gửi duyệt.',
      );
    }

    if (!proposal.summary || proposal.summary.trim().length < 10) {
      throw new BadRequestException(
        'Tóm tắt mục tiêu dự án (summary) bắt buộc tối thiểu 10 ký tự.',
      );
    }

    if (!proposal.description || proposal.description.trim().length < 20) {
      throw new BadRequestException(
        'Mô tả chi tiết bài toán (description) bắt buộc tối thiểu 20 ký tự.',
      );
    }

    if (!proposal.deliverables || proposal.deliverables.trim().length < 10) {
      throw new BadRequestException(
        'Phạm vi đầu ra dự kiến (deliverables) bắt buộc tối thiểu 10 ký tự.',
      );
    }

    if (!proposal.requiredSkills || proposal.requiredSkills.length === 0) {
      throw new BadRequestException(
        'Đề xuất dự án phải có ít nhất 1 kỹ năng/công nghệ yêu cầu (requiredSkills).',
      );
    }

    if (
      proposal.minTeamSize < 1 ||
      proposal.maxTeamSize < proposal.minTeamSize
    ) {
      throw new BadRequestException(
        'Số lượng thành viên dự kiến (minTeamSize <= maxTeamSize) không hợp lệ.',
      );
    }

    if (proposal.durationWeeks < 1) {
      throw new BadRequestException(
        'Thời lượng dự án (durationWeeks) phải lớn hơn hoặc bằng 1 tuần.',
      );
    }

    if (!proposal.budgetAmount || proposal.budgetAmount <= 0) {
      throw new BadRequestException(
        'Ngân sách đóng góp dự kiến (budgetAmount) phải lớn hơn 0 VNĐ.',
      );
    }
  }

  submitProposal(
    user: JwtPayload,
    proposalId: string,
  ): ProjectProposalEntity {
    const proposal = this.proposalRepository.findById(proposalId);
    if (!proposal) {
      throw new NotFoundException(`Không tìm thấy đề xuất dự án ${proposalId}.`);
    }

    if (proposal.ownerUserId !== user.sub) {
      throw new ForbiddenException(
        'Vi phạm quyền sở hữu: Bạn không có quyền gửi duyệt đề xuất của doanh nghiệp khác.',
      );
    }

    if (
      proposal.status !== ProjectStatus.DRAFT &&
      proposal.status !== ProjectStatus.CHANGES_REQUESTED
    ) {
      throw new ConflictException({
        code: 'INVALID_STATE_TRANSITION',
        message: `Chỉ có thể gửi duyệt từ trạng thái DRAFT hoặc CHANGES_REQUESTED (trạng thái hiện tại: ${proposal.status}).`,
      });
    }

    const enterpriseProfile = this.enterpriseRepository.findByOwnerUserId(
      user.sub,
    );
    if (
      !enterpriseProfile ||
      enterpriseProfile.verificationStatus !==
        EnterpriseVerificationStatus.VERIFIED
    ) {
      throw new BadRequestException({
        code: 'ENTERPRISE_NOT_VERIFIED',
        message:
          'Hồ sơ pháp nhân doanh nghiệp chưa được Lab Admin xác thực (VERIFIED). Vui lòng hoàn tất xác thực doanh nghiệp trước khi gửi đề xuất.',
      });
    }

    this.validateCompleteProposalBeforeSubmit(proposal);

    const previousStatus = proposal.status;
    const now = new Date().toISOString();
    const submittedEntity: ProjectProposalEntity = {
      ...proposal,
      enterpriseId: enterpriseProfile.id,
      companyName: enterpriseProfile.companyName,
      status: ProjectStatus.SUBMITTED,
      submittedAt: now,
      updatedAt: now,
    };

    const saved = this.proposalRepository.saveEntity(submittedEntity);
    this.proposalRepository.appendAuditLog({
      projectId: saved.id,
      actorUserId: user.sub,
      actorRole: user.role,
      action:
        previousStatus === ProjectStatus.CHANGES_REQUESTED
          ? 'RESUBMIT_PROPOSAL'
          : 'SUBMIT_PROPOSAL',
      fromStatus: previousStatus,
      toStatus: ProjectStatus.SUBMITTED,
      reasonNote: 'Doanh nghiệp gửi đề xuất dự án vào hàng đợi xét duyệt của Lab.',
    });

    return saved;
  }

  listMyProposals(user: JwtPayload): ProjectProposalEntity[] {
    if (user.role !== UserRole.ENTERPRISE) {
      throw new ForbiddenException(
        'Chỉ tài khoản Doanh nghiệp mới dùng được danh sách đề xuất cá nhân.',
      );
    }
    return this.proposalRepository.findByOwnerUserId(user.sub);
  }

  getProposalDetail(
    user: JwtPayload,
    proposalId: string,
  ): {
    proposal: ProjectProposalEntity;
    auditLogs: ProjectAuditLogEntity[];
  } {
    const proposal = this.proposalRepository.findById(proposalId);
    if (!proposal) {
      throw new NotFoundException(`Không tìm thấy đề xuất dự án ${proposalId}.`);
    }

    const isAdmin =
      user.role === UserRole.LAB_ADMIN || user.role === UserRole.SYSTEM_ADMIN;
    if (!isAdmin && proposal.ownerUserId !== user.sub) {
      throw new ForbiddenException(
        'Vi phạm cách ly dữ liệu: Bạn không được xem đề xuất dự án nội bộ của doanh nghiệp khác.',
      );
    }

    return {
      proposal,
      auditLogs: this.proposalRepository.getAuditLogs(proposalId),
    };
  }

  listPublicPublishedProjects(
    filter?: PublicProjectFilterQuery,
  ): PublicProjectSummaryDto[] {
    let published = this.proposalRepository.findAll(ProjectStatus.PUBLISHED);

    if (filter?.keyword && filter.keyword.trim()) {
      const kw = filter.keyword.trim().toLowerCase();
      published = published.filter(
        (item) =>
          item.title.toLowerCase().includes(kw) ||
          item.summary.toLowerCase().includes(kw) ||
          item.companyName.toLowerCase().includes(kw) ||
          item.code.toLowerCase().includes(kw),
      );
    }

    if (filter?.skill && filter.skill.trim()) {
      const targetSkill = filter.skill.trim().toLowerCase();
      published = published.filter((item) =>
        item.requiredSkills.some((s) => s.toLowerCase() === targetSkill),
      );
    }

    return published.map((item) => ({
      id: item.id,
      code: item.code,
      enterpriseId: item.enterpriseId,
      companyName: item.companyName,
      title: item.title,
      summary: item.summary,
      requiredSkills: item.requiredSkills,
      minTeamSize: item.minTeamSize,
      maxTeamSize: item.maxTeamSize,
      durationWeeks: item.durationWeeks,
      budgetAmount: item.budgetAmount,
      status: item.status,
      registrationOpenAt: item.registrationOpenAt,
      registrationCloseAt: item.registrationCloseAt,
      publishedAt: item.publishedAt,
    }));
  }

  getPublicProjectById(projectId: string): PublicProjectDetailDto {
    const proposal = this.proposalRepository.findById(projectId);
    if (!proposal || proposal.status !== ProjectStatus.PUBLISHED) {
      throw new NotFoundException(
        `Dự án ${projectId} không tồn tại hoặc hiện không ở trạng thái công bố (PUBLISHED).`,
      );
    }
    return {
      id: proposal.id,
      code: proposal.code,
      enterpriseId: proposal.enterpriseId,
      companyName: proposal.companyName,
      title: proposal.title,
      summary: proposal.summary,
      description: proposal.description,
      deliverables: proposal.deliverables,
      requiredSkills: proposal.requiredSkills,
      minTeamSize: proposal.minTeamSize,
      maxTeamSize: proposal.maxTeamSize,
      durationWeeks: proposal.durationWeeks,
      budgetAmount: proposal.budgetAmount,
      status: proposal.status,
      registrationOpenAt: proposal.registrationOpenAt,
      registrationCloseAt: proposal.registrationCloseAt,
      publishedAt: proposal.publishedAt,
    };
  }

  getApplicationProjectSummary(projectId: string): ApplicationProjectSummary {
    const project = this.proposalRepository.findById(projectId);
    if (!project) {
      throw new NotFoundException(`Không tìm thấy dự án ${projectId}.`);
    }
    return {
      id: project.id,
      code: project.code,
      title: project.title,
      companyName: project.companyName,
      status: project.status,
    };
  }

  checkRecruitmentEligibility(
    projectId: string,
  ): ProjectRecruitmentEligibilityDto {
    const proposal = this.proposalRepository.findById(projectId);
    if (!proposal) {
      throw new NotFoundException(`Không tìm thấy dự án ${projectId}.`);
    }

    const nowMs = Date.now();
    const openMs = proposal.registrationOpenAt
      ? new Date(proposal.registrationOpenAt).getTime()
      : 0;
    const closeMs = proposal.registrationCloseAt
      ? new Date(proposal.registrationCloseAt).getTime()
      : 0;

    if (proposal.status !== ProjectStatus.PUBLISHED) {
      return {
        projectId: proposal.id,
        code: proposal.code,
        status: proposal.status,
        isOpenForApplications: false,
        reason: `Dự án đang ở trạng thái ${proposal.status}, không mở nhận đơn ứng tuyển.`,
        registrationOpenAt: proposal.registrationOpenAt,
        registrationCloseAt: proposal.registrationCloseAt,
      };
    }

    if (openMs && nowMs < openMs) {
      return {
        projectId: proposal.id,
        code: proposal.code,
        status: proposal.status,
        isOpenForApplications: false,
        reason: 'Chưa đến thời điểm mở nhận đơn ứng tuyển.',
        registrationOpenAt: proposal.registrationOpenAt,
        registrationCloseAt: proposal.registrationCloseAt,
      };
    }

    if (closeMs && nowMs > closeMs) {
      return {
        projectId: proposal.id,
        code: proposal.code,
        status: proposal.status,
        isOpenForApplications: false,
        reason: 'Đã quá thời hạn đóng nhận đơn ứng tuyển (registrationCloseAt).',
        registrationOpenAt: proposal.registrationOpenAt,
        registrationCloseAt: proposal.registrationCloseAt,
      };
    }

    return {
      projectId: proposal.id,
      code: proposal.code,
      status: proposal.status,
      isOpenForApplications: true,
      reason: 'Dự án đang PUBLISHED và trong thời hạn nhận đơn hợp lệ.',
      registrationOpenAt: proposal.registrationOpenAt,
      registrationCloseAt: proposal.registrationCloseAt,
    };
  }
}