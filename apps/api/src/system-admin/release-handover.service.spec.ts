import { ConflictException, ForbiddenException } from '@nestjs/common';
import { JwtPayload, UserRole, UserStatus } from '@labodc/shared-types';
import { FinanceEscrowService } from '../payments/finance-escrow.service';
import { PaymentsSpikeService } from '../payments/payments-spike.service';
import { ProjectProposalRepository } from '../projects/project-proposal.repository';
import { ProductionReadinessService } from './production-readiness.service';
import { ReleaseHandoverService } from './release-handover.service';

describe('ReleaseHandoverService Unit Tests (D20 - RTM Matrix & Final Handover Gate D20)', () => {
  let readinessService: ProductionReadinessService;
  let handoverService: ReleaseHandoverService;

  const sysAdmin: JwtPayload = {
    sub: '00000000-0000-4000-8000-000000000001',
    email: 'sysadmin@labodc.uth.edu.vn',
    role: UserRole.SYSTEM_ADMIN,
    status: UserStatus.ACTIVE,
  };

  const labAdmin: JwtPayload = {
    sub: '00000000-0000-4000-8000-000000000002',
    email: 'labadmin@labodc.uth.edu.vn',
    role: UserRole.LAB_ADMIN,
    status: UserStatus.ACTIVE,
  };

  beforeEach(() => {
    const projRepo = new ProjectProposalRepository();
    const payosSpike = new PaymentsSpikeService(projRepo);
    const financeEscrow = new FinanceEscrowService(projRepo);
    readinessService = new ProductionReadinessService(
      payosSpike,
      financeEscrow,
    );
    handoverService = new ReleaseHandoverService(
      financeEscrow,
      readinessService,
    );
  });

  it('Xuất Ma trận Truy vết Yêu cầu (RTM) đạt độ phủ 100% và đủ 5 ADRs', () => {
    const rtm = handoverService.getRequirementsTraceabilityMatrix(labAdmin);
    expect(rtm.coveragePercent).toBe(100);
    expect(rtm.architectureDecisions).toHaveLength(5);
    expect(rtm.totalRequirements).toBeGreaterThanOrEqual(13);
  });

  it('Chặn LAB_ADMIN đóng gói bàn giao (403) và chặn đóng gói khi có vi phạm SLA P95 (409 Conflict)', () => {
    expect(() =>
      handoverService.createReleaseHandoverPackage(labAdmin, {
        releaseTag: 'v1.0.0-rc',
        handoverNote: 'Lab Admin thử đóng gói bàn giao phát hành.',
      }),
    ).toThrow(ForbiddenException);

    // Ghi nhận 1 mẫu SLA vượt ngưỡng 500ms -> Chặn đóng gói bàn giao
    readinessService.recordSlaBenchmark(sysAdmin, {
      endpointCategory: 'STANDARD_API',
      endpointPath: '/api/v1/projects/public',
      observedP95Ms: 800,
    });

    expect(() =>
      handoverService.createReleaseHandoverPackage(sysAdmin, {
        releaseTag: 'v1.0.0-rc',
        handoverNote: 'Thử đóng gói bàn giao khi SLA < 100%.',
      }),
    ).toThrow(ConflictException);
  });
});