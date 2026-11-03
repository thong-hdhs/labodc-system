import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtPayload, UserRole } from '@labodc/shared-types';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, Roles, RolesGuard } from '../common/guards/roles.guard';
import { SystemAdminService } from './system-admin.service';

@Controller('api/v1')
export class SystemAdminController {
  constructor(private readonly systemAdminService: SystemAdminService) {}

  /**
   * Public Health Check Endpoint (ADR-05 & REQ-NFR-01: 99.0% Uptime Monitoring)
   */
  @Get('health')
  getHealthCheck() {
    return this.systemAdminService.getHealthStatus();
  }

  /**
   * Tổng hợp chỉ số nghiệm thu Cổng MVP Gate D10 (Sprint 1: D5–D10)
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.LAB_ADMIN)
  @Get('system-admin/mvp-gate-summary')
  getMvpGateSummary(@CurrentUser() user: JwtPayload) {
    return this.systemAdminService.getMvpGateSummary(user.sub);
  }

  /**
   * Tra cứu nhật ký bảo mật & xác thực hệ thống (Chỉ dành cho SYSTEM_ADMIN)
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SYSTEM_ADMIN)
  @Get('system-admin/audit-logs')
  getAuditLogs() {
    return this.systemAdminService.getSystemAuditLogs();
  }
}