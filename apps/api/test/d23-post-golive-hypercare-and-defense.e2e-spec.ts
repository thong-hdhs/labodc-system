import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Day 23 — Post-Go-Live Hypercare Monitoring, Disaster Recovery (DR) Ledger Drill & Final Defense Gate D23 (E2E)', () => {
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

  it('TC-HYPERCARE-D23-01: Kiểm tra Trạng thái Vận hành Hypercare Sau Go-Live & Thực thi Diễn tập Sao lưu Khôi phục Sổ cái (DR Drill)', async () => {
    // 1. Chặn ENTERPRISE truy cập trạng thái Vận hành Hypercare (403 Forbidden)
    await request(app.getHttpServer())
      .get('/api/v1/system-admin/hypercare/status')
      .set('Authorization', `Bearer ${enterpriseToken}`)
      .expect(403);

    // 2. LAB_ADMIN kiểm tra trạng thái Hypercare trước khi chạy DR Drill
    const initStatusRes = await request(app.getHttpServer())
      .get('/api/v1/system-admin/hypercare/status')
      .set('Authorization', `Bearer ${labAdminToken}`)
      .expect(200);

    expect(initStatusRes.body.windowCode).toBe(
      'D23_POST_GOLIVE_HYPERCARE_WINDOW',
    );
    expect(initStatusRes.body.liveness).toBe('ALIVE');
    expect(initStatusRes.body.readiness).toBe('READY');
    expect(initStatusRes.body.ledgerInvariantHold).toBe(true);
    expect(initStatusRes.body.mobileCompanionCompatible).toBe(true);

    // 3. LAB_ADMIN thực thi Diễn tập Sao lưu & Khôi phục Sổ cái Bất biến (DR Drill)
    const drillRes = await request(app.getHttpServer())
      .post('/api/v1/system-admin/hypercare/dr-drills')
      .set('Authorization', `Bearer ${labAdminToken}`)
      .send({
        scenarioName:
          'Diễn tập Khôi phục Snapshot PostgreSQL & Đối soát Bất biến Sổ cái 70/20/10',
        measuredRtoSeconds: 38,
        drillNote:
          'Khôi phục thành công toàn bộ dữ liệu dự án và sổ cái trong 38 giây, RPO = 0.',
      })
      .expect(201);

    expect(drillRes.body.drillCode).toBe('DR-D23-001');
    expect(drillRes.body.withinDrSla).toBe(true);
    expect(drillRes.body.measuredRpoTransactionsLost).toBe(0);
    expect(drillRes.body.ledgerSnapshotVerified).toBe(true);

    // 4. Chặn LAB_ADMIN ký Biên bản Nghiệm thu Bảo vệ Đồ án Gate D23 (403 Forbidden)
    await request(app.getHttpServer())
      .post('/api/v1/system-admin/hypercare/gate-d23-defense-signoff')
      .set('Authorization', `Bearer ${labAdminToken}`)
      .send({
        drDrillId: drillRes.body.id,
        releaseVersion: 'v1.0.0-hypercare-d23',
        defenseNote: 'Lab Admin thử ký nghiệm thu Gate D23.',
      })
      .expect(403);

    // 5. SYSTEM_ADMIN ký Biên bản Nghiệm thu Hypercare & Bảo vệ Đồ án Gate D23 (201 Created)
    const signoffRes = await request(app.getHttpServer())
      .post('/api/v1/system-admin/hypercare/gate-d23-defense-signoff')
      .set('Authorization', `Bearer ${sysAdminToken}`)
      .send({
        drDrillId: drillRes.body.id,
        releaseVersion: 'v1.0.0-hypercare-d23',
        defenseNote:
          'Hoàn tất vận hành Hypercare sau Go-Live, diễn tập DR Drill đạt chuẩn RTO 38s và sẵn sàng bảo vệ đồ án.',
      })
      .expect(201);

    expect(signoffRes.body.defenseCode).toBe('DEFENSE-D23-FINAL-001');
    expect(signoffRes.body.gateCode).toBe(
      'GATE_D23_POST_GOLIVE_HYPERCARE_AND_DEFENSE',
    );
    expect(signoffRes.body.gateStatus).toBe('PASSED_AND_DEFENSE_READY');
    expect(signoffRes.body.hypercareHealthy).toBe(true);
    expect(signoffRes.body.ledgerInvariantVerified).toBe(true);
    expect(signoffRes.body.rtmCoveragePercent).toBe(100);

    // 6. Kiểm tra lại trạng thái Hypercare sau khi đã ký Gate D23
    const finalStatusRes = await request(app.getHttpServer())
      .get('/api/v1/system-admin/hypercare/status')
      .set('Authorization', `Bearer ${sysAdminToken}`)
      .expect(200);

    expect(finalStatusRes.body.totalDrDrillsExecuted).toBe(1);
    expect(finalStatusRes.body.latestDrDrillPassed).toBe(true);
    expect(finalStatusRes.body.gateD23SignedOff).toBe(true);
  });
});