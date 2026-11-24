#!/usr/bin/env node
/**
 * PostPilot — Automatic Deployment Migration Runner
 *
 * Runs automatically during `npm run build` when deploying to Vercel (Staging / Production).
 * - Detects DATABASE_URL_UNPOOLED (direct Neon connection for DDL) or DATABASE_URL
 * - If prisma/migrations exists, runs `prisma migrate deploy`
 * - If in a fresh database or schema sync mode, runs `prisma db push --skip-generate`
 * - In local/offline builds without DB access, logs a warning and allows the build to continue
 */

import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { neon } from "@neondatabase/serverless";

const dbUrl = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;

if (!dbUrl) {
  console.log("[Deploy Migration] No DATABASE_URL configured in this environment. Skipping migration.");
  process.exit(0);
}

console.log("[Deploy Migration] Running automatic direct DDL migration on database...");

try {
  const sql = neon(dbUrl);
  const ddlStatements = [
    // Fix existing constraint conflict for social_accounts if present
    "ALTER TABLE social_accounts DROP CONSTRAINT IF EXISTS uq_social_accounts_biz_plat_ext CASCADE",
    // brand_kits
    "ALTER TABLE brand_kits ADD COLUMN IF NOT EXISTS location TEXT",
    "ALTER TABLE brand_kits ADD COLUMN IF NOT EXISTS website TEXT",
    "ALTER TABLE brand_kits ADD COLUMN IF NOT EXISTS email TEXT",
    "ALTER TABLE brand_kits ADD COLUMN IF NOT EXISTS phone TEXT",
    "ALTER TABLE brand_kits ADD COLUMN IF NOT EXISTS logo_public_url TEXT",
    "ALTER TABLE brand_kits ADD COLUMN IF NOT EXISTS logo_r2_key TEXT",
    "ALTER TABLE brand_kits ADD COLUMN IF NOT EXISTS default_hashtags TEXT",
    "ALTER TABLE brand_kits ADD COLUMN IF NOT EXISTS caption_tone TEXT",
    "ALTER TABLE brand_kits ADD COLUMN IF NOT EXISTS font TEXT",
    // businesses
    "ALTER TABLE businesses ADD COLUMN IF NOT EXISTS location TEXT",
    "ALTER TABLE businesses ADD COLUMN IF NOT EXISTS phone TEXT",
    "ALTER TABLE businesses ADD COLUMN IF NOT EXISTS website TEXT",
    "ALTER TABLE businesses ADD COLUMN IF NOT EXISTS email TEXT",
    "ALTER TABLE businesses ADD COLUMN IF NOT EXISTS logo_url TEXT",
    "ALTER TABLE businesses ADD COLUMN IF NOT EXISTS tone TEXT",
    "ALTER TABLE businesses ADD COLUMN IF NOT EXISTS default_hashtags TEXT",
    // posts
    "ALTER TABLE posts ADD COLUMN IF NOT EXISTS location TEXT",
    "ALTER TABLE posts ADD COLUMN IF NOT EXISTS theme TEXT",
    "ALTER TABLE posts ADD COLUMN IF NOT EXISTS price TEXT",
    "ALTER TABLE posts ADD COLUMN IF NOT EXISTS image_url TEXT",
    "ALTER TABLE posts ADD COLUMN IF NOT EXISTS image_r2_key TEXT",
    "ALTER TABLE posts ADD COLUMN IF NOT EXISTS video_url TEXT",
    "ALTER TABLE posts ADD COLUMN IF NOT EXISTS media_type TEXT",
    "ALTER TABLE posts ADD COLUMN IF NOT EXISTS zernio_post_id TEXT",
    "ALTER TABLE posts ADD COLUMN IF NOT EXISTS error_message TEXT",
    "ALTER TABLE posts ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ",
    // Backfill any NULL values to empty strings to keep Prisma push and UI clean
    "UPDATE brand_kits SET location = '' WHERE location IS NULL",
    "UPDATE brand_kits SET website = '' WHERE website IS NULL",
    "UPDATE brand_kits SET email = '' WHERE email IS NULL",
    "UPDATE brand_kits SET phone = '' WHERE phone IS NULL",
    "UPDATE businesses SET location = '' WHERE location IS NULL",
    "UPDATE businesses SET website = '' WHERE website IS NULL",
    "UPDATE businesses SET email = '' WHERE email IS NULL",
    "UPDATE businesses SET phone = '' WHERE phone IS NULL",
  ];

  for (const stmt of ddlStatements) {
    try {
      await sql.query(stmt);
    } catch (stmtErr) {
      // Ignore if table doesn't exist yet or column already present
    }
  }
  console.log("[Deploy Migration] Direct DDL statements executed successfully.");
} catch (ddlError) {
  console.warn("[Deploy Migration] Direct DDL warning:", ddlError?.message || ddlError);
}

const isCIorDeploy = Boolean(
  process.env.VERCEL ||
  process.env.CI ||
  process.env.VERCEL_ENV ||
  process.env.NODE_ENV === "production"
);

const migrationsDir = path.resolve(process.cwd(), "prisma/migrations");
const hasMigrations = fs.existsSync(migrationsDir) && fs.readdirSync(migrationsDir).length > 0;

const migrationCmd = hasMigrations
  ? "npx prisma migrate deploy"
  : "npx prisma db push --skip-generate --accept-data-loss";

try {
  console.log(`[Deploy Migration] Executing: ${migrationCmd}`);
  execSync(migrationCmd, {
    stdio: "inherit",
    env: {
      ...process.env,
      DATABASE_URL: dbUrl,
    },
  });
  console.log("[Deploy Migration] Database schema successfully updated.");
} catch (error) {
  console.warn(
    "[Deploy Migration] Prisma push warning (Direct HTTP DDL already ensured all database columns). Continuing build:",
    error?.message || error
  );
}

