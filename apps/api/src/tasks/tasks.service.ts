import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { JwtPayload, UserRole } from '@labodc/shared-types';
import { TeamEntity } from '../teams/team.types';
import { TeamsService } from '../teams/teams.service';
import {
  AssignTaskDto,
  CreateMilestoneDto,
  CreateTaskDto,
  ReviewTaskDto,
  SubmitMilestoneDto,
  SubmitTaskDto,
  TaskEntity,
  TaskStatus,
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
    return team ? this.taskRepository.findByTeam(team.id).map((task) => this.presentTask(task)) : [];
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
    return this.taskRepository.findByTeam(team.id).map((task) => this.presentTask(task));
  }

  assertCanAccessTaskFiles(
    user: JwtPayload,
    taskId: string,
    action: 'READ' | 'UPLOAD',
  ): TaskEntity {
    const task = this.getTask(taskId);
    if (user.role === UserRole.LAB_ADMIN) return task;
    if (user.role === UserRole.MENTOR) {
      this.teamsService.assertMentorProject(user, task.projectId);
      return task;
    }

    const team = this.teamsService.getMyTeamEntity(user.sub);
    if (team.id !== task.teamId) {
      throw new ForbiddenException('Bạn không có quyền truy cập tệp của Team khác.');
    }
    if (action === 'UPLOAD') {
      if (
        task.assignmentType === 'INDIVIDUAL' &&
        task.assignedUserId !== user.sub
      ) {
        throw new ForbiddenException('Chỉ assignee cá nhân mới được tải tệp lên Task này.');
      }
      if (!task.assignmentType) {
        throw new ForbiddenException('Task chưa được giao; không thể tải tệp lên.');
      }
    }
    return task;
  }

  assignTask(
    user: JwtPayload,
    taskId: string,
    input: AssignTaskDto,
    requireLeader: boolean,
  ) {
    const task = this.getTask(taskId);
    const team = this.getTaskTeamForActor(user, task);
    if (requireLeader) this.assertTeamLeader(user, team.id);
    else this.teamsService.getMentorTeam(user, team.id);
    this.assertStatus(task.status, ['PLANNED'], 'Chỉ có thể giao công việc ở trạng thái PLANNED.');
    this.validateAssignmentInput(input);
    if (input.assignmentType === 'INDIVIDUAL') {
      this.assertTeamMember(team.id, input.userId!);
    }
    return this.presentTask(
      this.taskRepository.assignTask(taskId, input, user.sub),
    );
  }

  assignMilestone(
    user: JwtPayload,
    taskId: string,
    milestoneId: string,
    input: AssignTaskDto,
    requireLeader: boolean,
  ) {
    const task = this.getTask(taskId);
    const team = this.getTaskTeamForActor(user, task);
    if (requireLeader) this.assertTeamLeader(user, team.id);
    else this.teamsService.getMentorTeam(user, team.id);
    const milestone = this.getMilestone(task, milestoneId);
    this.assertStatus(
      milestone.status,
      ['PLANNED'],
      'Chỉ có thể giao cột mốc ở trạng thái PLANNED.',
    );
    this.validateAssignmentInput(input);
    if (input.assignmentType === 'INDIVIDUAL') {
      this.assertTeamMember(team.id, input.userId!);
    }
    return this.presentTask(
      this.taskRepository.assignMilestone(
        taskId,
        milestoneId,
        input,
        user.sub,
      ),
    );
  }

  startTask(user: JwtPayload, taskId: string) {
    const task = this.getTask(taskId);
    this.assertAssignedMember(
      user,
      task.teamId,
      task.assignmentType,
      task.assignedUserId,
    );
    this.assertStatus(
      task.status,
      ['ASSIGNED', 'CHANGES_REQUESTED'],
      'Chỉ công việc đã giao hoặc yêu cầu chỉnh sửa mới có thể bắt đầu.',
    );
    return this.presentTask(this.taskRepository.startTask(taskId, user.sub));
  }

  submitTask(user: JwtPayload, taskId: string, input: SubmitTaskDto) {
    const task = this.getTask(taskId);
    this.assertAssignedMember(
      user,
      task.teamId,
      task.assignmentType,
      task.assignedUserId,
    );
    this.assertStatus(task.status, ['IN_PROGRESS'], 'Công việc phải ở IN_PROGRESS mới được nộp.');
    this.validateSubmission(input, task.templateVersion);
    return this.presentTask(
      this.taskRepository.submitTask(taskId, user.sub, input.content.trim()),
    );
  }

  reviewTask(user: JwtPayload, taskId: string, input: ReviewTaskDto) {
    const task = this.getTask(taskId);
    this.teamsService.getMentorTeam(user, task.teamId);
    this.validateReviewInput(input);
    if (input.decision === 'CANCEL') {
      this.assertStatus(
        task.status,
        ['PLANNED', 'ASSIGNED', 'IN_PROGRESS'],
        'Chỉ công việc chưa nộp để duyệt mới có thể bị hủy.',
      );
    } else {
      this.assertStatus(
        task.status,
        ['SUBMITTED_FOR_REVIEW'],
        'Chỉ có thể duyệt đầu ra đang chờ Mentor xem xét.',
      );
    }
    return this.presentTask(
      this.taskRepository.reviewTask(
        taskId,
        user.sub,
        input.decision,
        input.note?.trim() || null,
      ),
    );
  }

  startMilestone(user: JwtPayload, taskId: string, milestoneId: string) {
    const task = this.getTask(taskId);
    const milestone = this.getMilestone(task, milestoneId);
    this.assertAssignedMember(
      user,
      task.teamId,
      milestone.assignmentType,
      milestone.assignedUserId,
    );
    this.assertStatus(
      milestone.status,
      ['ASSIGNED', 'CHANGES_REQUESTED'],
      'Chỉ cột mốc đã giao hoặc yêu cầu chỉnh sửa mới có thể bắt đầu.',
    );
    return this.presentTask(
      this.taskRepository.startMilestone(taskId, milestoneId, user.sub),
    );
  }

  submitMilestone(
    user: JwtPayload,
    taskId: string,
    milestoneId: string,
    input: SubmitMilestoneDto,
  ) {
    const task = this.getTask(taskId);
    const milestone = this.getMilestone(task, milestoneId);
    this.assertAssignedMember(
      user,
      task.teamId,
      milestone.assignmentType,
      milestone.assignedUserId,
    );
    this.assertStatus(
      milestone.status,
      ['IN_PROGRESS'],
      'Cột mốc phải ở IN_PROGRESS mới được nộp.',
    );
    this.validateSubmission(input, milestone.templateVersion);
    return this.presentTask(
      this.taskRepository.submitMilestone(
        taskId,
        milestoneId,
        user.sub,
        input.content.trim(),
      ),
    );
  }

  reviewMilestone(
    user: JwtPayload,
    taskId: string,
    milestoneId: string,
    input: ReviewTaskDto,
  ) {
    const task = this.getTask(taskId);
    this.teamsService.getMentorTeam(user, task.teamId);
    const milestone = this.getMilestone(task, milestoneId);
    this.validateReviewInput(input);
    if (input.decision === 'CANCEL') {
      this.assertStatus(
        milestone.status,
        ['PLANNED', 'ASSIGNED', 'IN_PROGRESS'],
        'Chỉ cột mốc chưa nộp để duyệt mới có thể bị hủy.',
      );
    } else {
      this.assertStatus(
        milestone.status,
        ['SUBMITTED_FOR_REVIEW'],
        'Chỉ có thể duyệt đầu ra đang chờ Mentor xem xét.',
      );
    }
    return this.presentTask(
      this.taskRepository.reviewMilestone(
        taskId,
        milestoneId,
        user.sub,
        input.decision,
        input.note?.trim() || null,
      ),
    );
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

  private getTask(taskId: string): TaskEntity {
    const task = this.taskRepository.findById(taskId);
    if (!task) throw new NotFoundException('Không tìm thấy công việc.');
    return task;
  }

  private getMilestone(task: TaskEntity, milestoneId: string) {
    const milestone = task.milestones.find((item) => item.id === milestoneId);
    if (!milestone) throw new NotFoundException('Không tìm thấy cột mốc.');
    return milestone;
  }

  private getTaskTeamForActor(user: JwtPayload, task: TaskEntity): TeamEntity {
    if (user.role === 'MENTOR') {
      return this.teamsService.getMentorTeam(user, task.teamId);
    }
    const team = this.teamsService.getMyTeamEntity(user.sub);
    if (team.id !== task.teamId) {
      throw new ForbiddenException('Task không thuộc Team của bạn.');
    }
    return team;
  }

  private assertTeamLeader(user: JwtPayload, teamId: string): void {
    if (this.teamsService.getTeamMemberRole(teamId, user.sub) !== 'LEADER') {
      throw new ForbiddenException('Chỉ Leader hiện tại của Team mới được phân công công việc.');
    }
  }

  private assertAssignedMember(
    user: JwtPayload,
    teamId: string,
    assignmentType: 'INDIVIDUAL' | 'TEAM' | null,
    assignedUserId: string | null,
  ): void {
    const memberRole = this.teamsService.getTeamMemberRole(teamId, user.sub);
    if (!memberRole) throw new ForbiddenException('Bạn không thuộc Team của công việc này.');
    if (assignmentType === 'TEAM') return;
    if (
      assignmentType !== 'INDIVIDUAL' ||
      !assignedUserId ||
      assignedUserId !== user.sub
    ) {
      throw new ForbiddenException('Chỉ người được giao công việc mới được cập nhật hoặc nộp.');
    }
  }

  private assertTeamMember(teamId: string, userId: string): void {
    if (!this.teamsService.getTeamMemberRole(teamId, userId)) {
      throw new ConflictException({
        code: 'ASSIGNEE_NOT_IN_TEAM',
        message: 'Người được giao phải là thành viên của Team.',
      });
    }
  }

  private validateAssignmentInput(input: AssignTaskDto): void {
    if (!input || !['INDIVIDUAL', 'TEAM'].includes(input.assignmentType)) {
      throw new ConflictException({
        code: 'INVALID_ASSIGNMENT',
        message: 'Phạm vi giao việc phải là INDIVIDUAL hoặc TEAM.',
      });
    }
    if (input.assignmentType === 'INDIVIDUAL') {
      if (typeof input.userId !== 'string' || input.userId.trim().length === 0) {
        throw new ConflictException({
          code: 'INVALID_ASSIGNEE',
          message: 'Cần chọn thành viên Team làm người thực hiện.',
        });
      }
      return;
    }
    if (input.userId !== undefined) {
      throw new ConflictException({
        code: 'INVALID_ASSIGNMENT',
        message: 'Giao cho TEAM không nhận userId cá nhân.',
      });
    }
  }

  private validateSubmission(
    input: SubmitTaskDto | SubmitMilestoneDto,
    expectedTemplateVersion: string,
  ): void {
    if (!input || typeof input !== 'object') {
      throw new ConflictException({
        code: 'INVALID_SUBMISSION',
        message: 'Nội dung nộp không hợp lệ.',
      });
    }
    if (
      typeof input.content !== 'string' ||
      input.content.trim().length === 0 ||
      input.content.length > 10000
    ) {
      throw new ConflictException({
        code: 'INVALID_SUBMISSION_CONTENT',
        message: 'Nội dung đầu ra bắt buộc và không được vượt quá 10000 ký tự.',
      });
    }
    if (input.templateVersion !== expectedTemplateVersion) {
      throw new ConflictException({
        code: 'SUBMISSION_TEMPLATE_VERSION_MISMATCH',
        message: 'Phiên bản template của bản nộp phải khớp với công việc được giao.',
      });
    }
  }

  private validateReviewInput(input: ReviewTaskDto): void {
    if (
      !input ||
      !['APPROVE', 'REQUEST_CHANGES', 'CANCEL'].includes(input.decision)
    ) {
      throw new ConflictException({
        code: 'INVALID_REVIEW_DECISION',
        message: 'Quyết định phải là APPROVE, REQUEST_CHANGES hoặc CANCEL.',
      });
    }
    if (
      (input.decision === 'REQUEST_CHANGES' || input.decision === 'CANCEL') &&
      (!input.note || input.note.trim().length === 0)
    ) {
      throw new ConflictException({
        code: 'REVIEW_NOTE_REQUIRED',
        message: 'Cần ghi lý do khi yêu cầu chỉnh sửa hoặc hủy.',
      });
    }
    if (input.note !== undefined && input.note.length > 5000) {
      throw new ConflictException({
        code: 'INVALID_REVIEW_NOTE',
        message: 'Ghi chú xem xét không được vượt quá 5000 ký tự.',
      });
    }
  }

  private assertStatus(
    current: TaskStatus,
    allowed: TaskStatus[],
    message: string,
  ): void {
    if (!allowed.includes(current)) {
      throw new ConflictException({
        code: 'INVALID_TASK_STATE',
        message,
      });
    }
  }

  private presentTask(task: TaskEntity) {
    return {
      ...task,
      stateHistory: this.taskRepository.getStateHistory('TASK', task.id),
      milestones: task.milestones.map((milestone) => ({
        ...milestone,
        stateHistory: this.taskRepository.getStateHistory(
          'MILESTONE',
          milestone.id,
        ),
      })),
    };
  }
}
