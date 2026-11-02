export enum PaymentOrderStatus {
  PENDING_PAYMENT = 'PENDING_PAYMENT',
  PAID = 'PAID',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export interface CreatePayosOrderDto {
  projectId: string;
  milestoneName: string;
  amount: number;
  description?: string;
  returnUrl?: string;
  cancelUrl?: string;
}

export interface PayosPaymentOrderEntity {
  id: string;
  orderCode: number;
  projectId: string;
  enterpriseUserId: string;
  milestoneName: string;
  amount: number;
  currency: 'VND';
  paymentMode: 'SANDBOX' | 'PRODUCTION';
  status: PaymentOrderStatus;
  description: string;
  returnUrl: string;
  cancelUrl: string;
  checkoutUrl: string;
  qrCode: string;
  signature: string;
  paidAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PayosWebhookDataPayload {
  orderCode: number;
  amount: number;
  description: string;
  reference: string;
  transactionDateTime: string;
  code: string;
  desc: string;
}

export interface PayosWebhookBodyDto {
  code: string;
  desc: string;
  success: boolean;
  data: PayosWebhookDataPayload;
  signature: string;
  idempotencyKey?: string;
}

export interface PayosWebhookEventEntity {
  id: string;
  provider: 'PAYOS';
  idempotencyKey: string;
  orderCode: number;
  rawPayload: PayosWebhookBodyDto;
  signature: string;
  processedAt: string;
}