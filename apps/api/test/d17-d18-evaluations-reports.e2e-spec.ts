import 'reflect-metadata';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UserRole, UserStatus } from '@labodc/shared-types';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { MentorAssignmentRepository } from '../src/applications/mentor-assignment.repository';
import { ProjectProposalRepository } from '../src/projects/project-proposal.repository';
import { ReportRepository } from '../src/reports/report.repository';
import { TeamRepository } from '../src/teams/team.repository';
import { TeamMemberEntity } from '../src/teams/team.types';
import { CloudinaryStorageService } from '../src/files/cloudinary-storage.service';
import {
  FILE_REPOSITORY,
  InMemoryFileRepository,
} from '../src/files/file.repository';
import { FileAsset } from '../src/files/file.types';

describe('Day 17-18 — Evaluations, contributions and progress reports', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;
  let mentorToken: string;
  let talentToken: string;
  let leaderToken: string;
  let otherTalentToken: string;
  let outsiderTalentToken: string;
  let unassignedMentorToken: string;
  let enterpriseToken: string;
  let labAdminToken: string;
  let projectId: string;
  let teamId: string;
  let assignments: MentorAssignmentRepository;
  let teams: TeamRepository;
  let reports: ReportRepository;
  let fileRepository: InMemoryFileRepository;

  const mentorId = '00000000-0000-4000-8000-000000000004';
  const leaderId = '00000000-0000-4000-8000-000000000005';
  const talentId = '00000000-0000-4000-8000-000000000006';
  const otherTalentId = '00000000-0000-4000-8000-000000000009';
  const outsiderId = '00000000-0000-4000-8000-000000000010';
  const password =
    process.env.INITIAL_SYSADMIN_PASSWORD || 'ChangeMe_LabOdc@2026!';

  beforeAll(async () => {
    const cloudinaryMock = {
      createSignedUpload: jest.fn((asset: FileAsset) => ({
        uploadUrl: 'https://upload.example.test',
        fields: { public_id: asset.publicId, signature: 'test-signature' },
      })),
      verifyUploadedAsset: jest.fn(async (asset: FileAsset) => ({
        publicId: asset.publicId,
        resourceType: asset.resourceType,
        deliveryType: 'authenticated',
        format: asset.format,
        bytes: asset.sizeBytes,
      })),
      createPrivateDownloadUrl: jest.fn(
        (asset: FileAsset) => `https://download.example.test/${asset.id}?signed`,
      ),
    };
    moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(CloudinaryStorageService)
      .useValue(cloudinaryMock)
      .overrideProvider(FILE_REPOSITORY)
      .useValue(new InMemoryFileRepository())
      .compile();
    app = moduleFixture.createNestApplication();
    await app.init();
    await app.listen(0);

    assignments = moduleFixture.get(MentorAssignmentRepository);
    teams = moduleFixture.get(TeamRepository);
    reports = moduleFixture.get(ReportRepository);
    fileRepository = moduleFixture.get<InMemoryFileRepository>(FILE_REPOSITORY);

    mentorToken = await login('mentor@labodc.uth.edu.vn');
    talentToken = await login('talent@student.uth.edu.vn');
    leaderToken = await login('leader@student.uth.edu.vn');
    enterpriseToken = await login('enterprise@company.vn');
    labAdminToken = await login('labadmin@labodc.uth.edu.vn');
    otherTalentToken = await makeToken(otherTalentId, UserRole.TALENT);
    outsiderTalentToken = await makeToken(outsiderId, UserRole.TALENT);
    unassignedMentorToken = await makeToken(otherTalentId, UserRole.MENTOR);

    const enterprise = await request(app.getHttpServer())
      .post('/api/v1/enterprises/profile')
      .set('Authorization', `Bearer ${enterpriseToken}`)
      .send({
        companyName: 'Công ty D17-D18',
        taxCode: '0319990018',
        industry: 'Công nghệ thông tin',
        address: 'TP. Hồ Chí Minh',
        representativeName: 'Đại diện',
        contactEmail: 'contact@d17d18.vn',
        contactPhone: '0900000018',
      })
      .expect(200);
    await request(app.getHttpServer())
      .patch(`/api/v1/enterprises/${enterprise.body.id}/verify`)
      .set('Authorization', `Bearer ${labAdminToken}`)
      .send({ status: 'VERIFIED', note: 'Verified for D17-D18 tests.' })
      .expect(200);

    const proposal = await request(app.getHttpServer())
      .post('/api/v1/projects/proposals')
      .set('Authorization', `Bearer ${enterpriseToken}`)
      .send({
        title: 'Dự án kiểm thử Evaluation và Report',
        summary: 'Kiểm thử báo cáo tiến độ và đánh giá thành viên.',
        description: 'Dự án E2E cho D17 và D18.',
        deliverables: 'API, giao diện và tài liệu kiểm thử.',
        requiredSkills: ['TypeScript'],
        minTeamSize: 2,
        maxTeamSize: 3,
        durationWeeks: 8,
        budgetAmount: 10000000,
      })
      .expect(201);
    projectId = proposal.body.id as string;
    await request(app.getHttpServer())
      .post(`/api/v1/projects/proposals/${projectId}/submit`)
      .set('Authorization', `Bearer ${enterpriseToken}`)
      .expect(200);
    await request(app.getHttpServer())
      .post(`/api/v1/lab-admin/proposals/${projectId}/approve`)
      .set('Authorization', `Bearer ${labAdminToken}`)
      .send({ reviewNote: 'Approved for D17-D18 tests.' })
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
    reports.clearAll();
    teams.clearAll();
    assignments.clearAll();
    fileRepository.clearAll();
    assignments.assign(projectId, mentorId, 'lab-admin');
    const members: TeamMemberEntity[] = [
      {
        userId: leaderId,
        applicationId: 'leader-application',
        role: 'MEMBER',
        joinedAt: new Date().toISOString(),
      },
      {
        userId: talentId,
        applicationId: 'talent-application',
        role: 'MEMBER',
        joinedAt: new Date().toISOString(),
      },
      {
        userId: otherTalentId,
        applicationId: 'other-talent-application',
        role: 'MEMBER',
        joinedAt: new Date().toISOString(),
      },
    ];
    const team = teams.create(projectId, mentorId, members);
    teamId = team.id;
    teams.appointLeader(team, leaderId, mentorId);
  });

  afterAll(async () => {
    await app.close();
  });

  it('keeps evaluation drafts private and exposes only the finalized evaluation to its subject', async () => {
    const evaluation = await request(app.getHttpServer())
      .post(`/api/v1/mentor/projects/${projectId}/evaluations`)
      .set('Authorization', `Bearer ${mentorToken}`)
      .send(evaluationInput(talentId))
      .expect(201);
    expect(evaluation.body.status).toBe('EVALUATION_DRAFT');
    expect(evaluation.body.criteria[0]).toEqual({
      criterion: 'Giao tiếp',
      feedback: 'Phản hồi cụ thể',
    });

    await request(app.getHttpServer())
      .get('/api/v1/talent/me/evaluations')
      .set('Authorization', `Bearer ${talentToken}`)
      .expect(200)
      .expect(({ body }) => expect(body).toEqual([]));
    await request(app.getHttpServer())
      .get('/api/v1/talent/me/evaluations')
      .set('Authorization', `Bearer ${otherTalentToken}`)
      .expect(200)
      .expect(({ body }) => expect(body).toEqual([]));

    const finalized = await request(app.getHttpServer())
      .post(`/api/v1/mentor/evaluations/${evaluation.body.id}/finalize`)
      .set('Authorization', `Bearer ${mentorToken}`)
      .expect(201);
    expect(finalized.body.status).toBe('EVALUATION_FINAL');
    expect(finalized.body.finalizedAt).toBeTruthy();

    const ownEvaluations = await request(app.getHttpServer())
      .get('/api/v1/talent/me/evaluations')
      .set('Authorization', `Bearer ${talentToken}`)
      .expect(200);
    expect(ownEvaluations.body).toHaveLength(1);
    expect(ownEvaluations.body[0].subjectUserId).toBe(talentId);
    await request(app.getHttpServer())
      .get('/api/v1/talent/me/evaluations')
      .set('Authorization', `Bearer ${otherTalentToken}`)
      .expect(200)
      .expect(({ body }) => expect(body).toEqual([]));
    await request(app.getHttpServer())
      .get(`/api/v1/mentor/projects/${projectId}/evaluations`)
      .set('Authorization', `Bearer ${unassignedMentorToken}`)
      .expect(403);
    await request(app.getHttpServer())
      .get(`/api/v1/lab-admin/evaluations?projectId=${projectId}`)
      .set('Authorization', `Bearer ${labAdminToken}`)
      .expect(200)
      .expect(({ body }) =>
        expect(body).toEqual([expect.objectContaining({ id: evaluation.body.id })]),
      );
    await request(app.getHttpServer())
      .get('/api/v1/talent/me/evaluations')
      .set('Authorization', `Bearer ${enterpriseToken}`)
      .expect(403);
    await request(app.getHttpServer())
      .post(`/api/v1/mentor/evaluations/${evaluation.body.id}/finalize`)
      .set('Authorization', `Bearer ${mentorToken}`)
      .expect(409);
  });

  it('validates evaluation rubric and blocks unassigned mentors and non-members', async () => {
    await request(app.getHttpServer())
      .post(`/api/v1/mentor/projects/${projectId}/evaluations`)
      .set('Authorization', `Bearer ${unassignedMentorToken}`)
      .send(evaluationInput(talentId))
      .expect(403);
    await request(app.getHttpServer())
      .post(`/api/v1/mentor/projects/${projectId}/evaluations`)
      .set('Authorization', `Bearer ${mentorToken}`)
      .send({ ...evaluationInput(talentId), criteria: [] })
      .expect(400);
    await request(app.getHttpServer())
      .post(`/api/v1/mentor/projects/${projectId}/evaluations`)
      .set('Authorization', `Bearer ${mentorToken}`)
      .send({
        ...evaluationInput(talentId),
        criteria: [
          { criterion: 'Giao tiếp', feedback: 'Tốt', score: 10 },
        ],
      })
      .expect(400);
    await request(app.getHttpServer())
      .post(`/api/v1/mentor/projects/${projectId}/evaluations`)
      .set('Authorization', `Bearer ${mentorToken}`)
      .send(evaluationInput(outsiderId))
      .expect(400);
    await request(app.getHttpServer())
      .post(`/api/v1/mentor/projects/${projectId}/evaluations`)
      .set('Authorization', `Bearer ${mentorToken}`)
      .send({ ...evaluationInput(talentId), periodEnd: '2026-02-29' })
      .expect(400);
  });

  it('records contributions only for Team members and scopes talent visibility to self', async () => {
    const contribution = await request(app.getHttpServer())
      .post(`/api/v1/mentor/projects/${projectId}/contributions`)
      .set('Authorization', `Bearer ${mentorToken}`)
      .send({
        userId: talentId,
        periodStart: '2026-10-01',
        periodEnd: '2026-10-31',
        description: 'Hoàn thành phần API được giao.',
      })
      .expect(201);
    expect(contribution.body.teamId).toBe(teamId);
    expect(contribution.body.recordedBy).toBe(mentorId);
    await request(app.getHttpServer())
      .post(`/api/v1/mentor/projects/${projectId}/contributions`)
      .set('Authorization', `Bearer ${mentorToken}`)
      .send({
        userId: outsiderId,
        periodStart: '2026-10-01',
        periodEnd: '2026-10-31',
        description: 'Ngoài Team.',
      })
      .expect(400);
    const own = await request(app.getHttpServer())
      .get('/api/v1/talent/me/contributions')
      .set('Authorization', `Bearer ${talentToken}`)
      .expect(200);
    expect(own.body).toHaveLength(1);
    expect(own.body[0].id).toBe(contribution.body.id);
    await request(app.getHttpServer())
      .get('/api/v1/talent/me/contributions')
      .set('Authorization', `Bearer ${otherTalentToken}`)
      .expect(200)
      .expect(({ body }) => expect(body).toEqual([]));
    await request(app.getHttpServer())
      .get(`/api/v1/mentor/projects/${projectId}/contributions`)
      .set('Authorization', `Bearer ${unassignedMentorToken}`)
      .expect(403);
    await request(app.getHttpServer())
      .get('/api/v1/talent/me/contributions')
      .set('Authorization', `Bearer ${enterpriseToken}`)
      .expect(403);
  });

  it('runs report submit, review, changes-requested, resubmit, version and history transitions', async () => {
    const draft = await request(app.getHttpServer())
      .post('/api/v1/talent/me/reports')
      .set('Authorization', `Bearer ${leaderToken}`)
      .send(reportInput())
      .expect(201);
    expect(draft.body).toMatchObject({
      projectId,
      teamId,
      status: 'DRAFT',
      version: 1,
      authorUserId: leaderId,
    });

    const submitted = await request(app.getHttpServer())
      .post(`/api/v1/reports/${draft.body.id}/submit`)
      .set('Authorization', `Bearer ${leaderToken}`)
      .expect(201);
    expect(submitted.body.status).toBe('SUBMITTED');
    await request(app.getHttpServer())
      .post(`/api/v1/reports/${draft.body.id}/approve`)
      .set('Authorization', `Bearer ${mentorToken}`)
      .expect(409);
    await request(app.getHttpServer())
      .post(`/api/v1/reports/${draft.body.id}/start-review`)
      .set('Authorization', `Bearer ${unassignedMentorToken}`)
      .expect(403);

    await request(app.getHttpServer())
      .post(`/api/v1/reports/${draft.body.id}/start-review`)
      .set('Authorization', `Bearer ${mentorToken}`)
      .expect(201)
      .expect(({ body }) => expect(body.status).toBe('IN_REVIEW'));
    await request(app.getHttpServer())
      .post(`/api/v1/reports/${draft.body.id}/request-changes`)
      .set('Authorization', `Bearer ${mentorToken}`)
      .send({ note: '  ' })
      .expect(400);
    const changesRequested = await request(app.getHttpServer())
      .post(`/api/v1/reports/${draft.body.id}/request-changes`)
      .set('Authorization', `Bearer ${mentorToken}`)
      .send({ note: 'Bổ sung kết quả kiểm thử.' })
      .expect(201);
    expect(changesRequested.body).toMatchObject({
      status: 'CHANGES_REQUESTED',
      reviewNote: 'Bổ sung kết quả kiểm thử.',
    });

    const updated = await request(app.getHttpServer())
      .patch(`/api/v1/reports/${draft.body.id}`)
      .set('Authorization', `Bearer ${leaderToken}`)
      .send({ ...reportInput(), progress: 'Đã bổ sung kết quả kiểm thử.' })
      .expect(200);
    expect(updated.body).toMatchObject({ status: 'CHANGES_REQUESTED', version: 2 });
    expect(updated.body.revisions).toHaveLength(2);
    await request(app.getHttpServer())
      .post(`/api/v1/reports/${draft.body.id}/submit`)
      .set('Authorization', `Bearer ${leaderToken}`)
      .expect(201)
      .expect(({ body }) => expect(body.status).toBe('SUBMITTED'));
    await request(app.getHttpServer())
      .post(`/api/v1/reports/${draft.body.id}/start-review`)
      .set('Authorization', `Bearer ${mentorToken}`)
      .expect(201);
    const approved = await request(app.getHttpServer())
      .post(`/api/v1/reports/${draft.body.id}/approve`)
      .set('Authorization', `Bearer ${mentorToken}`)
      .expect(201);
    expect(approved.body.status).toBe('APPROVED');

    const history = await request(app.getHttpServer())
      .get(`/api/v1/reports/${draft.body.id}/history`)
      .set('Authorization', `Bearer ${talentToken}`)
      .expect(200);
    expect(history.body.map((event: { action: string }) => event.action)).toEqual([
      'CREATED',
      'SUBMITTED',
      'REVIEW_STARTED',
      'CHANGES_REQUESTED',
      'UPDATED',
      'RESUBMITTED',
      'REVIEW_STARTED',
      'APPROVED',
    ]);
    await request(app.getHttpServer())
      .get('/api/v1/talent/me/reports')
      .set('Authorization', `Bearer ${talentToken}`)
      .expect(200)
      .expect(({ body }) =>
        expect(body).toEqual([
          expect.objectContaining({ status: 'APPROVED', version: 2 }),
        ]),
      );
    await request(app.getHttpServer())
      .get(`/api/v1/lab-admin/reports?projectId=${projectId}`)
      .set('Authorization', `Bearer ${labAdminToken}`)
      .expect(200)
      .expect(({ body }) =>
        expect(body).toEqual([expect.objectContaining({ status: 'APPROVED' })]),
      );
  });

  it('allows Lab review but rejects a different reviewer after review has been accepted', async () => {
    const draft = await request(app.getHttpServer())
      .post('/api/v1/talent/me/reports')
      .set('Authorization', `Bearer ${leaderToken}`)
      .send(reportInput())
      .expect(201);
    await request(app.getHttpServer())
      .post(`/api/v1/reports/${draft.body.id}/submit`)
      .set('Authorization', `Bearer ${leaderToken}`)
      .expect(201);
    await request(app.getHttpServer())
      .post(`/api/v1/reports/${draft.body.id}/start-review`)
      .set('Authorization', `Bearer ${labAdminToken}`)
      .expect(201);
    await request(app.getHttpServer())
      .post(`/api/v1/reports/${draft.body.id}/approve`)
      .set('Authorization', `Bearer ${mentorToken}`)
      .expect(403);
    await request(app.getHttpServer())
      .post(`/api/v1/reports/${draft.body.id}/approve`)
      .set('Authorization', `Bearer ${labAdminToken}`)
      .expect(201);
  });

  it('integrates report attachments with Team and Mentor access scopes', async () => {
    const report = await request(app.getHttpServer())
      .post('/api/v1/talent/me/reports')
      .set('Authorization', `Bearer ${leaderToken}`)
      .send(reportInput())
      .expect(201);
    const upload = await request(app.getHttpServer())
      .post('/api/v1/files/upload-intents')
      .set('Authorization', `Bearer ${leaderToken}`)
      .send({
        category: 'REPORT_DOCUMENT',
        reportId: report.body.id,
        fileName: 'progress.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 2048,
      })
      .expect(201);
    await request(app.getHttpServer())
      .post(`/api/v1/files/${upload.body.file.id}/complete`)
      .set('Authorization', `Bearer ${leaderToken}`)
      .expect(201);

    await request(app.getHttpServer())
      .get(`/api/v1/reports/${report.body.id}/files`)
      .set('Authorization', `Bearer ${leaderToken}`)
      .expect(200)
      .expect(({ body }) =>
        expect(body).toEqual([
          expect.objectContaining({
            id: upload.body.file.id,
            category: 'REPORT_DOCUMENT',
            status: 'UPLOADED',
          }),
        ]),
      );
    await request(app.getHttpServer())
      .get(`/api/v1/reports/${report.body.id}/files`)
      .set('Authorization', `Bearer ${mentorToken}`)
      .expect(200);
    await request(app.getHttpServer())
      .get(`/api/v1/reports/${report.body.id}/files`)
      .set('Authorization', `Bearer ${outsiderTalentToken}`)
      .expect(404);
    await request(app.getHttpServer())
      .get(`/api/v1/files/${upload.body.file.id}/download`)
      .set('Authorization', `Bearer ${outsiderTalentToken}`)
      .expect(404);
  });

  it('lets the assigned Mentor create project/team reports and prevents scope tampering', async () => {
    const projectReport = await request(app.getHttpServer())
      .post(`/api/v1/mentor/projects/${projectId}/reports`)
      .set('Authorization', `Bearer ${mentorToken}`)
      .send(reportInput())
      .expect(201);
    expect(projectReport.body.teamId).toBeNull();

    const teamReport = await request(app.getHttpServer())
      .post(`/api/v1/mentor/projects/${projectId}/reports`)
      .set('Authorization', `Bearer ${mentorToken}`)
      .send({ ...reportInput(), teamId })
      .expect(201);
    expect(teamReport.body.teamId).toBe(teamId);
    await request(app.getHttpServer())
      .post(`/api/v1/mentor/projects/${projectId}/reports`)
      .set('Authorization', `Bearer ${unassignedMentorToken}`)
      .send(reportInput())
      .expect(403);
    await request(app.getHttpServer())
      .patch(`/api/v1/reports/${projectReport.body.id}`)
      .set('Authorization', `Bearer ${mentorToken}`)
      .send({ ...reportInput(), teamId })
      .expect(400);
    await request(app.getHttpServer())
      .patch(`/api/v1/reports/${teamReport.body.id}`)
      .set('Authorization', `Bearer ${leaderToken}`)
      .send(reportInput())
      .expect(403);
  });

  it('rejects invalid report periods, non-Leader creation and cross-Team history access', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/talent/me/reports')
      .set('Authorization', `Bearer ${talentToken}`)
      .send(reportInput())
      .expect(403);
    await request(app.getHttpServer())
      .post('/api/v1/talent/me/reports')
      .set('Authorization', `Bearer ${leaderToken}`)
      .send({ ...reportInput(), periodEnd: '2026-09-01' })
      .expect(400);
    const report = await request(app.getHttpServer())
      .post('/api/v1/talent/me/reports')
      .set('Authorization', `Bearer ${leaderToken}`)
      .send(reportInput())
      .expect(201);
    await request(app.getHttpServer())
      .patch(`/api/v1/reports/${report.body.id}`)
      .set('Authorization', `Bearer ${leaderToken}`)
      .send({ ...reportInput(), teamId: 'client-selected-team' })
      .expect(400);
    await request(app.getHttpServer())
      .get(`/api/v1/reports/${report.body.id}/history`)
      .set('Authorization', `Bearer ${outsiderTalentToken}`)
      .expect(404);
    await request(app.getHttpServer())
      .get(`/api/v1/mentor/projects/${projectId}/reports`)
      .set('Authorization', `Bearer ${unassignedMentorToken}`)
      .expect(403);
    await request(app.getHttpServer())
      .post('/api/v1/talent/me/reports')
      .set('Authorization', `Bearer ${leaderToken}`)
      .send({ ...reportInput(), teamId: 'client-selected-team' })
      .expect(403);
  });

  async function login(email: string): Promise<string> {
    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password })
      .expect(200);
    return response.body.accessToken as string;
  }

  async function makeToken(userId: string, role: UserRole): Promise<string> {
    return moduleFixture.get(JwtService).signAsync(
      {
        sub: userId,
        email: `${userId}@labodc.test`,
        role,
        status: UserStatus.ACTIVE,
      },
      {
        secret: process.env.JWT_ACCESS_SECRET || 'labodc_access_secret_d5',
        expiresIn: '15m',
      },
    );
  }

  function evaluationInput(subjectUserId: string) {
    return {
      subjectUserId,
      periodStart: '2026-10-01',
      periodEnd: '2026-10-31',
      criteria: [{ criterion: 'Giao tiếp', feedback: 'Phản hồi cụ thể' }],
      overallFeedback: 'Tiến bộ đều trong kỳ.',
    };
  }

  function reportInput() {
    return {
      periodType: 'MONTH',
      periodStart: '2026-10-01',
      periodEnd: '2026-10-31',
      summary: 'Báo cáo tiến độ tháng.',
      progress: 'Đã hoàn thành các đầu việc chính.',
      blockers: 'Chờ phản hồi API từ đối tác.',
      nextSteps: 'Hoàn tất tích hợp và regression.',
    };
  }
});
