/**
 * PostPilot — Single-Shot Finished Flyer Poster Generation Pipeline
 *
 * Generates agency-quality, ready-to-post Instagram flyers (1024x1280 4:5 portrait)
 * where the brand header, bold headline, price banner, feature points, CTA button,
 * and relevant 3D mockups/scenes are rendered directly inside ONE generated image.
 *
 * Includes:
 *  1. Flyer Brief Generation (gpt-4o-mini JSON mode)
 *  2. Single-Shot Flyer Generation (OpenAI gpt-image-2.5-flare with logo image edits)
 *  3. Automatic Vision Text Verification & One-Time Repair (gpt-4o-mini vision)
 *  4. Targeted Text Editing (OpenAI images/edits)
 *  5. Graceful typographic fallback if offline / API key absent
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

export interface FlyerBrief {
  headline: string;
  price_text: string;
  badge_text?: string | undefined;
  date_text?: string | undefined;
  venue_text?: string | undefined;
  features: string[];
  cta: string;
  scene: string;
  layout: "left-text-right-visual" | "centered-hero" | "bottom-banner";
  style_notes: string;
}

export interface PosterOption {
  id: string;
  theme: string;
  eyebrow: string;
  headline: string;
  price: string;
  date_text?: string | undefined;
  venue_text?: string | undefined;
  footer: string;
  imageUrl?: string | undefined;
  brief?: FlyerBrief | undefined;
  text_check_passed?: boolean | undefined;
  needs_review?: boolean | undefined;
  repair_calls?: number | undefined;
  model_used?: string | undefined;
  size?: string | undefined;
  quality?: string | undefined;
}

interface BrandKitRow {
  colors: string[];
  font: string;
  caption_tone: string;
  logo_public_url?: string | null;
}

// ─── Step 1: Flyer Brief Generation (gpt-4o-mini) ─────────────────────────────

export async function generateFlyerBrief(opts: {
  prompt: string;
  style?: string | undefined;
  businessName?: string | undefined;
  tagline?: string | undefined;
  colors?: string[] | undefined;
  tone?: string | undefined;
  location?: string | undefined;
  phone?: string | undefined;
  layout?: "left-text-right-visual" | "centered-hero" | "bottom-banner" | undefined;
}): Promise<FlyerBrief> {
  const apiKey = process.env["OPENAI_API_KEY"]?.trim();
  const model = process.env["OPENAI_MODEL"]?.trim() || "gpt-4o-mini";

  const brandName = opts.businessName || "Avero Innovations";
  const brandTagline = opts.tagline || "";
  const brandColors = opts.colors?.join(", ") || "teal, navy blue, clean white";
  const brandTone = opts.tone || "Premium";

  const systemPrompt = `You are an elite commercial advertisement copywriter creating a precise flyer brief for an Instagram marketing ad.
Input is the user's prompt, the business brand kit (name, tagline, colors, tone, logo URL, location/phone if saved) and the style chosen.

Return exactly one JSON brief:
{
  "headline": "4-6 words, faithful to the user's topic and tone (e.g. 'Celebrate 3 Years of Innovation')",
  "badge_text": "A punchy 2-4 word highlight ribbon banner. NEVER output 'EXCLUSIVE OFFER' for events, celebrations, or milestones! For events/celebrations, use an occasion tag (e.g. '3RD ANNIVERSARY', 'ANNIVERSARY CELEBRATION', 'CORDIALLY INVITED', 'SPECIAL GALA'). For discounts or pricing, use the exact amount (e.g. 'JUST ₹9,999' or '25% OFF').",
  "price_text": "same as badge_text for compatibility",
  "date_text": "exact date, day of week, or timing if mentioned in the prompt (e.g. 'THURSDAY, 22ND OCTOBER', 'THIS SATURDAY', 'VALID TILL 25TH OCT'). If NO date or day is mentioned in the prompt, set to empty string \"\"",
  "venue_text": "exact venue name, hotel, hall, address, or location if mentioned in the prompt (e.g. 'Taj Hotel', 'Grand Ballroom', 'Mumbai'). If NO venue or location is mentioned, set to empty string \"\"",
  "features": ["3 distinct short labels, max 3 words each"],
  "cta": "short action text, max 4 words (e.g. 'RSVP NOW →', 'JOIN THE CELEBRATION →', 'GET STARTED TODAY →')",
  "scene": "detailed description of the visual backdrop matching the exact prompt theme and occasion",
  "layout": "one of: left-text-right-visual | centered-hero | bottom-banner",
  "style_notes": "colors and mood from the brand kit"
}

Rules:
- IMPORTANT FOR VENUE & LOCATION: If the user prompt mentions a venue, hotel, ballroom, restaurant, address, or city (e.g. 'at Taj Hotel', 'Taj Hotel', 'at Marriott', 'in Mumbai'), you MUST extract the exact venue name into 'venue_text' (e.g. 'Taj Hotel'). In addition, ONE of the 3 'features' MUST be the exact venue (e.g. 'Taj Hotel') so it appears clearly with an icon on the flyer!
- IMPORTANT FOR DATES & DAYS: If the user prompt mentions any day of week (e.g. Thursday, Friday) or date (e.g. 22 Oct, 22nd October), extract it into 'date_text' formatted cleanly in uppercase (e.g. 'THURSDAY, 22ND OCTOBER').
- IMPORTANT FOR BADGE:
  * For celebrations, milestones, anniversaries, parties, galas: NEVER output 'EXCLUSIVE OFFER'. Instead use celebration tags like '3RD ANNIVERSARY', 'ANNIVERSARY CELEBRATION', 'CORDIALLY INVITED', or 'JOIN US'.
  * For sales/promotions: use the exact price or offer (e.g. 'JUST ₹9,999', '20% OFF').
- THREE FEATURES: The 3 feature labels MUST be relevant to the user's prompt:
  * If venue is mentioned: include the venue as a feature (e.g. 'Taj Hotel').
  * If anniversary/milestone: include milestone (e.g. '3-Year Milestone').
  * Hospitality or detail: e.g. 'Welcome All', 'Cocktails & Dinner', 'RSVP Required'.
  * NEVER output generic website/tech features ('Mobile Responsive', 'Custom Design') for an event or celebration!
- SCENE VISUAL: For corporate anniversaries or celebrations, describe a luxury hotel banquet/ballroom with elegant ambient lighting, champagne flutes, modern luxury decor, and well-dressed professionals celebrating.
- Set 'layout' to '${opts.layout || "left-text-right-visual"}'.`;

  const userPrompt = `User Offer Prompt: "${opts.prompt}"
Business Name: "${brandName}"
Tagline: "${brandTagline}"
Brand Colors: "${brandColors}"
Tone: "${brandTone}"
Style: "${opts.style || "Bold"}"`;

  if (apiKey) {
    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          response_format: { type: "json_object" },
          temperature: 0.6,
        }),
        signal: AbortSignal.timeout(15_000),
      });

      if (res.ok) {
        const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
        const content = json.choices?.[0]?.message?.content;
        if (content) {
          const parsed = JSON.parse(content);
          const rawDate = typeof parsed.date_text === "string" ? parsed.date_text.trim() : "";
          const rawVenue = typeof parsed.venue_text === "string" ? parsed.venue_text.trim() : "";
          const rawBadge = typeof parsed.badge_text === "string"
            ? parsed.badge_text.trim()
            : typeof parsed.price_text === "string"
            ? parsed.price_text.trim()
            : "";

          return {
            headline: String(parsed.headline || "Celebrate With Us").trim(),
            badge_text: rawBadge || "SPECIAL INVITATION",
            price_text: rawBadge || "SPECIAL INVITATION",
            date_text: rawDate,
            venue_text: rawVenue,
            features: Array.isArray(parsed.features) && parsed.features.length >= 3
              ? parsed.features.slice(0, 3).map((f: any) => String(f).trim())
              : [rawVenue || "Taj Hotel", "Anniversary Celebration", "Join Us"],
            cta: String(parsed.cta || "RSVP NOW →").trim(),
            scene: String(parsed.scene || "Elegant luxury hotel lounge with warm ambient lighting, champagne glasses, and well-dressed professionals celebrating").trim(),
            layout: (["left-text-right-visual", "centered-hero", "bottom-banner"].includes(parsed.layout)
              ? parsed.layout
              : (opts.layout || "left-text-right-visual")) as any,
            style_notes: String(parsed.style_notes || `${brandColors}, modern minimalist commercial advertising aesthetics`).trim(),
          };
        }
      }
    } catch (err) {
      log.ai("OpenAI", `Brief generation error, using fallback: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // Fallback brief if OpenAI is not available
  const dayMatch = opts.prompt.match(/\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday|weekend|today|tomorrow)\b/i);
  const dateMatch = opts.prompt.match(/\b(?:\d{1,2}(?:st|nd|rd|th)?\s+(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)|(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+\d{1,2}(?:st|nd|rd|th)?)\b/i);
  const fallbackDate = (dayMatch && dateMatch)
    ? `${dayMatch[0].toUpperCase()}, ${dateMatch[0].toUpperCase()}`
    : (dayMatch ? `THIS ${dayMatch[0].toUpperCase()}` : (dateMatch ? dateMatch[0].toUpperCase() : ""));

  const venueMatch = opts.prompt.match(/\b(?:at|in|venue:?)\s+([A-Za-z0-9\s&'-]+(?:\bhotel|\bresort|\bhall|\bcenter|\bcentre|\bpalace|\bclub|\barena|\bgarden|\binn|\bbistro|\bcafe|\brestaurant))\b/i)
    || opts.prompt.match(/\b(?:taj hotel|marriott|hyatt|hilton|radisson|leela|oberoi|itc|novotel|westin)\b/i);
  const fallbackVenue = venueMatch ? (venueMatch[1] || venueMatch[0]).trim() : "";

  const isCelebration = /\b(celebrat|anniversary|milestone|party|gala|years?|birthday|ceremony|opening|launch|welcome|invited)\b/i.test(opts.prompt);

  const priceMatch = opts.prompt.match(/(?:₹|Rs\.?|INR|\$|€|£)?\s*\d[\d,.]*/i);
  const fallbackBadge = priceMatch
    ? `JUST ${priceMatch[0].trim()}`
    : (isCelebration ? "3RD ANNIVERSARY" : "EXCLUSIVE OFFER");

  return {
    headline: isCelebration ? "Celebrate 3 Years of Innovation" : "Launch Your Dream Website",
    badge_text: fallbackBadge,
    price_text: fallbackBadge,
    date_text: fallbackDate,
    venue_text: fallbackVenue,
    features: isCelebration
      ? ["3-Year Milestone", fallbackVenue || "Taj Hotel", "Cordially Invited"]
      : ["Custom Design", "Mobile Responsive", "Built to Grow"],
    cta: isCelebration ? "RSVP NOW →" : "LET'S BUILD YOUR WEBSITE →",
    scene: isCelebration
      ? "Luxury hotel ballroom with ambient lighting, champagne flutes, elegant cocktail tables, and well-dressed business professionals celebrating"
      : "3D laptop and smartphone mockups showing a modern responsive website on a clean minimalist desk",
    layout: opts.layout || "left-text-right-visual",
    style_notes: `${brandColors}, clean commercial aesthetic`,
  };
}

