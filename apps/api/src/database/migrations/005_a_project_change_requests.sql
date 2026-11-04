-- Migration 005_A: Project Scope Change & Cancellation Requests (Owner: Sinh viên A - REQ-ENT-03, REQ-LAB-02)

CREATE TYPE change_request_type AS ENUM (
  'SCOPE_CHANGE',
  'CANCEL'
);

CREATE TYPE change_request_status AS ENUM (
  'PENDING_APPROVAL',
  'APPROVED',
  'REJECTED',
  'WITHDRAWN'
);

CREATE TABLE IF NOT EXISTS project_change_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(32) UNIQUE NOT NULL,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  enterprise_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  request_type change_request_type NOT NULL,
  status change_request_status NOT NULL DEFAULT 'PENDING_APPROVAL',
  reason TEXT NOT NULL,
  impact_summary TEXT NOT NULL,
  proposed_deliverables TEXT NULL,
  proposed_budget_amount BIGINT NULL,
  proposed_duration_weeks INT NULL,
  proposed_max_team_size INT NULL,
  financial_settlement_note TEXT NULL,
  reviewed_by UUID NULL REFERENCES users(id) ON DELETE SET NULL,
  review_note TEXT NULL,
  reviewed_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_change_requests_project_id ON project_change_requests(project_id);
CREATE INDEX IF NOT EXISTS idx_change_requests_status ON project_change_requests(status);