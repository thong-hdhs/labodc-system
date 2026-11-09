import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { JwtPayload, UserRole } from '@labodc/shared-types';
import { FinanceEscrowService } from '../payments/finance-escrow.service';
import { ProductionReadinessService } from './production-readiness.service';
import { ReleaseHandoverService } from './release-handover.service';
import { ProductionGoliveService } from './production-golive.service';
import {
  FinalCompletionCertificateEntity,
  IssueFinalCompletionCertificateDto,
  Project22DayMasterSummaryDto,
  RoadmapPhaseAuditItemDto,
} from './final-archival.types';

@Injectable()
export class FinalArchivalService {
  private readonly certificates: FinalCompletionCertificateEntity[] = [];
  private certSequence = 1;

  constructor(
    private readonly financeEscrowService: FinanceEscrowService,
    private readonly productionReadinessService: ProductionReadinessService,
    private readonly releaseHandoverService: ReleaseHandoverService,
    private readonly productionGoliveService: ProductionGoliveService,
  ) {}

  getProject22DayMasterSummary(
    user: JwtPayload,
  ): Project22DayMasterSummaryDto {
    if (
      user.role !== UserRole.SYSTEM_ADMIN &&
      user.role !== UserRole.LAB_ADMIN
    ) {
      throw new ForbiddenException(
        'Chỉ SYSTEM_ADMIN hoặc LAB_ADMIN mới có quyền truy xuất Báo cáo Tổng kết Toàn trình 22 Ngày (Gate D22).',
      );
    }

    const rtm =
      this.releaseHandoverService.getRequirementsTraceabilityMatrix(user);
    const sla = this.productionReadinessService.listSlaBenchmarks(user);
    const recon =
      this.financeEscrowService.getGlobalReconciliationSummary(user);
    const mobileContract =
      this.productionGoliveService.verifyMobileCompanionContract(user);

    const phases: RoadmapPhaseAuditItemDto[] = [
      {
        phaseCode: 'PHASE_0_1_MVP_FOUNDATION_D1_D10',
        gateCode: 'GATE_D10',
        dayRange: 'D1 -> D10',
        studentADeliverables: [
          'AuthModule & Server-side RBAC 6 Roles',
          'EnterpriseModule (KYC Verification)',
          'ProjectsModule & LabAdminModule (Approve/Reject/Publish)',
          'PaymentsSpikeService (PayOS Sandbox & HMAC-SHA256)',
        ],
        studentBDeliverables: [
          'TalentModule (Student Profile & Skills)',
          'ApplicationsModule (Public Discovery & Apply)',
        ],
        status: 'COMPLETED_100_PERCENT',
      },
      {
        phaseCode: 'PHASE_2_ESCROW_AND_OPERATIONS_D11_D16',
        gateCode: 'GATE_D16',
        dayRange: 'D11 -> D16',
        studentADeliverables: [
          'Scope Change & Project Cancellation (005_a)',
          'Milestone Escrow & Immutable 70/20/10 Split (006_a)',
          'Idempotent Webhook Reconciliation & Escrow Refund (007_a)',
          'System Governance & Progress Settlement Statements (008_a, 012_a)',
        ],
        studentBDeliverables: [
          'Mentor Invitations & Application Reviews (005_b, 006_b)',
          'Team Formation, Task Templates & Task Submissions (009_b, 010_b, 011_b)',
        ],
        status: 'COMPLETED_100_PERCENT',
      },
      {
        phaseCode: 'PHASE_3_PAYOUT_NFR_MOBILE_GOLIVE_D17_D21',
        gateCode: 'GATE_D20_D21',
        dayRange: 'D17 -> D21',
        studentADeliverables: [
          'Team 70% Pool Distribution, Bank Payouts & Financial Receipts (013_a)',
          'Financial Dispute Resolution, Closure Dossier & Lab 10% Fund Transparency (014_a)',
          'NFR SLA Telemetry, Security Matrix, RTM & Release Handover (015_a, 016_a)',
          'Mobile Companion API Contract Audit & Post-Deploy Smoke Suite (017_a)',
        ],
        studentBDeliverables: [
          'Evaluations, Contribution Scores & Progress Reports (012_b)',
          'Private Cloudinary File Storage (013_b)',
          'Flutter Mobile Companion App (apps/mobile)',
        ],
        status: 'COMPLETED_100_PERCENT',
      },
      {
        phaseCode: 'PHASE_4_FINAL_HANDOVER_AND_ARCHIVAL_D22',
        gateCode: 'GATE_D22',
        dayRange: 'D22',
        studentADeliverables: [
          'Final Project Completion Certificate & Operational Runbook Archival (018_a)',
        ],
        studentBDeliverables: [
          'Mobile Companion Final Verification & End-to-End Handover Sync (D22)',
        ],
        status: 'COMPLETED_100_PERCENT',
      },
    ];

    return {
      roadmapCode: 'LABODC_22_DAY_FULLSTACK_ROADMAP',
      totalDaysCompleted: 22,
      allGatesPassed:
        recon.invariantHold &&
        sla.complianceRatePercent === 100 &&
        mobileContract.allCompatible,
      phases,
      qualityAndSecurityMetrics: {
        rtmCoveragePercent: rtm.coveragePercent,
        adrCompliantCount: rtm.architectureDecisions.length,
        slaCompliancePercent: sla.complianceRatePercent,
        mobileCompanionCompatible: mobileContract.allCompatible,
        rbacRolesVerifiedCount: 6,
      },
      financialLedgerFinalTotals: {
        totalEscrowDepositedVnd: recon.ledgerTotals.totalEscrowDeposited,
        totalDisbursed702010Vnd: recon.ledgerTotals.totalDisbursed702010,
        totalRefundedVnd: recon.ledgerTotals.totalRefundedToEnterprise,
        escrowHeldBalanceVnd: recon.ledgerTotals.totalEscrowHeldBalance,
        ledgerInvariantHold: recon.invariantHold,
      },
      generatedAt: new Date().toISOString(),
    };
  }

