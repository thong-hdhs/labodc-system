import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { UserRole, UserStatus } from '@labodc/shared-types';

describe('Day 14 — System Governance, Account Status Control, Immutable 70/20/10 Policy & Sprint 2 Readiness Audit (E2E)', () => {
  let app: INestApplication;
  let sysAdminToken: string;
  let labAdminToken: string;
  let enterpriseAToken: string;
  let talentToken: string;

  const password =
    process.env.INITIAL_SYSADMIN_PASSWORD || 'ChangeMe_LabOdc@2026!';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    const [loginSys, loginLab, loginEntA, loginTalent] = await Promise.all([
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

    sysAdminToken = loginSys.body.accessToken;
    labAdminToken = loginLab.body.accessToken;
    enterpriseAToken = loginEntA.body.accessToken;
    talentToken = loginTalent.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  it('TC-SYS-D14-01: Quản trị Cấu hình Vận hành Hệ thống, Bảo vệ Bất biến 70/20/10 & Kiểm thử Phân quyền Âm tính', async () => {
    // 1. SYSTEM_ADMIN và LAB_ADMIN đọc cấu hình hệ thống thành công (200 OK)
    const configRes = await request(app.getHttpServer())
      .get('/api/v1/system-admin/governance/config')
      .set('Authorization', `Bearer ${sysAdminToken}`)
      .expect(200);

    expect(configRes.body.revenueSplitPolicy).toEqual({
      teamPercentage: 70,
      mentorPercentage: 20,
      labFundPercentage: 10,
      remainderPolicy: 'ABSORB_INTO_LAB_FUND_10',
      immutable: true,
    });

    // 2. ENTERPRISE và LAB_ADMIN không được phép gọi PATCH sửa cấu hình hệ thống (403 Forbidden)
    await request(app.getHttpServer())
      .patch('/api/v1/system-admin/governance/config')
      .set('Authorization', `Bearer ${enterpriseAToken}`)
      .send({
        minDurationWeeks: 6,
        reasonNote: 'Doanh nghiệp cố tình chỉnh sửa cấu hình hệ thống.',
      })
      .expect(403);

    await request(app.getHttpServer())
      .patch('/api/v1/system-admin/governance/config')
      .set('Authorization', `Bearer ${labAdminToken}`)
      .send({
        minDurationWeeks: 6,
        reasonNote: 'Lab Admin cố tình chỉnh sửa cấu hình của System Admin.',
      })
      .expect(403);

    // 3. SYSTEM_ADMIN cố tình sửa tỷ lệ 70/20/10 -> Bị chặn bởi 409 Conflict (IMMUTABLE_REVENUE_SPLIT_POLICY)
    const immutableRes = await request(app.getHttpServer())
      .patch('/api/v1/system-admin/governance/config')
      .set('Authorization', `Bearer ${sysAdminToken}`)
      .send({
        teamPercentage: 75,
        mentorPercentage: 15,
        labFundPercentage: 10,
        reasonNote: 'Thử thay đổi tỷ lệ phân bổ doanh thu.',
      })
      .expect(409);

    expect(immutableRes.body.code).toBe('IMMUTABLE_REVENUE_SPLIT_POLICY');

    // 4. SYSTEM_ADMIN cập nhật tham số thời lượng dự án hợp lệ -> 200 OK
    const updateRes = await request(app.getHttpServer())
      .patch('/api/v1/system-admin/governance/config')
      .set('Authorization', `Bearer ${sysAdminToken}`)
      .send({
        minDurationWeeks: 6,
        maxDurationWeeks: 20,
        requireReasonNoteMinLength: 15,
        reasonNote: 'Chuẩn hóa khung thời lượng dự án thực tập ODC học kỳ 2.',
      })
      .expect(200);

    expect(updateRes.body.projectLimits.minDurationWeeks).toBe(6);
    expect(updateRes.body.projectLimits.maxDurationWeeks).toBe(20);
  });

  it('TC-SYS-D14-02: Khóa / Mở khóa Tài khoản, Chặn tự khóa System Admin & Báo cáo Kiểm toán Liên thông Sprint 2', async () => {
    // 1. Khóa tài khoản đối tác vi phạm quy chế -> LOCKED
    const lockRes = await request(app.getHttpServer())
      .post('/api/v1/system-admin/governance/users/ent-violator-01/status')
      .set('Authorization', `Bearer ${sysAdminToken}`)
      .send({
        targetEmail: 'violator@company.vn',
        targetRole: UserRole.ENTERPRISE,
        newStatus: UserStatus.LOCKED,
        reasonNote: 'Tạm khóa tài khoản để xác minh lại giấy phép kinh doanh.',
      })
      .expect(200);

    expect(lockRes.body.status).toBe(UserStatus.LOCKED);

    // 2. Mở khóa lại tài khoản sau khi xác minh xong -> ACTIVE
    const unlockRes = await request(app.getHttpServer())
      .post('/api/v1/system-admin/governance/users/ent-violator-01/status')
      .set('Authorization', `Bearer ${sysAdminToken}`)
      .send({
        targetEmail: 'violator@company.vn',
        targetRole: UserRole.ENTERPRISE,
        newStatus: UserStatus.ACTIVE,
        reasonNote: 'Đã bổ sung giấy phép hợp lệ, khôi phục trạng thái ACTIVE.',
      })
      .expect(200);

    expect(unlockRes.body.status).toBe(UserStatus.ACTIVE);

    // 3. Tạo một dự án + cột mốc + giải ngân 70/20/10 để kiểm toán Báo cáo Liên thông Sprint 2
    const profileRes = await request(app.getHttpServer())
      .post('/api/v1/enterprises/profile')
      .set('Authorization', `Bearer ${enterpriseAToken}`)
      .send({
        companyName: 'Công ty Cổ phần Kiểm toán Số D14',
        taxCode: '0316667778',
        industry: 'Enterprise AuditTech',
        address: 'Quận 3, TP.HCM',
        representativeName: 'Lê Đại Diện D14',
        contactEmail: 'contact@audittech-d14.vn',
        contactPhone: '0909555666',
      })
      .expect(200);

    await request(app.getHttpServer())
      .patch(`/api/v1/enterprises/${profileRes.body.id}/verify`)
      .set('Authorization', `Bearer ${labAdminToken}`)
      .send({
        status: 'VERIFIED',
        note: 'Xác thực doanh nghiệp D14.',
      })
      .expect(200);

    const draftRes = await request(app.getHttpServer())
      .post('/api/v1/projects/proposals')
      .set('Authorization', `Bearer ${enterpriseAToken}`)
      .send({
        title: 'Hệ thống Giám sát và Kiểm toán Tự động LabOdc D14',
        summary: 'Kiểm toán liên thông dự án và sổ cái ký quỹ 70/20/10.',
        description:
          'Xây dựng bảng điều khiển kiểm toán toàn diện cho System Admin và Lab Admin trong Sprint 2.',
        deliverables: 'Báo cáo kiểm toán Sprint 2, Nhật ký quản trị hệ thống.',
        requiredSkills: ['TypeScript', 'NestJS', 'React', 'PostgreSQL'],
        minTeamSize: 3,
        maxTeamSize: 5,
        durationWeeks: 8,
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
      .send({ reviewNote: 'Duyệt dự án D14.' })
      .expect(200);

    const msRes = await request(app.getHttpServer())
      .post('/api/v1/payments/milestones')
      .set('Authorization', `Bearer ${enterpriseAToken}`)
      .send({
        projectId,
        title: 'Cột mốc Duy nhất - Bàn giao Hệ thống Kiểm toán D14',
        description: 'Nghiệm thu toàn bộ tính năng quản trị và đối soát sổ cái.',
        amount: 10000003,
      })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/v1/payments/milestones/${msRes.body.id}/sync-payos-webhook`)
      .set('Authorization', `Bearer ${enterpriseAToken}`)
      .send({ reference: 'FT-PAYOS-D14-001' })
      .expect(200);

    await request(app.getHttpServer())
      .post(`/api/v1/payments/milestones/${msRes.body.id}/submit-deliverable`)
      .set('Authorization', `Bearer ${talentToken}`)
      .send({
        deliverableUrl: 'https://github.com/thong-hdhs/labodc-system/releases/tag/v1.4',
        deliverableNote: 'Hoàn tất bàn giao kiểm toán D14.',
      })
      .expect(200);

    await request(app.getHttpServer())
      .post(`/api/v1/payments/milestones/${msRes.body.id}/accept-and-split`)
      .set('Authorization', `Bearer ${enterpriseAToken}`)
      .send({
        reviewNote: 'Nghiệm thu hoàn tất dự án D14.',
        markProjectCompleted: true,
      })
      .expect(200);

    // 4. Tra cứu Báo cáo Kiểm toán Liên thông Sprint 2 & Nhật ký Quản trị
    const readinessRes = await request(app.getHttpServer())
      .get('/api/v1/system-admin/governance/sprint2-readiness')
      .set('Authorization', `Bearer ${sysAdminToken}`)
      .expect(200);

    expect(readinessRes.body.checkpointCode).toBe(
      'D14_SPRINT2_GOVERNANCE_AND_FINANCE_AUDIT',
    );
    expect(readinessRes.body.projectLifecycleSummary.completed).toBe(1);
    expect(readinessRes.body.escrowAndLedgerAudit).toEqual({
      totalMilestones: 1,
      disbursedMilestones: 1,
      refundedMilestones: 0,
      totalEscrowDepositedVnd: 10000003,
      totalDisbursed702010Vnd: 10000003,
      totalRefundedVnd: 0,
      escrowHeldBalanceVnd: 0,
      ledgerInvariantHold: true,
    });
    expect(readinessRes.body.governanceAuditCount).toBe(3);

    const logsRes = await request(app.getHttpServer())
      .get('/api/v1/system-admin/governance/logs')
      .set('Authorization', `Bearer ${sysAdminToken}`)
      .expect(200);

    expect(logsRes.body).toHaveLength(3);
  });
});