/**
 * PostPilot — Authentication Layer
 *
 * Magic-link email auth using:
 * - Resend (email delivery)
 * - jose (JWT signing / verification)
 * - Neon (token storage)
 *
 * Flow:
 *  1. User enters email → sendMagicLink() stores hashed token, emails link
 *  2. User clicks link → verifyMagicLink() validates token, returns JWT session
 *  3. All API calls include JWT in Authorization header
 *  4. requireAuth() middleware verifies JWT on every protected server function
 */

import { SignJWT, jwtVerify } from "jose";
import { randomBytes, createHash, createCipheriv, createDecipheriv, createHmac } from "crypto";
import { getRequest } from "@tanstack/react-start/server";
import { query, queryOne } from "./db.js";
import { UnauthorizedError, ForbiddenError, AppError } from "./errors.js";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface SessionUser {
  userId: string;
  email: string;
  name?: string;
  image?: string;
  businessId?: string | undefined;
}

export interface UserRow {
  id: string;
  email: string;
  email_verified: boolean;
}

// ─── JWT helpers ─────────────────────────────────────────────────────────────

function getJwtSecret(): Uint8Array {
  const secret = process.env["JWT_SECRET"];
  if (!secret || secret.length < 32) {
    throw new Error("JWT_SECRET must be at least 32 characters");
  }
  return new TextEncoder().encode(secret);
}

/** Sign a JWT session token valid for 30 days. */
export async function signSessionToken(user: SessionUser): Promise<string> {
  const payload: Record<string, string> = {
    userId: user.userId,
    email: user.email,
  };
  if (user.businessId) {
    payload["businessId"] = user.businessId;
  }

  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .setIssuer("postpilot")
    .setAudience("postpilot-app")
    .sign(getJwtSecret());
}

/** Verify a JWT and return the payload. Throws UnauthorizedError if invalid. */
export async function verifySessionToken(token: string): Promise<SessionUser> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret(), {
      issuer: "postpilot",
      audience: "postpilot-app",
    });
    return payload as unknown as SessionUser;
  } catch {
    throw new UnauthorizedError("Session expired or invalid. Please sign in again.");
  }
}

// ─── Magic link helpers ───────────────────────────────────────────────────────

/** Generate a secure random token and return its hash (stored in DB) and raw value (sent in email). */
function generateMagicToken(): { raw: string; hashed: string } {
  const raw = randomBytes(32).toString("hex");
  const hashed = createHash("sha256").update(raw).digest("hex");
  return { raw, hashed };
}

/**
 * Create or find a user by email, generate a magic link token,
 * store the hash in the DB, and return the raw token for emailing.
 */
export async function createMagicToken(email: string): Promise<string> {
  const normalizedEmail = email.toLowerCase().trim();
  const expiryMinutes = Number(process.env["MAGIC_LINK_EXPIRY_MINUTES"] ?? 15);
  const expiresAt = new Date(Date.now() + expiryMinutes * 60_000).toISOString();
  const { raw, hashed } = generateMagicToken();

  // Upsert user
  await query`
    INSERT INTO users (email)
    VALUES (${normalizedEmail})
    ON CONFLICT (email) DO NOTHING
  `;

  // Store hashed token
  await query`
    UPDATE users
    SET magic_token = ${hashed},
        magic_token_expires_at = ${expiresAt}
    WHERE email = ${normalizedEmail}
  `;

  return raw;
}

/**
 * Verify a magic link token, mark email as verified, clear the token,
 * and return a signed JWT session token.
 */
export async function verifyMagicToken(email: string, rawToken: string): Promise<string> {
  const normalizedEmail = email.toLowerCase().trim();
  const hashed = createHash("sha256").update(rawToken).digest("hex");

  const user = await queryOne<UserRow & { magic_token: string; magic_token_expires_at: string }>`
    SELECT id, email, email_verified, magic_token, magic_token_expires_at
    FROM users
    WHERE email = ${normalizedEmail}
      AND magic_token = ${hashed}
      AND magic_token_expires_at > now()
  `;

  if (!user) {
    throw new UnauthorizedError("This link has expired or is invalid. Please request a new one.");
  }

  // Clear token and mark verified
  await query`
    UPDATE users
    SET magic_token = NULL,
        magic_token_expires_at = NULL,
        email_verified = true,
        last_login_at = now()
    WHERE id = ${user.id}
  `;

  // Find first active business for this user
  const business = await queryOne<{ id: string }>`
    SELECT id FROM businesses
    WHERE owner_id = ${user.id} AND deleted_at IS NULL
    ORDER BY created_at ASC
    LIMIT 1
  `;

  return signSessionToken({
    userId: user.id,
    email: user.email,
    ...(business?.id ? { businessId: business.id } : {}),
  });
}

