-- Migration 023_A: Final 27-Day Code Freeze Manifest & Pre-Deployment Handover Gate D27 (Owner: Sinh viên A - D27)

CREATE TABLE IF NOT EXISTS code_freeze_manifests_d27 (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  freeze_code VARCHAR(60) UNIQUE NOT NULL,
  gate_code VARCHAR(70) NOT NULL DEFAULT 'GATE_D27_FINAL_CODE_FREEZE_AND_TEST_DEPLOY_HANDOVER',
  release_candidate_tag VARCHAR(40) NOT NULL,
  total_coding_days INT NOT NULL DEFAULT 27 CHECK (total_coding_days = 27),
  student_a_migrations_count INT NOT NULL DEFAULT 22 CHECK (student_a_migrations_count = 22),
  student_b_migrations_count INT NOT NULL DEFAULT 9 CHECK (student_b_migrations_count = 9),
  ledger_invariant_verified BOOLEAN NOT NULL DEFAULT TRUE,
  escrow_held_balance_vnd BIGINT NOT NULL DEFAULT 0 CHECK (escrow_held_balance_vnd = 0),
  sla_compliance_percent INT NOT NULL CHECK (sla_compliance_percent = 100),
  code_freeze_locked BOOLEAN NOT NULL DEFAULT TRUE,
  next_phase_plan TEXT NOT NULL,
  locked_by UUID NOT NULL REFERENCES users(id),
  locked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_code_freeze_manifests_tag ON code_freeze_manifests_d27(release_candidate_tag);