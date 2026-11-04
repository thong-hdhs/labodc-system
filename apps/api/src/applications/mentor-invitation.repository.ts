import { ConflictException, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  MentorInvitationEntity,
  MentorInvitationStatus,
} from './application.types';

@Injectable()
export class MentorInvitationRepository {
  private readonly invitationsById = new Map<string, MentorInvitationEntity>();

  create(
    projectId: string,
    mentorUserId: string,
    invitedBy: string,
  ): MentorInvitationEntity {
    if (this.findPendingByProject(projectId)) {
      throw new ConflictException({
        code: 'PENDING_MENTOR_INVITATION_EXISTS',
        message: 'Dự án đang có một lời mời Mentor chờ phản hồi.',
      });
    }

    const invitation: MentorInvitationEntity = {
      id: randomUUID(),
      projectId,
      mentorUserId,
      invitedBy,
      status: MentorInvitationStatus.PENDING,
      createdAt: new Date().toISOString(),
      respondedAt: null,
    };
    this.invitationsById.set(invitation.id, invitation);
    return invitation;
  }

  findById(id: string): MentorInvitationEntity | null {
    return this.invitationsById.get(id) ?? null;
  }

  findByMentor(mentorUserId: string): MentorInvitationEntity[] {
    return [...this.invitationsById.values()]
      .filter((invitation) => invitation.mentorUserId === mentorUserId)
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  }

  findPendingByProject(projectId: string): MentorInvitationEntity | null {
    return (
      [...this.invitationsById.values()].find(
        (invitation) =>
          invitation.projectId === projectId &&
          invitation.status === MentorInvitationStatus.PENDING,
      ) ?? null
    );
  }

  respond(
    invitation: MentorInvitationEntity,
    status: MentorInvitationStatus.ACCEPTED | MentorInvitationStatus.DECLINED,
  ): MentorInvitationEntity {
    if (invitation.status !== MentorInvitationStatus.PENDING) {
      throw new ConflictException({
        code: 'MENTOR_INVITATION_ALREADY_RESPONDED',
        message: 'Lời mời này đã được phản hồi.',
      });
    }

    const updated: MentorInvitationEntity = {
      ...invitation,
      status,
      respondedAt: new Date().toISOString(),
    };
    this.invitationsById.set(invitation.id, updated);
    return updated;
  }

  clearAll(): void {
    this.invitationsById.clear();
  }
}
