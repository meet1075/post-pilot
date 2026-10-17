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
import { requireAuth } from "../lib/auth.js";
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
    try {
      const session = await requireAuth();
      if (!session.businessId) throw new ForbiddenError("No active business");

      const ip = getClientIp();
      await checkRateLimit(`business:${session.businessId}`, "publish");

      const parsed = publishPostSchema.safeParse(data);
      if (!parsed.success) {
        throw new ValidationError("Validation failed", formatZodIssues(parsed.error.issues));
      }

      const { post_id, platforms, timing, scheduled_date, scheduled_time } = parsed.data;

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
      }

      // Fetch the post
      const post = await queryOne<PostRow>`
        SELECT * FROM posts
        WHERE id = ${post_id} AND deleted_at IS NULL
      `;
      if (!post) throw new NotFoundError("Post");
      if (post.business_id !== session.businessId) throw new ForbiddenError();

      const primaryPlatform = platforms[0]!;
      log.publish(primaryPlatform, `Publish requested (${timing})`, {
        postId: post_id,
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

      // Get connected accounts for requested platforms
      const account = await queryOne<ConnectedAccountRow>`
        SELECT id, platform, zernio_account_id, status, platform_handle
        FROM connected_accounts
        WHERE business_id = ${session.businessId}
          AND platform = ${primaryPlatform}
          AND deleted_at IS NULL
      `;

      if (!account || account.status !== "connected") {
        throw new AppError(
          `Your ${primaryPlatform} account is not connected. Go to Accounts to connect it.`,
          422
        );
      }

      // Call Zernio
      const zernioResult = await callZernioPublish({
        post: { ...post, image_url: effectiveImageUrl },
        account,
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
          status          = ${newStatus},
          platform        = ${primaryPlatform},
          date            = ${timing === "now" ? localDate : (scheduled_date ?? null)},
          time            = ${timing === "now" ? localTime : (scheduled_time ?? null)},
          image_url       = COALESCE(${effectiveImageUrl ?? null}, image_url),
          zernio_post_id  = ${zernioResult.postId ?? null},
          published_at    = ${timing === "now" ? new Date().toISOString() : null},
          error_message   = NULL
        WHERE id = ${post_id}
        RETURNING *
      `;

      log.db("Neon", `Updated post status to ${newStatus}`, { postId: post_id, status: newStatus, zernioPostId: zernioResult.postId });

      // Audit log
      await query`
        INSERT INTO audit_log (user_id, business_id, action, resource_type, resource_id, metadata)
        VALUES (
          ${session.userId},
          ${session.businessId},
          ${timing === "now" ? "post.published" : "post.scheduled"},
          'post',
          ${post_id}::uuid,
          ${JSON.stringify({ platforms, timing, scheduledAt: scheduledAtIso, zernioPostId: zernioResult.postId })}::jsonb
        )
      `;

      return apiSuccess({ post: updatedPost }, timing === "now" ? "Post published successfully" : "Post scheduled successfully");
    } catch (err) {
      // On failure, update post status to Failed
      const d = data as { post_id?: string } | undefined;
      if (d?.post_id) {
        await query`
          UPDATE posts SET
            status = 'Failed',
            error_message = ${err instanceof Error ? err.message : "Unknown error"}
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
  account: ConnectedAccountRow;
  timing: "now" | "schedule";
  scheduledDate?: string | undefined;
  scheduledTime?: string | undefined;
}): Promise<{ postId: string | null }> {
  const apiKey = process.env["ZERNIO_API_KEY"];
  const baseUrl = process.env["ZERNIO_BASE_URL"] ?? "https://api.zernio.com/v1";

  if (!apiKey) {
    // No Zernio key — simulate success (dev mode)
    log.publish(opts.account.platform, "ZERNIO_API_KEY not set — simulating publish in dev mode");
    return { postId: `sim_${Date.now()}` };
  }

  const body: Record<string, unknown> = {
    content: opts.post.caption,
    mediaItems: [{ url: opts.post.image_url }],
    platforms: [
      {
        platform: opts.post.platform.toLowerCase(),
        accountId: opts.account.zernio_account_id,
      },
    ],
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

  log.publish(opts.account.platform, `Calling Zernio POST ${baseUrl}/posts`, {
    accountId: opts.account.zernio_account_id,
    handle: opts.account.platform_handle || undefined,
    timing: opts.timing,
    scheduledAt: body["scheduledAt"] as string || undefined,
  });

  const response = await fetch(`${baseUrl}/posts`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(20_000),
  });

  if (!response.ok) {
    const text = await response.text();
    log.publish(opts.account.platform, `Zernio Error (${response.status}): ${text.slice(0, 120)}`);
    throw new ExternalServiceError("Zernio", `${response.status}: ${text}`);
  }

  const json = (await response.json()) as {
    data?: { post?: { _id?: string } };
    id?: string;
    postId?: string;
  };
  const finalId = json.data?.post?._id ?? json.id ?? json.postId ?? null;
  log.publish(opts.account.platform, "HTTP 200 OK: Post successfully published via Zernio", { zernioPostId: finalId });
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
