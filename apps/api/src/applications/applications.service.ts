import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { JwtPayload, ProjectStatus, UserRole, UserStatus } from '@labodc/shared-types';
import { AuthService } from '../auth/auth.service';
import { ProjectsService } from '../projects/projects.service';
import { TalentService } from '../talent/talent.service';
import { ApplicationRepository } from './application.repository';
import { MentorAssignmentRepository } from './mentor-assignment.repository';
import { MentorInvitationRepository } from './mentor-invitation.repository';
import {
  ApplicationEntity,
  ApplicationStatus,
  ApplicationWithProject,
  DecideApplicationDto,
  InterviewOutcome,
  MentorAssignmentHistoryEntity,
  MentorInvitationEntity,
  MentorInvitationStatus,
  MentorInvitationWithProject,
  MentorApplication,
  MentorProjectAssignment,
  InviteMentorDto,
  RecordInterviewResultDto,
  TERMINAL_APPLICATION_STATUSES,
} from './application.types';

@Injectable()
export class ApplicationsService {
  constructor(
    private readonly applications: ApplicationRepository,
    private readonly projects: ProjectsService,
    private readonly auth: AuthService,
    private readonly mentorAssignments: MentorAssignmentRepository,
    private readonly mentorInvitations: MentorInvitationRepository,
    private readonly talent: TalentService,
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
        requiresInterview: this.projects.getProjectInterviewRequirement(
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

  inviteMentor(
    actor: JwtPayload,
    projectId: string,
    input: InviteMentorDto,
  ): {
    invitation: MentorInvitationEntity;
    currentAssignment: MentorProjectAssignment | null;
    history: MentorAssignmentHistoryEntity[];
  } {
    this.assertLabAdmin(actor);
    this.assertProjectAllowsMentorAssignment(projectId);
    if (!input || typeof input.mentorUserId !== 'string') {
      throw new BadRequestException('mentorUserId là bắt buộc.');
    }

    const mentor = this.auth.findUserById(input.mentorUserId);
    if (
      !mentor ||
      mentor.role !== UserRole.MENTOR ||
      mentor.status !== UserStatus.ACTIVE
    ) {
      throw new BadRequestException('Tài khoản được chọn không phải Mentor hợp lệ.');
    }

    const invitation = this.mentorInvitations.create(
      projectId,
      mentor.id,
      actor.sub,
    );
    this.mentorAssignments.unassign(projectId, actor.sub);
    return {
      invitation,
      currentAssignment: this.mentorAssignments.findByProject(projectId),
      history: this.mentorAssignments.getHistory(projectId),
    };
  }

  listMentorInvitations(user: JwtPayload): MentorInvitationWithProject[] {
    this.assertMentor(user);
    return this.mentorInvitations.findByMentor(user.sub).map((invitation) => {
      const project = this.projects.getApplicationProjectSummary(
        invitation.projectId,
      );
      return {
        ...invitation,
        project: { code: project.code, title: project.title },
      };
    });
  }

  respondToMentorInvitation(
    user: JwtPayload,
    invitationId: string,
    accept: boolean,
  ): MentorInvitationWithProject {
    this.assertMentor(user);
    const invitation = this.mentorInvitations.findById(invitationId);
    if (!invitation || invitation.mentorUserId !== user.sub) {
      throw new NotFoundException('Không tìm thấy lời mời Mentor.');
    }
    if (invitation.status !== MentorInvitationStatus.PENDING) {
      throw new ConflictException({
        code: 'MENTOR_INVITATION_ALREADY_RESPONDED',
        message: 'Lời mời này đã được phản hồi.',
      });
    }

    const mentor = this.auth.findUserById(user.sub);
    if (
      !mentor ||
      mentor.role !== UserRole.MENTOR ||
      mentor.status !== UserStatus.ACTIVE
    ) {
      throw new ForbiddenException(
        'Chỉ Mentor đang hoạt động mới được phản hồi lời mời.',
      );
    }

    if (accept) {
      this.assertProjectAllowsMentorAssignment(invitation.projectId);
      this.mentorAssignments.assign(
        invitation.projectId,
        user.sub,
        invitation.invitedBy,
      );
    }
    const status = accept
      ? MentorInvitationStatus.ACCEPTED
      : MentorInvitationStatus.DECLINED;
    const updated = this.mentorInvitations.respond(invitation, status);
    const project = this.projects.getApplicationProjectSummary(
      invitation.projectId,
    );
    return {
      ...updated,
      project: { code: project.code, title: project.title },
    };
  }

  async listAssignedApplications(
    user: JwtPayload,
  ): Promise<MentorApplication[]> {
    this.assertMentor(user);
    const assignedApplications = this.mentorAssignments
      .findByMentor(user.sub)
      .flatMap((assignment) =>
        this.applications.findByProject(assignment.projectId),
      );
    return Promise.all(
      assignedApplications.map((application) =>
        this.toMentorApplication(application),
      ),
    );
  }

  async startReview(
    user: JwtPayload,
    applicationId: string,
  ): Promise<MentorApplication> {
    const application = this.getAssignedApplication(user, applicationId);
    if (application.status !== ApplicationStatus.SUBMITTED) {
      throw this.invalidMentorTransition(
        application.status,
        ApplicationStatus.UNDER_REVIEW,
      );
    }

    this.applications.appendReviewEvent(
      application.id,
      user.sub,
      'REVIEW_STARTED',
      null,
      null,
    );
    const updated = this.applications.transition(
      application,
      user.sub,
      ApplicationStatus.UNDER_REVIEW,
    );
    return this.toMentorApplication(updated);
  }

  async recordInterviewResult(
    user: JwtPayload,
    applicationId: string,
    input: RecordInterviewResultDto,
  ): Promise<MentorApplication> {
    const application = this.getAssignedApplication(user, applicationId);
    if (
      this.projects.getProjectInterviewRequirement(application.projectId) !==
      true
    ) {
      throw new ConflictException({
        code: 'INTERVIEW_NOT_REQUIRED',
        message: 'Dự án này không yêu cầu phỏng vấn ứng viên.',
      });
    }
    if (application.status !== ApplicationStatus.UNDER_REVIEW) {
      throw this.invalidMentorTransition(
        application.status,
        ApplicationStatus.INTERVIEW,
      );
    }
    if (
      !input ||
      !Object.values(InterviewOutcome).includes(input.outcome)
    ) {
      throw new BadRequestException('Kết quả phỏng vấn phải là PASS hoặc FAIL.');
    }

    const internalNote = this.normalizeInternalNote(input.internalNote);
    this.applications.appendReviewEvent(
      application.id,
      user.sub,
      'INTERVIEW_RESULT',
      input.outcome,
      internalNote,
    );
    const updated = this.applications.transition(
      application,
      user.sub,
      ApplicationStatus.INTERVIEW,
    );
    return this.toMentorApplication(updated);
  }

  async decide(
    user: JwtPayload,
    applicationId: string,
    input: DecideApplicationDto,
  ): Promise<MentorApplication> {
    const application = this.getAssignedApplication(user, applicationId);
    const requiresInterview = this.projects.getProjectInterviewRequirement(
      application.projectId,
    );
    const expectedStatus = requiresInterview
      ? ApplicationStatus.INTERVIEW
      : ApplicationStatus.UNDER_REVIEW;
    if (application.status !== expectedStatus) {
      throw this.invalidMentorTransition(application.status, input?.status);
    }
    if (
      !input ||
      (input.status !== ApplicationStatus.ACCEPTED &&
        input.status !== ApplicationStatus.REJECTED)
    ) {
      throw new BadRequestException(
        'Quyết định phải là ACCEPTED hoặc REJECTED.',
      );
    }

    this.applications.appendReviewEvent(
      application.id,
      user.sub,
      'APPLICATION_DECISION',
      null,
      this.normalizeInternalNote(input.internalNote),
    );
    const updated = this.applications.transition(
      application,
      user.sub,
      input.status,
    );
    return this.toMentorApplication(updated);
  }

  private assertTalent(user: JwtPayload): void {
    if (
      user.role !== UserRole.TALENT &&
      user.role !== UserRole.TALENT_LEADER
    ) {
      throw new ForbiddenException('Chỉ Talent mới được thao tác đơn ứng tuyển.');
    }
  }

  private assertMentor(user: JwtPayload): void {
    if (user.role !== UserRole.MENTOR) {
      throw new ForbiddenException('Chỉ Mentor mới được xét duyệt ứng viên.');
    }
  }

  private assertLabAdmin(user: JwtPayload): void {
    if (
      user.role !== UserRole.LAB_ADMIN &&
      user.role !== UserRole.SYSTEM_ADMIN
    ) {
      throw new ForbiddenException('Chỉ Lab Admin mới được gán Mentor.');
    }
  }

  private assertProjectAllowsMentorAssignment(projectId: string): void {
    const project = this.projects.getApplicationProjectSummary(projectId);
    if (
      project.status !== ProjectStatus.PUBLISHED &&
      project.status !== ProjectStatus.RECRUITMENT_CLOSED &&
      project.status !== ProjectStatus.IN_PROGRESS
    ) {
      throw new ConflictException({
        code: 'PROJECT_NOT_READY_FOR_MENTOR_ASSIGNMENT',
        message: 'Chỉ có thể mời Mentor cho dự án đã công bố hoặc đang triển khai.',
      });
    }
  }

  private getAssignedApplication(
    user: JwtPayload,
    applicationId: string,
  ): ApplicationEntity {
    this.assertMentor(user);
    const application = this.applications.findById(applicationId);
    if (!application) {
      throw new NotFoundException('Không tìm thấy đơn ứng tuyển.');
    }
    const assignment = this.mentorAssignments.findByProject(
      application.projectId,
    );
    if (!assignment || assignment.mentorUserId !== user.sub) {
      throw new ForbiddenException(
        'Bạn không được gán làm Mentor phụ trách dự án của đơn này.',
      );
    }
    return application;
  }

  private async toMentorApplication(
    application: ApplicationEntity,
  ): Promise<MentorApplication> {
    const candidate = this.auth.findUserById(application.applicantUserId);
    if (!candidate) {
      throw new NotFoundException('Không tìm thấy tài khoản ứng viên.');
    }
    return {
      ...application,
      project: this.projects.getApplicationProjectSummary(
        application.projectId,
      ),
      requiresInterview: this.projects.getProjectInterviewRequirement(
        application.projectId,
      ),
      stateHistory: this.applications.getHistory(application.id),
      candidate: {
        userId: candidate.id,
        fullName: candidate.fullName,
        email: candidate.email,
        profile: await this.talent.getProfileForMentor(candidate.id),
      },
      reviewEvents: this.applications.getReviewEvents(application.id),
    };
  }

  private invalidMentorTransition(
    fromStatus: ApplicationStatus,
    toStatus: ApplicationStatus | undefined,
  ): ConflictException {
    return new ConflictException({
      code: 'INVALID_APPLICATION_TRANSITION',
      message: `Không thể chuyển application từ ${fromStatus} sang ${toStatus ?? 'trạng thái yêu cầu'}.`,
    });
  }

  private normalizeInternalNote(note?: string): string | null {
    if (note === undefined) return null;
    if (typeof note !== 'string') {
      throw new BadRequestException('Ghi chú nội bộ phải là chuỗi ký tự.');
    }
    if (note.trim() === '') return null;
    if (note.trim().length > 2000) {
      throw new BadRequestException(
        'Ghi chú nội bộ không được vượt quá 2000 ký tự.',
      );
    }
    return note.trim();
  }
}
