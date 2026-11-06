import { ProjectStatus, UserRole } from '@labodc/shared-types';

export enum ProjectHealthStatus {
  ON_TRACK = 'ON_TRACK',
  AT_RISK = 'AT_RISK',
  DELAYED = 'DELAYED',
}

export enum ProgressReportReviewStatus {
  SUBMITTED = 'SUBMITTED',
  REVIEWED_OK = 'REVIEWED_OK',
  FLAGGED_ACTION_REQUIRED = 'FLAGGED_ACTION_REQUIRED',
}

export interface CreateProjectProgressReportDto {
  projectId: string;
  milestoneId?: string;
  reportingWeek: number;
  completionPercentage: number;
  healthStatus: ProjectHealthStatus;
  summary: string;
  blockers?: string;
  evidenceUrl?: string;
}

export interface ReviewProjectProgressReportDto {
  decision:
    | ProgressReportReviewStatus.REVIEWED_OK
    | ProgressReportReviewStatus.FLAGGED_ACTION_REQUIRED;
  reviewNote: string;
}

export interface ProjectProgressReportEntity {
  id: string;
  projectId: string;
  milestoneId: string | null;
  reportingWeek: number;
  completionPercentage: number;
  healthStatus: ProjectHealthStatus;
  summary: string;
  blockers: string | null;
  evidenceUrl: string | null;
  submittedBy: string;
  submittedRole: UserRole;
  reviewStatus: ProgressReportReviewStatus;
  reviewedBy: string | null;
  reviewNote: string | null;
  reviewedAt: string | null;
  createdAt: string;
}

export interface ProjectSettlementCertificateDto {
  certificateCode: string;
  projectId: string;
  projectCode: string;
  projectTitle: string;
  projectStatus: ProjectStatus;
  companyName: string;
  financialTotals: {
    totalEscrowDepositedVnd: number;
    totalDisbursedVnd: number;
    totalRefundedVnd: number;
    escrowRemainingBalanceVnd: number;
    currency: 'VND';
  };
  revenueSplitSummary: {
    teamLeader70Vnd: number;
    mentor20Vnd: number;
    labFund10Vnd: number;
    remainderAbsorbedByLabVnd: number;
    splitInvariantHold: boolean;
  };
  progressOverview: {
    totalReports: number;
    latestCompletionPercentage: number;
    latestHealthStatus: ProjectHealthStatus | 'NO_REPORT';
    flaggedReportsCount: number;
  };
  isFullySettled: boolean;
  generatedAt: string;
}