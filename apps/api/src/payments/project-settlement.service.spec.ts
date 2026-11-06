import { BadRequestException, ForbiddenException } from '@nestjs/common';
import {
  JwtPayload,
  ProjectStatus,
  UserRole,
  UserStatus,
} from '@labodc/shared-types';
import { ProjectProposalRepository } from '../projects/project-proposal.repository';
import { FinanceEscrowService } from './finance-escrow.service';
import { ProjectSettlementService } from './project-settlement.service';
import { ProjectHealthStatus } from './project-settlement.types';

describe('ProjectSettlementService Unit Tests (D15 - Progress Reports & 70/20/10 Settlement Certificate)', () => {
  let proposalRepo: ProjectProposalRepository;
  let financeEscrowService: FinanceEscrowService;
  let settlementService: ProjectSettlementService;
  let projectId: string;

  const enterpriseA: JwtPayload = {
    sub: '00000000-0000-4000-8000-000000000003',
    email: 'enterprise@company.vn',
    role: UserRole.ENTERPRISE,
    status: UserStatus.ACTIVE,
  };

  const talentUser: JwtPayload = {
    sub: '00000000-0000-4000-8000-000000000006',
    email: 'talent@student.uth.edu.vn',
    role: UserRole.TALENT,
    status: UserStatus.ACTIVE,
  };

  beforeEach(() => {
    proposalRepo = new ProjectProposalRepository();
    financeEscrowService = new FinanceEscrowService(proposalRepo);
    settlementService = new ProjectSettlementService(
      proposalRepo,
      financeEscrowService,
    );

    const draft = proposalRepo.createDraft({
      ownerUserId: enterpriseA.sub,
      enterpriseId: 'ent-d15',
      companyName: 'Công ty Cổ phần Logistics D15',
      dto: {
        title: 'Dự án Kiểm thử Quyết toán D15',
        budgetAmount: 20000000,
      },
    });
    proposalRepo.saveEntity({
      ...draft,
      status: ProjectStatus.IN_PROGRESS,
    });
    projectId = draft.id;
  });

  it('Chặn Doanh nghiệp tự nộp báo cáo tiến độ của nhóm sinh viên (403 Forbidden) và kiểm tra summary >= 15 ký tự', () => {
    expect(() =>
      settlementService.submitProgressReport(enterpriseA, {
        projectId,
        reportingWeek: 1,
        completionPercentage: 50,
        healthStatus: ProjectHealthStatus.ON_TRACK,
        summary: 'Báo cáo hợp lệ trên 15 ký tự.',
      }),
    ).toThrow(ForbiddenException);

    expect(() =>
      settlementService.submitProgressReport(talentUser, {
        projectId,
        reportingWeek: 1,
        completionPercentage: 50,
        healthStatus: ProjectHealthStatus.ON_TRACK,
        summary: 'Quá ngắn',
      }),
    ).toThrow(BadRequestException);
  });

  it('Sinh viên nộp báo cáo tiến độ và xuất Biên bản Quyết toán khớp bất biến Sổ cái 100%', () => {
    const report = settlementService.submitProgressReport(talentUser, {
      projectId,
      reportingWeek: 1,
      completionPercentage: 60,
      healthStatus: ProjectHealthStatus.ON_TRACK,
      summary: 'Đã hoàn thành 60% khối lượng công việc của cột mốc 1.',
    });

    expect(report.completionPercentage).toBe(60);

    const cert = settlementService.getProjectSettlementCertificate(
      enterpriseA,
      projectId,
    );
    expect(cert.projectId).toBe(projectId);
    expect(cert.progressOverview.totalReports).toBe(1);
    expect(cert.progressOverview.latestCompletionPercentage).toBe(60);
    expect(cert.revenueSplitSummary.splitInvariantHold).toBe(true);
  });
});