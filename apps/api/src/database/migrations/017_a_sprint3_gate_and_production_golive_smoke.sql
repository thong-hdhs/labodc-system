-- Migration 017_A: Post-Deployment Smoke Test Runs, Mobile Companion Contract Audit & Sprint 3 Gate D21 Sign-off (Owner: Sinh viên A - D21)

CREATE TABLE IF NOT EXISTS production_smoke_test_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  run_code VARCHAR(50) UNIQUE NOT NULL,
  release_tag VARCHAR(40) NOT NULL,
  environment_name VARCHAR(30) NOT NULL DEFAULT 'PRODUCTION',
  total_checks INT NOT NULL CHECK (total_checks > 0),
  passed_checks INT NOT NULL CHECK (passed_checks >= 0),
  pass_rate_percent INT NOT NULL CHECK (pass_rate_percent BETWEEN 0 AND 100),
  mobile_contract_verified BOOLEAN NOT NULL DEFAULT TRUE,
  ledger_invariant_verified BOOLEAN NOT NULL DEFAULT TRUE,
  check_results_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  executed_by UUID NOT NULL REFERENCES users(id),
  executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sprint3_gate_d21_signoffs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gate_code VARCHAR(60) UNIQUE NOT NULL,
  smoke_run_id VARCHAR(60) NOT NULL,
  handover_code VARCHAR(50) NOT NULL,
  mobile_companion_ready BOOLEAN NOT NULL DEFAULT TRUE,
  all_sprint3_deliverables_verified BOOLEAN NOT NULL DEFAULT TRUE,
  signoff_note TEXT NOT NULL,
  signed_by UUID NOT NULL REFERENCES users(id),
  signed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_production_smoke_runs_tag ON production_smoke_test_runs(release_tag);