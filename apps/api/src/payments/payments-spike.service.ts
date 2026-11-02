import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { JwtPayload, UserRole } from '@labodc/shared-types';
import { ProjectProposalRepository } from '../projects/project-proposal.repository';
import {
  CreatePayosOrderDto,
  PaymentOrderStatus,
  PayosPaymentOrderEntity,
  PayosWebhookBodyDto,
  PayosWebhookEventEntity,
} from './payos-spike.types';
import {
  createPayosOrderSignature,
  createPayosWebhookSignature,
  verifyPayosWebhookSignature,
} from './payos-signature.util';

@Injectable()
export class PaymentsSpikeService {
  private readonly ordersByCode = new Map<number, PayosPaymentOrderEntity>();
  private readonly webhookEventsByKey = new Map<
    string,
    PayosWebhookEventEntity
  >();
  private orderSequence = 260001;
  private webhookSequence = 1;

  constructor(private readonly projectRepository: ProjectProposalRepository) {}

  getPaymentMode(): 'SANDBOX' | 'PRODUCTION' {
    return process.env.PAYMENT_MODE === 'PRODUCTION' ? 'PRODUCTION' : 'SANDBOX';
  }

  createSandboxPaymentOrder(
    user: JwtPayload,
    dto: CreatePayosOrderDto,
  ): PayosPaymentOrderEntity {
    if (
      user.role !== UserRole.ENTERPRISE &&
      user.role !== UserRole.LAB_ADMIN &&
      user.role !== UserRole.SYSTEM_ADMIN
    ) {
      throw new ForbiddenException(
        'Chỉ Doanh nghiệp tài trợ hoặc Quản trị viên mới được phép khởi tạo lệnh thanh toán PayOS.',
      );
    }

    const project = this.projectRepository.findById(dto.projectId);
    if (!project) {
      throw new NotFoundException(`Không tìm thấy dự án ${dto.projectId}.`);
    }

    if (
      user.role === UserRole.ENTERPRISE &&
      project.ownerUserId !== user.sub
    ) {
      throw new ForbiddenException(
        'Vi phạm quyền sở hữu: Bạn không thể tạo lệnh thanh toán cho dự án của doanh nghiệp khác.',
      );
    }

    if (!dto.amount || !Number.isInteger(dto.amount) || dto.amount <= 0) {
      throw new BadRequestException(
        'Số tiền thanh toán (amount) phải là số nguyên dương (VNĐ).',
      );
    }

    if (!dto.milestoneName || dto.milestoneName.trim().length < 3) {
      throw new BadRequestException(
        'Tên đợt thanh toán (milestoneName) bắt buộc tối thiểu 3 ký tự.',
      );
    }

    const orderCode = this.orderSequence++;
    const returnUrl =
      dto.returnUrl?.trim() || 'http://localhost:5173/finance/payos-spike?status=return';
    const cancelUrl =
      dto.cancelUrl?.trim() || 'http://localhost:5173/finance/payos-spike?status=cancel';
    const description = (
      dto.description?.trim() || `LABODC ${project.code} ${dto.milestoneName}`
    ).slice(0, 25);

    const signature = createPayosOrderSignature({
      amount: dto.amount,
      cancelUrl,
      description,
      orderCode,
      returnUrl,
    });

    const now = new Date().toISOString();
    const order: PayosPaymentOrderEntity = {
      id: `pay-order-${orderCode}`,
      orderCode,
      projectId: project.id,
      enterpriseUserId: project.ownerUserId,
      milestoneName: dto.milestoneName.trim(),
      amount: dto.amount,
      currency: 'VND',
      paymentMode: this.getPaymentMode(),
      status: PaymentOrderStatus.PENDING_PAYMENT,
      description,
      returnUrl,
      cancelUrl,
      checkoutUrl: `https://sandbox.payos.vn/web/checkout/${orderCode}`,
      qrCode: `00020101021238570010A000000727012700069704220113LABODC${orderCode}0208QRIBFTTA5303704540${dto.amount}5802VN6304`,
      signature,
      paidAt: null,
      createdAt: now,
      updatedAt: now,
    };

    this.ordersByCode.set(orderCode, order);
    return order;
  }

