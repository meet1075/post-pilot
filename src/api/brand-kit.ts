/**
 * PostPilot — Brand Kit API (TanStack Server Functions)
 *
 * Endpoints:
 *  - getBrandKit()         → fetch brand kit for current business
 *  - updateBrandKit(data)  → update brand kit fields
 *  - uploadLogo()          → get presigned R2 URL for logo upload
 *  - confirmLogoUpload()   → confirm logo was uploaded, save the URL
 */

import { createServerFn } from "@tanstack/react-start";
import { requireAuth, assertUserOwnsBusiness } from "../lib/auth.js";
import { query, queryOne } from "../lib/db.js";
import { checkRateLimit, getClientIp } from "../lib/rateLimit.js";
import { updateBrandKitSchema } from "../lib/validators.js";
import {
  errorToResponse,
  ForbiddenError,
  ValidationError,
  NotFoundError,
} from "../lib/errors.js";
import { getUploadPresignedUrl, getPublicUrl, buildLogoKey, uploadPosterImage } from "../lib/storage.js";

interface BrandKitRow {
  id: string;
  business_id: string;
  colors: string[];
  font: string;
  logo_r2_key: string | null;
  logo_public_url: string | null;
  caption_tone: string;
  default_hashtags: string;
  created_at: string;
  updated_at: string;
}

// ─── getBrandKit ──────────────────────────────────────────────────────────────

export const getBrandKit = createServerFn({ method: "GET" })
  .validator((d?: { businessId?: string }) => d)
  .handler(async ({ data }) => {
    try {
      const session = await requireAuth();
      const targetBusinessId = data?.businessId || session.businessId;
      if (!targetBusinessId) throw new ForbiddenError("No active business selected");

      const ip = getClientIp();
      await checkRateLimit(ip, "general");

      await assertUserOwnsBusiness(session.userId, targetBusinessId);

      let kit = await queryOne<BrandKitRow>`
        SELECT * FROM brand_kits WHERE business_id = ${targetBusinessId}
      `;

      // Auto-create a default brand kit if none exists
      if (!kit) {
        const [created] = await query<BrandKitRow>`
          INSERT INTO brand_kits (business_id)
          VALUES (${targetBusinessId})
          ON CONFLICT (business_id) DO NOTHING
          RETURNING *
        `;
        kit = created ?? null;
        if (!kit) {
          kit = await queryOne<BrandKitRow>`
            SELECT * FROM brand_kits WHERE business_id = ${targetBusinessId}
          `;
        }
      }

      if (!kit) throw new NotFoundError("Brand kit");

      return { success: true, kit };
    } catch (err) {
      const { error, status } = errorToResponse(err);
      return { success: false, error, status, kit: null };
    }
  });

// ─── updateBrandKit ───────────────────────────────────────────────────────────

