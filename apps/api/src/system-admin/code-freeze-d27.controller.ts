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
import { CodeFreezeD27Service } from './code-freeze-d27.service';
import { LockCodeFreezeManifestD27Dto } from './code-freeze-d27.types';

@Controller('api/v1/system-admin/code-freeze-d27')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CodeFreezeD27Controller {
  constructor(private readonly codeFreezeD27Service: CodeFreezeD27Service) {}

  @Get('inventory')
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.LAB_ADMIN)
  getCodeFreezeInventory(@CurrentUser() user: JwtPayload) {
    return this.codeFreezeD27Service.getCodeFreezeInventory(user);
  }

  @Post('lock-manifest')
  @Roles(UserRole.SYSTEM_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  lockCodeFreezeManifest(
    @CurrentUser() user: JwtPayload,
    @Body() dto: LockCodeFreezeManifestD27Dto,
  ) {
    return this.codeFreezeD27Service.lockCodeFreezeManifest(user, dto);
  }
}