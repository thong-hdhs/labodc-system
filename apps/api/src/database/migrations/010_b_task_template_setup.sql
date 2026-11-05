CREATE TYPE task_status AS ENUM (
  'PLANNED',
  'ASSIGNED',
  'IN_PROGRESS',
  'SUBMITTED_FOR_REVIEW',
  'CHANGES_REQUESTED',
  'COMPLETED',
  'CANCELLED'
);
CREATE TYPE task_template_kind AS ENUM ('TASK', 'MILESTONE');

CREATE TABLE IF NOT EXISTS task_templates (
  id VARCHAR(80) NOT NULL,
  version VARCHAR(40) NOT NULL,
  name VARCHAR(200) NOT NULL,
  kind task_template_kind NOT NULL,
  approval_status VARCHAR(40) NOT NULL CHECK (approval_status = 'DEMO/NOT_APPROVED'),
  document_name VARCHAR(200) NOT NULL,
  file_reference TEXT NULL,
  required_fields JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (id, version),
  CHECK (file_reference IS NULL)
);

INSERT INTO task_templates
  (id, version, name, kind, approval_status, document_name, file_reference, required_fields)
VALUES
  ('TASK-PLAN', '1.0.0-demo', 'Kế hoạch công việc', 'TASK', 'DEMO/NOT_APPROVED',
   'task-plan-demo.xlsx', NULL, '["title","description","dueAt","deliverable"]'::jsonb),
  ('MILESTONE-PLAN', '1.0.0-demo', 'Kế hoạch cột mốc', 'MILESTONE', 'DEMO/NOT_APPROVED',
   'milestone-plan-demo.xlsx', NULL, '["title","description","dueAt","acceptanceCriteria"]'::jsonb)
ON CONFLICT (id, version) DO NOTHING;

CREATE TABLE IF NOT EXISTS project_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES project_teams(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  due_at TIMESTAMPTZ NULL,
  status task_status NOT NULL DEFAULT 'PLANNED',
  assigned_user_id UUID NULL REFERENCES users(id) ON DELETE RESTRICT,
  template_id VARCHAR(80) NOT NULL,
  template_version VARCHAR(40) NOT NULL,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  FOREIGN KEY (template_id, template_version)
    REFERENCES task_templates(id, version) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_project_tasks_team_created
  ON project_tasks(team_id, created_at);

CREATE TABLE IF NOT EXISTS task_milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES project_tasks(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  due_at TIMESTAMPTZ NULL,
  status task_status NOT NULL DEFAULT 'PLANNED',
  template_id VARCHAR(80) NOT NULL,
  template_version VARCHAR(40) NOT NULL,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  FOREIGN KEY (template_id, template_version)
    REFERENCES task_templates(id, version) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_task_milestones_task_created
  ON task_milestones(task_id, created_at);
