/**
 * PostPilot — Database Layer (Neon Serverless Postgres)
 *
 * Uses @neondatabase/serverless which works in Cloudflare Workers
 * via HTTP instead of TCP — no pg pooling config needed.
 *
 * Connection is cached at module level so each Worker invocation
 * reuses the same HTTP client (no cold-start penalty on repeated calls).
 */

import { neon, neonConfig } from "@neondatabase/serverless";

// Neon Serverless driver automatically handles connection caching

let _sql: ReturnType<typeof neon> | null = null;

/**
 * Get the Neon SQL client (cached).
 * DATABASE_URL must be the *pooled* connection string from Neon dashboard.
 */
export function getDb(): ReturnType<typeof neon> {
  if (!_sql) {
    const url = process.env["DATABASE_URL"];
    if (!url) throw new Error("DATABASE_URL environment variable is not set");
    _sql = neon(url);
  }
  return _sql;
}

/**
 * Type-safe query wrapper with automatic error logging.
 */
export async function query<T = Record<string, unknown>>(
  template: TemplateStringsArray,
  ...values: unknown[]
): Promise<T[]> {
  const sql = getDb();
  try {
    const rows = await sql(template, ...values);
    return rows as T[];
  } catch (error) {
    console.error("[DB] Query failed:", error);
    throw error;
  }
}

/**
 * Runs a query and returns the first row or null.
 */
export async function queryOne<T = Record<string, unknown>>(
  template: TemplateStringsArray,
  ...values: unknown[]
): Promise<T | null> {
  const rows = await query<T>(template, ...values);
  return rows[0] ?? null;
}

/**
 * Transaction helper. Note: Neon HTTP transport doesn't support
 * multi-statement transactions — use this for sequential critical ops.
 * For true ACID transactions, swap to neonConfig.wsProxy + Pool.
 */
export async function withTransaction<T>(
  fn: (sql: ReturnType<typeof neon>) => Promise<T>,
): Promise<T> {
  const sql = getDb();
  return fn(sql);
}
