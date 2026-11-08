-- Migration 016_A: Release Handover Packages & Requirements Traceability Manifest (Owner: Sinh viên A - D20)

CREATE TABLE IF NOT EXISTS release_handover_packages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  handover_code VARCHAR(50) UNIQUE NOT NULL,
  release_tag VARCHAR(40) NOT NULL,
  environment_target VARCHAR(30) NOT NULL DEFAULT 'PRODUCTION_RC',
  total_requirements_verified INT NOT NULL CHECK (total_requirements_verified > 0),
  total_adrs_verified INT NOT NULL CHECK (total_adrs_verified > 0),
  total_escrow_deposited BIGINT NOT NULL CHECK (total_escrow_deposited >= 0),
  total_disbursed_70_20_10 BIGINT NOT NULL CHECK (total_disbursed_70_20_10 >= 0),
  total_refunded BIGINT NOT NULL CHECK (total_refunded >= 0),
  ledger_invariant_hold BOOLEAN NOT NULL DEFAULT TRUE,
  sla_compliance_percent INT NOT NULL CHECK (sla_compliance_percent BETWEEN 0 AND 100),
  runbook_checklist_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  handover_note TEXT NOT NULL,
  prepared_by UUID NOT NULL REFERENCES users(id),
  prepared_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_release_handover_packages_tag ON release_handover_packages(release_tag);