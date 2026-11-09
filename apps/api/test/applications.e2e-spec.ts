import 'reflect-metadata';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UserRole, UserStatus } from '@labodc/shared-types';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { ApplicationRepository } from '../src/applications/application.repository';

describe('Talent discovery and application workflow (D7-D9)', () => {
  let app: INestApplication;
  let enterpriseToken: string;
  let labAdminToken: string;
  let talentToken: string;
  let otherTalentToken: string;
  let projectId: string;
  let applications: ApplicationRepository;

  const password =
    process.env.INITIAL_SYSADMIN_PASSWORD || 'ChangeMe_LabOdc@2026!';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    applications = moduleFixture.get(ApplicationRepository);

    const jwtService = moduleFixture.get(JwtService);
    otherTalentToken = await jwtService.signAsync(
      {
        sub: '00000000-0000-4000-8000-000000000008',
        email: 'second-talent@student.uth.edu.vn',
        role: UserRole.TALENT,
        status: UserStatus.ACTIVE,
      },
      {
        secret: process.env.JWT_ACCESS_SECRET || 'labodc_access_secret_d5',
        expiresIn: '15m',
      },
    );

    enterpriseToken = await login('enterprise@company.vn');
    labAdminToken = await login('labadmin@labodc.uth.edu.vn');
    talentToken = await login('talent@student.uth.edu.vn');

    const enterprise = await request(app.getHttpServer())
      .post('/api/v1/enterprises/profile')
      .set('Authorization', `Bearer ${enterpriseToken}`)
      .send({
        companyName: 'Công ty Dự án UTH',
        taxCode: '0312345678',
        industry: 'Công nghệ thông tin',
        address: 'TP. Hồ Chí Minh',
        representativeName: 'Nguyễn Đại Diện',
        contactEmail: 'contact@project-uth.vn',
        contactPhone: '0900000000',
      })
      .expect(200);

    await request(app.getHttpServer())
      .patch(`/api/v1/enterprises/${enterprise.body.id}/verify`)
      .set('Authorization', `Bearer ${labAdminToken}`)
      .send({ status: 'VERIFIED', note: 'Đã xác minh doanh nghiệp.' })
      .expect(200);

    const draft = await request(app.getHttpServer())
      .post('/api/v1/projects/proposals')
      .set('Authorization', `Bearer ${enterpriseToken}`)
      .send({
        title: 'Nền tảng kết nối dự án UTH',
        summary: 'Cổng thông tin dự án dành cho sinh viên và doanh nghiệp.',
        description:
          'Phát triển công cụ kết nối tài năng với các dự án công nghệ thực tế.',
        deliverables: 'Web app, API, tài liệu và bộ kiểm thử.',
        requiredSkills: ['React', 'NestJS', 'TypeScript'],
        minTeamSize: 2,
        maxTeamSize: 5,
        durationWeeks: 8,
        budgetAmount: 10000000,
      })
      .expect(201);
    projectId = draft.body.id;

    await request(app.getHttpServer())
      .post(`/api/v1/projects/proposals/${projectId}/submit`)
      .set('Authorization', `Bearer ${enterpriseToken}`)
      .expect(200);

    await request(app.getHttpServer())
      .post(`/api/v1/lab-admin/proposals/${projectId}/approve`)
      .set('Authorization', `Bearer ${labAdminToken}`)
      .send({ reviewNote: 'Đề xuất đáp ứng thông tin cơ bản.' })
      .expect(200);

    await request(app.getHttpServer())
      .post(`/api/v1/lab-admin/projects/${projectId}/publish`)
      .set('Authorization', `Bearer ${labAdminToken}`)
      .send({
        registrationOpenAt: new Date(Date.now() - 60_000).toISOString(),
        registrationCloseAt: new Date(Date.now() + 86_400_000).toISOString(),
      })
      .expect(200);
  });

  beforeEach(() => applications.clearAll());

  it('TC-B-DISC-01: filters public projects by keyword and required skill', async () => {
    const result = await request(app.getHttpServer())
      .get('/api/v1/projects/public?keyword=UTH&skill=React')
      .expect(200);

    expect(result.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: projectId,
          status: 'PUBLISHED',
          requiredSkills: expect.arrayContaining(['React']),
        }),
      ]),
    );

    const detail = await request(app.getHttpServer())
      .get(`/api/v1/projects/public/${projectId}`)
      .expect(200);
    expect(detail.body).toMatchObject({
      id: projectId,
      title: 'Nền tảng kết nối dự án UTH',
    });
    expect(detail.body.ownerUserId).toBeUndefined();
    expect(detail.body.attachmentUrl).toBeUndefined();
    expect(detail.body.reviewNote).toBeUndefined();

    const wrongSkill = await request(app.getHttpServer())
      .get('/api/v1/projects/public?skill=Nonexistent')
      .expect(200);
    expect(wrongSkill.body).toEqual([]);
  });

  it('TC-B-DISC-02: returns paginated, application-eligible discovery results and validates filters', async () => {
    const firstPage = await request(app.getHttpServer())
      .get('/api/v1/talent/discovery/projects?keyword=UTH&skill=React&page=1&pageSize=1')
      .expect(200);
    expect(firstPage.body).toMatchObject({
      pagination: {
        page: 1,
        pageSize: 1,
        totalItems: 1,
        totalPages: 1,
      },
    });
    expect(firstPage.body.items).toEqual([
      expect.objectContaining({ id: projectId, status: 'PUBLISHED' }),
    ]);

    await request(app.getHttpServer())
      .get('/api/v1/talent/discovery/projects?page=0')
      .expect(400);
    await request(app.getHttpServer())
      .get('/api/v1/talent/discovery/projects?pageSize=51')
      .expect(400);
    await request(app.getHttpServer())
      .get('/api/v1/talent/discovery/projects?skill=React&skill=Dart')
      .expect(400);
    const outOfRangePage = await request(app.getHttpServer())
      .get('/api/v1/talent/discovery/projects?page=99')
      .expect(200);
    expect(outOfRangePage.body.pagination.page).toBe(1);
    expect(outOfRangePage.body.items[0].id).toBe(projectId);

    const detail = await request(app.getHttpServer())
      .get(`/api/v1/talent/discovery/projects/${projectId}`)
      .expect(200);
    expect(detail.body).toMatchObject({
      id: projectId,
      title: 'Nền tảng kết nối dự án UTH',
    });


  });

  it('TC-B-APP-01/02: submits one active application and only returns it to its owner', async () => {
    const created = await request(app.getHttpServer())
      .post(`/api/v1/projects/${projectId}/applications`)
      .set('Authorization', `Bearer ${talentToken}`)
      .expect(201);
    expect(created.body.status).toBe('SUBMITTED');

    await request(app.getHttpServer())
      .post(`/api/v1/projects/${projectId}/applications`)
      .set('Authorization', `Bearer ${talentToken}`)
      .expect(409);

    const mine = await request(app.getHttpServer())
      .get('/api/v1/talent/me/applications')
      .set('Authorization', `Bearer ${talentToken}`)
      .expect(200);
    expect(mine.body).toHaveLength(1);
    expect(mine.body[0].project.title).toBe('Nền tảng kết nối dự án UTH');
    expect(mine.body[0].stateHistory).toHaveLength(1);

    const otherTalent = await request(app.getHttpServer())
      .get('/api/v1/talent/me/applications')
      .set('Authorization', `Bearer ${otherTalentToken}`)
      .expect(200);
    expect(otherTalent.body).toEqual([]);

    await request(app.getHttpServer())
      .get('/api/v1/talent/me/applications')
      .set('Authorization', `Bearer ${enterpriseToken}`)
      .expect(403);
  });

  it('TC-B-APP-03: withdraws before acceptance and rejects withdraw by another user or after withdrawal', async () => {
    const created = await request(app.getHttpServer())
      .post(`/api/v1/projects/${projectId}/applications`)
      .set('Authorization', `Bearer ${talentToken}`)
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/v1/applications/${created.body.id}/withdraw`)
      .set('Authorization', `Bearer ${otherTalentToken}`)
      .expect(403);

    const withdrawn = await request(app.getHttpServer())
      .post(`/api/v1/applications/${created.body.id}/withdraw`)
      .set('Authorization', `Bearer ${talentToken}`)
      .expect(200);
    expect(withdrawn.body.status).toBe('WITHDRAWN');

    await request(app.getHttpServer())
      .post(`/api/v1/applications/${created.body.id}/withdraw`)
      .set('Authorization', `Bearer ${talentToken}`)
      .expect(409);

    const mine = await request(app.getHttpServer())
      .get('/api/v1/talent/me/applications')
      .set('Authorization', `Bearer ${talentToken}`)
      .expect(200);
    expect(mine.body[0].stateHistory).toHaveLength(2);
  });

  it('TC-B-APP-04: rejects applications when Lab has closed recruitment', async () => {
    await request(app.getHttpServer())
      .post(`/api/v1/projects/${projectId}/applications`)
      .set('Authorization', `Bearer ${talentToken}`)
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/v1/lab-admin/projects/${projectId}/close-recruitment`)
      .set('Authorization', `Bearer ${labAdminToken}`)
      .expect(200);

    const discovery = await request(app.getHttpServer())
      .get('/api/v1/talent/discovery/projects')
      .expect(200);
    expect(discovery.body.items).toEqual([]);
    expect(discovery.body.pagination.totalItems).toBe(0);
    await request(app.getHttpServer())
      .get(`/api/v1/talent/discovery/projects/${projectId}`)
      .expect(404);

    await request(app.getHttpServer())
      .post(`/api/v1/projects/${projectId}/applications`)
      .set('Authorization', `Bearer ${otherTalentToken}`)
      .expect(409);

    const status = await request(app.getHttpServer())
      .get('/api/v1/talent/me/applications')
      .set('Authorization', `Bearer ${talentToken}`)
      .expect(200);
    expect(status.body[0].status).toBe('SUBMITTED');
    expect(status.body[0].project.status).toBe('RECRUITMENT_CLOSED');
    expect(status.body[0].stateHistory).toHaveLength(1);
  });

  afterAll(async () => {
    await app.close();
  });

  async function login(email: string): Promise<string> {
    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password })
      .expect(200);
    return response.body.accessToken as string;
  }
});
