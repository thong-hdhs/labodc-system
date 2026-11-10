import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { JwtPayload, UserRole } from '@labodc/shared-types';
import { FinanceEscrowService } from '../payments/finance-escrow.service';
import { ProductionReadinessService } from './production-readiness.service';
import { ReleaseHandoverService } from './release-handover.service';
import { ProductionGoliveService } from './production-golive.service';
import {
  CreateDefenseGateD23SignoffDto,
  DefenseGateD23SignoffEntity,
  ExecuteDrDrillDto,
  HypercareDrDrillEntity,
  HypercareOperationsStatusDto,
} from './post-golive-hypercare.types';

@Injectable()
export class PostGoliveHypercareService {
  private readonly drDrills: HypercareDrDrillEntity[] = [];
  private drillSequence = 1;
  private defenseSignoff: DefenseGateD23SignoffEntity | null = null;

  constructor(
    private readonly financeEscrowService: FinanceEscrowService,
    private readonly productionReadinessService: ProductionReadinessService,
    private readonly releaseHandoverService: ReleaseHandoverService,
    private readonly productionGoliveService: ProductionGoliveService,
  ) {}

  executeDrBackupRestoreDrill(
    user: JwtPayload,
    dto: ExecuteDrDrillDto,
  ): HypercareDrDrillEntity {
    if (
      user.role !== UserRole.SYSTEM_ADMIN &&
      user.role !== UserRole.LAB_ADMIN
    ) {
      throw new ForbiddenException(
        'Chỉ SYSTEM_ADMIN hoặc LAB_ADMIN mới có quyền thực thi Diễn tập Sao lưu & Khôi phục Thảm họa (DR Drill).',
      );
    }

    if (!dto.scenarioName || dto.scenarioName.trim().length < 5) {
      throw new BadRequestException(
        'Tên kịch bản diễn tập DR (scenarioName) bắt buộc tối thiểu 5 ký tự.',
      );
    }

    if (
      typeof dto.measuredRtoSeconds !== 'number' ||
      dto.measuredRtoSeconds < 0
    ) {
      throw new BadRequestException(
        'Thời gian khôi phục thực tế (measuredRtoSeconds) phải là số không âm.',
      );
    }

    if (!dto.drillNote || dto.drillNote.trim().length < 10) {
      throw new BadRequestException(
        'Ghi chú diễn tập DR (drillNote) bắt buộc tối thiểu 10 ký tự.',
      );
    }

    const recon =
      this.financeEscrowService.getGlobalReconciliationSummary(user);
    const targetRtoSeconds = 300;
    const withinDrSla =
      dto.measuredRtoSeconds <= targetRtoSeconds && recon.invariantHold;

    const seq = this.drillSequence++;
    const drill: HypercareDrDrillEntity = {
      id: `dr-drill-${String(seq).padStart(4, '0')}`,
      drillCode: `DR-D23-${String(seq).padStart(3, '0')}`,
      scenarioName: dto.scenarioName.trim(),
      measuredRtoSeconds: dto.measuredRtoSeconds,
      targetRtoSeconds,
      measuredRpoTransactionsLost: 0,
      ledgerSnapshotVerified: recon.invariantHold,
      withinDrSla,
      ledgerTotalsAtDrill: {
        totalEscrowDepositedVnd: recon.ledgerTotals.totalEscrowDeposited,
        totalDisbursed702010Vnd: recon.ledgerTotals.totalDisbursed702010,
        totalRefundedVnd: recon.ledgerTotals.totalRefundedToEnterprise,
        escrowHeldBalanceVnd: recon.ledgerTotals.totalEscrowHeldBalance,
      },
      drillNote: dto.drillNote.trim(),
      executedBy: user.sub,
      executedAt: new Date().toISOString(),
    };

    this.drDrills.push(drill);
    return drill;
  }

  listDrDrills(user: JwtPayload): HypercareDrDrillEntity[] {
    if (
      user.role !== UserRole.SYSTEM_ADMIN &&
      user.role !== UserRole.LAB_ADMIN
    ) {
      throw new ForbiddenException(
        'Chỉ SYSTEM_ADMIN hoặc LAB_ADMIN mới có quyền xem lịch sử diễn tập DR Drill.',
      );
    }
    return this.drDrills;
  }

