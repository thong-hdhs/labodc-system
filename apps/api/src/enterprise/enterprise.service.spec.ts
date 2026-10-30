import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtPayload, UserRole, UserStatus } from '@labodc/shared-types';
import { EnterpriseProfileRepository } from './enterprise-profile.repository';
import { EnterpriseService } from './enterprise.service';
import { EnterpriseVerificationStatus } from './enterprise-profile.types';

describe('EnterpriseService Unit Tests (D6 - REQ-ENT-01)', () => {
  let service: EnterpriseService;
  let repository: EnterpriseProfileRepository;

  const enterpriseUserA: JwtPayload = {
    sub: '00000000-0000-4000-8000-000000000003',
    email: 'enterprise@company.vn',
    role: UserRole.ENTERPRISE,
    status: UserStatus.ACTIVE,
  };

  const enterpriseUserB: JwtPayload = {
    sub: '00000000-0000-4000-8000-000000000008',
    email: 'enterprise2@company.vn',
    role: UserRole.ENTERPRISE,
    status: UserStatus.ACTIVE,
  };

  const labAdminUser: JwtPayload = {
    sub: '00000000-0000-4000-8000-000000000002',
    email: 'labadmin@labodc.uth.edu.vn',
    role: UserRole.LAB_ADMIN,
    status: UserStatus.ACTIVE,
  };

  const validPayload = {
    companyName: 'Công ty Cổ phần Phần mềm FPT',
    taxCode: '0101248141',
    industry: 'Phát triển phần mềm & Chuyển đổi số',
    address: 'Khu Công nghệ cao Hòa Lạc, Hà Nội',
    website: 'https://fptsoftware.com',
    description: 'Đối tác chiến lược đào tạo và nghiên cứu với UTH LabOdc',
    representativeName: 'Nguyễn Văn Đại Diện',
    contactEmail: 'contact@fpt.com',
    contactPhone: '0901234567',
  };

  beforeEach(() => {
    repository = new EnterpriseProfileRepository();
    service = new EnterpriseService(repository);
  });

  it('Tạo mới hồ sơ doanh nghiệp hợp lệ ở trạng thái PENDING_VERIFICATION', () => {
    const profile = service.upsertMyProfile(enterpriseUserA, validPayload);
    expect(profile.id).toBeDefined();
    expect(profile.ownerUserId).toBe(enterpriseUserA.sub);
    expect(profile.taxCode).toBe('0101248141');
    expect(profile.verificationStatus).toBe(
      EnterpriseVerificationStatus.PENDING_VERIFICATION,
    );
  });

  it('Chặn trùng mã số thuế (409 Conflict) khi Doanh nghiệp B dùng mã số thuế của Doanh nghiệp A', () => {
    service.upsertMyProfile(enterpriseUserA, validPayload);
    expect(() =>
      service.upsertMyProfile(enterpriseUserB, {
        ...validPayload,
        companyName: 'Công ty TNHH Công nghệ B',
      }),
    ).toThrow(ConflictException);
  });

  it('Chặn chỉnh sửa chéo (403 Forbidden) khi Doanh nghiệp B cố sửa hồ sơ của Doanh nghiệp A', () => {
    const profileA = service.upsertMyProfile(enterpriseUserA, validPayload);
    expect(() =>
      service.updateProfileById(enterpriseUserB, profileA.id, {
        ...validPayload,
        companyName: 'Giả mạo tên công ty A',
      }),
    ).toThrow(ForbiddenException);
  });

  it('Lab Admin duyệt hồ sơ sang VERIFIED và bắt buộc nhập lý do khi REJECTED', () => {
    const profileA = service.upsertMyProfile(enterpriseUserA, validPayload);

    expect(() =>
      service.verifyEnterpriseProfile(labAdminUser, profileA.id, {
        status: EnterpriseVerificationStatus.REJECTED,
        note: 'Ngắn',
      }),
    ).toThrow(BadRequestException);

    const verified = service.verifyEnterpriseProfile(labAdminUser, profileA.id, {
      status: EnterpriseVerificationStatus.VERIFIED,
      note: 'Đã đối chiếu mã số thuế hợp lệ trên hệ thống quốc gia.',
    });

    expect(verified.verificationStatus).toBe(
      EnterpriseVerificationStatus.VERIFIED,
    );
    expect(verified.verifiedBy).toBe(labAdminUser.sub);
  });
});