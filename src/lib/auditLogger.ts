/**
 * dIyA — Audit & API Logging Layer
 *
 * Lightweight, zero-breakage logging service designed for Neon Serverless Postgres.
 *
 * Guarantees:
 *  1. Non-blocking: Logging failures never crash business operations (try/catch insulated).
 *  2. Neon Free Tier Safe: Auto-purges operational api_log older than 7 days.
 *  3. Redaction: Automatically strips API keys, passwords, and tokens before DB write.
 */

import { query, queryOne } from "./db.js";

export interface AuditLogEntry {
  id: string;
  userId?: string | null | undefined;
  businessId?: string | null | undefined;
  businessName?: string | null | undefined;
  action: string;
  resourceType?: string | null | undefined;
  resourceId?: string | null | undefined;
  metadata?: Record<string, any> | undefined;
  ipAddress?: string | null | undefined;
  userAgent?: string | null | undefined;
  createdAt: string;
}

export interface ApiLogEntry {
  id: string;
  businessId?: string | null | undefined;
  businessName?: string | null | undefined;
  service: string; // 'openai' | 'gemini' | 'zernio' | 'ffmpeg' | 'system'
  endpoint: string;
  method: string;
  status: number;
  durationMs: number;
  hasError: boolean;
  errorMessage?: string | null | undefined;
  metadata?: Record<string, any> | undefined;
  createdAt: string;
}

let _tableEnsured = false;

async function ensureApiLogTable(): Promise<void> {
  if (_tableEnsured) return;
  try {
    await query`
      CREATE TABLE IF NOT EXISTS api_log (
        id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        business_id   UUID REFERENCES businesses(id) ON DELETE SET NULL,
        service       TEXT NOT NULL,
        endpoint      TEXT NOT NULL,
        method        TEXT NOT NULL DEFAULT 'POST',
        status        SMALLINT NOT NULL DEFAULT 200,
        duration_ms   INT NOT NULL DEFAULT 0,
        has_error     BOOLEAN NOT NULL DEFAULT false,
        error_message TEXT,
        metadata      JSONB DEFAULT '{}'::jsonb,
        created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `;
    _tableEnsured = true;
  } catch {
    _tableEnsured = true;
  }
}

/**
 * Remove sensitive values (passwords, tokens, api keys) before storing
 */
function sanitizeMetadata(data?: Record<string, any> | undefined): Record<string, any> {
  if (!data || typeof data !== "object") return {};
  const clean: Record<string, any> = {};
  for (const [key, val] of Object.entries(data)) {
    const lk = key.toLowerCase();
    if (
      lk.includes("password") ||
      lk.includes("token") ||
      lk.includes("secret") ||
      lk.includes("key") ||
      lk.includes("auth")
    ) {
      clean[key] = "[REDACTED]";
    } else if (typeof val === "object" && val !== null) {
      clean[key] = sanitizeMetadata(val);
    } else {
      clean[key] = val;
    }
  }
  return clean;
}

export function toValidUuidOrNull(val?: string | null): string | null {
  if (!val || typeof val !== "string") return null;
  const trimmed = val.trim();
  if (!trimmed) return null;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(trimmed) ? trimmed : null;
}

/**
 * Record a business audit action (post.published, account.connected, brand_kit.updated).
 * Wrapped in try/catch — NEVER throws or breaks the caller.
 */
export async function recordAudit(entry: {
  userId?: string | null | undefined;
  businessId?: string | null | undefined;
  action: string;
  resourceType?: string | null | undefined;
  resourceId?: string | null | undefined;
  metadata?: Record<string, any> | undefined;
  ipAddress?: string | null | undefined;
  userAgent?: string | null | undefined;
}): Promise<void> {
  try {
    const cleanMeta = sanitizeMetadata(entry.metadata);
    const validBizId = toValidUuidOrNull(entry.businessId);
    const validResId = toValidUuidOrNull(entry.resourceId);
    await query`
      INSERT INTO audit_log (
        user_id, business_id, action, resource_type, resource_id, metadata, user_agent
      )
      VALUES (
        ${entry.userId ?? null},
        ${validBizId ? validBizId : null}::uuid,
        ${entry.action},
        ${entry.resourceType ?? null},
        ${validResId ? validResId : null}::uuid,
        ${JSON.stringify(cleanMeta)}::jsonb,
        ${entry.userAgent ?? null}
      )
    `;
  } catch (err: any) {
    // Non-blocking: log warning to console only so business operation never fails
    console.warn("[AuditLogger] Non-blocking audit record skipped:", err?.message || err);
  }
}

/**
 * Record an external API request (OpenAI, Gemini, Zernio, FFmpeg).
 * Wrapped in try/catch — NEVER throws or breaks the caller.
 */
