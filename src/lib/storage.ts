/**
 * PostPilot — Storage Layer (Cloudflare R2 with Supabase fallback)
 *
 * Handles upload of generated poster images and brand logos to Cloudflare R2 (S3-compatible)
 * or Supabase Storage bucket.
 * Cloudflare R2 provides 0 egress fees and fast global CDN URLs that external services
 * (e.g. Zernio / Instagram) fetch to publish the post.
 *
 * Cloudflare R2 Environment Variables:
 *  - R2_ACCOUNT_ID: Cloudflare Account ID (found on the right sidebar of Cloudflare dashboard)
 *  - R2_ACCESS_KEY_ID: S3 API Access Key ID (created in R2 > Manage R2 API Tokens)
 *  - R2_SECRET_ACCESS_KEY: S3 API Secret Access Key
 *  - R2_BUCKET_NAME: Name of your R2 bucket (default: postpilot-posters)
 *  - R2_PUBLIC_URL: Public access domain for the bucket (e.g. https://pub-xxx.r2.dev or custom domain https://cdn.yourdomain.com)
 *
 * Fallback Environment Variables (Supabase):
 *  - SUPABASE_URL
 *  - SUPABASE_SERVICE_ROLE_KEY
 *  - SUPABASE_STORAGE_BUCKET
 */

import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { AppError } from "./errors.js";

let _s3: S3Client | null = null;
let _supabase: SupabaseClient | null = null;

export function isR2Configured(): boolean {
  return Boolean(
    process.env["R2_ACCOUNT_ID"] &&
    process.env["R2_ACCESS_KEY_ID"] &&
    process.env["R2_SECRET_ACCESS_KEY"]
  );
}

function getR2Client(): S3Client {
  if (!_s3) {
    const accountId = process.env["R2_ACCOUNT_ID"];
    const accessKeyId = process.env["R2_ACCESS_KEY_ID"];
    const secretAccessKey = process.env["R2_SECRET_ACCESS_KEY"];

    if (!accountId || !accessKeyId || !secretAccessKey) {
      throw new AppError("Cloudflare R2 is not fully configured. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY.", 500);
    }

    _s3 = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }
  return _s3;
}

function getSupabaseClient(): SupabaseClient {
  if (!_supabase) {
    const url = process.env["SUPABASE_URL"];
    const key = process.env["SUPABASE_SERVICE_ROLE_KEY"] ?? process.env["SUPABASE_ANON_KEY"];

    if (!url || !key) {
      throw new AppError(
        "Storage is not configured. Set Cloudflare R2 credentials or SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.",
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
  if (isR2Configured()) {
    return process.env["R2_BUCKET_NAME"] ?? "postpilot-posters";
  }
  return process.env["SUPABASE_STORAGE_BUCKET"] ?? "postpilot-posters";
}

/**
 * Returns the public CDN URL for a file stored in R2 or Supabase.
 */
export function getPublicUrl(key: string): string {
  if (isR2Configured()) {
    const publicDomain = process.env["R2_PUBLIC_URL"];
    if (publicDomain && publicDomain.trim() !== "") {
      const base = publicDomain.trim().replace(/\/+$/, "");
      const cleanKey = key.replace(/^\/+/, "");
      return `${base}/${cleanKey}`;
    }
    // Fallback if public custom domain is not yet set
    const accountId = process.env["R2_ACCOUNT_ID"];
    const bucket = getBucketName();
    return `https://${bucket}.${accountId}.r2.cloudflarestorage.com/${key}`;
  }

  // Supabase fallback
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
 * Upload a Buffer or binary payload directly to Cloudflare R2 (or Supabase Storage).
 * Returns the file path and public CDN URL.
 */
export async function uploadPosterImage(options: {
  key: string; // e.g. "posters/business-id/post-id.png"
  body: Buffer | Uint8Array;
  contentType?: string;
  metadata?: Record<string, string>;
}): Promise<{ key: string; publicUrl: string }> {
  if (isR2Configured()) {
    try {
      const client = getR2Client();
      const bucket = getBucketName();
      const command = new PutObjectCommand({
        Bucket: bucket,
        Key: options.key,
        Body: options.body,
        ContentType: options.contentType ?? "image/png",
        Metadata: options.metadata,
      });

      await client.send(command);

      return {
        key: options.key,
        publicUrl: getPublicUrl(options.key),
      };
    } catch (err: any) {
      console.warn(`[storage] Cloudflare R2 upload attempt failed, falling back to Supabase storage: ${err?.message || err}`);
    }
  }

  // Supabase fallback
  const client = getSupabaseClient();
  const supabaseBucket = process.env["SUPABASE_STORAGE_BUCKET"] || "post-pilot";

  const { error } = await client.storage.from(supabaseBucket).upload(options.key, options.body, {
    contentType: options.contentType ?? "image/png",
    upsert: true,
  });

  if (error) {
    throw new AppError(`Storage upload failed: ${error.message}`, 502);
  }

  const { data: pubData } = client.storage.from(supabaseBucket).getPublicUrl(options.key);
  return {
    key: options.key,
    publicUrl: pubData.publicUrl,
  };
}

/**
 * Generate a presigned signed upload URL so the browser can upload directly
 * (e.g. for brand logo uploads). Expires in 5 minutes.
 */
export async function getUploadPresignedUrl(key: string, contentType = "image/png"): Promise<string> {
  if (isR2Configured()) {
    try {
      const client = getR2Client();
      const bucket = getBucketName();
      const command = new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        ContentType: contentType,
      });
      return await getSignedUrl(client, command, { expiresIn: 300 });
    } catch (err: any) {
      console.warn(`[storage] Could not create R2 presigned URL, falling back to Supabase: ${err?.message || err}`);
    }
  }

  // Supabase fallback
  const url = process.env["SUPABASE_URL"];
  if (!url) {
    return `http://localhost:8080/api/mock-upload?key=${encodeURIComponent(key)}`;
  }

  const client = getSupabaseClient();
  const supabaseBucket = process.env["SUPABASE_STORAGE_BUCKET"] || "post-pilot";

  const { data, error } = await client.storage.from(supabaseBucket).createSignedUploadUrl(key);

  if (error || !data?.signedUrl) {
    throw new AppError(`Failed to create presigned upload URL: ${error?.message ?? "unknown error"}`, 502);
  }

  return data.signedUrl;
}

/**
 * Delete an object from storage (R2 or Supabase).
 */
export async function deletePosterImage(key: string): Promise<void> {
  if (isR2Configured()) {
    try {
      const client = getR2Client();
      const bucket = getBucketName();
      const command = new DeleteObjectCommand({
        Bucket: bucket,
        Key: key,
      });
      await client.send(command);
    } catch (err: any) {
      console.error("[Storage:R2] Failed to delete file:", err?.message || err);
    }
    return;
  }

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
