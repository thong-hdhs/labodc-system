import 'reflect-metadata';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UserRole, UserStatus } from '@labodc/shared-types';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import {
  TALENT_PROFILE_REPOSITORY,
  TalentProfileRepository,
} from '../src/talent/talent-profile.repository';
import {
  PortfolioItem,
  TalentProfile,
  UpdateTalentProfileInput,
} from '../src/talent/talent-profile.types';

describe('Talent profile vertical slice (D5-D6)', () => {
  let app: INestApplication;
  let talentToken: string;
  let secondTalentToken: string;
  let enterpriseToken: string;
  let repository: TalentProfileRepository;
  const profiles = new Map<string, TalentProfile>();

  beforeAll(async () => {
    repository = {
      findByUserId: jest.fn(async (userId: string) => profiles.get(userId) ?? null),
      findByStudentId: jest.fn(async (studentId: string) =>
        [...profiles.values()].find((profile) => profile.studentId === studentId) ?? null,
      ),
      save: jest.fn(
        async (userId: string, email: string, input: UpdateTalentProfileInput) => {
          const previous = profiles.get(userId);
          const now = new Date().toISOString();
          const profile: TalentProfile = {
            userId,
            email,
            studentId: input.studentId,
            fullName: input.fullName,
            faculty: input.faculty ?? null,
            major: input.major ?? null,
            cohort: input.cohort ?? null,
            bio: input.bio ?? null,
            skills: input.skills ?? [],
            certifications: input.certifications ?? [],
            portfolioItems: previous?.portfolioItems ?? [],
            createdAt: previous?.createdAt ?? now,
            updatedAt: now,
          };
          profiles.set(userId, profile);
          return profile;
        },
      ),
      addPortfolioItem: jest.fn(async (userId: string, item: PortfolioItem) => {
        const profile = profiles.get(userId);
        if (!profile) return null;
        const updated = {
          ...profile,
          portfolioItems: [...profile.portfolioItems, item],
          updatedAt: new Date().toISOString(),
        };
        profiles.set(userId, updated);
        return updated;
      }),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(TALENT_PROFILE_REPOSITORY)
      .useValue(repository)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    const jwtService = moduleFixture.get(JwtService);
    secondTalentToken = await jwtService.signAsync(
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

    const password =
      process.env.INITIAL_SYSADMIN_PASSWORD || 'ChangeMe_LabOdc@2026!';
    const talentLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'talent@student.uth.edu.vn', password })
      .expect(200);
    talentToken = talentLogin.body.accessToken;

    const enterpriseLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'enterprise@company.vn', password })
      .expect(200);
    enterpriseToken = enterpriseLogin.body.accessToken;
  });

  beforeEach(() => profiles.clear());

  it('creates and reads only the authenticated Talent profile', async () => {
    const created = await request(app.getHttpServer())
      .put('/api/v1/talent/me/profile')
      .set('Authorization', `Bearer ${talentToken}`)
      .send({
        userId: 'attacker-chosen-id',
        studentId: 'S12345',
        fullName: 'Talent User',
        skills: ['NestJS'],
      })
      .expect(200);

    expect(created.body.userId).not.toBe('attacker-chosen-id');
    expect(created.body.userId).toBe('00000000-0000-4000-8000-000000000006');

    const loaded = await request(app.getHttpServer())
      .get('/api/v1/talent/me/profile')
      .set('Authorization', `Bearer ${talentToken}`)
      .expect(200);
    expect(loaded.body.profile.studentId).toBe('S12345');

    const otherTalentView = await request(app.getHttpServer())
      .get('/api/v1/talent/me/profile')
      .set('Authorization', `Bearer ${secondTalentToken}`)
      .expect(200);
    expect(otherTalentView.body.profile).toBeNull();
  });

  it('blocks actors outside the Talent self-service roles', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/talent/me/profile')
      .set('Authorization', `Bearer ${enterpriseToken}`)
      .expect(403);
  });

  it('validates portfolio metadata and requires a saved profile', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/talent/me/portfolio')
      .set('Authorization', `Bearer ${talentToken}`)
      .send({
        fileName: 'work.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 1024,
      })
      .expect(404);

    await request(app.getHttpServer())
      .put('/api/v1/talent/me/profile')
      .set('Authorization', `Bearer ${talentToken}`)
      .send({ studentId: 'S12345', fullName: 'Talent User' })
      .expect(200);

    await request(app.getHttpServer())
      .post('/api/v1/talent/me/portfolio')
      .set('Authorization', `Bearer ${talentToken}`)
      .send({
        fileName: 'work.exe',
        mimeType: 'application/octet-stream',
        sizeBytes: 1024,
      })
      .expect(400);

    const upload = await request(app.getHttpServer())
      .post('/api/v1/talent/me/portfolio')
      .set('Authorization', `Bearer ${talentToken}`)
      .send({
        fileName: 'work.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 1024,
      })
      .expect(201);
    expect(upload.body.portfolioItems[0].status).toBe('PENDING_UPLOAD');
  });

  afterAll(async () => {
    await app.close();
  });
});
