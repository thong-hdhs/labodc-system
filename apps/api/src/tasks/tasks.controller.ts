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
import { CreateMilestoneDto, CreateTaskDto } from './task.types';
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

  @Get('talent/me/tasks')
  @Roles(UserRole.TALENT, UserRole.TALENT_LEADER)
  getMyTasks(@CurrentUser() user: JwtPayload) {
    return this.tasksService.getMyTasks(user);
  }
}
