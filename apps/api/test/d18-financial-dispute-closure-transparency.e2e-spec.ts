import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { FinancialDisputeStatus } from '../src/payments/financial-closure.types';

describe('Day 18 — Financial Dispute Resolution, Project Closure Dossier & Lab 10% Fund Transparency Report (E2E)', () => {
  let app: INestApplication;
  let enterpriseAToken: string;
  let enterpriseBToken: string;
  let labAdminToken: string;
  let talentToken: string;
  let projectId: string;
  let milestone1Id: string;
  let milestone2Id: string;

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

    // 1. Khởi tạo Hồ sơ Doanh nghiệp A (VERIFIED) & Dự án D18 được APPROVED
    const profileRes = await request(app.getHttpServer())
      .post('/api/v1/enterprises/profile')
      .set('Authorization', `Bearer ${enterpriseAToken}`)
      .send({
        companyName: 'Tập đoàn Công nghệ Tài chính Hàng hải D18',
        taxCode: '0318881818',
        industry: 'Maritime FinTech',
        address: 'Quận 1, TP.HCM',
        representativeName: 'Lê Đại Diện D18',
        contactEmail: 'contact@maritime-d18.vn',
        contactPhone: '0909181818',
      })
      .expect(200);

    await request(app.getHttpServer())
      .patch(`/api/v1/enterprises/${profileRes.body.id}/verify`)
      .set('Authorization', `Bearer ${labAdminToken}`)
      .send({
        status: 'VERIFIED',
        note: 'Xác thực doanh nghiệp D18 hợp lệ.',
      })
      .expect(200);

    const draftRes = await request(app.getHttpServer())
      .post('/api/v1/projects/proposals')
      .set('Authorization', `Bearer ${enterpriseAToken}`)
      .send({
        title: 'Hệ thống Phân xử Đối soát Ký quỹ và Minh bạch Quỹ Lab D18',
        summary: 'Xử lý tranh chấp cột mốc, đóng hồ sơ dự án và báo cáo quỹ Lab 10%.',
        description:
          'Triển khai quy trình phân xử khiếu nại ký quỹ, ký hồ sơ nghiệm thu đóng dự án và công khai báo cáo quỹ Lab 10%.',
        deliverables: 'API Phân xử khiếu nại, Hồ sơ đóng dự án, Báo cáo quỹ Lab 10%.',
        requiredSkills: ['TypeScript', 'NestJS', 'React', 'PostgreSQL'],
        minTeamSize: 3,
        maxTeamSize: 5,
        durationWeeks: 8,
        budgetAmount: 30000003,
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
      .send({ reviewNote: 'Duyệt dự án D18.' })
      .expect(200);

    // 2. Tạo 2 Cột mốc ký quỹ (Cột mốc 1: 20,000,003 VND & Cột mốc 2: 10,000,000 VND) và nạp ký quỹ
    const ms1 = await request(app.getHttpServer())
      .post('/api/v1/payments/milestones')
      .set('Authorization', `Bearer ${enterpriseAToken}`)
      .send({
        projectId,
        title: 'Cột mốc 1 (D18) - Bàn giao Hệ thống Lõi',
        description: 'Nghiệm thu qua phân xử giải ngân 70/20/10.',
        amount: 20000003,
      })
      .expect(201);

    const ms2 = await request(app.getHttpServer())
      .post('/api/v1/payments/milestones')
      .set('Authorization', `Bearer ${enterpriseAToken}`)
      .send({
        projectId,
        title: 'Cột mốc 2 (D18) - Hạng mục Phụ trợ',
        description: 'Hạng mục sẽ được phân xử hoàn trả 100% ký quỹ về Doanh nghiệp.',
        amount: 10000000,
      })
      .expect(201);

    milestone1Id = ms1.body.id;
    milestone2Id = ms2.body.id;

    await request(app.getHttpServer())
      .post(`/api/v1/payments/milestones/${milestone1Id}/sync-payos-webhook`)
      .set('Authorization', `Bearer ${enterpriseAToken}`)
      .send({ reference: 'FT-D18-MS1' })
      .expect(200);

    await request(app.getHttpServer())
      .post(`/api/v1/payments/milestones/${milestone2Id}/sync-payos-webhook`)
      .set('Authorization', `Bearer ${enterpriseAToken}`)
      .send({ reference: 'FT-D18-MS2' })
      .expect(200);

    await request(app.getHttpServer())
      .post(`/api/v1/payments/milestones/${milestone1Id}/submit-deliverable`)
      .set('Authorization', `Bearer ${talentToken}`)
      .send({
        deliverableUrl: 'https://github.com/thong-hdhs/labodc-system/releases/tag/v1.8-ms1',
        deliverableNote: 'Hoàn tất bàn giao Cột mốc 1 D18.',
      })
      .expect(200);
  });

  afterAll(async () => {
    await app.close();
  });

  it('TC-FIN-D18-01 & TC-FIN-D18-02: Mở & Phân xử Khiếu nại (Giải ngân 70/20/10 + Hoàn trả Ký quỹ) -> Ký Hồ sơ Đóng Dự án -> Xuất Báo cáo Minh bạch Quỹ Lab 10%', async () => {
    // 1. Mở 2 phiếu khiếu nại cho Cột mốc 1 và Cột mốc 2
    const disp1Res = await request(app.getHttpServer())
      .post('/api/v1/payments/disputes')
      .set('Authorization', `Bearer ${talentToken}`)
      .send({
        projectId,
        milestoneId: milestone1Id,
        reason: 'Nhóm sinh viên đề nghị Lab Admin xác nhận bàn giao Cột mốc 1 đã đạt chuẩn.',
        evidenceUrl: 'https://github.com/thong-hdhs/labodc-system/releases/tag/v1.8-ms1',
      })
      .expect(201);

    const disp2Res = await request(app.getHttpServer())
      .post('/api/v1/payments/disputes')
      .set('Authorization', `Bearer ${enterpriseAToken}`)
      .send({
        projectId,
        milestoneId: milestone2Id,
        reason: 'Doanh nghiệp đề nghị dừng Cột mốc 2 và hoàn trả lại 10,000,000 VND tiền ký quỹ.',
      })
      .expect(201);

    // 2. Chặn ký Hồ sơ Đóng Dự án khi vẫn còn phiếu khiếu nại OPEN (409 Conflict)
    await request(app.getHttpServer())
      .post(`/api/v1/payments/projects/${projectId}/closure-dossier`)
      .set('Authorization', `Bearer ${enterpriseAToken}`)
      .send({
        satisfactionScore: 5,
        wouldSponsorAgain: true,
        feedbackSummary: 'Thử ký đóng dự án khi đang còn tranh chấp.',
      })
      .expect(409);

    // 3. Chặn Doanh nghiệp A tự phân xử phiếu khiếu nại của mình (403 Forbidden)
    await request(app.getHttpServer())
      .post(`/api/v1/payments/disputes/${disp1Res.body.id}/resolve`)
      .set('Authorization', `Bearer ${enterpriseAToken}`)
      .send({
        decision: FinancialDisputeStatus.RESOLVED_RELEASE_TO_TEAM,
        resolutionNote: 'Doanh nghiệp cố tự gọi API phân xử của Lab Admin.',
      })
      .expect(403);

    // 4. Lab Admin phân xử Phiếu 2 -> RESOLVED_REFUND_TO_ENTERPRISE (Hoàn trả 10,000,000 VND)
    const resolve2 = await request(app.getHttpServer())
      .post(`/api/v1/payments/disputes/${disp2Res.body.id}/resolve`)
      .set('Authorization', `Bearer ${labAdminToken}`)
      .send({
        decision: FinancialDisputeStatus.RESOLVED_REFUND_TO_ENTERPRISE,
        resolutionNote: 'Đồng ý hoàn trả 100% tiền ký quỹ Cột mốc 2 cho Doanh nghiệp A.',
      })
      .expect(200);

    expect(resolve2.body.milestoneStatusAfterResolution).toBe('REFUNDED');

    // 5. Lab Admin phân xử Phiếu 1 -> RESOLVED_RELEASE_TO_TEAM (Chia 70/20/10 cho 20,000,003 VND & Đóng dự án COMPLETED)
    const resolve1 = await request(app.getHttpServer())
      .post(`/api/v1/payments/disputes/${disp1Res.body.id}/resolve`)
      .set('Authorization', `Bearer ${labAdminToken}`)
      .send({
        decision: FinancialDisputeStatus.RESOLVED_RELEASE_TO_TEAM,
        resolutionNote: 'Xác nhận gói bàn giao Cột mốc 1 đạt yêu cầu, giải ngân 70/20/10 và hoàn tất dự án.',
        markProjectCompleted: true,
      })
      .expect(200);

    expect(resolve1.body.milestoneStatusAfterResolution).toBe('DISBURSED');

    // 6. Doanh nghiệp A ký Hồ sơ Nghiệm thu Đóng Dự án Tổng thể (201 Created)
    const dossierRes = await request(app.getHttpServer())
      .post(`/api/v1/payments/projects/${projectId}/closure-dossier`)
      .set('Authorization', `Bearer ${enterpriseAToken}`)
      .send({
        satisfactionScore: 5,
        wouldSponsorAgain: true,
        feedbackSummary: 'Quy trình đối soát minh bạch, sản phẩm bàn giao đạt chất lượng xuất sắc.',
        finalDeliverableArchiveUrl: 'https://github.com/thong-hdhs/labodc-system/releases/tag/v1.8-final',
      })
      .expect(201);

    expect(dossierRes.body.satisfactionScore).toBe(5);
    expect(dossierRes.body.totalEscrowDepositedVnd).toBe(30000003);
    expect(dossierRes.body.totalDisbursed702010Vnd).toBe(20000003);
    expect(dossierRes.body.totalRefundedVnd).toBe(10000000);

    // 7. Chặn Doanh nghiệp B xem Hồ sơ Đóng Dự án của Doanh nghiệp A (403 Forbidden)
    await request(app.getHttpServer())
      .get(`/api/v1/payments/projects/${projectId}/closure-dossier`)
      .set('Authorization', `Bearer ${enterpriseBToken}`)
      .expect(403);

    // 8. Lab Admin truy xuất Báo cáo Minh bạch Quỹ Vận hành LabOdc 10%
    const reportRes = await request(app.getHttpServer())
      .get('/api/v1/payments/lab-fund/transparency-report')
      .set('Authorization', `Bearer ${labAdminToken}`)
      .expect(200);

    expect(reportRes.body.reportCode).toBe(
      'LAB_FUND_10_TRANSPARENCY_REPORT_D18',
    );
    expect(reportRes.body.labFundSummary).toEqual({
      totalLabFund10CollectedVnd: 2000001,
      totalRemainderAbsorbedVnd: 1,
      totalTeam70DisbursedVnd: 14000002,
      totalMentor20DisbursedVnd: 4000000,
      totalGrossDisbursedVnd: 20000003,
      currency: 'VND',
      invariantHold: true,
    });
    expect(reportRes.body.disputeGovernance).toEqual({
      totalDisputes: 2,
      openDisputes: 0,
      resolvedReleaseCount: 1,
      resolvedRefundCount: 1,
      rejectedCount: 0,
    });
    expect(reportRes.body.closureGovernance).toEqual({
      totalClosedDossiers: 1,
      averageSatisfactionScore: 5,
      wouldSponsorAgainRatePercent: 100,
    });
  });
});