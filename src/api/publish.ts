/**
 * PostPilot — Publish API (TanStack Server Function)
 *
 * Publishes or schedules a post via the Zernio API.
 *
 * Flow:
 *  1. Validate the post + session
 *  2. Verify connected account exists
 *  3. Call Zernio POST /v1/posts with the post image URL and caption
 *  4. Update the DB post status to Posted or Scheduled
 *  5. Store the zernio_post_id for status tracking
 *
 * Config:
 *  ZERNIO_API_KEY   - Zernio API key
 *  ZERNIO_BASE_URL  - e.g. https://api.zernio.com/v1
 */

import { createServerFn } from "@tanstack/react-start";
import { requireAuth, assertUserOwnsBusiness } from "../lib/auth.js";
import { query, queryOne } from "../lib/db.js";
import { checkRateLimit, getClientIp } from "../lib/rateLimit.js";
import { publishPostSchema } from "../lib/validators.js";
import {
  errorToResponse,
  ForbiddenError,
  NotFoundError,
  ValidationError,
  ExternalServiceError,
  AppError,
} from "../lib/errors.js";
import type { PostRow } from "./posts.js";
import { log } from "../lib/logger.js";
import { apiSuccess, formatZodIssues } from "../lib/apiResponse.js";
import { recordApiLog } from "../lib/auditLogger.js";

interface ConnectedAccountRow {
  id: string;
  platform: string;
  zernio_account_id: string;
  status: string;
  platform_handle: string | null;
}

// ─── publishPost ──────────────────────────────────────────────────────────────

