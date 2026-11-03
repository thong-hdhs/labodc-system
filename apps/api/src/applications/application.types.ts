export enum ApplicationStatus {
  SUBMITTED = 'SUBMITTED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  INTERVIEW = 'INTERVIEW',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  WITHDRAWN = 'WITHDRAWN',
}

export interface ApplicationEntity {
  id: string;
  projectId: string;
  applicantUserId: string;
  status: ApplicationStatus;
  createdAt: string;
  updatedAt: string;
  withdrawnAt: string | null;
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
  stateHistory: ApplicationStateHistoryEntity[];
  project: {
    id: string;
    code: string;
    title: string;
    companyName: string;
    status: string;
  } | null;
}

export const TERMINAL_APPLICATION_STATUSES = new Set<ApplicationStatus>([
  ApplicationStatus.ACCEPTED,
  ApplicationStatus.REJECTED,
  ApplicationStatus.WITHDRAWN,
]);
