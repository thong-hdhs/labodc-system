import { Injectable } from '@nestjs/common';
import { ProjectStatus, UserRole, UserStatus } from '@labodc/shared-types';
import { AuthService, AuditLogEntry } from '../auth/auth.service';
import { EnterpriseProfileRepository } from '../enterprise/enterprise-profile.repository';
import { EnterpriseVerificationStatus } from '../enterprise/enterprise-profile.types';
import { ProjectProposalRepository } from '../projects/project-proposal.repository';
import { PaymentsSpikeService } from '../payments/payments-spike.service';
import { PaymentOrderStatus } from '../payments/payos-spike.types';

export interface SystemHealthStatusDto {
  status: 'UP';
  service: 'labodc-api';
  sprintGate: 'D10_MVP_GATE_1';
  paymentMode: 'SANDBOX' | 'PRODUCTION';
  uptimeSeconds: number;
  timestamp: string;
}

export interface MvpGateSummaryDto {
  gateCode: 'GATE_D10_SPRINT_1';
  health: SystemHealthStatusDto;
  enterprises: {
    total: number;
    verified: number;
    pendingVerification: number;
    rejected: number;
  };
  projects: {
    total: number;
    draft: number;
    submitted: number;
    changesRequested: number;
    approved: number;
    published: number;
    unpublished: number;
    recruitmentClosed: number;
    rejected: number;
  };
  paymentsSandbox: {
    totalOrders: number;
    paidOrders: number;
    pendingOrders: number;
    totalPaidAmountVnd: number;
  };
  securityAudit: {
    totalAuthAuditEvents: number;
  };
}

@Injectable()
export class SystemAdminService {
  constructor(
    private readonly authService: AuthService,
    private readonly enterpriseRepository: EnterpriseProfileRepository,
    private readonly projectRepository: ProjectProposalRepository,
    private readonly paymentsSpikeService: PaymentsSpikeService,
  ) {}

  getHealthStatus(): SystemHealthStatusDto {
    return {
      status: 'UP',
      service: 'labodc-api',
      sprintGate: 'D10_MVP_GATE_1',
      paymentMode: this.paymentsSpikeService.getPaymentMode(),
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    };
  }

  getMvpGateSummary(actorUserId: string): MvpGateSummaryDto {
    const enterprises = this.enterpriseRepository.findAll();
    const projects = this.projectRepository.findAll();
    const orders = this.paymentsSpikeService.listOrdersForProject({
      sub: actorUserId,
      email: 'sysadmin@labodc.uth.edu.vn',
      role: UserRole.SYSTEM_ADMIN,
      status: UserStatus.ACTIVE,
    });
    const auditLogs = this.authService.getAuditLogs();

    const paidOrders = orders.filter(
      (o) => o.status === PaymentOrderStatus.PAID,
    );
    const pendingOrders = orders.filter(
      (o) => o.status === PaymentOrderStatus.PENDING_PAYMENT,
    );

    return {
      gateCode: 'GATE_D10_SPRINT_1',
      health: this.getHealthStatus(),
      enterprises: {
        total: enterprises.length,
        verified: enterprises.filter(
          (e) => e.verificationStatus === EnterpriseVerificationStatus.VERIFIED,
        ).length,
        pendingVerification: enterprises.filter(
          (e) =>
            e.verificationStatus ===
            EnterpriseVerificationStatus.PENDING_VERIFICATION,
        ).length,
        rejected: enterprises.filter(
          (e) => e.verificationStatus === EnterpriseVerificationStatus.REJECTED,
        ).length,
      },
      projects: {
        total: projects.length,
        draft: projects.filter((p) => p.status === ProjectStatus.DRAFT).length,
        submitted: projects.filter((p) => p.status === ProjectStatus.SUBMITTED)
          .length,
        changesRequested: projects.filter(
          (p) => p.status === ProjectStatus.CHANGES_REQUESTED,
        ).length,
        approved: projects.filter((p) => p.status === ProjectStatus.APPROVED)
          .length,
        published: projects.filter((p) => p.status === ProjectStatus.PUBLISHED)
          .length,
        unpublished: projects.filter(
          (p) => p.status === ProjectStatus.UNPUBLISHED,
        ).length,
        recruitmentClosed: projects.filter(
          (p) => p.status === ProjectStatus.RECRUITMENT_CLOSED,
        ).length,
        rejected: projects.filter((p) => p.status === ProjectStatus.REJECTED)
          .length,
      },
      paymentsSandbox: {
        totalOrders: orders.length,
        paidOrders: paidOrders.length,
        pendingOrders: pendingOrders.length,
        totalPaidAmountVnd: paidOrders.reduce((sum, o) => sum + o.amount, 0),
      },
      securityAudit: {
        totalAuthAuditEvents: auditLogs.length,
      },
    };
  }

  getSystemAuditLogs(): AuditLogEntry[] {
    return this.authService.getAuditLogs();
  }
}