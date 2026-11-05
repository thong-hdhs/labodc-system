import 'reflect-metadata';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UserRole, UserStatus } from '@labodc/shared-types';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { ApplicationRepository } from '../src/applications/application.repository';
import { ApplicationStatus } from '../src/applications/application.types';
import { MentorAssignmentRepository } from '../src/applications/mentor-assignment.repository';
import { TaskRepository } from '../src/tasks/task.repository';
import { TeamRepository } from '../src/teams/team.repository';

describe('Day 13-14 — Team formation and task setup', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;
  let mentorToken: string;
  let talentToken: string;
  let unassignedMentorToken: string;
  let enterpriseToken: string;
  let labAdminToken: string;
  let projectId: string;
  let acceptedApplicationIds: string[];
  let submittedApplicationId: string;
  let applications: ApplicationRepository;
  let assignments: MentorAssignmentRepository;
  let teams: TeamRepository;
  let tasks: TaskRepository;

  const password =
    process.env.INITIAL_SYSADMIN_PASSWORD || 'ChangeMe_LabOdc@2026!';
  const talentId = '00000000-0000-4000-8000-000000000006';
  const leaderId = '00000000-0000-4000-8000-000000000005';
  const otherUserId = '00000000-0000-4000-8000-000000000008';

  beforeAll(async () => {
    moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    await app.init();
    await app.listen(0);

    applications = moduleFixture.get(ApplicationRepository);
    assignments = moduleFixture.get(MentorAssignmentRepository);
    teams = moduleFixture.get(TeamRepository);
    tasks = moduleFixture.get(TaskRepository);

    mentorToken = await login('mentor@labodc.uth.edu.vn');
    talentToken = await login('talent@student.uth.edu.vn');
    unassignedMentorToken = await moduleFixture.get(JwtService).signAsync(
      {
        sub: otherUserId,
        email: 'unassigned-mentor@labodc.uth.edu.vn',
        role: UserRole.MENTOR,
        status: UserStatus.ACTIVE,
      },
      {
        secret: process.env.JWT_ACCESS_SECRET || 'labodc_access_secret_d5',
        expiresIn: '15m',
      },
    );

    enterpriseToken = await login('enterprise@company.vn');
    labAdminToken = await login('labadmin@labodc.uth.edu.vn');
    const enterprise = await request(app.getHttpServer())
      .post('/api/v1/enterprises/profile')
      .set('Authorization', `Bearer ${enterpriseToken}`)
      .send({
        companyName: 'Công ty D13-D14',
        taxCode: '0319990001',
        industry: 'Công nghệ thông tin',
        address: 'TP. Hồ Chí Minh',
        representativeName: 'Đại diện',
        contactEmail: 'contact@d13d14.vn',
        contactPhone: '0900000001',
      })
      .expect(200);
    await request(app.getHttpServer())
      .patch(`/api/v1/enterprises/${enterprise.body.id}/verify`)
      .set('Authorization', `Bearer ${labAdminToken}`)
      .send({ status: 'VERIFIED', note: 'Verified for team/task tests.' })
      .expect(200);

    const draft = await request(app.getHttpServer())
      .post('/api/v1/projects/proposals')
      .set('Authorization', `Bearer ${enterpriseToken}`)
      .send({
        title: 'Dự án kiểm thử Team và Task',
        summary: 'Kiểm thử quy trình Team và kế hoạch công việc.',
        description: 'Dự án dùng để xác minh Team formation và task setup.',
        deliverables: 'API, giao diện và tài liệu kiểm thử.',
        requiredSkills: ['TypeScript'],
        minTeamSize: 2,
        maxTeamSize: 3,
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
      .send({ reviewNote: 'Approved for D13-D14 tests.' })
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

  beforeEach(() => {
    applications.clearAll();
    assignments.clearAll();
    teams.clearAll();
    tasks.clearAll();
    assignments.assign(projectId, '00000000-0000-4000-8000-000000000004', 'lab');

    acceptedApplicationIds = [
      addApplication(talentId, ApplicationStatus.ACCEPTED),
      addApplication(leaderId, ApplicationStatus.ACCEPTED),
    ];
    submittedApplicationId = addApplication(otherUserId, ApplicationStatus.SUBMITTED);
  });

  afterAll(async () => {
    await app.close();
  });

  it('limits project/team operations to the assigned Mentor and accepted applications', async () => {
    const projects = await request(app.getHttpServer())
      .get('/api/v1/mentor/me/teams')
      .set('Authorization', `Bearer ${mentorToken}`)
      .expect(200);
    expect(projects.body).toHaveLength(1);
    expect(projects.body[0].eligibleApplications).toHaveLength(2);
    expect(projects.body[0].eligibleApplications).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ applicationId: submittedApplicationId }),
      ]),
    );

    await request(app.getHttpServer())
      .get(`/api/v1/mentor/projects/${projectId}/templates`)
      .set('Authorization', `Bearer ${unassignedMentorToken}`)
      .expect(403);
    await request(app.getHttpServer())
      .post(`/api/v1/mentor/projects/${projectId}/team`)
      .set('Authorization', `Bearer ${mentorToken}`)
      .send({ applicationIds: [acceptedApplicationIds[0]] })
      .expect(409);
    await request(app.getHttpServer())
      .post(`/api/v1/mentor/projects/${projectId}/team`)
      .set('Authorization', `Bearer ${mentorToken}`)
      .send({ applicationIds: [acceptedApplicationIds[0], submittedApplicationId] })
      .expect(409);
  });

  it('creates a bounded Team, enforces one-team membership, and audits Mentor leader changes', async () => {
    const created = await request(app.getHttpServer())
      .post(`/api/v1/mentor/projects/${projectId}/team`)
      .set('Authorization', `Bearer ${mentorToken}`)
      .send({ applicationIds: acceptedApplicationIds })
      .expect(201);
    expect(created.body).toMatchObject({
      projectId,
      status: 'FORMING',
      members: expect.arrayContaining([
        expect.objectContaining({ userId: talentId, role: 'MEMBER' }),
      ]),
    });

    await request(app.getHttpServer())
      .post(`/api/v1/mentor/projects/${projectId}/team`)
      .set('Authorization', `Bearer ${mentorToken}`)
      .send({ applicationIds: acceptedApplicationIds })
      .expect(409);

    const firstLeader = await request(app.getHttpServer())
      .post(`/api/v1/mentor/teams/${created.body.id}/leader`)
      .set('Authorization', `Bearer ${mentorToken}`)
      .send({ userId: talentId })
      .expect(201);
    expect(firstLeader.body.status).toBe('ACTIVE');

    const replacement = await request(app.getHttpServer())
      .post(`/api/v1/mentor/teams/${created.body.id}/leader`)
      .set('Authorization', `Bearer ${mentorToken}`)
      .send({ userId: leaderId })
      .expect(201);
    expect(
      replacement.body.members.filter(
        (member: { role: string }) => member.role === 'LEADER',
      ),
    ).toHaveLength(1);
    expect(replacement.body.leaderHistory).toHaveLength(2);
    expect(replacement.body.leaderHistory[1].previousUserId).toBe(talentId);

    const memberView = await request(app.getHttpServer())
      .get('/api/v1/talent/me/team')
      .set('Authorization', `Bearer ${talentToken}`)
      .expect(200);
    expect(memberView.body.id).toBe(created.body.id);
  });

  it('prevents a member from joining a second project Team', async () => {
    await request(app.getHttpServer())
      .post(`/api/v1/mentor/projects/${projectId}/team`)
      .set('Authorization', `Bearer ${mentorToken}`)
      .send({ applicationIds: acceptedApplicationIds })
      .expect(201);

    const secondProjectDraft = await request(app.getHttpServer())
      .post('/api/v1/projects/proposals')
      .set('Authorization', `Bearer ${enterpriseToken}`)
      .send({
        title: 'Dự án thứ hai kiểm tra membership',
        summary: 'Kiểm tra quy tắc một Team trên mỗi Talent.',
        description: 'Dự án kiểm thử membership giữa các project.',
        deliverables: 'Báo cáo kiểm thử.',
        requiredSkills: ['TypeScript'],
        minTeamSize: 2,
        maxTeamSize: 3,
        durationWeeks: 8,
        budgetAmount: 10000000,
      })
      .expect(201);
    const secondProjectId = secondProjectDraft.body.id as string;
    await request(app.getHttpServer())
      .post(`/api/v1/projects/proposals/${secondProjectId}/submit`)
      .set('Authorization', `Bearer ${enterpriseToken}`)
      .expect(200);
    await request(app.getHttpServer())
      .post(`/api/v1/lab-admin/proposals/${secondProjectId}/approve`)
      .set('Authorization', `Bearer ${labAdminToken}`)
      .send({ reviewNote: 'Approved for membership test.' })
      .expect(200);
    await request(app.getHttpServer())
      .post(`/api/v1/lab-admin/projects/${secondProjectId}/publish`)
      .set('Authorization', `Bearer ${labAdminToken}`)
      .send({
        registrationOpenAt: new Date(Date.now() - 60_000).toISOString(),
        registrationCloseAt: new Date(Date.now() + 86_400_000).toISOString(),
      })
      .expect(200);
    assignments.assign(
      secondProjectId,
      '00000000-0000-4000-8000-000000000004',
      'lab',
    );
    const secondProjectApplications = [
      addApplicationForProject(secondProjectId, talentId),
      addApplicationForProject(secondProjectId, leaderId),
    ];

    await request(app.getHttpServer())
      .post(`/api/v1/mentor/projects/${secondProjectId}/team`)
      .set('Authorization', `Bearer ${mentorToken}`)
      .send({ applicationIds: secondProjectApplications })
      .expect(409);
  });

  it('serves demo template metadata, pins versions, creates PLANNED tasks/milestones, and scopes member reads', async () => {
    const createdTeam = await request(app.getHttpServer())
      .post(`/api/v1/mentor/projects/${projectId}/team`)
      .set('Authorization', `Bearer ${mentorToken}`)
      .send({ applicationIds: acceptedApplicationIds })
      .expect(201);
    await request(app.getHttpServer())
      .post(`/api/v1/mentor/teams/${createdTeam.body.id}/leader`)
      .set('Authorization', `Bearer ${mentorToken}`)
      .send({ userId: leaderId })
      .expect(201);

    const templates = await request(app.getHttpServer())
      .get(`/api/v1/mentor/projects/${projectId}/templates`)
      .set('Authorization', `Bearer ${mentorToken}`)
      .expect(200);
    expect(templates.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'TASK-PLAN',
          version: '1.0.0-demo',
          approvalStatus: 'DEMO/NOT_APPROVED',
          fileReference: null,
        }),
      ]),
    );
    expect(JSON.stringify(templates.body)).not.toMatch(/https?:\/\/|credential|secret/i);

    await request(app.getHttpServer())
      .post(`/api/v1/mentor/projects/${projectId}/tasks`)
      .set('Authorization', `Bearer ${mentorToken}`)
      .send({
        title: 'Task stale template version',
        templateId: 'TASK-PLAN',
        templateVersion: '0.9.0',
      })
      .expect(409);

    const task = await request(app.getHttpServer())
      .post(`/api/v1/mentor/projects/${projectId}/tasks`)
      .set('Authorization', `Bearer ${mentorToken}`)
      .send({
        title: 'Thiết kế API',
        description: 'Chuẩn bị bản thiết kế API.',
        dueAt: new Date(Date.now() + 86_400_000).toISOString(),
        templateId: 'TASK-PLAN',
        templateVersion: '1.0.0-demo',
      })
      .expect(201);
    expect(task.body).toMatchObject({
      status: 'PLANNED',
      assignedUserId: null,
      templateId: 'TASK-PLAN',
      templateVersion: '1.0.0-demo',
    });

    const withMilestone = await request(app.getHttpServer())
      .post(`/api/v1/mentor/tasks/${task.body.id}/milestones`)
      .set('Authorization', `Bearer ${mentorToken}`)
      .send({
        title: 'Hoàn thành bản thiết kế',
        templateId: 'MILESTONE-PLAN',
        templateVersion: '1.0.0-demo',
      })
      .expect(201);
    expect(withMilestone.body.milestones[0]).toMatchObject({
      status: 'PLANNED',
      templateId: 'MILESTONE-PLAN',
      templateVersion: '1.0.0-demo',
    });

    const visibleTasks = await request(app.getHttpServer())
      .get('/api/v1/talent/me/tasks')
      .set('Authorization', `Bearer ${talentToken}`)
      .expect(200);
    expect(visibleTasks.body).toHaveLength(1);
    expect(visibleTasks.body[0].milestones).toHaveLength(1);
  });

  async function login(email: string): Promise<string> {
    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password })
      .expect(200);
    return response.body.accessToken;
  }

  function addApplication(applicantUserId: string, status: ApplicationStatus) {
    return addApplicationForProject(projectId, applicantUserId, status);
  }

  function addApplicationForProject(
    targetProjectId: string,
    applicantUserId: string,
    status: ApplicationStatus = ApplicationStatus.ACCEPTED,
  ) {
    const application = applications.create(targetProjectId, applicantUserId);
    applications.transition(
      application,
      '00000000-0000-4000-8000-000000000004',
      status,
    );
    return application.id;
  }
});
