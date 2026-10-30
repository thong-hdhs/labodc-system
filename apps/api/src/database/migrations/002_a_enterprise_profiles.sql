-- Migration 002_A: Enterprise Profiles & KYC Verification (Owner: Sinh viên A - REQ-ENT-01)

CREATE TYPE enterprise_verification_status AS ENUM (
  'PENDING_VERIFICATION',
  'VERIFIED',
  'REJECTED'
);

CREATE TABLE IF NOT EXISTS enterprise_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_name VARCHAR(255) NOT NULL,
  tax_code VARCHAR(20) UNIQUE NOT NULL,
  industry VARCHAR(150) NOT NULL,
  address TEXT NOT NULL,
  website VARCHAR(255) NULL,
  description TEXT NULL,
  representative_name VARCHAR(150) NOT NULL,
  contact_email VARCHAR(255) NOT NULL,
  contact_phone VARCHAR(30) NOT NULL,
  verification_status enterprise_verification_status NOT NULL DEFAULT 'PENDING_VERIFICATION',
  verified_by UUID NULL REFERENCES users(id) ON DELETE SET NULL,
  verified_at TIMESTAMPTZ NULL,
  verification_note TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_enterprise_profiles_owner_user_id ON enterprise_profiles(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_enterprise_profiles_tax_code ON enterprise_profiles(tax_code);
CREATE INDEX IF NOT EXISTS idx_enterprise_profiles_status ON enterprise_profiles(verification_status);