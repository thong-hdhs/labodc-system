import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Day 21 — Mobile Companion API Contract Verification, Post-Deploy Smoke Suite & Sprint 3 Gate D21 Sign-off (E2E)', () => {
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

    const [loginSys, loginLab, loginEnt, loginTalent] = await Promise.all([
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
    enterpriseToken = loginEnt.body.accessToken;
    talentToken = loginTalent.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  it('TC-GOLIVE-D21-01: Kiểm chứng trực tiếp các API phục vụ Flutter Mobile Companion (apps/mobile: Login, Public Project Discovery, System Probes & Mobile Contract)', async () => {
    // 1. Kiểm tra API POST /api/v1/auth/login phục vụ auth_repository.dart trên Mobile
    const mobileLoginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'talent@student.uth.edu.vn', password })
      .expect(200);

    expect(mobileLoginRes.body.accessToken).toBeDefined();
    expect(mobileLoginRes.body.user.role).toBe('TALENT');
    expect(talentToken).toBeDefined();

    // 2. Kiểm tra API GET /api/v1/projects/public phục vụ project_repository.dart trên Mobile
    const pubProjectsRes = await request(app.getHttpServer())
      .get('/api/v1/projects/public')
      .expect(200);

    expect(Array.isArray(pubProjectsRes.body)).toBe(true);

    // 3. Kiểm tra API GET /api/v1/system-admin/readiness/probes phục vụ kiểm tra kết nối từ Mobile
    const probesRes = await request(app.getHttpServer())
      .get('/api/v1/system-admin/readiness/probes')
      .expect(200);

    expect(probesRes.body.liveness).toBe('ALIVE');
    expect(probesRes.body.readiness).toBe('READY');

    // 4. Kiểm tra báo cáo Hợp đồng Mobile Companion từ SystemAdmin Golive Controller
    const contractRes = await request(app.getHttpServer())
      .get('/api/v1/system-admin/golive/mobile-contract')
      .set('Authorization', `Bearer ${labAdminToken}`)
      .expect(200);

    expect(contractRes.body.contractVersion).toBe(
      'D21_FLUTTER_MOBILE_COMPANION_V1',
    );
    expect(contractRes.body.allCompatible).toBe(true);
    expect(contractRes.body.totalEndpointsChecked).toBe(4);
  });

  it('TC-GOLIVE-D21-02: Thực thi Post-Deploy Smoke Suite 6 phân hệ & Ký Biên bản Đóng Cổng Sprint 3 Gate D21', async () => {
    // 1. Chặn ENTERPRISE gọi API kích hoạt Smoke Suite (403 Forbidden)
    await request(app.getHttpServer())
      .post('/api/v1/system-admin/golive/smoke-runs')
      .set('Authorization', `Bearer ${enterpriseToken}`)
      .send({ releaseTag: 'v1.0.0-golive-d21' })
      .expect(403);

    // 2. LAB_ADMIN kích hoạt chạy Post-Deploy Smoke Suite 6 phân hệ (201 Created)
    const smokeRes = await request(app.getHttpServer())
      .post('/api/v1/system-admin/golive/smoke-runs')
      .set('Authorization', `Bearer ${labAdminToken}`)
      .send({
        releaseTag: 'v1.0.0-golive-d21',
        environmentName: 'PRODUCTION',
      })
      .expect(201);

    expect(smokeRes.body.runCode).toBe('SMOKE-D21-001');
    expect(smokeRes.body.totalChecks).toBe(6);
    expect(smokeRes.body.passedChecks).toBe(6);
    expect(smokeRes.body.passRatePercent).toBe(100);
    expect(smokeRes.body.mobileContractVerified).toBe(true);
    expect(smokeRes.body.ledgerInvariantVerified).toBe(true);

    // 3. Chặn LAB_ADMIN ký Biên bản Đóng Cổng Gate D21 (403 Forbidden)
    await request(app.getHttpServer())
      .post('/api/v1/system-admin/golive/gate-d21-signoff')
      .set('Authorization', `Bearer ${labAdminToken}`)
      .send({
        smokeRunId: smokeRes.body.id,
        signoffNote: 'Lab Admin thử ký đóng cổng Gate D21.',
      })
      .expect(403);

    // 4. SYSTEM_ADMIN ký Biên bản Đóng Cổng Sprint 3 Gate D21 (201 Created)
    const signoffRes = await request(app.getHttpServer())
      .post('/api/v1/system-admin/golive/gate-d21-signoff')
      .set('Authorization', `Bearer ${sysAdminToken}`)
      .send({
        smokeRunId: smokeRes.body.id,
        signoffNote:
          'Nghiệm thu toàn diện Sprint 3 Gate D21: Sổ cái 70/20/10 cân bằng, Mobile Companion tương thích 100%, hệ thống sẵn sàng Go-Live.',
      })
      .expect(201);

    expect(signoffRes.body.gateCode).toBe(
      'GATE_D21_SPRINT3_AND_PRODUCTION_GOLIVE',
    );
    expect(signoffRes.body.gateStatus).toBe('PASSED');
    expect(signoffRes.body.mobileCompanionReady).toBe(true);
    expect(signoffRes.body.financialLedgerInvariantHold).toBe(true);

    // 5. Truy xuất trạng thái tổng hợp Gate D21
    const statusRes = await request(app.getHttpServer())
      .get('/api/v1/system-admin/golive/gate-d21-status')
      .set('Authorization', `Bearer ${labAdminToken}`)
      .expect(200);

    expect(statusRes.body.gateSignedOff).toBe(true);
    expect(statusRes.body.signoff.smokeRunCode).toBe('SMOKE-D21-001');
  });
});