// ─── requireAuth() guard ──────────────────────────────────────────────────────

/**
 * Extract and verify the JWT from a Request Authorization header or Better Auth cookie.
 * If request is omitted, automatically retrieves headers from TanStack Start.
 *
 *   const session = await requireAuth();
 */
export async function requireAuth(request?: Request): Promise<SessionUser> {
  let headers: Headers | Record<string, string> | undefined;
  if (request) {
    headers = request.headers;
  } else {
    try {
      const { getRequestHeaders, getRequest } = await import("@tanstack/react-start/server");
      try {
        headers = getRequestHeaders();
      } catch {
        headers = getRequest()?.headers;
      }
    } catch {}
  }

  // 1. Try Better Auth session first (cookie from Google sign-in)
  try {
    const { auth } = await import("./auth-server.js");
    if (headers) {
      let headersObj: Headers;
      if (headers instanceof Headers) {
        headersObj = headers;
      } else {
        headersObj = new Headers();
        for (const [key, value] of Object.entries(headers)) {
          if (typeof value === "string") {
            headersObj.set(key, value);
          }
        }
      }

      const betterSession = await auth.api.getSession({
        headers: headersObj,
      });

      if (betterSession?.user) {
        const user = betterSession.user;
        let businessId: string | undefined;

        // Check for requested business via header or cookie
        const reqBizHeader = headersObj.get("x-business-id");
        let reqBizCookie: string | undefined;
        const cookieHeader = headersObj.get("cookie");
        if (cookieHeader) {
          const match = cookieHeader.match(/postpilot_active_business=([^;]+)/);
          if (match && match[1]) reqBizCookie = decodeURIComponent(match[1]);
        }
        const candidateBizId = reqBizHeader || reqBizCookie;

        try {
          if (candidateBizId) {
            const biz = await queryOne<{ id: string; name: string }>`
              SELECT id, name FROM businesses
              WHERE id = ${candidateBizId}
                AND (owner_id = ${user.id} OR owner_user_id = ${user.id})
                AND deleted_at IS NULL
              LIMIT 1
            `;
            if (biz?.id) {
              businessId = biz.id;
            }
          }

          if (!businessId) {
            let business = await queryOne<{ id: string; name: string }>`
              SELECT id, name FROM businesses
              WHERE (owner_id = ${user.id} OR owner_user_id = ${user.id})
                AND deleted_at IS NULL
              ORDER BY created_at ASC
              LIMIT 1
            `;

            if (!business) {
              const defaultName = user.name ? `${user.name}'s Workspace` : "My Business";
              business = await queryOne<{ id: string; name: string }>`
                INSERT INTO businesses (owner_id, owner_user_id, name, business_type, location, timezone)
                VALUES (${user.id}, ${user.id}, ${defaultName}, 'General', 'Global', 'UTC')
                RETURNING id, name
              `;
            }

            if (business?.id) {
              businessId = business.id;
            }
          }
        } catch (dbErr) {
          console.warn("[requireAuth] Failed to load or initialize business for user:", dbErr);
        }

        return {
          userId: user.id,
          email: user.email,
          name: (user as any).name,
          image: (user as any).image,
          ...(businessId ? { businessId } : {}),
        };
      }
    }
  } catch (authErr) {
    console.warn("[requireAuth] Better Auth session check failed:", authErr);
    // Continue to Bearer token fallback
  }

  // 2. Fallback to Authorization: Bearer JWT header
  const authHeader = (headers instanceof Headers ? headers.get("Authorization") : (headers as any)?.["authorization"]) ?? null;
  if (!authHeader?.startsWith("Bearer ")) {
    throw new UnauthorizedError();
  }
  const token = authHeader.slice(7);
  return verifySessionToken(token);
}

