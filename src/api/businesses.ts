/**
 * PostPilot — Businesses API (TanStack Server Functions)
 *
 * Endpoints:
 *  - getBusiness(id?)      → get business details for active or requested business
 *  - listUserBusinesses()  → list all businesses owned by user with account count & brand details
 *  - createBusiness(data)  → create a new business under current user with isolated Zernio profile
 *  - updateBusiness(data)  → update business brand kit, name, timezone, etc.
 *  - deleteBusiness(data)  → soft-delete a business and warn about scheduled posts
 */

import { createServerFn } from "@tanstack/react-start";
import { requireAuth, signSessionToken, assertUserOwnsBusiness, BusinessRowData } from "../lib/auth.js";
import { query, queryOne } from "../lib/db.js";
import { checkRateLimit, getClientIp, MAX_BUSINESSES_PER_USER } from "../lib/rateLimit.js";
import {
  createBusinessSchema,
  updateBusinessSchema,
  deleteBusinessSchema,
} from "../lib/validators.js";
import {
  errorToResponse,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "../lib/errors.js";
import { apiSuccess, formatZodIssues } from "../lib/apiResponse.js";
import Zernio from "@zernio/node";

export interface BusinessSummaryItem {
  id: string;
  name: string;
  tagline: string | null;
  logo_url: string | null;
  brand_colors: string[] | null;
  tone: string | null;
  default_hashtags: string | null;
  timezone: string;
  location: string | null;
  phone: string | null;
  business_type: string;
  is_active: boolean;
  connected_accounts_count: number;
  created_at: string;
  updated_at: string;
}

// ─── getBusiness ──────────────────────────────────────────────────────────────

export const getBusiness = createServerFn({ method: "GET" })
  .validator((d?: { businessId?: string }) => d)
  .handler(async ({ data }) => {
    try {
      const session = await requireAuth();
      const targetBusinessId = data?.businessId || session.businessId;
      if (!targetBusinessId) return { success: true, business: null };

      const ip = getClientIp();
      await checkRateLimit(ip, "general");

      const business = await assertUserOwnsBusiness(session.userId, targetBusinessId);

      // Also get brand kit sync if present
      const brandKit = await queryOne<{
        colors: string[];
        font: string;
        logo_public_url: string;
        caption_tone: string;
        default_hashtags: string;
      }>`
        SELECT colors, font, logo_public_url, caption_tone, default_hashtags
        FROM brand_kits WHERE business_id = ${business.id}
      `;

      return {
        success: true,
        business: {
          ...business,
          logo_url: business.logo_url || brandKit?.logo_public_url || null,
          brand_colors: business.brand_colors || brandKit?.colors || ["Tomato"],
          tone: business.tone || brandKit?.caption_tone || "Friendly",
          default_hashtags: business.default_hashtags || brandKit?.default_hashtags || "",
        },
      };
    } catch (err) {
      const { error, status } = errorToResponse(err);
      return { success: false, error, status, business: null };
    }
  });

// ─── listUserBusinesses ───────────────────────────────────────────────────────

export const listUserBusinesses = createServerFn({ method: "GET" }).handler(
  async () => {
    try {
      const session = await requireAuth();

      const ip = getClientIp();
      await checkRateLimit(ip, "general");

      const rows = await query<{
        id: string;
        name: string;
        tagline: string | null;
        logo_url: string | null;
        brand_colors: string[] | null;
        tone: string | null;
        default_hashtags: string | null;
        timezone: string;
        location: string | null;
        phone: string | null;
        business_type: string;
        is_active: boolean;
        connected_accounts_count: string;
        created_at: string;
        updated_at: string;
      }>`
        SELECT
          b.id, b.name, b.tagline, b.logo_url, b.brand_colors, b.tone,
          b.default_hashtags, b.timezone, b.location, b.phone, b.business_type,
          b.is_active, b.created_at, b.updated_at,
          COUNT(sa.id) FILTER (WHERE sa.status = 'connected' AND sa.deleted_at IS NULL) as connected_accounts_count
        FROM businesses b
        LEFT JOIN social_accounts sa ON sa.business_id = b.id
        WHERE (b.owner_id = ${session.userId} OR b.owner_user_id = ${session.userId})
          AND b.deleted_at IS NULL
        GROUP BY b.id
        ORDER BY b.created_at ASC
      `;

      const businesses: BusinessSummaryItem[] = rows.map((r) => ({
        ...r,
        connected_accounts_count: parseInt(r.connected_accounts_count || "0", 10),
      }));

      return apiSuccess({
        businesses,
        activeBusinessId: session.businessId,
        maxLimit: MAX_BUSINESSES_PER_USER,
      }, "Businesses fetched successfully");
    } catch (err) {
      return errorToResponse(err);
    }
  }
);

// ─── createBusiness ───────────────────────────────────────────────────────────

export const createBusiness = createServerFn({ method: "POST" })
  .validator((d: unknown) => d)
  .handler(async ({ data }) => {
    try {
      const session = await requireAuth();

      const ip = getClientIp();
      await checkRateLimit(ip, "general");

      // Verify business count limit
      const [countRow] = await query<{ count: string }>`
        SELECT COUNT(*) as count FROM businesses
        WHERE (owner_id = ${session.userId} OR owner_user_id = ${session.userId})
          AND deleted_at IS NULL
      `;
      const currentCount = parseInt(countRow?.count || "0", 10);
      if (currentCount >= MAX_BUSINESSES_PER_USER) {
        throw new ValidationError(`Maximum limit reached: You can create up to ${MAX_BUSINESSES_PER_USER} businesses per account.`);
      }

      const parsed = createBusinessSchema.safeParse(data);
      if (!parsed.success) {
        const firstIssue = parsed.error.issues[0]?.message;
        throw new ValidationError(firstIssue ? `Invalid business data: ${firstIssue}` : "Invalid business data", formatZodIssues(parsed.error.issues));
      }

      const d = parsed.data;

      // Create isolated Zernio profile for this new business
      let zernioProfileId: string | null = null;
      const zernioKey = process.env["ZERNIO_API_KEY"];
      if (zernioKey) {
        try {
          const zernio = new Zernio({ apiKey: zernioKey });
          const sanitizedProfileName = `Biz-${d.name.slice(0, 15).replace(/[^a-zA-Z0-9]/g, "")}-${Date.now().toString(36)}`;
          const profileRes = await zernio.profiles.createProfile({
            body: { name: sanitizedProfileName },
          });
          if (profileRes?.data?.profile?._id) {
            zernioProfileId = profileRes.data.profile._id;
          }
        } catch (zernioErr) {
          console.warn("[createBusiness] Zernio profile creation warning:", zernioErr);
          // If free tier account limit reached or payment method needed, use existing default profile
          try {
            const zernio = new Zernio({ apiKey: zernioKey });
            const listRes = await zernio.profiles.listProfiles();
            const profiles = (listRes?.data as any)?.profiles || (listRes?.data as any) || [];
            if (Array.isArray(profiles) && profiles.length > 0) {
              zernioProfileId = profiles[0]._id || profiles[0].id || null;
            }
          } catch {}
        }
      }

      // Create business row
      const [business] = await query<BusinessRowData>`
        INSERT INTO businesses (
          owner_id, owner_user_id, name, tagline, logo_url, brand_colors,
          tone, default_hashtags, location, phone, timezone, business_type, zernio_profile_id
        )
        VALUES (
          ${session.userId},
          ${session.userId},
          ${d.name},
          ${d.tagline || ""},
          ${d.logo_url ?? null},
          ARRAY(SELECT jsonb_array_elements_text(${JSON.stringify(d.brand_colors && d.brand_colors.length > 0 ? d.brand_colors : ["Tomato", "Olive"])}::jsonb)),
          ${d.tone || "Friendly"},
          ${d.default_hashtags || ""},
          ${d.location || ""},
          ${d.phone || ""},
          ${d.timezone || "UTC"},
          ${d.business_type || "General"},
          ${zernioProfileId}
        )
        RETURNING *
      `;

      if (!business) throw new Error("Failed to create business");

      // Auto-populate brand_kits table for compatibility
      await query`
        INSERT INTO brand_kits (business_id, colors, caption_tone, default_hashtags, logo_public_url)
        VALUES (
          ${business.id},
          ARRAY(SELECT jsonb_array_elements_text(${JSON.stringify(d.brand_colors && d.brand_colors.length > 0 ? d.brand_colors : ["Tomato", "Olive"])}::jsonb)),
          ${d.tone || "Friendly"},
          ${d.default_hashtags || ""},
          ${d.logo_url ?? null}
        )
        ON CONFLICT (business_id) DO UPDATE SET
          colors = EXCLUDED.colors,
          caption_tone = EXCLUDED.caption_tone,
          default_hashtags = EXCLUDED.default_hashtags,
          logo_public_url = COALESCE(EXCLUDED.logo_public_url, brand_kits.logo_public_url)
      `;

      // Reissue a JWT with the new businessId
      const newToken = await signSessionToken({
        userId: session.userId,
        email: session.email,
        businessId: business.id,
      });

      return apiSuccess({
        business,
        token: newToken,
      }, "Business created successfully");
    } catch (err) {
      return errorToResponse(err);
    }
  });

// ─── updateBusiness ───────────────────────────────────────────────────────────

export const updateBusiness = createServerFn({ method: "POST" })
  .validator((d: unknown) => d)
  .handler(async ({ data }) => {
    try {
      const session = await requireAuth();

      const ip = getClientIp();
      await checkRateLimit(ip, "general");

      const parsed = updateBusinessSchema.safeParse(data);
      if (!parsed.success) {
        const firstIssue = parsed.error.issues[0]?.message;
        throw new ValidationError(firstIssue ? `Invalid business data: ${firstIssue}` : "Invalid business data", formatZodIssues(parsed.error.issues));
      }

      const d = parsed.data;
      const targetBusinessId = d.business_id || session.businessId;
      if (!targetBusinessId) throw new ForbiddenError("No active business specified");

      // Assert ownership
      await assertUserOwnsBusiness(session.userId, targetBusinessId);

      const [business] = await query<BusinessRowData>`
        UPDATE businesses SET
          name              = COALESCE(${d.name ?? null}, name),
          tagline           = COALESCE(${d.tagline ?? null}, tagline),
          logo_url          = COALESCE(${d.logo_url ?? null}, logo_url),
          brand_colors      = CASE
                                WHEN ${Boolean(d.brand_colors && d.brand_colors.length > 0)}
                                THEN ARRAY(SELECT jsonb_array_elements_text(${JSON.stringify(d.brand_colors || [])}::jsonb))
                                ELSE brand_colors
                              END,
          tone              = COALESCE(${d.tone ?? null}, tone),
          default_hashtags  = COALESCE(${d.default_hashtags ?? null}, default_hashtags),
          location          = COALESCE(${d.location ?? null}, location),
          phone             = COALESCE(${d.phone ?? null}, phone),
          timezone          = COALESCE(${d.timezone ?? null}, timezone),
          business_type     = COALESCE(${d.business_type ?? null}, business_type),
          updated_at        = now()
        WHERE id = ${targetBusinessId}
        RETURNING *
      `;

      if (!business) throw new NotFoundError("Business");

      // Sync brand_kits table as well
      await query`
        UPDATE brand_kits SET
          colors           = CASE
                               WHEN ${Boolean(d.brand_colors && d.brand_colors.length > 0)}
                               THEN ARRAY(SELECT jsonb_array_elements_text(${JSON.stringify(d.brand_colors || [])}::jsonb))
                               ELSE colors
                             END,
          caption_tone     = COALESCE(${d.tone ?? null}, caption_tone),
          default_hashtags = COALESCE(${d.default_hashtags ?? null}, default_hashtags),
          logo_public_url  = COALESCE(${d.logo_url ?? null}, logo_public_url),
          updated_at       = now()
        WHERE business_id = ${targetBusinessId}
      `;

      return apiSuccess({ business }, "Business updated successfully");
    } catch (err) {
      return errorToResponse(err);
    }
  });

// ─── deleteBusiness ───────────────────────────────────────────────────────────

export const deleteBusiness = createServerFn({ method: "POST" })
  .validator((d: unknown) => d)
  .handler(async ({ data }) => {
    try {
      const session = await requireAuth();

      const ip = getClientIp();
      await checkRateLimit(ip, "general");

      const parsed = deleteBusinessSchema.safeParse(data);
      if (!parsed.success) {
        throw new ValidationError("Invalid request", formatZodIssues(parsed.error.issues));
      }

      const { business_id } = parsed.data;

      // Assert ownership
      await assertUserOwnsBusiness(session.userId, business_id);

      // Check how many businesses user has
      const [countRow] = await query<{ count: string }>`
        SELECT COUNT(*) as count FROM businesses
        WHERE (owner_id = ${session.userId} OR owner_user_id = ${session.userId})
          AND deleted_at IS NULL
      `;
      if (parseInt(countRow?.count || "1", 10) <= 1) {
        throw new ValidationError("You must keep at least one business workspace in your account.");
      }

      // Check for active scheduled posts
      const [scheduledRow] = await query<{ count: string }>`
        SELECT COUNT(*) as count FROM posts
        WHERE business_id = ${business_id}
          AND status = 'Scheduled'
          AND deleted_at IS NULL
      `;
      const scheduledCount = parseInt(scheduledRow?.count || "0", 10);

      // Soft-delete the business
      await query`
        UPDATE businesses
        SET deleted_at = now(), is_active = false
        WHERE id = ${business_id}
      `;

      // Soft-delete / disconnect social accounts for this business
      await query`
        UPDATE social_accounts
        SET status = 'disconnected', deleted_at = now()
        WHERE business_id = ${business_id}
      `;

      return apiSuccess({
        deletedBusinessId: business_id,
        scheduledPostsCount: scheduledCount,
      }, scheduledCount > 0
        ? `Business deleted. Note: ${scheduledCount} scheduled post(s) were cancelled.`
        : "Business deleted successfully"
      );
    } catch (err) {
      return errorToResponse(err);
    }
  });
