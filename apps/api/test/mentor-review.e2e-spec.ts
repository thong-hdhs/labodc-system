import 'reflect-metadata';
import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { UserRole, UserStatus } from '@labodc/shared-types';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { ApplicationRepository } from '../src/applications/application.repository';
import { MentorAssignmentRepository } from '../src/applications/mentor-assignment.repository';
import {
  TALENT_PROFILE_REPOSITORY,
  TalentProfileRepository,
} from '../src/talent/talent-profile.repository';
import {
  TalentProfile,
  UpdateTalentProfileInput,
} from '../src/talent/talent-profile.types';

describe('Mentor application review (D11)', () => {
  let app: INestApplication;
  let enterpriseToken: string;
  let labAdminToken: string;
  let mentorToken: string;
  let unassignedMentorToken: string;
  let talentToken: string;
  let projectId: string;
  let applications: ApplicationRepository;
  let assignments: MentorAssignmentRepository;

  const mentorUserId = '00000000-0000-4000-8000-000000000004';
  const password =
    process.env.INITIAL_SYSADMIN_PASSWORD || 'ChangeMe_LabOdc@2026!';

  beforeAll(async () => {
    const candidateProfile: TalentProfile = {
      userId: '00000000-0000-4000-8000-000000000006',
      email: 'talent@student.uth.edu.vn',
      studentId: 'S12345',
      fullName: 'Lê Thị Talent',
      faculty: 'Công nghệ thông tin',
      major: 'Kỹ thuật phần mềm',
      cohort: 'K2024',
      bio: 'Sinh viên quan tâm phát triển phần mềm.',
      skills: ['NestJS', 'React'],
      certifications: ['TypeScript Foundation'],
      portfolioItems: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const profileRepository: TalentProfileRepository = {
      findByUserId: async (userId) =>
        userId === candidateProfile.userId ? candidateProfile : null,
      findByStudentId: async () => null,
      save: async (
        userId: string,
        email: string,
        input: UpdateTalentProfileInput,
      ) => ({
        ...candidateProfile,
        ...input,
        userId,
        email,
        faculty: input.faculty ?? null,
        major: input.major ?? null,
        cohort: input.cohort ?? null,
        bio: input.bio ?? null,
      }),
      addPortfolioItem: async () => null,
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(TALENT_PROFILE_REPOSITORY)
      .useValue(profileRepository)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    applications = moduleFixture.get(ApplicationRepository);
    assignments = moduleFixture.get(MentorAssignmentRepository);

    const jwtService = moduleFixture.get(JwtService);
    unassignedMentorToken = await jwtService.signAsync(
      {
        sub: '00000000-0000-4000-8000-000000000009',
        email: 'unassigned@labodc.uth.edu.vn',
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
    mentorToken = await login('mentor@labodc.uth.edu.vn');
    talentToken = await login('talent@student.uth.edu.vn');

    const enterprise = await request(app.getHttpServer())
      .post('/api/v1/enterprises/profile')
      .set('Authorization', `Bearer ${enterpriseToken}`)
      .send({
        companyName: 'Công ty Dự án Mentor',
        taxCode: '0312223334',
        industry: 'Công nghệ thông tin',
        address: 'TP. Hồ Chí Minh',
        representativeName: 'Nguyễn Đại Diện',
        contactEmail: 'mentor-project@company.vn',
        contactPhone: '0900000000',
      })
      .expect(200);

    await request(app.getHttpServer())
      .patch(`/api/v1/enterprises/${enterprise.body.id}/verify`)
      .set('Authorization', `Bearer ${labAdminToken}`)
      .send({ status: 'VERIFIED', note: 'Đã xác minh doanh nghiệp.' })
      .expect(200);

    projectId = await createPublishedProject(
      enterpriseToken,
      true,
      'Dự án yêu cầu phỏng vấn',
    );
  });

  beforeEach(() => {
    applications.clearAll();
    assignments.clearAll();
  });

  it('assigns the reviewer, enforces project scope, records interview result and keeps notes private', async () => {
    const applicationId = await submitApplication(projectId);

    await request(app.getHttpServer())
      .post(`/api/v1/lab-admin/projects/${projectId}/mentor-assignment`)
      .set('Authorization', `Bearer ${labAdminToken}`)
      .send({ mentorUserId })
      .expect(201)
      .expect(({ body }) => {
        expect(body.assignment.mentorUserId).toBe(mentorUserId);
        expect(body.history).toHaveLength(1);
      });

    await request(app.getHttpServer())
      .post(`/api/v1/lab-admin/projects/${projectId}/mentor-assignment`)
      .set('Authorization', `Bearer ${talentToken}`)
      .send({ mentorUserId })
      .expect(403);

    await request(app.getHttpServer())
      .post(`/api/v1/lab-admin/projects/${projectId}/mentor-assignment`)
      .set('Authorization', `Bearer ${labAdminToken}`)
      .send({ mentorUserId: '00000000-0000-4000-8000-000000000006' })
      .expect(400);

    await request(app.getHttpServer())
      .post(`/api/v1/mentor/applications/${applicationId}/start-review`)
      .set('Authorization', `Bearer ${unassignedMentorToken}`)
      .expect(403);

    await request(app.getHttpServer())
      .get('/api/v1/mentor/me/applications')
      .set('Authorization', `Bearer ${talentToken}`)
      .expect(403);

    const queue = await request(app.getHttpServer())
      .get('/api/v1/mentor/me/applications')
      .set('Authorization', `Bearer ${mentorToken}`)
      .expect(200);
    expect(queue.body).toHaveLength(1);
    expect(queue.body[0].candidate.fullName).toBe('Lê Thị Talent');
    expect(queue.body[0].candidate.profile.skills).toEqual([
      'NestJS',
      'React',
    ]);
    expect(queue.body[0].requiresInterview).toBe(true);

    await request(app.getHttpServer())
      .post(`/api/v1/mentor/applications/${applicationId}/decision`)
      .set('Authorization', `Bearer ${mentorToken}`)
      .send({ status: 'ACCEPTED' })
      .expect(409);

    const reviewed = await request(app.getHttpServer())
      .post(`/api/v1/mentor/applications/${applicationId}/start-review`)
      .set('Authorization', `Bearer ${mentorToken}`)
      .expect(200);
    expect(reviewed.body.status).toBe('UNDER_REVIEW');

    await request(app.getHttpServer())
      .post(`/api/v1/mentor/applications/${applicationId}/decision`)
      .set('Authorization', `Bearer ${mentorToken}`)
      .send({ status: 'ACCEPTED' })
      .expect(409);

    const interviewed = await request(app.getHttpServer())
      .post(`/api/v1/mentor/applications/${applicationId}/interview-result`)
      .set('Authorization', `Bearer ${mentorToken}`)
      .send({
        outcome: 'PASS',
        internalNote: 'Private mentor note for selection discussion.',
      })
      .expect(200);
    expect(interviewed.body.status).toBe('INTERVIEW');
    expect(interviewed.body.reviewEvents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          action: 'INTERVIEW_RESULT',
          interviewOutcome: 'PASS',
          internalNote: 'Private mentor note for selection discussion.',
        }),
      ]),
    );

    const candidateView = await request(app.getHttpServer())
      .get('/api/v1/talent/me/applications')
      .set('Authorization', `Bearer ${talentToken}`)
      .expect(200);
    expect(candidateView.body[0].status).toBe('INTERVIEW');
    expect(JSON.stringify(candidateView.body)).not.toContain(
      'Private mentor note',
    );
    expect(candidateView.body[0].reviewEvents).toBeUndefined();

    const decided = await request(app.getHttpServer())
      .post(`/api/v1/mentor/applications/${applicationId}/decision`)
      .set('Authorization', `Bearer ${mentorToken}`)
      .send({
        status: 'ACCEPTED',
        internalNote: 'Final decision note remains confidential.',
      })
      .expect(200);
    expect(decided.body.status).toBe('ACCEPTED');

    const finalCandidateView = await request(app.getHttpServer())
      .get('/api/v1/talent/me/applications')
      .set('Authorization', `Bearer ${talentToken}`)
      .expect(200);
    expect(finalCandidateView.body[0].status).toBe('ACCEPTED');
    expect(JSON.stringify(finalCandidateView.body)).not.toContain(
      'confidential',
    );
  });

  it('allows direct decision when interview is not required and rejects interview result', async () => {
    const noInterviewProjectId = await createPublishedProject(
      enterpriseToken,
      false,
      'Dự án không yêu cầu phỏng vấn',
    );
    const applicationId = await submitApplication(noInterviewProjectId);

    await assignMentor(noInterviewProjectId);

    await request(app.getHttpServer())
      .post(`/api/v1/mentor/applications/${applicationId}/start-review`)
      .set('Authorization', `Bearer ${mentorToken}`)
      .expect(200);

    await request(app.getHttpServer())
      .post(`/api/v1/mentor/applications/${applicationId}/interview-result`)
      .set('Authorization', `Bearer ${mentorToken}`)
      .send({ outcome: 'PASS' })
      .expect(409);

    const decision = await request(app.getHttpServer())
      .post(`/api/v1/mentor/applications/${applicationId}/decision`)
      .set('Authorization', `Bearer ${mentorToken}`)
      .send({ status: 'REJECTED' })
      .expect(200);
    expect(decision.body.status).toBe('REJECTED');
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

  async function createPublishedProject(
    token: string,
    requiresInterview: boolean,
    title: string,
  ): Promise<string> {
    const draft = await request(app.getHttpServer())
      .post('/api/v1/projects/proposals')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title,
        summary: 'Một dự án đủ điều kiện để kiểm thử review Mentor.',
        description:
          'Triển khai sản phẩm phần mềm có API và giao diện người dùng.',
        deliverables: 'Ứng dụng web, API và tài liệu kiểm thử.',
        requiredSkills: ['React', 'NestJS'],
        minTeamSize: 2,
        maxTeamSize: 5,
        durationWeeks: 8,
        budgetAmount: 10000000,
        requiresInterview,
      })
      .expect(201);
    const id = draft.body.id as string;

    await request(app.getHttpServer())
      .post(`/api/v1/projects/proposals/${id}/submit`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    await request(app.getHttpServer())
      .post(`/api/v1/lab-admin/proposals/${id}/approve`)
      .set('Authorization', `Bearer ${labAdminToken}`)
      .send({ reviewNote: 'Đề xuất đáp ứng thông tin cơ bản.' })
      .expect(200);
    await request(app.getHttpServer())
      .post(`/api/v1/lab-admin/projects/${id}/publish`)
      .set('Authorization', `Bearer ${labAdminToken}`)
      .send({
        registrationOpenAt: new Date(Date.now() - 60_000).toISOString(),
        registrationCloseAt: new Date(Date.now() + 86_400_000).toISOString(),
      })
      .expect(200);

    return id;
  }

  async function submitApplication(id: string): Promise<string> {
    const response = await request(app.getHttpServer())
      .post(`/api/v1/projects/${id}/applications`)
      .set('Authorization', `Bearer ${talentToken}`)
      .expect(201);
    return response.body.id as string;
  }

  async function assignMentor(id: string): Promise<void> {
    await request(app.getHttpServer())
      .post(`/api/v1/lab-admin/projects/${id}/mentor-assignment`)
      .set('Authorization', `Bearer ${labAdminToken}`)
      .send({ mentorUserId })
      .expect(201);
  }
});
