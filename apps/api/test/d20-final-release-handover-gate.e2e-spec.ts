import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { ProjectStatus } from '@labodc/shared-types';
import {
  ProgressReportReviewStatus,
  ProjectHealthStatus,
} from '../src/payments/project-settlement.types';

describe('Day 20 — Master End-to-End Acceptance Suite (D5 -> D20), RTM Verification & Final Release Handover Gate D20', () => {
  let app: INestApplication;
  let sysAdminToken: string;
  let labAdminToken: string;
  let enterpriseAToken: string;
  let enterpriseBToken: string;
  let mentorToken: string;
  let talentToken: string;

  const password =
    process.env.INITIAL_SYSADMIN_PASSWORD || 'ChangeMe_LabOdc@2026!';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    const [
      loginSys,
      loginLab,
      loginEntA,
      loginEntB,
      loginMentor,
      loginTalent,
    ] = await Promise.all([
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
        .send({ email: 'enterprise2@company.vn', password })
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

    sysAdminToken = loginSys.body.accessToken;
    labAdminToken = loginLab.body.accessToken;
    enterpriseAToken = loginEntA.body.accessToken;
    enterpriseBToken = loginEntB.body.accessToken;
    mentorToken = loginMentor.body.accessToken;
    talentToken = loginTalent.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  it('TC-GATE-D20-01: Hành trình Nghiệm thu Tổng thể Toàn Hệ thống (KYC -> Proposal -> Publish -> Escrow Webhook -> Progress Report -> 70/20/10 Split -> Member Pool Split -> Bank Payout -> Closure Dossier -> RTM & Release Handover Package D20)', async () => {
    // 1. [Giai đoạn 1]: Doanh nghiệp A tạo hồ sơ & Lab Admin duyệt VERIFIED -> Tạo đề xuất, Duyệt & Publish
    const entRes = await request(app.getHttpServer())
      .post('/api/v1/enterprises/profile')
      .set('Authorization', `Bearer ${enterpriseAToken}`)
      .send({
        companyName: 'Tập đoàn Logistics & Chuỗi Cung Ứng Toàn cầu D20',
        taxCode: '0319992020',
        industry: 'Global Smart Logistics',
        address: 'Quận 1, TP.HCM',
        representativeName: 'Nguyễn Chủ Tịch D20',
        contactEmail: 'chairman@globallogistics-d20.vn',
        contactPhone: '0909202020',
      })
      .expect(200);

    await request(app.getHttpServer())
      .patch(`/api/v1/enterprises/${entRes.body.id}/verify`)
      .set('Authorization', `Bearer ${labAdminToken}`)
      .send({
        status: 'VERIFIED',
        note: 'Xác thực pháp nhân doanh nghiệp phục vụ Cổng Nghiệm thu Cuối kỳ D20.',
      })
      .expect(200);

    const draftRes = await request(app.getHttpServer())
      .post('/api/v1/projects/proposals')
      .set('Authorization', `Bearer ${enterpriseAToken}`)
      .send({
        title: 'Nền tảng Quản trị Dự án Thực chiến và Sổ cái Ký quỹ LabOdc Release D20',
        summary: 'Dự án tổng nghiệm thu toàn trình từ khởi tạo đến đóng gói bàn giao phát hành.',
        description:
          'Kiểm chứng liên thông toàn bộ 3 giai đoạn: Đề xuất dự án, Ký quỹ PayOS, Báo cáo tiến độ, Chia doanh thu 70/20/10, Phân bổ thành viên và Đóng hồ sơ dự án.',
        deliverables: 'Full-Stack Monorepo, Sổ cái 70/20/10, Biên bản quyết toán, Gói bàn giao D20.',
        requiredSkills: ['TypeScript', 'NestJS', 'React', 'PostgreSQL'],
        minTeamSize: 3,
        maxTeamSize: 5,
        durationWeeks: 12,
        budgetAmount: 10000003,
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
      .send({ reviewNote: 'Phê duyệt đề xuất dự án D20.' })
      .expect(200);

    const closeDate = new Date(Date.now() + 14 * 86400000).toISOString();
    await request(app.getHttpServer())
      .post(`/api/v1/lab-admin/projects/${projectId}/publish`)
      .set('Authorization', `Bearer ${labAdminToken}`)
      .send({
        registrationCloseAt: closeDate,
        note: 'Công bố dự án D20 lên cổng công khai.',
      })
      .expect(200);

    // 2. [Giai đoạn 2]: Tạo Cột mốc Ký quỹ 10,000,003 VND -> Đồng bộ PayOS Webhook -> Báo cáo tiến độ -> Nghiệm thu 70/20/10
    const msRes = await request(app.getHttpServer())
      .post('/api/v1/payments/milestones')
      .set('Authorization', `Bearer ${enterpriseAToken}`)
      .send({
        projectId,
        title: 'Cột mốc Tổng Nghiệm thu Release Candidate D20',
        description: 'Bàn giao toàn bộ sản phẩm và nghiệm thu quyết toán 100%.',
        amount: 10000003,
      })
      .expect(201);

    const milestoneId = msRes.body.id;

    const syncRes = await request(app.getHttpServer())
      .post(`/api/v1/payments/milestones/${milestoneId}/sync-payos-webhook`)
      .set('Authorization', `Bearer ${enterpriseAToken}`)
      .send({ reference: 'FT-PAYOS-D20-FINAL' })
      .expect(200);

    expect(syncRes.body.projectStatus).toBe(ProjectStatus.IN_PROGRESS);

    const progRes = await request(app.getHttpServer())
      .post('/api/v1/payments/progress-reports')
      .set('Authorization', `Bearer ${talentToken}`)
      .send({
        projectId,
        milestoneId,
        reportingWeek: 6,
        completionPercentage: 100,
        healthStatus: ProjectHealthStatus.ON_TRACK,
        summary: 'Đã hoàn thành 100% toàn bộ hạng mục bàn giao tại Cổng Gate D20.',
      })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/v1/payments/progress-reports/${progRes.body.id}/review`)
      .set('Authorization', `Bearer ${labAdminToken}`)
      .send({
        decision: ProgressReportReviewStatus.REVIEWED_OK,
        reviewNote: 'Xác nhận tiến độ đạt 100%, cho phép nghiệm thu quyết toán.',
      })
      .expect(200);

    await request(app.getHttpServer())
      .post(`/api/v1/payments/milestones/${milestoneId}/submit-deliverable`)
      .set('Authorization', `Bearer ${talentToken}`)
      .send({
        deliverableUrl: 'https://github.com/thong-hdhs/labodc-system/releases/tag/v1.0.0-final-d20',
        deliverableNote: 'Bản phát hành hoàn chỉnh phục vụ đóng cổng D20.',
      })
      .expect(200);

    const acceptRes = await request(app.getHttpServer())
      .post(`/api/v1/payments/milestones/${milestoneId}/accept-and-split`)
      .set('Authorization', `Bearer ${enterpriseAToken}`)
      .send({
        reviewNote: 'Nghiệm thu hoàn tất dự án D20 và giải ngân 70/20/10.',
        markProjectCompleted: true,
      })
      .expect(200);

    expect(acceptRes.body.projectStatus).toBe(ProjectStatus.COMPLETED);

    // 3. [Giai đoạn 3]: Phân bổ gói 70% (7,000,002 VND) cho từng thành viên -> Chi trả ngân hàng -> Ký Hồ sơ Đóng Dự án
    await request(app.getHttpServer())
      .post(`/api/v1/payments/milestones/${milestoneId}/distribute-team-pool`)
      .set('Authorization', `Bearer ${mentorToken}`)
      .send({
        members: [
          {
            memberUserId: 'leader-d20',
            memberName: 'Nguyễn Nhóm Trưởng D20',
            memberRole: 'TALENT_LEADER',
            contributionPercentage: 40,
          },
          {
            memberUserId: 'member-2-d20',
            memberName: 'Trần Thành Viên 2 D20',
            memberRole: 'TALENT',
            contributionPercentage: 30,
          },
          {
            memberUserId: 'member-3-d20',
            memberName: 'Lê Thành Viên 3 D20',
            memberRole: 'TALENT',
            contributionPercentage: 30,
          },
        ],
      })
      .expect(200);

    await request(app.getHttpServer())
      .post(`/api/v1/payments/milestones/${milestoneId}/execute-payouts`)
      .set('Authorization', `Bearer ${labAdminToken}`)
      .send({ bankTransferRefPrefix: 'BNK-D20-FINAL' })
      .expect(200);

    await request(app.getHttpServer())
      .post(`/api/v1/payments/projects/${projectId}/closure-dossier`)
      .set('Authorization', `Bearer ${enterpriseAToken}`)
      .send({
        satisfactionScore: 5,
        wouldSponsorAgain: true,
        feedbackSummary: 'Hoàn tất nghiệm thu toàn trình dự án tại Cổng Gate D20.',
      })
      .expect(201);

    // 4. [Đóng Cổng Cuối kỳ D20]: Kiểm tra RTM Matrix, Đóng gói Hồ sơ Bàn giao Phát hành & Kiểm tra Final Gate D20
    await request(app.getHttpServer())
      .get('/api/v1/system-admin/handover/rtm-matrix')
      .set('Authorization', `Bearer ${enterpriseBToken}`)
      .expect(403);

    const rtmRes = await request(app.getHttpServer())
      .get('/api/v1/system-admin/handover/rtm-matrix')
      .set('Authorization', `Bearer ${sysAdminToken}`)
      .expect(200);

    expect(rtmRes.body.coveragePercent).toBe(100);
    expect(rtmRes.body.architectureDecisions).toHaveLength(5);

    // Ghi nhận SLA P95 hợp lệ & Ký đóng gói Hồ sơ Bàn giao Phát hành D20
    await request(app.getHttpServer())
      .post('/api/v1/system-admin/readiness/sla-benchmarks')
      .set('Authorization', `Bearer ${sysAdminToken}`)
      .send({
        endpointCategory: 'STANDARD_API',
        endpointPath: '/api/v1/system-admin/handover/rtm-matrix',
        observedP95Ms: 85,
      })
      .expect(201);

    const pkgRes = await request(app.getHttpServer())
      .post('/api/v1/system-admin/handover/packages')
      .set('Authorization', `Bearer ${sysAdminToken}`)
      .send({
        releaseTag: 'v1.0.0-final-d20',
        environmentTarget: 'PRODUCTION_RC',
        handoverNote: 'Chính thức đóng gói bàn giao hệ thống LabOdc tại Cổng Nghiệm thu D20.',
      })
      .expect(201);

    expect(pkgRes.body.handoverCode).toBe('HANDOVER-D20-001');
    expect(pkgRes.body.financialAuditSnapshot).toEqual({
      totalEscrowDepositedVnd: 10000003,
      totalDisbursed702010Vnd: 10000003,
      totalRefundedVnd: 0,
      escrowHeldBalanceVnd: 0,
      ledgerInvariantHold: true,
    });

    const finalGateRes = await request(app.getHttpServer())
      .get('/api/v1/system-admin/handover/final-gate-d20')
      .set('Authorization', `Bearer ${sysAdminToken}`)
      .expect(200);

    expect(finalGateRes.body.gateCode).toBe(
      'GATE_D20_FINAL_RELEASE_CANDIDATE',
    );
    expect(finalGateRes.body.gateStatus).toBe('PASSED');
    expect(finalGateRes.body.rtmCoveragePercent).toBe(100);
    expect(finalGateRes.body.adrComplianceCount).toBe(5);
    expect(finalGateRes.body.financialLedgerInvariantHold).toBe(true);
    expect(finalGateRes.body.totalHandoverPackagesIssued).toBe(1);
  });
});