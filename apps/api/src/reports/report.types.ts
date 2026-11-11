export type ReportPeriodType = 'MONTH' | 'PHASE';
export type ReportStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'IN_REVIEW'
  | 'CHANGES_REQUESTED'
  | 'APPROVED';
export type EvaluationStatus = 'EVALUATION_DRAFT' | 'EVALUATION_FINAL';

export interface ReportContentInput {
  periodType: ReportPeriodType;
  periodStart: string;
  periodEnd: string;
  summary: string;
  progress: string;
  blockers: string;
  nextSteps: string;
  teamId?: string;
}

export interface ReportRevision {
  version: number;
  content: Omit<ReportContentInput, 'teamId'>;
  updatedBy: string;
  updatedAt: string;
}

export interface ProgressReport {
  id: string;
  projectId: string;
  teamId: string | null;
  authorUserId: string;
  authorRole: 'MENTOR' | 'TALENT_LEADER';
  periodType: ReportPeriodType;
  periodStart: string;
  periodEnd: string;
  summary: string;
  progress: string;
  blockers: string;
  nextSteps: string;
  status: ReportStatus;
  version: number;
  reviewerUserId: string | null;
  reviewNote: string | null;
  createdAt: string;
  updatedAt: string;
  revisions: ReportRevision[];
}

export interface ReportStateEvent {
  id: string;
  reportId: string;
  actorUserId: string;
  action:
    | 'CREATED'
    | 'UPDATED'
    | 'SUBMITTED'
    | 'REVIEW_STARTED'
    | 'CHANGES_REQUESTED'
    | 'RESUBMITTED'
    | 'APPROVED';
  fromStatus: ReportStatus | null;
  toStatus: ReportStatus;
  note: string | null;
  createdAt: string;
}

export interface EvaluationCriterion {
  criterion: string;
  feedback: string;
}

export interface TalentEvaluation {
  id: string;
  projectId: string;
  teamId: string;
  subjectUserId: string;
  mentorUserId: string;
  periodStart: string;
  periodEnd: string;
  criteria: EvaluationCriterion[];
  overallFeedback: string;
  status: EvaluationStatus;
  createdAt: string;
  finalizedAt: string | null;
  candidateAcknowledgedAt: string | null;
  candidateFeedback: string | null;
  candidateFeedbackAt: string | null;
  events: EvaluationEvent[];
}

export interface EvaluationEvent {
  id: string;
  actorUserId: string;
  action:
    | 'FINALIZED'
    | 'CANDIDATE_ACKNOWLEDGED'
    | 'CANDIDATE_FEEDBACK_SUBMITTED';
  createdAt: string;
}

export interface ContributionRecord {
  id: string;
  projectId: string;
  teamId: string;
  userId: string;
  recordedBy: string;
  periodStart: string;
  periodEnd: string;
  description: string;
  createdAt: string;
}

export interface CreateEvaluationInput {
  subjectUserId: string;
  periodStart: string;
  periodEnd: string;
  criteria: EvaluationCriterion[];
  overallFeedback: string;
}

export interface CreateContributionInput {
  userId: string;
  periodStart: string;
  periodEnd: string;
  description: string;
}

export type AllocationProposalStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'CHANGES_REQUESTED';

export interface TeamAllocation {
  userId: string;
  shareBps: number;
}

export interface TeamAllocationProposalInput {
  periodStart: string;
  periodEnd: string;
  allocations: TeamAllocation[];
  rationale: string;
}

export interface TeamAllocationProposalEvent {
  id: string;
  actorUserId: string;
  action: 'CREATED' | 'UPDATED' | 'APPROVED' | 'CHANGES_REQUESTED';
  fromStatus: AllocationProposalStatus | null;
  toStatus: AllocationProposalStatus;
  note: string | null;
  createdAt: string;
}

export interface TeamAllocationProposal {
  id: string;
  projectId: string;
  teamId: string;
  proposerUserId: string;
  reviewerUserId: string;
  teamUpdatedAt: string;
  periodStart: string;
  periodEnd: string;
  allocations: TeamAllocation[];
  memberUserIds: string[];
  rationale: string;
  status: AllocationProposalStatus;
  reviewNote: string | null;
  createdAt: string;
  updatedAt: string;
  events: TeamAllocationProposalEvent[];
}

export interface MemberPerformanceSummary {
  userId: string;
  contributionCount: number;
  contributions: Array<{
    periodStart: string;
    periodEnd: string;
    description: string;
  }>;
  finalizedEvaluationCount: number;
}

export interface TeamPerformanceSummary {
  teamId: string;
  periodStart: string;
  periodEnd: string;
  totals: {
    contributionCount: number;
    finalizedEvaluationCount: number;
  };
  members: MemberPerformanceSummary[];
}
