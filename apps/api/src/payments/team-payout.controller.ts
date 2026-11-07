import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtPayload, UserRole } from '@labodc/shared-types';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, Roles, RolesGuard } from '../common/guards/roles.guard';
import { TeamPayoutService } from './team-payout.service';
import {
  DistributeTeam70PoolDto,
  ExecuteMilestonePayoutDto,
} from './team-payout.types';

@Controller('api/v1/payments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TeamPayoutController {
  constructor(private readonly teamPayoutService: TeamPayoutService) {}

  @Post('milestones/:id/distribute-team-pool')
  @Roles(
    UserRole.MENTOR,
    UserRole.LAB_ADMIN,
    UserRole.SYSTEM_ADMIN,
    UserRole.TALENT_LEADER,
  )
  @HttpCode(HttpStatus.OK)
  distributeMilestoneTeam70Pool(
    @CurrentUser() user: JwtPayload,
    @Param('id') milestoneId: string,
    @Body() dto: DistributeTeam70PoolDto,
  ) {
    return this.teamPayoutService.distributeMilestoneTeam70Pool(
      user,
      milestoneId,
      dto,
    );
  }

  @Post('milestones/:id/execute-payouts')
  @Roles(UserRole.LAB_ADMIN, UserRole.SYSTEM_ADMIN)
  @HttpCode(HttpStatus.OK)
  executeMilestonePayoutOrders(
    @CurrentUser() user: JwtPayload,
    @Param('id') milestoneId: string,
    @Body() dto?: ExecuteMilestonePayoutDto,
  ) {
    return this.teamPayoutService.executeMilestonePayoutOrders(
      user,
      milestoneId,
      dto,
    );
  }

  @Get('milestones/:id/financial-receipt')
  @Roles(
    UserRole.ENTERPRISE,
    UserRole.LAB_ADMIN,
    UserRole.SYSTEM_ADMIN,
    UserRole.MENTOR,
    UserRole.TALENT_LEADER,
  )
  getEnterpriseFinancialReceipt(
    @CurrentUser() user: JwtPayload,
    @Param('id') milestoneId: string,
  ) {
    return this.teamPayoutService.getEnterpriseFinancialReceipt(
      user,
      milestoneId,
    );
  }
}