  issueFinalCompletionCertificate(
    user: JwtPayload,
    dto: IssueFinalCompletionCertificateDto,
  ): FinalCompletionCertificateEntity {
    if (user.role !== UserRole.SYSTEM_ADMIN) {
      throw new ForbiddenException(
        'Chỉ SYSTEM_ADMIN mới có thẩm quyền cấp Chứng nhận Hoàn thành Dự án & Lưu trữ Hồ sơ Cuối khóa D22.',
      );
    }

    if (!dto.releaseVersion || dto.releaseVersion.trim().length < 3) {
      throw new BadRequestException(
        'Phiên bản phát hành cuối khóa (releaseVersion) bắt buộc tối thiểu 3 ký tự.',
      );
    }

    if (!dto.archivalNote || dto.archivalNote.trim().length < 15) {
      throw new BadRequestException(
        'Ghi chú nghiệm thu lưu trữ cuối khóa (archivalNote) bắt buộc tối thiểu 15 ký tự.',
      );
    }

    const summary = this.getProject22DayMasterSummary(user);
    if (!summary.allGatesPassed) {
      throw new ConflictException({
        code: 'GATE_D22_ARCHIVAL_PRECONDITION_FAILED',
        message:
          'Không thể cấp Chứng nhận Hoàn thành Dự án D22 khi có chỉ số SLA vi phạm hoặc Sổ cái 70/20/10 không cân bằng.',
      });
    }

    const defaultRunbook = [
      '1. Vận hành Monorepo (@labodc/shared-types, @labodc/api, @labodc/web, apps/mobile) theo kiến trúc Modular Monolith (ADR-01)',
      '2. Bảo toàn sổ cái tài chính chỉ ghi thêm (Append-Only Ledger) và tỷ lệ bất biến 70% Nhóm SV / 20% Mentor / 10% Quỹ Lab (ADR-02)',
      '3. Duy trì xác thực JWT Stateless & RolesGuard 6 vai trò trên toàn bộ API nhạy cảm (ADR-03)',
      '4. Đối soát tự động PayOS Webhook HMAC-SHA256 kèm khóa chống xử lý trùng Idempotency Key (ADR-04)',
      '5. Giám sát định kỳ Liveness/Readiness Probes (/api/v1/system-admin/readiness/probes) đảm bảo Uptime >= 99.0% (ADR-05)',
    ];

    const seq = this.certSequence++;
    const cert: FinalCompletionCertificateEntity = {
      id: `final-cert-d22-${String(seq).padStart(4, '0')}`,
      certificateCode: `CERT-D22-FINAL-${String(seq).padStart(3, '0')}`,
      gateCode: 'GATE_D22_FINAL_PROJECT_COMPLETION_AND_ARCHIVAL',
      gateStatus: 'COMPLETED_AND_ARCHIVED',
      releaseVersion: dto.releaseVersion.trim(),
      totalDaysCompleted: 22,
      studentAMigrationsCount: 17,
      studentBMigrationsCount: 9,
      rtmCoveragePercent: summary.qualityAndSecurityMetrics.rtmCoveragePercent,
      slaCompliancePercent:
        summary.qualityAndSecurityMetrics.slaCompliancePercent,
      mobileContractVerified:
        summary.qualityAndSecurityMetrics.mobileCompanionCompatible,
      ledgerInvariantVerified:
        summary.financialLedgerFinalTotals.ledgerInvariantHold,
      financialSnapshot: {
        totalEscrowDepositedVnd:
          summary.financialLedgerFinalTotals.totalEscrowDepositedVnd,
        totalDisbursed702010Vnd:
          summary.financialLedgerFinalTotals.totalDisbursed702010Vnd,
        totalRefundedVnd: summary.financialLedgerFinalTotals.totalRefundedVnd,
        escrowHeldBalanceVnd:
          summary.financialLedgerFinalTotals.escrowHeldBalanceVnd,
      },
      operationalRunbook:
        Array.isArray(dto.operationalRunbookSteps) &&
        dto.operationalRunbookSteps.length > 0
          ? dto.operationalRunbookSteps
          : defaultRunbook,
      archivalNote: dto.archivalNote.trim(),
      issuedBy: user.sub,
      issuedAt: new Date().toISOString(),
    };

    this.certificates.push(cert);
    return cert;
  }

  listFinalCompletionCertificates(
    user: JwtPayload,
  ): FinalCompletionCertificateEntity[] {
    if (
      user.role !== UserRole.SYSTEM_ADMIN &&
      user.role !== UserRole.LAB_ADMIN
    ) {
      throw new ForbiddenException(
        'Chỉ SYSTEM_ADMIN hoặc LAB_ADMIN mới có quyền xem danh sách Chứng nhận Hoàn thành Dự án D22.',
      );
    }
    return this.certificates;
  }
}