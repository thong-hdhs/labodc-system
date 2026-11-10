import { ConflictException, ForbiddenException } from '@nestjs/common';
import { JwtPayload, UserRole, UserStatus } from '@labodc/shared-types';
import { FinanceEscrowService } from '../payments/finance-escrow.service';
import { PaymentsSpikeService } from '../payments/payments-spike.service';
import { ProjectProposalRepository } from '../projects/project-proposal.repository';
import { PostGoliveHypercareService } from './post-golive-hypercare.service';
import { ProductionGoliveService } from './production-golive.service';
import { ProductionReadinessService } from './production-readiness.service';
import { ReleaseHandoverService } from './release-handover.service';

describe('PostGoliveHypercareService Unit Tests (D23 - Hypercare Monitoring, DR Drill & Defense Gate D23)', () => {
  let readinessService: ProductionReadinessService;
  let hypercareService: PostGoliveHypercareService;

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
    const goliveService = new ProductionGoliveService(
      financeEscrow,
      readinessService,
      handoverService,
    );
    hypercareService = new PostGoliveHypercareService(
      financeEscrow,
      readinessService,
      handoverService,
      goliveService,
    );
  });

  it('Thực thi diễn tập DR Drill đạt chuẩn RTO <= 300s, RPO = 0 và cho phép SYSTEM_ADMIN ký đóng cổng Gate D23', () => {
    const drill = hypercareService.executeDrBackupRestoreDrill(labAdmin, {
      scenarioName: 'Khôi phục Snapshot PostgreSQL & Đối soát Sổ cái 70/20/10',
      measuredRtoSeconds: 45,
      drillNote: 'Hoàn tất khôi phục dữ liệu không mất giao dịch nào.',
    });

    expect(drill.withinDrSla).toBe(true);
    expect(drill.measuredRpoTransactionsLost).toBe(0);
    expect(drill.ledgerSnapshotVerified).toBe(true);

    expect(() =>
      hypercareService.signOffProjectDefenseGateD23(labAdmin, {
        drDrillId: drill.id,
        releaseVersion: 'v1.0.0-hypercare-d23',
        defenseNote: 'Lab Admin thử ký nghiệm thu bảo vệ đồ án Gate D23.',
      }),
    ).toThrow(ForbiddenException);

    const signoff = hypercareService.signOffProjectDefenseGateD23(sysAdmin, {
      drDrillId: drill.id,
      releaseVersion: 'v1.0.0-hypercare-d23',
      defenseNote:
        'Chính thức nghiệm thu vận hành Hypercare, DR Drill và sẵn sàng bảo vệ đồ án D23.',
    });

    expect(signoff.gateCode).toBe(
      'GATE_D23_POST_GOLIVE_HYPERCARE_AND_DEFENSE',
    );
    expect(signoff.gateStatus).toBe('PASSED_AND_DEFENSE_READY');
  });

  it('Chặn ký đóng cổng Gate D23 nếu diễn tập DR Drill vượt ngưỡng RTO > 300s (409 Conflict)', () => {
    const slowDrill = hypercareService.executeDrBackupRestoreDrill(sysAdmin, {
      scenarioName: 'Diễn tập khôi phục chậm vượt ngưỡng RTO 300s',
      measuredRtoSeconds: 420,
      drillNote: 'Thử nghiệm kịch bản RTO vượt quá 300 giây.',
    });

    expect(slowDrill.withinDrSla).toBe(false);

    expect(() =>
      hypercareService.signOffProjectDefenseGateD23(sysAdmin, {
        drDrillId: slowDrill.id,
        releaseVersion: 'v1.0.0-hypercare-d23',
        defenseNote: 'Thử ký đóng cổng Gate D23 khi DR Drill vượt ngưỡng RTO.',
      }),
    ).toThrow(ConflictException);
  });
});