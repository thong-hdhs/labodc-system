import { ProjectStatus, UserRole } from '@labodc/shared-types';

export enum FinancialDisputeStatus {
  OPEN = 'OPEN',
  RESOLVED_RELEASE_TO_TEAM = 'RESOLVED_RELEASE_TO_TEAM',
  RESOLVED_REFUND_TO_ENTERPRISE = 'RESOLVED_REFUND_TO_ENTERPRISE',
  REJECTED = 'REJECTED',
}

export interface CreateFinancialDisputeDto {
  projectId: string;
  milestoneId: string;
  reason: string;
  evidenceUrl?: string;
}

export interface ResolveFinancialDisputeDto {
  decision:
    | FinancialDisputeStatus.RESOLVED_RELEASE_TO_TEAM
    | FinancialDisputeStatus.RESOLVED_REFUND_TO_ENTERPRISE
    | FinancialDisputeStatus.REJECTED;
  resolutionNote: string;
  markProjectCompleted?: boolean;
}

export interface FinancialDisputeTicketEntity {
  id: string;
  code: string;
  projectId: string;
  milestoneId: string;
  raisedByUserId: string;
  raisedByRole: UserRole;
  reason: string;
  evidenceUrl: string | null;
  status: FinancialDisputeStatus;
  resolutionNote: string | null;
  resolvedBy: string | null;
  resolvedAt: string | null;
  createdAt: string;
}

export interface CreateProjectClosureDossierDto {
  satisfactionScore: number;
  wouldSponsorAgain: boolean;
  feedbackSummary: string;
  finalDeliverableArchiveUrl?: string;
}

export interface ProjectClosureDossierEntity {
  id: string;
  dossierCode: string;
  projectId: string;
  projectCode: string;
  projectTitle: string;
  projectStatus: ProjectStatus;
  enterpriseUserId: string;
  companyName: string;
  satisfactionScore: number;
  wouldSponsorAgain: boolean;
  feedbackSummary: string;
  finalDeliverableArchiveUrl: string | null;
  totalEscrowDepositedVnd: number;
  totalDisbursed702010Vnd: number;
  totalRefundedVnd: number;
  signedOffBy: string;
  signedOffRole: UserRole;
  signedOffAt: string;
}

export interface LabFundTransparencyReportDto {
  reportCode: 'LAB_FUND_10_TRANSPARENCY_REPORT_D18';
  generatedAt: string;
  labFundSummary: {
    totalLabFund10CollectedVnd: number;
    totalRemainderAbsorbedVnd: number;
    totalTeam70DisbursedVnd: number;
    totalMentor20DisbursedVnd: number;
    totalGrossDisbursedVnd: number;
    currency: 'VND';
    invariantHold: boolean;
  };
  disputeGovernance: {
    totalDisputes: number;
    openDisputes: number;
    resolvedReleaseCount: number;
    resolvedRefundCount: number;
    rejectedCount: number;
  };
  closureGovernance: {
    totalClosedDossiers: number;
    averageSatisfactionScore: number;
    wouldSponsorAgainRatePercent: number;
  };
}