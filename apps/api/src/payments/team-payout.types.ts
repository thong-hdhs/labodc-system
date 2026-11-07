export interface MemberContributionInputDto {
  memberUserId: string;
  memberName: string;
  memberRole: 'TALENT_LEADER' | 'TALENT';
  contributionPercentage: number;
}

export interface DistributeTeam70PoolDto {
  members: MemberContributionInputDto[];
  note?: string;
}

export interface TeamMemberPayoutAllocationEntity {
  id: string;
  projectId: string;
  milestoneId: string;
  memberUserId: string;
  memberName: string;
  memberRole: 'TALENT_LEADER' | 'TALENT';
  contributionPercentage: number;
  allocatedAmount: number;
  remainderAbsorbed: number;
  currency: 'VND';
  createdBy: string;
  createdAt: string;
}

export interface Team70DistributionResultDto {
  projectId: string;
  milestoneId: string;
  teamPool70AmountVnd: number;
  totalAllocatedVnd: number;
  remainderAbsorbedByLeaderVnd: number;
  invariantHold: boolean;
  allocations: TeamMemberPayoutAllocationEntity[];
}

export interface ExecuteMilestonePayoutDto {
  bankTransferRefPrefix?: string;
  note?: string;
}

export interface DisbursementPayoutOrderEntity {
  id: string;
  projectId: string;
  milestoneId: string;
  recipientRole: 'TEAM_LEADER' | 'MENTOR' | 'LAB_FUND';
  amount: number;
  currency: 'VND';
  status: 'PAID_OUT';
  bankTransferRef: string;
  note: string;
  executedBy: string;
  executedAt: string;
}

export interface EnterpriseFinancialReceiptDto {
  id: string;
  receiptNumber: string;
  projectId: string;
  projectCode: string;
  projectTitle: string;
  milestoneId: string;
  milestoneTitle: string;
  companyName: string;
  enterpriseUserId: string;
  grossAmountVnd: number;
  splitBreakdown: {
    team70AmountVnd: number;
    mentor20AmountVnd: number;
    lab10AmountVnd: number;
    remainderAbsorbedByLabVnd: number;
  };
  payoutExecutionStatus: 'PENDING_BANK_TRANSFER' | 'PAID_OUT_COMPLETED';
  teamMemberAllocations: TeamMemberPayoutAllocationEntity[];
  issuedAt: string;
}