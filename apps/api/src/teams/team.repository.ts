import { ConflictException, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  TeamAuditEvent,
  TeamEntity,
  TeamMemberEntity,
} from './team.types';

@Injectable()
export class TeamRepository {
  private readonly teams = new Map<string, TeamEntity>();
  private readonly history = new Map<string, TeamAuditEvent[]>();

  create(projectId: string, createdBy: string, members: TeamMemberEntity[]): TeamEntity {
    if (this.findByProject(projectId)) {
      throw new ConflictException({
        code: 'PROJECT_TEAM_ALREADY_EXISTS',
        message: 'Dự án đã có Team.',
      });
    }

    const now = new Date().toISOString();
    const team: TeamEntity = {
      id: randomUUID(),
      projectId,
      status: 'FORMING',
      createdBy,
      createdAt: now,
      updatedAt: now,
      members: [...members],
    };
    this.teams.set(team.id, team);
    this.appendEvent(team, createdBy, 'TEAM_CREATED', null, null);
    for (const member of members) {
      this.appendEvent(team, createdBy, 'MEMBER_ADDED', member.userId, null);
    }
    return team;
  }

  findById(teamId: string): TeamEntity | null {
    return this.teams.get(teamId) ?? null;
  }

  findByProject(projectId: string): TeamEntity | null {
    return (
      [...this.teams.values()].find((team) => team.projectId === projectId) ?? null
    );
  }

  findByMember(userId: string): TeamEntity | null {
    return (
      [...this.teams.values()].find((team) =>
        team.members.some((member) => member.userId === userId),
      ) ?? null
    );
  }

  addMember(team: TeamEntity, member: TeamMemberEntity, actorUserId: string): TeamEntity {
    if (team.members.some((existing) => existing.userId === member.userId)) {
      throw new ConflictException({
        code: 'TEAM_MEMBER_ALREADY_EXISTS',
        message: 'Thành viên đã thuộc Team này.',
      });
    }
    const updated = {
      ...team,
      updatedAt: new Date().toISOString(),
      members: [...team.members, member],
    };
    this.teams.set(team.id, updated);
    this.appendEvent(updated, actorUserId, 'MEMBER_ADDED', member.userId, null);
    return updated;
  }

  removeMember(team: TeamEntity, userId: string, actorUserId: string): TeamEntity {
    const member = team.members.find((item) => item.userId === userId);
    if (!member) {
      throw new ConflictException({
        code: 'TEAM_MEMBER_NOT_FOUND',
        message: 'Thành viên không thuộc Team này.',
      });
    }
    const updated = {
      ...team,
      updatedAt: new Date().toISOString(),
      members: team.members.filter((item) => item.userId !== userId),
    };
    this.teams.set(team.id, updated);
    this.appendEvent(updated, actorUserId, 'MEMBER_REMOVED', userId, null);
    return updated;
  }

  appointLeader(team: TeamEntity, userId: string, actorUserId: string): TeamEntity {
    const selected = team.members.find((member) => member.userId === userId);
    if (!selected) {
      throw new ConflictException({
        code: 'TEAM_LEADER_MUST_BE_MEMBER',
        message: 'Leader phải là thành viên hiện tại của Team.',
      });
    }
    const previousLeader = team.members.find((member) => member.role === 'LEADER');
    const now = new Date().toISOString();
    const updated: TeamEntity = {
      ...team,
      status: 'ACTIVE',
      updatedAt: now,
      members: team.members.map((member) => ({
        ...member,
        role: member.userId === userId ? 'LEADER' : 'MEMBER',
      })),
    };
    this.teams.set(team.id, updated);
    this.appendEvent(
      updated,
      actorUserId,
      'LEADER_APPOINTED',
      userId,
      previousLeader?.userId ?? null,
    );
    return updated;
  }

  getHistory(teamId: string): TeamAuditEvent[] {
    return [...(this.history.get(teamId) ?? [])];
  }

  clearAll(): void {
    this.teams.clear();
    this.history.clear();
  }

  private appendEvent(
    team: TeamEntity,
    actorUserId: string,
    action: TeamAuditEvent['action'],
    subjectUserId: string | null,
    previousUserId: string | null,
  ): void {
    const events = this.history.get(team.id) ?? [];
    events.push({
      id: randomUUID(),
      teamId: team.id,
      actorUserId,
      action,
      subjectUserId,
      previousUserId,
      createdAt: new Date().toISOString(),
    });
    this.history.set(team.id, events);
  }
}
