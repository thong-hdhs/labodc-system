import {
  Controller,
  Body,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtPayload, UserRole } from '@labodc/shared-types';
import { CurrentUser, Roles, RolesGuard } from '../common/guards/roles.guard';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ApplicationsService } from './applications.service';
import {
  DecideApplicationDto,
  InviteMentorDto,
  RecordInterviewResultDto,
} from './application.types';

@Controller('api/v1')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Post('projects/:projectId/applications')
  @Roles(UserRole.TALENT, UserRole.TALENT_LEADER)
  @HttpCode(HttpStatus.CREATED)
  submit(
    @CurrentUser() user: JwtPayload,
    @Param('projectId') projectId: string,
  ) {
    return this.applicationsService.submit(user, projectId);
  }

  @Get('talent/me/applications')
  @Roles(UserRole.TALENT, UserRole.TALENT_LEADER)
  listMine(@CurrentUser() user: JwtPayload) {
    return this.applicationsService.listMine(user);
  }

  @Post('applications/:applicationId/withdraw')
  @Roles(UserRole.TALENT, UserRole.TALENT_LEADER)
  @HttpCode(HttpStatus.OK)
  withdraw(
    @CurrentUser() user: JwtPayload,
    @Param('applicationId') applicationId: string,
  ) {
    return this.applicationsService.withdraw(user, applicationId);
  }

  @Post('lab-admin/projects/:projectId/mentor-invitations')
  @Roles(UserRole.LAB_ADMIN, UserRole.SYSTEM_ADMIN)
  inviteMentor(
    @CurrentUser() user: JwtPayload,
    @Param('projectId') projectId: string,
    @Body() input: InviteMentorDto,
  ) {
    return this.applicationsService.inviteMentor(user, projectId, input);
  }

  @Get('mentor/me/invitations')
  @Roles(UserRole.MENTOR)
  listMentorInvitations(@CurrentUser() user: JwtPayload) {
    return this.applicationsService.listMentorInvitations(user);
  }

  @Post('mentor/me/invitations/:invitationId/accept')
  @Roles(UserRole.MENTOR)
  @HttpCode(HttpStatus.OK)
  acceptMentorInvitation(
    @CurrentUser() user: JwtPayload,
    @Param('invitationId') invitationId: string,
  ) {
    return this.applicationsService.respondToMentorInvitation(
      user,
      invitationId,
      true,
    );
  }

  @Post('mentor/me/invitations/:invitationId/decline')
  @Roles(UserRole.MENTOR)
  @HttpCode(HttpStatus.OK)
  declineMentorInvitation(
    @CurrentUser() user: JwtPayload,
    @Param('invitationId') invitationId: string,
  ) {
    return this.applicationsService.respondToMentorInvitation(
      user,
      invitationId,
      false,
    );
  }

  @Get('mentor/me/applications')
  @Roles(UserRole.MENTOR)
  listAssignedApplications(@CurrentUser() user: JwtPayload) {
    return this.applicationsService.listAssignedApplications(user);
  }

  @Post('mentor/applications/:applicationId/start-review')
  @Roles(UserRole.MENTOR)
  @HttpCode(HttpStatus.OK)
  startReview(
    @CurrentUser() user: JwtPayload,
    @Param('applicationId') applicationId: string,
  ) {
    return this.applicationsService.startReview(user, applicationId);
  }

  @Post('mentor/applications/:applicationId/interview-result')
  @Roles(UserRole.MENTOR)
  @HttpCode(HttpStatus.OK)
  recordInterviewResult(
    @CurrentUser() user: JwtPayload,
    @Param('applicationId') applicationId: string,
    @Body() input: RecordInterviewResultDto,
  ) {
    return this.applicationsService.recordInterviewResult(
      user,
      applicationId,
      input,
    );
  }

  @Post('mentor/applications/:applicationId/decision')
  @Roles(UserRole.MENTOR)
  @HttpCode(HttpStatus.OK)
  decide(
    @CurrentUser() user: JwtPayload,
    @Param('applicationId') applicationId: string,
    @Body() input: DecideApplicationDto,
  ) {
    return this.applicationsService.decide(user, applicationId, input);
  }
}
