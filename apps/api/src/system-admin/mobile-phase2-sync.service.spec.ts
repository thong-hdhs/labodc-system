import { ConflictException, ForbiddenException } from '@nestjs/common';
import { JwtPayload, UserRole, UserStatus } from '@labodc/shared-types';
import { MobilePhase2SyncService } from './mobile-phase2-sync.service';

describe('MobilePhase2SyncService (Day 25 Unit Tests)', () => {
  let service: MobilePhase2SyncService;
  let mockFinanceEscrowService: { getGlobalReconciliationSummary: jest.Mock };
  let mockProductionReadinessService: { listSlaBenchmarks: jest.Mock };

  const sysAdminUser: JwtPayload = {
    sub: 'sys-admin-d25',
    email: 'sysadmin.d25@labodc.edu.vn',
    role: UserRole.SYSTEM_ADMIN,
    status: UserStatus.ACTIVE,
  };

  const labAdminUser: JwtPayload = {
    sub: 'lab-admin-d25',
    email: 'labadmin.d25@labodc.edu.vn',
    role: UserRole.LAB_ADMIN,
    status: UserStatus.ACTIVE,
  };

  beforeEach(() => {
    mockFinanceEscrowService = {
      getGlobalReconciliationSummary: jest.fn().mockReturnValue({
        ledgerTotals: {
          totalEscrowDeposited: 30000000,
          totalDisbursed702010: 30000000,
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

    service = new MobilePhase2SyncService(
      mockFinanceEscrowService as any,
      mockProductionReadinessService as any,
    );
  });

  it('Unit-SYNC-D25-01: Trả về 6 hợp đồng API Mobile Pha 2 tương thích 100% và chặn LAB_ADMIN ký Gate D25', () => {
    const matrix = service.getMobilePhase2ContractMatrix(labAdminUser);
    expect(matrix.totalEndpoints).toBe(6);
    expect(matrix.allCompatible).toBe(true);

    expect(() =>
      service.createSyncCheckpoint(labAdminUser, {
        mobileReleaseVersion: 'v2.5.0-d25',
        syncNote: 'Lab Admin cố ký nghiệm thu Gate D25',
      }),
    ).toThrow(ForbiddenException);
  });

  it('Unit-SYNC-D25-02: Chặn 409 Conflict nếu vi phạm SLA P95 và cho phép SYSTEM_ADMIN ký khi đạt 100%', () => {
    mockProductionReadinessService.listSlaBenchmarks.mockReturnValueOnce({
      complianceRatePercent: 80,
      totalMeasured: 5,
      passedCount: 4,
      items: [],
    });

    expect(() =>
      service.createSyncCheckpoint(sysAdminUser, {
        mobileReleaseVersion: 'v2.5.0-d25',
        syncNote: 'Kiểm thử chặn khi SLA dưới 100%',
      }),
    ).toThrow(ConflictException);

    const checkpoint = service.createSyncCheckpoint(sysAdminUser, {
      mobileReleaseVersion: 'v2.5.0-d25',
      syncNote:
        'Nghiệm thu đồng bộ đa nền tảng Web và Flutter Mobile Pha 2 thành công',
    });

    expect(checkpoint.checkpointCode).toBe('SYNC-D25-001');
    expect(checkpoint.gateStatus).toBe('PASSED');
    expect(checkpoint.verifiedEndpointsCount).toBe(6);
  });
});