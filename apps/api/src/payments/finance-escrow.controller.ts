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
import { FinanceEscrowService } from './finance-escrow.service';
import {
  AcceptMilestoneDto,
  ConfirmMilestoneEscrowDto,
  CreateProjectMilestoneDto,
  SubmitMilestoneDeliverableDto,
} from './finance-escrow.types';

@Controller('api/v1/payments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FinanceEscrowController {
  constructor(private readonly financeEscrowService: FinanceEscrowService) {}

  @Post('milestones')
  @Roles(UserRole.ENTERPRISE, UserRole.LAB_ADMIN, UserRole.SYSTEM_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  createMilestone(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateProjectMilestoneDto,
  ) {
    return this.financeEscrowService.createMilestone(user, dto);
  }

  @Post('milestones/:id/confirm-escrow')
  @Roles(UserRole.ENTERPRISE, UserRole.LAB_ADMIN, UserRole.SYSTEM_ADMIN)
  @HttpCode(HttpStatus.OK)
  confirmMilestoneEscrow(
    @CurrentUser() user: JwtPayload,
    @Param('id') milestoneId: string,
    @Body() dto?: ConfirmMilestoneEscrowDto,
  ) {
    return this.financeEscrowService.confirmMilestoneEscrow(
      user,
      milestoneId,
      dto,
    );
  }

  @Post('milestones/:id/submit-deliverable')
  @Roles(
    UserRole.TALENT,
    UserRole.TALENT_LEADER,
    UserRole.MENTOR,
    UserRole.LAB_ADMIN,
  )
  @HttpCode(HttpStatus.OK)
  submitDeliverable(
    @CurrentUser() user: JwtPayload,
    @Param('id') milestoneId: string,
    @Body() dto: SubmitMilestoneDeliverableDto,
  ) {
    return this.financeEscrowService.submitDeliverable(user, milestoneId, dto);
  }

  @Post('milestones/:id/accept-and-split')
  @Roles(UserRole.ENTERPRISE, UserRole.LAB_ADMIN, UserRole.SYSTEM_ADMIN)
  @HttpCode(HttpStatus.OK)
  acceptAndDisburseMilestone(
    @CurrentUser() user: JwtPayload,
    @Param('id') milestoneId: string,
    @Body() dto?: AcceptMilestoneDto,
  ) {
    return this.financeEscrowService.acceptAndDisburseMilestone(
      user,
      milestoneId,
      dto,
    );
  }

  @Get('projects/:projectId/ledger')
  @Roles(
    UserRole.ENTERPRISE,
    UserRole.LAB_ADMIN,
    UserRole.SYSTEM_ADMIN,
    UserRole.MENTOR,
    UserRole.TALENT_LEADER,
  )
  getProjectFinanceLedger(
    @CurrentUser() user: JwtPayload,
    @Param('projectId') projectId: string,
  ) {
    return this.financeEscrowService.getProjectFinanceLedger(user, projectId);
  }
}