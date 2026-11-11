export interface ReconcileEvaluationPayoutMemberDto {
  memberEmail: string;
  evaluationGrade: 'EXCELLENT' | 'GOOD' | 'SATISFACTORY';
  contributionPercent: number;
}

export interface CreateEvaluationPayoutReconciliationDto {
  projectCode: string;
  milestoneAmountVnd: number;
  members: ReconcileEvaluationPayoutMemberDto[];
}

export interface EvaluationPayoutReconciliationEntity {
  id: string;
  reconciliationCode: string;
  projectCode: string;
  milestoneAmountVnd: number;
  teamPool70Vnd: number;
  mentorPool20Vnd: number;
  labPool10Vnd: number;
  totalContributionPercent: number;
  allocatedMembersSumVnd: number;
  memberAllocations: Array<{
    memberEmail: string;
    evaluationGrade: string;
    contributionPercent: number;
    payoutAmountVnd: number;
  }>;
  mobileEvaluationSynced: true;
  privateFileAclVerified: true;
  reconciledBy: string;
  reconciledAt: string;
}

export interface CreateGateD26SignoffDto {
  reconciliationId: string;
  signoffNote: string;
}

export interface GateD26SignoffEntity {
  id: string;
  signoffCode: string;
  gateCode: 'GATE_D26_MOBILE_FULL_PARITY_AND_EVAL_BRIDGE';
  gateStatus: 'PASSED_FULL_PARITY';
  reconciliationId: string;
  reconciliationCode: string;
  mobileFeatureParityPercent: 100;
  ledgerInvariantVerified: boolean;
  slaCompliancePercent: number;
  signoffNote: string;
  signedBy: string;
  signedAt: string;
}