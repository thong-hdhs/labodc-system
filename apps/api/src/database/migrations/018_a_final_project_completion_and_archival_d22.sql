-- Migration 018_A: Final 22-Day Project Completion Certificate & Operational Archival Dossier (Owner: Sinh viên A - D22)

CREATE TABLE IF NOT EXISTS final_project_completion_certificates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  certificate_code VARCHAR(60) UNIQUE NOT NULL,
  gate_code VARCHAR(60) NOT NULL DEFAULT 'GATE_D22_FINAL_PROJECT_COMPLETION_AND_ARCHIVAL',
  release_version VARCHAR(40) NOT NULL,
  total_days_completed INT NOT NULL DEFAULT 22 CHECK (total_days_completed = 22),
  student_a_migrations_count INT NOT NULL CHECK (student_a_migrations_count > 0),
  student_b_migrations_count INT NOT NULL CHECK (student_b_migrations_count > 0),
  rtm_coverage_percent INT NOT NULL CHECK (rtm_coverage_percent BETWEEN 0 AND 100),
  sla_compliance_percent INT NOT NULL CHECK (sla_compliance_percent BETWEEN 0 AND 100),
  mobile_contract_verified BOOLEAN NOT NULL DEFAULT TRUE,
  ledger_invariant_verified BOOLEAN NOT NULL DEFAULT TRUE,
  total_escrow_deposited BIGINT NOT NULL CHECK (total_escrow_deposited >= 0),
  total_disbursed_70_20_10 BIGINT NOT NULL CHECK (total_disbursed_70_20_10 >= 0),
  total_refunded BIGINT NOT NULL CHECK (total_refunded >= 0),
  operational_runbook_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  archival_note TEXT NOT NULL,
  issued_by UUID NOT NULL REFERENCES users(id),
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_final_completion_cert_version ON final_project_completion_certificates(release_version);