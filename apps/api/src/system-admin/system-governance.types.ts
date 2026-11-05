import { UserRole, UserStatus } from '@labodc/shared-types';

export interface SystemRuntimeConfigDto {
  paymentMode: 'SANDBOX' | 'PRODUCTION';
  revenueSplitPolicy: {
    teamPercentage: 70;
    mentorPercentage: 20;
    labFundPercentage: 10;
    remainderPolicy: 'ABSORB_INTO_LAB_FUND_10';
    immutable: true;
  };
  projectLimits: {
    minDurationWeeks: number;
    maxDurationWeeks: number;
    maxPendingChangeRequestsPerProject: number;
  };
  securityPolicy: {
    requireReasonNoteMinLength: number;
    webhookSignatureAlgorithm: 'HMAC-SHA256';
    enforceIdempotencyKey: true;
  };
  updatedBy: string;
  updatedAt: string;
}

export interface UpdateSystemRuntimeConfigDto {
  paymentMode?: 'SANDBOX' | 'PRODUCTION';
  minDurationWeeks?: number;
  maxDurationWeeks?: number;
  requireReasonNoteMinLength?: number;
  teamPercentage?: number;
  mentorPercentage?: number;
  labFundPercentage?: number;
  reasonNote: string;
}

export interface UpdateAccountGovernanceStatusDto {
  targetEmail: string;
  targetRole: UserRole;
  newStatus: UserStatus;
  reasonNote: string;
}

export interface AccountGovernanceRecordDto {
  userId: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  lastReasonNote: string;
  updatedBy: string;
  updatedAt: string;
}

export interface SystemGovernanceAuditLogDto {
  id: string;
  actorUserId: string;
  actorRole: UserRole;
  action:
    | 'UPDATE_SYSTEM_CONFIG'
    | 'LOCK_USER_ACCOUNT'
    | 'UNLOCK_USER_ACCOUNT';
  targetType: 'SYSTEM_CONFIG' | 'USER_ACCOUNT';
  targetId: string;
  reasonNote: string;
  createdAt: string;
}

export interface Sprint2ReadinessReportDto {
  checkpointCode: 'D14_SPRINT2_GOVERNANCE_AND_FINANCE_AUDIT';
  generatedAt: string;
  systemConfig: SystemRuntimeConfigDto;
  enterpriseSummary: {
    totalEnterprises: number;
    verifiedEnterprises: number;
  };
  projectLifecycleSummary: {
    totalProjects: number;
    approved: number;
    published: number;
    recruitmentClosed: number;
    inProgress: number;
    completed: number;
    cancelled: number;
  };
  escrowAndLedgerAudit: {
    totalMilestones: number;
    disbursedMilestones: number;
    refundedMilestones: number;
    totalEscrowDepositedVnd: number;
    totalDisbursed702010Vnd: number;
    totalRefundedVnd: number;
    escrowHeldBalanceVnd: number;
    ledgerInvariantHold: boolean;
  };
  governanceAuditCount: number;
}