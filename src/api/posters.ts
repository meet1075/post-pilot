/**
 * PostPilot — Poster Generation API (TanStack Server Function)
 *
 * Generates poster options using the Ideogram API.
 * The AI generates background/artwork; the actual offer text (headline,
 * price, date) is always overlaid in code to guarantee accuracy.
 *
 * Rate limited to 10 requests/min per user (AI endpoint tier).
 *
 * Config:
 *  IDEOGRAM_API_KEY   - Ideogram API key
 *  IDEOGRAM_MODEL     - e.g. "V_2_TURBO" (default)
 */

import { createServerFn } from "@tanstack/react-start";
import { requireAuth } from "../lib/auth.js";
import { query, queryOne } from "../lib/db.js";
import { checkRateLimit, getClientIp } from "../lib/rateLimit.js";
import { generatePostersSchema } from "../lib/validators.js";
import {
  errorToResponse,
  ForbiddenError,
  ValidationError,
  ExternalServiceError,
} from "../lib/errors.js";
import { uploadPosterImage } from "../lib/storage.js";
import { log } from "../lib/logger.js";
import { apiSuccess, formatZodIssues } from "../lib/apiResponse.js";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PosterOption {
  id: string;
  theme: string;
  eyebrow: string;
  headline: string;
  price: string;
  footer: string;
  /** Public URL of the generated background image (if Ideogram was called) */
  imageUrl?: string | undefined;
}

interface BrandKitRow {
  colors: string[];
  font: string;
  caption_tone: string;
}

interface BusinessRow {
  name: string;
  tagline: string;
  location: string;
}

// ─── Theme definitions ────────────────────────────────────────────────────────

const POSTER_THEMES: Array<{
  theme: string;
  eyebrow: string;
  footer: string;
  colorHex: string;
}> = [
  { theme: "tomato", eyebrow: "EVERY DAY", footer: "GOOD FOOD, GOOD COMPANY", colorHex: "#B91C1C" },
  { theme: "olive", eyebrow: "A LITTLE SOMETHING", footer: "MADE FRESH DAILY", colorHex: "#4D7C0F" },
  { theme: "cream", eyebrow: "THE NEIGHBOURHOOD TABLE", footer: "COME HUNGRY · LEAVE HAPPY", colorHex: "#D97706" },
  { theme: "mustard", eyebrow: "A REASON TO GATHER", footer: "YOUR TABLE IS WAITING", colorHex: "#92400E" },
];

// ─── generatePosters ──────────────────────────────────────────────────────────

