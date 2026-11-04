CREATE TYPE mentor_invitation_status AS ENUM (
  'PENDING',
  'ACCEPTED',
  'DECLINED'
);

CREATE TABLE IF NOT EXISTS project_mentor_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  mentor_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  invited_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  status mentor_invitation_status NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  responded_at TIMESTAMPTZ NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_project_mentor_invitations_pending_project
  ON project_mentor_invitations(project_id)
  WHERE status = 'PENDING';

CREATE INDEX IF NOT EXISTS idx_project_mentor_invitations_mentor
  ON project_mentor_invitations(mentor_user_id, created_at DESC);

ALTER TABLE mentor_assignment_history
  ADD COLUMN IF NOT EXISTS action VARCHAR(16) NOT NULL DEFAULT 'ASSIGNED';