export const publishPost = createServerFn({ method: "POST" })
  .validator((d: unknown) => d)
  .handler(async ({ data }) => {
    const publishStartTime = Date.now();
    let currentBusinessId: string | undefined = undefined;
    try {
      const session = await requireAuth();
      if (!session.businessId) throw new ForbiddenError("No active business");
      currentBusinessId = session.businessId;

      const ip = getClientIp();
      await checkRateLimit(`business:${session.businessId}`, "publish");

      const parsed = publishPostSchema.safeParse(data);
      if (!parsed.success) {
        throw new ValidationError("Validation failed", formatZodIssues(parsed.error.issues));
      }

      const { post_id, platforms = ["Instagram"], timing, scheduled_date, scheduled_time, social_account_ids } = parsed.data;

      // Validate scheduled time
      if (timing === "schedule") {
        if (!scheduled_date || !scheduled_time) {
          throw new ValidationError("Scheduled date and time are required", [
            { field: "scheduled_date", message: "Date is required" },
            { field: "scheduled_time", message: "Time is required" },
          ]);
        }
        const scheduledAt = new Date(`${scheduled_date}T${scheduled_time}:00`);
        if (scheduledAt <= new Date()) {
          throw new ValidationError("Scheduled time must be in the future", [
            { field: "scheduled_time", message: "Scheduled time must be in the future" },
          ]);
        }

        // Enforce maximum 10 scheduled posts per business workspace
        const [scheduledCountRow] = await query<{ count: string }>`
          SELECT COUNT(*)::text AS count
          FROM posts
          WHERE business_id = ${session.businessId}
            AND status = 'Scheduled'
            AND id != ${post_id}
            AND deleted_at IS NULL
        `;
        const currentScheduledCount = parseInt(scheduledCountRow?.count || "0", 10);
        if (currentScheduledCount >= 10) {
          throw new ValidationError(
            "Schedule limit reached: You can have a maximum of 10 active scheduled posts at a time. Please wait for an existing scheduled post to publish or delete one before scheduling more.",
            [{ field: "timing", message: "Maximum 10 scheduled posts allowed" }]
          );
        }
      }

      // Fetch the post
      const post = await queryOne<PostRow>`
        SELECT * FROM posts
        WHERE id = ${post_id} AND deleted_at IS NULL
      `;
      if (!post) throw new NotFoundError("Post");

      // Enforce business ownership
      const business = await assertUserOwnsBusiness(session.userId, post.business_id);

      const primaryPlatform = (platforms && platforms[0]) || "Instagram";
      log.publish(primaryPlatform, `Publish requested (${timing})`, {
        postId: post_id,
        businessId: business.id,
        businessName: business.name,
        headline: post.headline,
        hasCustomImage: Boolean(post.image_url),
      });

      // Ensure post has a publishable image
      const effectiveImageUrl =
        post.image_url ||
        "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80";

      if (post.image_url) {
        log.publish(primaryPlatform, "Using custom poster CDN image", { url: post.image_url });
      } else {
        log.publish(primaryPlatform, "Notice: No custom image found on post, falling back to stock image", { url: effectiveImageUrl });
      }

      // Resolve connected accounts for ALL requested accounts / platforms
      const targetAccounts: Array<{
        id: string;
        platform: string;
        zernio_account_id: string;
        status: string;
        platform_handle: string | null;
      }> = [];

      // 1. If explicit social_account_ids provided, resolve all matching active accounts
      if (social_account_ids && social_account_ids.length > 0) {
        const rows = await query<{ id: string; platform: string; external_account_id: string; status: string; username: string }>`
          SELECT id, platform, external_account_id, status, username
          FROM social_accounts
          WHERE business_id = ${business.id}
            AND deleted_at IS NULL
            AND status = 'connected'
        `;
        const idSet = new Set(social_account_ids);
        for (const row of rows) {
          if (idSet.has(row.id)) {
            targetAccounts.push({
              id: row.id,
              platform: row.platform,
              zernio_account_id: row.external_account_id,
              status: row.status,
              platform_handle: row.username,
            });
          }
        }
      }

      // 2. Fallback to resolving by platforms / single social_account_id
      if (targetAccounts.length === 0) {
        const targetSocialAccountId = parsed.data.social_account_id || post.social_account_id;
        const requestedPlatforms = platforms && platforms.length > 0 ? platforms : ["Instagram"];

        for (const p of requestedPlatforms) {
          const pNorm = p.toLowerCase();
          if (targetSocialAccountId) {
            const sa = await queryOne<{ id: string; platform: string; external_account_id: string; status: string; username: string }>`
              SELECT id, platform, external_account_id, status, username
              FROM social_accounts
              WHERE id = ${targetSocialAccountId}
                AND business_id = ${business.id}
                AND LOWER(platform) = ${pNorm}
                AND deleted_at IS NULL
            `;
            if (sa) {
              targetAccounts.push({
                id: sa.id,
                platform: sa.platform,
                zernio_account_id: sa.external_account_id,
                status: sa.status,
                platform_handle: sa.username,
              });
              continue;
            }
          }

          const sa = await queryOne<{ id: string; platform: string; external_account_id: string; status: string; username: string }>`
            SELECT id, platform, external_account_id, status, username
            FROM social_accounts
            WHERE business_id = ${business.id}
              AND LOWER(platform) = ${pNorm}
              AND status = 'connected'
              AND deleted_at IS NULL
            ORDER BY connected_at DESC
            LIMIT 1
          `;
          if (sa) {
            targetAccounts.push({
              id: sa.id,
              platform: sa.platform,
              zernio_account_id: sa.external_account_id,
              status: sa.status,
              platform_handle: sa.username,
            });
          }
        }
      }

      if (targetAccounts.length === 0) {
        throw new AppError(
          `No connected accounts found for "${business.name}". Please connect your accounts in the Accounts tab first.`,
          422
        );
      }

      const resolvedPlatforms = Array.from(new Set(targetAccounts.map((a) => a.platform)));
      const normalizePlatformName = (p?: string): "Instagram" | "Facebook" | "X" => {
        if (!p) return "Instagram";
        const lower = p.toLowerCase();
        if (lower === "facebook") return "Facebook";
        if (lower === "x" || lower === "twitter") return "X";
        return "Instagram";
      };
      const resolvedPrimaryPlatform = normalizePlatformName(targetAccounts[0]?.platform || resolvedPlatforms[0]);
      const platformDisplay = resolvedPlatforms.join(", ") || resolvedPrimaryPlatform;

      // Call Zernio with all target accounts
      const zernioResult = await callZernioPublish({
        post: { ...post, image_url: effectiveImageUrl },
        accounts: targetAccounts,
        timing,
        scheduledDate: scheduled_date,
        scheduledTime: scheduled_time,
      });

      // Update post status in DB
      const newStatus = timing === "now" ? "Posted" : "Scheduled";
      const scheduledAtIso =
        timing === "schedule"
          ? new Date(`${scheduled_date}T${scheduled_time}:00`).toISOString()
          : null;

      const now = new Date();
      const localDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
      const localTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

      const [updatedPost] = await query<PostRow>`
        UPDATE posts SET
          status            = ${newStatus},
          platform          = ${resolvedPrimaryPlatform},
          date              = ${timing === "now" ? localDate : (scheduled_date ?? null)},
          time              = ${timing === "now" ? localTime : (scheduled_time ?? null)},
          image_url         = COALESCE(${effectiveImageUrl ?? null}, image_url),
          social_account_id = ${targetAccounts[0]?.id ?? null},
          zernio_post_id    = ${zernioResult.postId ?? null},
          published_at      = ${timing === "now" ? new Date().toISOString() : null},
          error_message     = NULL
        WHERE id = ${post_id}
        RETURNING *
      `;

      log.db("Neon", `Updated post status to ${newStatus}`, { postId: post_id, status: newStatus, zernioPostId: zernioResult.postId });

      // Audit log
      await query`
        INSERT INTO audit_log (user_id, business_id, action, resource_type, resource_id, metadata)
        VALUES (
          ${session.userId},
          ${business.id},
          ${timing === "now" ? "post.published" : "post.scheduled"},
          'post',
          ${post_id}::uuid,
          ${JSON.stringify({ platforms: resolvedPlatforms, timing, scheduledAt: scheduledAtIso, zernioPostId: zernioResult.postId, socialAccountId: targetAccounts[0]?.id })}::jsonb
        )
      `;

      await recordApiLog({
        businessId: business.id,
        service: "zernio",
        endpoint: "/api/publish",
        method: "POST",
        status: 200,
        durationMs: Date.now() - publishStartTime,
        hasError: false,
        metadata: {
          postId: post_id,
          platforms: resolvedPlatforms,
          timing,
          scheduledAt: scheduledAtIso,
          zernioPostId: zernioResult.postId,
        },
      });

      return apiSuccess({ post: updatedPost }, timing === "now" ? "Post published successfully" : "Post scheduled successfully");
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      const statusCode = (err as any)?.statusCode || ((err as any)?.name === "ValidationError" ? 422 : 500);

      await recordApiLog({
        businessId: currentBusinessId || (data as any)?.business_id,
        service: "zernio",
        endpoint: "/api/publish",
        method: "POST",
        status: statusCode,
        durationMs: Date.now() - publishStartTime,
        hasError: true,
        errorMessage: errMsg,
        metadata: {
          postId: (data as any)?.post_id,
          timing: (data as any)?.timing,
          error: errMsg,
        },
      });

      // On failure, update post status to Failed
      const d = data as { post_id?: string } | undefined;
      if (d?.post_id) {
        await query`
          UPDATE posts SET
            status = 'Failed',
            error_message = ${errMsg}
          WHERE id = ${d.post_id}
        `.catch(() => {});
      }

      return errorToResponse(err);
    }
  });