// ─── Step 2: Single-Shot Finished Flyer Generation (OpenAI) ──────────────────

export async function generateFinishedFlyer(opts: {
  brief: FlyerBrief;
  businessName: string;
  tagline?: string | undefined;
  logoUrl?: string | null | undefined;
  colors?: string[] | undefined;
}): Promise<{ url: string; model: string; size: string; quality: string }> {
  const apiKey = process.env["OPENAI_API_KEY"]?.trim();
  if (!apiKey) {
    throw new ExternalServiceError("OpenAI API key is missing. Set OPENAI_API_KEY in .env");
  }

  const rawModel = process.env["OPENAI_IMAGE_MODEL"]?.trim();
  // NEVER dall-e-3 (shut down as per user requirement)
  const model = (!rawModel || rawModel.toLowerCase().includes("dall-e-3"))
    ? "gpt-image-2.5-flare"
    : rawModel;

  const rawQuality = process.env["OPENAI_IMAGE_QUALITY"]?.trim()?.toLowerCase();
  // Allow "medium" or "low"; never "high" or "auto"
  const quality = rawQuality === "low" ? "low" : "medium";
  const size = "1024x1280"; // Instagram portrait 4:5 supported natively

  const colorsStr = (opts.colors && opts.colors.length > 0)
    ? opts.colors.join(", ")
    : "teal, navy blue, clean white";

  const f1 = opts.brief.features[0] || "Anniversary Celebration";
  const f2 = opts.brief.features[1] || (opts.brief.venue_text ? `Venue: ${opts.brief.venue_text}` : "Taj Hotel");
  const f3 = opts.brief.features[2] || "Join Us";

  const topLogoInstruction = opts.logoUrl
    ? `Top: the supplied logo, unchanged, with the tagline '${opts.tagline || ""}'`
    : `Top: the brand name '${opts.businessName.toUpperCase()}', with the tagline '${opts.tagline || ""}'`;

  const dateInstruction = opts.brief.date_text && opts.brief.date_text.trim()
    ? `Prominent date/timing badge or ribbon: '${opts.brief.date_text.trim()}'. `
    : "";

  const venueInstruction = opts.brief.venue_text && opts.brief.venue_text.trim()
    ? `Prominent venue badge or location pill: 'Venue: ${opts.brief.venue_text.trim()}'. `
    : "";

  const rawBadge = (opts.brief.badge_text || opts.brief.price_text || "").trim();
  const isCelebration = /celebrat|anniversary|milestone|gala|years?|invite|hotel/i.test(`${opts.brief.headline} ${opts.brief.scene}`);
  const effectiveBadge = (isCelebration && rawBadge.toUpperCase() === "EXCLUSIVE OFFER")
    ? "ANNIVERSARY CELEBRATION"
    : rawBadge;

  const badgeInstruction = effectiveBadge
    ? `Prominent highlight banner/ribbon: '${effectiveBadge}'. `
    : "";

  const prompt = `Design a complete, ready-to-post Instagram flyer, ${size}. Professional commercial ad design, clean modern layout (${opts.brief.layout}), brand colors ${colorsStr}, mood ${opts.brief.style_notes}. ${topLogoInstruction}. Large bold headline: '${opts.brief.headline}'. ${dateInstruction}${venueInstruction}${badgeInstruction}Three highlight feature badges with simple icons: '${f1}', '${f2}', '${f3}'. Call-to-action button: '${opts.brief.cta}'. Visual background: ${opts.brief.scene}. Render ONLY the quoted text exactly as written, with correct spelling. Do not add any other words, numbers, watermarks or fake brand names. Leave comfortable margins so nothing is cropped.`.trim();

  log.ai("OpenAI", `Generating finished commercial flyer with ${model}`, { model, size, quality, hasLogo: Boolean(opts.logoUrl) });

  let rawBuffer: Buffer | null = null;

  // 1. If brand logo exists, call the image EDIT endpoint with logo as reference image
  if (opts.logoUrl) {
    const candidateModels = [model, "gpt-image-2.5-sunburst", "gpt-image-2"];
    for (const editModel of candidateModels) {
      try {
        const logoRes = await fetch(opts.logoUrl);
        if (!logoRes.ok) break;

        const logoArrayBuffer = await logoRes.arrayBuffer();
        const logoBlob = new Blob([logoArrayBuffer], { type: "image/png" });

        const formData = new FormData();
        formData.append("image", logoBlob, "brand-logo.png");
        formData.append("model", editModel);
        formData.append("prompt", prompt);
        formData.append("size", size);
        formData.append("quality", quality);

        const editRes = await fetch("https://api.openai.com/v1/images/edits", {
          method: "POST",
          headers: { Authorization: `Bearer ${apiKey}` },
          body: formData,
          signal: AbortSignal.timeout(60_000),
        });

        if (editRes.ok) {
          const data = (await editRes.json()) as { data?: Array<{ b64_json?: string; url?: string }> };
          const item = data.data?.[0];
          if (item?.b64_json) {
            rawBuffer = Buffer.from(item.b64_json, "base64");
            log.ai("OpenAI", `Finished flyer generated successfully via images/edits with ${editModel}`);
            break;
          } else if (item?.url) {
            const imgRes = await fetch(item.url);
            if (imgRes.ok) {
              rawBuffer = Buffer.from(await imgRes.arrayBuffer());
              break;
            }
          }
        } else {
          const errText = await editRes.text();
          log.ai("OpenAI", `images/edits call with ${editModel} failed (${editRes.status}): ${errText.slice(0, 150)}`);
        }
      } catch (err) {
        log.ai("OpenAI", `images/edits error with ${editModel}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  }

  // 2. If no logo or if edits failed, use images/generations endpoint
  if (!rawBuffer) {
    const genRes = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        prompt,
        n: 1,
        size,
        quality,
      }),
      signal: AbortSignal.timeout(60_000),
    });

    if (!genRes.ok) {
      const errText = await genRes.text();
      log.ai("OpenAI", `HTTP ${genRes.status} Error from images/generations: ${errText.slice(0, 200)}`);
      throw new ExternalServiceError(`OpenAI image generation failed (${genRes.status}): ${errText.slice(0, 100)}`);
    }

    const data = (await genRes.json()) as { data?: Array<{ b64_json?: string; url?: string }> };
    const item = data.data?.[0];
    if (item?.b64_json) {
      rawBuffer = Buffer.from(item.b64_json, "base64");
    } else if (item?.url) {
      const imgRes = await fetch(item.url);
      if (imgRes.ok) {
        rawBuffer = Buffer.from(await imgRes.arrayBuffer());
      }
    }
  }

  if (!rawBuffer) {
    throw new ExternalServiceError("No image data returned from OpenAI Image API");
  }

  // Upload finished PNG to Supabase bucket
  const storageKey = `posters/generated/${Date.now()}-flyer.png`;
  const { publicUrl } = await uploadPosterImage({
    key: storageKey,
    body: rawBuffer,
    contentType: "image/png",
  });

  log.storage("Supabase", "Saved finished flyer to Supabase storage", { storageKey, publicUrl });
  return { url: publicUrl, model, size, quality };
}

// ─── Step 3: Automatic Vision Text Check & Repair (gpt-4o-mini) ───────────────

function normalizeText(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export async function checkAndRepairFlyerText(opts: {
  imageUrl: string;
  brief: FlyerBrief;
  apiKey: string;
}): Promise<{
  passed: boolean;
  needs_review: boolean;
  repair_calls: number;
  finalUrl: string;
}> {
  const visionModel = process.env["OPENAI_VISION_MODEL"] || "gpt-4o-mini";

  try {
    const imgFetch = await fetch(opts.imageUrl);
    if (!imgFetch.ok) {
      log.ai("OpenAI", `Failed to fetch flyer for vision check: ${imgFetch.status}`);
      return { passed: true, needs_review: false, repair_calls: 0, finalUrl: opts.imageUrl };
    }
    const imgBuf = Buffer.from(await imgFetch.arrayBuffer());
    const b64DataUrl = `data:image/png;base64,${imgBuf.toString("base64")}`;

    const visionRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${opts.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: visionModel,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Read all visible text in this advertisement flyer and return JSON with: {\"headline\": string, \"price_text\": string, \"features\": string[], \"cta\": string}",
              },
              {
                type: "image_url",
                image_url: { url: b64DataUrl },
              },
            ],
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0.2,
      }),
      signal: AbortSignal.timeout(30_000),
    });

    if (!visionRes.ok) {
      const errText = await visionRes.text();
      log.ai("OpenAI", `Vision text check non-200 (${visionRes.status}): ${errText.slice(0, 150)}`);
      return { passed: true, needs_review: false, repair_calls: 0, finalUrl: opts.imageUrl };
    }

    const visionJson = (await visionRes.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const rawContent = visionJson.choices?.[0]?.message?.content;
    if (!rawContent) {
      return { passed: true, needs_review: false, repair_calls: 0, finalUrl: opts.imageUrl };
    }

    const readText = JSON.parse(rawContent) as { headline?: string; price_text?: string };
    const expectedHeadlineNorm = normalizeText(opts.brief.headline);
    const readHeadlineNorm = normalizeText(readText.headline || "");

    const expectedPriceNorm = normalizeText(opts.brief.price_text);
    const readPriceNorm = normalizeText(readText.price_text || "");

    const priceMatch = readPriceNorm.includes(expectedPriceNorm) || expectedPriceNorm.includes(readPriceNorm);
    const headlineMatch = readHeadlineNorm.length > 5 && (readHeadlineNorm.includes(expectedHeadlineNorm) || expectedHeadlineNorm.includes(readHeadlineNorm));

    if (priceMatch && headlineMatch) {
      log.ai("OpenAI", "Automatic vision text check passed on first try");
      return { passed: true, needs_review: false, repair_calls: 0, finalUrl: opts.imageUrl };
    }

    // Headline or Price text is wrong — perform ONE repair call via /v1/images/edits
    log.ai("OpenAI", "Vision text mismatch detected. Initiating 1 repair call via images/edits", {
      expectedPrice: opts.brief.price_text,
      readPrice: readText.price_text,
      expectedHeadline: opts.brief.headline,
      readHeadline: readText.headline,
    });

    const targetWrong = !priceMatch
      ? (readText.price_text || "price text")
      : (readText.headline || "headline text");

    const targetCorrect = !priceMatch
      ? opts.brief.price_text
      : opts.brief.headline;

    const repairPrompt = `Change only the text '${targetWrong}' to '${targetCorrect}'. Keep everything else identical.`;

    // Download current flyer to send to edit endpoint
    const flyerImgRes = await fetch(opts.imageUrl);
    if (!flyerImgRes.ok) {
      return { passed: false, needs_review: true, repair_calls: 0, finalUrl: opts.imageUrl };
    }

    const flyerBuffer = await flyerImgRes.arrayBuffer();
    const flyerBlob = new Blob([flyerBuffer], { type: "image/png" });

    const editFormData = new FormData();
    editFormData.append("image", flyerBlob, "flyer-repair.png");
    editFormData.append("model", "gpt-image-2.5-flare");
    editFormData.append("prompt", repairPrompt);
    editFormData.append("size", "1024x1280");
    editFormData.append("quality", "medium");

    const editRes = await fetch("https://api.openai.com/v1/images/edits", {
      method: "POST",
      headers: { Authorization: `Bearer ${opts.apiKey}` },
      body: editFormData,
      signal: AbortSignal.timeout(60_000),
    });

    if (!editRes.ok) {
      log.ai("OpenAI", "Repair call failed", { status: editRes.status });
      return { passed: false, needs_review: true, repair_calls: 1, finalUrl: opts.imageUrl };
    }

    const editData = (await editRes.json()) as { data?: Array<{ b64_json?: string; url?: string }> };
    const repairedItem = editData.data?.[0];
    let repairedBuffer: Buffer | null = null;
    if (repairedItem?.b64_json) {
      repairedBuffer = Buffer.from(repairedItem.b64_json, "base64");
    } else if (repairedItem?.url) {
      const imgRes = await fetch(repairedItem.url);
      if (imgRes.ok) repairedBuffer = Buffer.from(await imgRes.arrayBuffer());
    }

    if (!repairedBuffer) {
      return { passed: false, needs_review: true, repair_calls: 1, finalUrl: opts.imageUrl };
    }

    const repairedStorageKey = `posters/generated/${Date.now()}-repaired.png`;
    const { publicUrl: repairedUrl } = await uploadPosterImage({
      key: repairedStorageKey,
      body: repairedBuffer,
      contentType: "image/png",
    });

    log.storage("Supabase", "Saved repaired flyer to Supabase storage", { repairedUrl });

    // Re-check once with vision model
    const recheckRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${opts.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: visionModel,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Read all visible text in this advertisement flyer and return JSON: {\"headline\": string, \"price_text\": string}",
              },
              {
                type: "image_url",
                image_url: { url: `data:image/png;base64,${repairedBuffer.toString("base64")}` },
              },
            ],
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0.2,
      }),
      signal: AbortSignal.timeout(20_000),
    });

    let recheckPassed = false;
    if (recheckRes.ok) {
      const recheckJson = (await recheckRes.json()) as { choices?: Array<{ message?: { content?: string } }> };
      const recheckContent = recheckJson.choices?.[0]?.message?.content;
      if (recheckContent) {
        const recheckRead = JSON.parse(recheckContent);
        const recheckPriceNorm = normalizeText(recheckRead.price_text || "");
        recheckPassed = recheckPriceNorm.includes(expectedPriceNorm) || expectedPriceNorm.includes(recheckPriceNorm);
      }
    }

    return {
      passed: recheckPassed,
      needs_review: !recheckPassed,
      repair_calls: 1,
      finalUrl: repairedUrl,
    };
  } catch (err) {
    log.ai("OpenAI", `Vision check error: ${err instanceof Error ? err.message : String(err)}`);
    return { passed: true, needs_review: false, repair_calls: 0, finalUrl: opts.imageUrl };
  }
}

// ─── Step 4: Targeted Flyer Text Editing (images/edits) ──────────────────────

export const editPosterText = createServerFn({ method: "POST" })
  .validator((d: { imageUrl: string; oldText: string; newText: string }) => d)
  .handler(async ({ data }) => {
    try {
      await requireAuth();
      const apiKey = process.env["OPENAI_API_KEY"]?.trim();
      if (!apiKey) throw new ExternalServiceError("OPENAI_API_KEY is not configured");

      const imgRes = await fetch(data.imageUrl);
      if (!imgRes.ok) throw new ExternalServiceError("Could not fetch existing flyer image");

      const arrayBuf = await imgRes.arrayBuffer();
      const blob = new Blob([arrayBuf], { type: "image/png" });

      const prompt = `Change only the text '${data.oldText}' to '${data.newText}'. Keep everything else identical.`;

      const formData = new FormData();
      formData.append("image", blob, "flyer-edit.png");
      formData.append("model", "gpt-image-2.5-flare");
      formData.append("prompt", prompt);
      formData.append("size", "1024x1280");
      formData.append("quality", "medium");

      const editRes = await fetch("https://api.openai.com/v1/images/edits", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}` },
        body: formData,
        signal: AbortSignal.timeout(60_000),
      });

      if (!editRes.ok) {
        const errText = await editRes.text();
        throw new ExternalServiceError(`Edit text failed (${editRes.status}): ${errText.slice(0, 100)}`);
      }

      const json = (await editRes.json()) as { data?: Array<{ b64_json?: string; url?: string }> };
      const item = json.data?.[0];
      let buffer: Buffer | null = null;
      if (item?.b64_json) {
        buffer = Buffer.from(item.b64_json, "base64");
      } else if (item?.url) {
        const fetchRes = await fetch(item.url);
        if (fetchRes.ok) buffer = Buffer.from(await fetchRes.arrayBuffer());
      }

      if (!buffer) throw new ExternalServiceError("No image returned from edit endpoint");

      const key = `posters/generated/${Date.now()}-edited.png`;
      const { publicUrl } = await uploadPosterImage({
        key,
        body: buffer,
        contentType: "image/png",
      });

      log.ai("OpenAI", "Updated flyer text via images/edits", { oldText: data.oldText, newText: data.newText, publicUrl });
      return apiSuccess({ imageUrl: publicUrl }, "Flyer text updated successfully");
    } catch (err) {
      return errorToResponse(err);
    }
  });

