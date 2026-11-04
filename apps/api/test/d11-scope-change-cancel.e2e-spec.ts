import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Day 11 Vertical Slice — Scope Change & Cancellation Requests (REQ-ENT-03, REQ-LAB-02)', () => {
  let app: INestApplication;
  let enterpriseAToken: string;
  let enterpriseBToken: string;
  let labAdminToken: string;
  let talentToken: string;
  let projectId: string;

  const password =
    process.env.INITIAL_SYSADMIN_PASSWORD || 'ChangeMe_LabOdc@2026!';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    const [loginEntA, loginEntB, loginLab, loginTalent] = await Promise.all([
      request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'enterprise@company.vn', password })
        .expect(200),
      request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'enterprise2@company.vn', password })
        .expect(200),
      request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'labadmin@labodc.uth.edu.vn', password })
        .expect(200),
      request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'talent@student.uth.edu.vn', password })
        .expect(200),
    ]);

    enterpriseAToken = loginEntA.body.accessToken;
    enterpriseBToken = loginEntB.body.accessToken;
    labAdminToken = loginLab.body.accessToken;
    talentToken = loginTalent.body.accessToken;

    const entRes = await request(app.getHttpServer())
      .post('/api/v1/enterprises/profile')
      .set('Authorization', `Bearer ${enterpriseAToken}`)
      .send({
        companyName: 'Công ty Cổ phần AI Logistics UTH',
        taxCode: '0366667777',
        industry: 'AI & Supply Chain',
        address: 'Quận 3, TP.HCM',
        representativeName: 'Trần Đại Diện',
        contactEmail: 'contact@ailogistics.vn',
        contactPhone: '0977888999',
      })
      .expect(200);

    await request(app.getHttpServer())
      .patch(`/api/v1/enterprises/${entRes.body.id}/verify`)
      .set('Authorization', `Bearer ${labAdminToken}`)
      .send({ status: 'VERIFIED', note: 'Đã xác thực pháp nhân.' })
      .expect(200);

    const draftRes = await request(app.getHttpServer())
      .post('/api/v1/projects/proposals')
      .set('Authorization', `Bearer ${enterpriseAToken}`)
      .send({
        title: 'Nền tảng Dự báo Nhu cầu Kho vận bằng Học máy',
        summary: 'Tối ưu tồn kho chuỗi cung ứng thời gian thực.',
        description:
          'Xây dựng hệ thống phân tích dữ liệu lịch sử xuất nhập kho và dự báo nhu cầu theo tuần.',
        deliverables: 'Backend API NestJS + Web Dashboard React.',
        requiredSkills: ['NestJS', 'React', 'PostgreSQL', 'Python'],
        minTeamSize: 3,
        maxTeamSize: 5,
        durationWeeks: 10,
        budgetAmount: 50000000,
      })
      .expect(201);

    projectId = draftRes.body.id;
  });

  it('TC-CHG-01 (D11): Chặn gửi yêu cầu Đổi phạm vi khi dự án còn ở DRAFT/SUBMITTED; cho phép gửi, rút lại (WITHDRAWN) và phê duyệt SCOPE_CHANGE khi dự án đã PUBLISHED/IN_PROGRESS', async () => {
    // 1. Khi dự án còn ở DRAFT -> Gửi SCOPE_CHANGE bị chặn 409 Conflict
    await request(app.getHttpServer())
      .post(`/api/v1/projects/${projectId}/change-requests`)
      .set('Authorization', `Bearer ${enterpriseAToken}`)
      .send({
        requestType: 'SCOPE_CHANGE',
        reason: 'Muốn đổi phạm vi ngay khi còn ở trạng thái nháp.',
        impactSummary: 'Thay đổi ngân sách dự kiến.',
        proposedBudgetAmount: 60000000,
      })
      .expect(409);

    // 2. Submit -> Lab Admin Approve -> Publish -> Start Progress (IN_PROGRESS)
    await request(app.getHttpServer())
      .post(`/api/v1/projects/proposals/${projectId}/submit`)
      .set('Authorization', `Bearer ${enterpriseAToken}`)
      .expect(200);

    await request(app.getHttpServer())
      .post(`/api/v1/lab-admin/proposals/${projectId}/approve`)
      .set('Authorization', `Bearer ${labAdminToken}`)
      .send({ reviewNote: 'Duyệt đề xuất.' })
      .expect(200);

    const futureClose = new Date(Date.now() + 14 * 86400000).toISOString();
    await request(app.getHttpServer())
      .post(`/api/v1/lab-admin/projects/${projectId}/publish`)
      .set('Authorization', `Bearer ${labAdminToken}`)
      .send({ registrationCloseAt: futureClose })
      .expect(200);

    await request(app.getHttpServer())
      .post(`/api/v1/lab-admin/projects/${projectId}/start-progress`)
      .set('Authorization', `Bearer ${labAdminToken}`)
      .send({ note: 'Đã lập nhóm xong, bắt đầu triển khai dự án.' })
      .expect(200);

    // 3. Doanh nghiệp tạo yêu cầu SCOPE_CHANGE lần 1 rồi tự rút lại (WITHDRAWN)
    const cr1Res = await request(app.getHttpServer())
      .post(`/api/v1/projects/${projectId}/change-requests`)
      .set('Authorization', `Bearer ${enterpriseAToken}`)
      .send({
        requestType: 'SCOPE_CHANGE',
        reason: 'Bổ sung thêm module cảnh báo tồn kho qua Telegram Bot.',
        impactSummary: 'Tăng thêm 1 tuần phát triển.',
        proposedDurationWeeks: 11,
      })
      .expect(201);

    expect(cr1Res.body.status).toBe('PENDING_APPROVAL');

    const withdrawRes = await request(app.getHttpServer())
      .post(`/api/v1/projects/change-requests/${cr1Res.body.id}/withdraw`)
      .set('Authorization', `Bearer ${enterpriseAToken}`)
      .expect(200);
    expect(withdrawRes.body.status).toBe('WITHDRAWN');

    // 4. Doanh nghiệp gửi yêu cầu SCOPE_CHANGE chính thức (nâng ngân sách lên 65.000.000 VNĐ & 12 tuần)
    const cr2Res = await request(app.getHttpServer())
      .post(`/api/v1/projects/${projectId}/change-requests`)
      .set('Authorization', `Bearer ${enterpriseAToken}`)
      .send({
        requestType: 'SCOPE_CHANGE',
        reason: 'Mở rộng phạm vi tích hợp thêm ứng dụng di động Flutter cho nhân viên kho.',
        impactSummary: 'Tăng ngân sách lên 65 triệu VNĐ và kéo dài thời lượng lên 12 tuần.',
        proposedDeliverables:
          'Backend API NestJS + Web Dashboard React + Mobile App Flutter.',
        proposedBudgetAmount: 65000000,
        proposedDurationWeeks: 12,
        proposedMaxTeamSize: 6,
      })
      .expect(201);

    // Chặn gửi thêm yêu cầu mới khi đang có 1 yêu cầu PENDING_APPROVAL
    await request(app.getHttpServer())
      .post(`/api/v1/projects/${projectId}/change-requests`)
      .set('Authorization', `Bearer ${enterpriseAToken}`)
      .send({
        requestType: 'SCOPE_CHANGE',
        reason: 'Gửi trùng yêu cầu khi yêu cầu trước chưa được xử lý.',
        impactSummary: 'Tác động trùng lặp.',
        proposedBudgetAmount: 70000000,
      })
      .expect(409);

    // 5. Lab Admin phê duyệt yêu cầu SCOPE_CHANGE -> Thông tin dự án được cập nhật tự động
    const approveRes = await request(app.getHttpServer())
      .post(`/api/v1/lab-admin/change-requests/${cr2Res.body.id}/approve`)
      .set('Authorization', `Bearer ${labAdminToken}`)
      .send({
        reviewNote: 'Đồng ý mở rộng phạm vi và điều chỉnh ngân sách dự án.',
      })
      .expect(200);

    expect(approveRes.body.changeRequest.status).toBe('APPROVED');
    expect(approveRes.body.project.budgetAmount).toBe(65000000);
    expect(approveRes.body.project.durationWeeks).toBe(12);
    expect(approveRes.body.project.maxTeamSize).toBe(6);
    expect(approveRes.body.project.status).toBe('IN_PROGRESS');
  });

  it('TC-CHG-02 (D11): Luồng Lab Admin từ chối (REJECTED) hoặc phê duyệt yêu cầu Hủy dự án (CANCEL -> CANCELLED) kèm ghi chú quyết toán', async () => {
    // 1. Doanh nghiệp gửi yêu cầu CANCEL nhưng Lab Admin từ chối (yêu cầu tiếp tục dự án)
    const cancelReq1 = await request(app.getHttpServer())
      .post(`/api/v1/projects/${projectId}/change-requests`)
      .set('Authorization', `Bearer ${enterpriseAToken}`)
      .send({
        requestType: 'CANCEL',
        reason: 'Xin tạm dừng dự án do thay đổi kế hoạch nhân sự nội bộ quý này.',
        impactSummary: 'Dừng triển khai giai đoạn 2.',
      })
      .expect(201);

    const rejectRes = await request(app.getHttpServer())
      .post(`/api/v1/lab-admin/change-requests/${cancelReq1.body.id}/reject`)
      .set('Authorization', `Bearer ${labAdminToken}`)
      .send({
        reviewNote:
          'Nhóm sinh viên đã hoàn thành 80% milestone 1, đề nghị doanh nghiệp nghiệm thu hết mốc hiện tại trước khi hủy.',
      })
      .expect(200);

    expect(rejectRes.body.status).toBe('REJECTED');

    // Dự án vẫn giữ nguyên trạng thái IN_PROGRESS
    const detailAfterReject = await request(app.getHttpServer())
      .get(`/api/v1/projects/proposals/${projectId}`)
      .set('Authorization', `Bearer ${enterpriseAToken}`)
      .expect(200);
    expect(detailAfterReject.body.proposal.status).toBe('IN_PROGRESS');

    // 2. Doanh nghiệp gửi lại yêu cầu CANCEL sau khi thống nhất phương án quyết toán -> Lab Admin phê duyệt
    const cancelReq2 = await request(app.getHttpServer())
      .post(`/api/v1/projects/${projectId}/change-requests`)
      .set('Authorization', `Bearer ${enterpriseAToken}`)
      .send({
        requestType: 'CANCEL',
        reason: 'Hai bên đã thống nhất biên bản nghiệm thu điểm dừng và xin hủy phần còn lại.',
        impactSummary: 'Quyết toán 50% ngân sách giai đoạn 1 cho nhóm và Mentor.',
      })
      .expect(201);

    const approveCancelRes = await request(app.getHttpServer())
      .post(`/api/v1/lab-admin/change-requests/${cancelReq2.body.id}/approve`)
      .set('Authorization', `Bearer ${labAdminToken}`)
      .send({
        reviewNote: 'Phê duyệt hủy dự án theo biên bản thỏa thuận.',
        financialSettlementNote:
          'Giữ lại 50% kinh phí giai đoạn 1 cho Team/Mentor/Lab; hoàn trả 50% còn lại.',
      })
      .expect(200);

    expect(approveCancelRes.body.changeRequest.status).toBe('APPROVED');
    expect(approveCancelRes.body.project.status).toBe('CANCELLED');

    // Kiểm tra recruitment-eligibility của dự án đã CANCELLED phải trả về isOpenForApplications = false
    const eligRes = await request(app.getHttpServer())
      .get(`/api/v1/projects/${projectId}/recruitment-eligibility`)
      .expect(200);
    expect(eligRes.body.status).toBe('CANCELLED');
    expect(eligRes.body.isOpenForApplications).toBe(false);
  });

  it('TC-CHG-03 (D11): Kiểm thử phân quyền âm tính (403 Forbidden) khi Doanh nghiệp B hoặc Talent thao tác trái phép trên yêu cầu thay đổi/hủy', async () => {
    // Doanh nghiệp B không được gửi yêu cầu thay đổi vào dự án của Doanh nghiệp A
    await request(app.getHttpServer())
      .post(`/api/v1/projects/${projectId}/change-requests`)
      .set('Authorization', `Bearer ${enterpriseBToken}`)
      .send({
        requestType: 'CANCEL',
        reason: 'Doanh nghiệp B cố tình gửi yêu cầu hủy dự án của Doanh nghiệp A.',
        impactSummary: 'Thao tác trái phép.',
      })
      .expect(403);

    // Sinh viên (TALENT) không được phép gọi API duyệt/xem hàng đợi change-requests của Lab Admin
    await request(app.getHttpServer())
      .get('/api/v1/lab-admin/change-requests')
      .set('Authorization', `Bearer ${talentToken}`)
      .expect(403);

    // Doanh nghiệp A không được tự gọi API approve của Lab Admin
    await request(app.getHttpServer())
      .post('/api/v1/lab-admin/change-requests/cr-1/approve')
      .set('Authorization', `Bearer ${enterpriseAToken}`)
      .expect(403);
  });

  afterAll(async () => {
    await app.close();
  });
});