-- Migration 004_A: PayOS Sandbox Orders & Idempotent Webhook Events (Owner: Sinh viên A - REQ-FIN-01, REQ-FIN-02, ADR-04)

CREATE TYPE payment_order_status AS ENUM (
  'PENDING_PAYMENT',
  'PAID',
  'FAILED',
  'CANCELLED'
);

CREATE TABLE IF NOT EXISTS payment_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_code BIGINT UNIQUE NOT NULL,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  enterprise_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  milestone_name VARCHAR(150) NOT NULL,
  amount BIGINT NOT NULL CHECK (amount > 0),
  currency VARCHAR(10) NOT NULL DEFAULT 'VND',
  payment_mode VARCHAR(20) NOT NULL DEFAULT 'SANDBOX',
  status payment_order_status NOT NULL DEFAULT 'PENDING_PAYMENT',
  checkout_url TEXT NOT NULL,
  qr_code TEXT NOT NULL,
  signature VARCHAR(128) NOT NULL,
  paid_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payment_webhook_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider VARCHAR(30) NOT NULL DEFAULT 'PAYOS',
  idempotency_key VARCHAR(150) NOT NULL,
  order_code BIGINT NOT NULL REFERENCES payment_orders(order_code) ON DELETE CASCADE,
  raw_payload JSONB NOT NULL,
  signature VARCHAR(128) NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_webhook_provider_idempotency UNIQUE (provider, idempotency_key)
);

CREATE INDEX IF NOT EXISTS idx_payment_orders_project_id ON payment_orders(project_id);
CREATE INDEX IF NOT EXISTS idx_payment_orders_status ON payment_orders(status);