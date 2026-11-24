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

const dbUrl = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;

if (!dbUrl) {
  console.log("[Deploy Migration] No DATABASE_URL configured in this environment. Skipping migration.");
  process.exit(0);
}

const isCIorDeploy = Boolean(
  process.env.VERCEL ||
  process.env.CI ||
  process.env.VERCEL_ENV ||
  process.env.NODE_ENV === "production"
);

console.log("[Deploy Migration] Running automatic database migration check on deploy...");

const migrationsDir = path.resolve(process.cwd(), "prisma/migrations");
const hasMigrations = fs.existsSync(migrationsDir) && fs.readdirSync(migrationsDir).length > 0;

const migrationCmd = hasMigrations
  ? "npx prisma migrate deploy"
  : "npx prisma db push --skip-generate";

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
  // If we are strictly in Vercel Production deployment, fail the build so broken DB state isn't shipped
  if (process.env.VERCEL_ENV === "production") {
    console.error("[Deploy Migration] CRITICAL: Failed to apply database migration on production deploy!");
    process.exit(1);
  } else {
    console.warn(
      "[Deploy Migration] Warning: Database was unreachable or migration skipped in current environment. Continuing build.",
      error?.message || error
    );
  }
}

