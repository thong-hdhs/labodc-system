import { ConflictException, ForbiddenException } from '@nestjs/common';
import { JwtPayload, UserRole, UserStatus } from '@labodc/shared-types';
import { FinanceEscrowService } from '../payments/finance-escrow.service';
import { PaymentsSpikeService } from '../payments/payments-spike.service';
import { ProjectProposalRepository } from '../projects/project-proposal.repository';
import { FinalArchivalService } from './final-archival.service';
import { ProductionGoliveService } from './production-golive.service';
import { ProductionReadinessService } from './production-readiness.service';
import { ReleaseHandoverService } from './release-handover.service';

describe('FinalArchivalService Unit Tests (D22 - Final 22-Day Project Completion & Archival Gate D22)', () => {
  let readinessService: ProductionReadinessService;
  let archivalService: FinalArchivalService;

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
    archivalService = new FinalArchivalService(
      financeEscrow,
      readinessService,
      handoverService,
      goliveService,
    );
  });

  it('Tổng hợp báo cáo 22 ngày (D1 -> D22) đủ 4 giai đoạn và cho phép SYSTEM_ADMIN cấp Chứng nhận Hoàn thành Dự án D22', () => {
    const summary = archivalService.getProject22DayMasterSummary(labAdmin);
    expect(summary.totalDaysCompleted).toBe(22);
    expect(summary.allGatesPassed).toBe(true);
    expect(summary.phases).toHaveLength(4);

    expect(() =>
      archivalService.issueFinalCompletionCertificate(labAdmin, {
        releaseVersion: 'v1.0.0-final-d22',
        archivalNote: 'Lab Admin thử cấp chứng nhận hoàn thành dự án D22.',
      }),
    ).toThrow(ForbiddenException);

    const cert = archivalService.issueFinalCompletionCertificate(sysAdmin, {
      releaseVersion: 'v1.0.0-final-d22',
      archivalNote:
        'Chính thức nghiệm thu hoàn thành toàn bộ 22 ngày dự án LabOdc và lưu trữ hồ sơ vận hành.',
    });

    expect(cert.certificateCode).toBe('CERT-D22-FINAL-001');
    expect(cert.gateCode).toBe(
      'GATE_D22_FINAL_PROJECT_COMPLETION_AND_ARCHIVAL',
    );
    expect(cert.gateStatus).toBe('COMPLETED_AND_ARCHIVED');
    expect(cert.totalDaysCompleted).toBe(22);
  });

  it('Chặn cấp Chứng nhận Hoàn thành Dự án D22 nếu có vi phạm SLA P95 (409 Conflict)', () => {
    readinessService.recordSlaBenchmark(sysAdmin, {
      endpointCategory: 'STANDARD_API',
      endpointPath: '/api/v1/projects/public',
      observedP95Ms: 850,
    });

    expect(() =>
      archivalService.issueFinalCompletionCertificate(sysAdmin, {
        releaseVersion: 'v1.0.0-final-d22',
        archivalNote: 'Thử cấp chứng nhận D22 khi SLA vi phạm ngưỡng.',
      }),
    ).toThrow(ConflictException);
  });
});