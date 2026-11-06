import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { ProjectStatus } from '@labodc/shared-types';
import {
  ProgressReportReviewStatus,
  ProjectHealthStatus,
} from '../src/payments/project-settlement.types';

describe('Day 15 — Project Execution Progress Reports, Review & 70/20/10 Settlement Certificate (E2E)', () => {
  let app: INestApplication;
  let enterpriseAToken: string;
  let enterpriseBToken: string;
  let labAdminToken: string;
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

    // 1. Xác thực Doanh nghiệp A & Khởi tạo dự án được Lab Admin phê duyệt APPROVED
    const profileRes = await request(app.getHttpServer())
      .post('/api/v1/enterprises/profile')
      .set('Authorization', `Bearer ${enterpriseAToken}`)
      .send({
        companyName: 'Công ty Cổ phần Chuỗi Cung Ứng Số D15',
        taxCode: '0315554443',
        industry: 'Supply Chain & FinTech',
        address: 'TP. Thủ Đức, TP.HCM',
        representativeName: 'Hoàng Đại Diện D15',
        contactEmail: 'contact@supplychain-d15.vn',
        contactPhone: '0909333444',
      })
      .expect(200);

    await request(app.getHttpServer())
      .patch(`/api/v1/enterprises/${profileRes.body.id}/verify`)
      .set('Authorization', `Bearer ${labAdminToken}`)
      .send({
        status: 'VERIFIED',
        note: 'Xác thực doanh nghiệp D15 hợp lệ.',
      })
      .expect(200);

    const draftRes = await request(app.getHttpServer())
      .post('/api/v1/projects/proposals')
      .set('Authorization', `Bearer ${enterpriseAToken}`)
      .send({
        title: 'Hệ thống Giám sát Tiến độ Thực thi và Quyết toán Dự án D15',
        summary: 'Theo dõi báo cáo tiến độ tuần và xuất biên bản quyết toán 70/20/10.',
        description:
          'Xây dựng luồng nộp báo cáo tiến độ định kỳ, đánh giá rủi ro và xuất chứng thư quyết toán sổ cái.',
        deliverables: 'API Báo cáo tiến độ, Biên bản quyết toán 70/20/10.',
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
      .send({ reviewNote: 'Duyệt dự án D15.' })
      .expect(200);
  });

  afterAll(async () => {
    await app.close();
  });

  it('TC-EXEC-D15-01 & TC-EXEC-D15-02: Ký quỹ kích hoạt IN_PROGRESS -> Nộp & Đánh giá Báo cáo Tiến độ -> Nghiệm thu Giải ngân 70/20/10 -> Xuất Biên bản Quyết toán Hoàn tất (isFullySettled = true)', async () => {
    // 1. Tạo cột mốc ký quỹ 30,000,003 VND & Đồng bộ PayOS Webhook -> Dự án sang IN_PROGRESS
    const msRes = await request(app.getHttpServer())
      .post('/api/v1/payments/milestones')
      .set('Authorization', `Bearer ${enterpriseAToken}`)
      .send({
        projectId,
        title: 'Cột mốc 1 - Bàn giao Toàn bộ Hệ thống D15',
        description: 'Hoàn thành phát triển, kiểm thử E2E và tài liệu nghiệm thu.',
        amount: 30000003,
      })
      .expect(201);

    milestoneId = msRes.body.id;

    await request(app.getHttpServer())
      .post(`/api/v1/payments/milestones/${milestoneId}/sync-payos-webhook`)
      .set('Authorization', `Bearer ${enterpriseAToken}`)
      .send({ reference: 'FT-PAYOS-D15-001' })
      .expect(200);

    // 2. Sinh viên nộp Báo cáo tiến độ Tuần 1 (50%, AT_RISK) -> Lab Admin đánh giá FLAGGED_ACTION_REQUIRED
    const report1Res = await request(app.getHttpServer())
      .post('/api/v1/payments/progress-reports')
      .set('Authorization', `Bearer ${talentToken}`)
      .send({
        projectId,
        milestoneId,
        reportingWeek: 1,
        completionPercentage: 50,
        healthStatus: ProjectHealthStatus.AT_RISK,
        summary: 'Đã hoàn thành 50% API nhưng đang chờ bổ sung môi trường test.',
        blockers: 'Chưa cấu hình xong biến môi trường Sandbox.',
      })
      .expect(201);

    const review1Res = await request(app.getHttpServer())
      .post(`/api/v1/payments/progress-reports/${report1Res.body.id}/review`)
      .set('Authorization', `Bearer ${labAdminToken}`)
      .send({
        decision: ProgressReportReviewStatus.FLAGGED_ACTION_REQUIRED,
        reviewNote: 'Yêu cầu nhóm phối hợp với Mentor xử lý xong cấu hình trong 24h.',
      })
      .expect(200);

    expect(review1Res.body.reviewStatus).toBe(
      ProgressReportReviewStatus.FLAGGED_ACTION_REQUIRED,
    );

    // 3. Sinh viên nộp Báo cáo tiến độ Tuần 2 (100%, ON_TRACK) -> Doanh nghiệp A đánh giá REVIEWED_OK
    const report2Res = await request(app.getHttpServer())
      .post('/api/v1/payments/progress-reports')
      .set('Authorization', `Bearer ${talentToken}`)
      .send({
        projectId,
        milestoneId,
        reportingWeek: 2,
        completionPercentage: 100,
        healthStatus: ProjectHealthStatus.ON_TRACK,
        summary: 'Đã giải quyết triệt để vướng mắc và hoàn thành 100% sản phẩm bàn giao.',
        evidenceUrl: 'https://github.com/thong-hdhs/labodc-system/releases/tag/v1.5',
      })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/v1/payments/progress-reports/${report2Res.body.id}/review`)
      .set('Authorization', `Bearer ${enterpriseAToken}`)
      .send({
        decision: ProgressReportReviewStatus.REVIEWED_OK,
        reviewNote: 'Tiến độ tuần 2 đạt 100%, sẵn sàng nghiệm thu giải ngân.',
      })
      .expect(200);

    // 4. Sinh viên nộp gói bàn giao cột mốc & Doanh nghiệp A nghiệm thu giải ngân 70/20/10 + Đóng dự án COMPLETED
    await request(app.getHttpServer())
      .post(`/api/v1/payments/milestones/${milestoneId}/submit-deliverable`)
      .set('Authorization', `Bearer ${talentToken}`)
      .send({
        deliverableUrl: 'https://github.com/thong-hdhs/labodc-system/releases/tag/v1.5',
        deliverableNote: 'Bàn giao toàn bộ mã nguồn và biên bản kiểm thử D15.',
      })
      .expect(200);

    await request(app.getHttpServer())
      .post(`/api/v1/payments/milestones/${milestoneId}/accept-and-split`)
      .set('Authorization', `Bearer ${enterpriseAToken}`)
      .send({
        reviewNote: 'Nghiệm thu hoàn tất dự án D15 và giải ngân 70/20/10.',
        markProjectCompleted: true,
      })
      .expect(200);

    // 5. Chặn Doanh nghiệp B xem báo cáo tiến độ hoặc biên bản quyết toán của Doanh nghiệp A (403 Forbidden)
    await request(app.getHttpServer())
      .get(`/api/v1/payments/projects/${projectId}/progress-reports`)
      .set('Authorization', `Bearer ${enterpriseBToken}`)
      .expect(403);

    await request(app.getHttpServer())
      .get(`/api/v1/payments/projects/${projectId}/settlement-certificate`)
      .set('Authorization', `Bearer ${enterpriseBToken}`)
      .expect(403);

    // 6. Xuất Biên bản Quyết toán dự án D15 (Settlement Certificate) -> Khớp 100% bất biến 70/20/10 & isFullySettled = true
    const certRes = await request(app.getHttpServer())
      .get(`/api/v1/payments/projects/${projectId}/settlement-certificate`)
      .set('Authorization', `Bearer ${enterpriseAToken}`)
      .expect(200);

    expect(certRes.body.projectStatus).toBe(ProjectStatus.COMPLETED);
    expect(certRes.body.isFullySettled).toBe(true);
    expect(certRes.body.financialTotals).toEqual({
      totalEscrowDepositedVnd: 30000003,
      totalDisbursedVnd: 30000003,
      totalRefundedVnd: 0,
      escrowRemainingBalanceVnd: 0,
      currency: 'VND',
    });
    expect(certRes.body.revenueSplitSummary).toEqual({
      teamLeader70Vnd: 21000002,
      mentor20Vnd: 6000000,
      labFund10Vnd: 3000001,
      remainderAbsorbedByLabVnd: 1,
      splitInvariantHold: true,
    });
    expect(certRes.body.progressOverview).toEqual({
      totalReports: 2,
      latestCompletionPercentage: 100,
      latestHealthStatus: ProjectHealthStatus.ON_TRACK,
      flaggedReportsCount: 1,
    });
  });
});