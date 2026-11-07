-- Migration 013_A: Team 70% Member Contribution Split, Payout Orders & Enterprise Receipts (Owner: Sinh viên A - D17)

CREATE TYPE payout_execution_status AS ENUM (
  'PENDING_PAYOUT',
  'PAID_OUT'
);

CREATE TABLE IF NOT EXISTS team_member_payout_allocations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE RESTRICT,
  milestone_id UUID NOT NULL REFERENCES project_milestones(id) ON DELETE RESTRICT,
  member_user_id VARCHAR(120) NOT NULL,
  member_name VARCHAR(150) NOT NULL,
  member_role VARCHAR(30) NOT NULL CHECK (member_role IN ('TALENT_LEADER', 'TALENT')),
  contribution_percentage INT NOT NULL CHECK (contribution_percentage BETWEEN 0 AND 100),
  allocated_amount BIGINT NOT NULL CHECK (allocated_amount >= 0),
  remainder_absorbed BIGINT NOT NULL DEFAULT 0,
  currency VARCHAR(10) NOT NULL DEFAULT 'VND',
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS disbursement_payout_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE RESTRICT,
  milestone_id UUID NOT NULL REFERENCES project_milestones(id) ON DELETE RESTRICT,
  recipient_role VARCHAR(30) NOT NULL CHECK (recipient_role IN ('TEAM_LEADER', 'MENTOR', 'LAB_FUND')),
  amount BIGINT NOT NULL CHECK (amount >= 0),
  currency VARCHAR(10) NOT NULL DEFAULT 'VND',
  status payout_execution_status NOT NULL DEFAULT 'PAID_OUT',
  bank_transfer_ref VARCHAR(120) NOT NULL,
  note TEXT NULL,
  executed_by UUID NOT NULL REFERENCES users(id),
  executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS enterprise_financial_receipts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  receipt_number VARCHAR(50) UNIQUE NOT NULL,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE RESTRICT,
  milestone_id UUID UNIQUE NOT NULL REFERENCES project_milestones(id) ON DELETE RESTRICT,
  enterprise_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  company_name VARCHAR(255) NOT NULL,
  gross_amount BIGINT NOT NULL CHECK (gross_amount > 0),
  team_70_amount BIGINT NOT NULL CHECK (team_70_amount >= 0),
  mentor_20_amount BIGINT NOT NULL CHECK (mentor_20_amount >= 0),
  lab_10_amount BIGINT NOT NULL CHECK (lab_10_amount >= 0),
  issued_by UUID NOT NULL REFERENCES users(id),
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_team_member_payout_milestone ON team_member_payout_allocations(milestone_id);
CREATE INDEX IF NOT EXISTS idx_disbursement_payout_milestone ON disbursement_payout_orders(milestone_id);