export const updateBrandKit = createServerFn({ method: "POST" })
  .validator((d: unknown) => d)
  .handler(async ({ data }) => {
    try {
      const session = await requireAuth();
      const targetBusinessId = (data as any)?.businessId || (data as any)?.business_id || session.businessId;
      if (!targetBusinessId) throw new ForbiddenError("No active business selected");

      const ip = getClientIp();
      await checkRateLimit(ip, "general");

      await assertUserOwnsBusiness(session.userId, targetBusinessId);

      const parsed = updateBrandKitSchema.safeParse(data);
      if (!parsed.success) {
        const fields: Record<string, string[]> = {};
        parsed.error.issues.forEach((i) => {
          const key = i.path.join(".");
          fields[key] = [...(fields[key] ?? []), i.message];
        });
        throw new ValidationError("Invalid brand kit data", fields);
      }

      const d = parsed.data;

      // Upsert brand kit
      const [kit] = await query<BrandKitRow>`
        INSERT INTO brand_kits (business_id, colors, font, caption_tone, default_hashtags)
        VALUES (
          ${targetBusinessId},
          ARRAY(SELECT jsonb_array_elements_text(${JSON.stringify(d.colors && d.colors.length > 0 ? d.colors : ["Tomato", "Olive"])}::jsonb)),
          ${d.font ?? "Fraunces"},
          ${d.caption_tone ?? "Friendly"},
          ${d.default_hashtags ?? ""}
        )
        ON CONFLICT (business_id) DO UPDATE SET
          colors           = CASE
                               WHEN ${Boolean(d.colors && d.colors.length > 0)}
                               THEN ARRAY(SELECT jsonb_array_elements_text(${JSON.stringify(d.colors || [])}::jsonb))
                               ELSE brand_kits.colors
                             END,
          font             = COALESCE(${d.font ?? null}, brand_kits.font),
          caption_tone     = COALESCE(${d.caption_tone ?? null}, brand_kits.caption_tone),
          default_hashtags = COALESCE(${d.default_hashtags ?? null}, brand_kits.default_hashtags),
          updated_at       = now()
        RETURNING *
      `;

      // Keep businesses table in sync
      await query`
        UPDATE businesses SET
          brand_colors     = CASE
                               WHEN ${Boolean(d.colors && d.colors.length > 0)}
                               THEN ARRAY(SELECT jsonb_array_elements_text(${JSON.stringify(d.colors || [])}::jsonb))
                               ELSE brand_colors
                             END,
          tone             = COALESCE(${d.caption_tone ?? null}, tone),
          default_hashtags = COALESCE(${d.default_hashtags ?? null}, default_hashtags),
          updated_at       = now()
        WHERE id = ${targetBusinessId}
      `;

      return { success: true, kit };
    } catch (err) {
      const { error, status } = errorToResponse(err);
      return { success: false, error, status, kit: null };
    }
  });

// ─── getLogoUploadUrl ─────────────────────────────────────────────────────────

export const getLogoUploadUrl = createServerFn({ method: "POST" })
  .validator((d?: { ext?: string }) => d)
  .handler(async ({ data }) => {
    try {
      const session = await requireAuth();
      if (!session.businessId) throw new ForbiddenError("No active business");

      const ip = getClientIp();
      await checkRateLimit(ip, "upload");

      const { ext = "png" } = data ?? {};
      const safeExt = ["png", "jpg", "jpeg", "webp", "svg"].includes(ext) ? ext : "png";
      const key = buildLogoKey(session.businessId, safeExt);
      const uploadUrl = await getUploadPresignedUrl(key);
      const publicUrl = getPublicUrl(key);

      return { success: true, uploadUrl, key, publicUrl };
    } catch (err) {
      const { error, status } = errorToResponse(err);
      return { success: false, error, status };
    }
  });

// ─── uploadBrandLogo ──────────────────────────────────────────────────────────

export const uploadBrandLogo = createServerFn({ method: "POST" })
  .validator((d: { dataUrl: string; filename?: string; businessId?: string }) => d)
  .handler(async ({ data }) => {
    try {
      const ip = getClientIp();
      await checkRateLimit(ip, "upload");

      let businessId = data.businessId || "general";
      try {
        const session = await requireAuth();
        if (session.businessId && !data.businessId) businessId = session.businessId;
      } catch {
        // Fallback for workspace without active auth session
      }

      const match = data.dataUrl.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/);
      const contentType: string = (match && match[1]) ? match[1] : "image/png";
      const base64Content: string = (match && match[2]) ? match[2] : data.dataUrl.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64Content, "base64");

      const sanitizedName = (data.filename || "logo").replace(/[^a-zA-Z0-9._-]/g, "_");
      const key = `logos/${businessId}/${Date.now()}-${sanitizedName}`;

      const { publicUrl } = await uploadPosterImage({
        key,
        body: buffer,
        contentType,
      });

      if (businessId !== "general") {
        try {
          await query`
            UPDATE brand_kits
            SET logo_r2_key = ${key}, logo_public_url = ${publicUrl}
            WHERE business_id = ${businessId}
          `;
          await query`
            UPDATE businesses
            SET logo_url = ${publicUrl}
            WHERE id = ${businessId}
          `;
        } catch (dbErr) {
          console.warn("[uploadBrandLogo] DB update warning:", dbErr);
        }
      }

      return { success: true, publicUrl, key };
    } catch (err) {
      const { error, status } = errorToResponse(err);
      return { success: false, error, status };
    }
  });

