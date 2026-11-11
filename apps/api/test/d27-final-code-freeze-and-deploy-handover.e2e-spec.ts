import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Day 27 — Final 27-Day Code Freeze Manifest & Test/Deploy Phase Handover Gate D27 (E2E)', () => {
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

  it('TC-FREEZE-D27-01: Kiểm kê toàn bộ 27 ngày code (22 migrations của A + 9 migrations của B) và khóa đóng băng mã nguồn Gate D27', async () => {
    const invBeforeRes = await request(app.getHttpServer())
      .get('/api/v1/system-admin/code-freeze-d27/inventory')
      .set('Authorization', `Bearer ${labAdminToken}`)
      .expect(200);

    expect(invBeforeRes.body.inventoryCode).toBe(
      'D27_FINAL_CODE_FREEZE_INVENTORY',
    );
    expect(invBeforeRes.body.totalCodingDaysCompleted).toBe(27);
    expect(invBeforeRes.body.studentAMigrationsCount).toBe(22);
    expect(invBeforeRes.body.studentBMigrationsCount).toBe(9);
    expect(invBeforeRes.body.totalDatabaseMigrations).toBe(31);
    expect(invBeforeRes.body.codeFreezeLocked).toBe(false);

    const lockRes = await request(app.getHttpServer())
      .post('/api/v1/system-admin/code-freeze-d27/lock-manifest')
      .set('Authorization', `Bearer ${sysAdminToken}`)
      .send({
        releaseCandidateTag: 'v3.0.0-rc-freeze-d27',
        nextPhasePlan:
          'Hoàn thành toàn bộ 27 ngày code của Sinh viên A và Sinh viên B; chuyển sang giai đoạn tập trung Test & Deploy.',
      })
      .expect(201);

    expect(lockRes.body.freezeCode).toBe('FREEZE-D27-FINAL-001');
    expect(lockRes.body.gateCode).toBe(
      'GATE_D27_FINAL_CODE_FREEZE_AND_TEST_DEPLOY_HANDOVER',
    );
    expect(lockRes.body.gateStatus).toBe(
      'CODE_FROZEN_READY_FOR_TEST_AND_DEPLOY',
    );
    expect(lockRes.body.codeFreezeLocked).toBe(true);

    const invAfterRes = await request(app.getHttpServer())
      .get('/api/v1/system-admin/code-freeze-d27/inventory')
      .set('Authorization', `Bearer ${labAdminToken}`)
      .expect(200);

    expect(invAfterRes.body.codeFreezeLocked).toBe(true);
    expect(invAfterRes.body.latestManifest.freezeCode).toBe(
      'FREEZE-D27-FINAL-001',
    );
  });
});