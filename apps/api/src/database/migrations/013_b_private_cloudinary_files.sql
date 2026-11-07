CREATE TABLE IF NOT EXISTS file_assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  category VARCHAR(24) NOT NULL
    CHECK (category IN ('AVATAR', 'PORTFOLIO', 'TASK_DOCUMENT', 'REPORT_DOCUMENT')),
  file_name VARCHAR(255) NOT NULL,
  mime_type VARCHAR(120) NOT NULL,
  size_bytes BIGINT NOT NULL CHECK (size_bytes > 0),
  task_id UUID NULL REFERENCES project_tasks(id) ON DELETE CASCADE,
  report_id UUID NULL REFERENCES progress_reports(id) ON DELETE CASCADE,
  project_id UUID NULL REFERENCES projects(id) ON DELETE CASCADE,
  team_id UUID NULL REFERENCES project_teams(id) ON DELETE CASCADE,
  cloudinary_public_id TEXT NOT NULL UNIQUE,
  resource_type VARCHAR(8) NOT NULL CHECK (resource_type IN ('image', 'raw')),
  format VARCHAR(12) NOT NULL,
  status VARCHAR(16) NOT NULL DEFAULT 'PENDING_UPLOAD'
    CHECK (status IN ('PENDING_UPLOAD', 'UPLOADED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  uploaded_at TIMESTAMPTZ NULL,
  CHECK (
    (category IN ('AVATAR', 'PORTFOLIO') AND task_id IS NULL AND report_id IS NULL)
    OR (category = 'TASK_DOCUMENT' AND task_id IS NOT NULL AND report_id IS NULL)
    OR (category = 'REPORT_DOCUMENT' AND report_id IS NOT NULL AND task_id IS NULL)
  ),
  CHECK (
    (status = 'PENDING_UPLOAD' AND uploaded_at IS NULL)
    OR (status = 'UPLOADED' AND uploaded_at IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_file_assets_owner_category
  ON file_assets(owner_user_id, category, created_at DESC)
  WHERE status = 'UPLOADED';

CREATE INDEX IF NOT EXISTS idx_file_assets_task
  ON file_assets(task_id, created_at DESC)
  WHERE status = 'UPLOADED';

CREATE INDEX IF NOT EXISTS idx_file_assets_report
  ON file_assets(report_id, created_at DESC)
  WHERE status = 'UPLOADED';

ALTER TABLE talent_profiles
  ADD COLUMN IF NOT EXISTS avatar_file_id UUID NULL
  REFERENCES file_assets(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS file_access_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  file_id UUID NOT NULL REFERENCES file_assets(id) ON DELETE CASCADE,
  actor_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  action VARCHAR(32) NOT NULL
    CHECK (action IN ('UPLOAD_COMPLETED', 'DOWNLOAD_URL_ISSUED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_file_access_history_file_created
  ON file_access_history(file_id, created_at DESC);
