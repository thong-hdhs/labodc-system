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
import { MobilePhase2SyncService } from './mobile-phase2-sync.service';
import { CreateCrossPlatformSyncCheckpointDto } from './mobile-phase2-sync.types';

@Controller('api/v1/system-admin/mobile-phase2')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MobilePhase2SyncController {
  constructor(
    private readonly mobilePhase2SyncService: MobilePhase2SyncService,
  ) {}

  @Get('contracts')
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.LAB_ADMIN)
  getMobilePhase2ContractMatrix(@CurrentUser() user: JwtPayload) {
    return this.mobilePhase2SyncService.getMobilePhase2ContractMatrix(user);
  }

  @Post('sync-checkpoints')
  @Roles(UserRole.SYSTEM_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  createSyncCheckpoint(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateCrossPlatformSyncCheckpointDto,
  ) {
    return this.mobilePhase2SyncService.createSyncCheckpoint(user, dto);
  }

  @Get('sync-checkpoints')
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.LAB_ADMIN)
  listSyncCheckpoints(@CurrentUser() user: JwtPayload) {
    return this.mobilePhase2SyncService.listSyncCheckpoints(user);
  }
}