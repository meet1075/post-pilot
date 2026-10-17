/**
 * PostPilot — Posts API (TanStack Server Functions)
 *
 * CRUD operations for social posts.
 * All endpoints require authentication.
 *
 * Endpoints:
 *  - getPosts()          → list all posts for the current business
 *  - getPost(id)         → get a single post
 *  - createPost(data)    → create a draft post
 *  - updatePost(id,data) → update post fields
 *  - deletePost(id)      → soft-delete a post
 */

import { createServerFn } from "@tanstack/react-start";

import { requireAuth } from "../lib/auth.js";
import { query, queryOne } from "../lib/db.js";
import { checkRateLimit, getClientIp } from "../lib/rateLimit.js";
import {
  createPostSchema,
  updatePostSchema,
  uuidSchema,
} from "../lib/validators.js";
import {
  errorToResponse,
  NotFoundError,
  ForbiddenError,
  ValidationError,
} from "../lib/errors.js";
import { log } from "../lib/logger.js";
import { apiSuccess, formatZodIssues } from "../lib/apiResponse.js";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PostRow {
  id: string;
  business_id: string;
  headline: string;
  caption: string;
  prompt: string;
  date: string | null;
  time: string | null;
  status: "Draft" | "Scheduled" | "Posted" | "Failed" | "Cancelled";
  platform: "Instagram" | "Facebook" | "X";
  theme: string;
  price: string;
  image_url: string | null;
  image_r2_key: string | null;
  zernio_post_id: string | null;
  published_at: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

// ─── getPosts ─────────────────────────────────────────────────────────────────

export const getPosts = createServerFn({ method: "GET" })
  .validator((d?: { status?: string }) => d)
  .handler(async ({ data }) => {
    try {
      const session = await requireAuth();
      if (!session.businessId) return { success: true, posts: [] };

      const ip = getClientIp();
      await checkRateLimit(ip, "general");

      // Optional status filter
      const status = data?.status;

      const posts = status
        ? await query<PostRow>`
            SELECT
              id, business_id, headline, caption,
              date::text as date,
              time::text as time,
              status, platform, theme, price, image_url,
              zernio_post_id, published_at, error_message,
              created_at, updated_at
            FROM posts
            WHERE business_id = ${session.businessId}
              AND status = ${status}
              AND deleted_at IS NULL
            ORDER BY
              CASE WHEN status = 'Scheduled' THEN date::text || ' ' || time::text END ASC NULLS LAST,
              created_at DESC
          `
        : await query<PostRow>`
            SELECT
              id, business_id, headline, caption,
              date::text as date,
              time::text as time,
              status, platform, theme, price, image_url,
              zernio_post_id, published_at, error_message,
              created_at, updated_at
            FROM posts
            WHERE business_id = ${session.businessId}
              AND deleted_at IS NULL
            ORDER BY created_at DESC
            LIMIT 200
          `;

      const now = Date.now();
      for (const p of posts) {
        if (p.status === "Scheduled" && p.date && p.time) {
          const schedTime = new Date(`${p.date}T${p.time}`).getTime();
          if (!isNaN(schedTime) && schedTime <= now) {
            p.status = "Posted";
            log.publish(p.platform, "Scheduled post reached scheduled time — transitioning to Posted", {
              id: p.id,
              headline: p.headline,
              date: p.date,
              time: p.time,
            });
            await query`
              UPDATE posts
              SET status = 'Posted', published_at = NOW()
              WHERE id = ${p.id}
            `.catch(() => {});
          }
        }
      }

      log.db("Neon", "Loaded posts from database", { count: posts.length, filter: status || "all" });

      return apiSuccess({ posts }, "Posts retrieved successfully");
    } catch (err) {
      return errorToResponse(err);
    }
  });

// ─── getPost ──────────────────────────────────────────────────────────────────

export const getPost = createServerFn({ method: "GET" })
  .validator((d: { id: string }) => d)
  .handler(async ({ data }) => {
    try {
      const session = await requireAuth();
      const ip = getClientIp();
      await checkRateLimit(ip, "general");

      const { id } = data;
      const parsed = uuidSchema.safeParse(id);
      if (!parsed.success) throw new NotFoundError("Post");

      const post = await queryOne<PostRow>`
        SELECT * FROM posts
        WHERE id = ${id}
          AND deleted_at IS NULL
      `;

      if (!post) throw new NotFoundError("Post");
      if (post.business_id !== session.businessId) throw new ForbiddenError();

      return apiSuccess({ post }, "Post retrieved successfully");
    } catch (err) {
      return errorToResponse(err);
    }
  });

// ─── createPost ───────────────────────────────────────────────────────────────

export const createPost = createServerFn({ method: "POST" })
  .validator((d: unknown) => d)
  .handler(async ({ data }) => {
    try {
      const session = await requireAuth();
      if (!session.businessId) throw new ForbiddenError("No active business");

      const ip = getClientIp();
      await checkRateLimit(ip, "general");

      const parsed = createPostSchema.safeParse(data);
      if (!parsed.success) {
        throw new ValidationError("Validation failed", formatZodIssues(parsed.error.issues));
      }

      const d = parsed.data;

      const [post] = await query<PostRow>`
        INSERT INTO posts (
          business_id, headline, caption, prompt,
          date, time, status, platform, theme, price, image_url
        ) VALUES (
          ${session.businessId},
          ${d.headline},
          ${d.caption},
          ${d.prompt},
          ${d.date ?? null},
          ${d.time ?? null},
          ${d.status},
          ${d.platform},
          ${d.theme},
          ${d.price},
          ${d.image_url ?? null}
        )
        RETURNING *
      `;

      log.db("Neon", "Created post in database", { id: post?.id, headline: post?.headline, status: post?.status, imageUrl: post?.image_url ?? undefined });

      return apiSuccess({ post }, "Post created successfully", 201);
    } catch (err) {
      return errorToResponse(err);
    }
  });

// ─── updatePost ───────────────────────────────────────────────────────────────

export const updatePost = createServerFn({ method: "POST" })
  .validator((d: { id: string } & Record<string, unknown>) => d)
  .handler(async ({ data }) => {
    try {
      const session = await requireAuth();
      const ip = getClientIp();
      await checkRateLimit(ip, "general");

      const { id, ...rest } = data;
      if (!uuidSchema.safeParse(id).success) throw new NotFoundError("Post");

      // Ownership check
      const existing = await queryOne<PostRow>`
        SELECT * FROM posts WHERE id = ${id} AND deleted_at IS NULL
      `;
      if (!existing) throw new NotFoundError("Post");
      if (existing.business_id !== session.businessId) throw new ForbiddenError();

      const parsed = updatePostSchema.safeParse(rest);
      if (!parsed.success) throw new ValidationError("Validation failed", formatZodIssues(parsed.error.issues));

      const d = parsed.data;

      const [post] = await query<PostRow>`
        UPDATE posts SET
          headline      = COALESCE(${d.headline ?? null}, headline),
          caption       = COALESCE(${d.caption ?? null}, caption),
          prompt        = COALESCE(${d.prompt ?? null}, prompt),
          date          = COALESCE(${d.date ?? null}, date),
          time          = COALESCE(${d.time ?? null}, time),
          status        = COALESCE(${d.status ?? null}, status),
          platform      = COALESCE(${d.platform ?? null}, platform),
          theme         = COALESCE(${d.theme ?? null}, theme),
          price         = COALESCE(${d.price ?? null}, price),
          image_url     = COALESCE(${d.image_url ?? null}, image_url),
          image_r2_key  = COALESCE(${d.image_r2_key ?? null}, image_r2_key)
        WHERE id = ${id}
        RETURNING *
      `;

      return apiSuccess({ post }, "Post updated successfully");
    } catch (err) {
      return errorToResponse(err);
    }
  });

// ─── deletePost ───────────────────────────────────────────────────────────────

export const deletePost = createServerFn({ method: "POST" })
  .validator((d: { id: string }) => d)
  .handler(async ({ data }) => {
    try {
      const session = await requireAuth();
      const ip = getClientIp();
      await checkRateLimit(ip, "general");

      const { id } = data;
      if (!uuidSchema.safeParse(id).success) throw new NotFoundError("Post");

      const existing = await queryOne<PostRow>`
        SELECT * FROM posts WHERE id = ${id} AND deleted_at IS NULL
      `;
      if (!existing) throw new NotFoundError("Post");
      if (existing.business_id !== session.businessId) throw new ForbiddenError();

      await query`
        UPDATE posts SET deleted_at = now() WHERE id = ${id}
      `;

      return apiSuccess({ id }, "Post deleted successfully");
    } catch (err) {
      return errorToResponse(err);
    }
  });
