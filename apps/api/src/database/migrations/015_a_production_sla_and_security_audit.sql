-- Migration 015_A: NFR SLA Telemetry, Security Matrix Audit & Production Readiness Sign-off (Owner: Sinh viên A - D19)

CREATE TABLE IF NOT EXISTS system_sla_benchmarks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  endpoint_category VARCHAR(40) NOT NULL CHECK (endpoint_category IN ('STANDARD_API', 'FINANCIAL_LEDGER_API')),
  endpoint_path VARCHAR(180) NOT NULL,
  observed_p95_ms INT NOT NULL CHECK (observed_p95_ms >= 0),
  threshold_p95_ms INT NOT NULL CHECK (threshold_p95_ms > 0),
  within_sla BOOLEAN NOT NULL,
  measured_by UUID NOT NULL REFERENCES users(id),
  measured_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS production_readiness_signoffs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  signoff_code VARCHAR(50) UNIQUE NOT NULL,
  release_version VARCHAR(30) NOT NULL,
  all_nfr_gates_passed BOOLEAN NOT NULL DEFAULT TRUE,
  ledger_invariant_verified BOOLEAN NOT NULL DEFAULT TRUE,
  rbac_matrix_verified BOOLEAN NOT NULL DEFAULT TRUE,
  note TEXT NOT NULL,
  signed_by UUID NOT NULL REFERENCES users(id),
  signed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_system_sla_benchmarks_category ON system_sla_benchmarks(endpoint_category);