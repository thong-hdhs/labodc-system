import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Day 24 — Permanent 70/20/10 Ledger Seal, Academic Council Defense Dossier & Gate D24 Final Verdict (E2E)', () => {
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

  it('TC-DEFENSE-D24-01: Truy xuất Hồ sơ Bảo vệ Đồ án Gate D24, Niêm phong Vĩnh viễn Sổ cái 70/20/10 & Ký Quyết định Nghiệm thu Hội đồng', async () => {
    // 1. Chặn ENTERPRISE truy cập Hồ sơ Bảo vệ Đồ án Gate D24 (403 Forbidden)
    await request(app.getHttpServer())
      .get('/api/v1/system-admin/academic-defense/dossier')
      .set('Authorization', `Bearer ${enterpriseToken}`)
      .expect(403);

    // 2. LAB_ADMIN kiểm tra Hồ sơ Bảo vệ Đồ án trước khi niêm phong sổ cái
    const initDossierRes = await request(app.getHttpServer())
      .get('/api/v1/system-admin/academic-defense/dossier')
      .set('Authorization', `Bearer ${labAdminToken}`)
      .expect(200);

    expect(initDossierRes.body.dossierCode).toBe(
      'D24_ACADEMIC_COUNCIL_DEFENSE_DOSSIER',
    );
    expect(initDossierRes.body.totalDaysCompleted).toBe(24);
    expect(initDossierRes.body.rtmCoveragePercent).toBe(100);
    expect(initDossierRes.body.mobileCompanionVerified).toBe(true);
    expect(initDossierRes.body.ledgerInvariantHold).toBe(true);
    expect(initDossierRes.body.ledgerSealed).toBe(false);

    // 3. LAB_ADMIN thực hiện Niêm phong Vĩnh viễn Sổ cái Bất biến 70/20/10 (201 Created)
    const sealRes = await request(app.getHttpServer())
      .post('/api/v1/system-admin/academic-defense/ledger-seals')
      .set('Authorization', `Bearer ${labAdminToken}`)
      .send({
        releaseTag: 'v1.0.0-final-defense-d24',
        sealNote:
          'Niêm phong vĩnh viễn Sổ cái 70/20/10 phục vụ Hội đồng Bảo vệ Đồ án Gate D24.',
      })
      .expect(201);

    expect(sealRes.body.sealCode).toBe('SEAL-D24-001');
    expect(sealRes.body.escrowHeldBalanceVnd).toBe(0);
    expect(sealRes.body.invariantVerified).toBe(true);

    // 4. Chặn LAB_ADMIN ký Quyết định Nghiệm thu Hội đồng Gate D24 (403 Forbidden)
    await request(app.getHttpServer())
      .post('/api/v1/system-admin/academic-defense/gate-d24-verdict')
      .set('Authorization', `Bearer ${labAdminToken}`)
      .send({
        ledgerSealId: sealRes.body.id,
        studentAScore: 98,
        studentBScore: 98,
        councilEvaluationNote: 'Lab Admin thử ký quyết định hội đồng D24.',
      })
      .expect(403);

    // 5. SYSTEM_ADMIN ký Quyết định Nghiệm thu Bảo vệ Đồ án Trước Hội đồng Gate D24 (201 Created)
    const verdictRes = await request(app.getHttpServer())
      .post('/api/v1/system-admin/academic-defense/gate-d24-verdict')
      .set('Authorization', `Bearer ${sysAdminToken}`)
      .send({
        ledgerSealId: sealRes.body.id,
        studentAScore: 98,
        studentBScore: 98,
        councilEvaluationNote:
          'Hội đồng nghiệm thu đánh giá xuất sắc: Hệ thống LabOdc hoàn thành 100% yêu cầu nghiệp vụ, bảo mật RBAC 6 vai trò và sổ cái bất biến 70/20/10.',
      })
      .expect(201);

    expect(verdictRes.body.verdictCode).toBe('COUNCIL-D24-VERDICT-001');
    expect(verdictRes.body.gateCode).toBe(
      'GATE_D24_ACADEMIC_COUNCIL_DEFENSE_AND_LEDGER_SEAL',
    );
    expect(verdictRes.body.verdictStatus).toBe('APPROVED_WITH_DISTINCTION');
    expect(verdictRes.body.averageScore).toBe(98);
    expect(verdictRes.body.ledgerInvariantVerified).toBe(true);

    // 6. Kiểm tra lại Hồ sơ Bảo vệ Đồ án sau khi đã ký Gate D24
    const finalDossierRes = await request(app.getHttpServer())
      .get('/api/v1/system-admin/academic-defense/dossier')
      .set('Authorization', `Bearer ${sysAdminToken}`)
      .expect(200);

    expect(finalDossierRes.body.ledgerSealed).toBe(true);
    expect(finalDossierRes.body.gateD24SignedOff).toBe(true);
  });
});