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
  TeamAllocationProposalInput,
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

  @Post('talent/evaluations/:evaluationId/acknowledge')
  @Roles(UserRole.TALENT, UserRole.TALENT_LEADER)
  acknowledgeEvaluation(
    @CurrentUser() user: JwtPayload,
    @Param('evaluationId') evaluationId: string,
  ) {
    return this.reports.acknowledgeEvaluation(user, evaluationId);
  }

  @Post('talent/evaluations/:evaluationId/feedback')
  @Roles(UserRole.TALENT, UserRole.TALENT_LEADER)
  submitEvaluationFeedback(
    @CurrentUser() user: JwtPayload,
    @Param('evaluationId') evaluationId: string,
    @Body() input: { feedback?: unknown },
  ) {
    return this.reports.submitEvaluationFeedback(
      user,
      evaluationId,
      input?.feedback,
    );
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

  @Get('talent/me/team/allocation-proposals')
  @Roles(UserRole.TALENT_LEADER)
  listLeaderAllocationProposals(@CurrentUser() user: JwtPayload) {
    return this.reports.listLeaderAllocationProposals(user);
  }

  @Post('talent/me/team/allocation-proposals')
  @Roles(UserRole.TALENT_LEADER)
  createAllocationProposal(
    @CurrentUser() user: JwtPayload,
    @Body() input: TeamAllocationProposalInput,
  ) {
    return this.reports.createAllocationProposal(user, input);
  }

  @Patch('talent/me/team/allocation-proposals/:proposalId')
  @Roles(UserRole.TALENT_LEADER)
  updateAllocationProposal(
    @CurrentUser() user: JwtPayload,
    @Param('proposalId') proposalId: string,
    @Body() input: TeamAllocationProposalInput,
  ) {
    return this.reports.updateAllocationProposal(user, proposalId, input);
  }

  @Get('mentor/teams/:teamId/allocation-proposals')
  @Roles(UserRole.MENTOR)
  listMentorAllocationProposals(
    @CurrentUser() user: JwtPayload,
    @Param('teamId') teamId: string,
  ) {
    return this.reports.listMentorAllocationProposals(user, teamId);
  }

  @Post('mentor/allocation-proposals/:proposalId/approve')
  @Roles(UserRole.MENTOR)
  approveAllocationProposal(
    @CurrentUser() user: JwtPayload,
    @Param('proposalId') proposalId: string,
  ) {
    return this.reports.approveAllocationProposal(user, proposalId);
  }

  @Post('mentor/allocation-proposals/:proposalId/request-changes')
  @Roles(UserRole.MENTOR)
  requestAllocationProposalChanges(
    @CurrentUser() user: JwtPayload,
    @Param('proposalId') proposalId: string,
    @Body() input: { note?: unknown },
  ) {
    return this.reports.requestAllocationProposalChanges(
      user,
      proposalId,
      input?.note,
    );
  }

  @Get('talent/me/team/performance')
  @Roles(UserRole.TALENT_LEADER)
  getLeaderTeamPerformance(
    @CurrentUser() user: JwtPayload,
    @Query('periodStart') periodStart: string,
    @Query('periodEnd') periodEnd: string,
  ) {
    return this.reports.getLeaderTeamPerformance(user, periodStart, periodEnd);
  }

  @Get('mentor/teams/:teamId/performance')
  @Roles(UserRole.MENTOR)
  getMentorTeamPerformance(
    @CurrentUser() user: JwtPayload,
    @Param('teamId') teamId: string,
    @Query('periodStart') periodStart: string,
    @Query('periodEnd') periodEnd: string,
  ) {
    return this.reports.getMentorTeamPerformance(
      user,
      teamId,
      periodStart,
      periodEnd,
    );
  }
}
