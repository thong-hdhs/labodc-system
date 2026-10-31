import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import {
  JwtPayload,
  ProjectStatus,
  UserRole,
  UserStatus,
} from '@labodc/shared-types';
import { EnterpriseProfileRepository } from '../enterprise/enterprise-profile.repository';
import { EnterpriseVerificationStatus } from '../enterprise/enterprise-profile.types';
import { ProjectProposalRepository } from './project-proposal.repository';
import { ProjectsService } from './projects.service';

describe('ProjectsService Unit Tests (D7 - REQ-ENT-02)', () => {
  let service: ProjectsService;
  let proposalRepository: ProjectProposalRepository;
  let enterpriseRepository: EnterpriseProfileRepository;

  const enterpriseA: JwtPayload = {
    sub: '00000000-0000-4000-8000-000000000003',
    email: 'enterprise@company.vn',
    role: UserRole.ENTERPRISE,
    status: UserStatus.ACTIVE,
  };

  const enterpriseB: JwtPayload = {
    sub: '00000000-0000-4000-8000-000000000008',
    email: 'enterprise2@company.vn',
    role: UserRole.ENTERPRISE,
    status: UserStatus.ACTIVE,
  };

  const fullProposalDto = {
    title: 'Hệ thống Quản lý Đội xe Thông minh UTH Logistics',
    summary: 'Xây dựng nền tảng theo dõi lộ trình và tối ưu nhiên liệu đội xe.',
    description:
      'Dự án phát triển Web Dashboard và Mobile App cho tài xế kết nối dữ liệu GPS thời gian thực.',
    deliverables: 'Source code Backend NestJS, React Dashboard, Báo cáo kiểm thử.',
    requiredSkills: ['NestJS', 'React', 'PostgreSQL', 'Docker'],
    minTeamSize: 3,
    maxTeamSize: 5,
    durationWeeks: 10,
    budgetAmount: 50000000,
  };

  beforeEach(() => {
    enterpriseRepository = new EnterpriseProfileRepository();
    proposalRepository = new ProjectProposalRepository();
    service = new ProjectsService(proposalRepository, enterpriseRepository);
  });

  it('Cho phép doanh nghiệp chưa VERIFIED lưu bản nháp (DRAFT) nhưng chặn khi bấm gửi duyệt (SUBMIT)', () => {
    enterpriseRepository.create(enterpriseA.sub, {
      companyName: 'Công ty Cổ phần Logistics A',
      taxCode: '0311112222',
      industry: 'Logistics',
      address: 'TP.HCM',
      representativeName: 'Đại diện A',
      contactEmail: 'contact@logA.vn',
      contactPhone: '0901112222',
    });

    const draft = service.createDraftProposal(enterpriseA, fullProposalDto);
    expect(draft.status).toBe(ProjectStatus.DRAFT);

    expect(() => service.submitProposal(enterpriseA, draft.id)).toThrow(
      BadRequestException,
    );
  });

  it('Cho phép gửi duyệt (SUBMITTED) khi doanh nghiệp đã VERIFIED và khóa chỉnh sửa sau khi gửi (409 Conflict)', () => {
    const profile = enterpriseRepository.create(enterpriseA.sub, {
      companyName: 'Công ty Cổ phần Logistics A',
      taxCode: '0311112222',
      industry: 'Logistics',
      address: 'TP.HCM',
      representativeName: 'Đại diện A',
      contactEmail: 'contact@logA.vn',
      contactPhone: '0901112222',
    });

    enterpriseRepository.updateVerification(
      profile.id,
      EnterpriseVerificationStatus.VERIFIED,
      'lab-admin-id',
      'Đã xác minh MST',
    );

    const draft = service.createDraftProposal(enterpriseA, fullProposalDto);
    const submitted = service.submitProposal(enterpriseA, draft.id);

    expect(submitted.status).toBe(ProjectStatus.SUBMITTED);
    expect(submitted.submittedAt).toBeDefined();

    expect(() =>
      service.updateProposal(enterpriseA, draft.id, {
        title: 'Cố tình sửa sau khi đã gửi duyệt',
      }),
    ).toThrow(ConflictException);
  });

  it('Chặn Doanh nghiệp B xem hoặc sửa bản nháp của Doanh nghiệp A (403 Forbidden)', () => {
    const draftA = service.createDraftProposal(enterpriseA, fullProposalDto);

    expect(() =>
      service.updateProposal(enterpriseB, draftA.id, {
        title: 'Doanh nghiệp B sửa trộm',
      }),
    ).toThrow(ForbiddenException);

    expect(() => service.getProposalDetail(enterpriseB, draftA.id)).toThrow(
      ForbiddenException,
    );
  });
});