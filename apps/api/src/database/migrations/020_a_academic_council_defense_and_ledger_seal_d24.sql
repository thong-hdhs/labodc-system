-- Migration 020_A: Permanent 70/20/10 Ledger Seal & Academic Council Defense Gate D24 Sign-off (Owner: Sinh viên A - D24)

CREATE TABLE IF NOT EXISTS permanent_ledger_seals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seal_code VARCHAR(60) UNIQUE NOT NULL,
  release_tag VARCHAR(40) NOT NULL,
  total_escrow_deposited BIGINT NOT NULL CHECK (total_escrow_deposited >= 0),
  total_disbursed_70_20_10 BIGINT NOT NULL CHECK (total_disbursed_70_20_10 >= 0),
  total_refunded BIGINT NOT NULL CHECK (total_refunded >= 0),
  escrow_held_balance BIGINT NOT NULL DEFAULT 0 CHECK (escrow_held_balance = 0),
  invariant_verified BOOLEAN NOT NULL DEFAULT TRUE,
  seal_note TEXT NOT NULL,
  sealed_by UUID NOT NULL REFERENCES users(id),
  sealed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS academic_council_defense_verdicts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  verdict_code VARCHAR(60) UNIQUE NOT NULL,
  gate_code VARCHAR(70) NOT NULL DEFAULT 'GATE_D24_ACADEMIC_COUNCIL_DEFENSE_AND_LEDGER_SEAL',
  ledger_seal_id VARCHAR(60) NOT NULL,
  student_a_score INT NOT NULL CHECK (student_a_score BETWEEN 0 AND 100),
  student_b_score INT NOT NULL CHECK (student_b_score BETWEEN 0 AND 100),
  verdict_status VARCHAR(40) NOT NULL DEFAULT 'APPROVED_WITH_DISTINCTION',
  council_evaluation_note TEXT NOT NULL,
  approved_by UUID NOT NULL REFERENCES users(id),
  approved_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_permanent_ledger_seals_tag ON permanent_ledger_seals(release_tag);