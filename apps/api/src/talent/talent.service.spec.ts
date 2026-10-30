import { ConflictException, NotFoundException } from '@nestjs/common';
import { TalentProfileRepository } from './talent-profile.repository';
import { TalentProfile, UpdateTalentProfileInput } from './talent-profile.types';
import { TalentService } from './talent.service';

const makeProfile = (userId: string, studentId: string): TalentProfile => ({
  userId,
  email: `${userId}@student.uth.edu.vn`,
  studentId,
  fullName: 'Talent User',
  faculty: null,
  major: null,
  cohort: null,
  bio: null,
  skills: [],
  certifications: [],
  portfolioItems: [],
  createdAt: new Date(0).toISOString(),
  updatedAt: new Date(0).toISOString(),
});

describe('TalentService', () => {
  let service: TalentService;
  let profiles: jest.Mocked<TalentProfileRepository>;

  beforeEach(() => {
    profiles = {
      findByUserId: jest.fn(),
      findByStudentId: jest.fn(),
      save: jest.fn(),
      addPortfolioItem: jest.fn(),
    };
    service = new TalentService(profiles);
  });

  it('saves a normalized profile against the authenticated user identity', async () => {
    const input: UpdateTalentProfileInput = {
      studentId: ' S123 ',
      fullName: '  Talent User ',
      skills: [' NestJS ', 'NestJS'],
      certifications: [],
    };
    profiles.findByStudentId.mockResolvedValue(null);
    profiles.save.mockResolvedValue(makeProfile('user-1', 'S123'));

    await service.updateMyProfile('user-1', 'user-1@student.uth.edu.vn', input);

    expect(profiles.save).toHaveBeenCalledWith(
      'user-1',
      'user-1@student.uth.edu.vn',
      expect.objectContaining({
        studentId: 'S123',
        fullName: 'Talent User',
        skills: ['NestJS'],
      }),
    );
  });

  it('rejects a student id owned by another user', async () => {
    profiles.findByStudentId.mockResolvedValue(makeProfile('user-2', 'S123'));

    await expect(
      service.updateMyProfile('user-1', 'user-1@student.uth.edu.vn', {
        studentId: 'S123',
        fullName: 'Talent User',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(profiles.save).not.toHaveBeenCalled();
  });

  it('rejects unsupported file types and files above the temporary size limit', async () => {
    await expect(
      service.addPortfolioItem('user-1', {
        fileName: 'payload.exe',
        mimeType: 'application/octet-stream',
        sizeBytes: 100,
      }),
    ).rejects.toThrow();
    await expect(
      service.addPortfolioItem('user-1', {
        fileName: 'large.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 10 * 1024 * 1024 + 1,
      }),
    ).rejects.toThrow();
    expect(profiles.addPortfolioItem).not.toHaveBeenCalled();
  });

  it('reports a missing profile when a portfolio item is added before profile creation', async () => {
    profiles.addPortfolioItem.mockResolvedValue(null);

    await expect(
      service.addPortfolioItem('user-1', {
        fileName: 'portfolio.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 1000,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
