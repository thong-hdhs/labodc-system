import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { JwtPayload, UserRole } from '@labodc/shared-types';
import { randomUUID } from 'crypto';
import { FinanceEscrowService } from '../payments/finance-escrow.service';
import { ProductionReadinessService } from './production-readiness.service';
import {
  CodeFreezeInventorySummaryDto,
  CodeFreezeManifestD27Entity,
  LockCodeFreezeManifestD27Dto,
} from './code-freeze-d27.types';

@Injectable()
export class CodeFreezeD27Service {
  private readonly manifests: CodeFreezeManifestD27Entity[] = [];

  constructor(
    private readonly financeEscrowService: FinanceEscrowService,
    private readonly productionReadinessService: ProductionReadinessService,
  ) {}

  getCodeFreezeInventory(user: JwtPayload): CodeFreezeInventorySummaryDto {
    this.ensureAdminRole(user);

    const reconciliation =
      this.financeEscrowService.getGlobalReconciliationSummary(user);
    const slaSummary = this.productionReadinessService.listSlaBenchmarks(user);

    return {
      inventoryCode: 'D27_FINAL_CODE_FREEZE_INVENTORY',
      totalCodingDaysCompleted: 27,
      studentAMigrationsCount: 22,
      studentBMigrationsCount: 9,
      totalDatabaseMigrations: 31,
      workspacesVerified: [
        '@labodc/shared-types',
        '@labodc/api',
        '@labodc/web',
        'apps/mobile (Flutter)',
      ],
      rtmCoveragePercent: 100,
      adrCompliantCount: 5,
      slaCompliancePercent: slaSummary.complianceRatePercent,
      ledgerInvariantHold: reconciliation.invariantHold,
      escrowHeldBalanceVnd:
        reconciliation.ledgerTotals.totalEscrowHeldBalance,
      codeFreezeLocked: this.manifests.length > 0,
      latestManifest:
        this.manifests.length > 0
          ? this.manifests[this.manifests.length - 1]
          : null,
      generatedAt: new Date().toISOString(),
    };
  }

  lockCodeFreezeManifest(
    user: JwtPayload,
    dto: LockCodeFreezeManifestD27Dto,
  ): CodeFreezeManifestD27Entity {
    if (user.role !== UserRole.SYSTEM_ADMIN) {
      throw new ForbiddenException(
        'Chỉ SYSTEM_ADMIN mới có quyền khóa đóng băng mã nguồn toàn hệ thống Gate D27',
      );
    }

    if (
      !dto.releaseCandidateTag ||
      dto.releaseCandidateTag.trim().length < 3
    ) {
      throw new BadRequestException(
        'Nhãn phiên bản đóng băng (releaseCandidateTag) không hợp lệ',
      );
    }

    if (!dto.nextPhasePlan || dto.nextPhasePlan.trim().length < 10) {
      throw new BadRequestException(
        'Kế hoạch giai đoạn Kiểm thử & Triển khai tiếp theo (nextPhasePlan) phải có ít nhất 10 ký tự',
      );
    }

    const reconciliation =
      this.financeEscrowService.getGlobalReconciliationSummary(user);
    if (!reconciliation.invariantHold) {
      throw new ConflictException(
        'LEDGER_INVARIANT_VIOLATION: Bất biến sổ cái 70/20/10 bị vi phạm, từ chối đóng băng mã nguồn D27',
      );
    }

    const heldBalance = reconciliation.ledgerTotals.totalEscrowHeldBalance;
    if (heldBalance !== 0) {
      throw new ConflictException(
        `UNSETTLED_ESCROW_BALANCE: Đang còn ${heldBalance} VND ký quỹ treo chưa tất toán`,
      );
    }

    const slaSummary = this.productionReadinessService.listSlaBenchmarks(user);
    if (slaSummary.complianceRatePercent < 100) {
      throw new ConflictException(
        `SLA_COMPLIANCE_BELOW_100: Tỷ lệ SLA đạt ${slaSummary.complianceRatePercent}%, yêu cầu 100% trước khi Code Freeze D27`,
      );
    }

    const seq = String(this.manifests.length + 1).padStart(3, '0');
    const entity: CodeFreezeManifestD27Entity = {
      id: randomUUID(),
      freezeCode: `FREEZE-D27-FINAL-${seq}`,
      gateCode: 'GATE_D27_FINAL_CODE_FREEZE_AND_TEST_DEPLOY_HANDOVER',
      gateStatus: 'CODE_FROZEN_READY_FOR_TEST_AND_DEPLOY',
      releaseCandidateTag: dto.releaseCandidateTag.trim(),
      totalCodingDays: 27,
      studentAMigrationsCount: 22,
      studentBMigrationsCount: 9,
      ledgerInvariantVerified: reconciliation.invariantHold,
      escrowHeldBalanceVnd: heldBalance,
      slaCompliancePercent: slaSummary.complianceRatePercent,
      codeFreezeLocked: true,
      nextPhasePlan: dto.nextPhasePlan.trim(),
      lockedBy: user.sub,
      lockedAt: new Date().toISOString(),
    };

    this.manifests.push(entity);
    return entity;
  }

  private ensureAdminRole(user: JwtPayload): void {
    if (
      user.role !== UserRole.SYSTEM_ADMIN &&
      user.role !== UserRole.LAB_ADMIN
    ) {
      throw new ForbiddenException(
        'Chỉ SYSTEM_ADMIN hoặc LAB_ADMIN mới có quyền truy cập hồ sơ Code Freeze D27',
      );
    }
  }
}