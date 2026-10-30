import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  OnModuleInit,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import {
  AuthTokensResponse,
  JwtPayload,
  UserRole,
  UserStatus,
} from '@labodc/shared-types';

export interface UserEntity {
  id: string;
  email: string;
  passwordHash: string;
  fullName: string;
  role: UserRole;
  status: UserStatus;
}

export interface AuditLogEntry {
  id: string;
  actorId: string;
  actorRole: UserRole;
  action: string;
  entityType: string;
  ipAddress?: string;
  createdAt: Date;
}

@Injectable()
export class AuthService implements OnModuleInit {
  private users: Map<string, UserEntity> = new Map();
  private revokedUserIds: Set<string> = new Set();
  private auditLogs: AuditLogEntry[] = [];

  constructor(private readonly jwtService: JwtService) {}

  async onModuleInit(): Promise<void> {
    await this.seedDefaultUsers();
  }

  async seedDefaultUsers(): Promise<void> {
    if (this.users.size > 0) return;

    const defaultPass =
      process.env.INITIAL_SYSADMIN_PASSWORD || 'ChangeMe_LabOdc@2026!';
    const passwordHash = await bcrypt.hash(defaultPass, 10);

    const accounts: Array<Omit<UserEntity, 'passwordHash'>> = [
      {
        id: '00000000-0000-4000-8000-000000000001',
        email: 'sysadmin@labodc.uth.edu.vn',
        fullName: 'UTH System Administrator',
        role: UserRole.SYSTEM_ADMIN,
        status: UserStatus.ACTIVE,
      },
      {
        id: '00000000-0000-4000-8000-000000000002',
        email: 'labadmin@labodc.uth.edu.vn',
        fullName: 'Lab ODC Administrator',
        role: UserRole.LAB_ADMIN,
        status: UserStatus.ACTIVE,
      },
      {
        id: '00000000-0000-4000-8000-000000000003',
        email: 'enterprise@company.vn',
        fullName: 'Doanh nghiệp Đối tác UTH (Công ty A)',
        role: UserRole.ENTERPRISE,
        status: UserStatus.ACTIVE,
      },
      {
        id: '00000000-0000-4000-8000-000000000004',
        email: 'mentor@labodc.uth.edu.vn',
        fullName: 'TS. Nguyễn Văn Mentor',
        role: UserRole.MENTOR,
        status: UserStatus.ACTIVE,
      },
      {
        id: '00000000-0000-4000-8000-000000000005',
        email: 'leader@student.uth.edu.vn',
        fullName: 'Trần Văn Talent Leader',
        role: UserRole.TALENT_LEADER,
        status: UserStatus.ACTIVE,
      },
      {
        id: '00000000-0000-4000-8000-000000000006',
        email: 'talent@student.uth.edu.vn',
        fullName: 'Lê Thị Talent',
        role: UserRole.TALENT,
        status: UserStatus.ACTIVE,
      },
      {
        id: '00000000-0000-4000-8000-000000000007',
        email: 'locked@student.uth.edu.vn',
        fullName: 'Tài khoản Bị Khóa',
        role: UserRole.TALENT,
        status: UserStatus.LOCKED,
      },
      {
        id: '00000000-0000-4000-8000-000000000008',
        email: 'enterprise2@company.vn',
        fullName: 'Doanh nghiệp Đối tác B',
        role: UserRole.ENTERPRISE,
        status: UserStatus.ACTIVE,
      },
    ];

    for (const acc of accounts) {
      this.users.set(acc.email.toLowerCase(), {
        ...acc,
        passwordHash,
      });
    }
  }

  async login(
    email: string,
    plainPass: string,
    ipAddress?: string,
  ): Promise<AuthTokensResponse> {
    await this.seedDefaultUsers();
    const normalizedEmail = (email || '').trim().toLowerCase();
    const user = this.users.get(normalizedEmail);

    if (!user || !(await bcrypt.compare(plainPass || '', user.passwordHash))) {
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác.');
    }

    if (user.status === UserStatus.LOCKED) {
      throw new ForbiddenException('Tài khoản đã bị khóa.');
    }

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_ACCESS_SECRET || 'labodc_access_secret_d5',
      expiresIn: '15m',
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_REFRESH_SECRET || 'labodc_refresh_secret_d5',
      expiresIn: '7d',
    });

    this.revokedUserIds.delete(user.id);
    this.auditLogs.push({
      id: `audit-${Date.now()}`,
      actorId: user.id,
      actorRole: user.role,
      action: 'USER_LOGIN',
      entityType: 'USER',
      ipAddress,
      createdAt: new Date(),
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        status: user.status,
      },
    };
  }

  async logout(userId: string): Promise<{ message: string }> {
    this.revokedUserIds.add(userId);
    return { message: 'Đăng xuất thành công.' };
  }

  getAuditLogs(): AuditLogEntry[] {
    return this.auditLogs;
  }
}