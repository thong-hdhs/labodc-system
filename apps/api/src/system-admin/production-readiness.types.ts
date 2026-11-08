export interface SystemProbesStatusDto {
  liveness: 'ALIVE';
  readiness: 'READY';
  uptimeTargetPercent: 99.0;
  currentUptimeSeconds: number;
  paymentGatewayMode: 'SANDBOX' | 'PRODUCTION';
  databaseMigrationsAligned: true;
  checkedAt: string;
}

export interface RecordSlaBenchmarkDto {
  endpointCategory: 'STANDARD_API' | 'FINANCIAL_LEDGER_API';
  endpointPath: string;
  observedP95Ms: number;
}

export interface SlaBenchmarkItemDto {
  id: string;
  endpointCategory: 'STANDARD_API' | 'FINANCIAL_LEDGER_API';
  endpointPath: string;
  observedP95Ms: number;
  thresholdP95Ms: 500 | 1000;
  withinSla: boolean;
  measuredBy: string;
  measuredAt: string;
}

export interface SecurityRbacMatrixAuditDto {
  verifiedRolesCount: 6;
  roles: [
    'SYSTEM_ADMIN',
    'LAB_ADMIN',
    'ENTERPRISE',
    'MENTOR',
    'TALENT_LEADER',
    'TALENT',
  ];
  guardsEnforced: {
    jwtBearerAuthentication: true;
    serverSideRolesGuard: true;
    enterpriseCrossTenantIsolation: true;
    payosWebhookHmacSha256: true;
    idempotentWebhookReplayProtection: true;
    immutable702010SplitGuard: true;
  };
  auditStatus: 'VERIFIED_PASS';
}

export interface CreateProductionReadinessSignoffDto {
  releaseVersion: string;
  note: string;
}

export interface ProductionReadinessSignoffDto {
  id: string;
  signoffCode: string;
  releaseVersion: string;
  allNfrGatesPassed: boolean;
  ledgerInvariantVerified: boolean;
  rbacMatrixVerified: boolean;
  slaComplianceRatePercent: number;
  note: string;
  signedBy: string;
  signedAt: string;
}