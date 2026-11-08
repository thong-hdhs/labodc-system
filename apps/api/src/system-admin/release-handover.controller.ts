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
import { ReleaseHandoverService } from './release-handover.service';
import { CreateReleaseHandoverPackageDto } from './release-handover.types';

@Controller('api/v1/system-admin/handover')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReleaseHandoverController {
  constructor(
    private readonly releaseHandoverService: ReleaseHandoverService,
  ) {}

  @Get('rtm-matrix')
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.LAB_ADMIN)
  getRequirementsTraceabilityMatrix(@CurrentUser() user: JwtPayload) {
    return this.releaseHandoverService.getRequirementsTraceabilityMatrix(user);
  }

  @Post('packages')
  @Roles(UserRole.SYSTEM_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  createReleaseHandoverPackage(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateReleaseHandoverPackageDto,
  ) {
    return this.releaseHandoverService.createReleaseHandoverPackage(user, dto);
  }

  @Get('packages')
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.LAB_ADMIN)
  listReleaseHandoverPackages(@CurrentUser() user: JwtPayload) {
    return this.releaseHandoverService.listReleaseHandoverPackages(user);
  }

  @Get('final-gate-d20')
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.LAB_ADMIN)
  getFinalGateD20Summary(@CurrentUser() user: JwtPayload) {
    return this.releaseHandoverService.getFinalGateD20Summary(user);
  }
}