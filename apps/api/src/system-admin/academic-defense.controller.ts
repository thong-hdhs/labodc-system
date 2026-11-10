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
import { AcademicDefenseService } from './academic-defense.service';
import {
  CreatePermanentLedgerSealDto,
  RecordAcademicDefenseVerdictDto,
} from './academic-defense.types';

@Controller('api/v1/system-admin/academic-defense')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AcademicDefenseController {
  constructor(
    private readonly defenseService: AcademicDefenseService,
  ) {}

  @Get('dossier')
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.LAB_ADMIN)
  getAcademicDefenseDossier(@CurrentUser() user: JwtPayload) {
    return this.defenseService.getAcademicDefenseDossier(user);
  }

  @Post('ledger-seals')
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.LAB_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  sealFinancialLedgerPermanently(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreatePermanentLedgerSealDto,
  ) {
    return this.defenseService.sealFinancialLedgerPermanently(user, dto);
  }

  @Post('gate-d24-verdict')
  @Roles(UserRole.SYSTEM_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  recordAcademicDefenseVerdict(
    @CurrentUser() user: JwtPayload,
    @Body() dto: RecordAcademicDefenseVerdictDto,
  ) {
    return this.defenseService.recordAcademicDefenseVerdict(user, dto);
  }
}