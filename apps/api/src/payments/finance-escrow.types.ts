export enum MilestoneEscrowStatus {
  PLANNED = 'PLANNED',
  ESCROW_PAID = 'ESCROW_PAID',
  SUBMITTED = 'SUBMITTED',
  ACCEPTED = 'ACCEPTED',
  DISBURSED = 'DISBURSED',
  REFUNDED = 'REFUNDED',
}

export enum LedgerEntryType {
  ESCROW_DEPOSIT = 'ESCROW_DEPOSIT',
  SPLIT_TEAM_70 = 'SPLIT_TEAM_70',
  SPLIT_MENTOR_20 = 'SPLIT_MENTOR_20',
  SPLIT_LAB_10 = 'SPLIT_LAB_10',
  ESCROW_REFUND = 'ESCROW_REFUND',
}

export interface CreateProjectMilestoneDto {
  projectId: string;
  title: string;
  description: string;
  amount: number;
}

export interface ConfirmMilestoneEscrowDto {
  transactionReference?: string;
  note?: string;
}

export interface SubmitMilestoneDeliverableDto {
  deliverableUrl: string;
  deliverableNote: string;
}

export interface AcceptMilestoneDto {
  reviewNote?: string;
  markProjectCompleted?: boolean;
}

export interface RequestMilestoneRevisionDto {
  revisionNote: string;
}

export interface RefundMilestoneEscrowDto {
  refundReason: string;
}

export interface SyncPayosWebhookToMilestoneDto {
  reference?: string;
}

export interface ProjectMilestoneEntity {
  id: string;
  projectId: string;
  enterpriseUserId: string;
  title: string;
  description: string;
  amount: number;
  currency: 'VND';
  orderCode: number;
  status: MilestoneEscrowStatus;
  deliverableUrl: string | null;
  deliverableNote: string | null;
  submittedBy: string | null;
  submittedAt: string | null;
  acceptedBy: string | null;
  acceptedAt: string | null;
  revisionCount?: number;
  lastRevisionNote?: string | null;
  refundedAt?: string | null;
  refundReason?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LedgerEntryEntity {
  id: string;
  projectId: string;
  milestoneId: string;
  orderCode: number;
  entryType: LedgerEntryType;
  direction: 'CREDIT' | 'DEBIT';
  amount: number;
  currency: 'VND';
  beneficiaryRole:
    | 'ESCROW_VAULT'
    | 'TEAM_LEADER'
    | 'MENTOR'
    | 'LAB_FUND'
    | 'ENTERPRISE_REFUND';
  description: string;
  createdBy: string;
  createdAt: string;
}

export interface DisbursementAllocationEntity {
  id: string;
  projectId: string;
  milestoneId: string;
  recipientRole: 'TEAM_LEADER' | 'MENTOR' | 'LAB_FUND';
  percentage: 70 | 20 | 10;
  amount: number;
  remainderAbsorbed: number;
  currency: 'VND';
  status: 'COMPLETED';
  disbursedAt: string;
}

export interface RevenueSplitBreakdown {
  totalAmount: number;
  teamAmount70: number;
  mentorAmount20: number;
  labAmount10: number;
  remainderAbsorbedByLab: number;
  invariantHold: boolean;
}

export interface GlobalReconciliationSummaryDto {
  totalMilestones: number;
  milestonesByStatus: {
    planned: number;
    escrowPaid: number;
    submitted: number;
    disbursed: number;
    refunded: number;
  };
  ledgerTotals: {
    totalEscrowDeposited: number;
    totalDisbursed702010: number;
    totalTeam70: number;
    totalMentor20: number;
    totalLab10: number;
    totalRemainderAbsorbedByLab: number;
    totalRefundedToEnterprise: number;
    totalEscrowHeldBalance: number;
    currency: 'VND';
  };
  invariantHold: boolean;
}