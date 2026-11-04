import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { ProjectStatus } from '@labodc/shared-types';

describe('Day 12 — Project Escrow Milestones, Immutable Ledger & 70/20/10 Revenue Split (E2E)', () => {
  let app: INestApplication;
  let enterpriseAToken: string;
  let enterpriseBToken: string;
  let labAdminToken: string;
  let talentToken: string;

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
  });

  afterAll(async () => {
    await app.close();
  });

  it('TC-FIN-D12-01 & TC-FIN-D12-02: Full lifecycle (Create Milestone -> Confirm Escrow & Activate IN_PROGRESS -> Submit Deliverable -> Accept & 70/20/10 Split with Remainder -> Complete Project)', async () => {
    // 1. Doanh nghiệp A tạo hồ sơ & Lab Admin xác thực VERIFIED theo đúng contract D6-D10
    const profileRes = await request(app.getHttpServer())
      .post('/api/v1/enterprises/profile')
      .set('Authorization', `Bearer ${enterpriseAToken}`)
      .send({
        companyName: 'Công ty Cổ phần Logistics Cảng Biển D12',
        taxCode: '0319988776',
        industry: 'Smart Logistics',
        address: 'Quận 7, TP.HCM',
        representativeName: 'Trần Đại Diện D12',
        contactEmail: 'contact@portlogistics-d12.vn',
        contactPhone: '0909123456',
      })
      .expect(200);

    await request(app.getHttpServer())
      .patch(`/api/v1/enterprises/${profileRes.body.id}/verify`)
      .set('Authorization', `Bearer ${labAdminToken}`)
      .send({
        status: 'VERIFIED',
        note: 'Hồ sơ pháp nhân doanh nghiệp D12 hợp lệ.',
      })
      .expect(200);

    // 2. Doanh nghiệp A tạo đề xuất, gửi duyệt & Lab Admin phê duyệt APPROVED
    const draftRes = await request(app.getHttpServer())
      .post('/api/v1/projects/proposals')
      .set('Authorization', `Bearer ${enterpriseAToken}`)
      .send({
        title: 'Hệ thống Đối soát Ký quỹ và Sổ cái Tự động LabOdc D12',
        summary: 'Xây dựng phân hệ ký quỹ theo cột mốc và chia doanh thu 70/20/10.',
        description:
          'Dự án phát triển module quản lý cột mốc thanh toán, xác nhận ký quỹ và tự động chia doanh thu 70% sinh viên, 20% mentor, 10% quỹ Lab.',
        deliverables: 'Source code API, Báo cáo đối soát sổ cái 70/20/10.',
        requiredSkills: ['TypeScript', 'NestJS', 'React', 'PostgreSQL'],
        minTeamSize: 3,
        maxTeamSize: 5,
        durationWeeks: 8,
        budgetAmount: 30000000,
      })
      .expect(201);

    const projectId = draftRes.body.id;

    await request(app.getHttpServer())
      .post(`/api/v1/projects/proposals/${projectId}/submit`)
      .set('Authorization', `Bearer ${enterpriseAToken}`)
      .expect(200);

    await request(app.getHttpServer())
      .post(`/api/v1/lab-admin/proposals/${projectId}/approve`)
      .set('Authorization', `Bearer ${labAdminToken}`)
      .send({ reviewNote: 'Phê duyệt đề xuất dự án D12.' })
      .expect(200);

    // 3. Tạo cột mốc ký quỹ với số tiền lẻ 10,000,003 VND để kiểm tra xử lý phần dư (remainder)
    const milestoneRes = await request(app.getHttpServer())
      .post('/api/v1/payments/milestones')
      .set('Authorization', `Bearer ${enterpriseAToken}`)
      .send({
        projectId,
        title: 'Cột mốc 1 - Bàn giao Backend & Sổ cái Tài chính',
        description: 'Hoàn thiện API ký quỹ, đối soát và bộ kiểm thử tự động E2E.',
        amount: 10000003,
      })
      .expect(201);

    const milestoneId = milestoneRes.body.id;
    expect(milestoneRes.body.status).toBe('PLANNED');

    // 4. Xác nhận nạp tiền ký quỹ -> Cột mốc sang ESCROW_PAID & Dự án tự động sang IN_PROGRESS
    const escrowConfirmRes = await request(app.getHttpServer())
      .post(`/api/v1/payments/milestones/${milestoneId}/confirm-escrow`)
      .set('Authorization', `Bearer ${enterpriseAToken}`)
      .send({
        note: 'Doanh nghiệp A đã thanh toán ký quỹ qua PayOS Sandbox.',
      })
      .expect(200);

    expect(escrowConfirmRes.body.milestone.status).toBe('ESCROW_PAID');
    expect(escrowConfirmRes.body.projectStatus).toBe(ProjectStatus.IN_PROGRESS);
    expect(escrowConfirmRes.body.ledgerEntry.entryType).toBe('ESCROW_DEPOSIT');
    expect(escrowConfirmRes.body.ledgerEntry.amount).toBe(10000003);

    // 5. Sinh viên (TALENT) nộp kết quả bàn giao cột mốc
    const submitDeliverableRes = await request(app.getHttpServer())
      .post(`/api/v1/payments/milestones/${milestoneId}/submit-deliverable`)
      .set('Authorization', `Bearer ${talentToken}`)
      .send({
        deliverableUrl: 'https://github.com/thong-hdhs/labodc-system/releases/tag/v1.2',
        deliverableNote: 'Đã hoàn thành toàn bộ mã nguồn và tài liệu nghiệm thu cột mốc 1.',
      })
      .expect(200);

    expect(submitDeliverableRes.body.status).toBe('SUBMITTED');

    // 6. Kiểm tra phân quyền âm tính: TALENT không được phép tự nghiệm thu & giải ngân
    await request(app.getHttpServer())
      .post(`/api/v1/payments/milestones/${milestoneId}/accept-and-split`)
      .set('Authorization', `Bearer ${talentToken}`)
      .send({ markProjectCompleted: true })
      .expect(403);

    // 7. Doanh nghiệp A nghiệm thu cột mốc -> Tự động chia doanh thu 70/20/10 & Hoàn tất dự án COMPLETED
    const acceptRes = await request(app.getHttpServer())
      .post(`/api/v1/payments/milestones/${milestoneId}/accept-and-split`)
      .set('Authorization', `Bearer ${enterpriseAToken}`)
      .send({
        reviewNote: 'Nghiệm thu đạt yêu cầu, đồng ý giải ngân theo tỷ lệ 70/20/10.',
        markProjectCompleted: true,
      })
      .expect(200);

    expect(acceptRes.body.milestone.status).toBe('DISBURSED');
    expect(acceptRes.body.projectStatus).toBe(ProjectStatus.COMPLETED);
    expect(acceptRes.body.splitBreakdown).toEqual({
      totalAmount: 10000003,
      teamAmount70: 7000002,
      mentorAmount20: 2000000,
      labAmount10: 1000001,
      remainderAbsorbedByLab: 1,
      invariantHold: true,
    });
    expect(acceptRes.body.disbursements).toHaveLength(3);

    // 8. Kiểm tra sổ cái bất biến (Ledger) & Chặn Doanh nghiệp B truy cập trái phép (403 Forbidden)
    await request(app.getHttpServer())
      .get(`/api/v1/payments/projects/${projectId}/ledger`)
      .set('Authorization', `Bearer ${enterpriseBToken}`)
      .expect(403);

    const ledgerRes = await request(app.getHttpServer())
      .get(`/api/v1/payments/projects/${projectId}/ledger`)
      .set('Authorization', `Bearer ${enterpriseAToken}`)
      .expect(200);

    expect(ledgerRes.body.escrowSummary).toEqual({
      totalEscrowDeposited: 10000003,
      totalDisbursed: 10000003,
      escrowBalance: 0,
      currency: 'VND',
    });
    expect(ledgerRes.body.ledgerEntries).toHaveLength(4);
  });
});