import { ConflictException, ForbiddenException } from '@nestjs/common';
import { JwtPayload, UserRole, UserStatus } from '@labodc/shared-types';
import { CodeFreezeD27Service } from './code-freeze-d27.service';

describe('CodeFreezeD27Service (Day 27 Unit Tests)', () => {
  let service: CodeFreezeD27Service;
  let mockFinanceEscrowService: { getGlobalReconciliationSummary: jest.Mock };
  let mockProductionReadinessService: { listSlaBenchmarks: jest.Mock };

  const sysAdminUser: JwtPayload = {
    sub: 'sys-admin-d27',
    email: 'sysadmin.d27@labodc.edu.vn',
    role: UserRole.SYSTEM_ADMIN,
    status: UserStatus.ACTIVE,
  };

  const labAdminUser: JwtPayload = {
    sub: 'lab-admin-d27',
    email: 'labadmin.d27@labodc.edu.vn',
    role: UserRole.LAB_ADMIN,
    status: UserStatus.ACTIVE,
  };

  beforeEach(() => {
    mockFinanceEscrowService = {
      getGlobalReconciliationSummary: jest.fn().mockReturnValue({
        ledgerTotals: {
          totalEscrowDeposited: 50000000,
          totalDisbursed702010: 50000000,
          totalRefundedToEnterprise: 0,
          totalEscrowHeldBalance: 0,
        },
        invariantHold: true,
      }),
    };

    mockProductionReadinessService = {
      listSlaBenchmarks: jest.fn().mockReturnValue({
        complianceRatePercent: 100,
        totalMeasured: 3,
        passedCount: 3,
        items: [],
      }),
    };

    service = new CodeFreezeD27Service(
      mockFinanceEscrowService as any,
      mockProductionReadinessService as any,
    );
  });

  it('Unit-FREEZE-D27-01: Chặn đóng băng mã nguồn khi còn số dư ký quỹ treo hoặc LAB_ADMIN gọi khóa manifest', () => {
    expect(() =>
      service.lockCodeFreezeManifest(labAdminUser, {
        releaseCandidateTag: 'v3.0.0-rc-d27',
        nextPhasePlan: 'Lab Admin cố khóa đóng băng mã nguồn D27',
      }),
    ).toThrow(ForbiddenException);

    mockFinanceEscrowService.getGlobalReconciliationSummary.mockReturnValueOnce(
      {
        ledgerTotals: {
          totalEscrowDeposited: 50000000,
          totalDisbursed702010: 40000000,
          totalRefundedToEnterprise: 0,
          totalEscrowHeldBalance: 10000000,
        },
        invariantHold: true,
      },
    );

    expect(() =>
      service.lockCodeFreezeManifest(sysAdminUser, {
        releaseCandidateTag: 'v3.0.0-rc-d27',
        nextPhasePlan: 'Kiểm thử chặn khi còn tiền ký quỹ chưa tất toán',
      }),
    ).toThrow(ConflictException);

    const manifest = service.lockCodeFreezeManifest(sysAdminUser, {
      releaseCandidateTag: 'v3.0.0-rc-d27',
      nextPhasePlan:
        'Đóng băng 100% mã nguồn ở ngày D27 để tập trung kiểm thử tích hợp và triển khai thực tế.',
    });

    expect(manifest.freezeCode).toBe('FREEZE-D27-FINAL-001');
    expect(manifest.gateStatus).toBe('CODE_FROZEN_READY_FOR_TEST_AND_DEPLOY');
    expect(manifest.studentAMigrationsCount).toBe(22);
    expect(manifest.studentBMigrationsCount).toBe(9);
  });
});