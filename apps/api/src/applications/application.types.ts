import { TalentProfile } from '../talent/talent-profile.types';

export enum ApplicationStatus {
  SUBMITTED = 'SUBMITTED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  INTERVIEW = 'INTERVIEW',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  WITHDRAWN = 'WITHDRAWN',
}

export enum InterviewOutcome {
  PASS = 'PASS',
  FAIL = 'FAIL',
}

export type ApplicationReviewAction =
  | 'REVIEW_STARTED'
  | 'INTERVIEW_RESULT'
  | 'APPLICATION_DECISION';

export interface ApplicationEntity {
  id: string;
  projectId: string;
  applicantUserId: string;
  status: ApplicationStatus;
  createdAt: string;
  updatedAt: string;
  withdrawnAt: string | null;
}

export interface MentorProjectAssignment {
  projectId: string;
  mentorUserId: string;
  assignedBy: string;
  assignedAt: string;
}

export interface MentorAssignmentHistoryEntity extends MentorProjectAssignment {
  id: string;
}

export interface ApplicationReviewEvent {
  id: string;
  applicationId: string;
  actorUserId: string;
  action: ApplicationReviewAction;
  interviewOutcome: InterviewOutcome | null;
  internalNote: string | null;
  createdAt: string;
}

export interface AssignMentorDto {
  mentorUserId: string;
}

export interface RecordInterviewResultDto {
  outcome: InterviewOutcome;
  internalNote?: string;
}

export interface DecideApplicationDto {
  status: ApplicationStatus.ACCEPTED | ApplicationStatus.REJECTED;
  internalNote?: string;
}

export interface ApplicationStateHistoryEntity {
  id: string;
  applicationId: string;
  actorUserId: string;
  fromStatus: ApplicationStatus | null;
  toStatus: ApplicationStatus;
  reason: string | null;
  createdAt: string;
}

export interface ApplicationWithProject extends ApplicationEntity {
  requiresInterview: boolean;
  stateHistory: ApplicationStateHistoryEntity[];
  project: {
    id: string;
    code: string;
    title: string;
    companyName: string;
    status: string;
  } | null;
}

export interface MentorApplication extends ApplicationWithProject {
  candidate: {
    userId: string;
    fullName: string;
    email: string;
    profile: Pick<
      TalentProfile,
      | 'studentId'
      | 'faculty'
      | 'major'
      | 'cohort'
      | 'bio'
      | 'skills'
      | 'certifications'
      | 'portfolioItems'
    > | null;
  };
  reviewEvents: ApplicationReviewEvent[];
}

export const TERMINAL_APPLICATION_STATUSES = new Set<ApplicationStatus>([
  ApplicationStatus.ACCEPTED,
  ApplicationStatus.REJECTED,
  ApplicationStatus.WITHDRAWN,
]);
