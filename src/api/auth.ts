/**
 * PostPilot — Auth API (TanStack Server Functions)
 *
 * Endpoints:
 *  - sendMagicLink(email)        → sends a sign-in email via Resend
 *  - verifyMagicLink(email, token) → validates token, returns JWT session
 *  - getSession()                → returns current session from JWT header
 *  - signOut()                   → (stateless — client discards the JWT)
 */

import { createServerFn } from "@tanstack/react-start";
import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

import { sendMagicLinkSchema, verifyMagicLinkSchema } from "../lib/validators.js";
import { createMagicToken, verifyMagicToken, requireAuth } from "../lib/auth.js";
import { checkRateLimit, getClientIp } from "../lib/rateLimit.js";
import { errorToResponse, ValidationError } from "../lib/errors.js";
import { query } from "../lib/db.js";

// ─── SMTP Email Transport ───────────────────────────────────────────────────

let _transporter: Transporter | null = null;

function getEmailTransporter(): Transporter | null {
  const host = process.env["SMTP_HOST"];
  if (!host) {
    return null;
  }
  if (!_transporter) {
    const port = Number(process.env["SMTP_PORT"] ?? 587);
    const secure = process.env["SMTP_SECURE"] === "true" || port === 465;
    const user = process.env["SMTP_USER"];
    const pass = process.env["SMTP_PASS"];

    _transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: user ? { user, pass: pass ?? "" } : undefined,
    });
  }
  return _transporter;
}

async function sendEmail(opts: { to: string; subject: string; html: string; magicUrl?: string }): Promise<void> {
  const transporter = getEmailTransporter();
  const user = process.env["SMTP_USER"];
  const from = process.env["SMTP_FROM"] || (user ? `PostPilot <${user}>` : "PostPilot <noreply@postpilot.app>");

  if (!transporter) {
    // Development fallback when SMTP credentials are not configured yet
    console.log("\n========================================================");
    console.log(`[SMTP DEV] No SMTP_HOST configured. Email would be sent to: ${opts.to}`);
    console.log(`[SMTP DEV] Subject: ${opts.subject}`);
    if (opts.magicUrl) {
      console.log(`[SMTP DEV] Magic Sign-in Link: ${opts.magicUrl}`);
    }
    console.log("========================================================\n");
    return;
  }

  await transporter.sendMail({
    from,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
  });
}

// ─── sendMagicLink ────────────────────────────────────────────────────────────

export const sendMagicLink = createServerFn({ method: "POST" })
  .validator((d: unknown) => d)
  .handler(async ({ data }) => {
    try {
      const ip = getClientIp();
      await checkRateLimit(ip, "auth");

      const parsed = sendMagicLinkSchema.safeParse(data);
      if (!parsed.success) {
        const fields: Record<string, string[]> = {};
        parsed.error.issues.forEach((issue) => {
          const key = issue.path.join(".");
          fields[key] = [...(fields[key] ?? []), issue.message];
        });
        throw new ValidationError("Invalid email address", fields);
      }

      const { email } = parsed.data;
      const rawToken = await createMagicToken(email);

      const magicUrl = `${process.env["PUBLIC_APP_URL"] ?? "http://localhost:8080"}/auth/verify?email=${encodeURIComponent(email)}&token=${rawToken}`;

      await sendEmail({
        to: email,
        subject: "Your PostPilot sign-in link",
        html: buildMagicLinkEmail(magicUrl),
        magicUrl,
      });

      return { success: true, message: "Check your inbox for the sign-in link." };
    } catch (err) {
      const { error, status } = errorToResponse(err);
      return { success: false, error, status };
    }
  });

// ─── verifyMagicLink ─────────────────────────────────────────────────────────

export const verifyMagicLink = createServerFn({ method: "POST" })
  .validator((d: unknown) => d)
  .handler(async ({ data }) => {
    try {
      const ip = getClientIp();
      await checkRateLimit(ip, "auth");

      const parsed = verifyMagicLinkSchema.safeParse(data);
      if (!parsed.success) throw new ValidationError("Invalid request");

      const { email, token } = parsed.data;
      const sessionToken = await verifyMagicToken(email, token);

      // Log sign-in
      await logAction({
        action: "auth.sign_in",
        metadata: { email, method: "magic_link" },
        ipAddress: ip,
      });

      return { success: true, token: sessionToken };
    } catch (err) {
      const { error, status } = errorToResponse(err);
      return { success: false, error, status };
    }
  });

// ─── getSession ───────────────────────────────────────────────────────────────

export const getSession = createServerFn({ method: "GET" }).handler(
  async () => {
    try {
      const session = await requireAuth();
      return { success: true, session };
    } catch {
      return { success: false, session: null };
    }
  }
);

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function logAction(opts: {
  action: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  request?: Request;
  userId?: string;
  businessId?: string;
}) {
  try {
    const userAgent = opts.request?.headers.get("user-agent") ?? null;
    await query`
      INSERT INTO audit_log (user_id, business_id, action, metadata, ip_address, user_agent)
      VALUES (
        ${opts.userId ?? null},
        ${opts.businessId ?? null},
        ${opts.action},
        ${JSON.stringify(opts.metadata ?? {})}::jsonb,
        ${opts.ipAddress ?? null}::inet,
        ${userAgent}
      )
    `;
  } catch {
    // Audit log failures must never break the main operation
  }
}

function buildMagicLinkEmail(url: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="background:#FAF7F2;font-family:'DM Sans',Arial,sans-serif;margin:0;padding:40px 20px;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0" style="background:#fff;border:1px solid #e8e0d5;border-radius:8px;overflow:hidden;">
          <tr>
            <td style="background:#D9442B;padding:28px 40px;">
              <p style="margin:0;font-family:Georgia,serif;font-size:22px;color:#fff;font-weight:500;">postpilot</p>
            </td>
          </tr>
          <tr>
            <td style="padding:40px;">
              <p style="margin:0 0 8px;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#D9442B;">YOUR SIGN-IN LINK</p>
              <h1 style="margin:0 0 16px;font-family:Georgia,serif;font-size:28px;color:#1C1917;font-weight:500;line-height:1.2;">Good to see you.</h1>
              <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#78716c;">Click the button below to sign in to your PostPilot workspace. This link expires in 15 minutes and can only be used once.</p>
              <a href="${url}" style="display:inline-block;background:#D9442B;color:#fff;padding:13px 28px;border-radius:6px;text-decoration:none;font-size:14px;font-weight:600;">Sign in to PostPilot →</a>
              <p style="margin:24px 0 0;font-size:12px;color:#a8a29e;">If you didn't request this, you can safely ignore this email. Someone may have entered your email address by mistake.</p>
              <hr style="border:none;border-top:1px solid #e8e0d5;margin:24px 0;">
              <p style="margin:0;font-size:11px;color:#a8a29e;">PostPilot — Social posts, made simple.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}
