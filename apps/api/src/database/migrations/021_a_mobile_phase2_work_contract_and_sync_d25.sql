-- Migration 021_A: Mobile Companion Phase 2 API Contract Verification & Cross-Platform Sync Checkpoints (Owner: Sinh viên A - D25)

CREATE TABLE IF NOT EXISTS cross_platform_sync_checkpoints (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  checkpoint_code VARCHAR(60) UNIQUE NOT NULL,
  gate_code VARCHAR(60) NOT NULL DEFAULT 'GATE_D25_MOBILE_PHASE2_WORK_AND_SYNC',
  mobile_release_version VARCHAR(40) NOT NULL,
  verified_endpoints_count INT NOT NULL CHECK (verified_endpoints_count > 0),
  applications_sync_verified BOOLEAN NOT NULL DEFAULT TRUE,
  work_tasks_sync_verified BOOLEAN NOT NULL DEFAULT TRUE,
  progress_reports_sync_verified BOOLEAN NOT NULL DEFAULT TRUE,
  private_files_sync_verified BOOLEAN NOT NULL DEFAULT TRUE,
  ledger_invariant_verified BOOLEAN NOT NULL DEFAULT TRUE,
  sla_compliance_percent INT NOT NULL CHECK (sla_compliance_percent BETWEEN 0 AND 100),
  sync_note TEXT NOT NULL,
  verified_by UUID NOT NULL REFERENCES users(id),
  verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cross_platform_sync_version ON cross_platform_sync_checkpoints(mobile_release_version);