import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Day 26 — Mobile Evaluations to 70% Team Payout Bridge & Full Parity Gate D26 (E2E)', () => {
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

  it('TC-BRIDGE-D26-01: Đối soát điểm đánh giá đóng góp trên Mobile với Quỹ 70% Nhóm Sinh viên và ký nghiệm thu Gate D26', async () => {
    const reconRes = await request(app.getHttpServer())
      .post('/api/v1/system-admin/mobile-eval-bridge/reconcile-payout')
      .set('Authorization', `Bearer ${labAdminToken}`)
      .send({
        projectCode: 'PRJ-MOB-EVAL-D26',
        milestoneAmountVnd: 20000003,
        members: [
          {
            memberEmail: 'talent.leader.d26@labodc.edu.vn',
            evaluationGrade: 'EXCELLENT',
            contributionPercent: 60,
          },
          {
            memberEmail: 'talent.member.d26@labodc.edu.vn',
            evaluationGrade: 'GOOD',
            contributionPercent: 40,
          },
        ],
      })
      .expect(201);

    expect(reconRes.body.reconciliationCode).toBe('EVAL-PAY-D26-001');
    expect(reconRes.body.teamPool70Vnd).toBe(14000002);
    expect(reconRes.body.allocatedMembersSumVnd).toBe(14000002);
    expect(reconRes.body.labPool10Vnd).toBe(2000001);

    const signoffRes = await request(app.getHttpServer())
      .post('/api/v1/system-admin/mobile-eval-bridge/gate-d26-signoff')
      .set('Authorization', `Bearer ${sysAdminToken}`)
      .send({
        reconciliationId: reconRes.body.id,
        signoffNote:
          'Xác nhận tương đương 100% tính năng giữa Web và Flutter Mobile (Evaluations, Private Files, Team Payout 70%).',
      })
      .expect(201);

    expect(signoffRes.body.signoffCode).toBe('GATE-D26-001');
    expect(signoffRes.body.gateCode).toBe(
      'GATE_D26_MOBILE_FULL_PARITY_AND_EVAL_BRIDGE',
    );
    expect(signoffRes.body.gateStatus).toBe('PASSED_FULL_PARITY');

    const parityRes = await request(app.getHttpServer())
      .get('/api/v1/system-admin/mobile-eval-bridge/parity-status')
      .set('Authorization', `Bearer ${labAdminToken}`)
      .expect(200);

    expect(parityRes.body.mobileFeatureParityPercent).toBe(100);
    expect(parityRes.body.gateD26SignedOff).toBe(true);
  });
});