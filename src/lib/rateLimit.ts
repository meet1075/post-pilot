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

// ─── Rate limit check helper ─────────────────────────────────────────────────

export type RateLimitTier = "general" | "ai" | "auth" | "publish";

const LIMITERS: Record<RateLimitTier, () => Ratelimit> = {
  general: generalLimiter,
  ai: aiLimiter,
  auth: authLimiter,
  publish: publishLimiter,
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
  // Skip rate limiting in development (no Redis configured)
  if (!process.env["UPSTASH_REDIS_REST_URL"]) {
    return;
  }

  try {
    const limiter = LIMITERS[tier]();
    const { success, remaining, reset } = await limiter.limit(identifier);

    if (!success) {
      const resetInSeconds = Math.ceil((reset - Date.now()) / 1000);
      throw new RateLimitError(
        `Rate limit exceeded. Try again in ${resetInSeconds} seconds.`
      );
    }

    // Log for monitoring (not production logs — would be too verbose)
    if (remaining < 5) {
      console.warn(`[RateLimit] Low remaining (${remaining}) for ${tier}:${identifier}`);
    }
  } catch (err) {
    if (err instanceof RateLimitError) throw err;
    // If Redis is down, fail open (don't block users)
    console.error("[RateLimit] Redis error (failing open):", err);
  }
}

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
