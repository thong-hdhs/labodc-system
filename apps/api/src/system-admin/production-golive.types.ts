export interface MobileEndpointContractCheckDto {
  featureModule: 'AUTH_LOGIN' | 'PROJECT_DISCOVERY' | 'TALENT_PROFILE';
  mobileSourceFile: string;
  method: 'GET' | 'POST' | 'PUT';
  endpointPath: string;
  requiresBearerToken: boolean;
  expectedStatus: number;
  contractCompatible: boolean;
}

export interface MobileCompanionContractReportDto {
  contractVersion: 'D21_FLUTTER_MOBILE_COMPANION_V1';
  targetAppPath: 'apps/mobile';
  totalEndpointsChecked: number;
  compatibleEndpointsCount: number;
  allCompatible: boolean;
  endpoints: MobileEndpointContractCheckDto[];
  verifiedAt: string;
}

export interface SmokeCheckItemDto {
  subsystemCode:
    | 'AUTH_RBAC_GUARD'
    | 'ENTERPRISE_AND_PROJECT_PUBLISH'
    | 'PAYOS_ESCROW_AND_70_20_10_LEDGER'
    | 'TEAM_PAYOUT_AND_CLOSURE_DOSSIER'
    | 'MOBILE_COMPANION_API_CONTRACT'
    | 'FILES_AND_EVALUATION_REPORTS';
  description: string;
  status: 'PASS' | 'FAIL';
  latencyMs: number;
  verificationDetail: string;
}

export interface ExecuteSmokeTestRunDto {
  releaseTag: string;
  environmentName?: 'STAGING' | 'PRODUCTION';
}

export interface SmokeTestRunEntity {
  id: string;
  runCode: string;
  releaseTag: string;
  environmentName: 'STAGING' | 'PRODUCTION';
  totalChecks: number;
  passedChecks: number;
  passRatePercent: number;
  mobileContractVerified: boolean;
  ledgerInvariantVerified: boolean;
  checks: SmokeCheckItemDto[];
  executedBy: string;
  executedAt: string;
}

export interface CreateSprint3GateD21SignoffDto {
  smokeRunId: string;
  signoffNote: string;
}

export interface Sprint3GateD21SignoffEntity {
  id: string;
  gateCode: 'GATE_D21_SPRINT3_AND_PRODUCTION_GOLIVE';
  gateStatus: 'PASSED';
  smokeRunId: string;
  smokeRunCode: string;
  handoverCode: string;
  mobileCompanionReady: boolean;
  allSprint3DeliverablesVerified: boolean;
  financialLedgerInvariantHold: boolean;
  rtmCoveragePercent: number;
  signoffNote: string;
  signedBy: string;
  signedAt: string;
}