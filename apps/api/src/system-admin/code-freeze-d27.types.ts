export interface CodeFreezeInventorySummaryDto {
  inventoryCode: 'D27_FINAL_CODE_FREEZE_INVENTORY';
  totalCodingDaysCompleted: 27;
  studentAMigrationsCount: 22;
  studentBMigrationsCount: 9;
  totalDatabaseMigrations: 31;
  workspacesVerified: [
    '@labodc/shared-types',
    '@labodc/api',
    '@labodc/web',
    'apps/mobile (Flutter)',
  ];
  rtmCoveragePercent: 100;
  adrCompliantCount: 5;
  slaCompliancePercent: number;
  ledgerInvariantHold: boolean;
  escrowHeldBalanceVnd: number;
  codeFreezeLocked: boolean;
  latestManifest: CodeFreezeManifestD27Entity | null;
  generatedAt: string;
}

export interface LockCodeFreezeManifestD27Dto {
  releaseCandidateTag: string;
  nextPhasePlan: string;
}

export interface CodeFreezeManifestD27Entity {
  id: string;
  freezeCode: string;
  gateCode: 'GATE_D27_FINAL_CODE_FREEZE_AND_TEST_DEPLOY_HANDOVER';
  gateStatus: 'CODE_FROZEN_READY_FOR_TEST_AND_DEPLOY';
  releaseCandidateTag: string;
  totalCodingDays: 27;
  studentAMigrationsCount: 22;
  studentBMigrationsCount: 9;
  ledgerInvariantVerified: boolean;
  escrowHeldBalanceVnd: number;
  slaCompliancePercent: number;
  codeFreezeLocked: true;
  nextPhasePlan: string;
  lockedBy: string;
  lockedAt: string;
}