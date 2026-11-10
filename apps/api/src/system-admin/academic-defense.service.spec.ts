import { ConflictException, ForbiddenException } from '@nestjs/common';
import { JwtPayload, UserRole, UserStatus } from '@labodc/shared-types';
import { FinanceEscrowService } from '../payments/finance-escrow.service';
import { PaymentsSpikeService } from '../payments/payments-spike.service';
import { ProjectProposalRepository } from '../projects/project-proposal.repository';
import { AcademicDefenseService } from './academic-defense.service';
import { ProductionGoliveService } from './production-golive.service';
import { ProductionReadinessService } from './production-readiness.service';
import { ReleaseHandoverService } from './release-handover.service';

describe('AcademicDefenseService Unit Tests (D24 - Permanent Ledger Seal & Academic Council Defense Gate D24)', () => {
  let readinessService: ProductionReadinessService;
  let defenseService: AcademicDefenseService;

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
    defenseService = new AcademicDefenseService(
      financeEscrow,
      readinessService,
      handoverService,
      goliveService,
    );
  });

  it('Niêm phong vĩnh viễn Sổ cái 70/20/10 và cho phép SYSTEM_ADMIN ký Quyết định Nghiệm thu Hội đồng Gate D24', () => {
    const seal = defenseService.sealFinancialLedgerPermanently(labAdmin, {
      releaseTag: 'v1.0.0-final-defense-d24',
      sealNote: 'Niêm phong sổ cái 70/20/10 phục vụ bảo vệ đồ án D24.',
    });

    expect(seal.sealCode).toBe('SEAL-D24-001');
    expect(seal.invariantVerified).toBe(true);
    expect(seal.escrowHeldBalanceVnd).toBe(0);

    expect(() =>
      defenseService.recordAcademicDefenseVerdict(labAdmin, {
        ledgerSealId: seal.id,
        studentAScore: 96,
        studentBScore: 96,
        councilEvaluationNote: 'Lab Admin thử ký quyết định hội đồng Gate D24.',
      }),
    ).toThrow(ForbiddenException);

    const verdict = defenseService.recordAcademicDefenseVerdict(sysAdmin, {
      ledgerSealId: seal.id,
      studentAScore: 98,
      studentBScore: 96,
      councilEvaluationNote:
        'Hội đồng nghiệm thu thông qua xuất sắc toàn bộ đồ án LabOdc của Sinh viên A và Sinh viên B.',
    });

    expect(verdict.verdictCode).toBe('COUNCIL-D24-VERDICT-001');
    expect(verdict.gateCode).toBe(
      'GATE_D24_ACADEMIC_COUNCIL_DEFENSE_AND_LEDGER_SEAL',
    );
    expect(verdict.verdictStatus).toBe('APPROVED_WITH_DISTINCTION');
    expect(verdict.averageScore).toBe(97);
  });

  it('Chặn ký Quyết định Nghiệm thu Hội đồng Gate D24 nếu có mẫu đo SLA vi phạm ngưỡng (409 Conflict)', () => {
    const seal = defenseService.sealFinancialLedgerPermanently(sysAdmin, {
      releaseTag: 'v1.0.0-final-defense-d24',
      sealNote: 'Niêm phong sổ cái trước khi kiểm tra SLA.',
    });

    readinessService.recordSlaBenchmark(sysAdmin, {
      endpointCategory: 'STANDARD_API',
      endpointPath: '/api/v1/projects/public',
      observedP95Ms: 880,
    });

    expect(() =>
      defenseService.recordAcademicDefenseVerdict(sysAdmin, {
        ledgerSealId: seal.id,
        studentAScore: 95,
        studentBScore: 95,
        councilEvaluationNote: 'Thử ký quyết định hội đồng khi SLA vi phạm.',
      }),
    ).toThrow(ConflictException);
  });
});