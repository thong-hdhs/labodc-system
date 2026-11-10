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
  AcademicDefenseDossierDto,
  AcademicDefenseVerdictEntity,
  CreatePermanentLedgerSealDto,
  PermanentLedgerSealEntity,
  RecordAcademicDefenseVerdictDto,
} from './academic-defense.types';

@Injectable()
export class AcademicDefenseService {
  private readonly ledgerSeals: PermanentLedgerSealEntity[] = [];
  private sealSequence = 1;
  private defenseVerdict: AcademicDefenseVerdictEntity | null = null;

  constructor(
    private readonly financeEscrowService: FinanceEscrowService,
    private readonly productionReadinessService: ProductionReadinessService,
    private readonly releaseHandoverService: ReleaseHandoverService,
    private readonly productionGoliveService: ProductionGoliveService,
  ) {}

  sealFinancialLedgerPermanently(
    user: JwtPayload,
    dto: CreatePermanentLedgerSealDto,
  ): PermanentLedgerSealEntity {
    if (
      user.role !== UserRole.SYSTEM_ADMIN &&
      user.role !== UserRole.LAB_ADMIN
    ) {
      throw new ForbiddenException(
        'Chỉ SYSTEM_ADMIN hoặc LAB_ADMIN mới có quyền thực hiện Niêm phong Sổ cái 70/20/10 (Gate D24).',
      );
    }

    if (!dto.releaseTag || dto.releaseTag.trim().length < 3) {
      throw new BadRequestException(
        'Nhãn phát hành niêm phong (releaseTag) bắt buộc tối thiểu 3 ký tự.',
      );
    }

    if (!dto.sealNote || dto.sealNote.trim().length < 10) {
      throw new BadRequestException(
        'Ghi chú niêm phong sổ cái (sealNote) bắt buộc tối thiểu 10 ký tự.',
      );
    }

    const recon =
      this.financeEscrowService.getGlobalReconciliationSummary(user);

    if (!recon.invariantHold) {
      throw new ConflictException({
        code: 'GATE_D24_LEDGER_INVARIANT_BROKEN',
        message:
          'Không thể niêm phong sổ cái khi bất biến 70/20/10 không cân bằng.',
      });
    }

    if (recon.ledgerTotals.totalEscrowHeldBalance !== 0) {
      throw new ConflictException({
        code: 'GATE_D24_UNSETTLED_ESCROW_BALANCE',
        message: `Không thể niêm phong sổ cái cuối khóa khi vẫn còn số dư ký quỹ chưa tất toán (${recon.ledgerTotals.totalEscrowHeldBalance} VND).`,
      });
    }

    const seq = this.sealSequence++;
    const seal: PermanentLedgerSealEntity = {
      id: `ledger-seal-${String(seq).padStart(4, '0')}`,
      sealCode: `SEAL-D24-${String(seq).padStart(3, '0')}`,
      releaseTag: dto.releaseTag.trim(),
      totalEscrowDepositedVnd: recon.ledgerTotals.totalEscrowDeposited,
      totalDisbursed702010Vnd: recon.ledgerTotals.totalDisbursed702010,
      totalRefundedVnd: recon.ledgerTotals.totalRefundedToEnterprise,
      escrowHeldBalanceVnd: recon.ledgerTotals.totalEscrowHeldBalance,
      invariantVerified: recon.invariantHold,
      sealNote: dto.sealNote.trim(),
      sealedBy: user.sub,
      sealedAt: new Date().toISOString(),
    };

    this.ledgerSeals.push(seal);
    return seal;
  }

