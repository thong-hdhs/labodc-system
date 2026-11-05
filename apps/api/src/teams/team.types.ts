export type TeamStatus = 'FORMING' | 'ACTIVE';
export type TeamMemberRole = 'MEMBER' | 'LEADER';

export interface TeamMemberEntity {
  userId: string;
  applicationId: string;
  role: TeamMemberRole;
  joinedAt: string;
}

export interface TeamEntity {
  id: string;
  projectId: string;
  status: TeamStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  members: TeamMemberEntity[];
}

export interface TeamAuditEvent {
  id: string;
  teamId: string;
  actorUserId: string;
  action: 'TEAM_CREATED' | 'MEMBER_ADDED' | 'MEMBER_REMOVED' | 'LEADER_APPOINTED';
  subjectUserId: string | null;
  previousUserId: string | null;
  createdAt: string;
}

export interface CreateTeamDto {
  applicationIds: string[];
}

export interface AddTeamMemberDto {
  applicationId: string;
}

export interface AppointTeamLeaderDto {
  userId: string;
}
