/**
 * PostPilot — Supabase Storage Layer
 *
 * Handles upload of generated poster images and brand logos to a Supabase Storage bucket.
 * Supabase Storage provides a public CDN URL that external services (e.g. Zernio / Instagram)
 * fetch to publish the post.
 *
 * Setup:
 *  1. Create a Supabase project (or use your existing one).
 *  2. Go to Storage → "New bucket".
 *  3. Set Bucket name: postpilot-posters (or any custom name).
 *  4. Enable "Public bucket" (IMPORTANT: allows Instagram/Zernio to download the image).
 *  5. Set env vars:
 *     - SUPABASE_URL (e.g. https://xyz.supabase.co)
 *     - SUPABASE_SERVICE_ROLE_KEY (for server-side upload & presigning)
 *     - SUPABASE_STORAGE_BUCKET (default: postpilot-posters)
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { AppError } from "./errors.js";

let _supabase: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient {
  if (!_supabase) {
    const url = process.env["SUPABASE_URL"];
    const key = process.env["SUPABASE_SERVICE_ROLE_KEY"] ?? process.env["SUPABASE_ANON_KEY"];

    if (!url || !key) {
      throw new AppError(
        "Supabase Storage is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.",
        500
      );
    }

    _supabase = createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }
  return _supabase;
}

export function getBucketName(): string {
  return process.env["SUPABASE_STORAGE_BUCKET"] ?? "postpilot-posters";
}

/**
 * Returns the public CDN URL for a file stored in the public Supabase bucket.
 */
export function getPublicUrl(key: string): string {
  const url = process.env["SUPABASE_URL"];
  if (!url) {
    // Development fallback
    return `http://localhost:8080/mock-storage/${key}`;
  }
  const client = getSupabaseClient();
  const bucket = getBucketName();
  const { data } = client.storage.from(bucket).getPublicUrl(key);
  return data.publicUrl;
}

/**
 * Upload a Buffer or binary payload directly to Supabase Storage.
 * Returns the file path and public CDN URL.
 */
export async function uploadPosterImage(options: {
  key: string; // e.g. "posters/business-id/post-id.png"
  body: Buffer | Uint8Array;
  contentType?: string;
  metadata?: Record<string, string>;
}): Promise<{ key: string; publicUrl: string }> {
  const client = getSupabaseClient();
  const bucket = getBucketName();

  const { error } = await client.storage.from(bucket).upload(options.key, options.body, {
    contentType: options.contentType ?? "image/png",
    upsert: true,
  });

  if (error) {
    throw new AppError(`Supabase Storage upload failed: ${error.message}`, 502);
  }

  return {
    key: options.key,
    publicUrl: getPublicUrl(options.key),
  };
}

/**
 * Generate a presigned signed upload URL so the browser can upload directly
 * (e.g. for brand logo uploads). Expires in 5 minutes.
 */
export async function getUploadPresignedUrl(key: string): Promise<string> {
  const url = process.env["SUPABASE_URL"];
  if (!url) {
    // Fallback for local testing without Supabase configured
    return `http://localhost:8080/api/mock-upload?key=${encodeURIComponent(key)}`;
  }

  const client = getSupabaseClient();
  const bucket = getBucketName();

  const { data, error } = await client.storage.from(bucket).createSignedUploadUrl(key);

  if (error || !data?.signedUrl) {
    throw new AppError(`Failed to create Supabase presigned upload URL: ${error?.message ?? "unknown error"}`, 502);
  }

  return data.signedUrl;
}

/**
 * Delete an object from the Supabase Storage bucket.
 */
export async function deletePosterImage(key: string): Promise<void> {
  const url = process.env["SUPABASE_URL"];
  if (!url) return;

  const client = getSupabaseClient();
  const bucket = getBucketName();
  const { error } = await client.storage.from(bucket).remove([key]);
  if (error) {
    console.error("[Storage] Failed to delete file:", error.message);
  }
}

/**
 * Build a deterministic storage path for a post image.
 */
export function buildPosterKey(businessId: string, postId: string, index = 0): string {
  return `posters/${businessId}/${postId}-${index}.png`;
}

/**
 * Build a deterministic storage path for a brand logo.
 */
export function buildLogoKey(businessId: string, ext = "png"): string {
  return `logos/${businessId}/logo.${ext}`;
}
