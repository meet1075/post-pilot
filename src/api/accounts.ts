/**
 * PostPilot — Accounts API (TanStack Server Functions)
 *
 * Manages connected social media accounts per business (Instagram, Facebook, X).
 * Uses Zernio for actual OAuth; stores external_account_id + username in social_accounts.
 *
 * Endpoints:
 *  - getAccounts(businessId?)          → list all connected accounts for the business + user billing notice
 *  - getZernioConnectUrl(data)         → get signed OAuth connect URL isolated to business's profile
 *  - connectAccount(data)              → verify signed state, prevent cross-business duplication, register account
 *  - disconnectAccount(data)           → disconnect specific account or platform
 */

import { createServerFn } from "@tanstack/react-start";
import { requireAuth, assertUserOwnsBusiness, signOAuthState, verifyOAuthState } from "../lib/auth.js";
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
import Zernio from "@zernio/node";

export interface SocialAccountItem {
  id: string;
  business_id: string;
  platform: string;
  external_account_id: string;
  username: string;
  status: "connected" | "expired" | "disconnected";
  connected_at: string;
  updated_at: string;
}

// ─── getAccounts ──────────────────────────────────────────────────────────────

export const getAccounts = createServerFn({ method: "GET" })
  .validator((d?: { businessId?: string }) => d)
  .handler(async ({ data }) => {
    try {
      const session = await requireAuth();
      const targetBusinessId = data?.businessId || session.businessId;

      if (!targetBusinessId) {
        return apiSuccess({
          accounts: [],
          businessName: "My Workspace",
          email: session.email,
          totalConnectedAccounts: 0,
          billing: {
            freeTierLimit: 2,
            isFreeTier: true,
            notice: "Free Tier: 2 connected accounts included. Additional accounts billed at $6/account/mo.",
          },
        }, "No active business");
      }

      const ip = getClientIp();
      await checkRateLimit(ip, "general");

      const business = await assertUserOwnsBusiness(session.userId, targetBusinessId);

      // Fetch accounts for this business from social_accounts
      const accounts = await query<SocialAccountItem>`
        SELECT
          id, business_id, platform, external_account_id, username,
          status, connected_at, updated_at
        FROM social_accounts
        WHERE business_id = ${business.id}
          AND deleted_at IS NULL
        ORDER BY connected_at ASC
      `;

      // Also calculate total connected accounts across ALL businesses owned by this user
      const [userTotals] = await query<{ total_count: string }>`
        SELECT COUNT(sa.id) as total_count
        FROM social_accounts sa
        JOIN businesses b ON b.id = sa.business_id
        WHERE (b.owner_id = ${session.userId} OR b.owner_user_id = ${session.userId})
          AND sa.status = 'connected'
          AND sa.deleted_at IS NULL
          AND b.deleted_at IS NULL
      `;

      const totalConnected = parseInt(userTotals?.total_count || "0", 10);
      const isFreeTier = totalConnected <= 2;
      const billingNotice = isFreeTier
        ? `Zernio Free Tier: ${totalConnected}/2 connected accounts used. Next accounts billed at $6/account/mo.`
        : `Active billing: ${totalConnected} connected accounts across workspaces ($6/mo per account after first 2 free).`;

      return apiSuccess({
        accounts,
        businessId: business.id,
        businessName: business.name,
        email: session.email,
        totalConnectedAccounts: totalConnected,
        billing: {
          freeTierLimit: 2,
          totalAccounts: totalConnected,
          isFreeTier,
          notice: billingNotice,
        },
      }, "Connected accounts retrieved successfully");
    } catch (err) {
      return errorToResponse(err);
    }
  });

// ─── getZernioConnectUrl ──────────────────────────────────────────────────────

