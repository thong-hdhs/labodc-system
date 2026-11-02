import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Day 9 Vertical Slice — Publish Lifecycle Controls & PayOS Sandbox Spike', () => {
  let app: INestApplication;
  let enterpriseAToken: string;
  let labAdminToken: string;
  let projectId: string;
  let orderCode: number;

  const password =
    process.env.INITIAL_SYSADMIN_PASSWORD || 'ChangeMe_LabOdc@2026!';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    const loginEnt = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'enterprise@company.vn', password })
      .expect(200);
    enterpriseAToken = loginEnt.body.accessToken;

    const loginLab = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'labadmin@labodc.uth.edu.vn', password })
      .expect(200);
    labAdminToken = loginLab.body.accessToken;

    const entRes = await request(app.getHttpServer())
      .post('/api/v1/enterprises/profile')
      .set('Authorization', `Bearer ${enterpriseAToken}`)
      .send({
        companyName: 'Công ty Cổ phần Fintech UTH',
        taxCode: '0377778888',
        industry: 'Fintech & Payment',
        address: 'Quận 1, TP.HCM',
        representativeName: 'Hoàng Đại Diện',
        contactEmail: 'contact@uthfintech.vn',
        contactPhone: '0933444555',
      })
      .expect(200);

    await request(app.getHttpServer())
      .patch(`/api/v1/enterprises/${entRes.body.id}/verify`)
      .set('Authorization', `Bearer ${labAdminToken}`)
      .send({ status: 'VERIFIED', note: 'Đã xác minh pháp nhân.' })
      .expect(200);

    const draftRes = await request(app.getHttpServer())
      .post('/api/v1/projects/proposals')
      .set('Authorization', `Bearer ${enterpriseAToken}`)
      .send({
        title: 'Cổng Thanh toán Học phí và Quỹ Dự án UTH PayOS',
        summary: 'Tích hợp VietQR và đối soát sổ cái tự động theo tỷ lệ 70/20/10.',
        description:
          'Xây dựng phân hệ tạo lệnh thanh toán, xác thực chữ ký HMAC-SHA256 và báo cáo minh bạch.',
        deliverables: 'Module Payments NestJS, Giao diện đối soát React, Bộ kiểm thử E2E.',
        requiredSkills: ['NestJS', 'TypeScript', 'PayOS', 'PostgreSQL'],
        minTeamSize: 3,
        maxTeamSize: 5,
        durationWeeks: 10,
        budgetAmount: 50000000,
      })
      .expect(201);

    projectId = draftRes.body.id;

    await request(app.getHttpServer())
      .post(`/api/v1/projects/proposals/${projectId}/submit`)
      .set('Authorization', `Bearer ${enterpriseAToken}`)
      .expect(200);

    await request(app.getHttpServer())
      .post(`/api/v1/lab-admin/proposals/${projectId}/approve`)
      .set('Authorization', `Bearer ${labAdminToken}`)
      .send({ reviewNote: 'Phê duyệt đề xuất cho ngày D9.' })
      .expect(200);
  });

  it('TC-LAB-03 (D9): Điều khiển Publish -> Unpublish -> Re-Publish -> Close Recruitment & Kiểm tra Hợp đồng Recruitment Eligibility', async () => {
    const futureClose = new Date(Date.now() + 10 * 86400000).toISOString();

    // 1. Khi mới APPROVED, kiểm tra điều kiện ứng tuyển phải trả về isOpenForApplications = false
    const beforePub = await request(app.getHttpServer())
      .get(`/api/v1/projects/${projectId}/recruitment-eligibility`)
      .expect(200);
    expect(beforePub.body.isOpenForApplications).toBe(false);

    // 2. Lab Admin Publish dự án -> isOpenForApplications = true
    await request(app.getHttpServer())
      .post(`/api/v1/lab-admin/projects/${projectId}/publish`)
      .set('Authorization', `Bearer ${labAdminToken}`)
      .send({ registrationCloseAt: futureClose })
      .expect(200);

    const afterPub = await request(app.getHttpServer())
      .get(`/api/v1/projects/${projectId}/recruitment-eligibility`)
      .expect(200);
    expect(afterPub.body.isOpenForApplications).toBe(true);
    expect(afterPub.body.status).toBe('PUBLISHED');

    // 3. Tìm kiếm dự án công khai theo keyword và skill
    const searchRes = await request(app.getHttpServer())
      .get('/api/v1/projects/public?keyword=PayOS&skill=NestJS')
      .expect(200);
    expect(searchRes.body.length).toBe(1);
    expect(searchRes.body[0].id).toBe(projectId);

    // 4. Lab Admin tạm ẩn (Unpublish) -> biến mất khỏi danh sách công khai
    await request(app.getHttpServer())
      .post(`/api/v1/lab-admin/projects/${projectId}/unpublish`)
      .set('Authorization', `Bearer ${labAdminToken}`)
      .expect(200);

    const unpubCheck = await request(app.getHttpServer())
      .get(`/api/v1/projects/${projectId}/recruitment-eligibility`)
      .expect(200);
    expect(unpubCheck.body.isOpenForApplications).toBe(false);

    // 5. Lab Admin mở lại công bố (Re-Publish) -> Đóng nhận đơn (Close Recruitment)
    await request(app.getHttpServer())
      .post(`/api/v1/lab-admin/projects/${projectId}/publish`)
      .set('Authorization', `Bearer ${labAdminToken}`)
      .send({ registrationCloseAt: futureClose })
      .expect(200);

    await request(app.getHttpServer())
      .post(`/api/v1/lab-admin/projects/${projectId}/close-recruitment`)
      .set('Authorization', `Bearer ${labAdminToken}`)
      .expect(200);

    const closedCheck = await request(app.getHttpServer())
      .get(`/api/v1/projects/${projectId}/recruitment-eligibility`)
      .expect(200);
    expect(closedCheck.body.status).toBe('RECRUITMENT_CLOSED');
    expect(closedCheck.body.isOpenForApplications).toBe(false);
  });

  it('TC-FIN-SPIKE-01 & 02 (D9): Tạo lệnh PayOS Sandbox, chặn Client Redirect giả mạo, xác thực HMAC Webhook và chống cộng trùng Idempotency', async () => {
    // 1. Doanh nghiệp tạo lệnh thanh toán đợt 1 trên PayOS Sandbox
    const createOrderRes = await request(app.getHttpServer())
      .post('/api/v1/payments/orders')
      .set('Authorization', `Bearer ${enterpriseAToken}`)
      .send({
        projectId,
        milestoneName: 'Đợt 1 - Tạm ứng khởi động dự án',
        amount: 20000000,
      })
      .expect(201);

    expect(createOrderRes.body.paymentMode).toBe('SANDBOX');
    expect(createOrderRes.body.status).toBe('PENDING_PAYMENT');
    orderCode = createOrderRes.body.orderCode;

    // 2. Giả lập người dùng tự gọi URL return-check trên trình duyệt khi chưa có Webhook -> vẫn là PENDING_PAYMENT
    const redirectRes = await request(app.getHttpServer())
      .get(`/api/v1/payments/orders/${orderCode}/return-check`)
      .expect(200);
    expect(redirectRes.body.status).toBe('PENDING_PAYMENT');

    // 3. Kẻ tấn công gửi Webhook giả mạo chữ ký HMAC -> bị chặn 400 Bad Request
    await request(app.getHttpServer())
      .post('/api/v1/payments/webhooks/payos')
      .send({
        code: '00',
        desc: 'success',
        success: true,
        data: {
          orderCode,
          amount: 20000000,
          description: 'FAKE WEBHOOK',
          reference: 'FT_FAKE',
          transactionDateTime: new Date().toISOString(),
          code: '00',
          desc: 'Thành công',
        },
        signature: 'invalid_hmac_signature_1234567890',
      })
      .expect(400);

    // 4. Kích hoạt Webhook hợp lệ có chữ ký HMAC-SHA256 chuẩn từ Sandbox -> chuyển sang PAID
    const firstWebhookRes = await request(app.getHttpServer())
      .post(`/api/v1/payments/orders/${orderCode}/simulate-signed-webhook`)
      .set('Authorization', `Bearer ${enterpriseAToken}`)
      .send({ reference: 'FT26309111222' })
      .expect(200);

    expect(firstWebhookRes.body.acknowledged).toBe(true);
    expect(firstWebhookRes.body.idempotentReplay).toBe(false);
    expect(firstWebhookRes.body.orderStatus).toBe('PAID');

    // 5. Bắn lại cùng Webhook đó lần thứ 2 (Replay) -> trả 200 OK kèm idempotentReplay = true
    const replayWebhookRes = await request(app.getHttpServer())
      .post(`/api/v1/payments/orders/${orderCode}/simulate-signed-webhook`)
      .set('Authorization', `Bearer ${enterpriseAToken}`)
      .send({ reference: 'FT26309111222' })
      .expect(200);

    expect(replayWebhookRes.body.idempotentReplay).toBe(true);
    expect(replayWebhookRes.body.webhookEventId).toBe(
      firstWebhookRes.body.webhookEventId,
    );
  });

  afterAll(async () => {
    await app.close();
  });
});