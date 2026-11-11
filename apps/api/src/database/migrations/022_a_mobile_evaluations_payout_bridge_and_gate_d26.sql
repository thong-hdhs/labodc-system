-- Migration 022_A: Mobile Evaluations to 70% Team Payout Bridge, Private File Security Audit & Gate D26 Sign-off (Owner: Sinh viên A - D26)

CREATE TABLE IF NOT EXISTS evaluation_payout_reconciliations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reconciliation_code VARCHAR(60) UNIQUE NOT NULL,
  project_code VARCHAR(50) NOT NULL,
  milestone_amount_vnd BIGINT NOT NULL CHECK (milestone_amount_vnd > 0),
  team_pool_70_vnd BIGINT NOT NULL CHECK (team_pool_70_vnd > 0),
  total_contribution_percent INT NOT NULL DEFAULT 100 CHECK (total_contribution_percent = 100),
  allocated_members_sum_vnd BIGINT NOT NULL CHECK (allocated_members_sum_vnd = team_pool_70_vnd),
  mobile_evaluation_synced BOOLEAN NOT NULL DEFAULT TRUE,
  private_file_acl_verified BOOLEAN NOT NULL DEFAULT TRUE,
  reconciled_by UUID NOT NULL REFERENCES users(id),
  reconciled_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS gate_d26_mobile_full_parity_signoffs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  signoff_code VARCHAR(60) UNIQUE NOT NULL,
  gate_code VARCHAR(70) NOT NULL DEFAULT 'GATE_D26_MOBILE_FULL_PARITY_AND_EVAL_BRIDGE',
  reconciliation_id VARCHAR(60) NOT NULL,
  mobile_feature_parity_percent INT NOT NULL DEFAULT 100 CHECK (mobile_feature_parity_percent = 100),
  ledger_invariant_verified BOOLEAN NOT NULL DEFAULT TRUE,
  signoff_note TEXT NOT NULL,
  signed_by UUID NOT NULL REFERENCES users(id),
  signed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_eval_payout_recon_project ON evaluation_payout_reconciliations(project_code);