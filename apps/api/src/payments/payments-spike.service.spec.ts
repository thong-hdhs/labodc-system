import { BadRequestException } from '@nestjs/common';
import { JwtPayload, UserRole, UserStatus } from '@labodc/shared-types';
import { ProjectProposalRepository } from '../projects/project-proposal.repository';
import { PaymentsSpikeService } from './payments-spike.service';
import { PaymentOrderStatus } from './payos-spike.types';

describe('PaymentsSpikeService Unit Tests (D9 - PayOS Sandbox & Webhook HMAC Spike)', () => {
  let service: PaymentsSpikeService;
  let projectRepository: ProjectProposalRepository;
  let projectId: string;

  const enterpriseA: JwtPayload = {
    sub: '00000000-0000-4000-8000-000000000003',
    email: 'enterprise@company.vn',
    role: UserRole.ENTERPRISE,
    status: UserStatus.ACTIVE,
  };

  beforeEach(() => {
    projectRepository = new ProjectProposalRepository();
    service = new PaymentsSpikeService(projectRepository);

    const draft = projectRepository.createDraft({
      ownerUserId: enterpriseA.sub,
      enterpriseId: 'ent-profile-1',
      companyName: 'Công ty Cổ phần Phần mềm UTH',
      dto: {
        title: 'Dự án Spike Tích hợp Thanh toán PayOS Sandbox',
        budgetAmount: 30000000,
      },
    });
    projectId = draft.id;
  });

  it('Tạo lệnh thanh toán PayOS Sandbox ở trạng thái PENDING_PAYMENT và không cho phép Client Redirect tự chuyển sang PAID', () => {
    const order = service.createSandboxPaymentOrder(enterpriseA, {
      projectId,
      milestoneName: 'Đợt 1 - Khởi động dự án',
      amount: 15000000,
    });

    expect(order.paymentMode).toBe('SANDBOX');
    expect(order.status).toBe(PaymentOrderStatus.PENDING_PAYMENT);
    expect(order.signature).toHaveLength(64);

    const redirectCheck = service.checkClientRedirectReturn(order.orderCode);
    expect(redirectCheck.status).toBe(PaymentOrderStatus.PENDING_PAYMENT);
    expect(redirectCheck.trustedSource).toBe('WEBHOOK_ONLY');
  });

  it('Chặn Webhook có chữ ký HMAC-SHA256 giả mạo (400 Bad Request)', () => {
    const order = service.createSandboxPaymentOrder(enterpriseA, {
      projectId,
      milestoneName: 'Đợt 1',
      amount: 15000000,
    });

    const validPayload = service.buildSignedSandboxWebhookPayload(
      order.orderCode,
    );

    expect(() =>
      service.handlePayosWebhook({
        ...validPayload,
        signature: '0000000000000000000000000000000000000000000000000000000000000000',
      }),
    ).toThrow(BadRequestException);
  });

  it('Xử lý Webhook hợp lệ chuyển đơn sang PAID và đảm bảo tính Idempotent khi nhận trùng Webhook lần 2', () => {
    const order = service.createSandboxPaymentOrder(enterpriseA, {
      projectId,
      milestoneName: 'Đợt 1',
      amount: 15000000,
    });

    const signedWebhook = service.buildSignedSandboxWebhookPayload(
      order.orderCode,
      'FT26306888888',
    );

    const firstCall = service.handlePayosWebhook(signedWebhook);
    expect(firstCall.idempotentReplay).toBe(false);
    expect(firstCall.orderStatus).toBe(PaymentOrderStatus.PAID);

    // Gọi lặp lần 2 cùng payload (Replay Attack / Network Retry)
    const secondCall = service.handlePayosWebhook(signedWebhook);
    expect(secondCall.idempotentReplay).toBe(true);
    expect(secondCall.webhookEventId).toBe(firstCall.webhookEventId);
    expect(secondCall.orderStatus).toBe(PaymentOrderStatus.PAID);
  });
});