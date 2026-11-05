import { ConflictException, ForbiddenException } from '@nestjs/common';
import { JwtPayload, UserRole, UserStatus } from '@labodc/shared-types';
import { EnterpriseProfileRepository } from '../enterprise/enterprise-profile.repository';
import { FinanceEscrowService } from '../payments/finance-escrow.service';
import { PaymentsSpikeService } from '../payments/payments-spike.service';
import { ProjectProposalRepository } from '../projects/project-proposal.repository';
import { SystemGovernanceService } from './system-governance.service';

describe('SystemGovernanceService Unit Tests (D14 - System Governance & Immutable 70/20/10 Guard)', () => {
  let service: SystemGovernanceService;

  const sysAdminUser: JwtPayload = {
    sub: '00000000-0000-4000-8000-000000000001',
    email: 'sysadmin@labodc.uth.edu.vn',
    role: UserRole.SYSTEM_ADMIN,
    status: UserStatus.ACTIVE,
  };

  const labAdminUser: JwtPayload = {
    sub: '00000000-0000-4000-8000-000000000002',
    email: 'labadmin@labodc.uth.edu.vn',
    role: UserRole.LAB_ADMIN,
    status: UserStatus.ACTIVE,
  };

  beforeEach(() => {
    const entRepo = new EnterpriseProfileRepository();
    const projRepo = new ProjectProposalRepository();
    const payosSpike = new PaymentsSpikeService(projRepo);
    const financeEscrow = new FinanceEscrowService(projRepo);

    service = new SystemGovernanceService(
      entRepo,
      projRepo,
      payosSpike,
      financeEscrow,
    );
  });

  it('Chặn mọi nỗ lực thay đổi tỷ lệ bất biến 70/20/10 (409 Conflict)', () => {
    expect(() =>
      service.updateRuntimeConfig(sysAdminUser, {
        teamPercentage: 80,
        mentorPercentage: 10,
        labFundPercentage: 10,
        reasonNote: 'Thử nghiệm sửa tỷ lệ chia doanh thu.',
      }),
    ).toThrow(ConflictException);
  });

  it('Chặn LAB_ADMIN cập nhật cấu hình hệ thống (403 Forbidden) nhưng cho phép SYSTEM_ADMIN cập nhật tham số hợp lệ', () => {
    expect(() =>
      service.updateRuntimeConfig(labAdminUser, {
        minDurationWeeks: 6,
        maxDurationWeeks: 20,
        reasonNote: 'Lab Admin cố tình sửa cấu hình hệ thống.',
      }),
    ).toThrow(ForbiddenException);

    const updated = service.updateRuntimeConfig(sysAdminUser, {
      minDurationWeeks: 6,
      maxDurationWeeks: 20,
      reasonNote: 'System Admin điều chỉnh thời lượng dự án học kỳ mới.',
    });

    expect(updated.projectLimits.minDurationWeeks).toBe(6);
    expect(updated.projectLimits.maxDurationWeeks).toBe(20);
  });

  it('Chặn SYSTEM_ADMIN tự khóa tài khoản của chính mình (409 Conflict)', () => {
    expect(() =>
      service.updateAccountGovernanceStatus(sysAdminUser, sysAdminUser.sub, {
        targetEmail: sysAdminUser.email,
        targetRole: UserRole.SYSTEM_ADMIN,
        newStatus: UserStatus.LOCKED,
        reasonNote: 'Tự khóa tài khoản quản trị viên.',
      }),
    ).toThrow(ConflictException);
  });
});