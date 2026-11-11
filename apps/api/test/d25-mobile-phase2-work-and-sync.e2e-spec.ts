import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Day 25 — Mobile Companion Phase 2 API Contracts & Cross-Platform Sync Gate D25 (E2E)', () => {
  let app: INestApplication;
  let sysAdminToken: string;
  let labAdminToken: string;

  const password =
    process.env.INITIAL_SYSADMIN_PASSWORD || 'ChangeMe_LabOdc@2026!';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    const [loginSys, loginLab] = await Promise.all([
      request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'sysadmin@labodc.uth.edu.vn', password })
        .expect(200),
      request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'labadmin@labodc.uth.edu.vn', password })
        .expect(200),
    ]);

    sysAdminToken = loginSys.body.accessToken;
    labAdminToken = loginLab.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  it('TC-SYNC-D25-01: Kiểm định ma trận 6 hợp đồng API Mobile Pha 2 (Applications, Work/Tasks, Reports, Private Files) và ký đóng cổng Gate D25', async () => {
    const matrixRes = await request(app.getHttpServer())
      .get('/api/v1/system-admin/mobile-phase2/contracts')
      .set('Authorization', `Bearer ${labAdminToken}`)
      .expect(200);

    expect(matrixRes.body.matrixCode).toBe('D25_MOBILE_PHASE2_CONTRACT_MATRIX');
    expect(matrixRes.body.totalEndpoints).toBe(6);
    expect(matrixRes.body.allCompatible).toBe(true);

    await request(app.getHttpServer())
      .post('/api/v1/system-admin/readiness/sla-benchmarks')
      .set('Authorization', `Bearer ${labAdminToken}`)
      .send({
        endpointCategory: 'STANDARD_API',
        endpointPath: '/api/v1/system-admin/mobile-phase2/contracts',
        observedP95Ms: 42,
      })
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/v1/system-admin/mobile-phase2/sync-checkpoints')
      .set('Authorization', `Bearer ${labAdminToken}`)
      .send({
        mobileReleaseVersion: 'v2.5.0-mobile-p2-d25',
        syncNote: 'Lab Admin không được phép ký Gate D25',
      })
      .expect(403);

    const signRes = await request(app.getHttpServer())
      .post('/api/v1/system-admin/mobile-phase2/sync-checkpoints')
      .set('Authorization', `Bearer ${sysAdminToken}`)
      .send({
        mobileReleaseVersion: 'v2.5.0-mobile-p2-d25',
        syncNote:
          'Xác nhận đồng bộ 100% luồng Applications, Work Tasks, Progress Reports và Private Files trên Flutter Mobile Companion D25.',
      })
      .expect(201);

    expect(signRes.body.checkpointCode).toBe('SYNC-D25-001');
    expect(signRes.body.gateCode).toBe('GATE_D25_MOBILE_PHASE2_WORK_AND_SYNC');
    expect(signRes.body.gateStatus).toBe('PASSED');
    expect(signRes.body.verifiedEndpointsCount).toBe(6);
  });
});