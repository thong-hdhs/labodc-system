CREATE TABLE IF NOT EXISTS progress_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  team_id UUID NULL REFERENCES project_teams(id) ON DELETE RESTRICT,
  author_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  author_role VARCHAR(24) NOT NULL
    CHECK (author_role IN ('MENTOR', 'TALENT_LEADER')),
  period_type VARCHAR(12) NOT NULL
    CHECK (period_type IN ('MONTH', 'PHASE')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  summary TEXT NOT NULL CHECK (length(trim(summary)) BETWEEN 1 AND 5000),
  progress TEXT NOT NULL CHECK (length(trim(progress)) BETWEEN 1 AND 5000),
  blockers TEXT NOT NULL DEFAULT '' CHECK (length(trim(blockers)) <= 5000),
  next_steps TEXT NOT NULL CHECK (length(trim(next_steps)) BETWEEN 1 AND 5000),
  status VARCHAR(24) NOT NULL DEFAULT 'DRAFT'
    CHECK (
      status IN (
        'DRAFT',
        'SUBMITTED',
        'IN_REVIEW',
        'CHANGES_REQUESTED',
        'APPROVED'
      )
    ),
  version INT NOT NULL DEFAULT 1 CHECK (version > 0),
  reviewer_user_id UUID NULL REFERENCES users(id) ON DELETE RESTRICT,
  review_note TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (period_start <= period_end),
  CHECK (
    (author_role = 'TALENT_LEADER' AND team_id IS NOT NULL)
    OR author_role = 'MENTOR'
  ),
  CHECK (status <> 'IN_REVIEW' OR reviewer_user_id IS NOT NULL),
  CHECK (
    status <> 'CHANGES_REQUESTED'
    OR length(trim(COALESCE(review_note, ''))) BETWEEN 3 AND 2000
  )
);

CREATE INDEX IF NOT EXISTS idx_progress_reports_project_period
  ON progress_reports(project_id, period_start DESC, period_end DESC);

CREATE INDEX IF NOT EXISTS idx_progress_reports_team_period
  ON progress_reports(team_id, period_start DESC)
  WHERE team_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_progress_reports_review_queue
  ON progress_reports(status, updated_at DESC)
  WHERE status IN ('SUBMITTED', 'IN_REVIEW', 'CHANGES_REQUESTED');

CREATE TABLE IF NOT EXISTS progress_report_versions (
  report_id UUID NOT NULL REFERENCES progress_reports(id) ON DELETE CASCADE,
  version INT NOT NULL CHECK (version > 0),
  period_type VARCHAR(12) NOT NULL CHECK (period_type IN ('MONTH', 'PHASE')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  summary TEXT NOT NULL CHECK (length(trim(summary)) BETWEEN 1 AND 5000),
  progress TEXT NOT NULL CHECK (length(trim(progress)) BETWEEN 1 AND 5000),
  blockers TEXT NOT NULL CHECK (length(trim(blockers)) <= 5000),
  next_steps TEXT NOT NULL CHECK (length(trim(next_steps)) BETWEEN 1 AND 5000),
  updated_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (report_id, version),
  CHECK (period_start <= period_end)
);

CREATE TABLE IF NOT EXISTS report_state_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id UUID NOT NULL REFERENCES progress_reports(id) ON DELETE CASCADE,
  actor_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  action VARCHAR(32) NOT NULL
    CHECK (
      action IN (
        'CREATED',
        'UPDATED',
        'SUBMITTED',
        'REVIEW_STARTED',
        'CHANGES_REQUESTED',
        'RESUBMITTED',
        'APPROVED'
      )
    ),
  from_status VARCHAR(24) NULL
    CHECK (
      from_status IS NULL
      OR from_status IN (
        'DRAFT',
        'SUBMITTED',
        'IN_REVIEW',
        'CHANGES_REQUESTED',
        'APPROVED'
      )
    ),
  to_status VARCHAR(24) NOT NULL
    CHECK (
      to_status IN (
        'DRAFT',
        'SUBMITTED',
        'IN_REVIEW',
        'CHANGES_REQUESTED',
        'APPROVED'
      )
    ),
  note TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_report_state_history_report_created
  ON report_state_history(report_id, created_at);

CREATE TABLE IF NOT EXISTS evaluations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES project_teams(id) ON DELETE RESTRICT,
  subject_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  mentor_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  rubric JSONB NOT NULL
    CHECK (
      CASE
        WHEN jsonb_typeof(rubric) = 'array'
          THEN jsonb_array_length(rubric) BETWEEN 1 AND 30
        ELSE FALSE
      END
    ),
  overall_feedback TEXT NOT NULL
    CHECK (length(trim(overall_feedback)) BETWEEN 1 AND 2000),
  status VARCHAR(24) NOT NULL DEFAULT 'EVALUATION_DRAFT'
    CHECK (status IN ('EVALUATION_DRAFT', 'EVALUATION_FINAL')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finalized_at TIMESTAMPTZ NULL,
  CHECK (period_start <= period_end),
  CHECK (
    (status = 'EVALUATION_DRAFT' AND finalized_at IS NULL)
    OR (status = 'EVALUATION_FINAL' AND finalized_at IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_evaluations_subject_final
  ON evaluations(subject_user_id, finalized_at DESC)
  WHERE status = 'EVALUATION_FINAL';

CREATE INDEX IF NOT EXISTS idx_evaluations_project_period
  ON evaluations(project_id, period_start DESC, period_end DESC);

CREATE TABLE IF NOT EXISTS contribution_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES project_teams(id) ON DELETE RESTRICT,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  recorded_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  description TEXT NOT NULL CHECK (length(trim(description)) BETWEEN 1 AND 2000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (period_start <= period_end)
);

CREATE INDEX IF NOT EXISTS idx_contribution_records_member_period
  ON contribution_records(user_id, period_start DESC, period_end DESC);

CREATE INDEX IF NOT EXISTS idx_contribution_records_project_period
  ON contribution_records(project_id, period_start DESC, period_end DESC);
