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
import { FinancialClosureService } from './financial-closure.service';
import {
  CreateFinancialDisputeDto,
  CreateProjectClosureDossierDto,
  ResolveFinancialDisputeDto,
} from './financial-closure.types';

@Controller('api/v1/payments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FinancialClosureController {
  constructor(
    private readonly financialClosureService: FinancialClosureService,
  ) {}

  @Post('disputes')
  @Roles(
    UserRole.ENTERPRISE,
    UserRole.TALENT_LEADER,
    UserRole.TALENT,
    UserRole.MENTOR,
  )
  @HttpCode(HttpStatus.CREATED)
  raiseFinancialDispute(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateFinancialDisputeDto,
  ) {
    return this.financialClosureService.raiseFinancialDispute(user, dto);
  }

  @Post('disputes/:disputeId/resolve')
  @Roles(UserRole.LAB_ADMIN, UserRole.SYSTEM_ADMIN)
  @HttpCode(HttpStatus.OK)
  resolveFinancialDispute(
    @CurrentUser() user: JwtPayload,
    @Param('disputeId') disputeId: string,
    @Body() dto: ResolveFinancialDisputeDto,
  ) {
    return this.financialClosureService.resolveFinancialDispute(
      user,
      disputeId,
      dto,
    );
  }

  @Get('projects/:projectId/disputes')
  @Roles(
    UserRole.ENTERPRISE,
    UserRole.LAB_ADMIN,
    UserRole.SYSTEM_ADMIN,
    UserRole.MENTOR,
    UserRole.TALENT_LEADER,
    UserRole.TALENT,
  )
  listProjectDisputes(
    @CurrentUser() user: JwtPayload,
    @Param('projectId') projectId: string,
  ) {
    return this.financialClosureService.listProjectDisputes(user, projectId);
  }

  @Post('projects/:projectId/closure-dossier')
  @Roles(UserRole.ENTERPRISE, UserRole.LAB_ADMIN, UserRole.SYSTEM_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  createProjectClosureDossier(
    @CurrentUser() user: JwtPayload,
    @Param('projectId') projectId: string,
    @Body() dto: CreateProjectClosureDossierDto,
  ) {
    return this.financialClosureService.createProjectClosureDossier(
      user,
      projectId,
      dto,
    );
  }

  @Get('projects/:projectId/closure-dossier')
  @Roles(
    UserRole.ENTERPRISE,
    UserRole.LAB_ADMIN,
    UserRole.SYSTEM_ADMIN,
    UserRole.MENTOR,
    UserRole.TALENT_LEADER,
  )
  getProjectClosureDossier(
    @CurrentUser() user: JwtPayload,
    @Param('projectId') projectId: string,
  ) {
    return this.financialClosureService.getProjectClosureDossier(
      user,
      projectId,
    );
  }

  @Get('lab-fund/transparency-report')
  @Roles(UserRole.LAB_ADMIN, UserRole.SYSTEM_ADMIN)
  getLabFundTransparencyReport(@CurrentUser() user: JwtPayload) {
    return this.financialClosureService.getLabFundTransparencyReport(user);
  }
}