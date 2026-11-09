export interface RoadmapPhaseAuditItemDto {
  phaseCode:
    | 'PHASE_0_1_MVP_FOUNDATION_D1_D10'
    | 'PHASE_2_ESCROW_AND_OPERATIONS_D11_D16'
    | 'PHASE_3_PAYOUT_NFR_MOBILE_GOLIVE_D17_D21'
    | 'PHASE_4_FINAL_HANDOVER_AND_ARCHIVAL_D22';
  gateCode: 'GATE_D10' | 'GATE_D16' | 'GATE_D20_D21' | 'GATE_D22';
  dayRange: string;
  studentADeliverables: string[];
  studentBDeliverables: string[];
  status: 'COMPLETED_100_PERCENT';
}

export interface Project22DayMasterSummaryDto {
  roadmapCode: 'LABODC_22_DAY_FULLSTACK_ROADMAP';
  totalDaysCompleted: number;
  allGatesPassed: boolean;
  phases: RoadmapPhaseAuditItemDto[];
  qualityAndSecurityMetrics: {
    rtmCoveragePercent: number;
    adrCompliantCount: number;
    slaCompliancePercent: number;
    mobileCompanionCompatible: boolean;
    rbacRolesVerifiedCount: number;
  };
  financialLedgerFinalTotals: {
    totalEscrowDepositedVnd: number;
    totalDisbursed702010Vnd: number;
    totalRefundedVnd: number;
    escrowHeldBalanceVnd: number;
    ledgerInvariantHold: boolean;
  };
  generatedAt: string;
}

export interface IssueFinalCompletionCertificateDto {
  releaseVersion: string;
  archivalNote: string;
  operationalRunbookSteps?: string[];
}

export interface FinalCompletionCertificateEntity {
  id: string;
  certificateCode: string;
  gateCode: 'GATE_D22_FINAL_PROJECT_COMPLETION_AND_ARCHIVAL';
  gateStatus: 'COMPLETED_AND_ARCHIVED';
  releaseVersion: string;
  totalDaysCompleted: number;
  studentAMigrationsCount: number;
  studentBMigrationsCount: number;
  rtmCoveragePercent: number;
  slaCompliancePercent: number;
  mobileContractVerified: boolean;
  ledgerInvariantVerified: boolean;
  financialSnapshot: {
    totalEscrowDepositedVnd: number;
    totalDisbursed702010Vnd: number;
    totalRefundedVnd: number;
    escrowHeldBalanceVnd: number;
  };
  operationalRunbook: string[];
  archivalNote: string;
  issuedBy: string;
  issuedAt: string;
}