/**
 * PostPilot — Caption Suggestions API (TanStack Server Function)
 *
 * Generates 3 caption options using Groq (or OpenAI if key is present).
 * If OPENAI_API_KEY is empty, falls back seamlessly to Groq without crashing.
 * API keys are NEVER logged or sent to the frontend.
 *
 * Config:
 *  OPENAI_API_KEY    - OpenAI API key (optional)
 *  OPENAI_MODEL      - e.g. "gpt-4o-mini"
 *  GROQ_API_KEY      - Groq API key
 *  GROQ_MODEL        - e.g. "qwen/qwen3.8-27b"
 */

import { createServerFn } from "@tanstack/react-start";
import { requireAuth } from "../lib/auth.js";
import { query, queryOne } from "../lib/db.js";
import { checkRateLimit, getClientIp } from "../lib/rateLimit.js";
import { suggestCaptionsSchema } from "../lib/validators.js";
import {
  errorToResponse,
  ForbiddenError,
  ValidationError,
  ExternalServiceError,
} from "../lib/errors.js";
import { log } from "../lib/logger.js";
import { apiSuccess, formatZodIssues } from "../lib/apiResponse.js";

export interface CaptionOption {
  caption: string;
  hashtags: string;
}

interface BrandKitRow {
  caption_tone: string;
  default_hashtags: string;
}

interface BusinessRow {
  name: string;
  business_type: string;
  location: string;
}

// ─── suggestCaptions Server Function ─────────────────────────────────────────

export const suggestCaptions = createServerFn({ method: "POST" })
  .validator((d: unknown) => d)
  .handler(async ({ data }) => {
    try {
      const session = await requireAuth();
      if (!session.businessId) throw new ForbiddenError("No active business");

      const ip = getClientIp();
      await checkRateLimit(`user:${session.userId}`, "ai");

      const parsed = suggestCaptionsSchema.safeParse(data);
      if (!parsed.success) {
        throw new ValidationError("Validation failed", formatZodIssues(parsed.error.issues));
      }

      const { headline, offer: reqOffer, price, platform, tone: reqTone, business_name: reqBiz } = parsed.data;

      // Fetch brand kit + business context
      const context = await queryOne<BrandKitRow & BusinessRow>`
        SELECT bk.caption_tone, bk.default_hashtags,
               b.name, b.business_type, b.location
        FROM businesses b
        LEFT JOIN brand_kits bk ON bk.business_id = b.id
        WHERE b.id = ${session.businessId}
      `;

      const tone = reqTone ?? context?.caption_tone ?? "Friendly";
      const businessName = reqBiz ?? context?.name ?? "our business";
      const hashtags = context?.default_hashtags ?? "";
      const location = context?.location ?? "";
      const offer = reqOffer || (headline ? `${headline}${price ? ` — ${price}` : ""}` : (price || "Special offer"));

      log.ai("Groq", "Caption suggestion requested", { offer, business: businessName, tone, platform });

      const suggestions = await generateCaptions({
        offer,
        businessName,
        tone,
        platform,
        location,
        hashtags,
      });

      // Store suggestion record (for analytics)
      const modelUsed = (process.env["OPENAI_API_KEY"]?.trim())
        ? (process.env["OPENAI_MODEL"] ?? "gpt-4o-mini")
        : (process.env["GROQ_MODEL"] ?? "qwen/qwen3.8-27b");

      await query`
        INSERT INTO caption_suggestions (business_id, suggestions, model_used)
        VALUES (
          ${session.businessId},
          ${JSON.stringify(suggestions)}::jsonb,
          ${modelUsed}
        )
      `;

      log.db("Neon", "Stored caption suggestions", { count: suggestions.length, model: modelUsed });

      return apiSuccess({ suggestions }, "Captions generated successfully");
    } catch (err) {
      return errorToResponse(err);
    }
  });

// ─── Caption Generation Engine ────────────────────────────────────────────────