  getAcademicDefenseDossier(user: JwtPayload): AcademicDefenseDossierDto {
    if (
      user.role !== UserRole.SYSTEM_ADMIN &&
      user.role !== UserRole.LAB_ADMIN
    ) {
      throw new ForbiddenException(
        'Chỉ SYSTEM_ADMIN hoặc LAB_ADMIN mới có quyền truy xuất Hồ sơ Bảo vệ Đồ án Gate D24.',
      );
    }

    const rtm =
      this.releaseHandoverService.getRequirementsTraceabilityMatrix(user);
    const sla = this.productionReadinessService.listSlaBenchmarks(user);
    const recon =
      this.financeEscrowService.getGlobalReconciliationSummary(user);
    const mobileContract =
      this.productionGoliveService.verifyMobileCompanionContract(user);
    const latestSeal =
      this.ledgerSeals.length > 0
        ? this.ledgerSeals[this.ledgerSeals.length - 1]
        : null;

    return {
      dossierCode: 'D24_ACADEMIC_COUNCIL_DEFENSE_DOSSIER',
      totalDaysCompleted: 24,
      studentAMigrationsCount: 19,
      studentBMigrationsCount: 9,
      rtmCoveragePercent: rtm.coveragePercent,
      adrCompliantCount: rtm.architectureDecisions.length,
      slaCompliancePercent: sla.complianceRatePercent,
      mobileCompanionVerified: mobileContract.allCompatible,
      ledgerInvariantHold: recon.invariantHold,
      ledgerSealed: latestSeal !== null,
      latestSeal,
      gateD24SignedOff: this.defenseVerdict !== null,
      generatedAt: new Date().toISOString(),
    };
  }

  recordAcademicDefenseVerdict(
    user: JwtPayload,
    dto: RecordAcademicDefenseVerdictDto,
  ): AcademicDefenseVerdictEntity {
    if (user.role !== UserRole.SYSTEM_ADMIN) {
      throw new ForbiddenException(
        'Chỉ SYSTEM_ADMIN mới có thẩm quyền ký Quyết định Nghiệm thu Bảo vệ Đồ án Trước Hội đồng (Gate D24).',
      );
    }

    if (
      typeof dto.studentAScore !== 'number' ||
      dto.studentAScore < 50 ||
      dto.studentAScore > 100 ||
      typeof dto.studentBScore !== 'number' ||
      dto.studentBScore < 50 ||
      dto.studentBScore > 100
    ) {
      throw new BadRequestException(
        'Điểm đánh giá bảo vệ đồ án của Sinh viên A và Sinh viên B phải nằm trong khoảng từ 50 đến 100.',
      );
    }

    if (
      !dto.councilEvaluationNote ||
      dto.councilEvaluationNote.trim().length < 15
    ) {
      throw new BadRequestException(
        'Nhận xét của Hội đồng Nghiệm thu (councilEvaluationNote) bắt buộc tối thiểu 15 ký tự.',
      );
    }

    const seal = this.ledgerSeals.find((s) => s.id === dto.ledgerSealId);
    if (!seal) {
      throw new NotFoundException(
        `Không tìm thấy bản ghi Niêm phong Sổ cái với ID ${dto.ledgerSealId}.`,
      );
    }

    const sla = this.productionReadinessService.listSlaBenchmarks(user);
    if (sla.complianceRatePercent < 100) {
      throw new ConflictException({
        code: 'GATE_D24_SLA_VIOLATION',
        message: `Không thể ký nghiệm thu Gate D24 khi tỷ lệ tuân thủ SLA đạt ${sla.complianceRatePercent}% (< 100%).`,
      });
    }

    const rtm =
      this.releaseHandoverService.getRequirementsTraceabilityMatrix(user);
    const averageScore = Math.round(
      (dto.studentAScore + dto.studentBScore) / 2,
    );

    const verdict: AcademicDefenseVerdictEntity = {
      id: 'verdict-d24-0001',
      verdictCode: 'COUNCIL-D24-VERDICT-001',
      gateCode: 'GATE_D24_ACADEMIC_COUNCIL_DEFENSE_AND_LEDGER_SEAL',
      verdictStatus:
        averageScore >= 85 ? 'APPROVED_WITH_DISTINCTION' : 'APPROVED',
      ledgerSealId: seal.id,
      ledgerSealCode: seal.sealCode,
      studentAScore: dto.studentAScore,
      studentBScore: dto.studentBScore,
      averageScore,
      rtmCoveragePercent: rtm.coveragePercent,
      slaCompliancePercent: sla.complianceRatePercent,
      ledgerInvariantVerified: seal.invariantVerified,
      councilEvaluationNote: dto.councilEvaluationNote.trim(),
      approvedBy: user.sub,
      approvedAt: new Date().toISOString(),
    };

    this.defenseVerdict = verdict;
    return verdict;
  }
}