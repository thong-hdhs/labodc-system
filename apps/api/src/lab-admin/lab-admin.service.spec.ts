import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import {
  JwtPayload,
  ProjectStatus,
  ProposalRejectionReasonCode,
  UserRole,
  UserStatus,
} from '@labodc/shared-types';
import { EnterpriseProfileRepository } from '../enterprise/enterprise-profile.repository';
import { EnterpriseVerificationStatus } from '../enterprise/enterprise-profile.types';
import { ProjectProposalRepository } from '../projects/project-proposal.repository';
import { ProjectsService } from '../projects/projects.service';
import { LabAdminService } from './lab-admin.service';

describe('LabAdminService Unit Tests (D8 - REQ-LAB-01)', () => {
  let labAdminService: LabAdminService;
  let projectsService: ProjectsService;
  let proposalRepository: ProjectProposalRepository;
  let enterpriseRepository: EnterpriseProfileRepository;

  const enterpriseA: JwtPayload = {
    sub: '00000000-0000-4000-8000-000000000003',
    email: 'enterprise@company.vn',
    role: UserRole.ENTERPRISE,
    status: UserStatus.ACTIVE,
  };

  const labAdmin: JwtPayload = {
    sub: '00000000-0000-4000-8000-000000000002',
    email: 'labadmin@labodc.uth.edu.vn',
    role: UserRole.LAB_ADMIN,
    status: UserStatus.ACTIVE,
  };

  const validProposalDto = {
    title: 'Hệ thống Quản lý Kho vận Thông minh UTH',
    summary: 'Tối ưu hóa tồn kho và điều phối đơn hàng thời gian thực.',
    description:
      'Xây dựng hệ thống Backend NestJS, Web Dashboard React và tích hợp thiết bị quét mã vạch.',
    deliverables: 'Source code, tài liệu kiến trúc SAD/DDD, kịch bản kiểm thử.',
    requiredSkills: ['NestJS', 'React', 'PostgreSQL', 'Redis'],
    minTeamSize: 3,
    maxTeamSize: 5,
    durationWeeks: 10,
    budgetAmount: 45000000,
  };

  beforeEach(() => {
    enterpriseRepository = new EnterpriseProfileRepository();
    proposalRepository = new ProjectProposalRepository();
    projectsService = new ProjectsService(
      proposalRepository,
      enterpriseRepository,
    );
    labAdminService = new LabAdminService(proposalRepository);

    const entProfile = enterpriseRepository.create(enterpriseA.sub, {
      companyName: 'Công ty Cổ phần Kho vận UTH',
      taxCode: '0312223334',
      industry: 'Logistics',
      address: 'TP.HCM',
      representativeName: 'Nguyễn Đại Diện',
      contactEmail: 'contact@uthwarehouse.vn',
      contactPhone: '0901234567',
    });

    enterpriseRepository.updateVerification(
      entProfile.id,
      EnterpriseVerificationStatus.VERIFIED,
      labAdmin.sub,
      'Đã xác minh pháp nhân.',
    );
  });

  it('Bắt buộc nhập reasonCode hợp lệ và reasonNote >= 15 ký tự khi Request Info hoặc Reject', () => {
    const draft = projectsService.createDraftProposal(
      enterpriseA,
      validProposalDto,
    );
    projectsService.submitProposal(enterpriseA, draft.id);

    expect(() =>
      labAdminService.requestChanges(labAdmin, draft.id, {
        reasonCode: ProposalRejectionReasonCode.MISSING_SCOPE,
        reasonNote: 'Quá ngắn',
      }),
    ).toThrow(BadRequestException);

    const changesReq = labAdminService.requestChanges(labAdmin, draft.id, {
      reasonCode: ProposalRejectionReasonCode.MISSING_SCOPE,
      reasonNote:
        'Vui lòng bổ sung chi tiết danh mục Deliverables của từng giai đoạn.',
    });

    expect(changesReq.status).toBe(ProjectStatus.CHANGES_REQUESTED);
    expect(changesReq.reasonCode).toBe(
      ProposalRejectionReasonCode.MISSING_SCOPE,
    );
  });

  it('Thực hiện trọn vẹn vòng đời SUBMITTED -> APPROVED -> PUBLISHED -> RECRUITMENT_CLOSED kèm Audit Trail', () => {
    const draft = projectsService.createDraftProposal(
      enterpriseA,
      validProposalDto,
    );
    projectsService.submitProposal(enterpriseA, draft.id);

    // Chặn công bố khi chưa APPROVED
    const futureClose = new Date(Date.now() + 7 * 86400000).toISOString();
    expect(() =>
      labAdminService.publishProject(labAdmin, draft.id, {
        registrationCloseAt: futureClose,
      }),
    ).toThrow(ConflictException);

    const approved = labAdminService.approveProposal(labAdmin, draft.id, {
      reviewNote: 'Đề xuất phù hợp năng lực sinh viên UTH.',
    });
    expect(approved.status).toBe(ProjectStatus.APPROVED);

    const published = labAdminService.publishProject(labAdmin, draft.id, {
      registrationCloseAt: futureClose,
      note: 'Mở nhận đơn ứng tuyển đợt 1.',
    });
    expect(published.status).toBe(ProjectStatus.PUBLISHED);
    expect(projectsService.listPublicPublishedProjects().length).toBe(1);

    const closed = labAdminService.closeRecruitment(labAdmin, draft.id, {
      note: 'Đã nhận đủ hồ sơ ứng tuyển.',
    });
    expect(closed.status).toBe(ProjectStatus.RECRUITMENT_CLOSED);
    expect(projectsService.listPublicPublishedProjects().length).toBe(0);

    const detail = labAdminService.getProposalReviewDetail(labAdmin, draft.id);
    expect(detail.auditLogs.length).toBe(5);
  });

  it('Chặn người dùng không phải LAB_ADMIN / SYSTEM_ADMIN duyệt đề xuất (403 Forbidden)', () => {
    const draft = projectsService.createDraftProposal(
      enterpriseA,
      validProposalDto,
    );
    projectsService.submitProposal(enterpriseA, draft.id);

    expect(() =>
      labAdminService.approveProposal(enterpriseA, draft.id),
    ).toThrow(ForbiddenException);
  });
});