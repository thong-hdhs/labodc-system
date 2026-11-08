import { ConflictException } from '@nestjs/common';
import { JwtPayload, UserRole, UserStatus } from '@labodc/shared-types';
import { FinanceEscrowService } from '../payments/finance-escrow.service';
import { PaymentsSpikeService } from '../payments/payments-spike.service';
import { ProjectProposalRepository } from '../projects/project-proposal.repository';
import { ProductionReadinessService } from './production-readiness.service';

describe('ProductionReadinessService Unit Tests (D19 - NFR SLA, Security Matrix & Production Sign-off)', () => {
  let service: ProductionReadinessService;

  const sysAdmin: JwtPayload = {
    sub: '00000000-0000-4000-8000-000000000001',
    email: 'sysadmin@labodc.uth.edu.vn',
    role: UserRole.SYSTEM_ADMIN,
    status: UserStatus.ACTIVE,
  };

  beforeEach(() => {
    const projRepo = new ProjectProposalRepository();
    const payosSpike = new PaymentsSpikeService(projRepo);
    const financeEscrow = new FinanceEscrowService(projRepo);
    service = new ProductionReadinessService(payosSpike, financeEscrow);
  });

  it('Đánh giá chính xác ngưỡng SLA P95 <= 500ms cho STANDARD_API và <= 1000ms cho FINANCIAL_LEDGER_API', () => {
    const stdPass = service.recordSlaBenchmark(sysAdmin, {
      endpointCategory: 'STANDARD_API',
      endpointPath: '/api/v1/projects/public',
      observedP95Ms: 120,
    });
    expect(stdPass.withinSla).toBe(true);
    expect(stdPass.thresholdP95Ms).toBe(500);

    const finPass = service.recordSlaBenchmark(sysAdmin, {
      endpointCategory: 'FINANCIAL_LEDGER_API',
      endpointPath: '/api/v1/payments/reconciliation/summary',
      observedP95Ms: 750,
    });
    expect(finPass.withinSla).toBe(true);
    expect(finPass.thresholdP95Ms).toBe(1000);

    const signoff = service.signOffProductionReadiness(sysAdmin, {
      releaseVersion: 'v1.0.0-rc1',
      note: 'Tất cả chỉ số SLA P95 và bảo mật đều đạt chuẩn Production.',
    });
    expect(signoff.allNfrGatesPassed).toBe(true);
    expect(signoff.slaComplianceRatePercent).toBe(100);
  });

  it('Chặn ký Chứng nhận Production Readiness nếu có chỉ số API vượt ngưỡng SLA (409 Conflict)', () => {
    service.recordSlaBenchmark(sysAdmin, {
      endpointCategory: 'STANDARD_API',
      endpointPath: '/api/v1/projects/public',
      observedP95Ms: 650, // Vượt ngưỡng 500ms
    });

    expect(() =>
      service.signOffProductionReadiness(sysAdmin, {
        releaseVersion: 'v1.0.0-rc1',
        note: 'Thử nghiệm ký khi có API vượt ngưỡng SLA.',
      }),
    ).toThrow(ConflictException);
  });
});