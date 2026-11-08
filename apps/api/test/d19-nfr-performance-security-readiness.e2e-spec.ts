import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Day 19 — NFR Uptime Probes, SLA Latency Benchmarks, 6-Role Security Matrix & Production Readiness Sign-off (E2E)', () => {
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

  it('TC-NFR-D19-01: Kiểm tra Liveness/Readiness Probes (REQ-NFR-01) và Đo kiểm Thời gian Phản hồi Thực tế P95 <= 500ms / 1000ms (REQ-NFR-02)', async () => {
    // 1. Kiểm tra Public Probes cho Container Monitoring
    const probeStart = Date.now();
    const probeRes = await request(app.getHttpServer())
      .get('/api/v1/system-admin/readiness/probes')
      .expect(200);
    const stdLatencyMs = Date.now() - probeStart;

    expect(probeRes.body.liveness).toBe('ALIVE');
    expect(probeRes.body.readiness).toBe('READY');
    expect(probeRes.body.uptimeTargetPercent).toBe(99.0);
    expect(stdLatencyMs).toBeLessThanOrEqual(500);

    // 2. Đo thời gian phản hồi thực tế của API Đối soát Sổ cái Tài chính (<= 1000ms)
    const finStart = Date.now();
    await request(app.getHttpServer())
      .get('/api/v1/payments/reconciliation/summary')
      .set('Authorization', `Bearer ${labAdminToken}`)
      .expect(200);
    const finLatencyMs = Date.now() - finStart;
    expect(finLatencyMs).toBeLessThanOrEqual(1000);

    // 3. Ghi nhận 2 kết quả đo SLA thực tế vào hệ thống
    const sla1 = await request(app.getHttpServer())
      .post('/api/v1/system-admin/readiness/sla-benchmarks')
      .set('Authorization', `Bearer ${sysAdminToken}`)
      .send({
        endpointCategory: 'STANDARD_API',
        endpointPath: '/api/v1/system-admin/readiness/probes',
        observedP95Ms: stdLatencyMs,
      })
      .expect(201);

    expect(sla1.body.withinSla).toBe(true);

    const sla2 = await request(app.getHttpServer())
      .post('/api/v1/system-admin/readiness/sla-benchmarks')
      .set('Authorization', `Bearer ${labAdminToken}`)
      .send({
        endpointCategory: 'FINANCIAL_LEDGER_API',
        endpointPath: '/api/v1/payments/reconciliation/summary',
        observedP95Ms: finLatencyMs,
      })
      .expect(201);

    expect(sla2.body.withinSla).toBe(true);

    const listSlaRes = await request(app.getHttpServer())
      .get('/api/v1/system-admin/readiness/sla-benchmarks')
      .set('Authorization', `Bearer ${sysAdminToken}`)
      .expect(200);

    expect(listSlaRes.body.totalMeasured).toBe(2);
    expect(listSlaRes.body.complianceRatePercent).toBe(100);
  });

  it('TC-NFR-D19-02: Kiểm toán Ma trận Bảo mật RBAC 6 Vai trò (REQ-NFR-03) & Ký Chứng nhận Sẵn sàng Production (ADR-05)', async () => {
    // 1. Chặn ENTERPRISE và TALENT truy cập trái quyền vào API Kiểm toán Bảo mật & Ký Production Sign-off
    await request(app.getHttpServer())
      .get('/api/v1/system-admin/readiness/security-matrix')
      .set('Authorization', `Bearer ${enterpriseAToken}`)
      .expect(403);

    await request(app.getHttpServer())
      .post('/api/v1/system-admin/readiness/sign-off')
      .set('Authorization', `Bearer ${talentToken}`)
      .send({
        releaseVersion: 'v1.0.0-unauthorized',
        note: 'Sinh viên cố tình ký duyệt Production Readiness.',
      })
      .expect(403);

    await request(app.getHttpServer())
      .post('/api/v1/system-admin/readiness/sign-off')
      .set('Authorization', `Bearer ${labAdminToken}`)
      .send({
        releaseVersion: 'v1.0.0-labadmin',
        note: 'Lab Admin không có quyền ký Production Sign-off của System Admin.',
      })
      .expect(403);

    // 2. Truy xuất Ma trận Kiểm toán Bảo mật RBAC 6 vai trò
    const matrixRes = await request(app.getHttpServer())
      .get('/api/v1/system-admin/readiness/security-matrix')
      .set('Authorization', `Bearer ${sysAdminToken}`)
      .expect(200);

    expect(matrixRes.body.verifiedRolesCount).toBe(6);
    expect(matrixRes.body.auditStatus).toBe('VERIFIED_PASS');
    expect(matrixRes.body.guardsEnforced).toEqual({
      jwtBearerAuthentication: true,
      serverSideRolesGuard: true,
      enterpriseCrossTenantIsolation: true,
      payosWebhookHmacSha256: true,
      idempotentWebhookReplayProtection: true,
      immutable702010SplitGuard: true,
    });

    // 3. SYSTEM_ADMIN ký Chứng nhận Sẵn sàng Production (Production Readiness Sign-off)
    const signoffRes = await request(app.getHttpServer())
      .post('/api/v1/system-admin/readiness/sign-off')
      .set('Authorization', `Bearer ${sysAdminToken}`)
      .send({
        releaseVersion: 'v1.0.0-rc1',
        note: 'Hoàn tất kiểm định hiệu năng SLA P95, bảo mật RBAC 6 vai trò và sổ cái bất biến 70/20/10.',
      })
      .expect(201);

    expect(signoffRes.body.allNfrGatesPassed).toBe(true);
    expect(signoffRes.body.ledgerInvariantVerified).toBe(true);
    expect(signoffRes.body.rbacMatrixVerified).toBe(true);
    expect(signoffRes.body.slaComplianceRatePercent).toBe(100);
  });
});