// ─── getPostStatus ────────────────────────────────────────────────────────────

/** Sync post status from Zernio (call this on the Scheduled Posts page). */
export const syncPostStatus = createServerFn({ method: "POST" })
  .validator((d: { post_id: string }) => d)
  .handler(async ({ data }) => {
    try {
      const session = await requireAuth();
      if (!session.businessId) throw new ForbiddenError();

      const { post_id } = data;
      const post = await queryOne<PostRow>`
        SELECT * FROM posts
        WHERE id = ${post_id} AND business_id = ${session.businessId} AND deleted_at IS NULL
      `;
      if (!post) throw new NotFoundError("Post");
      if (!post.zernio_post_id) return apiSuccess({ status: post.status }, "Post status retrieved");

      const status = await fetchZernioStatus(post.zernio_post_id);

      if (status && status !== post.status) {
        await query`
          UPDATE posts SET status = ${status} WHERE id = ${post_id}
        `;
      }

      return apiSuccess({ status: status ?? post.status }, "Post status synced successfully");
    } catch (err) {
      return errorToResponse(err);
    }
  });

// ─── Zernio API caller ────────────────────────────────────────────────────────

async function callZernioPublish(opts: {
  post: PostRow;
  accounts: Array<{ platform: string; zernio_account_id: string; platform_handle?: string | null }>;
  timing: "now" | "schedule";
  scheduledDate?: string | undefined;
  scheduledTime?: string | undefined;
}): Promise<{ postId: string | null }> {
  const apiKey = process.env["ZERNIO_API_KEY"];
  const baseUrl = process.env["ZERNIO_BASE_URL"] ?? "https://api.zernio.com/v1";

  if (!apiKey) {
    // No Zernio key — simulate success (dev mode)
    log.publish("Multi", "ZERNIO_API_KEY not set — simulating publish in dev mode");
    return { postId: `sim_${Date.now()}` };
  }

  const body: Record<string, unknown> = {
    content: opts.post.caption,
    mediaItems: [{ url: opts.post.image_url }],
    platforms: opts.accounts.map((acc) => ({
      platform: acc.platform.toLowerCase(),
      accountId: acc.zernio_account_id,
    })),
  };

  if (opts.timing === "now") {
    body["publishNow"] = true;
  } else {
    const scheduledAt = new Date(
      `${opts.scheduledDate}T${opts.scheduledTime}:00`
    ).toISOString();
    body["scheduledFor"] = scheduledAt;
    body["scheduledAt"] = scheduledAt;
  }

  const handles = opts.accounts.map((a) => `${a.platform}:@${a.platform_handle || a.zernio_account_id}`).join(", ");
  log.publish("Multi", `Calling Zernio POST ${baseUrl}/posts for destinations [${handles}]`, {
    destinations: opts.accounts.length,
    timing: opts.timing,
    scheduledAt: (body["scheduledAt"] as string) || undefined,
  });

  const startTime = Date.now();
  const response = await fetch(`${baseUrl}/posts`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(20_000),
  });

  let errText: string | null = null;
  if (!response.ok) {
    errText = await response.text();
  }

  await recordApiLog({
    businessId: opts.post.business_id,
    service: "zernio",
    endpoint: `${baseUrl}/posts`,
    method: "POST",
    status: response.status,
    durationMs: Date.now() - startTime,
    hasError: !response.ok,
    errorMessage: errText,
    metadata: { timing: opts.timing, accounts: opts.accounts.length },
  });

  const primaryLogPlatform = opts.accounts[0]?.platform || "Multi";

  if (!response.ok) {
    log.publish(primaryLogPlatform, `Zernio Error (${response.status}): ${(errText || "").slice(0, 120)}`);
    throw new ExternalServiceError("Zernio", `${response.status}: ${errText || "Unknown error"}`);
  }

  const json = (await response.json()) as {
    data?: { post?: { _id?: string } };
    id?: string;
    postId?: string;
  };
  const finalId = json.data?.post?._id ?? json.id ?? json.postId ?? null;
  log.publish(primaryLogPlatform, "HTTP 200 OK: Post successfully published via Zernio", { zernioPostId: finalId });
  return { postId: finalId };
}

