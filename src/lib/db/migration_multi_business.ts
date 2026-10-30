import { query } from "../db.ts";

export async function runMultiBusinessMigration() {
  console.log("[Migration] Running multi-business and social accounts migration...");

  // 1. Update businesses table
  await query`
    ALTER TABLE businesses
      ADD COLUMN IF NOT EXISTS owner_user_id TEXT,
      ADD COLUMN IF NOT EXISTS logo_url TEXT,
      ADD COLUMN IF NOT EXISTS brand_colors TEXT[] DEFAULT ARRAY['#00A896', '#028090', '#05668D', '#02C39A']::text[],
      ADD COLUMN IF NOT EXISTS tone TEXT DEFAULT 'Premium',
      ADD COLUMN IF NOT EXISTS default_hashtags TEXT DEFAULT '',
      ADD COLUMN IF NOT EXISTS zernio_profile_id TEXT;
  `;

  // Sync owner_user_id with owner_id
  await query`
    UPDATE businesses SET owner_user_id = owner_id WHERE owner_user_id IS NULL;
  `;

  // Backfill brand settings from brand_kits into businesses
  await query`
    UPDATE businesses b
    SET
      logo_url = COALESCE(b.logo_url, bk.logo_public_url),
      brand_colors = COALESCE(b.brand_colors, bk.colors),
      tone = COALESCE(b.tone, bk.caption_tone),
      default_hashtags = COALESCE(b.default_hashtags, bk.default_hashtags)
    FROM brand_kits bk
    WHERE bk.business_id = b.id;
  `;

  // 2. Create social_accounts table
  await query`
    CREATE TABLE IF NOT EXISTS social_accounts (
      id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      business_id         UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
      platform            TEXT NOT NULL,
      external_account_id TEXT NOT NULL,
      username            TEXT NOT NULL,
      status              TEXT NOT NULL DEFAULT 'connected'
        CHECK (status IN ('connected', 'expired', 'disconnected')),
      connected_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
      deleted_at          TIMESTAMPTZ
    );
  `;

  await query`
    CREATE INDEX IF NOT EXISTS idx_social_accounts_biz ON social_accounts (business_id) WHERE deleted_at IS NULL;
  `;

  // Unique constraint: the same account cannot be connected to two active businesses
  await query`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_social_accounts_unique_ext
      ON social_accounts (LOWER(platform), external_account_id)
      WHERE deleted_at IS NULL AND status != 'disconnected';
  `;

  // Migrate existing data from connected_accounts
  await query`
    INSERT INTO social_accounts (id, business_id, platform, external_account_id, username, status, connected_at, updated_at)
    SELECT
      id,
      business_id,
      platform,
      COALESCE(zernio_account_id, id::text),
      COALESCE(platform_handle, 'connected'),
      status,
      connected_at,
      updated_at
    FROM connected_accounts
    ON CONFLICT DO NOTHING;
  `;

  // 3. Update posts table
  await query`
    ALTER TABLE posts
      ADD COLUMN IF NOT EXISTS social_account_id UUID REFERENCES social_accounts(id) ON DELETE SET NULL;
  `;

  // 4. Update poster_generations table
  await query`
    ALTER TABLE poster_generations
      ADD COLUMN IF NOT EXISTS social_account_id UUID REFERENCES social_accounts(id) ON DELETE SET NULL;
  `;

  console.log("[Migration] Multi-business and social accounts migration completed successfully.");
}

// Allow standalone execution
if (import.meta.main) {
  runMultiBusinessMigration()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("[Migration Error]", err);
      process.exit(1);
    });
}
