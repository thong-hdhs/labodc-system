import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  MentorAssignmentHistoryEntity,
  MentorProjectAssignment,
} from './application.types';

@Injectable()
export class MentorAssignmentRepository {
  private readonly currentByProject = new Map<string, MentorProjectAssignment>();
  private readonly historyByProject = new Map<
    string,
    MentorAssignmentHistoryEntity[]
  >();

  assign(
    projectId: string,
    mentorUserId: string,
    assignedBy: string,
  ): MentorProjectAssignment {
    const existing = this.currentByProject.get(projectId);
    if (existing?.mentorUserId === mentorUserId) return existing;

    const assignment: MentorProjectAssignment = {
      projectId,
      mentorUserId,
      assignedBy,
      assignedAt: new Date().toISOString(),
    };
    const history = this.historyByProject.get(projectId) ?? [];
    history.push({ ...assignment, id: randomUUID(), action: 'ASSIGNED' });
    this.historyByProject.set(projectId, history);
    this.currentByProject.set(projectId, assignment);
    return assignment;
  }

  unassign(projectId: string, unassignedBy: string): void {
    const existing = this.currentByProject.get(projectId);
    if (!existing) return;

    const history = this.historyByProject.get(projectId) ?? [];
    history.push({
      ...existing,
      id: randomUUID(),
      action: 'UNASSIGNED',
      assignedBy: unassignedBy,
      assignedAt: new Date().toISOString(),
    });
    this.historyByProject.set(projectId, history);
    this.currentByProject.delete(projectId);
  }

  findByProject(projectId: string): MentorProjectAssignment | null {
    return this.currentByProject.get(projectId) ?? null;
  }

  findByMentor(mentorUserId: string): MentorProjectAssignment[] {
    return [...this.currentByProject.values()].filter(
      (assignment) => assignment.mentorUserId === mentorUserId,
    );
  }

  getHistory(projectId: string): MentorAssignmentHistoryEntity[] {
    return [...(this.historyByProject.get(projectId) ?? [])];
  }

  clearAll(): void {
    this.currentByProject.clear();
    this.historyByProject.clear();
  }
}
