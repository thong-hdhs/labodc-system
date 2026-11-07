import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtPayload, UserRole } from '@labodc/shared-types';
import { CurrentUser, Roles, RolesGuard } from '../common/guards/roles.guard';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import {
  CreateContributionInput,
  CreateEvaluationInput,
  ReportContentInput,
} from './report.types';
import { ReportsService } from './reports.service';

@Controller('api/v1')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Post('mentor/projects/:projectId/reports')
  @Roles(UserRole.MENTOR)
  createMentorReport(
    @CurrentUser() user: JwtPayload,
    @Param('projectId') projectId: string,
    @Body() input: ReportContentInput,
  ) {
    return this.reports.createMentorReport(user, projectId, input);
  }

  @Post('talent/me/reports')
  @Roles(UserRole.TALENT_LEADER)
  createTeamReport(
    @CurrentUser() user: JwtPayload,
    @Body() input: ReportContentInput,
  ) {
    return this.reports.createTeamReport(user, input);
  }

  @Patch('reports/:reportId')
  @Roles(UserRole.MENTOR, UserRole.TALENT_LEADER)
  updateReport(
    @CurrentUser() user: JwtPayload,
    @Param('reportId') reportId: string,
    @Body() input: ReportContentInput,
  ) {
    return this.reports.updateReport(user, reportId, input);
  }

  @Post('reports/:reportId/submit')
  @Roles(UserRole.MENTOR, UserRole.TALENT_LEADER)
  submitReport(
    @CurrentUser() user: JwtPayload,
    @Param('reportId') reportId: string,
  ) {
    return this.reports.submitReport(user, reportId);
  }

  @Post('reports/:reportId/start-review')
  @Roles(UserRole.MENTOR, UserRole.LAB_ADMIN)
  startReportReview(
    @CurrentUser() user: JwtPayload,
    @Param('reportId') reportId: string,
  ) {
    return this.reports.startReportReview(user, reportId);
  }

  @Post('reports/:reportId/request-changes')
  @Roles(UserRole.MENTOR, UserRole.LAB_ADMIN)
  requestReportChanges(
    @CurrentUser() user: JwtPayload,
    @Param('reportId') reportId: string,
    @Body() input: { note?: unknown },
  ) {
    return this.reports.requestReportChanges(user, reportId, input?.note);
  }

  @Post('reports/:reportId/approve')
  @Roles(UserRole.MENTOR, UserRole.LAB_ADMIN)
  approveReport(
    @CurrentUser() user: JwtPayload,
    @Param('reportId') reportId: string,
  ) {
    return this.reports.approveReport(user, reportId);
  }

  @Get('reports/:reportId/history')
  @Roles(
    UserRole.MENTOR,
    UserRole.LAB_ADMIN,
    UserRole.TALENT,
    UserRole.TALENT_LEADER,
  )
  getReportHistory(
    @CurrentUser() user: JwtPayload,
    @Param('reportId') reportId: string,
  ) {
    return this.reports.getReportHistory(user, reportId);
  }

  @Get('mentor/projects/:projectId/reports')
  @Roles(UserRole.MENTOR)
  listMentorReports(
    @CurrentUser() user: JwtPayload,
    @Param('projectId') projectId: string,
  ) {
    return this.reports.listMentorReports(user, projectId);
  }

  @Get('lab-admin/reports')
  @Roles(UserRole.LAB_ADMIN)
  listLabReports(
    @CurrentUser() user: JwtPayload,
    @Query('projectId') projectId?: string,
  ) {
    return this.reports.listLabReports(user, projectId);
  }

  @Get('talent/me/reports')
  @Roles(UserRole.TALENT, UserRole.TALENT_LEADER)
  listTalentReports(@CurrentUser() user: JwtPayload) {
    return this.reports.listTalentReports(user);
  }

  @Post('mentor/projects/:projectId/evaluations')
  @Roles(UserRole.MENTOR)
  createEvaluation(
    @CurrentUser() user: JwtPayload,
    @Param('projectId') projectId: string,
    @Body() input: CreateEvaluationInput,
  ) {
    return this.reports.createEvaluation(user, projectId, input);
  }

  @Post('mentor/evaluations/:evaluationId/finalize')
  @Roles(UserRole.MENTOR)
  finalizeEvaluation(
    @CurrentUser() user: JwtPayload,
    @Param('evaluationId') evaluationId: string,
  ) {
    return this.reports.finalizeEvaluation(user, evaluationId);
  }

  @Get('mentor/projects/:projectId/evaluations')
  @Roles(UserRole.MENTOR)
  listMentorEvaluations(
    @CurrentUser() user: JwtPayload,
    @Param('projectId') projectId: string,
  ) {
    return this.reports.listMentorEvaluations(user, projectId);
  }

  @Get('lab-admin/evaluations')
  @Roles(UserRole.LAB_ADMIN)
  listLabEvaluations(
    @CurrentUser() user: JwtPayload,
    @Query('projectId') projectId?: string,
  ) {
    return this.reports.listLabEvaluations(user, projectId);
  }

  @Get('talent/me/evaluations')
  @Roles(UserRole.TALENT, UserRole.TALENT_LEADER)
  listTalentEvaluations(@CurrentUser() user: JwtPayload) {
    return this.reports.listTalentEvaluations(user);
  }

  @Post('mentor/projects/:projectId/contributions')
  @Roles(UserRole.MENTOR)
  createContribution(
    @CurrentUser() user: JwtPayload,
    @Param('projectId') projectId: string,
    @Body() input: CreateContributionInput,
  ) {
    return this.reports.createContribution(user, projectId, input);
  }

  @Get('mentor/projects/:projectId/contributions')
  @Roles(UserRole.MENTOR)
  listMentorContributions(
    @CurrentUser() user: JwtPayload,
    @Param('projectId') projectId: string,
  ) {
    return this.reports.listMentorContributions(user, projectId);
  }

  @Get('lab-admin/contributions')
  @Roles(UserRole.LAB_ADMIN)
  listLabContributions(
    @CurrentUser() user: JwtPayload,
    @Query('projectId') projectId?: string,
  ) {
    return this.reports.listLabContributions(user, projectId);
  }

  @Get('talent/me/contributions')
  @Roles(UserRole.TALENT, UserRole.TALENT_LEADER)
  listTalentContributions(@CurrentUser() user: JwtPayload) {
    return this.reports.listTalentContributions(user);
  }
}
