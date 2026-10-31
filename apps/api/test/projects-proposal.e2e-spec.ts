import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Project Proposal Vertical Slice (D7 - REQ-ENT-02)', () => {
  let app: INestApplication;
  let enterpriseAToken: string;
  let enterpriseBToken: string;
  let labAdminToken: string;
  let talentToken: string;
  let enterpriseAProfileId: string;
  let proposalId: string;

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

  it('TC-PRJ-01: Doanh nghiệp tạo bản nháp (DRAFT), bị chặn gửi khi chưa VERIFIED, và gửi duyệt (SUBMITTED) thành công sau khi Lab Admin xác thực', async () => {
    // 1. Doanh nghiệp A tạo hồ sơ pháp nhân (PENDING_VERIFICATION)
    const profileRes = await request(app.getHttpServer())
      .post('/api/v1/enterprises/profile')
      .set('Authorization', `Bearer ${enterpriseAToken}`)
      .send({
        companyName: 'Công ty Cổ phần Giải pháp Số UTH',
        taxCode: '0388889999',
        industry: 'EdTech & AI',
        address: 'Bình Thạnh, TP.HCM',
        representativeName: 'Lê Đại Diện',
        contactEmail: 'contact@uthedtech.vn',
        contactPhone: '0909123456',
      })
      .expect(200);

    enterpriseAProfileId = profileRes.body.id;

    // 2. Doanh nghiệp A tạo bản nháp đề xuất dự án (DRAFT) -> 201 Created
    const draftRes = await request(app.getHttpServer())
      .post('/api/v1/projects/proposals')
      .set('Authorization', `Bearer ${enterpriseAToken}`)
      .send({
        title: 'Nền tảng Quản lý Thực tập và Dự án Doanh nghiệp LabOdc',
        summary: 'Xây dựng cổng kết nối sinh viên UTH với dự án thực tế từ doanh nghiệp.',
      })
      .expect(201);

    expect(draftRes.body.status).toBe('DRAFT');
    expect(draftRes.body.code).toBe('ODC-2026-001');
    proposalId = draftRes.body.id;

    // 3. Doanh nghiệp A cập nhật bổ sung đầy đủ thông tin vào bản nháp -> 200 OK
    const updateRes = await request(app.getHttpServer())
      .patch(`/api/v1/projects/proposals/${proposalId}`)
      .set('Authorization', `Bearer ${enterpriseAToken}`)
      .send({
        description:
          'Xây dựng đầy đủ các phân hệ Enterprise, Lab Admin, Mentor, Talent và tích hợp thanh toán PayOS.',
        deliverables: 'Web Portal React, REST API NestJS, Ứng dụng Flutter, Tài liệu SDLC.',
        requiredSkills: ['TypeScript', 'NestJS', 'React', 'PostgreSQL'],
        minTeamSize: 4,
        maxTeamSize: 6,
        durationWeeks: 12,
        budgetAmount: 60000000,
      })
      .expect(200);

    expect(updateRes.body.budgetAmount).toBe(60000000);

    // 4. Bấm Submit khi doanh nghiệp chưa được Lab Admin duyệt VERIFIED -> 400 Bad Request
    const unverifiedSubmit = await request(app.getHttpServer())
      .post(`/api/v1/projects/proposals/${proposalId}/submit`)
      .set('Authorization', `Bearer ${enterpriseAToken}`)
      .expect(400);

    expect(unverifiedSubmit.body.code).toBe('ENTERPRISE_NOT_VERIFIED');

    // 5. Lab Admin duyệt hồ sơ Doanh nghiệp A sang VERIFIED
    await request(app.getHttpServer())
      .patch(`/api/v1/enterprises/${enterpriseAProfileId}/verify`)
      .set('Authorization', `Bearer ${labAdminToken}`)
      .send({
        status: 'VERIFIED',
        note: 'Đã xác thực pháp nhân doanh nghiệp hợp lệ.',
      })
      .expect(200);

    // 6. Doanh nghiệp A gửi duyệt đề xuất (SUBMIT) -> 200 OK & chuyển sang SUBMITTED
    const submitRes = await request(app.getHttpServer())
      .post(`/api/v1/projects/proposals/${proposalId}/submit`)
      .set('Authorization', `Bearer ${enterpriseAToken}`)
      .expect(200);

    expect(submitRes.body.status).toBe('SUBMITTED');
    expect(submitRes.body.submittedAt).toBeDefined();

    // 7. Kiểm tra lịch sử Audit Trail ghi nhận đủ 2 bước CREATE_DRAFT và SUBMIT_PROPOSAL
    const detailRes = await request(app.getHttpServer())
      .get(`/api/v1/projects/proposals/${proposalId}`)
      .set('Authorization', `Bearer ${enterpriseAToken}`)
      .expect(200);

    expect(detailRes.body.auditLogs.length).toBe(2);
    expect(detailRes.body.auditLogs[1].toStatus).toBe('SUBMITTED');
  });

  it('TC-PRJ-02: Khóa chỉnh sửa (409 Conflict) khi đề xuất đang ở SUBMITTED và chặn truy cập trái quyền từ Doanh nghiệp B / Talent (403 Forbidden)', async () => {
    // 1. Doanh nghiệp A cố tình gọi PATCH sửa đề xuất đã SUBMITTED -> 409 Conflict
    const conflictRes = await request(app.getHttpServer())
      .patch(`/api/v1/projects/proposals/${proposalId}`)
      .set('Authorization', `Bearer ${enterpriseAToken}`)
      .send({ title: 'Sửa tiêu đề sau khi đã gửi duyệt' })
      .expect(409);

    expect(conflictRes.body.code).toBe('INVALID_STATE_TRANSITION');

    // 2. Doanh nghiệp B cố tình xem hoặc sửa đề xuất của Doanh nghiệp A -> 403 Forbidden
    await request(app.getHttpServer())
      .get(`/api/v1/projects/proposals/${proposalId}`)
      .set('Authorization', `Bearer ${enterpriseBToken}`)
      .expect(403);

    await request(app.getHttpServer())
      .patch(`/api/v1/projects/proposals/${proposalId}`)
      .set('Authorization', `Bearer ${enterpriseBToken}`)
      .send({ title: 'Doanh nghiệp B sửa trái phép' })
      .expect(403);

    // 3. Sinh viên (TALENT) cố tình gọi API tạo đề xuất dự án của doanh nghiệp -> 403 Forbidden
    await request(app.getHttpServer())
      .post('/api/v1/projects/proposals')
      .set('Authorization', `Bearer ${talentToken}`)
      .send({ title: 'Sinh viên tự tạo đề xuất dự án' })
      .expect(403);

    // 4. Đề xuất mới ở trạng thái SUBMITTED (chưa PUBLISHED) không được xuất hiện trên API công khai
    const publicListRes = await request(app.getHttpServer())
      .get('/api/v1/projects/public')
      .expect(200);

    expect(publicListRes.body).toEqual([]);
  });

  afterAll(async () => {
    await app.close();
  });
});