export async function generateCaptions(opts: {
  offer: string;
  businessName: string;
  tone?: string | undefined;
  platform?: string | undefined;
  location?: string | undefined;
  hashtags?: string | undefined;
}): Promise<CaptionOption[]> {
  const tone = opts.tone ?? "Friendly";
  const platform = opts.platform ?? "Instagram";
  const systemPrompt = buildSystemPrompt({
    businessName: opts.businessName,
    tone,
    platform,
    location: opts.location ?? "",
    hashtags: opts.hashtags ?? "",
  });
  const userPrompt = `Create 3 captions for this exact offer: "${opts.offer}" for ${opts.businessName}.`;

  // 1. Try OpenAI if key is set and non-empty
  const openaiKey = process.env["OPENAI_API_KEY"]?.trim();
  if (openaiKey) {
    try {
      const res = await callOpenAI(openaiKey, systemPrompt, userPrompt);
      if (res.length === 3) return res;
    } catch (err) {
      log.ai("OpenAI", "Failed, falling back to Groq");
    }
  }

  // 2. Use Groq (primary when OpenAI key is empty or on fallback)
  const groqKey = process.env["GROQ_API_KEY"]?.trim();
  if (groqKey) {
    try {
      const res = await callGroq(groqKey, systemPrompt, userPrompt);
      if (res.length === 3) return res;
    } catch (err) {
      log.ai("Groq", `Request failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // 3. Graceful fallback template captions if all providers fail or are missing
  log.ai("Groq", "Using local fallback caption templates");
  return generateTemplateCaptions({
    offer: opts.offer,
    businessName: opts.businessName,
  });
}

async function callOpenAI(
  apiKey: string,
  systemPrompt: string,
  userPrompt: string
): Promise<CaptionOption[]> {
  const model = process.env["OPENAI_MODEL"] ?? "gpt-4o-mini";
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      max_tokens: 800,
      temperature: 0.7,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
    signal: AbortSignal.timeout(15_000),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new ExternalServiceError("OpenAI", `${response.status}: ${text}`);
  }

  const json = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = json.choices?.[0]?.message?.content ?? "";
  return parseJsonCaptions(content);
}

async function callGroq(
  apiKey: string,
  systemPrompt: string,
  userPrompt: string
): Promise<CaptionOption[]> {
  const model = process.env["GROQ_MODEL"] ?? "qwen/qwen3.8-27b";
  log.ai("Groq", `Sending request to https://api.groq.com/openai/v1/chat/completions`, { model });
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      max_tokens: 800,
      temperature: 0.7,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
    signal: AbortSignal.timeout(15_000),
  });

  if (!response.ok) {
    const text = await response.text();
    log.ai("Groq", `HTTP ${response.status} Error: ${text.slice(0, 100)}`);
    throw new ExternalServiceError("Groq", `${response.status}: ${text}`);
  }

  const json = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = json.choices?.[0]?.message?.content ?? "";
  const parsed = parseJsonCaptions(content);
  log.ai("Groq", `HTTP 200 OK: Generated ${parsed.length} caption options`, { count: parsed.length, model });
  return parsed;
}

// ─── Prompt builders ──────────────────────────────────────────────────────────

function buildSystemPrompt(opts: {
  businessName: string;
  tone: string;
  platform: string;
  location: string;
  hashtags: string;
}): string {
  const toneGuide: Record<string, string> = {
    Friendly: "warm, approachable, conversational",
    Premium: "refined, elegant, confident",
    Playful: "energetic, fun, enthusiastic",
    Direct: "short, crisp, benefit-first",
  };

  return `You are a social media caption copywriter for ${opts.businessName}${opts.location ? ` in ${opts.location}` : ""}.
STRICT REQUIREMENTS:
1. CTA (Call To Action) MUST BE FIRST in every caption (e.g. "Tap now to...", "Claim your...", "Visit us today...", "Order now...").
2. Keep facts exact: do NOT invent prices, discounts, or dates that are not provided in the prompt.
3. Use a maximum of 1-2 emojis per caption.
4. Tone: ${toneGuide[opts.tone] ?? toneGuide["Friendly"]}.
5. Platform: ${opts.platform}.
6. Output EXACTLY 3 caption options as a valid JSON array of objects:
[
  { "caption": "CTA first sentence. Remaining details here.", "hashtags": "#hashtag1 #hashtag2 #hashtag3" },
  { "caption": "CTA first sentence. Remaining details here.", "hashtags": "#hashtag1 #hashtag2 #hashtag3" },
  { "caption": "CTA first sentence. Remaining details here.", "hashtags": "#hashtag1 #hashtag2 #hashtag3" }
]
${opts.hashtags ? `Include these brand hashtags: ${opts.hashtags}` : ""}
Output ONLY valid raw JSON. Do not write explanations or markdown code blocks.`;
}

function parseJsonCaptions(content: string): CaptionOption[] {
  let cleaned = content.trim();
  // Strip markdown code block
  const jsonBlockMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (jsonBlockMatch?.[1]) {
    cleaned = jsonBlockMatch[1].trim();
  }

  // Try parsing array
  const arrayMatch = cleaned.match(/\[\s*\{[\s\S]*\}\s*\]/);
  if (arrayMatch) {
    try {
      const parsed = JSON.parse(arrayMatch[0]);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.slice(0, 3).map((item) => ({
          caption: typeof item.caption === "string" ? item.caption.trim() : String(item),
          hashtags: typeof item.hashtags === "string" ? item.hashtags.trim() : "",
        }));
      }
    } catch {}
  }

  try {
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.slice(0, 3).map((item) => ({
        caption: typeof item.caption === "string" ? item.caption.trim() : String(item),
        hashtags: typeof item.hashtags === "string" ? item.hashtags.trim() : "",
      }));
    }
  } catch {}

  // Multi-line regex extraction
  const results: CaptionOption[] = [];
  const objRegex = /"caption"\s*:\s*"((?:\\.|[^"\\])*)"[\s,]*"hashtags"\s*:\s*"((?:\\.|[^"\\])*)"/g;
  let match: RegExpExecArray | null;
  while ((match = objRegex.exec(content)) !== null) {
    if (match[1]) {
      results.push({
        caption: match[1].replace(/\\"/g, '"').replace(/\\n/g, "\n").trim(),
        hashtags: (match[2] ?? "").replace(/\\"/g, '"').trim(),
      });
    }
  }

  if (results.length > 0) {
    return results.slice(0, 3);
  }

  // Fallback: clean lines, stripping any stray JSON tokens
  const lines = content
    .split("\n")
    .map((l) =>
      l
        .replace(/^[\d]+[.)]\s*/, "")
        .replace(/^[{}\[\]",]+|[{}\[\]",]+$/g, "")
        .replace(/"caption"\s*:\s*"?/g, "")
        .replace(/"hashtags"\s*:\s*"?/g, "")
        .trim()
    )
    .filter((l) => l.length > 15 && !l.startsWith("{") && !l.startsWith("["))
    .slice(0, 3);

  if (lines.length > 0) {
    return lines.map((line) => ({
      caption: line,
      hashtags: "#SpecialOffer #PostPilot",
    }));
  }

  return [];
}

function generateTemplateCaptions(opts: {
  offer: string;
  businessName: string;
}): CaptionOption[] {
  return [
    {
      caption: `Claim this today: ${opts.offer} at ${opts.businessName}! Treat yourself to something special. ✨`,
      hashtags: `#${opts.businessName.replace(/\s+/g, "")} #SpecialOffer #TopPick`,
    },
    {
      caption: `Don't miss out on ${opts.offer}! Visit ${opts.businessName} and make the most of it today. 🎯`,
      hashtags: `#${opts.businessName.replace(/\s+/g, "")} #DailySpecial #MustTry`,
    },
    {
      caption: `Tap to explore ${opts.offer}. Freshly crafted for you at ${opts.businessName}. 🌟`,
      hashtags: `#${opts.businessName.replace(/\s+/g, "")} #Community #QualityFirst`,
    },
  ];
}
