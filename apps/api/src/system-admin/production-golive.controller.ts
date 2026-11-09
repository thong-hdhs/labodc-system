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
import { ProductionGoliveService } from './production-golive.service';
import {
  CreateSprint3GateD21SignoffDto,
  ExecuteSmokeTestRunDto,
} from './production-golive.types';

@Controller('api/v1/system-admin/golive')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProductionGoliveController {
  constructor(
    private readonly goliveService: ProductionGoliveService,
  ) {}

  @Get('mobile-contract')
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.LAB_ADMIN)
  verifyMobileCompanionContract(@CurrentUser() user: JwtPayload) {
    return this.goliveService.verifyMobileCompanionContract(user);
  }

  @Post('smoke-runs')
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.LAB_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  executePostDeploySmokeSuite(
    @CurrentUser() user: JwtPayload,
    @Body() dto: ExecuteSmokeTestRunDto,
  ) {
    return this.goliveService.executePostDeploySmokeSuite(user, dto);
  }

  @Get('smoke-runs')
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.LAB_ADMIN)
  listSmokeTestRuns(@CurrentUser() user: JwtPayload) {
    return this.goliveService.listSmokeTestRuns(user);
  }

  @Post('gate-d21-signoff')
  @Roles(UserRole.SYSTEM_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  signOffSprint3GateD21(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateSprint3GateD21SignoffDto,
  ) {
    return this.goliveService.signOffSprint3GateD21(user, dto);
  }

  @Get('gate-d21-status')
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.LAB_ADMIN)
  getSprint3GateD21Status(@CurrentUser() user: JwtPayload) {
    return this.goliveService.getSprint3GateD21Status(user);
  }
}