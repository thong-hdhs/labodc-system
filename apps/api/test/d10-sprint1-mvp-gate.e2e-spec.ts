import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Day 10 Sprint 1 Review — End-to-End MVP Gate D10 Integration Suite (A + B)', () => {
  let app: INestApplication;
  let sysAdminToken: string;
  let labAdminToken: string;
  let enterpriseToken: string;
  let talentToken: string;

  const password =
    process.env.INITIAL_SYSADMIN_PASSWORD || 'ChangeMe_LabOdc@2026!';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    const [sysLogin, labLogin, entLogin, talLogin] = await Promise.all([
      request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'sysadmin@labodc.uth.edu.vn', password })
        .expect(200),
      request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'labadmin@labodc.uth.edu.vn', password })
        .expect(200),
      request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'enterprise@company.vn', password })
        .expect(200),
      request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'talent@student.uth.edu.vn', password })
        .expect(200),
    ]);

    sysAdminToken = sysLogin.body.accessToken;
    labAdminToken = labLogin.body.accessToken;
    enterpriseToken = entLogin.body.accessToken;
    talentToken = talLogin.body.accessToken;
  });

  it('TC-GATE-D10-01: Hành trình End-to-End Giai đoạn 1 (Health -> Enterprise KYC -> Proposal -> Lab Review & Publish -> Talent Explore -> PayOS Sandbox Webhook -> Gate Summary)', async () => {
    // 1. Kiểm tra Health Check Endpoint (ADR-05 & REQ-NFR-01)
    const healthRes = await request(app.getHttpServer())
      .get('/api/v1/health')
      .expect(200);
    expect(healthRes.body.status).toBe('UP');
    expect(healthRes.body.paymentMode).toBe('SANDBOX');

    // 2. Doanh nghiệp tạo/cập nhật Hồ sơ pháp nhân (REQ-ENT-01)
    const entProfileRes = await request(app.getHttpServer())
      .post('/api/v1/enterprises/profile')
      .set('Authorization', `Bearer ${enterpriseToken}`)
      .send({
        companyName: 'Tập đoàn Công nghệ Giao thông Số UTH',
        taxCode: '0399991111',
        industry: 'Smart Logistics & AI',
        address: 'TP. Thủ Đức, TP.HCM',
        representativeName: 'Nguyễn Giám Đốc',
        contactEmail: 'director@uthlogistics.vn',
        contactPhone: '0911222333',
      })
      .expect(200);

    const enterpriseId = entProfileRes.body.id;

    // 3. Lab Admin xác thực pháp nhân Doanh nghiệp sang VERIFIED
    await request(app.getHttpServer())
      .patch(`/api/v1/enterprises/${enterpriseId}/verify`)
      .set('Authorization', `Bearer ${labAdminToken}`)
      .send({
        status: 'VERIFIED',
        note: 'Nghiệm thu pháp nhân doanh nghiệp tại Gate D10.',
      })
      .expect(200);

    // 4. Doanh nghiệp tạo bản nháp đề xuất dự án (DRAFT) và gửi xét duyệt (SUBMITTED) (REQ-ENT-02)
    const draftRes = await request(app.getHttpServer())
      .post('/api/v1/projects/proposals')
      .set('Authorization', `Bearer ${enterpriseToken}`)
      .send({
        title: 'Hệ thống Điều phối Đội xe Thông minh UTH SmartFleet',
        summary: 'Ứng dụng AI và IoT tối ưu lộ trình vận tải cảng biển.',
        description:
          'Xây dựng nền tảng giám sát thời gian thực, phân tích hiệu suất đội xe và tích hợp thanh toán tự động.',
        deliverables: 'Backend NestJS, Web Portal React, Mobile App Flutter.',
        requiredSkills: ['TypeScript', 'NestJS', 'React', 'Flutter'],
        minTeamSize: 4,
        maxTeamSize: 6,
        durationWeeks: 12,
        budgetAmount: 80000000,
      })
      .expect(201);

    const projectId = draftRes.body.id;

    await request(app.getHttpServer())
      .post(`/api/v1/projects/proposals/${projectId}/submit`)
      .set('Authorization', `Bearer ${enterpriseToken}`)
      .expect(200);

    // 5. Lab Admin duyệt đề xuất (APPROVED) và Công bố dự án (PUBLISHED) (REQ-LAB-01)
    await request(app.getHttpServer())
      .post(`/api/v1/lab-admin/proposals/${projectId}/approve`)
      .set('Authorization', `Bearer ${labAdminToken}`)
      .send({ reviewNote: 'Đề xuất đạt chuẩn đưa vào học kỳ thực chiến.' })
      .expect(200);

    const closeDate = new Date(Date.now() + 14 * 86400000).toISOString();
    await request(app.getHttpServer())
      .post(`/api/v1/lab-admin/projects/${projectId}/publish`)
      .set('Authorization', `Bearer ${labAdminToken}`)
      .send({
        registrationCloseAt: closeDate,
        note: 'Công bố dự án tại cổng MVP Gate D10.',
      })
      .expect(200);

    // 6. Sinh viên (Talent) kiểm tra phiên đăng nhập và khám phá dự án PUBLISHED + điều kiện ứng tuyển (REQ-TAL-02)
    const talentMeRes = await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${talentToken}`)
      .expect(200);
    expect(talentMeRes.body.user.role).toBe('TALENT');

    const publicProjectsRes = await request(app.getHttpServer())
      .get('/api/v1/projects/public?keyword=SmartFleet&skill=NestJS')
      .expect(200);

    expect(publicProjectsRes.body.length).toBe(1);
    expect(publicProjectsRes.body[0].id).toBe(projectId);

    const publicDetailRes = await request(app.getHttpServer())
      .get(`/api/v1/projects/public/${projectId}`)
      .expect(200);
    expect(publicDetailRes.body.status).toBe('PUBLISHED');

    const eligibilityRes = await request(app.getHttpServer())
      .get(`/api/v1/projects/${projectId}/recruitment-eligibility`)
      .expect(200);
    expect(eligibilityRes.body.isOpenForApplications).toBe(true);

    // 7. Doanh nghiệp tạo lệnh thanh toán PayOS Sandbox & xác thực Webhook HMAC (REQ-FIN-01/02)
    const payOrderRes = await request(app.getHttpServer())
      .post('/api/v1/payments/orders')
      .set('Authorization', `Bearer ${enterpriseToken}`)
      .send({
        projectId,
        milestoneName: 'Đợt 1 - Đóng góp kinh phí khởi động SmartFleet',
        amount: 40000000,
      })
      .expect(201);

    const orderCode = payOrderRes.body.orderCode;

    const webhookRes = await request(app.getHttpServer())
      .post(`/api/v1/payments/orders/${orderCode}/simulate-signed-webhook`)
      .set('Authorization', `Bearer ${enterpriseToken}`)
      .send({ reference: 'FT26310999888' })
      .expect(200);

    expect(webhookRes.body.orderStatus).toBe('PAID');
    expect(webhookRes.body.idempotentReplay).toBe(false);

    // 8. System Admin kiểm tra báo cáo tổng hợp Cổng nghiệm thu MVP Gate D10
    const summaryRes = await request(app.getHttpServer())
      .get('/api/v1/system-admin/mvp-gate-summary')
      .set('Authorization', `Bearer ${sysAdminToken}`)
      .expect(200);

    expect(summaryRes.body.gateCode).toBe('GATE_D10_SPRINT_1');
    expect(summaryRes.body.enterprises.verified).toBeGreaterThanOrEqual(1);
    expect(summaryRes.body.projects.published).toBeGreaterThanOrEqual(1);
    expect(summaryRes.body.paymentsSandbox.paidOrders).toBe(1);
    expect(summaryRes.body.paymentsSandbox.totalPaidAmountVnd).toBe(40000000);
  });

  it('TC-GATE-D10-02: Bảo vệ nghiêm ngặt RBAC trên các API quản trị hệ thống của Gate D10 (403 Forbidden)', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/system-admin/mvp-gate-summary')
      .set('Authorization', `Bearer ${enterpriseToken}`)
      .expect(403);

    await request(app.getHttpServer())
      .get('/api/v1/system-admin/mvp-gate-summary')
      .set('Authorization', `Bearer ${talentToken}`)
      .expect(403);

    await request(app.getHttpServer())
      .get('/api/v1/system-admin/mvp-gate-summary')
      .set('Authorization', `Bearer ${labAdminToken}`)
      .expect(200);

    await request(app.getHttpServer())
      .get('/api/v1/system-admin/audit-logs')
      .set('Authorization', `Bearer ${labAdminToken}`)
      .expect(403);

    const logsRes = await request(app.getHttpServer())
      .get('/api/v1/system-admin/audit-logs')
      .set('Authorization', `Bearer ${sysAdminToken}`)
      .expect(200);
    expect(Array.isArray(logsRes.body)).toBe(true);
    expect(logsRes.body.length).toBeGreaterThanOrEqual(4);
  });

  afterAll(async () => {
    await app.close();
  });
});