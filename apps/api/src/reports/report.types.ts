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
