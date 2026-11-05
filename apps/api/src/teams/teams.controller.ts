import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtPayload, UserRole } from '@labodc/shared-types';
import { CurrentUser, Roles, RolesGuard } from '../common/guards/roles.guard';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import {
  AddTeamMemberDto,
  AppointTeamLeaderDto,
  CreateTeamDto,
} from './team.types';
import { TeamsService } from './teams.service';

@Controller('api/v1')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Get('mentor/me/teams')
  @Roles(UserRole.MENTOR)
  listMentorProjects(@CurrentUser() user: JwtPayload) {
    return this.teamsService.listMentorProjects(user);
  }

  @Post('mentor/projects/:projectId/team')
  @Roles(UserRole.MENTOR)
  createTeam(
    @CurrentUser() user: JwtPayload,
    @Param('projectId') projectId: string,
    @Body() input: CreateTeamDto,
  ) {
    return this.teamsService.createTeam(user, projectId, input);
  }

  @Post('mentor/teams/:teamId/members')
  @Roles(UserRole.MENTOR)
  addMember(
    @CurrentUser() user: JwtPayload,
    @Param('teamId') teamId: string,
    @Body() input: AddTeamMemberDto,
  ) {
    return this.teamsService.addMember(user, teamId, input);
  }

  @Delete('mentor/teams/:teamId/members/:userId')
  @Roles(UserRole.MENTOR)
  removeMember(
    @CurrentUser() user: JwtPayload,
    @Param('teamId') teamId: string,
    @Param('userId') memberUserId: string,
  ) {
    return this.teamsService.removeMember(user, teamId, memberUserId);
  }

  @Post('mentor/teams/:teamId/leader')
  @Roles(UserRole.MENTOR)
  appointLeader(
    @CurrentUser() user: JwtPayload,
    @Param('teamId') teamId: string,
    @Body() input: AppointTeamLeaderDto,
  ) {
    return this.teamsService.appointLeader(user, teamId, input);
  }

  @Get('talent/me/team')
  @Roles(UserRole.TALENT, UserRole.TALENT_LEADER)
  getMyTeam(@CurrentUser() user: JwtPayload) {
    return this.teamsService.getMyTeam(user);
  }
}
