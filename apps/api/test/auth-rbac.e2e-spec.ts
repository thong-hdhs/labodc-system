import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Auth & RBAC Vertical Slice (D5 - REQ-AUTH-01)', () => {
  let app: INestApplication;
  let sysAdminToken: string;
  let talentToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('TC-AUTH-01: Đăng nhập thành công với System Admin và nhận JWT hợp lệ', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'sysadmin@labodc.uth.edu.vn',
        password: process.env.INITIAL_SYSADMIN_PASSWORD || 'ChangeMe_LabOdc@2026!',
      })
      .expect(200);

    expect(res.body.accessToken).toBeDefined();
    expect(res.body.user.role).toBe('SYSTEM_ADMIN');
    sysAdminToken = res.body.accessToken;
  });

  it('TC-AUTH-02: Chặn truy cập (403 Forbidden) khi TALENT gọi endpoint của SYSTEM_ADMIN và khi tài khoản bị LOCKED', async () => {
    const loginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'talent@student.uth.edu.vn',
        password: process.env.INITIAL_SYSADMIN_PASSWORD || 'ChangeMe_LabOdc@2026!',
      })
      .expect(200);

    talentToken = loginRes.body.accessToken;

    // Talent gọi vào endpoint của System Admin -> 403 Forbidden
    await request(app.getHttpServer())
      .get('/api/v1/auth/admin-verify')
      .set('Authorization', `Bearer ${talentToken}`)
      .expect(403);

    // System Admin gọi vào endpoint của System Admin -> 200 OK
    await request(app.getHttpServer())
      .get('/api/v1/auth/admin-verify')
      .set('Authorization', `Bearer ${sysAdminToken}`)
      .expect(200);

    // Tài khoản bị khóa (LOCKED) đăng nhập -> 403 Forbidden
    await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'locked@student.uth.edu.vn',
        password: process.env.INITIAL_SYSADMIN_PASSWORD || 'ChangeMe_LabOdc@2026!',
      })
      .expect(403);
  });

  afterAll(async () => {
    await app.close();
  });
});