  getHypercareOperationsStatus(
    user: JwtPayload,
  ): HypercareOperationsStatusDto {
    if (
      user.role !== UserRole.SYSTEM_ADMIN &&
      user.role !== UserRole.LAB_ADMIN
    ) {
      throw new ForbiddenException(
        'Chỉ SYSTEM_ADMIN hoặc LAB_ADMIN mới có quyền truy xuất trạng thái Vận hành Hypercare D23.',
      );
    }

    const probes = this.productionReadinessService.getSystemProbes();
    const sla = this.productionReadinessService.listSlaBenchmarks(user);
    const recon =
      this.financeEscrowService.getGlobalReconciliationSummary(user);
    const mobileContract =
      this.productionGoliveService.verifyMobileCompanionContract(user);
    const latestDrill =
      this.drDrills.length > 0
        ? this.drDrills[this.drDrills.length - 1]
        : null;

    return {
      windowCode: 'D23_POST_GOLIVE_HYPERCARE_WINDOW',
      liveness: probes.liveness,
      readiness: probes.readiness,
      uptimeTargetPercent: probes.uptimeTargetPercent,
      slaCompliancePercent: sla.complianceRatePercent,
      ledgerInvariantHold: recon.invariantHold,
      mobileCompanionCompatible: mobileContract.allCompatible,
      totalDrDrillsExecuted: this.drDrills.length,
      latestDrDrillPassed: latestDrill ? latestDrill.withinDrSla : false,
      gateD23SignedOff: this.defenseSignoff !== null,
      checkedAt: new Date().toISOString(),
    };
  }

  signOffProjectDefenseGateD23(
    user: JwtPayload,
    dto: CreateDefenseGateD23SignoffDto,
  ): DefenseGateD23SignoffEntity {
    if (user.role !== UserRole.SYSTEM_ADMIN) {
      throw new ForbiddenException(
        'Chỉ SYSTEM_ADMIN mới có thẩm quyền ký Biên bản Nghiệm thu Hypercare & Bảo vệ Đồ án Gate D23.',
      );
    }

    if (!dto.releaseVersion || dto.releaseVersion.trim().length < 3) {
      throw new BadRequestException(
        'Phiên bản phát hành (releaseVersion) bắt buộc tối thiểu 3 ký tự.',
      );
    }

    if (!dto.defenseNote || dto.defenseNote.trim().length < 15) {
      throw new BadRequestException(
        'Ghi chú nghiệm thu bảo vệ đồ án (defenseNote) bắt buộc tối thiểu 15 ký tự.',
      );
    }

    const drill = this.drDrills.find((d) => d.id === dto.drDrillId);
    if (!drill) {
      throw new NotFoundException(
        `Không tìm thấy phiên diễn tập DR Drill với ID ${dto.drDrillId}.`,
      );
    }

    if (!drill.withinDrSla || !drill.ledgerSnapshotVerified) {
      throw new ConflictException({
        code: 'GATE_D23_DR_DRILL_SLA_FAILED',
        message:
          'Không thể ký đóng cổng Gate D23 khi phiên diễn tập DR Drill vượt ngưỡng RTO 300s hoặc Sổ cái không toàn vẹn.',
      });
    }

    const sla = this.productionReadinessService.listSlaBenchmarks(user);
    if (sla.complianceRatePercent < 100) {
      throw new ConflictException({
        code: 'GATE_D23_SLA_VIOLATION',
        message: `Không thể ký đóng cổng Gate D23 khi tỷ lệ tuân thủ SLA đạt ${sla.complianceRatePercent}% (< 100%).`,
      });
    }

    const rtm =
      this.releaseHandoverService.getRequirementsTraceabilityMatrix(user);

    const signoff: DefenseGateD23SignoffEntity = {
      id: 'gate-d23-defense-0001',
      defenseCode: 'DEFENSE-D23-FINAL-001',
      gateCode: 'GATE_D23_POST_GOLIVE_HYPERCARE_AND_DEFENSE',
      gateStatus: 'PASSED_AND_DEFENSE_READY',
      drDrillId: drill.id,
      drDrillCode: drill.drillCode,
      releaseVersion: dto.releaseVersion.trim(),
      hypercareHealthy: true,
      ledgerInvariantVerified: drill.ledgerSnapshotVerified,
      slaCompliancePercent: sla.complianceRatePercent,
      rtmCoveragePercent: rtm.coveragePercent,
      defenseNote: dto.defenseNote.trim(),
      signedBy: user.sub,
      signedAt: new Date().toISOString(),
    };

    this.defenseSignoff = signoff;
    return signoff;
  }
}