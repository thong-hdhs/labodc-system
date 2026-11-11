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
import { MobileEvaluationBridgeService } from './mobile-evaluation-bridge.service';
import {
  CreateEvaluationPayoutReconciliationDto,
  CreateGateD26SignoffDto,
} from './mobile-evaluation-bridge.types';

@Controller('api/v1/system-admin/mobile-eval-bridge')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MobileEvaluationBridgeController {
  constructor(
    private readonly mobileEvaluationBridgeService: MobileEvaluationBridgeService,
  ) {}

  @Get('parity-status')
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.LAB_ADMIN)
  getParityStatus(@CurrentUser() user: JwtPayload) {
    return this.mobileEvaluationBridgeService.getParityStatus(user);
  }

  @Post('reconcile-payout')
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.LAB_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  reconcileEvaluationToPayout(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateEvaluationPayoutReconciliationDto,
  ) {
    return this.mobileEvaluationBridgeService.reconcileEvaluationToPayout(
      user,
      dto,
    );
  }

  @Post('gate-d26-signoff')
  @Roles(UserRole.SYSTEM_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  signOffGateD26(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateGateD26SignoffDto,
  ) {
    return this.mobileEvaluationBridgeService.signOffGateD26(user, dto);
  }
}