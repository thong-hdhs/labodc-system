import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Day 22 — Final 22-Day Project Completion Summary, Operational Runbook Archival & Gate D22 Sign-off (E2E)', () => {
  let app: INestApplication;
  let sysAdminToken: string;
  let labAdminToken: string;
  let enterpriseToken: string;

  const password =
    process.env.INITIAL_SYSADMIN_PASSWORD || 'ChangeMe_LabOdc@2026!';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    const [loginSys, loginLab, loginEnt] = await Promise.all([
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
    ]);

    sysAdminToken = loginSys.body.accessToken;
    labAdminToken = loginLab.body.accessToken;
    enterpriseToken = loginEnt.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  it('TC-ARCHIVAL-D22-01: Truy xuất Báo cáo Tổng kết Toàn trình 22 Ngày (D1 -> D22) & Kiểm tra Phân quyền RBAC', async () => {
    // 1. Chặn ENTERPRISE truy cập Báo cáo Tổng kết Toàn trình 22 Ngày (403 Forbidden)
    await request(app.getHttpServer())
      .get('/api/v1/system-admin/final-archival/master-summary')
      .set('Authorization', `Bearer ${enterpriseToken}`)
      .expect(403);

    // 2. LAB_ADMIN truy xuất Báo cáo Tổng kết Toàn trình 22 Ngày (200 OK)
    const summaryRes = await request(app.getHttpServer())
      .get('/api/v1/system-admin/final-archival/master-summary')
      .set('Authorization', `Bearer ${labAdminToken}`)
      .expect(200);

    expect(summaryRes.body.roadmapCode).toBe('LABODC_22_DAY_FULLSTACK_ROADMAP');
    expect(summaryRes.body.totalDaysCompleted).toBe(22);
    expect(summaryRes.body.allGatesPassed).toBe(true);
    expect(summaryRes.body.phases).toHaveLength(4);
    expect(summaryRes.body.qualityAndSecurityMetrics).toEqual({
      rtmCoveragePercent: 100,
      adrCompliantCount: 5,
      slaCompliancePercent: 100,
      mobileCompanionCompatible: true,
      rbacRolesVerifiedCount: 6,
    });
    expect(
      summaryRes.body.financialLedgerFinalTotals.ledgerInvariantHold,
    ).toBe(true);
  });

  it('TC-ARCHIVAL-D22-02: Cấp Chứng nhận Hoàn thành Dự án & Lưu trữ Hồ sơ Vận hành Cuối khóa (Gate D22)', async () => {
    // 1. Chặn LAB_ADMIN cấp Chứng nhận Hoàn thành Dự án D22 (403 Forbidden)
    await request(app.getHttpServer())
      .post('/api/v1/system-admin/final-archival/certificates')
      .set('Authorization', `Bearer ${labAdminToken}`)
      .send({
        releaseVersion: 'v1.0.0-final-d22',
        archivalNote: 'Lab Admin thử cấp chứng nhận hoàn thành dự án D22.',
      })
      .expect(403);

    // 2. SYSTEM_ADMIN cấp Chứng nhận Hoàn thành Dự án & Lưu trữ Hồ sơ Cuối khóa D22 (201 Created)
    const certRes = await request(app.getHttpServer())
      .post('/api/v1/system-admin/final-archival/certificates')
      .set('Authorization', `Bearer ${sysAdminToken}`)
      .send({
        releaseVersion: 'v1.0.0-final-d22',
        archivalNote:
          'Hoàn tất 100% lộ trình 22 ngày dự án LabOdc: Backend, Web, Mobile Companion và Sổ cái 70/20/10 đồng bộ tuyệt đối.',
      })
      .expect(201);

    expect(certRes.body.certificateCode).toBe('CERT-D22-FINAL-001');
    expect(certRes.body.gateCode).toBe(
      'GATE_D22_FINAL_PROJECT_COMPLETION_AND_ARCHIVAL',
    );
    expect(certRes.body.gateStatus).toBe('COMPLETED_AND_ARCHIVED');
    expect(certRes.body.totalDaysCompleted).toBe(22);
    expect(certRes.body.studentAMigrationsCount).toBe(17);
    expect(certRes.body.studentBMigrationsCount).toBe(9);
    expect(certRes.body.rtmCoveragePercent).toBe(100);
    expect(certRes.body.slaCompliancePercent).toBe(100);
    expect(certRes.body.mobileContractVerified).toBe(true);
    expect(certRes.body.ledgerInvariantVerified).toBe(true);
    expect(certRes.body.operationalRunbook.length).toBeGreaterThanOrEqual(5);

    // 3. Kiểm tra danh sách Chứng nhận Hoàn thành Dự án D22 đã lưu trữ
    const listRes = await request(app.getHttpServer())
      .get('/api/v1/system-admin/final-archival/certificates')
      .set('Authorization', `Bearer ${labAdminToken}`)
      .expect(200);

    expect(listRes.body).toHaveLength(1);
    expect(listRes.body[0].certificateCode).toBe('CERT-D22-FINAL-001');
  });
});