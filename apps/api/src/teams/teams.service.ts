import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { JwtPayload, ProjectStatus } from '@labodc/shared-types';
import { AuthService } from '../auth/auth.service';
import { ApplicationRepository } from '../applications/application.repository';
import { ApplicationStatus } from '../applications/application.types';
import { MentorAssignmentRepository } from '../applications/mentor-assignment.repository';
import { ProjectProposalRepository } from '../projects/project-proposal.repository';
import {
  AddTeamMemberDto,
  AppointTeamLeaderDto,
  CreateTeamDto,
  TeamEntity,
  TeamMemberEntity,
} from './team.types';
import { TeamRepository } from './team.repository';

@Injectable()
export class TeamsService {
  constructor(
    private readonly teamRepository: TeamRepository,
    private readonly applicationRepository: ApplicationRepository,
    private readonly mentorAssignmentRepository: MentorAssignmentRepository,
    private readonly projectRepository: ProjectProposalRepository,
    private readonly authService: AuthService,
  ) {}

  listMentorProjects(user: JwtPayload) {
    return this.mentorAssignmentRepository.findByMentor(user.sub).map((assignment) => {
      const project = this.projectRepository.findById(assignment.projectId);
      if (!project) {
        throw new NotFoundException('Không tìm thấy dự án được phân công.');
      }
      const team = this.teamRepository.findByProject(project.id);
      const eligibleApplications = this.applicationRepository
        .findByProject(project.id)
        .filter(
          (application) =>
            application.status === ApplicationStatus.ACCEPTED &&
            !this.teamRepository.findByMember(application.applicantUserId),
        )
        .map((application) => ({
          applicationId: application.id,
          userId: application.applicantUserId,
          fullName: this.getUserFullName(application.applicantUserId),
        }));

      return {
        project: {
          id: project.id,
          code: project.code,
          title: project.title,
          minTeamSize: project.minTeamSize,
          maxTeamSize: project.maxTeamSize,
        },
        team: team ? this.presentTeam(team) : null,
        eligibleApplications,
      };
    });
  }

  createTeam(user: JwtPayload, projectId: string, input: CreateTeamDto) {
    const project = this.assertMentorProject(user, projectId);
    if (
      ![
        ProjectStatus.PUBLISHED,
        ProjectStatus.RECRUITMENT_CLOSED,
        ProjectStatus.IN_PROGRESS,
      ].includes(project.status)
    ) {
      throw new ConflictException({
        code: 'PROJECT_NOT_READY_FOR_TEAM',
        message: 'Chỉ có thể lập Team cho dự án đã công bố hoặc đang triển khai.',
      });
    }
    if (
      !input ||
      !Array.isArray(input.applicationIds) ||
      input.applicationIds.length === 0
    ) {
      throw new ConflictException({
        code: 'TEAM_MEMBERS_REQUIRED',
        message: 'Chọn các đơn ACCEPTED để tạo Team.',
      });
    }
    if (new Set(input.applicationIds).size !== input.applicationIds.length) {
      throw new ConflictException({
        code: 'DUPLICATE_APPLICATION',
        message: 'Không thể thêm trùng đơn ứng tuyển.',
      });
    }
    if (
      input.applicationIds.length < project.minTeamSize ||
      input.applicationIds.length > project.maxTeamSize
    ) {
      throw new ConflictException({
        code: 'TEAM_SIZE_OUT_OF_RANGE',
        message: `Quy mô Team phải từ ${project.minTeamSize} đến ${project.maxTeamSize} thành viên.`,
      });
    }

    const members = input.applicationIds.map((applicationId) =>
      this.createMemberFromAcceptedApplication(projectId, applicationId),
    );
    if (new Set(members.map((member) => member.userId)).size !== members.length) {
      throw new ConflictException({
        code: 'DUPLICATE_TEAM_MEMBER',
        message: 'Không thể thêm một thành viên nhiều lần vào cùng Team.',
      });
    }
    for (const member of members) {
      const existingTeam = this.teamRepository.findByMember(member.userId);
      if (existingTeam) {
        throw new ConflictException({
          code: 'MEMBER_ALREADY_IN_ACTIVE_TEAM',
          message: 'Một thành viên chỉ được thuộc một Team đang hoạt động.',
        });
      }
    }
    return this.presentTeam(
      this.teamRepository.create(projectId, user.sub, members),
    );
  }

  addMember(user: JwtPayload, teamId: string, input: AddTeamMemberDto) {
    const team = this.getMentorTeam(user, teamId);
    const project = this.projectRepository.findById(team.projectId);
    if (!project) throw new NotFoundException('Không tìm thấy dự án của Team.');
    if (team.status !== 'FORMING') {
      throw new ConflictException({
        code: 'TEAM_ALREADY_ACTIVE',
        message: 'Không thể thêm thành viên sau khi Team đã được kích hoạt.',
      });
    }
    if (!input || typeof input.applicationId !== 'string') {
      throw new ConflictException({
        code: 'INVALID_APPLICATION_ID',
        message: 'Cần cung cấp applicationId hợp lệ.',
      });
    }
    if (team.members.length >= project.maxTeamSize) {
      throw new ConflictException({
        code: 'TEAM_MAX_SIZE_REACHED',
        message: 'Team đã đạt quy mô tối đa của dự án.',
      });
    }
    const member = this.createMemberFromAcceptedApplication(
      team.projectId,
      input.applicationId,
    );
    if (this.teamRepository.findByMember(member.userId)) {
      throw new ConflictException({
        code: 'MEMBER_ALREADY_IN_ACTIVE_TEAM',
        message: 'Một thành viên chỉ được thuộc một Team đang hoạt động.',
      });
    }
    return this.presentTeam(this.teamRepository.addMember(team, member, user.sub));
  }

