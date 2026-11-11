import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { JwtPayload, UserRole, UserStatus } from '@labodc/shared-types';
import { MobileEvaluationBridgeService } from './mobile-evaluation-bridge.service';

describe('MobileEvaluationBridgeService (Day 26 Unit Tests)', () => {
  let service: MobileEvaluationBridgeService;
  let mockFinanceEscrowService: { getGlobalReconciliationSummary: jest.Mock };
  let mockProductionReadinessService: { listSlaBenchmarks: jest.Mock };

  const sysAdminUser: JwtPayload = {
    sub: 'sys-admin-d26',
    email: 'sysadmin.d26@labodc.edu.vn',
    role: UserRole.SYSTEM_ADMIN,
    status: UserStatus.ACTIVE,
  };

  const labAdminUser: JwtPayload = {
    sub: 'lab-admin-d26',
    email: 'labadmin.d26@labodc.edu.vn',
    role: UserRole.LAB_ADMIN,
    status: UserStatus.ACTIVE,
  };

  beforeEach(() => {
    mockFinanceEscrowService = {
      getGlobalReconciliationSummary: jest.fn().mockReturnValue({
        ledgerTotals: {
          totalEscrowDeposited: 20000003,
          totalDisbursed702010: 20000003,
          totalRefundedToEnterprise: 0,
          totalEscrowHeldBalance: 0,
        },
        invariantHold: true,
      }),
    };

    mockProductionReadinessService = {
      listSlaBenchmarks: jest.fn().mockReturnValue({
        complianceRatePercent: 100,
        totalMeasured: 2,
        passedCount: 2,
        items: [],
      }),
    };

    service = new MobileEvaluationBridgeService(
      mockFinanceEscrowService as any,
      mockProductionReadinessService as any,
    );
  });

  it('Unit-EVAL-D26-01: Chặn tổng tỷ lệ đóng góp khác 100% và đối soát chính xác phần dư quỹ 70% cho thành viên cuối', () => {
    expect(() =>
      service.reconcileEvaluationToPayout(labAdminUser, {
        projectCode: 'PRJ-D26-01',
        milestoneAmountVnd: 10000003,
        members: [
          {
            memberEmail: 'a@labodc.edu.vn',
            evaluationGrade: 'EXCELLENT',
            contributionPercent: 50,
          },
          {
            memberEmail: 'b@labodc.edu.vn',
            evaluationGrade: 'GOOD',
            contributionPercent: 40,
          },
        ],
      }),
    ).toThrow(BadRequestException);

    const recon = service.reconcileEvaluationToPayout(labAdminUser, {
      projectCode: 'PRJ-D26-01',
      milestoneAmountVnd: 10000003,
      members: [
        {
          memberEmail: 'a@labodc.edu.vn',
          evaluationGrade: 'EXCELLENT',
          contributionPercent: 33,
        },
        {
          memberEmail: 'b@labodc.edu.vn',
          evaluationGrade: 'GOOD',
          contributionPercent: 33,
        },
        {
          memberEmail: 'c@labodc.edu.vn',
          evaluationGrade: 'SATISFACTORY',
          contributionPercent: 34,
        },
      ],
    });

    expect(recon.teamPool70Vnd).toBe(7000002);
    expect(recon.allocatedMembersSumVnd).toBe(7000002);
    expect(recon.labPool10Vnd).toBe(1000001);

    expect(() =>
      service.signOffGateD26(labAdminUser, {
        reconciliationId: recon.id,
        signoffNote: 'Lab Admin cố ký đóng cổng Gate D26',
      }),
    ).toThrow(ForbiddenException);

    const signoff = service.signOffGateD26(sysAdminUser, {
      reconciliationId: recon.id,
      signoffNote:
        'Nghiệm thu liên thông Đánh giá Hiệu suất Mobile với Sổ cái 70% thành công',
    });

    expect(signoff.signoffCode).toBe('GATE-D26-001');
    expect(signoff.gateStatus).toBe('PASSED_FULL_PARITY');
  });
});