export const generatePosters = createServerFn({ method: "POST" })
  .validator((d: unknown) => d)
  .handler(async ({ data }) => {
    try {
      const session = await requireAuth();
      if (!session.businessId) throw new ForbiddenError("No active business");

      const ip = getClientIp();
      await checkRateLimit(`user:${session.userId}`, "ai");

      const parsed = generatePostersSchema.safeParse(data);
      if (!parsed.success) {
        throw new ValidationError("Validation failed", formatZodIssues(parsed.error.issues));
      }

      const { prompt, style, use_brand } = parsed.data;
      log.ai("Ideogram", "Poster options requested", { prompt: prompt.length > 40 ? prompt.slice(0, 40) + "…" : prompt, style: style || "Bold" });

      // Fetch brand kit if use_brand is true
      let brand: (BrandKitRow & { business_name: string; tagline?: string; location?: string }) | null = null;
      if (use_brand) {
        const row = await queryOne<BrandKitRow & { business_name: string; tagline: string; location: string }>`
          SELECT bk.colors, bk.font, bk.caption_tone, b.name AS business_name,
                 b.tagline, b.location
          FROM brand_kits bk
          JOIN businesses b ON b.id = bk.business_id
          WHERE bk.business_id = ${session.businessId}
        `;
        if (row) {
          brand = row;
        }
      }

      // Analyze user prompt with Groq LLM (extracts 4 tailored headlines, price, and clean visual prompt)
      const aiAnalysis = await analyzePromptWithAi({
        prompt,
        style: style || "Bold",
        businessName: brand?.business_name,
        tagline: brand?.tagline,
      });

      // Call Ideogram for background images using the AI-crafted visual prompt
      const ideogramImages = await callIdeogramApi(aiAnalysis.visualPrompt);

      // Extract brand colors or defaults
      const brandColors = (brand?.colors && Array.isArray(brand.colors) && brand.colors.length > 0)
        ? brand.colors.map((c) => c.toLowerCase())
        : ["tomato", "olive", "mustard", "plum"];

      const brandFooter = brand?.tagline || "IDEAS INTO SCALABLE PRODUCTS";

      // Build poster options (merge AI backgrounds with theme configs)
      const options: PosterOption[] = POSTER_THEMES.map((t, index) => {
        const themeChoice = brandColors[index % brandColors.length] || t.theme;
        return {
          id: `option-${index + 1}`,
          theme: themeChoice,
          eyebrow: brand?.business_name
            ? brand.business_name.toUpperCase()
            : t.eyebrow,
          headline: aiAnalysis.headlines[index] || inferHeadline(prompt, index),
          price: aiAnalysis.price,
          footer: brandFooter,
          imageUrl: ideogramImages[index],
        };
      });

      // Store generation record
      await query`
        INSERT INTO poster_generations (business_id, prompt, options, model_used, cost_usd)
        VALUES (
          ${session.businessId},
          ${prompt},
          ${JSON.stringify(options)}::jsonb,
          ${process.env["IDEOGRAM_MODEL"] ?? "ideogram-4-5"},
          ${ideogramImages.length > 0 ? 0.06 * ideogramImages.length : 0}
        )
      `;

      log.db("Neon", "Stored poster generation options", { count: options.length, hasAiImages: ideogramImages.length > 0 });

      return apiSuccess({ options }, "Poster options generated successfully");
    } catch (err) {
      return errorToResponse(err);
    }
  }
);

// ─── Ideogram API caller ──────────────────────────────────────────────────────