  removeMember(user: JwtPayload, teamId: string, memberUserId: string) {
    const team = this.getMentorTeam(user, teamId);
    const project = this.projectRepository.findById(team.projectId);
    if (!project) throw new NotFoundException('Không tìm thấy dự án của Team.');
    if (team.status !== 'FORMING') {
      throw new ConflictException({
        code: 'TEAM_ALREADY_ACTIVE',
        message: 'Không thể thay đổi thành viên sau khi Team đã được kích hoạt.',
      });
    }
    if (team.members.length - 1 < project.minTeamSize) {
      throw new ConflictException({
        code: 'TEAM_MIN_SIZE_REQUIRED',
        message: 'Không thể giảm Team dưới quy mô tối thiểu của dự án.',
      });
    }
    return this.presentTeam(
      this.teamRepository.removeMember(team, memberUserId, user.sub),
    );
  }

  appointLeader(user: JwtPayload, teamId: string, input: AppointTeamLeaderDto) {
    const team = this.getMentorTeam(user, teamId);
    if (!input || typeof input.userId !== 'string' || input.userId.length === 0) {
      throw new ConflictException({
        code: 'INVALID_TEAM_LEADER',
        message: 'Cần cung cấp userId của thành viên được bổ nhiệm.',
      });
    }
    return this.presentTeam(
      this.teamRepository.appointLeader(team, input.userId, user.sub),
    );
  }

  getMyTeam(user: JwtPayload) {
    const team = this.teamRepository.findByMember(user.sub);
    if (!team) throw new NotFoundException('Bạn chưa thuộc Team nào.');
    const project = this.projectRepository.findById(team.projectId);
    if (!project) throw new NotFoundException('Không tìm thấy dự án của Team.');
    return {
      ...this.presentTeam(team),
      project: {
        id: project.id,
        code: project.code,
        title: project.title,
      },
    };
  }

  getMentorTeamForProject(user: JwtPayload, projectId: string): TeamEntity {
    this.assertMentorProject(user, projectId);
    const team = this.teamRepository.findByProject(projectId);
    if (!team) throw new NotFoundException('Dự án chưa có Team.');
    return team;
  }

  findMentorTeamForProject(user: JwtPayload, projectId: string): TeamEntity | null {
    this.assertMentorProject(user, projectId);
    return this.teamRepository.findByProject(projectId);
  }

  getMentorTeam(user: JwtPayload, teamId: string): TeamEntity {
    const team = this.teamRepository.findById(teamId);
    if (!team) throw new NotFoundException('Không tìm thấy Team.');
    this.assertMentorProject(user, team.projectId);
    return team;
  }

  getMyTeamEntity(userId: string): TeamEntity {
    const team = this.teamRepository.findByMember(userId);
    if (!team) throw new NotFoundException('Bạn chưa thuộc Team nào.');
    return team;
  }

  getAssignedMentorUserId(projectId: string): string {
    const assignment = this.mentorAssignmentRepository.findByProject(projectId);
    if (!assignment) throw new NotFoundException('Dự án chưa được phân công Mentor.');
    if (!this.projectRepository.findById(projectId)) {
      throw new NotFoundException('Không tìm thấy dự án.');
    }
    return assignment.mentorUserId;
  }

  findTeamForMember(userId: string): TeamEntity | null {
    return this.teamRepository.findByMember(userId);
  }

  getTeamMemberRole(teamId: string, userId: string): 'MEMBER' | 'LEADER' | null {
    const team = this.teamRepository.findById(teamId);
    return team?.members.find((member) => member.userId === userId)?.role ?? null;
  }

  assertMentorProject(user: JwtPayload, projectId: string) {
    const assignment = this.mentorAssignmentRepository.findByProject(projectId);
    if (!assignment) throw new NotFoundException('Dự án chưa được phân công Mentor.');
    if (assignment.mentorUserId !== user.sub) {
      throw new ForbiddenException('Chỉ Mentor được phân công mới được quản lý Team.');
    }
    const project = this.projectRepository.findById(projectId);
    if (!project) throw new NotFoundException('Không tìm thấy dự án.');
    return project;
  }

  private createMemberFromAcceptedApplication(
    projectId: string,
    applicationId: string,
  ): TeamMemberEntity {
    const application = this.applicationRepository.findById(applicationId);
    if (
      !application ||
      application.projectId !== projectId ||
      application.status !== ApplicationStatus.ACCEPTED
    ) {
      throw new ConflictException({
        code: 'APPLICATION_NOT_ACCEPTED_FOR_PROJECT',
        message: 'Chỉ có thể thêm đơn ACCEPTED thuộc đúng dự án.',
      });
    }
    this.getUserFullName(application.applicantUserId);
    return {
      userId: application.applicantUserId,
      applicationId: application.id,
      role: 'MEMBER',
      joinedAt: new Date().toISOString(),
    };
  }

  private presentTeam(team: TeamEntity) {
    return {
      ...team,
      members: team.members.map((member) => ({
        ...member,
        fullName: this.getUserFullName(member.userId),
      })),
      leaderHistory: this.teamRepository
        .getHistory(team.id)
        .filter((event) => event.action === 'LEADER_APPOINTED'),
    };
  }

  private getUserFullName(userId: string): string {
    const user = this.authService.findUserById(userId);
    if (!user) throw new NotFoundException('Không tìm thấy tài khoản thành viên.');
    return user.fullName;
  }
}
