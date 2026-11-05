import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtPayload, UserRole } from '@labodc/shared-types';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, Roles, RolesGuard } from '../common/guards/roles.guard';
import { SystemGovernanceService } from './system-governance.service';
import {
  UpdateAccountGovernanceStatusDto,
  UpdateSystemRuntimeConfigDto,
} from './system-governance.types';

@Controller('api/v1/system-admin/governance')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SystemGovernanceController {
  constructor(
    private readonly governanceService: SystemGovernanceService,
  ) {}

  @Get('config')
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.LAB_ADMIN)
  getRuntimeConfig(@CurrentUser() user: JwtPayload) {
    return this.governanceService.getRuntimeConfig(user);
  }

  @Patch('config')
  @Roles(UserRole.SYSTEM_ADMIN)
  updateRuntimeConfig(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateSystemRuntimeConfigDto,
  ) {
    return this.governanceService.updateRuntimeConfig(user, dto);
  }

  @Post('users/:userId/status')
  @Roles(UserRole.SYSTEM_ADMIN)
  @HttpCode(HttpStatus.OK)
  updateAccountGovernanceStatus(
    @CurrentUser() user: JwtPayload,
    @Param('userId') userId: string,
    @Body() dto: UpdateAccountGovernanceStatusDto,
  ) {
    return this.governanceService.updateAccountGovernanceStatus(
      user,
      userId,
      dto,
    );
  }

  @Get('users')
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.LAB_ADMIN)
  listGovernedAccounts(@CurrentUser() user: JwtPayload) {
    return this.governanceService.listGovernedAccounts(user);
  }

  @Get('logs')
  @Roles(UserRole.SYSTEM_ADMIN)
  listGovernanceAuditLogs(@CurrentUser() user: JwtPayload) {
    return this.governanceService.listGovernanceAuditLogs(user);
  }

  @Get('sprint2-readiness')
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.LAB_ADMIN)
  getSprint2ReadinessReport(@CurrentUser() user: JwtPayload) {
    return this.governanceService.getSprint2ReadinessReport(user);
  }
}