export async function callIdeogramApi(prompt: string, dryRun = false): Promise<string[]> {
  const apiKey = process.env["IDEOGRAM_API_KEY"]?.trim();

  // If no API key, return empty (frontend renders CSS-only posters)
  if (!apiKey) {
    log.ai("Ideogram", "IDEOGRAM_API_KEY not configured — rendering dynamic CSS poster templates");
    return [];
  }

  const model = process.env["IDEOGRAM_MODEL"] ?? "ideogram-4-5";
  const quality = process.env["IDEOGRAM_QUALITY"] ?? "low";
  const endpoint = `https://api.ideogram.ai/v2/image/generate/${model}${dryRun ? "?dry_run=true" : ""}`;

  log.ai("Ideogram", `Requesting image generation from ${model}`, { quality, aspect_ratio: "4:5", endpoint });

  try {
    // Retry with exponential backoff on 429
    let response: Response | null = null;
    let delay = 1000;
    const maxRetries = 2;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Api-Key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          aspect_ratio: "4:5", // Instagram-safe portrait (supports 1:1 or 4:5)
          quality,
        }),
        signal: AbortSignal.timeout(45_000),
      });

      if (response.status === 429 && attempt < maxRetries) {
        log.ai("Ideogram", `Rate limited (429). Retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
        await new Promise((r) => setTimeout(r, delay));
        delay *= 2;
        continue;
      }
      break;
    }

    if (!response) return [];

    // Handle 401 (invalid key), 402 (no credits), 429 (rate limit)
    if (response.status === 401) {
      log.ai("Ideogram", "HTTP 401 Unauthorized (Invalid API key) — using dynamic CSS poster rendering", { status: 401 });
      return [];
    }
    if (response.status === 402) {
      log.ai("Ideogram", "HTTP 402 Payment Required: Ideogram credits depleted (0 balance) — using dynamic CSS poster rendering", { status: 402, fallback: "CSS Canvas" });
      return [];
    }
    if (response.status === 429) {
      log.ai("Ideogram", "HTTP 429 Rate limit exceeded — using dynamic CSS poster rendering", { status: 429 });
      return [];
    }
    if (!response.ok) {
      const errText = await response.text();
      log.ai("Ideogram", `HTTP ${response.status} Error — using dynamic CSS poster rendering: ${errText.slice(0, 100)}`, { status: response.status });
      return [];
    }

    if (dryRun) {
      return ["https://storage.example.com/dry-run-validated-poster.png"];
    }

    const json = (await response.json()) as {
      data?: Array<{ url: string }>;
    };

    const rawUrls = json.data?.map((d) => d.url).filter(Boolean) as string[] ?? [];
    if (rawUrls.length === 0) return [];

    log.ai("Ideogram", `HTTP 200 OK: Generated ${rawUrls.length} background images`, { count: rawUrls.length });

    // Download image immediately and save to our storage to avoid expired URL
    const savedUrls: string[] = [];
    for (let i = 0; i < rawUrls.length; i++) {
      const rawUrl = rawUrls[i]!;
      try {
        const imgRes = await fetch(rawUrl);
        if (!imgRes.ok) {
          savedUrls.push(rawUrl);
          continue;
        }
        const arrayBuffer = await imgRes.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const storageKey = `posters/generated/${Date.now()}-${i + 1}.png`;
        const { publicUrl } = await uploadPosterImage({
          key: storageKey,
          body: buffer,
          contentType: "image/png",
        });
        savedUrls.push(publicUrl);
        log.storage("Supabase", `Saved Ideogram poster to CDN storage`, { key: storageKey });
      } catch (uploadErr) {
        log.storage("Supabase", "Storage upload failed, using source URL as fallback");
        savedUrls.push(rawUrl);
      }
    }

    return savedUrls;
  } catch (err) {
    log.ai("Ideogram", `Request failed: ${err instanceof Error ? err.message : String(err)} — falling back to CSS templates`);
    return [];
  }
}

// ─── AI Prompt Analysis & Ideogram Prompt Building ───────────────────────────

async function analyzePromptWithAi(opts: {
  prompt: string;
  style: string;
  businessName?: string | undefined;
  tagline?: string | undefined;
}): Promise<{
  headlines: string[];
  price: string;
  visualPrompt: string;
}> {
  const apiKey = process.env["GROQ_API_KEY"]?.trim();
  const model = process.env["GROQ_MODEL"] ?? "qwen/qwen3.8-27b";

  if (!apiKey) {
    return {
      headlines: [inferHeadline(opts.prompt, 0), inferHeadline(opts.prompt, 1), inferHeadline(opts.prompt, 2), inferHeadline(opts.prompt, 3)],
      price: opts.prompt.match(/(?:₹|Rs\.?|INR|kr|\$|€|£)?\s*\d[\d,.]*/i)?.[0]?.trim() ?? "",
      visualPrompt: buildIdeogramPrompt(opts),
    };
  }

  try {
    log.ai("Groq", "Analyzing user prompt with LLM for intelligent poster generation", { prompt: opts.prompt, model });
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content: `You are an expert social media advertising director and art director for "${opts.businessName || "Avero Innovations"}".
Analyze the user prompt. Even if the user message is brief, casual, or conversational, thoroughly extract the core intent, topic, offer, and theme.
Return ONLY a valid JSON object with keys:
- "headlines": array of exactly 4 punchy, distinct, high-converting poster headlines (each max 5 words) tailored directly to the user's specific announcement/idea.
- "price": any price, discount, or offer mentioned in the prompt (e.g. "50% OFF", "₹4,999", "Free Trial", "150 rs"), or empty string if none.
- "visualPrompt": an ultra-detailed image generation prompt (35-50 words) describing a professional commercial background photography setting that perfectly matches the user's topic and business type. CRITICAL: Explicitly specify NO text, NO typography, NO words, NO letters, soft ambient lighting, shallow depth of field, 8k resolution, editorial style.`,
          },
          {
            role: "user",
            content: opts.prompt,
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
      }),
      signal: AbortSignal.timeout(10_000),
    });

    if (response.ok) {
      const data = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
      const rawContent = data.choices?.[0]?.message?.content;
      if (rawContent) {
        const parsed = JSON.parse(rawContent);
        if (Array.isArray(parsed.headlines) && parsed.headlines.length >= 4) {
          log.ai("Groq", "LLM prompt analysis successful", { headlines: parsed.headlines, price: parsed.price });
          return {
            headlines: parsed.headlines.slice(0, 4).map((h: any) => String(h).trim()),
            price: String(parsed.price ?? "").trim(),
            visualPrompt: String(parsed.visualPrompt ?? buildIdeogramPrompt(opts)).trim(),
          };
        }
      }
    }
  } catch (err) {
    log.ai("Groq", `LLM prompt analysis fallback: ${err instanceof Error ? err.message : String(err)}`);
  }

  // Graceful fallback
  const priceMatch = opts.prompt.match(/(?:₹|Rs\.?|INR|kr|\$|€|£)?\s*\d[\d,.]*/i);
  return {
    headlines: [inferHeadline(opts.prompt, 0), inferHeadline(opts.prompt, 1), inferHeadline(opts.prompt, 2), inferHeadline(opts.prompt, 3)],
    price: priceMatch?.[0]?.trim() ?? "",
    visualPrompt: buildIdeogramPrompt(opts),
  };
}

