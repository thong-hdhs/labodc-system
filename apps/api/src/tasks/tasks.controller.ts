import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtPayload, UserRole } from '@labodc/shared-types';
import { CurrentUser, Roles, RolesGuard } from '../common/guards/roles.guard';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import {
  AssignTaskDto,
  CreateMilestoneDto,
  CreateTaskDto,
  ReviewTaskDto,
  SubmitMilestoneDto,
  SubmitTaskDto,
} from './task.types';
import { TasksService } from './tasks.service';

@Controller('api/v1')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get('mentor/projects/:projectId/templates')
  @Roles(UserRole.MENTOR)
  listTemplates(
    @CurrentUser() user: JwtPayload,
    @Param('projectId') projectId: string,
  ) {
    return this.tasksService.listTemplates(user, projectId);
  }

  @Get('mentor/projects/:projectId/tasks')
  @Roles(UserRole.MENTOR)
  listMentorTasks(
    @CurrentUser() user: JwtPayload,
    @Param('projectId') projectId: string,
  ) {
    return this.tasksService.listMentorTasks(user, projectId);
  }

  @Post('mentor/projects/:projectId/tasks')
  @Roles(UserRole.MENTOR)
  createTask(
    @CurrentUser() user: JwtPayload,
    @Param('projectId') projectId: string,
    @Body() input: CreateTaskDto,
  ) {
    return this.tasksService.createTask(user, projectId, input);
  }

  @Post('mentor/tasks/:taskId/milestones')
  @Roles(UserRole.MENTOR)
  addMilestone(
    @CurrentUser() user: JwtPayload,
    @Param('taskId') taskId: string,
    @Body() input: CreateMilestoneDto,
  ) {
    return this.tasksService.addMilestone(user, taskId, input);
  }

  @Post('mentor/tasks/:taskId/assignment')
  @Roles(UserRole.MENTOR)
  assignTask(
    @CurrentUser() user: JwtPayload,
    @Param('taskId') taskId: string,
    @Body() input: AssignTaskDto,
  ) {
    return this.tasksService.assignTask(user, taskId, input, false);
  }

  @Post('talent/me/team/tasks/:taskId/assignment')
  @Roles(UserRole.TALENT, UserRole.TALENT_LEADER)
  assignTaskAsLeader(
    @CurrentUser() user: JwtPayload,
    @Param('taskId') taskId: string,
    @Body() input: AssignTaskDto,
  ) {
    return this.tasksService.assignTask(user, taskId, input, true);
  }

  @Post('mentor/tasks/:taskId/milestones/:milestoneId/assignment')
  @Roles(UserRole.MENTOR)
  assignMilestone(
    @CurrentUser() user: JwtPayload,
    @Param('taskId') taskId: string,
    @Param('milestoneId') milestoneId: string,
    @Body() input: AssignTaskDto,
  ) {
    return this.tasksService.assignMilestone(
      user,
      taskId,
      milestoneId,
      input,
      false,
    );
  }

  @Post('talent/me/team/tasks/:taskId/milestones/:milestoneId/assignment')
  @Roles(UserRole.TALENT, UserRole.TALENT_LEADER)
  assignMilestoneAsLeader(
    @CurrentUser() user: JwtPayload,
    @Param('taskId') taskId: string,
    @Param('milestoneId') milestoneId: string,
    @Body() input: AssignTaskDto,
  ) {
    return this.tasksService.assignMilestone(
      user,
      taskId,
      milestoneId,
      input,
      true,
    );
  }

  @Post('talent/tasks/:taskId/start')
  @Roles(UserRole.TALENT, UserRole.TALENT_LEADER)
  startTask(@CurrentUser() user: JwtPayload, @Param('taskId') taskId: string) {
    return this.tasksService.startTask(user, taskId);
  }

  @Post('talent/tasks/:taskId/submissions')
  @Roles(UserRole.TALENT, UserRole.TALENT_LEADER)
  submitTask(
    @CurrentUser() user: JwtPayload,
    @Param('taskId') taskId: string,
    @Body() input: SubmitTaskDto,
  ) {
    return this.tasksService.submitTask(user, taskId, input);
  }

  @Post('mentor/tasks/:taskId/review')
  @Roles(UserRole.MENTOR)
  reviewTask(
    @CurrentUser() user: JwtPayload,
    @Param('taskId') taskId: string,
    @Body() input: ReviewTaskDto,
  ) {
    return this.tasksService.reviewTask(user, taskId, input);
  }

  @Post('talent/tasks/:taskId/milestones/:milestoneId/start')
  @Roles(UserRole.TALENT, UserRole.TALENT_LEADER)
  startMilestone(
    @CurrentUser() user: JwtPayload,
    @Param('taskId') taskId: string,
    @Param('milestoneId') milestoneId: string,
  ) {
    return this.tasksService.startMilestone(user, taskId, milestoneId);
  }

  @Post('talent/tasks/:taskId/milestones/:milestoneId/submissions')
  @Roles(UserRole.TALENT, UserRole.TALENT_LEADER)
  submitMilestone(
    @CurrentUser() user: JwtPayload,
    @Param('taskId') taskId: string,
    @Param('milestoneId') milestoneId: string,
    @Body() input: SubmitMilestoneDto,
  ) {
    return this.tasksService.submitMilestone(
      user,
      taskId,
      milestoneId,
      input,
    );
  }

  @Post('mentor/tasks/:taskId/milestones/:milestoneId/review')
  @Roles(UserRole.MENTOR)
  reviewMilestone(
    @CurrentUser() user: JwtPayload,
    @Param('taskId') taskId: string,
    @Param('milestoneId') milestoneId: string,
    @Body() input: ReviewTaskDto,
  ) {
    return this.tasksService.reviewMilestone(
      user,
      taskId,
      milestoneId,
      input,
    );
  }

  @Get('talent/me/tasks')
  @Roles(UserRole.TALENT, UserRole.TALENT_LEADER)
  getMyTasks(@CurrentUser() user: JwtPayload) {
    return this.tasksService.getMyTasks(user);
  }
}
