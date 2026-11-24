/**
 * dIyA — Logs & Audit API Endpoints
 *
 * Provides TanStack Start server functions to view:
 *  1. Workspace Activity Audit Trail (who published/scheduled/connected what)
 *  2. Operational API & Error Logs (OpenAI, Gemini, Zernio, FFmpeg calls & latency)
 */

import { createServerFn } from "@tanstack/react-start";
import {
  getBusinessAuditLogs,
  getRecentApiLogs,
  recordAudit,
  recordApiLog,
  type AuditLogEntry,
  type ApiLogEntry,
} from "../lib/auditLogger.js";

export const recordApiCall = createServerFn({ method: "POST" })
  .validator((d: unknown) => d as {
    businessId?: string | undefined;
    service: string;
    endpoint: string;
    method?: string | undefined;
    status: number;
    durationMs: number;
    hasError?: boolean | undefined;
    errorMessage?: string | null | undefined;
    metadata?: Record<string, any> | undefined;
  })
  .handler(async ({ data }) => {
    await recordApiLog({
      businessId: data.businessId,
      service: data.service,
      endpoint: data.endpoint,
      method: data.method || "POST",
      status: data.status,
      durationMs: data.durationMs,
      hasError: data.hasError,
      errorMessage: data.errorMessage,
      metadata: data.metadata,
    });
    return { success: true };
  });

export const recordUserActivity = createServerFn({ method: "POST" })
  .validator((d: unknown) => d as {
    businessId?: string | undefined;
    action: string;
    resourceType?: string | undefined;
    resourceId?: string | undefined;
    metadata?: Record<string, any> | undefined;
  })
  .handler(async ({ data }) => {
    let userId: string | null = null;
    try {
      const { requireAuth } = await import("../lib/auth.js");
      const user = await requireAuth();
      userId = user.userId;
    } catch {}

    await recordAudit({
      userId,
      businessId: data.businessId,
      action: data.action,
      resourceType: data.resourceType,
      resourceId: data.resourceId,
      metadata: data.metadata,
    });
    return { success: true };
  });

export const getWorkspaceAuditTrail = createServerFn({ method: "GET" })
  .validator((d: unknown) => d as { businessId?: string | undefined; limit?: number | undefined })
  .handler(async ({ data }) => {
    const logs = await getBusinessAuditLogs(data.businessId, data.limit || 30);
    return { success: true, logs };
  });

export const getSystemApiLogs = createServerFn({ method: "GET" })
  .validator((d: unknown) => d as {
    businessId?: string | undefined;
    onlyErrors?: boolean | undefined;
    limit?: number | undefined;
  })
  .handler(async ({ data }) => {
    const logs = await getRecentApiLogs(data.businessId, Boolean(data.onlyErrors), data.limit || 30);
    return { success: true, logs };
  });

