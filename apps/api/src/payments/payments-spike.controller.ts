import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtPayload, UserRole } from '@labodc/shared-types';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, Roles, RolesGuard } from '../common/guards/roles.guard';
import { PaymentsSpikeService } from './payments-spike.service';
import {
  CreatePayosOrderDto,
  PayosWebhookBodyDto,
} from './payos-spike.types';

@Controller('api/v1/payments')
export class PaymentsSpikeController {
  constructor(private readonly paymentsSpikeService: PaymentsSpikeService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ENTERPRISE, UserRole.LAB_ADMIN, UserRole.SYSTEM_ADMIN)
  @Post('orders')
  @HttpCode(HttpStatus.CREATED)
  createPayosOrder(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreatePayosOrderDto,
  ) {
    return this.paymentsSpikeService.createSandboxPaymentOrder(user, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ENTERPRISE, UserRole.LAB_ADMIN, UserRole.SYSTEM_ADMIN)
  @Get('orders')
  listOrders(
    @CurrentUser() user: JwtPayload,
    @Query('projectId') projectId?: string,
  ) {
    return this.paymentsSpikeService.listOrdersForProject(user, projectId);
  }

  @Get('orders/:orderCode/return-check')
  checkClientRedirect(@Param('orderCode') orderCode: string) {
    return this.paymentsSpikeService.checkClientRedirectReturn(
      Number(orderCode),
    );
  }

  /**
   * Public Webhook Endpoint nhận thông báo thanh toán từ PayOS (bảo vệ bằng HMAC-SHA256 Signature)
   */
  @Post('webhooks/payos')
  @HttpCode(HttpStatus.OK)
  handlePayosWebhook(@Body() body: PayosWebhookBodyDto) {
    return this.paymentsSpikeService.handlePayosWebhook(body);
  }

  /**
   * Endpoint hỗ trợ sinh chữ ký Sandbox phục vụ Spike Test ở D9
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ENTERPRISE, UserRole.LAB_ADMIN, UserRole.SYSTEM_ADMIN)
  @Post('orders/:orderCode/simulate-signed-webhook')
  @HttpCode(HttpStatus.OK)
  simulateSignedWebhook(
    @Param('orderCode') orderCode: string,
    @Body() body?: { reference?: string },
  ) {
    const signedPayload =
      this.paymentsSpikeService.buildSignedSandboxWebhookPayload(
        Number(orderCode),
        body?.reference || 'FT26306999999',
      );
    return this.paymentsSpikeService.handlePayosWebhook(signedPayload);
  }
}