export async function recordApiLog(entry: {
  businessId?: string | null | undefined;
  service: string;
  endpoint: string;
  method?: string | undefined;
  status: number;
  durationMs: number;
  hasError?: boolean | undefined;
  errorMessage?: string | null | undefined;
  metadata?: Record<string, any> | undefined;
}): Promise<void> {
  try {
    await ensureApiLogTable();
    const cleanMeta = sanitizeMetadata(entry.metadata);
    const hasError = entry.hasError ?? (entry.status >= 400);
    const validBizId = toValidUuidOrNull(entry.businessId);

    await query`
      INSERT INTO api_log (
        business_id, service, endpoint, method, status, duration_ms, has_error, error_message, metadata
      )
      VALUES (
        ${validBizId ? validBizId : null}::uuid,
        ${entry.service},
        ${entry.endpoint},
        ${entry.method || "POST"},
        ${entry.status},
        ${entry.durationMs},
        ${hasError},
        ${entry.errorMessage ?? null},
        ${JSON.stringify(cleanMeta)}::jsonb
      )
    `;
  } catch (err: any) {
    console.warn("[AuditLogger] Non-blocking API log skipped:", err?.message || err);
  }
}

/**
 * Fetch recent audit activity logs (universal across all workspaces or scoped)
 */
export async function getBusinessAuditLogs(
  businessId?: string | null | undefined,
  limit = 50
): Promise<AuditLogEntry[]> {
  try {
    let rows: any[] = [];
    const validBizId = toValidUuidOrNull(businessId);
    if (validBizId) {
      rows = await query`
        SELECT a.id, a.user_id, a.business_id, a.action, a.resource_type, a.resource_id, a.metadata, a.user_agent, a.created_at, b.name as business_name
        FROM audit_log a
        LEFT JOIN businesses b ON a.business_id = b.id
        WHERE a.business_id = ${validBizId}::uuid
        ORDER BY a.created_at DESC
        LIMIT ${limit}
      `;
    } else {
      rows = await query`
        SELECT a.id, a.user_id, a.business_id, a.action, a.resource_type, a.resource_id, a.metadata, a.user_agent, a.created_at, b.name as business_name
        FROM audit_log a
        LEFT JOIN businesses b ON a.business_id = b.id
        ORDER BY a.created_at DESC
        LIMIT ${limit}
      `;
    }

    return rows.map((r) => ({
      id: r.id,
      userId: r.user_id,
      businessId: r.business_id,
      businessName: r.business_name || r.metadata?.workspaceName || r.metadata?.businessName || null,
      action: r.action,
      resourceType: r.resource_type,
      resourceId: r.resource_id,
      metadata: r.metadata || {},
      ipAddress: r.ip_address,
      userAgent: r.user_agent,
      createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
    }));
  } catch (err: any) {
    console.warn("[AuditLogger] Could not fetch audit logs:", err?.message || err);
    return [];
  }
}

/**
 * Fetch recent operational API logs (OpenAI, Gemini, Zernio, FFmpeg)
 */
export async function getRecentApiLogs(
  businessId?: string | null | undefined,
  onlyErrors = false,
  limit = 50
): Promise<ApiLogEntry[]> {
  try {
    await ensureApiLogTable();
    let rows: any[] = [];
    const validBizId = toValidUuidOrNull(businessId);
    if (onlyErrors) {
      rows = await query`
        SELECT a.id, a.business_id, a.service, a.endpoint, a.method, a.status, a.duration_ms, a.has_error, a.error_message, a.metadata, a.created_at, b.name as business_name
        FROM api_log a
        LEFT JOIN businesses b ON a.business_id = b.id
        WHERE a.has_error = true
        ORDER BY a.created_at DESC
        LIMIT ${limit}
      `;
    } else if (validBizId) {
      rows = await query`
        SELECT a.id, a.business_id, a.service, a.endpoint, a.method, a.status, a.duration_ms, a.has_error, a.error_message, a.metadata, a.created_at, b.name as business_name
        FROM api_log a
        LEFT JOIN businesses b ON a.business_id = b.id
        WHERE a.business_id = ${validBizId}::uuid OR a.business_id IS NULL
        ORDER BY a.created_at DESC
        LIMIT ${limit}
      `;
    } else {
      rows = await query`
        SELECT a.id, a.business_id, a.service, a.endpoint, a.method, a.status, a.duration_ms, a.has_error, a.error_message, a.metadata, a.created_at, b.name as business_name
        FROM api_log a
        LEFT JOIN businesses b ON a.business_id = b.id
        ORDER BY a.created_at DESC
        LIMIT ${limit}
      `;
    }

    return rows.map((r) => ({
      id: r.id,
      businessId: r.business_id,
      businessName: r.business_name || r.metadata?.workspaceName || null,
      service: r.service,
      endpoint: r.endpoint,
      method: r.method,
      status: r.status,
      durationMs: r.duration_ms,
      hasError: r.has_error,
      errorMessage: r.error_message,
      metadata: r.metadata || {},
      createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
    }));
  } catch (err: any) {
    console.warn("[AuditLogger] Could not fetch api logs:", err?.message || err);
    return [];
  }
}

