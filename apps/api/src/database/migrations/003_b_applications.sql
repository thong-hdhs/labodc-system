CREATE TYPE application_status AS ENUM (
  'SUBMITTED',
  'UNDER_REVIEW',
  'INTERVIEW',
  'ACCEPTED',
  'REJECTED',
  'WITHDRAWN'
);

CREATE TABLE IF NOT EXISTS applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  applicant_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status application_status NOT NULL DEFAULT 'SUBMITTED',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  withdrawn_at TIMESTAMPTZ NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_applications_active_project_applicant
  ON applications(project_id, applicant_user_id)
  WHERE status IN ('SUBMITTED', 'UNDER_REVIEW', 'INTERVIEW');

CREATE INDEX IF NOT EXISTS idx_applications_applicant_created
  ON applications(applicant_user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS application_state_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  actor_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  from_status application_status NULL,
  to_status application_status NOT NULL,
  reason TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_application_state_history_application
  ON application_state_history(application_id, created_at);
