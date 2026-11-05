-- Migration 008_A: System Governance Configurations, Account Status Control & Sprint 2 Audit Logs (Owner: Sinh viên A - D14)

CREATE TABLE IF NOT EXISTS system_configurations (
  key VARCHAR(100) PRIMARY KEY,
  value_json JSONB NOT NULL,
  description TEXT NOT NULL,
  is_immutable BOOLEAN NOT NULL DEFAULT FALSE,
  updated_by UUID NULL REFERENCES users(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS system_governance_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_user_id UUID NOT NULL REFERENCES users(id),
  actor_role VARCHAR(40) NOT NULL,
  action VARCHAR(80) NOT NULL,
  target_type VARCHAR(50) NOT NULL,
  target_id VARCHAR(120) NOT NULL,
  reason_note TEXT NOT NULL,
  metadata JSONB NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_system_governance_logs_actor ON system_governance_logs(actor_user_id);
CREATE INDEX IF NOT EXISTS idx_system_governance_logs_target ON system_governance_logs(target_type, target_id);