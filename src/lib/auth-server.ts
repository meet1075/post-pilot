/**
 * PostPilot — Better Auth Server Configuration
 *
 * Configured with:
 * - Neon PostgreSQL database connection
 * - Google OAuth Social Provider
 * - TanStack Start cookie management plugin
 * - Cloudflare Workers / Serverless runtime compatibility (lazy env sync & clean base URL)
 */

import { betterAuth } from "better-auth";
import { Pool, neonConfig } from "@neondatabase/serverless";
import { tanstackStartCookies } from "better-auth/tanstack-start";

// Force Neon to execute queries via low-latency HTTP fetch instead of WebSockets,
// preventing WebSocket hangs and Cloudflare Error 1101 on Workers edge runtime
if (typeof WebSocket !== "undefined") {
  neonConfig.webSocketConstructor = WebSocket;
}
neonConfig.poolQueryViaFetch = true;

function syncEnv(envObj?: unknown) {
  // Check Cloudflare Worker env passed directly or via Nitro global
  const sources = [
    (globalThis as any).__env__,
    envObj,
  ];
  for (const src of sources) {
    if (src && typeof src === "object") {
      for (const [k, v] of Object.entries(src as Record<string, unknown>)) {
        if (typeof v === "string" && v.trim() !== "") {
          process.env[k] = v;
        }
      }
    }
  }
}

// Initial sync if globalThis.__env__ is already available
syncEnv();

let _auth: any = null;
let _cachedDbUrl = "";
let _activePool: Pool | null = null;

export function getActivePool(): Pool | null {
  return _activePool;
}

export function getAuth(envObj?: unknown, request?: Request): any {
  syncEnv(envObj);

  let rawBaseUrl = process.env["BETTER_AUTH_URL"] ?? process.env["PUBLIC_APP_URL"] ?? "http://localhost:8080";
  let requestOrigin = "";
  if (request) {
    try {
      requestOrigin = new URL(request.url).origin;
      rawBaseUrl = requestOrigin;
    } catch {}
  }
  // Always strip trailing slashes to prevent double slashes in OAuth callback URLs (e.g. "//api/auth/callback/google")
  const cleanBaseUrl = rawBaseUrl.replace(/\/+$/, "");

  const databaseUrl = process.env["DATABASE_URL"] || "";

  if (!_auth || (_cachedDbUrl !== databaseUrl && databaseUrl !== "")) {
    _cachedDbUrl = databaseUrl;
    _activePool = new Pool({
      connectionString: databaseUrl,
      max: 1,
      idleTimeoutMillis: 100,
      maxUses: 1,
    });
    _auth = betterAuth({
      database: _activePool,
      baseURL: cleanBaseUrl,
      trustedOrigins: Array.from(
        new Set([
          cleanBaseUrl,
          requestOrigin,
          "https://post-pilot.meetsoni1075.workers.dev",
          "http://localhost:8080",
          "http://127.0.0.1:8080",
        ])
      ).filter(Boolean),
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
  }

  return _auth;
}

// Proxy export for backward compatibility so `auth.handler(request)` and `auth.api.getSession(...)` work seamlessly
export const auth: any = new Proxy({} as any, {
  get(_target, prop) {
    const instance = getAuth();
    const val = (instance as any)[prop];
    if (typeof val === "function") {
      return val.bind(instance);
    }
    return val;
  },
});
