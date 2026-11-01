import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Lab Admin Proposal Review & Publish Vertical Slice (D8 - REQ-LAB-01)', () => {
  let app: INestApplication;
  let enterpriseAToken: string;
  let labAdminToken: string;
  let talentToken: string;
  let proposalToPublishId: string;
  let proposalToRejectId: string;

  const password =
    process.env.INITIAL_SYSADMIN_PASSWORD || 'ChangeMe_LabOdc@2026!';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    const loginEnt = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'enterprise@company.vn', password })
      .expect(200);
    enterpriseAToken = loginEnt.body.accessToken;

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

    // Tạo và xác thực Hồ sơ Doanh nghiệp A
    const entRes = await request(app.getHttpServer())
      .post('/api/v1/enterprises/profile')
      .set('Authorization', `Bearer ${enterpriseAToken}`)
      .send({
        companyName: 'Công ty Cổ phần Công nghệ Cảng Biển UTH',
        taxCode: '0355556666',
        industry: 'Maritime & Logistics',
        address: 'Quận 7, TP.HCM',
        representativeName: 'Phạm Đại Diện',
        contactEmail: 'contact@uthport.vn',
        contactPhone: '0918111222',
      })
      .expect(200);

    await request(app.getHttpServer())
      .patch(`/api/v1/enterprises/${entRes.body.id}/verify`)
      .set('Authorization', `Bearer ${labAdminToken}`)
      .send({
        status: 'VERIFIED',
        note: 'Doanh nghiệp đối tác hợp lệ.',
      })
      .expect(200);
  });

  it('TC-LAB-01: Lab Admin xem hàng đợi SUBMITTED, yêu cầu bổ sung (CHANGES_REQUESTED), Doanh nghiệp gửi lại, Lab Admin phê duyệt (APPROVED) và từ chối (REJECTED) kèm Reason Code bắt buộc', async () => {
    // Tạo đề xuất số 1 và gửi duyệt
    const draft1 = await request(app.getHttpServer())
      .post('/api/v1/projects/proposals')
      .set('Authorization', `Bearer ${enterpriseAToken}`)
      .send({
        title: 'Hệ thống Giám sát Container Lạnh bằng IoT & AI',
        summary: 'Theo dõi nhiệt độ và cảnh báo sớm sự cố container lạnh tại cảng.',
        description:
          'Xây dựng dịch vụ thu thập dữ liệu cảm biến, cảnh báo thời gian thực và bảng điều khiển giám sát trên Web/Mobile.',
        deliverables: 'Backend API, Web Dashboard, Báo cáo kiểm thử tải.',
        requiredSkills: ['NestJS', 'React', 'PostgreSQL', 'Redis'],
        minTeamSize: 4,
        maxTeamSize: 6,
        durationWeeks: 12,
        budgetAmount: 70000000,
      })
      .expect(201);

    proposalToPublishId = draft1.body.id;

    await request(app.getHttpServer())
      .post(`/api/v1/projects/proposals/${proposalToPublishId}/submit`)
      .set('Authorization', `Bearer ${enterpriseAToken}`)
      .expect(200);

    // Tạo đề xuất số 2 và gửi duyệt (để kiểm thử nhánh REJECT)
    const draft2 = await request(app.getHttpServer())
      .post('/api/v1/projects/proposals')
      .set('Authorization', `Bearer ${enterpriseAToken}`)
      .send({
        title: 'Đề xuất thử nghiệm ngân sách không phù hợp',
        summary: 'Tóm tắt đề xuất dự án số 2 để kiểm thử từ chối.',
        description:
          'Mô tả chi tiết bài toán đề xuất số 2 dùng để kiểm thử luồng Lab Admin từ chối.',
        deliverables: 'Báo cáo phân tích khả thi.',
        requiredSkills: ['React'],
        minTeamSize: 3,
        maxTeamSize: 4,
        durationWeeks: 8,
        budgetAmount: 5000000,
      })
      .expect(201);

    proposalToRejectId = draft2.body.id;

    await request(app.getHttpServer())
      .post(`/api/v1/projects/proposals/${proposalToRejectId}/submit`)
      .set('Authorization', `Bearer ${enterpriseAToken}`)
      .expect(200);

    // 1. Lab Admin truy vấn hàng đợi SUBMITTED -> có 2 đề xuất
    const queueRes = await request(app.getHttpServer())
      .get('/api/v1/lab-admin/proposals?status=SUBMITTED')
      .set('Authorization', `Bearer ${labAdminToken}`)
      .expect(200);

    expect(queueRes.body.length).toBe(2);

    // 2. Lab Admin gọi request-info thiếu reasonNote đủ 15 ký tự -> 400 Bad Request
    await request(app.getHttpServer())
      .post(`/api/v1/lab-admin/proposals/${proposalToPublishId}/request-info`)
      .set('Authorization', `Bearer ${labAdminToken}`)
      .send({
        reasonCode: 'MISSING_SCOPE',
        reasonNote: 'Quá ngắn',
      })
      .expect(400);

    // 3. Lab Admin yêu cầu bổ sung hợp lệ -> chuyển sang CHANGES_REQUESTED
    const reqInfoRes = await request(app.getHttpServer())
      .post(`/api/v1/lab-admin/proposals/${proposalToPublishId}/request-info`)
      .set('Authorization', `Bearer ${labAdminToken}`)
      .send({
        reasonCode: 'MISSING_SCOPE',
        reasonNote: 'Đề nghị doanh nghiệp làm rõ tiêu chí nghiệm thu ở giai đoạn 2.',
      })
      .expect(200);

    expect(reqInfoRes.body.status).toBe('CHANGES_REQUESTED');

    // 4. Doanh nghiệp chỉnh sửa lại đề xuất và gửi lại -> SUBMITTED
    await request(app.getHttpServer())
      .patch(`/api/v1/projects/proposals/${proposalToPublishId}`)
      .set('Authorization', `Bearer ${enterpriseAToken}`)
      .send({
        deliverables:
          'Backend API, Web Dashboard, Báo cáo kiểm thử tải và Biên bản nghiệm thu 2 giai đoạn.',
      })
      .expect(200);

    await request(app.getHttpServer())
      .post(`/api/v1/projects/proposals/${proposalToPublishId}/submit`)
      .set('Authorization', `Bearer ${enterpriseAToken}`)
      .expect(200);

    // 5. Lab Admin phê duyệt đề xuất số 1 -> APPROVED
    const approveRes = await request(app.getHttpServer())
      .post(`/api/v1/lab-admin/proposals/${proposalToPublishId}/approve`)
      .set('Authorization', `Bearer ${labAdminToken}`)
      .send({
        reviewNote: 'Đề xuất đã bổ sung đầy đủ phạm vi, đồng ý phê duyệt.',
      })
      .expect(200);

    expect(approveRes.body.status).toBe('APPROVED');
    expect(approveRes.body.approvedAt).toBeDefined();

    // 6. Lab Admin từ chối đề xuất số 2 -> REJECTED
    const rejectRes = await request(app.getHttpServer())
      .post(`/api/v1/lab-admin/proposals/${proposalToRejectId}/reject`)
      .set('Authorization', `Bearer ${labAdminToken}`)
      .send({
        reasonCode: 'BUDGET_MISMATCH',
        reasonNote:
          'Ngân sách đóng góp dự kiến chưa đáp ứng mức tối thiểu cho nhóm 4 sinh viên trong 8 tuần.',
      })
      .expect(200);

    expect(rejectRes.body.status).toBe('REJECTED');
    expect(rejectRes.body.reasonCode).toBe('BUDGET_MISMATCH');
  });

  it('TC-LAB-02: Lab Admin công bố dự án (PUBLISHED) lên cổng công khai, điều khiển ẩn/đóng nhận đơn, lưu vết Audit Trail và chặn truy cập trái quyền (403 Forbidden)', async () => {
    const closeDate = new Date(Date.now() + 14 * 86400000).toISOString();

    // 1. Lab Admin công bố dự án đã APPROVED -> PUBLISHED
    const publishRes = await request(app.getHttpServer())
      .post(`/api/v1/lab-admin/projects/${proposalToPublishId}/publish`)
      .set('Authorization', `Bearer ${labAdminToken}`)
      .send({
        registrationCloseAt: closeDate,
        note: 'Chính thức mở nhận đơn ứng tuyển cho sinh viên UTH.',
      })
      .expect(200);

    expect(publishRes.body.status).toBe('PUBLISHED');
    expect(publishRes.body.publishedAt).toBeDefined();

    // 2. Dự án đã PUBLISHED xuất hiện ngay trong API GET /api/v1/projects/public (hợp đồng cho Sinh viên B)
    const publicRes = await request(app.getHttpServer())
      .get('/api/v1/projects/public')
      .expect(200);

    expect(publicRes.body.length).toBe(1);
    expect(publicRes.body[0].id).toBe(proposalToPublishId);
    expect(publicRes.body[0].status).toBe('PUBLISHED');

    // 3. Kiểm tra lịch sử Audit Trail đầy đủ mọi bước chuyển trạng thái
    const detailRes = await request(app.getHttpServer())
      .get(`/api/v1/lab-admin/proposals/${proposalToPublishId}`)
      .set('Authorization', `Bearer ${labAdminToken}`)
      .expect(200);

    const actions = detailRes.body.auditLogs.map((l: { action: string }) => l.action);
    expect(actions).toEqual([
      'CREATE_DRAFT',
      'SUBMIT_PROPOSAL',
      'REQUEST_CHANGES',
      'RESUBMIT_PROPOSAL',
      'APPROVE_PROPOSAL',
      'PUBLISH_PROJECT',
    ]);

    // 4. Kiểm thử âm tính (Negative RBAC): Doanh nghiệp hoặc Sinh viên cố gọi API của Lab Admin -> 403 Forbidden
    await request(app.getHttpServer())
      .post(`/api/v1/lab-admin/proposals/${proposalToRejectId}/approve`)
      .set('Authorization', `Bearer ${enterpriseAToken}`)
      .expect(403);

    await request(app.getHttpServer())
      .post(`/api/v1/lab-admin/projects/${proposalToPublishId}/unpublish`)
      .set('Authorization', `Bearer ${talentToken}`)
      .expect(403);
  });

  afterAll(async () => {
    await app.close();
  });
});