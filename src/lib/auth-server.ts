/**
 * PostPilot — Better Auth Server Configuration
 *
 * Configured with:
 * - Neon PostgreSQL database connection
 * - Google OAuth Social Provider
 * - TanStack Start cookie management plugin
 */

import fs from "node:fs";
import path from "node:path";
import { betterAuth } from "better-auth";
import { Pool } from "@neondatabase/serverless";
import { tanstackStartCookies } from "better-auth/tanstack-start";

function loadEnvFallback() {
  try {
    process.loadEnvFile?.();
  } catch {}

  try {
    const envPath = path.resolve(process.cwd(), ".env");
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf-8");
      for (const line of content.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const idx = trimmed.indexOf("=");
        if (idx > 0) {
          const key = trimmed.slice(0, idx).trim();
          const val = trimmed.slice(idx + 1).trim();
          if (!process.env[key] || process.env[key] === "") {
            process.env[key] = val;
          }
        }
      }
    }
  } catch {}
}

loadEnvFallback();

const databaseUrl = process.env["DATABASE_URL"] || "";

export const auth = betterAuth({
  database: new Pool({
    connectionString: databaseUrl,
  }),
  baseURL: process.env["BETTER_AUTH_URL"] ?? process.env["PUBLIC_APP_URL"] ?? "http://localhost:8080",
  secret: process.env["BETTER_AUTH_SECRET"] ?? process.env["JWT_SECRET"] ?? "postpilot-auth-secret-key-32charsmin",
  socialProviders: {
    google: {
      clientId: process.env["GOOGLE_CLIENT_ID"] ?? "",
      clientSecret: process.env["GOOGLE_CLIENT_SECRET"] ?? "",
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  plugins: [
    tanstackStartCookies(),
  ],
});

