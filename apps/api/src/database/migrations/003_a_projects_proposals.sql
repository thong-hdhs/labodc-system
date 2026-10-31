-- Migration 003_A: Project Proposals & Lifecycle Audit Trail (Owner: Sinh viên A - REQ-ENT-02, REQ-LAB-01)

CREATE TYPE project_status AS ENUM (
  'DRAFT',
  'SUBMITTED',
  'CHANGES_REQUESTED',
  'REJECTED',
  'APPROVED',
  'PUBLISHED',
  'UNPUBLISHED',
  'RECRUITMENT_CLOSED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED'
);

CREATE TYPE proposal_reason_code AS ENUM (
  'MISSING_SCOPE',
  'BUDGET_MISMATCH',
  'TECH_STACK_UNSUPPORTED',
  'UNVERIFIED_ENTERPRISE',
  'OTHER'
);

CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(32) UNIQUE NOT NULL,
  enterprise_id UUID NULL REFERENCES enterprise_profiles(id) ON DELETE SET NULL,
  owner_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  summary TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  deliverables TEXT NOT NULL DEFAULT '',
  required_skills JSONB NOT NULL DEFAULT '[]'::jsonb,
  min_team_size INT NOT NULL DEFAULT 3,
  max_team_size INT NOT NULL DEFAULT 5,
  duration_weeks INT NOT NULL DEFAULT 8,
  budget_amount BIGINT NOT NULL DEFAULT 0,
  currency VARCHAR(10) NOT NULL DEFAULT 'VND',
  attachment_url VARCHAR(500) NULL,
  status project_status NOT NULL DEFAULT 'DRAFT',
  reason_code proposal_reason_code NULL,
  review_note TEXT NULL,
  registration_open_at TIMESTAMPTZ NULL,
  registration_close_at TIMESTAMPTZ NULL,
  submitted_at TIMESTAMPTZ NULL,
  approved_by UUID NULL REFERENCES users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ NULL,
  published_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS project_audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  actor_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  actor_role VARCHAR(50) NOT NULL,
  action VARCHAR(100) NOT NULL,
  from_status project_status NULL,
  to_status project_status NOT NULL,
  reason_code proposal_reason_code NULL,
  reason_note TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_projects_owner_user_id ON projects(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_projects_enterprise_id ON projects(enterprise_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_project_audit_logs_project_id ON project_audit_logs(project_id);