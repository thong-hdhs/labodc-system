import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtPayload, UserRole } from '@labodc/shared-types';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, Roles, RolesGuard } from '../common/guards/roles.guard';
import { ProductionReadinessService } from './production-readiness.service';
import {
  CreateProductionReadinessSignoffDto,
  RecordSlaBenchmarkDto,
} from './production-readiness.types';

@Controller('api/v1/system-admin/readiness')
export class ProductionReadinessController {
  constructor(
    private readonly readinessService: ProductionReadinessService,
  ) {}

  /**
   * Public Probes cho Container / Uptime Monitoring (REQ-NFR-01 & ADR-05)
   */
  @Get('probes')
  getSystemProbes() {
    return this.readinessService.getSystemProbes();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.LAB_ADMIN)
  @Post('sla-benchmarks')
  @HttpCode(HttpStatus.CREATED)
  recordSlaBenchmark(
    @CurrentUser() user: JwtPayload,
    @Body() dto: RecordSlaBenchmarkDto,
  ) {
    return this.readinessService.recordSlaBenchmark(user, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.LAB_ADMIN)
  @Get('sla-benchmarks')
  listSlaBenchmarks(@CurrentUser() user: JwtPayload) {
    return this.readinessService.listSlaBenchmarks(user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.LAB_ADMIN)
  @Get('security-matrix')
  getSecurityRbacMatrixAudit(@CurrentUser() user: JwtPayload) {
    return this.readinessService.getSecurityRbacMatrixAudit(user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SYSTEM_ADMIN)
  @Post('sign-off')
  @HttpCode(HttpStatus.CREATED)
  signOffProductionReadiness(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateProductionReadinessSignoffDto,
  ) {
    return this.readinessService.signOffProductionReadiness(user, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.LAB_ADMIN)
  @Get('sign-offs')
  listProductionSignoffs(@CurrentUser() user: JwtPayload) {
    return this.readinessService.listProductionSignoffs(user);
  }
}