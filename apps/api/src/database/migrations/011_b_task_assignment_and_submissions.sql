ALTER TABLE task_milestones
  ADD COLUMN IF NOT EXISTS assigned_user_id UUID NULL REFERENCES users(id) ON DELETE RESTRICT;

ALTER TABLE project_tasks
  ADD COLUMN IF NOT EXISTS assignment_type VARCHAR(20) NULL
  CHECK (
    (assignment_type = 'INDIVIDUAL' AND assigned_user_id IS NOT NULL)
    OR (assignment_type = 'TEAM' AND assigned_user_id IS NULL)
    OR (assignment_type IS NULL AND assigned_user_id IS NULL)
  );

ALTER TABLE task_milestones
  ADD COLUMN IF NOT EXISTS assignment_type VARCHAR(20) NULL
  CHECK (
    (assignment_type = 'INDIVIDUAL' AND assigned_user_id IS NOT NULL)
    OR (assignment_type = 'TEAM' AND assigned_user_id IS NULL)
    OR (assignment_type IS NULL AND assigned_user_id IS NULL)
  );

CREATE TABLE IF NOT EXISTS task_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES project_tasks(id) ON DELETE CASCADE,
  version INT NOT NULL CHECK (version > 0),
  content TEXT NOT NULL CHECK (length(trim(content)) > 0),
  template_id VARCHAR(80) NOT NULL,
  template_version VARCHAR(40) NOT NULL,
  submitted_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (task_id, version),
  FOREIGN KEY (template_id, template_version)
    REFERENCES task_templates(id, version) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_task_submissions_task_version
  ON task_submissions(task_id, version DESC);

CREATE TABLE IF NOT EXISTS milestone_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  milestone_id UUID NOT NULL REFERENCES task_milestones(id) ON DELETE CASCADE,
  version INT NOT NULL CHECK (version > 0),
  content TEXT NOT NULL CHECK (length(trim(content)) > 0),
  template_id VARCHAR(80) NOT NULL,
  template_version VARCHAR(40) NOT NULL,
  submitted_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (milestone_id, version),
  FOREIGN KEY (template_id, template_version)
    REFERENCES task_templates(id, version) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_milestone_submissions_milestone_version
  ON milestone_submissions(milestone_id, version DESC);

CREATE TABLE IF NOT EXISTS task_state_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES project_tasks(id) ON DELETE CASCADE,
  actor_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  from_status task_status NULL,
  to_status task_status NOT NULL,
  action VARCHAR(40) NOT NULL,
  note TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_task_state_history_task_created
  ON task_state_history(task_id, created_at);

CREATE TABLE IF NOT EXISTS milestone_state_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  milestone_id UUID NOT NULL REFERENCES task_milestones(id) ON DELETE CASCADE,
  actor_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  from_status task_status NULL,
  to_status task_status NOT NULL,
  action VARCHAR(40) NOT NULL,
  note TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_milestone_state_history_created
  ON milestone_state_history(milestone_id, created_at);