  /**
   * DEC-04: Tuyệt đối không dùng Client Redirect URL để cập nhật trạng thái PAID.
   * Endpoint này chỉ đọc trạng thái hiện tại từ Server.
   */
  checkClientRedirectReturn(orderCode: number): {
    orderCode: number;
    status: PaymentOrderStatus;
    trustedSource: 'WEBHOOK_ONLY';
    message: string;
  } {
    const order = this.ordersByCode.get(Number(orderCode));
    if (!order) {
      throw new NotFoundException(`Không tìm thấy đơn thanh toán ${orderCode}.`);
    }

    return {
      orderCode: order.orderCode,
      status: order.status,
      trustedSource: 'WEBHOOK_ONLY',
      message:
        order.status === PaymentOrderStatus.PAID
          ? 'Đơn hàng đã được xác nhận PAID thông qua Webhook PayOS hợp lệ.'
          : 'Đang chờ xác nhận từ PayOS Webhook. Client redirect không có quyền chuyển trạng thái sang PAID.',
    };
  }

  handlePayosWebhook(payload: PayosWebhookBodyDto): {
    acknowledged: boolean;
    idempotentReplay: boolean;
    orderCode: number;
    orderStatus: PaymentOrderStatus;
    webhookEventId: string;
  } {
    if (!payload || !payload.data || !payload.data.orderCode) {
      throw new BadRequestException('Payload Webhook PayOS thiếu dữ liệu data.orderCode.');
    }

    const isValidSig = verifyPayosWebhookSignature(
      payload.data,
      payload.signature,
    );
    if (!isValidSig) {
      throw new BadRequestException({
        code: 'INVALID_PAYOS_SIGNATURE',
        message: 'Chữ ký HMAC-SHA256 của Webhook PayOS không hợp lệ.',
      });
    }

    const orderCode = Number(payload.data.orderCode);
    const order = this.ordersByCode.get(orderCode);
    if (!order) {
      throw new NotFoundException(`Không tìm thấy đơn thanh toán ${orderCode}.`);
    }

    if (Number(payload.data.amount) !== order.amount) {
      throw new BadRequestException(
        `Số tiền trong Webhook (${payload.data.amount}) không khớp với số tiền của đơn hàng (${order.amount}).`,
      );
    }

    const idempotencyKey =
      payload.idempotencyKey?.trim() ||
      `PAYOS-${orderCode}-${payload.data.reference}`;

    const existingEvent = this.webhookEventsByKey.get(idempotencyKey);
    if (existingEvent) {
      return {
        acknowledged: true,
        idempotentReplay: true,
        orderCode: order.orderCode,
        orderStatus: order.status,
        webhookEventId: existingEvent.id,
      };
    }

    const now = new Date().toISOString();
    const webhookEvent: PayosWebhookEventEntity = {
      id: `webhook-evt-${this.webhookSequence++}`,
      provider: 'PAYOS',
      idempotencyKey,
      orderCode,
      rawPayload: payload,
      signature: payload.signature,
      processedAt: now,
    };

    this.webhookEventsByKey.set(idempotencyKey, webhookEvent);

    if (payload.success && payload.code === '00' && payload.data.code === '00') {
      order.status = PaymentOrderStatus.PAID;
      order.paidAt = now;
      order.updatedAt = now;
      this.ordersByCode.set(orderCode, order);
    } else {
      order.status = PaymentOrderStatus.FAILED;
      order.updatedAt = now;
      this.ordersByCode.set(orderCode, order);
    }

    return {
      acknowledged: true,
      idempotentReplay: false,
      orderCode: order.orderCode,
      orderStatus: order.status,
      webhookEventId: webhookEvent.id,
    };
  }

  /**
   * Tiện ích phục vụ Spike/Demo trên môi trường SANDBOX để tạo payload Webhook có chữ ký HMAC chuẩn
   */
  buildSignedSandboxWebhookPayload(
    orderCode: number,
    reference = 'FT26306999999',
  ): PayosWebhookBodyDto {
    const order = this.ordersByCode.get(Number(orderCode));
    if (!order) {
      throw new NotFoundException(`Không tìm thấy đơn thanh toán ${orderCode}.`);
    }

    const data = {
      orderCode: order.orderCode,
      amount: order.amount,
      description: order.description,
      reference,
      transactionDateTime: new Date().toISOString(),
      code: '00',
      desc: 'Thành công',
    };

    const signature = createPayosWebhookSignature(data);
    return {
      code: '00',
      desc: 'success',
      success: true,
      data,
      signature,
      idempotencyKey: `PAYOS-${order.orderCode}-${reference}`,
    };
  }

  listOrdersForProject(
    user: JwtPayload,
    projectId?: string,
  ): PayosPaymentOrderEntity[] {
    const all = Array.from(this.ordersByCode.values());
    const filtered = projectId
      ? all.filter((o) => o.projectId === projectId)
      : all;

    if (
      user.role === UserRole.LAB_ADMIN ||
      user.role === UserRole.SYSTEM_ADMIN
    ) {
      return filtered;
    }

    return filtered.filter((o) => o.enterpriseUserId === user.sub);
  }
}