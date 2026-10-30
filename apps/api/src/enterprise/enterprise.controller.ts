import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { JwtPayload, UserRole } from '@labodc/shared-types';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, Roles, RolesGuard } from '../common/guards/roles.guard';
import { EnterpriseService } from './enterprise.service';
import {
  UpsertEnterpriseProfileDto,
  VerifyEnterpriseDto,
} from './enterprise-profile.types';

@Controller('api/v1/enterprises')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EnterpriseController {
  constructor(private readonly enterpriseService: EnterpriseService) {}

  @Post('profile')
  @Roles(UserRole.ENTERPRISE)
  @HttpCode(HttpStatus.OK)
  upsertMyProfile(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpsertEnterpriseProfileDto,
  ) {
    return this.enterpriseService.upsertMyProfile(user, dto);
  }

  @Put('profile/me')
  @Roles(UserRole.ENTERPRISE)
  updateMyProfile(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpsertEnterpriseProfileDto,
  ) {
    return this.enterpriseService.upsertMyProfile(user, dto);
  }

  @Get('profile/me')
  @Roles(UserRole.ENTERPRISE)
  getMyProfile(@CurrentUser() user: JwtPayload) {
    return this.enterpriseService.getMyProfile(user);
  }

  @Get()
  @Roles(UserRole.LAB_ADMIN, UserRole.SYSTEM_ADMIN)
  listAllEnterprises(@CurrentUser() user: JwtPayload) {
    return this.enterpriseService.listAllProfiles(user);
  }

  @Get(':id')
  @Roles(UserRole.ENTERPRISE, UserRole.LAB_ADMIN, UserRole.SYSTEM_ADMIN)
  getEnterpriseById(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.enterpriseService.getProfileById(user, id);
  }

  @Patch(':id')
  @Roles(UserRole.ENTERPRISE)
  updateEnterpriseById(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpsertEnterpriseProfileDto,
  ) {
    return this.enterpriseService.updateProfileById(user, id, dto);
  }

  @Patch(':id/verify')
  @Roles(UserRole.LAB_ADMIN, UserRole.SYSTEM_ADMIN)
  verifyEnterprise(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: VerifyEnterpriseDto,
  ) {
    return this.enterpriseService.verifyEnterpriseProfile(user, id, dto);
  }
}