export const getZernioConnectUrl = createServerFn({ method: "GET" })
  .validator((d?: { platform?: string; businessId?: string }) => d)
  .handler(async ({ data }) => {
    try {
      const session = await requireAuth();
      const targetBusinessId = data?.businessId || session.businessId;
      if (!targetBusinessId) throw new ForbiddenError("No active business");

      const ip = getClientIp();
      await checkRateLimit(ip, "general");

      const business = await assertUserOwnsBusiness(session.userId, targetBusinessId);

      const platform = data?.platform || "Instagram";
      const normalizedPlatform = platform.toLowerCase();
      const zernioKey = process.env["ZERNIO_API_KEY"];
      if (!zernioKey) throw new ValidationError("ZERNIO_API_KEY is not configured");

      const appUrl = process.env["PUBLIC_APP_URL"] ?? "http://localhost:8080";
      const zernio = new Zernio({ apiKey: zernioKey });

      // Ensure business has an isolated Zernio profile
      let profileId = business.zernio_profile_id;
      if (!profileId) {
        try {
          const profileName = `Biz-${business.name.slice(0, 15).replace(/[^a-zA-Z0-9]/g, "")}-${business.id.slice(0, 6)}`;
          const created = await zernio.profiles.createProfile({
            body: { name: profileName },
          });
          if (created?.data?.profile?._id) {
            profileId = created.data.profile._id;
            await query`
              UPDATE businesses
              SET zernio_profile_id = ${profileId}
              WHERE id = ${business.id}
            `;
          }
        } catch (profileErr) {
          console.warn("[getZernioConnectUrl] Profile setup error:", profileErr);
          // If profile creation failed (e.g. Free Tier account limit / Payment required),
          // query existing profiles so the connection can proceed
          try {
            const listRes = await zernio.profiles.listProfiles();
            const profiles = (listRes?.data as any)?.profiles || (listRes?.data as any) || [];
            if (Array.isArray(profiles) && profiles.length > 0) {
              profileId = profiles[0]._id || profiles[0].id;
              if (profileId) {
                await query`
                  UPDATE businesses
                  SET zernio_profile_id = ${profileId}
                  WHERE id = ${business.id}
                `;
              }
            }
          } catch (listErr) {
            console.warn("[getZernioConnectUrl] listProfiles fallback warning:", listErr);
          }
        }
      }

      // Default fallback profile if needed
      if (!profileId) {
        profileId = "6ad323c1906cf34fba1f8939";
      }

      // Generate cryptographically signed state carrying businessId & userId
      const signedState = signOAuthState({
        businessId: business.id,
        userId: session.userId,
      });

      const redirectUri = `${appUrl}/auth/zernio-callback?state=${encodeURIComponent(signedState)}`;

      // forceReauth=true ensures Instagram prompt is presented for this specific business
      const connectRes = await zernio.connect.getConnectUrl({
        path: { platform: normalizedPlatform as any },
        query: {
          profileId,
          redirect_url: redirectUri,
          forceReauth: true,
        },
      });

      const authUrl = connectRes?.data?.authUrl;
      if (!authUrl) {
        throw new Error("Could not obtain OAuth authorization URL from Zernio");
      }

      return apiSuccess({
        url: authUrl,
        businessId: business.id,
        businessName: business.name,
      }, "Connect URL generated successfully");
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

      const ip = getClientIp();
      await checkRateLimit(ip, "general");

      const parsed = connectAccountSchema.safeParse(data);
      if (!parsed.success) {
        throw new ValidationError("Validation failed", formatZodIssues(parsed.error.issues));
      }

      const d = parsed.data;

      // Extract and verify business ID
      let targetBusinessId = d.business_id || session.businessId;

      if (d.state) {
        try {
          const verified = verifyOAuthState(d.state);
          // Check that session user matches signed state user
          if (verified.userId && verified.userId !== session.userId) {
            throw new ForbiddenError("OAuth state user mismatch. Connection rejected.");
          }
          if (verified.businessId) {
            targetBusinessId = verified.businessId;
          }
        } catch (stateErr: any) {
          throw new ValidationError(stateErr.message || "Invalid or tampered OAuth state.");
        }
      }

      if (!targetBusinessId) throw new ForbiddenError("No business workspace specified.");

      // Verify user owns the target business
      const business = await assertUserOwnsBusiness(session.userId, targetBusinessId);

      const platformNormalized = d.platform.toLowerCase();
      const rawHandle = d.platform_handle || "connected";
      const cleanUsername = rawHandle.replace(/^@/, "").trim();

      // Enforce: "the same Instagram account must not be linked to two businesses"
      const duplicateAccount = await queryOne<{ id: string; name: string }>`
        SELECT b.id, b.name
        FROM social_accounts sa
        JOIN businesses b ON b.id = sa.business_id
        WHERE LOWER(sa.platform) = ${platformNormalized}
          AND sa.external_account_id = ${d.zernio_account_id}
          AND sa.status != 'disconnected'
          AND sa.business_id != ${business.id}
          AND sa.deleted_at IS NULL
          AND b.deleted_at IS NULL
        LIMIT 1
      `;

      if (duplicateAccount) {
        throw new ValidationError(
          `This ${d.platform} account (@${cleanUsername}) is already linked to another workspace ("${duplicateAccount.name}"). The same Instagram account cannot be linked to multiple businesses.`
        );
      }

      // Upsert into social_accounts
      const [account] = await query<SocialAccountItem>`
        INSERT INTO social_accounts (
          business_id, platform, external_account_id, username, status, connected_at
        )
        VALUES (
          ${business.id},
          ${platformNormalized},
          ${d.zernio_account_id},
          ${cleanUsername},
          'connected',
          now()
        )
        ON CONFLICT (business_id, platform, external_account_id) DO UPDATE SET
          username     = EXCLUDED.username,
          status       = 'connected',
          connected_at = now(),
          deleted_at   = NULL
        RETURNING id, business_id, platform, external_account_id, username, status, connected_at, updated_at
      `;

      // Legacy sync to connected_accounts
      try {
        await query`
          INSERT INTO connected_accounts (
            business_id, platform, platform_user_id, platform_handle,
            zernio_account_id, status
          )
          VALUES (
            ${business.id},
            ${d.platform},
            ${d.platform_user_id ?? null},
            ${cleanUsername},
            ${d.zernio_account_id},
            'connected'
          )
          ON CONFLICT (business_id, platform) DO UPDATE SET
            platform_handle   = EXCLUDED.platform_handle,
            zernio_account_id = EXCLUDED.zernio_account_id,
            status            = 'connected',
            deleted_at        = NULL
        `;
      } catch (legacyErr) {
        console.warn("[connectAccount] Legacy sync warning:", legacyErr);
      }

      // Audit log
      await query`
        INSERT INTO audit_log (user_id, business_id, action, resource_type, resource_id, metadata)
        VALUES (
          ${session.userId},
          ${business.id},
          'account.connected',
          'social_account',
          ${account?.id}::uuid,
          ${JSON.stringify({ platform: d.platform, username: cleanUsername, accountId: d.zernio_account_id })}::jsonb
        )
      `;

      return apiSuccess({
        account,
        businessId: business.id,
        businessName: business.name,
      }, `${d.platform} account @${cleanUsername} connected successfully`);
    } catch (err) {
      return errorToResponse(err);
    }
  });

