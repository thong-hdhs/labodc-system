CREATE TYPE application_interview_outcome AS ENUM ('PASS', 'FAIL');

CREATE TABLE IF NOT EXISTS project_mentor_assignments (
  project_id UUID PRIMARY KEY REFERENCES projects(id) ON DELETE CASCADE,
  mentor_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  assigned_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_project_mentor_assignments_mentor
  ON project_mentor_assignments(mentor_user_id);

CREATE TABLE IF NOT EXISTS mentor_assignment_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  mentor_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  assigned_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mentor_assignment_history_project
  ON mentor_assignment_history(project_id, assigned_at);

CREATE TABLE IF NOT EXISTS application_review_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  actor_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  action VARCHAR(40) NOT NULL,
  interview_outcome application_interview_outcome NULL,
  internal_note TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_application_review_events_application
  ON application_review_events(application_id, created_at);