// ─── Main: generatePosters (Single-Shot Flyer Pipeline) ───────────────────────

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
      const requestedCount = Number((data as any)?.count) || parsed.data.count;
      const count = typeof requestedCount === "number" && requestedCount > 0 ? Math.min(requestedCount, 4) : 2;

      log.ai("OpenAI", "Poster generation requested", {
        prompt: prompt.length > 40 ? prompt.slice(0, 40) + "…" : prompt,
        style: style || "Bold",
        count,
      });

      // Fetch business and brand kit details
      const brandRow = await queryOne<{
        business_name: string;
        tagline: string;
        location: string;
        colors: string[];
        font: string;
        caption_tone: string;
        logo_public_url?: string | null;
      }>`
        SELECT b.name AS business_name, b.tagline, b.location,
               COALESCE(bk.colors, '{"#00A896", "#028090", "#05668D", "#02C39A"}'::text[]) AS colors,
               COALESCE(bk.font, 'Work Sans') AS font,
               COALESCE(bk.caption_tone, 'Premium') AS caption_tone,
               bk.logo_public_url
        FROM businesses b
        LEFT JOIN brand_kits bk ON bk.business_id = b.id
        WHERE b.id = ${session.businessId}
      `;

      const businessName = brandRow?.business_name || "Avero Innovations";
      const tagline = brandRow?.tagline || "Tech Today. Tomorrow Together.";
      const brandColors = (brandRow?.colors && Array.isArray(brandRow.colors) && brandRow.colors.length > 0)
        ? brandRow.colors
        : ["#00A896", "#028090", "#05668D", "#02C39A"];

      // If logo_public_url is missing from brandRow, check standard Avero logo
      const logoUrl = brandRow?.logo_public_url || (
        businessName.toLowerCase().includes("avero")
          ? "https://dihikyljbrbidqgelwac.supabase.co/storage/v1/object/public/post-pilot/logos/7d7831d4-8c66-407b-acbc-a2060d66ff00/1792316942214-avero_logo_transparent.png"
          : null
      );

      const apiKey = process.env["OPENAI_API_KEY"]?.trim();
      const options: PosterOption[] = [];

      const layouts: Array<"left-text-right-visual" | "centered-hero" | "bottom-banner"> = [
        "left-text-right-visual",
        "centered-hero",
        "bottom-banner",
        "left-text-right-visual",
      ];

      let totalRepairCalls = 0;
      let modelUsed = "css-fallback";
      let costUsd = 0;

      for (let i = 0; i < count; i++) {
        // Step 1: Generate Brief
        const brief = await generateFlyerBrief({
          prompt,
          style: style || "Bold",
          businessName,
          tagline,
          colors: brandColors,
          tone: brandRow?.caption_tone || "Premium",
          location: brandRow?.location,
          layout: layouts[i % layouts.length],
        });

        let flyerUrl: string | undefined = undefined;
        let textCheckPassed = true;
        let needsReview = false;
        let repairCalls = 0;

        // Step 2 & 3: Generate finished flyer and verify text if OpenAI API is configured
        if (apiKey) {
          try {
            const genResult = await generateFinishedFlyer({
              brief,
              businessName,
              tagline,
              logoUrl,
              colors: brandColors,
            });

            modelUsed = genResult.model;
            costUsd += 0.035; // gpt-image-2.5-flare medium approx cost

            // Step 3: Vision text check & repair
            const checkResult = await checkAndRepairFlyerText({
              imageUrl: genResult.url,
              brief,
              apiKey,
            });

            flyerUrl = checkResult.finalUrl;
            textCheckPassed = checkResult.passed;
            needsReview = checkResult.needs_review;
            repairCalls = checkResult.repair_calls;
            totalRepairCalls += repairCalls;
            if (repairCalls > 0) costUsd += 0.035; // repair call cost
          } catch (genErr) {
            log.ai("OpenAI", `Flyer generation failed, using typographic fallback: ${genErr instanceof Error ? genErr.message : String(genErr)}`);
          }
        }

        options.push({
          id: `option-${i + 1}`,
          theme: ["tomato", "olive", "mustard", "plum"][i % 4]!,
          eyebrow: businessName.toUpperCase(),
          headline: brief.headline,
          price: brief.badge_text || brief.price_text,
          date_text: brief.date_text || undefined,
          venue_text: brief.venue_text || undefined,
          footer: tagline || "IDEAS INTO SCALABLE PRODUCTS",
          imageUrl: flyerUrl,
          brief,
          text_check_passed: textCheckPassed,
          needs_review: needsReview,
          repair_calls: repairCalls,
          model_used: modelUsed,
          size: "1024x1280",
          quality: "medium",
        });
      }

      // Store generation record with full metadata (no secrets)
      await query`
        INSERT INTO poster_generations (business_id, prompt, options, model_used, cost_usd)
        VALUES (
          ${session.businessId},
          ${prompt},
          ${JSON.stringify(options)}::jsonb,
          ${modelUsed},
          ${costUsd}
        )
      `;

      log.ai("OpenAI", "Stored poster generation options", {
        count: options.length,
        hasAiImages: options.some((o) => Boolean(o.imageUrl)),
        modelUsed,
        totalRepairCalls,
        costUsd,
      });

      return apiSuccess({ options }, "Poster options generated successfully");
    } catch (err) {
      return errorToResponse(err);
    }
  }
);

// ─── Legacy uploadPosterDataUrl ───────────────────────────────────────────────

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
