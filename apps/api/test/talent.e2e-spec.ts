import 'reflect-metadata';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UserRole, UserStatus } from '@labodc/shared-types';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { CloudinaryStorageService } from '../src/files/cloudinary-storage.service';
import {
  FILE_REPOSITORY,
  InMemoryFileRepository,
} from '../src/files/file.repository';
import { FileAsset } from '../src/files/file.types';
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
  let moduleFixture: TestingModule;
  let fileRepository: InMemoryFileRepository;
  const profiles = new Map<string, TalentProfile>();
  let cloudinaryBytesOverride: number | undefined;

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
      setAvatarFileId: jest.fn(async (userId: string, fileId: string) => {
        const profile = profiles.get(userId);
        if (!profile) return null;
        const updated = { ...profile, avatarFileId: fileId };
        profiles.set(userId, updated);
        return updated;
      }),
    };

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
        bytes: cloudinaryBytesOverride ?? asset.sizeBytes,
      })),
      createPrivateDownloadUrl: jest.fn(
        (asset: FileAsset) => `https://download.example.test/${asset.id}?signed`,
      ),
    };

    moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(TALENT_PROFILE_REPOSITORY)
      .useValue(repository)
      .overrideProvider(CloudinaryStorageService)
      .useValue(cloudinaryMock)
      .overrideProvider(FILE_REPOSITORY)
      .useValue(new InMemoryFileRepository())
      .compile();

    fileRepository = moduleFixture.get<InMemoryFileRepository>(FILE_REPOSITORY);
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

  beforeEach(() => {
    profiles.clear();
    fileRepository.clearAll();
    cloudinaryBytesOverride = undefined;
  });

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

  it('creates private signed uploads only for allowed file types and enforces owner downloads', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/files/upload-intents')
      .set('Authorization', `Bearer ${talentToken}`)
      .send({
        category: 'PORTFOLIO',
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
      .post('/api/v1/files/upload-intents')
      .set('Authorization', `Bearer ${talentToken}`)
      .send({
        category: 'PORTFOLIO',
        fileName: 'work.exe',
        mimeType: 'application/octet-stream',
        sizeBytes: 1024,
      })
      .expect(400);

    const upload = await request(app.getHttpServer())
      .post('/api/v1/files/upload-intents')
      .set('Authorization', `Bearer ${talentToken}`)
      .send({
        category: 'PORTFOLIO',
        fileName: 'work.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 1024,
      })
      .expect(201);
    expect(upload.body).toMatchObject({
      file: { category: 'PORTFOLIO', status: 'PENDING_UPLOAD' },
      uploadUrl: 'https://upload.example.test',
      uploadFields: { signature: 'test-signature' },
    });

    const completed = await request(app.getHttpServer())
      .post(`/api/v1/files/${upload.body.file.id}/complete`)
      .set('Authorization', `Bearer ${talentToken}`)
      .expect(201);
    expect(completed.body.status).toBe('UPLOADED');
    expect(profiles.get('00000000-0000-4000-8000-000000000006')?.portfolioItems[0].status)
      .toBe('UPLOADED');

    const downloaded = await request(app.getHttpServer())
      .get(`/api/v1/files/${upload.body.file.id}/download`)
      .set('Authorization', `Bearer ${talentToken}`)
      .expect(200);
    expect(downloaded.body.downloadUrl).toContain('signed');
    await request(app.getHttpServer())
      .get(`/api/v1/files/${upload.body.file.id}/download`)
      .set('Authorization', `Bearer ${secondTalentToken}`)
      .expect(403);
  });

  it('rejects oversized avatar and portfolio uploads and locks an avatar to the profile owner', async () => {
    await request(app.getHttpServer())
      .put('/api/v1/talent/me/profile')
      .set('Authorization', `Bearer ${talentToken}`)
      .send({ studentId: 'S12345', fullName: 'Talent User' })
      .expect(200);
    await request(app.getHttpServer())
      .post('/api/v1/files/upload-intents')
      .set('Authorization', `Bearer ${talentToken}`)
      .send({
        category: 'AVATAR',
        fileName: 'large.png',
        mimeType: 'image/png',
        sizeBytes: 5 * 1024 * 1024 + 1,
      })
      .expect(400);
    await request(app.getHttpServer())
      .post('/api/v1/files/upload-intents')
      .set('Authorization', `Bearer ${talentToken}`)
      .send({
        category: 'PORTFOLIO',
        fileName: 'large.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 10 * 1024 * 1024 + 1,
      })
      .expect(400);

    const upload = await request(app.getHttpServer())
      .post('/api/v1/files/upload-intents')
      .set('Authorization', `Bearer ${talentToken}`)
      .send({
        category: 'AVATAR',
        fileName: 'avatar.png',
        mimeType: 'image/png',
        sizeBytes: 1024,
      })
      .expect(201);
    await request(app.getHttpServer())
      .post(`/api/v1/files/${upload.body.file.id}/complete`)
      .set('Authorization', `Bearer ${talentToken}`)
      .expect(201);
    expect(profiles.get('00000000-0000-4000-8000-000000000006')?.avatarFileId)
      .toBe(upload.body.file.id);
    await request(app.getHttpServer())
      .get(`/api/v1/files/${upload.body.file.id}/download`)
      .set('Authorization', `Bearer ${secondTalentToken}`)
      .expect(403);
  });

  it('rejects a Cloudinary upload whose actual size exceeds the policy', async () => {
    await request(app.getHttpServer())
      .put('/api/v1/talent/me/profile')
      .set('Authorization', `Bearer ${talentToken}`)
      .send({ studentId: 'S12345', fullName: 'Talent User' })
      .expect(200);
    const upload = await request(app.getHttpServer())
      .post('/api/v1/files/upload-intents')
      .set('Authorization', `Bearer ${talentToken}`)
      .send({
        category: 'AVATAR',
        fileName: 'avatar.png',
        mimeType: 'image/png',
        sizeBytes: 1024,
      })
      .expect(201);
    cloudinaryBytesOverride = 5 * 1024 * 1024 + 1;
    await request(app.getHttpServer())
      .post(`/api/v1/files/${upload.body.file.id}/complete`)
      .set('Authorization', `Bearer ${talentToken}`)
      .expect(400);
    await request(app.getHttpServer())
      .get(`/api/v1/files/${upload.body.file.id}/download`)
      .set('Authorization', `Bearer ${talentToken}`)
      .expect(404);
  });

  afterAll(async () => {
    await app.close();
  });
});
