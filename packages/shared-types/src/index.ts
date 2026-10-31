export enum UserRole {
  SYSTEM_ADMIN = 'SYSTEM_ADMIN',
  LAB_ADMIN = 'LAB_ADMIN',
  ENTERPRISE = 'ENTERPRISE',
  MENTOR = 'MENTOR',
  TALENT_LEADER = 'TALENT_LEADER',
  TALENT = 'TALENT',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  LOCKED = 'LOCKED',
  PENDING = 'PENDING',
}

export enum ProjectStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  CHANGES_REQUESTED = 'CHANGES_REQUESTED',
  REJECTED = 'REJECTED',
  APPROVED = 'APPROVED',
  PUBLISHED = 'PUBLISHED',
  UNPUBLISHED = 'UNPUBLISHED',
  RECRUITMENT_CLOSED = 'RECRUITMENT_CLOSED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum ProposalRejectionReasonCode {
  MISSING_SCOPE = 'MISSING_SCOPE',
  BUDGET_MISMATCH = 'BUDGET_MISMATCH',
  TECH_STACK_UNSUPPORTED = 'TECH_STACK_UNSUPPORTED',
  UNVERIFIED_ENTERPRISE = 'UNVERIFIED_ENTERPRISE',
  OTHER = 'OTHER',
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  status: UserStatus;
}

export interface AuthUserDto {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  status: UserStatus;
}

export interface AuthTokensResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUserDto;
}

export interface PublicProjectSummaryDto {
  id: string;
  code: string;
  enterpriseId: string;
  companyName: string;
  title: string;
  summary: string;
  requiredSkills: string[];
  minTeamSize: number;
  maxTeamSize: number;
  durationWeeks: number;
  budgetAmount: number;
  status: ProjectStatus;
  registrationOpenAt?: string | null;
  registrationCloseAt?: string | null;
  publishedAt?: string | null;
}