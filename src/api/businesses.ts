/**
 * PostPilot — Businesses API (TanStack Server Functions)
 *
 * Endpoints:
 *  - getBusiness()         → get current business details
 *  - updateBusiness(data)  → update business name, tagline, timezone, etc.
 *  - createBusiness(data)  → create a new business under current user
 */

import { createServerFn } from "@tanstack/react-start";
import { requireAuth, signSessionToken } from "../lib/auth.js";
import { query, queryOne } from "../lib/db.js";
import { checkRateLimit, getClientIp } from "../lib/rateLimit.js";
import { createBusinessSchema, updateBusinessSchema } from "../lib/validators.js";
import {
  errorToResponse,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "../lib/errors.js";

interface BusinessRow {
  id: string;
  owner_id: string;
  name: string;
  tagline: string;
  location: string;
  phone: string;
  timezone: string;
  business_type: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ─── getBusiness ──────────────────────────────────────────────────────────────

export const getBusiness = createServerFn({ method: "GET" }).handler(
  async () => {
    try {
      const session = await requireAuth();
      if (!session.businessId) return { success: true, business: null };

      const ip = getClientIp();
      await checkRateLimit(ip, "general");

      const business = await queryOne<BusinessRow>`
        SELECT id, owner_id, name, tagline, location, phone, timezone, business_type, is_active, created_at, updated_at
        FROM businesses
        WHERE id = ${session.businessId} AND deleted_at IS NULL
      `;

      if (!business) throw new NotFoundError("Business");

      return { success: true, business };
    } catch (err) {
      const { error, status } = errorToResponse(err);
      return { success: false, error, status, business: null };
    }
  }
);

// ─── updateBusiness ───────────────────────────────────────────────────────────

export const updateBusiness = createServerFn({ method: "POST" })
  .validator((d: unknown) => d)
  .handler(async ({ data }) => {
    try {
      const session = await requireAuth();
      if (!session.businessId) throw new ForbiddenError("No active business");

      const ip = getClientIp();
      await checkRateLimit(ip, "general");

      const parsed = updateBusinessSchema.safeParse(data);
      if (!parsed.success) {
        const fields: Record<string, string[]> = {};
        parsed.error.issues.forEach((i) => {
          const key = i.path.join(".");
          fields[key] = [...(fields[key] ?? []), i.message];
        });
        throw new ValidationError("Invalid business data", fields);
      }

      const d = parsed.data;

      const [business] = await query<BusinessRow>`
        UPDATE businesses SET
          name          = COALESCE(${d.name ?? null}, name),
          tagline       = COALESCE(${d.tagline ?? null}, tagline),
          location      = COALESCE(${d.location ?? null}, location),
          phone         = COALESCE(${d.phone ?? null}, phone),
          timezone      = COALESCE(${d.timezone ?? null}, timezone),
          business_type = COALESCE(${d.business_type ?? null}, business_type)
        WHERE id = ${session.businessId}
          AND owner_id = ${session.userId}
        RETURNING id, owner_id, name, tagline, location, phone, timezone, business_type, is_active, created_at, updated_at
      `;

      if (!business) throw new ForbiddenError();

      return { success: true, business };
    } catch (err) {
      const { error, status } = errorToResponse(err);
      return { success: false, error, status, business: null };
    }
  });

// ─── createBusiness ───────────────────────────────────────────────────────────

export const createBusiness = createServerFn({ method: "POST" })
  .validator((d: unknown) => d)
  .handler(async ({ data }) => {
    try {
      const session = await requireAuth();

      const ip = getClientIp();
      await checkRateLimit(ip, "general");

      const parsed = createBusinessSchema.safeParse(data);
      if (!parsed.success) {
        const fields: Record<string, string[]> = {};
        parsed.error.issues.forEach((i) => {
          const key = i.path.join(".");
          fields[key] = [...(fields[key] ?? []), i.message];
        });
        throw new ValidationError("Invalid business data", fields);
      }

      const d = parsed.data;

      // Create business
      const [business] = await query<BusinessRow>`
        INSERT INTO businesses (owner_id, name, tagline, location, phone, timezone, business_type)
        VALUES (${session.userId}, ${d.name}, ${d.tagline}, ${d.location}, ${d.phone}, ${d.timezone}, ${d.business_type})
        RETURNING *
      `;

      if (!business) throw new Error("Failed to create business");

      // Auto-create a brand kit
      await query`
        INSERT INTO brand_kits (business_id) VALUES (${business.id})
        ON CONFLICT DO NOTHING
      `;

      // Reissue a JWT with the new businessId
      const newToken = await signSessionToken({
        userId: session.userId,
        email: session.email,
        businessId: business.id,
      });

      return { success: true, business, token: newToken };
    } catch (err) {
      const { error, status } = errorToResponse(err);
      return { success: false, error, status, business: null, token: null };
    }
  });

// ─── listUserBusinesses ───────────────────────────────────────────────────────

export const listUserBusinesses = createServerFn({ method: "GET" }).handler(
  async () => {
    try {
      const session = await requireAuth();

      const ip = getClientIp();
      await checkRateLimit(ip, "general");

      const businesses = await query<BusinessRow>`
        SELECT id, name, tagline, location, timezone, business_type, is_active, created_at
        FROM businesses
        WHERE owner_id = ${session.userId} AND deleted_at IS NULL
        ORDER BY created_at ASC
      `;

      return { success: true, businesses };
    } catch (err) {
      const { error, status } = errorToResponse(err);
      return { success: false, error, status, businesses: [] };
    }
  }
);
