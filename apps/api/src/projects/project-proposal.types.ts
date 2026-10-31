import {
  ProjectStatus,
  ProposalRejectionReasonCode,
  UserRole,
} from '@labodc/shared-types';

export interface ProjectAuditLogEntity {
  id: string;
  projectId: string;
  actorUserId: string;
  actorRole: UserRole;
  action: string;
  fromStatus: ProjectStatus | null;
  toStatus: ProjectStatus;
  reasonCode?: ProposalRejectionReasonCode | null;
  reasonNote?: string | null;
  createdAt: string;
}

export interface ProjectProposalEntity {
  id: string;
  code: string;
  enterpriseId: string | null;
  companyName: string;
  ownerUserId: string;
  title: string;
  summary: string;
  description: string;
  deliverables: string;
  requiredSkills: string[];
  minTeamSize: number;
  maxTeamSize: number;
  durationWeeks: number;
  budgetAmount: number;
  currency: 'VND';
  attachmentUrl?: string | null;
  status: ProjectStatus;
  reasonCode?: ProposalRejectionReasonCode | null;
  reviewNote?: string | null;
  registrationOpenAt?: string | null;
  registrationCloseAt?: string | null;
  submittedAt?: string | null;
  approvedBy?: string | null;
  approvedAt?: string | null;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectProposalDto {
  title: string;
  summary?: string;
  description?: string;
  deliverables?: string;
  requiredSkills?: string[];
  minTeamSize?: number;
  maxTeamSize?: number;
  durationWeeks?: number;
  budgetAmount?: number;
  attachmentUrl?: string;
}

export interface UpdateProjectProposalDto {
  title?: string;
  summary?: string;
  description?: string;
  deliverables?: string;
  requiredSkills?: string[];
  minTeamSize?: number;
  maxTeamSize?: number;
  durationWeeks?: number;
  budgetAmount?: number;
  attachmentUrl?: string;
}