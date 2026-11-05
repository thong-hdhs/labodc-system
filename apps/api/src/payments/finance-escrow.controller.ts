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
  RefundMilestoneEscrowDto,
  RequestMilestoneRevisionDto,
  SubmitMilestoneDeliverableDto,
  SyncPayosWebhookToMilestoneDto,
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

  /**
   * Ngày D13: Đồng bộ tự động PayOS Webhook HMAC vào Cột mốc Ký quỹ & Sổ cái (Idempotent)
   */
  @Post('milestones/:id/sync-payos-webhook')
  @Roles(UserRole.ENTERPRISE, UserRole.LAB_ADMIN, UserRole.SYSTEM_ADMIN)
  @HttpCode(HttpStatus.OK)
  syncEscrowFromPayosWebhook(
    @CurrentUser() user: JwtPayload,
    @Param('id') milestoneId: string,
    @Body() dto?: SyncPayosWebhookToMilestoneDto,
  ) {
    return this.financeEscrowService.syncEscrowFromPayosWebhook(
      user,
      milestoneId,
      dto,
    );
  }

  /**
   * Ngày D13: Doanh nghiệp / Lab Admin yêu cầu Nhóm sinh viên sửa lại gói bàn giao cột mốc
   */
  @Post('milestones/:id/request-revision')
  @Roles(UserRole.ENTERPRISE, UserRole.LAB_ADMIN, UserRole.SYSTEM_ADMIN)
  @HttpCode(HttpStatus.OK)
  requestMilestoneRevision(
    @CurrentUser() user: JwtPayload,
    @Param('id') milestoneId: string,
    @Body() dto: RequestMilestoneRevisionDto,
  ) {
    return this.financeEscrowService.requestMilestoneRevision(
      user,
      milestoneId,
      dto,
    );
  }

  /**
   * Ngày D13: Hoàn trả 100% tiền ký quỹ cột mốc chưa giải ngân về cho Doanh nghiệp (ESCROW_REFUND)
   */
  @Post('milestones/:id/refund-escrow')
  @Roles(UserRole.ENTERPRISE, UserRole.LAB_ADMIN, UserRole.SYSTEM_ADMIN)
  @HttpCode(HttpStatus.OK)
  refundMilestoneEscrow(
    @CurrentUser() user: JwtPayload,
    @Param('id') milestoneId: string,
    @Body() dto: RefundMilestoneEscrowDto,
  ) {
    return this.financeEscrowService.refundMilestoneEscrow(
      user,
      milestoneId,
      dto,
    );
  }

  /**
   * Ngày D13: Báo cáo Đối soát Tổng hợp Sổ cái & Quỹ Lab 70/20/10 Toàn hệ thống
   */
  @Get('reconciliation/summary')
  @Roles(UserRole.LAB_ADMIN, UserRole.SYSTEM_ADMIN)
  getGlobalReconciliationSummary(@CurrentUser() user: JwtPayload) {
    return this.financeEscrowService.getGlobalReconciliationSummary(user);
  }
}