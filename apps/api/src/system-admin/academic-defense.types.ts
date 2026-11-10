export interface CreatePermanentLedgerSealDto {
  releaseTag: string;
  sealNote: string;
}

export interface PermanentLedgerSealEntity {
  id: string;
  sealCode: string;
  releaseTag: string;
  totalEscrowDepositedVnd: number;
  totalDisbursed702010Vnd: number;
  totalRefundedVnd: number;
  escrowHeldBalanceVnd: number;
  invariantVerified: boolean;
  sealNote: string;
  sealedBy: string;
  sealedAt: string;
}

export interface AcademicDefenseDossierDto {
  dossierCode: 'D24_ACADEMIC_COUNCIL_DEFENSE_DOSSIER';
  totalDaysCompleted: number;
  studentAMigrationsCount: number;
  studentBMigrationsCount: number;
  rtmCoveragePercent: number;
  adrCompliantCount: number;
  slaCompliancePercent: number;
  mobileCompanionVerified: boolean;
  ledgerInvariantHold: boolean;
  ledgerSealed: boolean;
  latestSeal: PermanentLedgerSealEntity | null;
  gateD24SignedOff: boolean;
  generatedAt: string;
}

export interface RecordAcademicDefenseVerdictDto {
  ledgerSealId: string;
  studentAScore: number;
  studentBScore: number;
  councilEvaluationNote: string;
}

export interface AcademicDefenseVerdictEntity {
  id: string;
  verdictCode: string;
  gateCode: 'GATE_D24_ACADEMIC_COUNCIL_DEFENSE_AND_LEDGER_SEAL';
  verdictStatus: 'APPROVED_WITH_DISTINCTION' | 'APPROVED';
  ledgerSealId: string;
  ledgerSealCode: string;
  studentAScore: number;
  studentBScore: number;
  averageScore: number;
  rtmCoveragePercent: number;
  slaCompliancePercent: number;
  ledgerInvariantVerified: boolean;
  councilEvaluationNote: string;
  approvedBy: string;
  approvedAt: string;
}