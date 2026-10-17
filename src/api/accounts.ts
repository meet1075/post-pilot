/**
 * PostPilot — Accounts API (TanStack Server Functions)
 *
 * Manages connected social media accounts (Instagram, Facebook, X).
 * Uses Zernio for actual OAuth; we store the zernio_account_id + handle.
 *
 * Endpoints:
 *  - getAccounts()                   → list all connected accounts
 *  - connectAccount(data)            → record a newly-connected account (post-Zernio OAuth)
 *  - disconnectAccount(platform)     → soft-delete a connected account
 *  - getZernioConnectUrl(platform)   → get the Zernio OAuth URL for connecting
 */

import { createServerFn } from "@tanstack/react-start";
import { requireAuth } from "../lib/auth.js";
import { query, queryOne } from "../lib/db.js";
import { checkRateLimit, getClientIp } from "../lib/rateLimit.js";
import { connectAccountSchema } from "../lib/validators.js";
import {
  errorToResponse,
  ForbiddenError,
  ValidationError,
  NotFoundError,
} from "../lib/errors.js";
import { apiSuccess, formatZodIssues } from "../lib/apiResponse.js";

interface ConnectedAccountRow {
  id: string;
  business_id: string;
  platform: string;
  platform_user_id: string | null;
  platform_handle: string | null;
  zernio_account_id: string | null;
  status: string;
  connected_at: string;
  updated_at: string;
}

// ─── getAccounts ──────────────────────────────────────────────────────────────

export const getAccounts = createServerFn({ method: "GET" }).handler(
  async () => {
    try {
      const session = await requireAuth();
      if (!session.businessId) {
        return { success: true, accounts: [], businessName: "My Workspace", email: session.email };
      }

      const ip = getClientIp();
      await checkRateLimit(ip, "general");

      const business = await queryOne<{ id: string; name: string }>`
        SELECT id, name FROM businesses WHERE id = ${session.businessId}
      `;

      const accounts = await query<ConnectedAccountRow>`
        SELECT id, business_id, platform, platform_user_id, platform_handle,
               zernio_account_id, status, connected_at, updated_at
        FROM connected_accounts
        WHERE business_id = ${session.businessId}
          AND deleted_at IS NULL
        ORDER BY connected_at ASC
      `;

      return apiSuccess({
        accounts,
        businessName: business?.name ?? "My Workspace",
        email: session.email,
      }, "Connected accounts retrieved successfully");
    } catch (err) {
      return errorToResponse(err);
    }
  }
);

// ─── getZernioConnectUrl ──────────────────────────────────────────────────────

export const getZernioConnectUrl = createServerFn({ method: "GET" })
  .validator((d?: { platform?: string }) => d)
  .handler(async ({ data }) => {
    try {
      const session = await requireAuth();
      if (!session.businessId) throw new ForbiddenError("No active business");

      const ip = getClientIp();
      await checkRateLimit(ip, "general");

      const platform = data?.platform || "Instagram";
      const normalizedPlatform = platform.toLowerCase();
      const zernioKey = process.env["ZERNIO_API_KEY"];
      const appUrl = process.env["PUBLIC_APP_URL"] ?? "http://localhost:8080";

      // Zernio connect flow — generate a unique state token to prevent CSRF
      const state = Buffer.from(
        JSON.stringify({ businessId: session.businessId, platform, ts: Date.now() })
      ).toString("base64url");

      const redirectUri = `${appUrl}/auth/zernio-callback`;
      const connectUrl = `https://app.zernio.com/connect?platform=${normalizedPlatform}&state=${state}&redirect_uri=${encodeURIComponent(redirectUri)}`;

      return apiSuccess({ url: connectUrl }, "Connect URL generated successfully");
    } catch (err) {
      return errorToResponse(err);
    }
  });

// ─── connectAccount ───────────────────────────────────────────────────────────

export const connectAccount = createServerFn({ method: "POST" })
  .validator((d: unknown) => d)
  .handler(async ({ data }) => {
    try {
      const session = await requireAuth();
      if (!session.businessId) throw new ForbiddenError("No active business");

      const ip = getClientIp();
      await checkRateLimit(ip, "general");

      const parsed = connectAccountSchema.safeParse(data);
      if (!parsed.success) {
        throw new ValidationError("Validation failed", formatZodIssues(parsed.error.issues));
      }

      const d = parsed.data;

      const [account] = await query<ConnectedAccountRow>`
        INSERT INTO connected_accounts (
          business_id, platform, platform_user_id, platform_handle,
          zernio_account_id, status
        )
        VALUES (
          ${session.businessId},
          ${d.platform},
          ${d.platform_user_id ?? null},
          ${d.platform_handle ?? null},
          ${d.zernio_account_id},
          'connected'
        )
        ON CONFLICT (business_id, platform) DO UPDATE SET
          platform_user_id  = COALESCE(EXCLUDED.platform_user_id, connected_accounts.platform_user_id),
          platform_handle   = COALESCE(EXCLUDED.platform_handle, connected_accounts.platform_handle),
          zernio_account_id = EXCLUDED.zernio_account_id,
          status            = 'connected',
          deleted_at        = NULL
        RETURNING id, business_id, platform, platform_user_id, platform_handle,
                  zernio_account_id, status, connected_at, updated_at
      `;

      // Audit log
      await query`
        INSERT INTO audit_log (user_id, business_id, action, resource_type, resource_id, metadata)
        VALUES (
          ${session.userId},
          ${session.businessId},
          'account.connected',
          'connected_account',
          ${account?.id}::uuid,
          ${JSON.stringify({ platform: d.platform, handle: d.platform_handle })}::jsonb
        )
      `;

      return apiSuccess({ account }, "Account connected successfully");
    } catch (err) {
      return errorToResponse(err);
    }
  });

// ─── disconnectAccount ────────────────────────────────────────────────────────

export const disconnectAccount = createServerFn({ method: "POST" })
  .validator((d: { platform: string }) => d)
  .handler(async ({ data }) => {
    try {
      const session = await requireAuth();
      if (!session.businessId) throw new ForbiddenError("No active business");

      const ip = getClientIp();
      await checkRateLimit(ip, "general");

      const { platform } = data;

      const existing = await queryOne<ConnectedAccountRow>`
        SELECT * FROM connected_accounts
        WHERE business_id = ${session.businessId}
          AND platform = ${platform}
          AND deleted_at IS NULL
      `;
      if (!existing) throw new NotFoundError("Connected account");

      await query`
        UPDATE connected_accounts
        SET status = 'disconnected', deleted_at = now()
        WHERE id = ${existing.id}
      `;

      return apiSuccess({ platform }, "Account disconnected successfully");
    } catch (err) {
      return errorToResponse(err);
    }
  });
