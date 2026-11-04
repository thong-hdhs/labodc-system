-- Migration 006_A: Project Escrow Milestones, Immutable Ledger & 70/20/10 Revenue Split (Owner: Sinh viên A - D12)

CREATE TYPE milestone_escrow_status AS ENUM (
  'PLANNED',
  'ESCROW_PAID',
  'SUBMITTED',
  'ACCEPTED',
  'DISBURSED'
);

CREATE TYPE ledger_entry_type AS ENUM (
  'ESCROW_DEPOSIT',
  'SPLIT_TEAM_70',
  'SPLIT_MENTOR_20',
  'SPLIT_LAB_10'
);

CREATE TYPE disbursement_recipient_role AS ENUM (
  'TEAM_LEADER',
  'MENTOR',
  'LAB_FUND'
);

CREATE TABLE IF NOT EXISTS project_milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  enterprise_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(180) NOT NULL,
  description TEXT NOT NULL,
  amount BIGINT NOT NULL CHECK (amount > 0),
  currency VARCHAR(10) NOT NULL DEFAULT 'VND',
  order_code BIGINT UNIQUE NOT NULL,
  status milestone_escrow_status NOT NULL DEFAULT 'PLANNED',
  deliverable_url TEXT NULL,
  deliverable_note TEXT NULL,
  submitted_by UUID NULL REFERENCES users(id),
  submitted_at TIMESTAMPTZ NULL,
  accepted_by UUID NULL REFERENCES users(id),
  accepted_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ledger_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE RESTRICT,
  milestone_id UUID NOT NULL REFERENCES project_milestones(id) ON DELETE RESTRICT,
  order_code BIGINT NOT NULL,
  entry_type ledger_entry_type NOT NULL,
  direction VARCHAR(10) NOT NULL CHECK (direction IN ('CREDIT', 'DEBIT')),
  amount BIGINT NOT NULL CHECK (amount >= 0),
  currency VARCHAR(10) NOT NULL DEFAULT 'VND',
  beneficiary_role VARCHAR(30) NOT NULL,
  description TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS disbursements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE RESTRICT,
  milestone_id UUID NOT NULL REFERENCES project_milestones(id) ON DELETE RESTRICT,
  recipient_role disbursement_recipient_role NOT NULL,
  percentage SMALLINT NOT NULL CHECK (percentage IN (70, 20, 10)),
  amount BIGINT NOT NULL CHECK (amount >= 0),
  remainder_absorbed BIGINT NOT NULL DEFAULT 0,
  currency VARCHAR(10) NOT NULL DEFAULT 'VND',
  status VARCHAR(20) NOT NULL DEFAULT 'COMPLETED',
  disbursed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_project_milestones_project_id ON project_milestones(project_id);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_project_id ON ledger_entries(project_id);
CREATE INDEX IF NOT EXISTS idx_disbursements_milestone_id ON disbursements(milestone_id);