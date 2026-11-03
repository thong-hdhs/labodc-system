import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { JwtPayload, UserRole } from '@labodc/shared-types';
import { ProjectsService } from '../projects/projects.service';
import { ApplicationRepository } from './application.repository';
import {
  ApplicationEntity,
  ApplicationWithProject,
  TERMINAL_APPLICATION_STATUSES,
} from './application.types';

@Injectable()
export class ApplicationsService {
  constructor(
    private readonly applications: ApplicationRepository,
    private readonly projects: ProjectsService,
  ) {}

  submit(user: JwtPayload, projectId: string): ApplicationEntity {
    this.assertTalent(user);

    const eligibility = this.projects.checkRecruitmentEligibility(projectId);
    if (!eligibility.isOpenForApplications) {
      throw new ConflictException({
        code: 'PROJECT_NOT_ACCEPTING_APPLICATIONS',
        message: eligibility.reason,
      });
    }

    return this.applications.create(projectId, user.sub);
  }

  listMine(user: JwtPayload): ApplicationWithProject[] {
    this.assertTalent(user);
    return this.applications.findByApplicant(user.sub).map((application) => {
      return {
        ...application,
        project: this.projects.getApplicationProjectSummary(
          application.projectId,
        ),
        stateHistory: this.applications.getHistory(application.id),
      };
    });
  }

  withdraw(user: JwtPayload, applicationId: string): ApplicationEntity {
    this.assertTalent(user);
    const application = this.applications.findById(applicationId);
    if (!application) {
      throw new NotFoundException('Không tìm thấy đơn ứng tuyển.');
    }
    if (application.applicantUserId !== user.sub) {
      throw new ForbiddenException('Bạn không có quyền rút đơn ứng tuyển này.');
    }
    if (TERMINAL_APPLICATION_STATUSES.has(application.status)) {
      throw new ConflictException({
        code: 'APPLICATION_NOT_WITHDRAWABLE',
        message: `Không thể rút đơn ở trạng thái ${application.status}.`,
      });
    }
    return this.applications.withdraw(application, user.sub);
  }

  private assertTalent(user: JwtPayload): void {
    if (
      user.role !== UserRole.TALENT &&
      user.role !== UserRole.TALENT_LEADER
    ) {
      throw new ForbiddenException('Chỉ Talent mới được thao tác đơn ứng tuyển.');
    }
  }
}
