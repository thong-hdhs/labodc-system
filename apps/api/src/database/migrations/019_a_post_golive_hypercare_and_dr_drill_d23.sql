-- Migration 019_A: Post-Go-Live Hypercare Monitoring, Disaster Recovery (DR) Ledger Drills & Final Defense Gate D23 (Owner: Sinh viên A - D23)

CREATE TABLE IF NOT EXISTS hypercare_dr_drills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  drill_code VARCHAR(60) UNIQUE NOT NULL,
  scenario_name VARCHAR(120) NOT NULL,
  measured_rto_seconds INT NOT NULL CHECK (measured_rto_seconds >= 0),
  target_rto_seconds INT NOT NULL DEFAULT 300 CHECK (target_rto_seconds > 0),
  measured_rpo_transactionsLost INT NOT NULL DEFAULT 0 CHECK (measured_rpo_transactionsLost = 0),
  ledger_snapshot_verified BOOLEAN NOT NULL DEFAULT TRUE,
  within_dr_sla BOOLEAN NOT NULL DEFAULT TRUE,
  drill_note TEXT NOT NULL,
  executed_by UUID NOT NULL REFERENCES users(id),
  executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS project_defense_gate_d23_signoffs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  defense_code VARCHAR(60) UNIQUE NOT NULL,
  gate_code VARCHAR(60) NOT NULL DEFAULT 'GATE_D23_POST_GOLIVE_HYPERCARE_AND_DEFENSE',
  dr_drill_id VARCHAR(60) NOT NULL,
  release_version VARCHAR(40) NOT NULL,
  hypercare_healthy BOOLEAN NOT NULL DEFAULT TRUE,
  ledger_invariant_verified BOOLEAN NOT NULL DEFAULT TRUE,
  sla_compliance_percent INT NOT NULL CHECK (sla_compliance_percent BETWEEN 0 AND 100),
  defense_note TEXT NOT NULL,
  signed_by UUID NOT NULL REFERENCES users(id),
  signed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hypercare_dr_drills_code ON hypercare_dr_drills(drill_code);