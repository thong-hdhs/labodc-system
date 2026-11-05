import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { ProjectStatus } from '@labodc/shared-types';

describe('Day 13 — PayOS Webhook Escrow Sync, Deliverable Revision, Escrow Refund & Global Reconciliation (E2E)', () => {
  let app: INestApplication;
  let enterpriseAToken: string;
  let enterpriseBToken: string;
  let labAdminToken: string;
  let talentToken: string;
  let projectId: string;

  const password =
    process.env.INITIAL_SYSADMIN_PASSWORD || 'ChangeMe_LabOdc@2026!';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    const [loginEntA, loginEntB, loginLab, loginTalent] = await Promise.all([
      request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'enterprise@company.vn', password })
        .expect(200),
      request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'enterprise2@company.vn', password })
        .expect(200),
      request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'labadmin@labodc.uth.edu.vn', password })
        .expect(200),
      request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'talent@student.uth.edu.vn', password })
        .expect(200),
    ]);

    enterpriseAToken = loginEntA.body.accessToken;
    enterpriseBToken = loginEntB.body.accessToken;
    labAdminToken = loginLab.body.accessToken;
    talentToken = loginTalent.body.accessToken;

    // Chuẩn bị Hồ sơ Doanh nghiệp A (VERIFIED) & Dự án đã được Lab Admin APPROVED
    const profileRes = await request(app.getHttpServer())
      .post('/api/v1/enterprises/profile')
      .set('Authorization', `Bearer ${enterpriseAToken}`)
      .send({
        companyName: 'Công ty Cổ phần Công nghệ Tài chính D13',
        taxCode: '0317778889',
        industry: 'FinTech & Smart Logistics',
        address: 'Quận 1, TP.HCM',
        representativeName: 'Nguyễn Đại Diện D13',
        contactEmail: 'contact@fintech-d13.vn',
        contactPhone: '0909888777',
      })
      .expect(200);

    await request(app.getHttpServer())
      .patch(`/api/v1/enterprises/${profileRes.body.id}/verify`)
      .set('Authorization', `Bearer ${labAdminToken}`)
      .send({
        status: 'VERIFIED',
        note: 'Xác thực doanh nghiệp D13 hợp lệ.',
      })
      .expect(200);

    const draftRes = await request(app.getHttpServer())
      .post('/api/v1/projects/proposals')
      .set('Authorization', `Bearer ${enterpriseAToken}`)
      .send({
        title: 'Nền tảng Đối soát Sổ cái Bất biến và Hoàn trả Ký quỹ D13',
        summary: 'Tự động hóa đối soát Webhook PayOS, yêu cầu sửa bàn giao và hoàn trả ký quỹ.',
        description:
          'Xây dựng cơ chế chống cộng trùng Sổ cái khi nhận Webhook PayOS nhiều lần và đối soát toàn cục.',
        deliverables: 'Module Đối soát Webhook, Module Hoàn trả Ký quỹ, Báo cáo Sổ cái.',
        requiredSkills: ['TypeScript', 'NestJS', 'React', 'PostgreSQL'],
        minTeamSize: 3,
        maxTeamSize: 5,
        durationWeeks: 10,
        budgetAmount: 45000000,
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
      .send({ reviewNote: 'Duyệt dự án phục vụ kiểm thử D13.' })
      .expect(200);
  });

  afterAll(async () => {
    await app.close();
  });

  it('TC-FIN-D13-01 & TC-FIN-D13-02: Đồng bộ PayOS Webhook Idempotent (không cộng trùng Sổ cái), Yêu cầu sửa lại bàn giao (Revision) -> Nộp lại -> Nghiệm thu 70/20/10', async () => {
    // 1. Tạo Cột mốc 1 (20,000,003 VND)
    const ms1Res = await request(app.getHttpServer())
      .post('/api/v1/payments/milestones')
      .set('Authorization', `Bearer ${enterpriseAToken}`)
      .send({
        projectId,
        title: 'Cột mốc 1 - Tích hợp Đối soát Tự động PayOS Webhook',
        description: 'Bàn giao module đồng bộ tự động PayOS Webhook sang Sổ cái.',
        amount: 20000003,
      })
      .expect(201);

    const ms1Id = ms1Res.body.id;

    // 2. Đồng bộ PayOS Webhook lần 1 -> ESCROW_PAID & Dự án sang IN_PROGRESS
    const sync1 = await request(app.getHttpServer())
      .post(`/api/v1/payments/milestones/${ms1Id}/sync-payos-webhook`)
      .set('Authorization', `Bearer ${enterpriseAToken}`)
      .send({ reference: 'FT-PAYOS-D13-001' })
      .expect(200);

    expect(sync1.body.idempotentReplay).toBe(false);
    expect(sync1.body.signatureVerified).toBe(true);
    expect(sync1.body.milestone.status).toBe('ESCROW_PAID');
    expect(sync1.body.projectStatus).toBe(ProjectStatus.IN_PROGRESS);

    // 3. Đồng bộ PayOS Webhook lặp lại lần 2 (Replay) -> idempotentReplay = true, không ghi trùng Sổ cái
    const sync2 = await request(app.getHttpServer())
      .post(`/api/v1/payments/milestones/${ms1Id}/sync-payos-webhook`)
      .set('Authorization', `Bearer ${enterpriseAToken}`)
      .send({ reference: 'FT-PAYOS-D13-001' })
      .expect(200);

    expect(sync2.body.idempotentReplay).toBe(true);
    expect(sync2.body.ledgerEntry.id).toBe(sync1.body.ledgerEntry.id);

    // 4. Sinh viên nộp bàn giao lần 1 (v1)
    await request(app.getHttpServer())
      .post(`/api/v1/payments/milestones/${ms1Id}/submit-deliverable`)
      .set('Authorization', `Bearer ${talentToken}`)
      .send({
        deliverableUrl: 'https://github.com/thong-hdhs/labodc-system/releases/tag/v1.3-rc1',
        deliverableNote: 'Bản bàn giao lần 1 của cột mốc 1.',
      })
      .expect(200);

    // 5. Doanh nghiệp A kiểm tra và yêu cầu chỉnh sửa lại bàn giao (SUBMITTED -> ESCROW_PAID)
    const revRes = await request(app.getHttpServer())
      .post(`/api/v1/payments/milestones/${ms1Id}/request-revision`)
      .set('Authorization', `Bearer ${enterpriseAToken}`)
      .send({
        revisionNote: 'Cần bổ sung thêm kịch bản kiểm thử Idempotent Replay cho Sổ cái.',
      })
      .expect(200);

    expect(revRes.body.status).toBe('ESCROW_PAID');
    expect(revRes.body.revisionCount).toBe(1);

    // 6. Sinh viên nộp lại bản bàn giao đã cập nhật (v2) -> SUBMITTED
    const resubmitRes = await request(app.getHttpServer())
      .post(`/api/v1/payments/milestones/${ms1Id}/submit-deliverable`)
      .set('Authorization', `Bearer ${talentToken}`)
      .send({
        deliverableUrl: 'https://github.com/thong-hdhs/labodc-system/releases/tag/v1.3-final',
        deliverableNote: 'Đã bổ sung đầy đủ test case Idempotent Replay theo yêu cầu.',
      })
      .expect(200);

    expect(resubmitRes.body.status).toBe('SUBMITTED');

    // 7. Doanh nghiệp A nghiệm thu & giải ngân 70/20/10
    const acceptRes = await request(app.getHttpServer())
      .post(`/api/v1/payments/milestones/${ms1Id}/accept-and-split`)
      .set('Authorization', `Bearer ${enterpriseAToken}`)
      .send({
        reviewNote: 'Bản bàn giao v2 đạt chuẩn nghiệm thu.',
        markProjectCompleted: false,
      })
      .expect(200);

    expect(acceptRes.body.milestone.status).toBe('DISBURSED');
    expect(acceptRes.body.splitBreakdown).toEqual({
      totalAmount: 20000003,
      teamAmount70: 14000002,
      mentorAmount20: 4000000,
      labAmount10: 2000001,
      remainderAbsorbedByLab: 1,
      invariantHold: true,
    });
  });

  it('TC-FIN-D13-03: Hoàn trả Ký quỹ (ESCROW_REFUND) cho Cột mốc chưa giải ngân, Chặn giải ngân sau khi hoàn tiền & Đối soát Tổng hợp Sổ cái Toàn hệ thống', async () => {
    // 1. Tạo Cột mốc 2 (15,000,000 VND) và nạp tiền ký quỹ
    const ms2Res = await request(app.getHttpServer())
      .post('/api/v1/payments/milestones')
      .set('Authorization', `Bearer ${enterpriseAToken}`)
      .send({
        projectId,
        title: 'Cột mốc 2 - Mở rộng Phân tích Nâng cao',
        description: 'Cột mốc mở rộng sẽ được hoàn trả ký quỹ do thu hẹp phạm vi.',
        amount: 15000000,
      })
      .expect(201);

    const ms2Id = ms2Res.body.id;

    await request(app.getHttpServer())
      .post(`/api/v1/payments/milestones/${ms2Id}/confirm-escrow`)
      .set('Authorization', `Bearer ${enterpriseAToken}`)
      .send({ note: 'Nạp ký quỹ cho Cột mốc 2.' })
      .expect(200);

    // 2. Doanh nghiệp B không được phép yêu cầu hoàn trả ký quỹ của Doanh nghiệp A (403 Forbidden)
    await request(app.getHttpServer())
      .post(`/api/v1/payments/milestones/${ms2Id}/refund-escrow`)
      .set('Authorization', `Bearer ${enterpriseBToken}`)
      .send({ refundReason: 'Doanh nghiệp B cố tình rút ký quỹ trái phép.' })
      .expect(403);

    // 3. Hoàn trả 100% ký quỹ Cột mốc 2 về cho Doanh nghiệp A -> REFUNDED & Số dư ký quỹ về 0
    const refundRes = await request(app.getHttpServer())
      .post(`/api/v1/payments/milestones/${ms2Id}/refund-escrow`)
      .set('Authorization', `Bearer ${labAdminToken}`)
      .send({
        refundReason: 'Hoàn trả 100% ký quỹ Cột mốc 2 theo quyết định thu hẹp phạm vi.',
      })
      .expect(200);

    expect(refundRes.body.milestone.status).toBe('REFUNDED');
    expect(refundRes.body.refundLedgerEntry.entryType).toBe('ESCROW_REFUND');
    expect(refundRes.body.refundLedgerEntry.amount).toBe(15000000);
    expect(refundRes.body.escrowBalanceAfterRefund).toBe(0);

    // 4. Chặn hoàn trả lặp lần 2 hoặc nộp bàn giao vào cột mốc đã REFUNDED (409 Conflict)
    await request(app.getHttpServer())
      .post(`/api/v1/payments/milestones/${ms2Id}/refund-escrow`)
      .set('Authorization', `Bearer ${labAdminToken}`)
      .send({ refundReason: 'Gọi hoàn trả lần 2 cho cột mốc đã hoàn tiền.' })
      .expect(409);

    // 5. Kiểm tra Báo cáo Đối soát Tổng hợp Sổ cái Toàn hệ thống (Chỉ LAB_ADMIN / SYSTEM_ADMIN)
    await request(app.getHttpServer())
      .get('/api/v1/payments/reconciliation/summary')
      .set('Authorization', `Bearer ${enterpriseAToken}`)
      .expect(403);

    const reconRes = await request(app.getHttpServer())
      .get('/api/v1/payments/reconciliation/summary')
      .set('Authorization', `Bearer ${labAdminToken}`)
      .expect(200);

    expect(reconRes.body.totalMilestones).toBe(2);
    expect(reconRes.body.milestonesByStatus).toEqual({
      planned: 0,
      escrowPaid: 0,
      submitted: 0,
      disbursed: 1,
      refunded: 1,
    });
    expect(reconRes.body.ledgerTotals).toEqual({
      totalEscrowDeposited: 35000003,
      totalDisbursed702010: 20000003,
      totalTeam70: 14000002,
      totalMentor20: 4000000,
      totalLab10: 2000001,
      totalRemainderAbsorbedByLab: 1,
      totalRefundedToEnterprise: 15000000,
      totalEscrowHeldBalance: 0,
      currency: 'VND',
    });
    expect(reconRes.body.invariantHold).toBe(true);
  });
});