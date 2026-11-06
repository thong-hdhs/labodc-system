import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtPayload, UserRole } from '@labodc/shared-types';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, Roles, RolesGuard } from '../common/guards/roles.guard';
import { ProjectSettlementService } from './project-settlement.service';
import {
  CreateProjectProgressReportDto,
  ReviewProjectProgressReportDto,
} from './project-settlement.types';

@Controller('api/v1/payments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProjectSettlementController {
  constructor(
    private readonly settlementService: ProjectSettlementService,
  ) {}

  @Post('progress-reports')
  @Roles(
    UserRole.TALENT,
    UserRole.TALENT_LEADER,
    UserRole.MENTOR,
    UserRole.LAB_ADMIN,
  )
  @HttpCode(HttpStatus.CREATED)
  submitProgressReport(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateProjectProgressReportDto,
  ) {
    return this.settlementService.submitProgressReport(user, dto);
  }

  @Post('progress-reports/:reportId/review')
  @Roles(UserRole.LAB_ADMIN, UserRole.SYSTEM_ADMIN, UserRole.ENTERPRISE)
  @HttpCode(HttpStatus.OK)
  reviewProgressReport(
    @CurrentUser() user: JwtPayload,
    @Param('reportId') reportId: string,
    @Body() dto: ReviewProjectProgressReportDto,
  ) {
    return this.settlementService.reviewProgressReport(user, reportId, dto);
  }

  @Get('projects/:projectId/progress-reports')
  @Roles(
    UserRole.ENTERPRISE,
    UserRole.LAB_ADMIN,
    UserRole.SYSTEM_ADMIN,
    UserRole.MENTOR,
    UserRole.TALENT_LEADER,
    UserRole.TALENT,
  )
  listProjectProgressReports(
    @CurrentUser() user: JwtPayload,
    @Param('projectId') projectId: string,
  ) {
    return this.settlementService.listProjectProgressReports(user, projectId);
  }

  @Get('projects/:projectId/settlement-certificate')
  @Roles(
    UserRole.ENTERPRISE,
    UserRole.LAB_ADMIN,
    UserRole.SYSTEM_ADMIN,
    UserRole.MENTOR,
    UserRole.TALENT_LEADER,
  )
  getProjectSettlementCertificate(
    @CurrentUser() user: JwtPayload,
    @Param('projectId') projectId: string,
  ) {
    return this.settlementService.getProjectSettlementCertificate(
      user,
      projectId,
    );
  }
}