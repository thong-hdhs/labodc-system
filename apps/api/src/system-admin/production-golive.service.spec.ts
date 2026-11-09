import { ConflictException, ForbiddenException } from '@nestjs/common';
import { JwtPayload, UserRole, UserStatus } from '@labodc/shared-types';
import { FinanceEscrowService } from '../payments/finance-escrow.service';
import { PaymentsSpikeService } from '../payments/payments-spike.service';
import { ProjectProposalRepository } from '../projects/project-proposal.repository';
import { ProductionGoliveService } from './production-golive.service';
import { ProductionReadinessService } from './production-readiness.service';
import { ReleaseHandoverService } from './release-handover.service';

describe('ProductionGoliveService Unit Tests (D21 - Mobile Contract, Smoke Suite & Sprint 3 Gate D21)', () => {
  let readinessService: ProductionReadinessService;
  let goliveService: ProductionGoliveService;

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
    const handoverService = new ReleaseHandoverService(
      financeEscrow,
      readinessService,
    );
    goliveService = new ProductionGoliveService(
      financeEscrow,
      readinessService,
      handoverService,
    );
  });

  it('Kiểm định Hợp đồng Tích hợp Mobile Companion (apps/mobile) khớp 100% cả 4 endpoints', () => {
    const report = goliveService.verifyMobileCompanionContract(labAdmin);
    expect(report.allCompatible).toBe(true);
    expect(report.totalEndpointsChecked).toBe(4);
    expect(report.targetAppPath).toBe('apps/mobile');
  });

  it('Thực thi Post-Deploy Smoke Suite đạt 100% và cho phép SYSTEM_ADMIN ký đóng cổng Gate D21', () => {
    const smokeRun = goliveService.executePostDeploySmokeSuite(labAdmin, {
      releaseTag: 'v1.0.0-golive-d21',
      environmentName: 'PRODUCTION',
    });

    expect(smokeRun.passRatePercent).toBe(100);
    expect(smokeRun.totalChecks).toBe(6);

    expect(() =>
      goliveService.signOffSprint3GateD21(labAdmin, {
        smokeRunId: smokeRun.id,
        signoffNote: 'Lab Admin thử ký đóng cổng Gate D21.',
      }),
    ).toThrow(ForbiddenException);

    const signoff = goliveService.signOffSprint3GateD21(sysAdmin, {
      smokeRunId: smokeRun.id,
      signoffNote:
        'Xác nhận hoàn tất 100% Smoke Test và đóng cổng Sprint 3 Gate D21.',
    });

    expect(signoff.gateCode).toBe('GATE_D21_SPRINT3_AND_PRODUCTION_GOLIVE');
    expect(signoff.gateStatus).toBe('PASSED');
  });

  it('Chặn ký đóng cổng Gate D21 nếu có chỉ số SLA P95 vượt ngưỡng (409 Conflict)', () => {
    const smokeRun = goliveService.executePostDeploySmokeSuite(sysAdmin, {
      releaseTag: 'v1.0.0-golive-d21',
    });

    readinessService.recordSlaBenchmark(sysAdmin, {
      endpointCategory: 'STANDARD_API',
      endpointPath: '/api/v1/projects/public',
      observedP95Ms: 720,
    });

    expect(() =>
      goliveService.signOffSprint3GateD21(sysAdmin, {
        smokeRunId: smokeRun.id,
        signoffNote: 'Thử ký đóng cổng Gate D21 khi SLA vi phạm.',
      }),
    ).toThrow(ConflictException);
  });
});