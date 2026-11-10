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
import { PostGoliveHypercareService } from './post-golive-hypercare.service';
import {
  CreateDefenseGateD23SignoffDto,
  ExecuteDrDrillDto,
} from './post-golive-hypercare.types';

@Controller('api/v1/system-admin/hypercare')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PostGoliveHypercareController {
  constructor(
    private readonly hypercareService: PostGoliveHypercareService,
  ) {}

  @Get('status')
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.LAB_ADMIN)
  getHypercareOperationsStatus(@CurrentUser() user: JwtPayload) {
    return this.hypercareService.getHypercareOperationsStatus(user);
  }

  @Post('dr-drills')
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.LAB_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  executeDrBackupRestoreDrill(
    @CurrentUser() user: JwtPayload,
    @Body() dto: ExecuteDrDrillDto,
  ) {
    return this.hypercareService.executeDrBackupRestoreDrill(user, dto);
  }

  @Get('dr-drills')
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.LAB_ADMIN)
  listDrDrills(@CurrentUser() user: JwtPayload) {
    return this.hypercareService.listDrDrills(user);
  }

  @Post('gate-d23-defense-signoff')
  @Roles(UserRole.SYSTEM_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  signOffProjectDefenseGateD23(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateDefenseGateD23SignoffDto,
  ) {
    return this.hypercareService.signOffProjectDefenseGateD23(user, dto);
  }
}