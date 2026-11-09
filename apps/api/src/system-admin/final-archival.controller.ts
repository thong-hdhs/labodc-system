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
import { FinalArchivalService } from './final-archival.service';
import { IssueFinalCompletionCertificateDto } from './final-archival.types';

@Controller('api/v1/system-admin/final-archival')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FinalArchivalController {
  constructor(
    private readonly finalArchivalService: FinalArchivalService,
  ) {}

  @Get('master-summary')
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.LAB_ADMIN)
  getProject22DayMasterSummary(@CurrentUser() user: JwtPayload) {
    return this.finalArchivalService.getProject22DayMasterSummary(user);
  }

  @Post('certificates')
  @Roles(UserRole.SYSTEM_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  issueFinalCompletionCertificate(
    @CurrentUser() user: JwtPayload,
    @Body() dto: IssueFinalCompletionCertificateDto,
  ) {
    return this.finalArchivalService.issueFinalCompletionCertificate(user, dto);
  }

  @Get('certificates')
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.LAB_ADMIN)
  listFinalCompletionCertificates(@CurrentUser() user: JwtPayload) {
    return this.finalArchivalService.listFinalCompletionCertificates(user);
  }
}