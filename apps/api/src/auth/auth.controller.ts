import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard, Roles, CurrentUser } from '../common/guards/roles.guard';
import { JwtPayload, UserRole } from '@labodc/shared-types';

export class LoginDto {
  email!: string;
  password!: string;
}

@Controller('api/v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto, @Req() req: { ip?: string }) {
    return this.authService.login(dto.email, dto.password, req?.ip);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('me')
  async getProfile(@CurrentUser() user: JwtPayload) {
    return { user };
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@CurrentUser() user: JwtPayload) {
    return this.authService.logout(user.sub);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SYSTEM_ADMIN)
  @Get('admin-verify')
  async verifySysAdminAccess(@CurrentUser() user: JwtPayload) {
    return {
      status: 'OK',
      verifiedRole: user.role,
      auditLogCount: this.authService.getAuditLogs().length,
    };
  }
}