async function fetchZernioStatus(zernioPostId: string): Promise<string | null> {
  const apiKey = process.env["ZERNIO_API_KEY"];
  const baseUrl = process.env["ZERNIO_BASE_URL"] ?? "https://api.zernio.com/v1";

  if (!apiKey) return null;

  try {
    const response = await fetch(`${baseUrl}/posts/${zernioPostId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) return null;

    const json = await response.json() as { status?: string };
    const zernioStatus = json.status?.toLowerCase();

    // Map Zernio status to our status
    if (zernioStatus === "published" || zernioStatus === "sent") return "Posted";
    if (zernioStatus === "scheduled" || zernioStatus === "pending") return "Scheduled";
    if (zernioStatus === "failed" || zernioStatus === "error") return "Failed";
    return null;
  } catch {
    return null;
  }
}

/**
 * Cancels a scheduled post on Zernio using its external API endpoint.
 * Deleting a scheduled post in Zernio stops any pending publishing.
 */
export async function callZernioCancel(opts: {
  zernioPostId: string;
  businessId: string;
}): Promise<boolean> {
  const apiKey = process.env["ZERNIO_API_KEY"];
  const baseUrl = process.env["ZERNIO_BASE_URL"] ?? "https://api.zernio.com/v1";

  if (!apiKey) {
    log.publish("Multi", `[callZernioCancel] ZERNIO_API_KEY not configured — simulating cancel for post ${opts.zernioPostId}`);
    return true;
  }

  const startTime = Date.now();
  try {
    const response = await fetch(`${baseUrl}/posts/${opts.zernioPostId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      signal: AbortSignal.timeout(15_000),
    });

    let errText: string | null = null;
    if (!response.ok && response.status !== 404) {
      errText = await response.text().catch(() => "");
    }

    await recordApiLog({
      businessId: opts.businessId,
      service: "zernio",
      endpoint: `${baseUrl}/posts/${opts.zernioPostId}`,
      method: "DELETE",
      status: response.status,
      durationMs: Date.now() - startTime,
      hasError: !response.ok && response.status !== 404,
      errorMessage: errText,
      metadata: { zernioPostId: opts.zernioPostId, action: "cancel" },
    });

    log.publish("Multi", `Zernio cancel request returned status ${response.status}`, { zernioPostId: opts.zernioPostId });
    return response.ok || response.status === 404;
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    log.publish("Multi", `Failed to cancel post in Zernio: ${errMsg}`, { zernioPostId: opts.zernioPostId });
    await recordApiLog({
      businessId: opts.businessId,
      service: "zernio",
      endpoint: `${baseUrl}/posts/${opts.zernioPostId}`,
      method: "DELETE",
      status: 500,
      durationMs: Date.now() - startTime,
      hasError: true,
      errorMessage: errMsg,
      metadata: { zernioPostId: opts.zernioPostId, action: "cancel" },
    });
    return false;
  }
}