function buildIdeogramPrompt(opts: {
  prompt: string;
  style: string;
  businessName?: string | undefined;
}): string {
  const styleMap: Record<string, string> = {
    Bold: "bold graphic poster background, strong contrast, vibrant lighting",
    Minimal: "clean minimal poster background, lots of white space, subtle textures",
    Festive: "festive celebration background, warm lighting, rich tones",
    Elegant: "elegant premium poster background, refined aesthetic, soft ambient light",
  };

  const styleDesc = styleMap[opts.style] ?? styleMap["Bold"]!;
  const business = opts.businessName ? `for ${opts.businessName}, ` : "";

  return `A ${styleDesc} commercial social media background ${business}matching topic: "${opts.prompt}", clean composition, soft bokeh background, high quality editorial photography, strictly no text, no words, no numbers, no typography`.trim();
}

function inferHeadline(prompt: string, index: number): string {
  const lower = prompt.toLowerCase();
  const alternatives = [
    "Built for what's next",
    "Transforming your vision",
    "Experience the difference",
    "Turning ideas into reality",
  ];

  if (lower.includes("ai") || lower.includes("tech") || lower.includes("software") || lower.includes("tool") || lower.includes("app") || lower.includes("web")) {
    return ["Built for what's next", "Intelligence in action", "Transforming your workflow", "The future is here"][index] ?? alternatives[index]!;
  }
  if (lower.includes("launch") || lower.includes("new") || lower.includes("announc") || lower.includes("open")) {
    return ["Introducing our latest", "It's finally here", "Step into the future", "Crafted for excellence"][index] ?? alternatives[index]!;
  }
  if (lower.includes("offer") || lower.includes("deal") || lower.includes("discount") || lower.includes("sale") || lower.includes("trial") || lower.includes("free") || lower.includes("rs") || lower.includes("%")) {
    return ["Limited time offer", "Unlock your exclusive deal", "Your moment is now", "Don't miss this opportunity"][index] ?? alternatives[index]!;
  }
  if (lower.includes("coffee") || lower.includes("cafe") || lower.includes("food") || lower.includes("dining") || lower.includes("pizza")) {
    return ["A good reason to gather", "Handcrafted for you", "Taste the craft", "Your daily moment"][index] ?? alternatives[index]!;
  }
  return alternatives[index] ?? "Turning ideas into reality";
}

// ─── uploadPosterDataUrl ──────────────────────────────────────────────────────

export const uploadPosterDataUrl = createServerFn({ method: "POST" })
  .validator((d: { dataUrl: string; filename?: string }) => d)
  .handler(async ({ data }) => {
    try {
      const session = await requireAuth();
      const base64Data = data.dataUrl.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64Data, "base64");
      const key = `posters/${session.businessId || "general"}/${Date.now()}-${data.filename || "poster"}.png`;
      const { publicUrl } = await uploadPosterImage({
        key,
        body: buffer,
        contentType: "image/png",
      });
      log.storage("Supabase", "Uploaded rendered poster PNG canvas", { key, publicUrl });
      return apiSuccess({ publicUrl }, "Poster canvas uploaded successfully", 201);
    } catch (err) {
      log.storage("Supabase", `Failed to upload poster canvas PNG: ${err instanceof Error ? err.message : String(err)}`);
      return errorToResponse(err);
    }
  });
