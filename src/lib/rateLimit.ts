/**
 * PostPilot — Rate Limiting
 *
 * Uses Upstash Redis for distributed rate limiting.
 * Works across Cloudflare Worker instances (stateless).
 *
 * Limits:
 *  - General API:        60 requests / 60s (per IP)
 *  - AI endpoints:       10 requests / 60s (per user)
 *  - Auth endpoints:      5 requests / 60s (per IP)
 *  - Publish endpoints:  20 requests / 60s (per business)
 */

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { getRequest } from "@tanstack/react-start/server";
import { RateLimitError } from "./errors.js";

// ─── Redis client ─────────────────────────────────────────────────────────────

let _redis: Redis | null = null;

function getRedis(): Redis {
  if (!_redis) {
    const url = process.env["UPSTASH_REDIS_REST_URL"];
    const token = process.env["UPSTASH_REDIS_REST_TOKEN"];
    if (!url || !token) {
      throw new Error(
        "UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be set for rate limiting"
      );
    }
    _redis = new Redis({ url, token });
  }
  return _redis;
}

// ─── Rate limiter instances ───────────────────────────────────────────────────

/** 60 req / 60s — general API endpoints */
const generalLimiter = () =>
  new Ratelimit({
    redis: getRedis(),
    limiter: Ratelimit.slidingWindow(60, "60 s"),
    prefix: "pp:rl:general",
    analytics: true,
  });

/** 10 req / 60s — AI generation (expensive) */
const aiLimiter = () =>
  new Ratelimit({
    redis: getRedis(),
    limiter: Ratelimit.slidingWindow(10, "60 s"),
    prefix: "pp:rl:ai",
    analytics: true,
  });

/** 5 req / 60s — auth (brute-force protection) */
const authLimiter = () =>
  new Ratelimit({
    redis: getRedis(),
    limiter: Ratelimit.slidingWindow(5, "60 s"),
    prefix: "pp:rl:auth",
    analytics: true,
  });

/** 20 req / 60s — publish/schedule endpoints */
const publishLimiter = () =>
  new Ratelimit({
    redis: getRedis(),
    limiter: Ratelimit.slidingWindow(20, "60 s"),
    prefix: "pp:rl:publish",
    analytics: true,
  });

/** 30 req / 60s — business management endpoints */
const businessLimiter = () =>
  new Ratelimit({
    redis: getRedis(),
    limiter: Ratelimit.slidingWindow(30, "60 s"),
    prefix: "pp:rl:business",
    analytics: true,
  });

/** 10 req / 60s — file & image upload endpoints (protects Cloudflare R2 quota) */
const uploadLimiter = () =>
  new Ratelimit({
    redis: getRedis(),
    limiter: Ratelimit.slidingWindow(10, "60 s"),
    prefix: "pp:rl:upload",
    analytics: true,
  });

// ─── In-Memory Fallback Limiter (Sliding Window) ──────────────────────────────
interface MemoryBucket {
  timestamps: number[];
}
const memoryBuckets = new Map<string, MemoryBucket>();

function checkMemoryRateLimit(key: string, maxRequests: number, windowSeconds: number): boolean {
  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  const bucket = memoryBuckets.get(key) ?? { timestamps: [] };

  // Filter timestamps within window
  bucket.timestamps = bucket.timestamps.filter((ts) => now - ts < windowMs);

  if (bucket.timestamps.length >= maxRequests) {
    return false;
  }

  bucket.timestamps.push(now);
  memoryBuckets.set(key, bucket);

  // Periodically clean up memoryBuckets if it grows too large
  if (memoryBuckets.size > 5000) {
    for (const [k, b] of memoryBuckets.entries()) {
      if (b.timestamps.length === 0 || now - b.timestamps[b.timestamps.length - 1]! > windowMs) {
        memoryBuckets.delete(k);
      }
    }
  }

  return true;
}

// ─── Rate limit check helper ─────────────────────────────────────────────────

export type RateLimitTier = "general" | "ai" | "auth" | "publish" | "business" | "upload";

const TIER_LIMITS: Record<RateLimitTier, { max: number; seconds: number }> = {
  general: { max: 180, seconds: 60 },
  ai: { max: 15, seconds: 60 },
  auth: { max: 10, seconds: 60 },
  publish: { max: 30, seconds: 60 },
  business: { max: 60, seconds: 60 },
  upload: { max: 15, seconds: 60 },
};

const LIMITERS: Record<RateLimitTier, () => Ratelimit> = {
  general: generalLimiter,
  ai: aiLimiter,
  auth: authLimiter,
  publish: publishLimiter,
  business: businessLimiter,
  upload: uploadLimiter,
};

/**
 * Check rate limit for a given identifier and tier.
 * Throws RateLimitError if the limit is exceeded.
 *
 * @param identifier - IP address, user ID, or business ID
 * @param tier       - Which rate limit bucket to use
 */
export async function checkRateLimit(
  identifier: string,
  tier: RateLimitTier = "general"
): Promise<void> {
  const { max, seconds } = TIER_LIMITS[tier];

  // Try Redis first if configured
  if (process.env["UPSTASH_REDIS_REST_URL"] && process.env["UPSTASH_REDIS_REST_TOKEN"]) {
    try {
      const limiter = LIMITERS[tier]();
      const { success, remaining, reset } = await limiter.limit(identifier);

      if (!success) {
        const resetInSeconds = Math.ceil((reset - Date.now()) / 1000);
        throw new RateLimitError(
          `Rate limit exceeded for ${tier}. Try again in ${resetInSeconds} seconds.`
        );
      }

      if (remaining < 3) {
        console.warn(`[RateLimit] Low remaining (${remaining}) for ${tier}:${identifier}`);
      }
      return;
    } catch (err) {
      if (err instanceof RateLimitError) throw err;
      console.warn("[RateLimit] Upstash Redis call error, falling back to in-memory sliding window:", err);
    }
  }

  // In-memory sliding window rate limiting
  const allowed = checkMemoryRateLimit(`${tier}:${identifier}`, max, seconds);
  if (!allowed) {
    throw new RateLimitError(
      `Rate limit exceeded. Maximum ${max} requests per ${seconds} seconds.`
    );
  }
}

/**
 * Enforce max businesses per user (default: 10).
 */
export const MAX_BUSINESSES_PER_USER = Number(process.env["MAX_BUSINESSES_PER_USER"] || 10);

/**
 * Enforce max poster generations per business per day (default: 30).
 */
export const MAX_POSTERS_PER_BUSINESS_PER_DAY = Number(process.env["MAX_POSTERS_PER_BUSINESS_PER_DAY"] || 30);

/**
 * Extract the client IP address from a Request object.
 * If request is omitted, automatically retrieves it from getRequest().
 * Works with Cloudflare Workers headers.
 */
export function getClientIp(request?: Request): string {
  try {
    const req = request ?? getRequest();
    return (
      req.headers.get("CF-Connecting-IP") ??
      req.headers.get("X-Forwarded-For")?.split(",")[0]?.trim() ??
      "127.0.0.1"
    );
  } catch {
    return "127.0.0.1";
  }
}
