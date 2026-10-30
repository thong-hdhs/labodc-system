import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { JwtPayload, UserRole } from '@labodc/shared-types';
import { EnterpriseProfileRepository } from './enterprise-profile.repository';
import {
  EnterpriseProfileEntity,
  EnterpriseVerificationStatus,
  UpsertEnterpriseProfileDto,
  VerifyEnterpriseDto,
} from './enterprise-profile.types';

const TAX_CODE_REGEX = /^\d{10}(-\d{3})?$/;

@Injectable()
export class EnterpriseService {
  constructor(private readonly repository: EnterpriseProfileRepository) {}

  private validateUpsertPayload(dto: UpsertEnterpriseProfileDto): void {
    if (!dto.companyName || dto.companyName.trim().length < 3) {
      throw new BadRequestException(
        'Tên pháp nhân công ty (companyName) bắt buộc và tối thiểu 3 ký tự.',
      );
    }

    if (!dto.taxCode || !TAX_CODE_REGEX.test(dto.taxCode.trim())) {
      throw new BadRequestException(
        'Mã số thuế (taxCode) không hợp lệ (yêu cầu 10 chữ số hoặc 10-3 chữ số).',
      );
    }

    if (!dto.industry || !dto.industry.trim()) {
      throw new BadRequestException('Lĩnh vực hoạt động (industry) là bắt buộc.');
    }

    if (!dto.address || !dto.address.trim()) {
      throw new BadRequestException('Địa chỉ trụ sở (address) là bắt buộc.');
    }

    if (!dto.representativeName || !dto.representativeName.trim()) {
      throw new BadRequestException(
        'Họ tên người đại diện (representativeName) là bắt buộc.',
      );
    }

    if (!dto.contactEmail || !dto.contactEmail.includes('@')) {
      throw new BadRequestException('Email liên hệ (contactEmail) không hợp lệ.');
    }

    if (!dto.contactPhone || dto.contactPhone.trim().length < 8) {
      throw new BadRequestException(
        'Số điện thoại liên hệ (contactPhone) không hợp lệ.',
      );
    }
  }

  upsertMyProfile(
    user: JwtPayload,
    dto: UpsertEnterpriseProfileDto,
  ): EnterpriseProfileEntity {
    if (user.role !== UserRole.ENTERPRISE) {
      throw new ForbiddenException(
        'Chỉ tài khoản vai trò ENTERPRISE mới được phép tạo/cập nhật hồ sơ doanh nghiệp.',
      );
    }

    this.validateUpsertPayload(dto);

    const existingForOwner = this.repository.findByOwnerUserId(user.sub);
    const existingByTaxCode = this.repository.findByTaxCode(dto.taxCode);

    if (
      existingByTaxCode &&
      (!existingForOwner || existingByTaxCode.id !== existingForOwner.id)
    ) {
      throw new ConflictException(
        `Mã số thuế ${dto.taxCode.trim()} đã được đăng ký bởi một doanh nghiệp khác.`,
      );
    }

    if (!existingForOwner) {
      return this.repository.create(user.sub, dto);
    }

    const updated = this.repository.update(existingForOwner.id, dto);
    return updated!;
  }

  getMyProfile(user: JwtPayload): EnterpriseProfileEntity {
    const profile = this.repository.findByOwnerUserId(user.sub);
    if (!profile) {
      throw new NotFoundException('Doanh nghiệp chưa khởi tạo hồ sơ pháp nhân.');
    }
    return profile;
  }

  getProfileById(user: JwtPayload, profileId: string): EnterpriseProfileEntity {
    const profile = this.repository.findById(profileId);
    if (!profile) {
      throw new NotFoundException(`Không tìm thấy hồ sơ doanh nghiệp ${profileId}.`);
    }

    const isAdmin =
      user.role === UserRole.LAB_ADMIN || user.role === UserRole.SYSTEM_ADMIN;
    if (!isAdmin && profile.ownerUserId !== user.sub) {
      throw new ForbiddenException(
        'Vi phạm cách ly dữ liệu: Bạn không có quyền truy cập hồ sơ của doanh nghiệp khác.',
      );
    }

    return profile;
  }

  updateProfileById(
    user: JwtPayload,
    profileId: string,
    dto: UpsertEnterpriseProfileDto,
  ): EnterpriseProfileEntity {
    const profile = this.repository.findById(profileId);
    if (!profile) {
      throw new NotFoundException(`Không tìm thấy hồ sơ doanh nghiệp ${profileId}.`);
    }

    if (profile.ownerUserId !== user.sub) {
      throw new ForbiddenException(
        'Vi phạm quyền sở hữu: Bạn không được phép chỉnh sửa hồ sơ của doanh nghiệp khác.',
      );
    }

    this.validateUpsertPayload(dto);

    const existingByTaxCode = this.repository.findByTaxCode(dto.taxCode);
    if (existingByTaxCode && existingByTaxCode.id !== profile.id) {
      throw new ConflictException(
        `Mã số thuế ${dto.taxCode.trim()} đã được sử dụng bởi doanh nghiệp khác.`,
      );
    }

    return this.repository.update(profile.id, dto)!;
  }

  listAllProfiles(user: JwtPayload): EnterpriseProfileEntity[] {
    if (
      user.role !== UserRole.LAB_ADMIN &&
      user.role !== UserRole.SYSTEM_ADMIN
    ) {
      throw new ForbiddenException(
        'Chỉ LAB_ADMIN hoặc SYSTEM_ADMIN mới có quyền xem toàn bộ danh sách doanh nghiệp.',
      );
    }
    return this.repository.findAll();
  }

  verifyEnterpriseProfile(
    user: JwtPayload,
    profileId: string,
    dto: VerifyEnterpriseDto,
  ): EnterpriseProfileEntity {
    if (
      user.role !== UserRole.LAB_ADMIN &&
      user.role !== UserRole.SYSTEM_ADMIN
    ) {
      throw new ForbiddenException(
        'Chỉ LAB_ADMIN hoặc SYSTEM_ADMIN mới có quyền duyệt xác thực pháp nhân doanh nghiệp.',
      );
    }

    const profile = this.repository.findById(profileId);
    if (!profile) {
      throw new NotFoundException(`Không tìm thấy hồ sơ doanh nghiệp ${profileId}.`);
    }

    if (
      dto.status !== EnterpriseVerificationStatus.VERIFIED &&
      dto.status !== EnterpriseVerificationStatus.REJECTED
    ) {
      throw new BadRequestException(
        'Trạng thái duyệt chỉ chấp nhận VERIFIED hoặc REJECTED.',
      );
    }

    if (
      dto.status === EnterpriseVerificationStatus.REJECTED &&
      (!dto.note || dto.note.trim().length < 10)
    ) {
      throw new BadRequestException(
        'Khi từ chối xác thực doanh nghiệp (REJECTED), bắt buộc nhập lý do tối thiểu 10 ký tự.',
      );
    }

    return this.repository.updateVerification(
      profile.id,
      dto.status,
      user.sub,
      dto.note,
    )!;
  }
}