// ─── Business Ownership & Security Helpers ────────────────────────────────────

export interface BusinessRowData {
  id: string;
  owner_id: string;
  owner_user_id: string | null;
  name: string;
  tagline: string | null;
  logo_url: string | null;
  brand_colors: string[] | null;
  tone: string | null;
  default_hashtags: string | null;
  timezone: string;
  location: string | null;
  phone: string | null;
  zernio_profile_id: string | null;
  business_type: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Asserts that a given user ID owns or has access to the given business ID.
 * Throws ForbiddenError if user does not own it.
 */
export async function assertUserOwnsBusiness(userId: string, businessId: string): Promise<BusinessRowData> {
  const business = await queryOne<BusinessRowData>`
    SELECT * FROM businesses
    WHERE id = ${businessId}
      AND (owner_id = ${userId} OR owner_user_id = ${userId})
      AND deleted_at IS NULL
  `;
  if (!business) {
    throw new ForbiddenError("You do not have access to this business.");
  }
  return business;
}

// ─── Signed OAuth State (HMAC SHA-256) ─────────────────────────────────────────

export interface SignedOAuthPayload {
  businessId: string;
  userId: string;
  timestamp: number;
}

export function signOAuthState(data: { businessId: string; userId: string; timestamp?: number }): string {
  const payload: SignedOAuthPayload = {
    businessId: data.businessId,
    userId: data.userId,
    timestamp: data.timestamp ?? Date.now(),
  };
  const jsonStr = JSON.stringify(payload);
  const base64 = Buffer.from(jsonStr, "utf8").toString("base64url");
  const secret = process.env["JWT_SECRET"] || "postpilot-hmac-secret-32-chars-minimum-key!!";
  const sig = createHmac("sha256", secret).update(base64).digest("base64url");
  return `${base64}.${sig}`;
}

export function verifyOAuthState(stateString: string): SignedOAuthPayload {
  if (!stateString || typeof stateString !== "string" || !stateString.includes(".")) {
    throw new AppError("Invalid or missing OAuth state parameter", 400);
  }
  const [base64, sig] = stateString.split(".");
  if (!base64 || !sig) {
    throw new AppError("Malformed OAuth state parameter", 400);
  }
  const secret = process.env["JWT_SECRET"] || "postpilot-hmac-secret-32-chars-minimum-key!!";
  const expectedSig = createHmac("sha256", secret).update(base64).digest("base64url");
  if (sig !== expectedSig) {
    throw new ForbiddenError("Tampered OAuth state signature. Connection rejected.");
  }
  try {
    const raw = Buffer.from(base64, "base64url").toString("utf8");
    const data = JSON.parse(raw) as SignedOAuthPayload;
    // Check expiration (max 2 hours)
    if (Date.now() - (data.timestamp || 0) > 2 * 60 * 60 * 1000) {
      throw new AppError("OAuth state has expired. Please initiate connection again.", 400);
    }
    return data;
  } catch (err: any) {
    if (err instanceof AppError) throw err;
    throw new AppError("Failed to parse OAuth state payload", 400);
  }
}

// ─── Token encryption (for OAuth access tokens at rest) ─────────────────────

const ALGO = "aes-256-gcm";
const KEY_LENGTH = 32;

function getEncryptionKey(): Buffer {
  const key = process.env["ENCRYPTION_KEY"] ?? process.env["JWT_SECRET"] ?? "";
  const derived = createHash("sha256").update(key).digest();
  if (derived.length < KEY_LENGTH) {
    throw new AppError("ENCRYPTION_KEY must produce 32 bytes", 500);
  }
  return derived;
}

/** Encrypt an OAuth access token for secure storage. */
export function encryptToken(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGO, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv.toString("hex"), encrypted.toString("hex"), tag.toString("hex")].join(":");
}

/** Decrypt a stored OAuth access token. */
export function decryptToken(ciphertext: string): string {
  const key = getEncryptionKey();
  const [ivHex, encHex, tagHex] = ciphertext.split(":");
  if (!ivHex || !encHex || !tagHex) throw new AppError("Invalid ciphertext format", 500);
  const iv = Buffer.from(ivHex, "hex");
  const encrypted = Buffer.from(encHex, "hex");
  const tag = Buffer.from(tagHex, "hex");
  const decipher = createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
}