/**
 * Reschedules an existing post on Zernio with a new scheduled datetime.
 */
export async function callZernioReschedule(opts: {
  zernioPostId: string;
  scheduledAtIso: string;
  businessId: string;
}): Promise<boolean> {
  const apiKey = process.env["ZERNIO_API_KEY"];
  const baseUrl = process.env["ZERNIO_BASE_URL"] ?? "https://api.zernio.com/v1";

  if (!apiKey) {
    log.publish("Multi", `[callZernioReschedule] ZERNIO_API_KEY not configured — simulating reschedule for post ${opts.zernioPostId}`);
    return true;
  }

  const startTime = Date.now();
  const body = {
    scheduledFor: opts.scheduledAtIso,
    scheduledAt: opts.scheduledAtIso,
  };

  try {
    const response = await fetch(`${baseUrl}/posts/${opts.zernioPostId}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15_000),
    });

    let errText: string | null = null;
    if (!response.ok) {
      errText = await response.text().catch(() => "");
    }

    await recordApiLog({
      businessId: opts.businessId,
      service: "zernio",
      endpoint: `${baseUrl}/posts/${opts.zernioPostId}`,
      method: "PUT",
      status: response.status,
      durationMs: Date.now() - startTime,
      hasError: !response.ok,
      errorMessage: errText,
      metadata: { zernioPostId: opts.zernioPostId, action: "reschedule", scheduledAt: opts.scheduledAtIso },
    });

    log.publish("Multi", `Zernio reschedule request returned status ${response.status}`, { zernioPostId: opts.zernioPostId });
    return response.ok;
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    log.publish("Multi", `Failed to reschedule post in Zernio: ${errMsg}`, { zernioPostId: opts.zernioPostId });
    await recordApiLog({
      businessId: opts.businessId,
      service: "zernio",
      endpoint: `${baseUrl}/posts/${opts.zernioPostId}`,
      method: "PUT",
      status: 500,
      durationMs: Date.now() - startTime,
      hasError: true,
      errorMessage: errMsg,
      metadata: { zernioPostId: opts.zernioPostId, action: "reschedule", scheduledAt: opts.scheduledAtIso },
    });
    return false;
  }
}
