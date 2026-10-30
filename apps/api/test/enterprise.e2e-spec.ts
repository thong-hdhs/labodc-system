import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Enterprise Profile Vertical Slice (D6 - REQ-ENT-01)', () => {
  let app: INestApplication;
  let enterpriseAToken: string;
  let enterpriseBToken: string;
  let labAdminToken: string;
  let talentToken: string;
  let enterpriseAProfileId: string;

  const password =
    process.env.INITIAL_SYSADMIN_PASSWORD || 'ChangeMe_LabOdc@2026!';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    const loginA = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'enterprise@company.vn', password })
      .expect(200);
    enterpriseAToken = loginA.body.accessToken;

    const loginB = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'enterprise2@company.vn', password })
      .expect(200);
    enterpriseBToken = loginB.body.accessToken;

    const loginLab = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'labadmin@labodc.uth.edu.vn', password })
      .expect(200);
    labAdminToken = loginLab.body.accessToken;

    const loginTalent = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'talent@student.uth.edu.vn', password })
      .expect(200);
    talentToken = loginTalent.body.accessToken;
  });

  it('TC-ENT-01: Doanh nghiệp A tạo, xem và cập nhật hồ sơ pháp nhân thành công; Lab Admin xác thực sang VERIFIED', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/api/v1/enterprises/profile')
      .set('Authorization', `Bearer ${enterpriseAToken}`)
      .send({
        companyName: 'Công ty Cổ phần Công nghệ UTH Partner',
        taxCode: '0312345678',
        industry: 'Logistics & Smart Transport',
        address: '02 Võ Oanh, Phường 25, Bình Thạnh, TP.HCM',
        website: 'https://uthpartner.vn',
        description: 'Đối tác doanh nghiệp tài trợ dự án thực tế tại LabOdc',
        representativeName: 'Trần Đại Diện',
        contactEmail: 'hr@uthpartner.vn',
        contactPhone: '0912345678',
      })
      .expect(200);

    expect(createRes.body.id).toBeDefined();
    expect(createRes.body.verificationStatus).toBe('PENDING_VERIFICATION');
    enterpriseAProfileId = createRes.body.id;

    const getMeRes = await request(app.getHttpServer())
      .get('/api/v1/enterprises/profile/me')
      .set('Authorization', `Bearer ${enterpriseAToken}`)
      .expect(200);

    expect(getMeRes.body.taxCode).toBe('0312345678');

    const verifyRes = await request(app.getHttpServer())
      .patch(`/api/v1/enterprises/${enterpriseAProfileId}/verify`)
      .set('Authorization', `Bearer ${labAdminToken}`)
      .send({
        status: 'VERIFIED',
        note: 'Đã xác minh pháp nhân và mã số thuế doanh nghiệp hợp lệ.',
      })
      .expect(200);

    expect(verifyRes.body.verificationStatus).toBe('VERIFIED');
  });

  it('TC-ENT-02: Đảm bảo cách ly dữ liệu (Data Isolation) - Doanh nghiệp B và Talent bị chặn 403 khi truy cập/sửa hồ sơ của Doanh nghiệp A', async () => {
    // Doanh nghiệp B cố tình gọi PATCH sửa hồ sơ của Doanh nghiệp A -> 403 Forbidden
    await request(app.getHttpServer())
      .patch(`/api/v1/enterprises/${enterpriseAProfileId}`)
      .set('Authorization', `Bearer ${enterpriseBToken}`)
      .send({
        companyName: 'Công ty B chiếm quyền sửa Công ty A',
        taxCode: '0312345678',
        industry: 'Other',
        address: 'Hà Nội',
        representativeName: 'Người lạ',
        contactEmail: 'hacker@companyB.vn',
        contactPhone: '0999888777',
      })
      .expect(403);

    // Doanh nghiệp B cố tình xem chi tiết hồ sơ của Doanh nghiệp A theo ID -> 403 Forbidden
    await request(app.getHttpServer())
      .get(`/api/v1/enterprises/${enterpriseAProfileId}`)
      .set('Authorization', `Bearer ${enterpriseBToken}`)
      .expect(403);

    // Sinh viên (TALENT) cố tình gọi endpoint tạo hồ sơ doanh nghiệp -> 403 Forbidden
    await request(app.getHttpServer())
      .post('/api/v1/enterprises/profile')
      .set('Authorization', `Bearer ${talentToken}`)
      .send({
        companyName: 'Fake Enterprise',
        taxCode: '0399999999',
        industry: 'IT',
        address: 'HCM',
        representativeName: 'Talent',
        contactEmail: 'talent@student.uth.edu.vn',
        contactPhone: '0900111222',
      })
      .expect(403);

    // Doanh nghiệp A tự tự duyệt (verify) hồ sơ của chính mình -> 403 Forbidden
    await request(app.getHttpServer())
      .patch(`/api/v1/enterprises/${enterpriseAProfileId}/verify`)
      .set('Authorization', `Bearer ${enterpriseAToken}`)
      .send({ status: 'VERIFIED', note: 'Tự duyệt' })
      .expect(403);
  });

  afterAll(async () => {
    await app.close();
  });
});