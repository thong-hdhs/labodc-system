import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { JwtPayload } from '@labodc/shared-types';
import { TeamEntity } from '../teams/team.types';
import { TeamsService } from '../teams/teams.service';
import {
  CreateMilestoneDto,
  CreateTaskDto,
} from './task.types';
import { TaskRepository } from './task.repository';

@Injectable()
export class TasksService {
  constructor(
    private readonly taskRepository: TaskRepository,
    private readonly teamsService: TeamsService,
  ) {}

  listTemplates(user: JwtPayload, projectId: string) {
    this.teamsService.assertMentorProject(user, projectId);
    return this.taskRepository.listTemplates();
  }

  listMentorTasks(user: JwtPayload, projectId: string) {
    const team = this.teamsService.findMentorTeamForProject(user, projectId);
    return team ? this.taskRepository.findByTeam(team.id) : [];
  }

  createTask(user: JwtPayload, projectId: string, input: CreateTaskDto) {
    const team = this.teamsService.getMentorTeamForProject(user, projectId);
    this.assertActiveTeam(team);
    if (!input || typeof input !== 'object') {
      throw new ConflictException({
        code: 'INVALID_TASK_INPUT',
        message: 'Thông tin công việc không hợp lệ.',
      });
    }
    this.validateText(input.title, 'Tiêu đề công việc');
    this.validateDescription(input.description);
    this.validateOptionalDate(input.dueAt);
    this.taskRepository.validateTemplate(
      input.templateId,
      input.templateVersion,
      'TASK',
    );
    return this.taskRepository.create(projectId, team.id, user.sub, input);
  }

  addMilestone(user: JwtPayload, taskId: string, input: CreateMilestoneDto) {
    const task = this.taskRepository.findById(taskId);
    if (!task) throw new NotFoundException('Không tìm thấy công việc.');
    const team = this.teamsService.getMentorTeam(user, task.teamId);
    this.assertActiveTeam(team);
    if (!input || typeof input !== 'object') {
      throw new ConflictException({
        code: 'INVALID_TASK_INPUT',
        message: 'Thông tin cột mốc không hợp lệ.',
      });
    }
    this.validateText(input.title, 'Tiêu đề cột mốc');
    this.validateDescription(input.description);
    this.validateOptionalDate(input.dueAt);
    this.taskRepository.validateTemplate(
      input.templateId,
      input.templateVersion,
      'MILESTONE',
    );
    return this.taskRepository.addMilestone(task, user.sub, input);
  }

  getMyTasks(user: JwtPayload) {
    const team = this.teamsService.getMyTeamEntity(user.sub);
    return this.taskRepository.findByTeam(team.id);
  }

  private assertActiveTeam(team: TeamEntity): void {
    if (team.status !== 'ACTIVE') {
      throw new ConflictException({
        code: 'TEAM_NOT_ACTIVE',
        message: 'Cần được Mentor bổ nhiệm Leader trước khi lập kế hoạch công việc.',
      });
    }
  }

  private validateText(value: string, label: string): void {
    if (
      typeof value !== 'string' ||
      value.trim().length === 0 ||
      value.length > 200
    ) {
      throw new ConflictException({
        code: 'INVALID_TASK_INPUT',
        message: `${label} không được để trống và tối đa 200 ký tự.`,
      });
    }
  }

  private validateOptionalDate(value?: string | null): void {
    if (
      value !== undefined &&
      value !== null &&
      (typeof value !== 'string' || Number.isNaN(Date.parse(value)))
    ) {
      throw new ConflictException({
        code: 'INVALID_DUE_DATE',
        message: 'Ngày đến hạn không hợp lệ.',
      });
    }
  }

  private validateDescription(value?: string): void {
    if (value !== undefined && (typeof value !== 'string' || value.length > 5000)) {
      throw new ConflictException({
        code: 'INVALID_TASK_INPUT',
        message: 'Mô tả phải là văn bản không quá 5000 ký tự.',
      });
    }
  }
}
