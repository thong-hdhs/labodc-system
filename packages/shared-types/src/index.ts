export enum UserRole {
  SYSTEM_ADMIN = 'SYSTEM_ADMIN',
  LAB_ADMIN = 'LAB_ADMIN',
  ENTERPRISE = 'ENTERPRISE',
  MENTOR = 'MENTOR',
  TALENT_LEADER = 'TALENT_LEADER',
  TALENT = 'TALENT',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  LOCKED = 'LOCKED',
  PENDING = 'PENDING',
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  status: UserStatus;
}

export interface AuthUserDto {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  status: UserStatus;
}

export interface AuthTokensResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUserDto;
}