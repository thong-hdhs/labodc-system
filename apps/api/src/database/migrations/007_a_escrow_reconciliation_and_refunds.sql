-- Migration 007_A: Escrow Webhook Reconciliation, Deliverable Revision & Refund Ledger (Owner: Sinh viên A - D13)

ALTER TYPE milestone_escrow_status ADD VALUE IF NOT EXISTS 'REFUNDED';
ALTER TYPE ledger_entry_type ADD VALUE IF NOT EXISTS 'ESCROW_REFUND';

ALTER TABLE project_milestones
  ADD COLUMN IF NOT EXISTS revision_count INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_revision_note TEXT NULL,
  ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS refund_reason TEXT NULL;

CREATE TABLE IF NOT EXISTS milestone_review_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  milestone_id UUID NOT NULL REFERENCES project_milestones(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  reviewer_user_id UUID NOT NULL REFERENCES users(id),
  reviewer_role VARCHAR(30) NOT NULL,
  decision VARCHAR(30) NOT NULL CHECK (decision IN ('REVISION_REQUESTED', 'ACCEPTED', 'REFUNDED')),
  note TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS escrow_refunds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE RESTRICT,
  milestone_id UUID UNIQUE NOT NULL REFERENCES project_milestones(id) ON DELETE RESTRICT,
  enterprise_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  amount BIGINT NOT NULL CHECK (amount > 0),
  currency VARCHAR(10) NOT NULL DEFAULT 'VND',
  reason TEXT NOT NULL,
  processed_by UUID NOT NULL REFERENCES users(id),
  refunded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_milestone_review_logs_milestone_id ON milestone_review_logs(milestone_id);
CREATE INDEX IF NOT EXISTS idx_escrow_refunds_project_id ON escrow_refunds(project_id);