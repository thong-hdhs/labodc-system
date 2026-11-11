export interface MobilePhase2EndpointContractDto {
  contractCode: string;
  mobileFeatureModule:
    | 'APPLICATIONS'
    | 'WORK_TASKS'
    | 'PROGRESS_REPORTS'
    | 'PRIVATE_FILES';
  mobileDartRepository: string;
  method: 'GET' | 'POST' | 'PATCH';
  endpointPath: string;
  requiredRoles: string[];
  slaTargetMs: number;
  compatible: true;
}

export interface MobilePhase2ContractMatrixDto {
  matrixCode: 'D25_MOBILE_PHASE2_CONTRACT_MATRIX';
  totalEndpoints: number;
  compatibleEndpoints: number;
  allCompatible: true;
  contracts: MobilePhase2EndpointContractDto[];
  checkedAt: string;
}

export interface CreateCrossPlatformSyncCheckpointDto {
  mobileReleaseVersion: string;
  syncNote: string;
}

export interface CrossPlatformSyncCheckpointEntity {
  id: string;
  checkpointCode: string;
  gateCode: 'GATE_D25_MOBILE_PHASE2_WORK_AND_SYNC';
  gateStatus: 'PASSED';
  mobileReleaseVersion: string;
  verifiedEndpointsCount: number;
  applicationsSyncVerified: boolean;
  workTasksSyncVerified: boolean;
  progressReportsSyncVerified: boolean;
  privateFilesSyncVerified: boolean;
  ledgerInvariantVerified: boolean;
  slaCompliancePercent: number;
  syncNote: string;
  verifiedBy: string;
  verifiedAt: string;
}