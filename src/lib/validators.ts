/**
 * PostPilot — Zod Validators
 *
 * Centralised input validation schemas for all API endpoints.
 * Imported by server functions to validate before touching the DB.
 */

import { z } from "zod";

// ─── Regex Patterns ──────────────────────────────────────────────────────────

export const REGEX = {
  email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  date: /^\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01])$/,
  time: /^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/,
  socialHandle: /^[a-zA-Z0-9._]{1,30}$/,
  uuid: /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/,
  phone: /^$|^\+?[0-9\s\-().]{7,25}$/,
};

// ─── Common ───────────────────────────────────────────────────────────────────

export const uuidSchema = z.string().regex(REGEX.uuid, "Invalid ID format (must be a valid UUID)");

export const platformSchema = z.enum(["Instagram", "Facebook", "X"]);

export const postStatusSchema = z.enum(["Draft", "Scheduled", "Posted", "Failed", "Cancelled"]);

export const toneSchema = z.enum([
  "Friendly",
  "Professional",
  "Premium",
  "Playful",
  "Direct",
  "Bold",
  "Casual",
  "Luxury",
]);

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const sendMagicLinkSchema = z.object({
  email: z.string().regex(REGEX.email, "Please enter a valid email address (e.g. name@company.com)").max(320),
});

export const verifyMagicLinkSchema = z.object({
  email: z.string().regex(REGEX.email, "Invalid email address format").max(320),
  token: z.string().length(64, "Token must be exactly 64 characters"),
});

export const createBusinessSchema = z.object({
  name: z.string().trim().min(1, "Business name is required").max(200, "Business name cannot exceed 200 characters"),
  tagline: z.string().max(500, "Tagline cannot exceed 500 characters").optional().nullable().default(""),
  logo_url: z.string().optional().nullable().or(z.literal("")),
  brand_colors: z.array(z.string().max(50)).max(5, "Maximum 5 brand colors allowed").optional().default(["Tomato", "Olive"]),
  tone: toneSchema.default("Friendly"),
  default_hashtags: z.string().max(2000).optional().nullable().default(""),
  location: z.string().max(300, "Location cannot exceed 300 characters").optional().nullable().default(""),
  phone: z.string().optional().nullable().default(""),
  timezone: z.string().max(100).default("UTC"),
  business_type: z.string().max(50).default("General"),
});

export const updateBusinessSchema = createBusinessSchema.partial().extend({
  business_id: z.string().optional(),
});

export const deleteBusinessSchema = z.object({
  business_id: z.string().min(1, "Business ID is required"),
});

// ─── Brand Kit ────────────────────────────────────────────────────────────────

export const updateBrandKitSchema = z.object({
  colors: z.array(z.string().max(50)).max(5, "Maximum 5 brand colors allowed").optional(),
  font: z.string().max(100).optional(),
  caption_tone: toneSchema.optional(),
  default_hashtags: z.string().max(2000).optional(),
});

// ─── Posts ────────────────────────────────────────────────────────────────────

export const createPostSchema = z.object({
  headline: z.string().max(200, "Headline cannot exceed 200 characters").default(""),
  caption: z.string().max(2200, "Caption cannot exceed 2,200 characters").default(""),
  prompt: z.string().max(2000, "Prompt cannot exceed 2,000 characters").default(""),
  date: z
    .string()
    .regex(REGEX.date, "Date must be formatted as YYYY-MM-DD")
    .optional()
    .nullable(),
  time: z
    .string()
    .regex(REGEX.time, "Time must be formatted as HH:MM")
    .optional()
    .nullable(),
  platform: platformSchema.default("Instagram"),
  theme: z.string().max(50).default("tomato"),
  price: z.string().max(100, "Price text cannot exceed 100 characters").default(""),
  status: postStatusSchema.default("Draft"),
  image_url: z.string().optional().nullable(),
  business_id: z.string().optional(),
  social_account_id: z.string().optional().nullable(),
});

export const updatePostSchema = createPostSchema.partial().extend({
  image_url: z.string().optional().nullable(),
  image_r2_key: z.string().max(500).optional().nullable(),
  social_account_id: z.string().optional().nullable(),
});

// ─── Poster Generation ────────────────────────────────────────────────────────

export const generatePostersSchema = z.object({
  prompt: z.string().trim().min(1, "Please provide an idea or description for your post").max(2000, "Prompt cannot exceed 2,000 characters"),
  style: z.enum(["Bold", "Minimal", "Festive", "Elegant"]).default("Bold"),
  format: z.enum(["Square", "Portrait 4:5", "Story"]).default("Portrait 4:5"),
  use_brand: z.boolean().default(true),
  count: z.number().int().min(1).max(4).default(2).optional(),
  business_id: z.string().optional(),
  social_account_id: z.string().optional().nullable(),
});

// ─── Captions ─────────────────────────────────────────────────────────────────

export const suggestCaptionsSchema = z.object({
  headline: z.string().max(200).optional().default(""),
  offer: z.string().max(200).optional().default(""),
  price: z.string().max(100).optional().default(""),
  business_name: z.string().max(100).optional(),
  platform: platformSchema.default("Instagram"),
  tone: toneSchema.default("Friendly"),
  business_id: z.string().optional(),
});

// ─── Publish ──────────────────────────────────────────────────────────────────

export const publishPostSchema = z.object({
  post_id: uuidSchema,
  platforms: z.array(platformSchema).min(1, "Please select at least one social media platform").max(5).optional(),
  social_account_ids: z.array(z.string()).optional(),
  timing: z.enum(["now", "schedule"]),
  scheduled_date: z
    .string()
    .regex(REGEX.date, "Scheduled date must be YYYY-MM-DD")
    .optional(),
  scheduled_time: z
    .string()
    .regex(REGEX.time, "Scheduled time must be HH:MM")
    .optional(),
  social_account_id: z.string().optional().nullable(),
  business_id: z.string().optional(),
});

// ─── Connected Accounts ───────────────────────────────────────────────────────

export const connectAccountSchema = z.object({
  platform: platformSchema,
  zernio_account_id: z.string().min(1, "Account ID is required").max(200),
  platform_handle: z
    .string()
    .regex(REGEX.socialHandle, "Handle must contain only letters, numbers, periods, or underscores (1-30 chars)")
    .optional(),
  platform_user_id: z.string().max(200).optional(),
  state: z.string().optional(),
  business_id: z.string().optional(),
});
