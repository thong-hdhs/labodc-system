import { ConflictException, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  ApplicationEntity,
  ApplicationStateHistoryEntity,
  ApplicationStatus,
} from './application.types';

@Injectable()
export class ApplicationRepository {
  private readonly applications = new Map<string, ApplicationEntity>();
  private readonly history = new Map<string, ApplicationStateHistoryEntity[]>();

  create(projectId: string, applicantUserId: string): ApplicationEntity {
    if (this.findActive(projectId, applicantUserId)) {
      throw new ConflictException({
        code: 'ACTIVE_APPLICATION_EXISTS',
        message: 'Bạn đã có đơn đang xử lý cho dự án này.',
      });
    }

    const now = new Date().toISOString();
    const application: ApplicationEntity = {
      id: randomUUID(),
      projectId,
      applicantUserId,
      status: ApplicationStatus.SUBMITTED,
      createdAt: now,
      updatedAt: now,
      withdrawnAt: null,
    };
    this.applications.set(application.id, application);
    this.appendHistory(application, applicantUserId, null, ApplicationStatus.SUBMITTED, null);
    return application;
  }

  findActive(projectId: string, applicantUserId: string): ApplicationEntity | null {
    for (const application of this.applications.values()) {
      if (
        application.projectId === projectId &&
        application.applicantUserId === applicantUserId &&
        ![
          ApplicationStatus.ACCEPTED,
          ApplicationStatus.REJECTED,
          ApplicationStatus.WITHDRAWN,
        ].includes(application.status)
      ) {
        return application;
      }
    }
    return null;
  }

  findById(id: string): ApplicationEntity | null {
    return this.applications.get(id) ?? null;
  }

  findByApplicant(applicantUserId: string): ApplicationEntity[] {
    return [...this.applications.values()]
      .filter((application) => application.applicantUserId === applicantUserId)
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  }

  withdraw(application: ApplicationEntity, actorUserId: string): ApplicationEntity {
    if (application.applicantUserId !== actorUserId) {
      throw new ConflictException({
        code: 'APPLICATION_OWNER_MISMATCH',
        message: 'Chỉ chủ đơn mới được rút đơn ứng tuyển.',
      });
    }
    if (
      application.status === ApplicationStatus.ACCEPTED ||
      application.status === ApplicationStatus.REJECTED ||
      application.status === ApplicationStatus.WITHDRAWN
    ) {
      throw new ConflictException({
        code: 'APPLICATION_NOT_WITHDRAWABLE',
        message: `Không thể rút đơn ở trạng thái ${application.status}.`,
      });
    }

    const now = new Date().toISOString();
    const updated: ApplicationEntity = {
      ...application,
      status: ApplicationStatus.WITHDRAWN,
      withdrawnAt: now,
      updatedAt: now,
    };
    this.applications.set(updated.id, updated);
    this.appendHistory(
      updated,
      actorUserId,
      application.status,
      ApplicationStatus.WITHDRAWN,
      'Applicant withdrew before acceptance.',
    );
    return updated;
  }

  getHistory(applicationId: string): ApplicationStateHistoryEntity[] {
    return [...(this.history.get(applicationId) ?? [])];
  }

  clearAll(): void {
    this.applications.clear();
    this.history.clear();
  }

  private appendHistory(
    application: ApplicationEntity,
    actorUserId: string,
    fromStatus: ApplicationStatus | null,
    toStatus: ApplicationStatus,
    reason: string | null,
  ): void {
    const events = this.history.get(application.id) ?? [];
    events.push({
      id: randomUUID(),
      applicationId: application.id,
      actorUserId,
      fromStatus,
      toStatus,
      reason,
      createdAt: application.updatedAt,
    });
    this.history.set(application.id, events);
  }
}
