import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { ProjectStatus } from '@labodc/shared-types';
import {
  ProgressReportReviewStatus,
  ProjectHealthStatus,
} from '../src/payments/project-settlement.types';
import { ChangeRequestType } from '../src/projects/project-proposal.types';

describe('Day 16 — Sprint 2 Gate 2 Review & End-to-End Integration Suite (D11 -> D16)', () => {
  let app: INestApplication;
  let sysAdminToken: string;
  let labAdminToken: string;
  let enterpriseAToken: string;
  let enterpriseBToken: string;
  let talentToken: string;

  const password =
    process.env.INITIAL_SYSADMIN_PASSWORD || 'ChangeMe_LabOdc@2026!';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    const [loginSys, loginLab, loginEntA, loginEntB, loginTalent] =
      await Promise.all([
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
          .send({ email: 'talent@student.uth.edu.vn', password })
          .expect(200),
      ]);

    sysAdminToken = loginSys.body.accessToken;
    labAdminToken = loginLab.body.accessToken;
    enterpriseAToken = loginEntA.body.accessToken;
    enterpriseBToken = loginEntB.body.accessToken;
    talentToken = loginTalent.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  it('TC-GATE-D16-01: Hành trình Liên thông Toàn diện Sprint 2 (Scope Change D11 -> Escrow & Idempotent Webhook D12/D13 -> Progress Report D15 -> Deliverable Revision & 70/20/10 Split -> Refund & Settlement Certificate -> Gate D16 Passed)', async () => {
    // 1. Doanh nghiệp A xác thực pháp nhân VERIFIED & Khởi tạo dự án PUBLISHED
    const profileRes = await request(app.getHttpServer())
      .post('/api/v1/enterprises/profile')
      .set('Authorization', `Bearer ${enterpriseAToken}`)
      .send({
        companyName: 'Tập đoàn Công nghệ Hàng hải Thông minh D16',
        taxCode: '0319991112',
        industry: 'Smart Port & FinTech',
        address: 'Quận 1, TP.HCM',
        representativeName: 'Trần Tổng Giám Đốc D16',
        contactEmail: 'contact@smartport-d16.vn',
        contactPhone: '0909111222',
      })
      .expect(200);

    await request(app.getHttpServer())
      .patch(`/api/v1/enterprises/${profileRes.body.id}/verify`)
      .set('Authorization', `Bearer ${labAdminToken}`)
      .send({
        status: 'VERIFIED',
        note: 'Phê duyệt pháp nhân doanh nghiệp phục vụ Cổng Gate D16.',
      })
      .expect(200);

    const draftRes = await request(app.getHttpServer())
      .post('/api/v1/projects/proposals')
      .set('Authorization', `Bearer ${enterpriseAToken}`)
      .send({
        title: 'Hệ thống Quản lý Ký quỹ và Vận hành Dự án ODC Toàn diện D16',
        summary: 'Dự án kiểm thử tích hợp đóng cổng nghiệm thu Sprint 2 Gate D16.',
        description:
          'Triển khai đầy đủ luồng thay đổi phạm vi, ký quỹ cột mốc, đối soát PayOS Webhook, báo cáo tiến độ và quyết toán 70/20/10.',
        deliverables: 'Web Portal, REST API, Sổ cái bất biến 70/20/10, Biên bản quyết toán.',
        requiredSkills: ['TypeScript', 'NestJS', 'React', 'PostgreSQL'],
        minTeamSize: 3,
        maxTeamSize: 5,
        durationWeeks: 10,
        budgetAmount: 30000003,
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
      .send({ reviewNote: 'Duyệt đề xuất dự án D16.' })
      .expect(200);

    const futureCloseDate = new Date(
      Date.now() + 14 * 86400000,
    ).toISOString();

    await request(app.getHttpServer())
      .post(`/api/v1/lab-admin/projects/${projectId}/publish`)
      .set('Authorization', `Bearer ${labAdminToken}`)
      .send({
        registrationCloseAt: futureCloseDate,
        note: 'Công bố dự án D16 mở nhận đơn.',
      })
      .expect(200);

    // 2. [D11 - REQ-ENT-03]: Doanh nghiệp A gửi yêu cầu Đổi phạm vi (SCOPE_CHANGE) và tự rút lại (WITHDRAWN)
    const crRes = await request(app.getHttpServer())
      .post(`/api/v1/projects/${projectId}/change-requests`)
      .set('Authorization', `Bearer ${enterpriseAToken}`)
      .send({
        requestType: ChangeRequestType.SCOPE_CHANGE,
        reason: 'Bổ sung yêu cầu xuất chứng thư quyết toán tự động cho dự án D16.',
        impactSummary: 'Tăng thời lượng thêm 2 tuần nhưng giữ nguyên cấu trúc đội dự án.',
        proposedDurationWeeks: 12,
      })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/v1/projects/change-requests/${crRes.body.id}/withdraw`)
      .set('Authorization', `Bearer ${enterpriseAToken}`)
      .expect(200);

    // 3. [D12 & D13 - REQ-FIN-01/02]: Tạo 2 Cột mốc ký quỹ & Đồng bộ PayOS Webhook HMAC (Idempotent)
    const ms1Res = await request(app.getHttpServer())
      .post('/api/v1/payments/milestones')
      .set('Authorization', `Bearer ${enterpriseAToken}`)
      .send({
        projectId,
        title: 'Cột mốc 1 (D16) - Bàn giao Core Platform & Sổ cái',
        description: 'Nghiệm thu phân hệ lõi và chia doanh thu 70/20/10.',
        amount: 20000003,
      })
      .expect(201);

    const ms2Res = await request(app.getHttpServer())
      .post('/api/v1/payments/milestones')
      .set('Authorization', `Bearer ${enterpriseAToken}`)
      .send({
        projectId,
        title: 'Cột mốc 2 (D16) - Hạng mục Tùy chọn Mở rộng',
        description: 'Hạng mục dự phòng sẽ được hoàn trả ký quỹ (ESCROW_REFUND).',
        amount: 10000000,
      })
      .expect(201);

    const ms1Id = ms1Res.body.id;
    const ms2Id = ms2Res.body.id;

    const webhook1 = await request(app.getHttpServer())
      .post(`/api/v1/payments/milestones/${ms1Id}/sync-payos-webhook`)
      .set('Authorization', `Bearer ${enterpriseAToken}`)
      .send({ reference: 'FT-D16-MS1-001' })
      .expect(200);

    expect(webhook1.body.idempotentReplay).toBe(false);
    expect(webhook1.body.projectStatus).toBe(ProjectStatus.IN_PROGRESS);

    // Gọi lặp Webhook lần 2 cho Cột mốc 1 -> Idempotent Replay = true
    const webhook1Replay = await request(app.getHttpServer())
      .post(`/api/v1/payments/milestones/${ms1Id}/sync-payos-webhook`)
      .set('Authorization', `Bearer ${enterpriseAToken}`)
      .send({ reference: 'FT-D16-MS1-001' })
      .expect(200);

    expect(webhook1Replay.body.idempotentReplay).toBe(true);

    // Nạp ký quỹ cho Cột mốc 2
    await request(app.getHttpServer())
      .post(`/api/v1/payments/milestones/${ms2Id}/sync-payos-webhook`)
      .set('Authorization', `Bearer ${enterpriseAToken}`)
      .send({ reference: 'FT-D16-MS2-001' })
      .expect(200);

    // 4. [D15 - REQ-LAB-02]: Sinh viên nộp Báo cáo tiến độ & Lab Admin đánh giá REVIEWED_OK
    const progRes = await request(app.getHttpServer())
      .post('/api/v1/payments/progress-reports')
      .set('Authorization', `Bearer ${talentToken}`)
      .send({
        projectId,
        milestoneId: ms1Id,
        reportingWeek: 4,
        completionPercentage: 100,
        healthStatus: ProjectHealthStatus.ON_TRACK,
        summary: 'Hoàn tất 100% các chức năng thuộc phạm vi Cột mốc 1 của Gate D16.',
      })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/v1/payments/progress-reports/${progRes.body.id}/review`)
      .set('Authorization', `Bearer ${labAdminToken}`)
      .send({
        decision: ProgressReportReviewStatus.REVIEWED_OK,
        reviewNote: 'Xác nhận nhóm hoàn thành đúng tiến độ cam kết.',
      })
      .expect(200);

    // 5. [D13 & D12 - REQ-FIN-03]: Hoàn trả ký quỹ Cột mốc 2 (ESCROW_REFUND) & Nghiệm thu giải ngân 70/20/10 Cột mốc 1 + Đóng dự án COMPLETED
    const refundRes = await request(app.getHttpServer())
      .post(`/api/v1/payments/milestones/${ms2Id}/refund-escrow`)
      .set('Authorization', `Bearer ${labAdminToken}`)
      .send({
        refundReason: 'Hoàn trả 100% ký quỹ Cột mốc 2 để chốt quyết toán sớm dự án D16.',
      })
      .expect(200);

    expect(refundRes.body.milestone.status).toBe('REFUNDED');

    await request(app.getHttpServer())
      .post(`/api/v1/payments/milestones/${ms1Id}/submit-deliverable`)
      .set('Authorization', `Bearer ${talentToken}`)
      .send({
        deliverableUrl: 'https://github.com/thong-hdhs/labodc-system/releases/tag/v2.0-gate-d16',
        deliverableNote: 'Gói bàn giao nghiệm thu Cổng Sprint 2 Gate D16.',
      })
      .expect(200);

    const acceptRes = await request(app.getHttpServer())
      .post(`/api/v1/payments/milestones/${ms1Id}/accept-and-split`)
      .set('Authorization', `Bearer ${enterpriseAToken}`)
      .send({
        reviewNote: 'Nghiệm thu đạt 100% tiêu chí Cổng Gate D16, đóng dự án COMPLETED.',
        markProjectCompleted: true,
      })
      .expect(200);

    expect(acceptRes.body.projectStatus).toBe(ProjectStatus.COMPLETED);
    expect(acceptRes.body.splitBreakdown).toEqual({
      totalAmount: 20000003,
      teamAmount70: 14000002,
      mentorAmount20: 4000000,
      labAmount10: 2000001,
      remainderAbsorbedByLab: 1,
      invariantHold: true,
    });

    // 6. [D15]: Kiểm tra Biên bản Quyết toán dự án D16 (isFullySettled = true & Bất biến Sổ cái = true)
    const certRes = await request(app.getHttpServer())
      .get(`/api/v1/payments/projects/${projectId}/settlement-certificate`)
      .set('Authorization', `Bearer ${enterpriseAToken}`)
      .expect(200);

    expect(certRes.body.isFullySettled).toBe(true);
    expect(certRes.body.financialTotals.escrowRemainingBalanceVnd).toBe(0);
    expect(certRes.body.revenueSplitSummary.splitInvariantHold).toBe(true);

    // 7. [D16 - Gate 2 Acceptance]: Kiểm tra phân quyền âm tính & Báo cáo Đóng cổng Sprint 2 Gate D16
    await request(app.getHttpServer())
      .get('/api/v1/system-admin/governance/sprint2-gate-d16')
      .set('Authorization', `Bearer ${enterpriseBToken}`)
      .expect(403);

    const gateD16Res = await request(app.getHttpServer())
      .get('/api/v1/system-admin/governance/sprint2-gate-d16')
      .set('Authorization', `Bearer ${sysAdminToken}`)
      .expect(200);

    expect(gateD16Res.body.gateCode).toBe('GATE_D16_SPRINT_2_COMPLETE');
    expect(gateD16Res.body.gateStatus).toBe('PASSED');
    expect(gateD16Res.body.deliverablesVerified).toEqual({
      reqEnt03ScopeChangeAndCancel: true,
      reqFin01MilestoneEscrow: true,
      reqFin02IdempotentWebhookAndRefundLedger: true,
      reqFin03Immutable702010RevenueSplit: true,
      reqLab02ProgressMonitoringAndSettlement: true,
      reqSys01RuntimeGovernanceAndAuditLogs: true,
    });
    expect(
      gateD16Res.body.readinessSnapshot.escrowAndLedgerAudit.ledgerInvariantHold,
    ).toBe(true);
  });
});