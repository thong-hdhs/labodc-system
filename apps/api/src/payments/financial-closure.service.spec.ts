import { ConflictException } from '@nestjs/common';
import {
  JwtPayload,
  ProjectStatus,
  UserRole,
  UserStatus,
} from '@labodc/shared-types';
import { ProjectProposalRepository } from '../projects/project-proposal.repository';
import { FinanceEscrowService } from './finance-escrow.service';
import { FinancialClosureService } from './financial-closure.service';
import { FinancialDisputeStatus } from './financial-closure.types';
import { ProjectSettlementService } from './project-settlement.service';

describe('FinancialClosureService Unit Tests (D18 - Dispute Resolution, Closure Dossier & Lab 10% Transparency)', () => {
  let proposalRepo: ProjectProposalRepository;
  let financeEscrowService: FinanceEscrowService;
  let settlementService: ProjectSettlementService;
  let closureService: FinancialClosureService;
  let projectId: string;
  let milestoneId: string;

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
    closureService = new FinancialClosureService(
      proposalRepo,
      financeEscrowService,
      settlementService,
    );

    const draft = proposalRepo.createDraft({
      ownerUserId: enterpriseA.sub,
      enterpriseId: 'ent-d18',
      companyName: 'Công ty Cổ phần Công nghệ D18',
      dto: {
        title: 'Dự án Kiểm thử Phân xử Khiếu nại & Đóng dự án D18',
        budgetAmount: 10000003,
      },
    });
    proposalRepo.saveEntity({
      ...draft,
      status: ProjectStatus.APPROVED,
    });
    projectId = draft.id;

    const ms = financeEscrowService.createMilestone(enterpriseA, {
      projectId,
      title: 'Cột mốc Duy nhất D18',
      description: 'Mô tả tiêu chí nghiệm thu cột mốc D18.',
      amount: 10000003,
    });
    milestoneId = ms.id;
    financeEscrowService.confirmMilestoneEscrow(enterpriseA, milestoneId);
    financeEscrowService.submitDeliverable(talentUser, milestoneId, {
      deliverableUrl: 'https://github.com/thong-hdhs/labodc-system/releases/tag/v1.8',
      deliverableNote: 'Bàn giao sản phẩm cột mốc D18.',
    });
  });

  it('Chặn đóng hồ sơ dự án khi đang có phiếu khiếu nại OPEN và cho phép đóng sau khi Lab Admin phân xử giải ngân 70/20/10', () => {
    const dispute = closureService.raiseFinancialDispute(enterpriseA, {
      projectId,
      milestoneId,
      reason: 'Cần Lab Admin xác minh thêm tài liệu kiểm thử trước khi giải ngân.',
    });

    expect(dispute.status).toBe(FinancialDisputeStatus.OPEN);

    // Chặn ký đóng dự án khi phiếu khiếu nại đang OPEN
    expect(() =>
      closureService.createProjectClosureDossier(enterpriseA, projectId, {
        satisfactionScore: 5,
        wouldSponsorAgain: true,
        feedbackSummary: 'Thử đóng dự án khi còn tranh chấp OPEN.',
      }),
    ).toThrow(ConflictException);

    // Lab Admin phân xử RESOLVED_RELEASE_TO_TEAM kèm hoàn tất dự án COMPLETED
    const resolved = closureService.resolveFinancialDispute(
      labAdmin,
      dispute.id,
      {
        decision: FinancialDisputeStatus.RESOLVED_RELEASE_TO_TEAM,
        resolutionNote: 'Nhóm đã bổ sung đầy đủ minh chứng, đồng ý giải ngân 70/20/10.',
        markProjectCompleted: true,
      },
    );

    expect(resolved.dispute.status).toBe(
      FinancialDisputeStatus.RESOLVED_RELEASE_TO_TEAM,
    );

    // Ký Hồ sơ Nghiệm thu Đóng Dự án thành công
    const dossier = closureService.createProjectClosureDossier(
      enterpriseA,
      projectId,
      {
        satisfactionScore: 5,
        wouldSponsorAgain: true,
        feedbackSummary: 'Dự án hoàn thành xuất sắc, doanh nghiệp rất hài lòng.',
      },
    );

    expect(dossier.satisfactionScore).toBe(5);
    expect(dossier.totalDisbursed702010Vnd).toBe(10000003);
  });
});