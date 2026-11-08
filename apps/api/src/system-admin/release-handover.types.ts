export interface RequirementTraceabilityItemDto {
  reqCode: string;
  domain:
    | 'AUTH_RBAC'
    | 'ENTERPRISE'
    | 'PROJECT_ADMIN'
    | 'FINANCE_PAYOS'
    | 'TALENT_MENTOR'
    | 'SYSTEM_NFR';
  owner: 'STUDENT_A' | 'STUDENT_B' | 'SHARED_A_B';
  title: string;
  implementedModules: string[];
  verificationSuites: string[];
  status: 'VERIFIED_100_PERCENT';
}

export interface AdrComplianceItemDto {
  adrCode: 'ADR-01' | 'ADR-02' | 'ADR-03' | 'ADR-04' | 'ADR-05';
  title: string;
  enforcedRule: string;
  compliant: true;
}

export interface RequirementsTraceabilityMatrixDto {
  matrixVersion: 'D20_FINAL_RTM_2026';
  totalRequirements: number;
  verifiedRequirements: number;
  coveragePercent: 100;
  requirements: RequirementTraceabilityItemDto[];
  architectureDecisions: AdrComplianceItemDto[];
  generatedAt: string;
}

export interface CreateReleaseHandoverPackageDto {
  releaseTag: string;
  environmentTarget?: 'SANDBOX_UAT' | 'PRODUCTION_RC';
  runbookChecklist?: string[];
  handoverNote: string;
}

export interface ReleaseHandoverPackageEntity {
  id: string;
  handoverCode: string;
  releaseTag: string;
  environmentTarget: 'SANDBOX_UAT' | 'PRODUCTION_RC';
  totalRequirementsVerified: number;
  totalAdrsVerified: number;
  financialAuditSnapshot: {
    totalEscrowDepositedVnd: number;
    totalDisbursed702010Vnd: number;
    totalRefundedVnd: number;
    escrowHeldBalanceVnd: number;
    ledgerInvariantHold: boolean;
  };
  slaCompliancePercent: number;
  runbookChecklist: string[];
  handoverNote: string;
  preparedBy: string;
  preparedAt: string;
}

export interface FinalGateD20SummaryDto {
  gateCode: 'GATE_D20_FINAL_RELEASE_CANDIDATE';
  gateStatus: 'PASSED';
  evaluatedAt: string;
  rtmCoveragePercent: 100;
  adrComplianceCount: number;
  financialLedgerInvariantHold: boolean;
  slaCompliancePercent: number;
  totalHandoverPackagesIssued: number;
  latestHandoverPackage: ReleaseHandoverPackageEntity | null;
}