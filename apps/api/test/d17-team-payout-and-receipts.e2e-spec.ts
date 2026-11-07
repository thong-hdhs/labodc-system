import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Day 17 — Team 70% Member Contribution Split, Bank Payout Execution & Enterprise Financial Receipt (E2E)', () => {
  let app: INestApplication;
  let enterpriseAToken: string;
  let enterpriseBToken: string;
  let labAdminToken: string;
  let mentorToken: string;
  let talentToken: string;
  let projectId: string;
  let milestoneId: string;

  const password =
    process.env.INITIAL_SYSADMIN_PASSWORD || 'ChangeMe_LabOdc@2026!';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    const [loginEntA, loginEntB, loginLab, loginMentor, loginTalent] =
      await Promise.all([
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
          .send({ email: 'mentor@labodc.uth.edu.vn', password })
          .expect(200),
        request(app.getHttpServer())
          .post('/api/v1/auth/login')
          .send({ email: 'talent@student.uth.edu.vn', password })
          .expect(200),
      ]);

    enterpriseAToken = loginEntA.body.accessToken;
    enterpriseBToken = loginEntB.body.accessToken;
    labAdminToken = loginLab.body.accessToken;
    mentorToken = loginMentor.body.accessToken;
    talentToken = loginTalent.body.accessToken;

    // 1. Khởi tạo Hồ sơ Doanh nghiệp A (VERIFIED) & Dự án được Lab Admin APPROVED
    const profileRes = await request(app.getHttpServer())
      .post('/api/v1/enterprises/profile')
      .set('Authorization', `Bearer ${enterpriseAToken}`)
      .send({
        companyName: 'Công ty Cổ phần Thanh toán Quốc tế D17',
        taxCode: '0318881717',
        industry: 'FinTech & Enterprise ERP',
        address: 'Quận 1, TP.HCM',
        representativeName: 'Phạm Đại Diện D17',
        contactEmail: 'contact@fintech-d17.vn',
        contactPhone: '0909171717',
      })
      .expect(200);

    await request(app.getHttpServer())
      .patch(`/api/v1/enterprises/${profileRes.body.id}/verify`)
      .set('Authorization', `Bearer ${labAdminToken}`)
      .send({
        status: 'VERIFIED',
        note: 'Xác thực doanh nghiệp phục vụ kiểm thử D17.',
      })
      .expect(200);

    const draftRes = await request(app.getHttpServer())
      .post('/api/v1/projects/proposals')
      .set('Authorization', `Bearer ${enterpriseAToken}`)
      .send({
        title: 'Hệ thống Phân bổ Thù lao Thành viên và Quyết toán Ngân hàng D17',
        summary: 'Chia quỹ 70% cho từng thành viên theo % đóng góp và xuất biên lai tài chính.',
        description:
          'Xây dựng module phân bổ chi tiết gói 70% thù lao nhóm sinh viên, thực thi lệnh chi trả ngân hàng và cấp biên lai doanh nghiệp.',
        deliverables: 'API Phân bổ thù lao thành viên, Lệnh chi trả ngân hàng, Biên lai tài chính.',
        requiredSkills: ['TypeScript', 'NestJS', 'React', 'PostgreSQL'],
        minTeamSize: 3,
        maxTeamSize: 5,
        durationWeeks: 8,
        budgetAmount: 10000003,
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
      .send({ reviewNote: 'Duyệt dự án D17.' })
      .expect(200);

    // 2. Tạo Cột mốc 10,000,003 VND -> Đồng bộ Webhook -> Nộp bàn giao -> Nghiệm thu 70/20/10
    const msRes = await request(app.getHttpServer())
      .post('/api/v1/payments/milestones')
      .set('Authorization', `Bearer ${enterpriseAToken}`)
      .send({
        projectId,
        title: 'Cột mốc 1 (D17) - Nghiệm thu và Chia Thù lao Thành viên',
        description: 'Kiểm chứng chia gói 70% (7,000,002 VND) cho 3 thành viên.',
        amount: 10000003,
      })
      .expect(201);

    milestoneId = msRes.body.id;

    await request(app.getHttpServer())
      .post(`/api/v1/payments/milestones/${milestoneId}/sync-payos-webhook`)
      .set('Authorization', `Bearer ${enterpriseAToken}`)
      .send({ reference: 'FT-PAYOS-D17-001' })
      .expect(200);

    await request(app.getHttpServer())
      .post(`/api/v1/payments/milestones/${milestoneId}/submit-deliverable`)
      .set('Authorization', `Bearer ${talentToken}`)
      .send({
        deliverableUrl: 'https://github.com/thong-hdhs/labodc-system/releases/tag/v1.7',
        deliverableNote: 'Hoàn tất bàn giao cột mốc D17.',
      })
      .expect(200);

    await request(app.getHttpServer())
      .post(`/api/v1/payments/milestones/${milestoneId}/accept-and-split`)
      .set('Authorization', `Bearer ${enterpriseAToken}`)
      .send({
        reviewNote: 'Nghiệm thu cột mốc D17 và tách quỹ 70/20/10.',
        markProjectCompleted: true,
      })
      .expect(200);
  });

  afterAll(async () => {
    await app.close();
  });

  it('TC-FIN-D17-01 & TC-FIN-D17-02: Phân bổ Quỹ 70% (7,000,002 VND) cho từng thành viên theo % đóng góp -> Thực thi Lệnh Chi trả Ngân hàng -> Xuất Biên lai Tài chính Doanh nghiệp', async () => {
    // 1. Mentor phân bổ Quỹ 70% (7,000,002 VND) cho 3 thành viên với tỷ lệ 34% / 33% / 33%
    const distRes = await request(app.getHttpServer())
      .post(`/api/v1/payments/milestones/${milestoneId}/distribute-team-pool`)
      .set('Authorization', `Bearer ${mentorToken}`)
      .send({
        members: [
          {
            memberUserId: 'talent-leader-d17',
            memberName: 'Nguyễn Nhóm Trưởng D17',
            memberRole: 'TALENT_LEADER',
            contributionPercentage: 34,
          },
          {
            memberUserId: 'talent-member-2-d17',
            memberName: 'Trần Thành Viên 2 D17',
            memberRole: 'TALENT',
            contributionPercentage: 33,
          },
          {
            memberUserId: 'talent-member-3-d17',
            memberName: 'Lê Thành Viên 3 D17',
            memberRole: 'TALENT',
            contributionPercentage: 33,
          },
        ],
        note: 'Phân bổ thù lao dựa trên kết quả đánh giá đóng góp thành viên D17.',
      })
      .expect(200);

    expect(distRes.body.teamPool70AmountVnd).toBe(7000002);
    expect(distRes.body.totalAllocatedVnd).toBe(7000002);
    expect(distRes.body.remainderAbsorbedByLeaderVnd).toBe(2);
    expect(distRes.body.invariantHold).toBe(true);
    expect(distRes.body.allocations).toHaveLength(3);

    // 2. Chặn ENTERPRISE tự gọi API thực thi lệnh chi trả ngân hàng của Lab Admin (403 Forbidden)
    await request(app.getHttpServer())
      .post(`/api/v1/payments/milestones/${milestoneId}/execute-payouts`)
      .set('Authorization', `Bearer ${enterpriseAToken}`)
      .send({ bankTransferRefPrefix: 'BNK-UNAUTHORIZED' })
      .expect(403);

    // 3. LAB_ADMIN thực thi Lệnh Chi trả Giải ngân qua Ngân hàng cho 70% Nhóm / 20% Mentor / 10% Lab
    const payoutRes = await request(app.getHttpServer())
      .post(`/api/v1/payments/milestones/${milestoneId}/execute-payouts`)
      .set('Authorization', `Bearer ${labAdminToken}`)
      .send({
        bankTransferRefPrefix: 'BNK-D17-SETTLE',
        note: 'Đã ủy nhiệm chi qua ngân hàng cho Nhóm SV, Mentor và Quỹ Lab.',
      })
      .expect(200);

    expect(payoutRes.body.totalPaidOutVnd).toBe(10000003);
    expect(payoutRes.body.orders).toHaveLength(3);

    // 4. Chặn gọi chi trả lặp lần 2 cho cùng cột mốc (409 Conflict - PAYOUT_ALREADY_EXECUTED)
    await request(app.getHttpServer())
      .post(`/api/v1/payments/milestones/${milestoneId}/execute-payouts`)
      .set('Authorization', `Bearer ${labAdminToken}`)
      .send({ bankTransferRefPrefix: 'BNK-D17-DUPLICATE' })
      .expect(409);

    // 5. Chặn Doanh nghiệp B xem Biên lai Tài chính của Doanh nghiệp A (403 Forbidden)
    await request(app.getHttpServer())
      .get(`/api/v1/payments/milestones/${milestoneId}/financial-receipt`)
      .set('Authorization', `Bearer ${enterpriseBToken}`)
      .expect(403);

    // 6. Doanh nghiệp A xuất Biên lai Tài chính Cột mốc -> Khớp 100% số tiền và danh sách phân bổ thành viên
    const receiptRes = await request(app.getHttpServer())
      .get(`/api/v1/payments/milestones/${milestoneId}/financial-receipt`)
      .set('Authorization', `Bearer ${enterpriseAToken}`)
      .expect(200);

    expect(receiptRes.body.grossAmountVnd).toBe(10000003);
    expect(receiptRes.body.payoutExecutionStatus).toBe('PAID_OUT_COMPLETED');
    expect(receiptRes.body.splitBreakdown).toEqual({
      team70AmountVnd: 7000002,
      mentor20AmountVnd: 2000000,
      lab10AmountVnd: 1000001,
      remainderAbsorbedByLabVnd: 1,
    });
    expect(receiptRes.body.teamMemberAllocations).toHaveLength(3);
  });
});