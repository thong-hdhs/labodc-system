-- Migration 012_A: Project Execution Progress Reports & 70/20/10 Settlement Statements (Owner: Sinh viên A - D15)

CREATE TYPE project_health_status AS ENUM (
  'ON_TRACK',
  'AT_RISK',
  'DELAYED'
);

CREATE TYPE progress_report_review_status AS ENUM (
  'SUBMITTED',
  'REVIEWED_OK',
  'FLAGGED_ACTION_REQUIRED'
);

CREATE TABLE IF NOT EXISTS project_progress_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  milestone_id UUID NULL REFERENCES project_milestones(id) ON DELETE SET NULL,
  reporting_week INT NOT NULL CHECK (reporting_week >= 1),
  completion_percentage INT NOT NULL CHECK (completion_percentage BETWEEN 0 AND 100),
  health_status project_health_status NOT NULL DEFAULT 'ON_TRACK',
  summary TEXT NOT NULL,
  blockers TEXT NULL,
  evidence_url TEXT NULL,
  submitted_by UUID NOT NULL REFERENCES users(id),
  submitted_role VARCHAR(30) NOT NULL,
  review_status progress_report_review_status NOT NULL DEFAULT 'SUBMITTED',
  reviewed_by UUID NULL REFERENCES users(id),
  review_note TEXT NULL,
  reviewed_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS project_settlement_certificates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  certificate_code VARCHAR(40) UNIQUE NOT NULL,
  project_id UUID UNIQUE NOT NULL REFERENCES projects(id) ON DELETE RESTRICT,
  total_deposited_amount BIGINT NOT NULL CHECK (total_deposited_amount >= 0),
  total_disbursed_amount BIGINT NOT NULL CHECK (total_disbursed_amount >= 0),
  total_refunded_amount BIGINT NOT NULL CHECK (total_refunded_amount >= 0),
  team_70_amount BIGINT NOT NULL CHECK (team_70_amount >= 0),
  mentor_20_amount BIGINT NOT NULL CHECK (mentor_20_amount >= 0),
  lab_10_amount BIGINT NOT NULL CHECK (lab_10_amount >= 0),
  remainder_absorbed_by_lab BIGINT NOT NULL DEFAULT 0,
  issued_by UUID NOT NULL REFERENCES users(id),
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_project_progress_reports_project_id ON project_progress_reports(project_id);