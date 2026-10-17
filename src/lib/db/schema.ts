/**
 * PostPilot — Database Schema & Migrations
 *
 * Run this once against your Neon database using the UNPOOLED connection:
 *   npx tsx src/lib/db/migrate.ts
 *
 * All tables use UUIDs as primary keys and include created_at / updated_at.
 * Soft deletes (deleted_at) are used for posts, businesses, and accounts.
 */

export const SCHEMA_SQL = /* sql */ `

-- ============================================================
-- EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT NOT NULL UNIQUE,
  email_verified BOOLEAN NOT NULL DEFAULT false,
  magic_token   TEXT,
  magic_token_expires_at TIMESTAMPTZ,
  last_login_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
CREATE INDEX IF NOT EXISTS idx_users_magic_token ON users (magic_token) WHERE magic_token IS NOT NULL;

-- ============================================================
-- BUSINESSES
-- ============================================================
CREATE TABLE IF NOT EXISTS businesses (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id      TEXT NOT NULL,
  name          TEXT NOT NULL,
  tagline       TEXT NOT NULL DEFAULT '',
  location      TEXT NOT NULL DEFAULT '',
  phone         TEXT NOT NULL DEFAULT '',
  timezone      TEXT NOT NULL DEFAULT 'UTC',
  business_type TEXT NOT NULL DEFAULT 'restaurant',
  is_active     BOOLEAN NOT NULL DEFAULT true,
  deleted_at    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_businesses_owner ON businesses (owner_id) WHERE deleted_at IS NULL;

-- ============================================================
-- BRAND KITS
-- ============================================================
CREATE TABLE IF NOT EXISTS brand_kits (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id      UUID NOT NULL UNIQUE REFERENCES businesses(id) ON DELETE CASCADE,
  colors           TEXT[] NOT NULL DEFAULT ARRAY['Tomato'],
  font             TEXT NOT NULL DEFAULT 'Fraunces',
  logo_r2_key      TEXT,
  logo_public_url  TEXT,
  caption_tone     TEXT NOT NULL DEFAULT 'Friendly'
    CHECK (caption_tone IN ('Friendly', 'Premium', 'Playful', 'Direct')),
  default_hashtags TEXT NOT NULL DEFAULT '',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- CONNECTED SOCIAL ACCOUNTS
-- ============================================================
CREATE TABLE IF NOT EXISTS connected_accounts (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id      UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  platform         TEXT NOT NULL CHECK (platform IN ('Instagram', 'Facebook', 'X')),
  platform_user_id TEXT,
  platform_handle  TEXT,
  access_token_enc TEXT,            -- AES-256-GCM encrypted at rest
  token_expires_at TIMESTAMPTZ,
  zernio_account_id TEXT,           -- Zernio's own account reference
  status           TEXT NOT NULL DEFAULT 'connected'
    CHECK (status IN ('connected', 'expired', 'disconnected')),
  deleted_at       TIMESTAMPTZ,
  connected_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (business_id, platform)
);

CREATE INDEX IF NOT EXISTS idx_connected_accounts_business ON connected_accounts (business_id)
  WHERE deleted_at IS NULL;

-- ============================================================
-- POSTS
-- ============================================================
CREATE TABLE IF NOT EXISTS posts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id     UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  headline        TEXT NOT NULL DEFAULT '',
  caption         TEXT NOT NULL DEFAULT '',
  prompt          TEXT NOT NULL DEFAULT '',
  date            DATE,
  time            TIME,
  status          TEXT NOT NULL DEFAULT 'Draft'
    CHECK (status IN ('Draft', 'Scheduled', 'Posted', 'Failed', 'Cancelled')),
  platform        TEXT NOT NULL DEFAULT 'Instagram'
    CHECK (platform IN ('Instagram', 'Facebook', 'X')),
  theme           TEXT NOT NULL DEFAULT 'tomato',
  price           TEXT NOT NULL DEFAULT '',
  image_url       TEXT,             -- Public R2/CDN URL of generated poster
  image_r2_key    TEXT,             -- R2 object key for management
  zernio_post_id  TEXT,             -- ID returned by Zernio after publishing
  published_at    TIMESTAMPTZ,
  error_message   TEXT,
  deleted_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_posts_business        ON posts (business_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_posts_business_status ON posts (business_id, status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_posts_date            ON posts (date, time) WHERE status = 'Scheduled' AND deleted_at IS NULL;

-- ============================================================
-- POSTER GENERATIONS (tracks what was generated per prompt)
-- ============================================================
CREATE TABLE IF NOT EXISTS poster_generations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id     UUID REFERENCES posts(id) ON DELETE SET NULL,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  prompt      TEXT NOT NULL,
  options     JSONB NOT NULL DEFAULT '[]',   -- Array of PosterOption
  selected    INTEGER,                        -- index of chosen option
  cost_usd    NUMERIC(10, 6),                -- cost tracking
  model_used  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_poster_gen_business ON poster_generations (business_id);
CREATE INDEX IF NOT EXISTS idx_poster_gen_post     ON poster_generations (post_id) WHERE post_id IS NOT NULL;

-- ============================================================
-- CAPTION SUGGESTIONS (tracks AI caption calls)
-- ============================================================
CREATE TABLE IF NOT EXISTS caption_suggestions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id     UUID REFERENCES posts(id) ON DELETE SET NULL,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  suggestions JSONB NOT NULL DEFAULT '[]',  -- Array of suggestion strings
  selected    TEXT,                          -- Which one the user picked
  model_used  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_caption_suggestions_post ON caption_suggestions (post_id) WHERE post_id IS NOT NULL;

-- ============================================================
-- AUDIT LOG (immutable append-only)
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_log (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       TEXT,
  business_id   UUID REFERENCES businesses(id) ON DELETE SET NULL,
  action        TEXT NOT NULL,
  resource_type TEXT,
  resource_id   UUID,
  metadata      JSONB DEFAULT '{}',
  ip_address    INET,
  user_agent    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_user     ON audit_log (user_id);
CREATE INDEX IF NOT EXISTS idx_audit_business ON audit_log (business_id);
CREATE INDEX IF NOT EXISTS idx_audit_resource ON audit_log (resource_type, resource_id);

-- ============================================================
-- UPDATED_AT trigger function
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all relevant tables
DO $$ 
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'users', 'businesses', 'brand_kits',
    'connected_accounts', 'posts'
  ] LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS trg_updated_at ON %I;
       CREATE TRIGGER trg_updated_at
       BEFORE UPDATE ON %I
       FOR EACH ROW EXECUTE FUNCTION update_updated_at();',
      t, t
    );
  END LOOP;
END;
$$;
`;
