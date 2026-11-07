-- Migration 014_A: Financial Dispute Resolution, Project Closure Dossiers & Lab 10% Fund Transparency (Owner: Sinh viên A - D18)

CREATE TYPE financial_dispute_status AS ENUM (
  'OPEN',
  'RESOLVED_RELEASE_TO_TEAM',
  'RESOLVED_REFUND_TO_ENTERPRISE',
  'REJECTED'
);

CREATE TABLE IF NOT EXISTS financial_dispute_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(40) UNIQUE NOT NULL,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE RESTRICT,
  milestone_id UUID NOT NULL REFERENCES project_milestones(id) ON DELETE RESTRICT,
  raised_by_user_id UUID NOT NULL REFERENCES users(id),
  raised_by_role VARCHAR(30) NOT NULL,
  reason TEXT NOT NULL,
  evidence_url TEXT NULL,
  status financial_dispute_status NOT NULL DEFAULT 'OPEN',
  resolution_note TEXT NULL,
  resolved_by UUID NULL REFERENCES users(id),
  resolved_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS project_closure_dossiers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dossier_code VARCHAR(40) UNIQUE NOT NULL,
  project_id UUID UNIQUE NOT NULL REFERENCES projects(id) ON DELETE RESTRICT,
  enterprise_user_id UUID NOT NULL REFERENCES users(id),
  satisfaction_score SMALLINT NOT NULL CHECK (satisfaction_score BETWEEN 1 AND 5),
  would_sponsor_again BOOLEAN NOT NULL DEFAULT TRUE,
  feedback_summary TEXT NOT NULL,
  final_deliverable_archive_url TEXT NULL,
  signed_off_by UUID NOT NULL REFERENCES users(id),
  signed_off_role VARCHAR(30) NOT NULL,
  signed_off_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_financial_dispute_project_id ON financial_dispute_tickets(project_id);
CREATE INDEX IF NOT EXISTS idx_financial_dispute_milestone_id ON financial_dispute_tickets(milestone_id);