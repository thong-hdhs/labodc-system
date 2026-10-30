import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  TALENT_PROFILE_REPOSITORY,
  TalentProfileRepository,
  isProfileStudentIdConflict,
} from './talent-profile.repository';
import {
  CreatePortfolioItemInput,
  TalentProfile,
  UpdateTalentProfileInput,
} from './talent-profile.types';

const MAX_PORTFOLIO_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_PORTFOLIO_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
]);

@Injectable()
export class TalentService {
  constructor(
    @Inject(TALENT_PROFILE_REPOSITORY)
    private readonly profiles: TalentProfileRepository,
  ) {}

  async getMyProfile(userId: string): Promise<TalentProfile | null> {
    return this.profiles.findByUserId(userId);
  }

  async getProfileForLabAdmin(userId: string): Promise<TalentProfile> {
    const profile = await this.profiles.findByUserId(userId);
    if (!profile) {
      throw new NotFoundException('Không tìm thấy hồ sơ Talent.');
    }
    return profile;
  }

  async updateMyProfile(
    userId: string,
    email: string,
    input: UpdateTalentProfileInput,
  ): Promise<TalentProfile> {
    this.validateProfile(input);

    const existing = await this.profiles.findByStudentId(input.studentId.trim());
    if (existing && existing.userId !== userId) {
      throw new ConflictException('Mã sinh viên đã được sử dụng.');
    }

    try {
      return await this.profiles.save(userId, email, {
        ...input,
        studentId: input.studentId.trim(),
        fullName: input.fullName.trim(),
        faculty: input.faculty?.trim() || undefined,
        major: input.major?.trim() || undefined,
        cohort: input.cohort?.trim() || undefined,
        bio: input.bio?.trim() || undefined,
        skills: this.normalizeList(input.skills),
        certifications: this.normalizeList(input.certifications),
      });
    } catch (error) {
      if (isProfileStudentIdConflict(error)) {
        throw new ConflictException('Mã sinh viên đã được sử dụng.');
      }
      throw error;
    }
  }

  async addPortfolioItem(
    userId: string,
    input: CreatePortfolioItemInput,
  ): Promise<TalentProfile> {
    this.validatePortfolioItem(input);
    const item = await this.profiles.addPortfolioItem(userId, {
      id: randomUUID(),
      fileName: input.fileName.trim(),
      mimeType: input.mimeType,
      sizeBytes: input.sizeBytes,
      status: 'PENDING_UPLOAD',
      createdAt: new Date().toISOString(),
    });

    if (!item) {
      throw new NotFoundException('Hãy lưu hồ sơ Talent trước khi thêm portfolio.');
    }
    return item;
  }

  private validateProfile(input: UpdateTalentProfileInput): void {
    if (!input || typeof input !== 'object') {
      throw new BadRequestException('Dữ liệu hồ sơ không hợp lệ.');
    }
    if (!this.isText(input.studentId, 1, 64)) {
      throw new BadRequestException('Mã sinh viên là bắt buộc và tối đa 64 ký tự.');
    }
    if (!this.isText(input.fullName, 1, 160)) {
      throw new BadRequestException('Họ tên là bắt buộc và tối đa 160 ký tự.');
    }
    for (const [field, value, maxLength] of [
      ['faculty', input.faculty, 160],
      ['major', input.major, 160],
      ['cohort', input.cohort, 80],
      ['bio', input.bio, 2000],
    ] as const) {
      if (value !== undefined && !this.isText(value, 0, maxLength)) {
        throw new BadRequestException(`${field} không được vượt quá ${maxLength} ký tự.`);
      }
    }
    this.validateStringList(input.skills, 'skills');
    this.validateStringList(input.certifications, 'certifications');
  }

  private validatePortfolioItem(input: CreatePortfolioItemInput): void {
    if (
      !input ||
      !this.isText(input.fileName, 1, 255) ||
      !ALLOWED_PORTFOLIO_TYPES.has(input.mimeType) ||
      !Number.isInteger(input.sizeBytes) ||
      input.sizeBytes <= 0 ||
      input.sizeBytes > MAX_PORTFOLIO_FILE_SIZE
    ) {
      throw new BadRequestException(
        'Tệp portfolio phải là PDF/JPEG/PNG và có kích thước từ 1 byte đến 10 MiB.',
      );
    }
  }

  private validateStringList(value: unknown, field: string): void {
    if (value === undefined) return;
    if (
      !Array.isArray(value) ||
      value.length > 50 ||
      value.some(
        (entry) =>
          typeof entry !== 'string' ||
          entry.trim().length === 0 ||
          entry.length > 120,
      )
    ) {
      throw new BadRequestException(
        `${field} phải là danh sách tối đa 50 mục, mỗi mục tối đa 120 ký tự.`,
      );
    }
  }

  private normalizeList(value?: string[]): string[] {
    return [...new Set((value ?? []).map((entry) => entry.trim()))];
  }

  private isText(value: unknown, minLength: number, maxLength: number): value is string {
    return (
      typeof value === 'string' &&
      value.trim().length >= minLength &&
      value.trim().length <= maxLength
    );
  }
}