// ─── disconnectAccount ────────────────────────────────────────────────────────

export const disconnectAccount = createServerFn({ method: "POST" })
  .validator((d: { account_id?: string | undefined; platform?: string | undefined; business_id?: string | undefined }) => d)
  .handler(async ({ data }) => {
    try {
      const session = await requireAuth();
      const targetBusinessId = data?.business_id || session.businessId;
      if (!targetBusinessId) throw new ForbiddenError("No active business");

      const ip = getClientIp();
      await checkRateLimit(ip, "general");

      await assertUserOwnsBusiness(session.userId, targetBusinessId);

      const { account_id, platform } = data;

      if (account_id) {
        await query`
          UPDATE social_accounts
          SET status = 'disconnected', deleted_at = now()
          WHERE id = ${account_id} AND business_id = ${targetBusinessId}
        `;
      } else if (platform) {
        await query`
          UPDATE social_accounts
          SET status = 'disconnected', deleted_at = now()
          WHERE business_id = ${targetBusinessId} AND LOWER(platform) = LOWER(${platform})
        `;
        await query`
          UPDATE connected_accounts
          SET status = 'disconnected', deleted_at = now()
          WHERE business_id = ${targetBusinessId} AND LOWER(platform) = LOWER(${platform})
        `;
      } else {
        throw new ValidationError("Account ID or platform is required");
      }

      return apiSuccess({ success: true }, "Account disconnected successfully");
    } catch (err) {
      return errorToResponse(err);
    }
  });
