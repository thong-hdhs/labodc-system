CREATE TABLE IF NOT EXISTS talent_profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  student_id VARCHAR(64) NOT NULL UNIQUE,
  full_name VARCHAR(160) NOT NULL,
  faculty VARCHAR(160),
  major VARCHAR(160),
  cohort VARCHAR(80),
  bio TEXT,
  skills JSONB NOT NULL DEFAULT '[]'::jsonb,
  certifications JSONB NOT NULL DEFAULT '[]'::jsonb,
  portfolio_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT talent_profiles_skills_array CHECK (jsonb_typeof(skills) = 'array'),
  CONSTRAINT talent_profiles_certifications_array CHECK (jsonb_typeof(certifications) = 'array'),
  CONSTRAINT talent_profiles_portfolio_array CHECK (jsonb_typeof(portfolio_items) = 'array')
);
