export interface ExecuteDrDrillDto {
  scenarioName: string;
  measuredRtoSeconds: number;
  drillNote: string;
}

export interface HypercareDrDrillEntity {
  id: string;
  drillCode: string;
  scenarioName: string;
  measuredRtoSeconds: number;
  targetRtoSeconds: number;
  measuredRpoTransactionsLost: number;
  ledgerSnapshotVerified: boolean;
  withinDrSla: boolean;
  ledgerTotalsAtDrill: {
    totalEscrowDepositedVnd: number;
    totalDisbursed702010Vnd: number;
    totalRefundedVnd: number;
    escrowHeldBalanceVnd: number;
  };
  drillNote: string;
  executedBy: string;
  executedAt: string;
}

export interface HypercareOperationsStatusDto {
  windowCode: 'D23_POST_GOLIVE_HYPERCARE_WINDOW';
  liveness: 'ALIVE';
  readiness: 'READY';
  uptimeTargetPercent: number;
  slaCompliancePercent: number;
  ledgerInvariantHold: boolean;
  mobileCompanionCompatible: boolean;
  totalDrDrillsExecuted: number;
  latestDrDrillPassed: boolean;
  gateD23SignedOff: boolean;
  checkedAt: string;
}

export interface CreateDefenseGateD23SignoffDto {
  drDrillId: string;
  releaseVersion: string;
  defenseNote: string;
}

export interface DefenseGateD23SignoffEntity {
  id: string;
  defenseCode: string;
  gateCode: 'GATE_D23_POST_GOLIVE_HYPERCARE_AND_DEFENSE';
  gateStatus: 'PASSED_AND_DEFENSE_READY';
  drDrillId: string;
  drDrillCode: string;
  releaseVersion: string;
  hypercareHealthy: boolean;
  ledgerInvariantVerified: boolean;
  slaCompliancePercent: number;
  rtmCoveragePercent: number;
  defenseNote: string;
  signedBy: string;
  signedAt: string;
}