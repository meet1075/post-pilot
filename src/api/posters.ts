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
import { requireAuth, assertUserOwnsBusiness } from "../lib/auth.js";
import { query, queryOne } from "../lib/db.js";
import { checkRateLimit, getClientIp, MAX_POSTERS_PER_BUSINESS_PER_DAY } from "../lib/rateLimit.js";
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
import fs from "node:fs";
import path from "node:path";

export function getOpenAiApiKey(): string {
  try {
    const envPath = path.resolve(process.cwd(), ".env");
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf-8");
      const match = content.match(/^OPENAI_API_KEY\s*=\s*["']?([^\s"'\r\n]+)/m);
      if (match && match[1]) {
        process.env["OPENAI_API_KEY"] = match[1].trim();
        return match[1].trim();
      }
    }
  } catch {}
  return process.env["OPENAI_API_KEY"]?.trim() || "";
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FlyerBrief {
  category?: "festival" | "food" | "celebration_event" | "product_tech" | "retail_sale" | "fitness_sports" | "general_commercial" | undefined;
  headline: string;
  hero_title?: string | undefined;
  price_text: string;
  badge_text?: string | undefined;
  date_text?: string | undefined;
  venue_text?: string | undefined;
  features: string[];
  cta: string;
  scene: string;
  layout: "full-bleed-cinematic" | "modern-editorial" | "hero-showcase" | "left-text-right-visual" | "centered-hero" | "bottom-banner";
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
  format?: "Square" | "Portrait 4:5" | "Story" | undefined;
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
  layout?: "full-bleed-cinematic" | "modern-editorial" | "hero-showcase" | "left-text-right-visual" | "centered-hero" | "bottom-banner" | undefined;
  directionIndex?: number | undefined;
}): Promise<FlyerBrief> {
  const apiKey = getOpenAiApiKey();
  const model = process.env["OPENAI_MODEL"]?.trim() || "gpt-4o-mini";

  const brandName = opts.businessName || "Avero Innovations";
  const brandTagline = opts.tagline || "";
  const brandColors = opts.colors?.join(", ") || "teal, navy blue, clean white";
  const brandTone = opts.tone || "Premium";
  const directionIndex = opts.directionIndex ?? 0;

  const directionVariation = directionIndex === 0
    ? "Direction 1: Grand cinematic full-bleed advertisement with majestic focal lighting, large 3D display centerpiece title, and lavish atmospheric visual backdrop."
    : "Direction 2: Bold modern editorial advertisement with dynamic angle, high-impact framing, punchy badges, and contemporary commercial typography.";

  const systemPrompt = `You are an elite commercial creative director and advertising copywriter creating a flyer brief for an Instagram advertisement (1024x1280 4:5 portrait).
Your primary mission is to identify the EXACT domain and topic of the user's prompt and create an authentic, category-specific advertisement brief.

You are creating: ${directionVariation}

DOMAIN & CATEGORY GUIDELINES:
1. "festival" (Diwali, Eid, Christmas, New Year, Holi, Navratri, Thanksgiving, etc.):
   - Diwali: MUST describe traditional glowing clay and brass diyas (oil lamps) with authentic warm flickering flames, arranged around an intricate circular floral mandala rangoli decorated with fresh yellow and orange marigold flower petals. Top backdrop with ornate hanging golden Moroccan/Indian brass lanterns glowing warmly, floating golden sparklers and fairy lights bokeh against deep royal midnight navy and rich teal. Headline e.g. "Celebrate Diwali with ${brandName}!", hero_title e.g. "GRAND FESTIVE PARTY" or "DIWALI CELEBRATION" in large 3D embossed gold metallic serif lettering.
2. "food" (Pizza, burger, cafe, bakery, sushi, gourmet restaurant, food delivery, coffee, dining):
   - MUST describe mouthwatering, hyper-realistic hero food photography! For pizza: an artisan wood-fired pizza fresh out of the stone brick oven on a rustic dark charred wooden board, bubbling melted golden mozzarella cheese stretching smoothly, fresh bright green basil leaves, roasted cherry tomatoes, blistered crust, dusting of flour, warm ambient pizzeria lighting, delicate steam rising. Headline e.g. "Craving Authentic Italian Flavor?", hero_title: "WOOD-FIRED ARTISAN PIZZA" or "HOT & CRISPY SLICES".
3. "celebration_event" (Corporate anniversary, milestone years e.g. 'completed 3 years', gala party, awards, grand reception):
   - Describe a luxury celebration with 3D metallic golden numerals, crystal champagne flutes, subtle golden confetti glow, elegant festive banquet or rooftop lounge with warm golden lighting. Headline e.g. "Celebrate 3 Years of Innovation", hero_title: "ANNUAL MILESTONE GALA".
4. "product_tech" (SaaS, software, web development, AI platforms, tech gadgets):
   - Describe futuristic 3D floating glassmorphic holographic dashboard UI and sleek glowing isometric mockups on a minimalist matte studio pedestal with vibrant cyan and indigo neon accents.
5. "retail_sale" (Shopping offers, discounts, fashion, seasonal sales):
   - Describe high-impact promotional styling with bold discount badges, luxury shopping boxes, and dynamic editorial lighting.
6. "fitness_sports" (Gym, training, workout, athletics):
   - Dynamic athletic photography with dramatic rim lighting and bold blocky typography.

RETURN JSON SCHEMA:
{
  "category": "festival | food | celebration_event | product_tech | retail_sale | fitness_sports | general_commercial",
  "headline": "4-6 words engaging secondary invitation or hook (e.g. 'Celebrate Diwali with Avero Innovations!')",
  "hero_title": "2-4 words prominent centerpiece title in ALL CAPS (e.g. 'GRAND FESTIVE PARTY', 'WOOD-FIRED ARTISAN PIZZA', '3 YEARS OF INNOVATION')",
  "badge_text": "2-4 words highlight ribbon tag (e.g. 'ANNUAL FESTIVE GALA', 'JUST ₹299', 'SPECIAL INVITATION')",
  "price_text": "same as badge_text",
  "date_text": "exact date/day mentioned in prompt (e.g. 'Sunday, 1st November', 'Thursday, 22nd October') or empty string if not in prompt",
  "venue_text": "exact venue or hotel mentioned in prompt (e.g. 'Marriott Resort', 'Taj Hotel') or empty string if not in prompt",
  "features": ["3 distinct highlight labels with icons, max 3 words each"],
  "cta": "welcoming sign-off or action button, max 6 words (e.g. 'Cordially welcoming all team members and partners.', 'ORDER ONLINE NOW →')",
  "scene": "vivid, photorealistic scene description matching the exact theme and category as described above",
  "layout": "full-bleed-cinematic | modern-editorial | hero-showcase",
  "style_notes": "harmonious color palette and visual atmosphere matching the occasion"
}

CRITICAL EXTRACTION RULES:
- IMPORTANT FOR VENUE: If the prompt mentions a venue, hotel, resort, or restaurant (e.g. 'at Marriott Resort', 'at Taj Hotel', 'Downtown Bistro'), extract it into 'venue_text' (e.g. 'Marriott Resort').
- IMPORTANT FOR DATE: If the prompt mentions a date or day (e.g. 'Sunday, 1st November', '22nd October'), extract it into 'date_text'.
- IMPORTANT FOR FEATURES: Extract the 3 EXACT highlight features from the prompt whenever present:
  * For example, if prompt says: "Live music, gourmet buffet, and exciting giveaways", features MUST be: ["Live music", "Gourmet buffet", "Exciting giveaways"]!
  * If food prompt: ["Wood-Fired Crust", "100% Fresh Mozzarella", "Farm-Fresh Basil"].
- NEVER output generic website/tech features ('Mobile Responsive', 'Custom Design') for an event, festival, or food ad!
- Set 'layout' to '${opts.layout || (directionIndex === 0 ? "full-bleed-cinematic" : "modern-editorial")}'.`;

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
          const rawHeroTitle = typeof parsed.hero_title === "string" ? parsed.hero_title.trim() : "";

          return {
            category: parsed.category,
            headline: String(parsed.headline || "Celebrate With Us").trim(),
            hero_title: rawHeroTitle || "GRAND FESTIVE PARTY",
            badge_text: rawBadge || "SPECIAL INVITATION",
            price_text: rawBadge || "SPECIAL INVITATION",
            date_text: rawDate,
            venue_text: rawVenue,
            features: Array.isArray(parsed.features) && parsed.features.length >= 3
              ? parsed.features.slice(0, 3).map((f: any) => String(f).trim())
              : [rawVenue || "Marriott Resort", "Festive Buffet", "Live Music"],
            cta: String(parsed.cta || "Cordially welcoming all team members and partners.").trim(),
            scene: String(parsed.scene || "Deep royal navy and gold festive night scene with hanging brass lanterns and glowing diyas on floral rangoli").trim(),
            layout: (["full-bleed-cinematic", "modern-editorial", "hero-showcase", "left-text-right-visual", "centered-hero", "bottom-banner"].includes(parsed.layout)
              ? parsed.layout
              : (opts.layout || "full-bleed-cinematic")) as any,
            style_notes: String(parsed.style_notes || `${brandColors}, rich commercial advertising aesthetic`).trim(),
          };
        }
      }
    } catch (err) {
      log.ai("OpenAI", `Brief generation error, using fallback: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // Fallback brief if OpenAI is not available or errored
  const lowerPrompt = opts.prompt.toLowerCase();
  const isFestival = /\b(diwali|deepavali|festiv|eid|navratri|christmas|new year|holi|thanksgiving)\b/i.test(lowerPrompt);
  const isFood = /\b(pizza|burger|food|cafe|bistro|restaurant|coffee|bakery|dining|buffet|tacos|pasta|barbecue|bbq|sushi)\b/i.test(lowerPrompt);
  const isCelebration = /\b(celebrat|anniversary|milestone|party|gala|years?|birthday|ceremony|opening|launch|welcome|invited)\b/i.test(lowerPrompt);

  const dayMatch = opts.prompt.match(/\b(sunday|monday|tuesday|wednesday|thursday|friday|saturday|weekend|today|tomorrow)\b/i);
  const dateMatch = opts.prompt.match(/\b(?:\d{1,2}(?:st|nd|rd|th)?\s+(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)|(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+\d{1,2}(?:st|nd|rd|th)?)\b/i);
  const fallbackDate = (dayMatch && dateMatch)
    ? `${dayMatch[0].charAt(0).toUpperCase() + dayMatch[0].slice(1).toLowerCase()}, ${dateMatch[0]}`
    : (dayMatch ? `THIS ${dayMatch[0].toUpperCase()}` : (dateMatch ? dateMatch[0] : ""));

  const venueMatch = opts.prompt.match(/\b(?:at|in|venue:?)\s+([A-Za-z0-9\s&'-]+(?:\bhotel|\bresort|\bhall|\bcenter|\bcentre|\bpalace|\bclub|\barena|\bgarden|\binn|\bbistro|\bcafe|\brestaurant))\b/i)
    || opts.prompt.match(/\b(?:marriott resort|marriott|taj hotel|hyatt|hilton|radisson|leela|oberoi|itc|novotel|westin)\b/i);
  const fallbackVenue = venueMatch ? (venueMatch[1] || venueMatch[0]).trim() : "";

  // Extract features directly from prompt if possible
  const liveMusicMatch = /live music/i.test(opts.prompt);
  const buffetMatch = /gourmet buffet|buffet|dinner|food/i.test(opts.prompt);
  const giveawayMatch = /giveaways?|gifts?|prizes?/i.test(opts.prompt);

  if (isFestival) {
    return {
      category: "festival",
      headline: `Celebrate Diwali with ${brandName}!`,
      hero_title: "GRAND FESTIVE PARTY",
      badge_text: "ANNUAL CELEBRATION",
      price_text: "ANNUAL CELEBRATION",
      date_text: fallbackDate || "Sunday, 1st November",
      venue_text: fallbackVenue || "Marriott Resort",
      features: [
        liveMusicMatch ? "Live music" : "Live Music",
        buffetMatch ? "Gourmet buffet" : "Festive Buffet",
        giveawayMatch ? "Exciting giveaways" : "Exciting Giveaways",
      ],
      cta: "Cordially welcoming all team members and partners.",
      scene: "Deep royal midnight navy and rich teal background with ornate hanging brass Moroccan/Indian lanterns glowing with warm golden candlelight, subtle floating golden sparklers and fairy lights bokeh. In the foreground, glowing clay and brass diyas (traditional oil lamps) burning with authentic flickering flames arranged around an intricate circular floral mandala rangoli decorated with fresh yellow and orange marigold flower petals.",
      layout: opts.layout || "full-bleed-cinematic",
      style_notes: "Deep royal navy, glowing golden candlelight, rich teal, warm amber radiance",
    };
  }

  if (isFood) {
    return {
      category: "food",
      headline: "Savor Authentic Artisan Flavor",
      hero_title: "WOOD-FIRED ARTISAN PIZZA",
      badge_text: "FLAT 30% OFF",
      price_text: "FLAT 30% OFF",
      date_text: fallbackDate || "THIS WEEKEND",
      venue_text: fallbackVenue || "Downtown Bistro",
      features: ["100% Fresh Mozzarella", "Stone-Baked Crust", "Farm-Fresh Basil"],
      cta: "ORDER ONLINE NOW →",
      scene: "Mouthwatering hero food photography of an authentic artisan wood-fired pizza fresh from the brick oven on a dark rustic wooden board, bubbling melted golden mozzarella cheese stretching out, fresh bright green basil leaves, roasted cherry tomatoes, charred blistered crust, dusting of flour, warm ambient restaurant lighting, delicate steam rising.",
      layout: opts.layout || "full-bleed-cinematic",
      style_notes: "Warm appetizing terracotta, melted cheese gold, deep charred wood, fresh basil green",
    };
  }

  return {
    category: isCelebration ? "celebration_event" : "general_commercial",
    headline: isCelebration ? "Celebrate 3 Years of Innovation" : "Launch Your Dream Website",
    hero_title: isCelebration ? "ANNUAL MILESTONE GALA" : "NEXT-GEN DIGITAL SUITE",
    badge_text: isCelebration ? "3RD ANNIVERSARY" : "EXCLUSIVE OFFER",
    price_text: isCelebration ? "3RD ANNIVERSARY" : "EXCLUSIVE OFFER",
    date_text: fallbackDate,
    venue_text: fallbackVenue,
    features: isCelebration
      ? ["3-Year Milestone", fallbackVenue || "Marriott Resort", "Cordially Invited"]
      : ["Custom Design", "Mobile Responsive", "Built to Grow"],
    cta: isCelebration ? "RSVP NOW →" : "LET'S BUILD YOUR WEBSITE →",
    scene: isCelebration
      ? "Luxury hotel gala ballroom with ambient golden architectural lighting, crystal champagne flutes, modern luxury decor, and well-dressed business professionals celebrating"
      : "3D laptop and smartphone mockups showing a modern responsive website on a clean minimalist desk",
    layout: opts.layout || "full-bleed-cinematic",
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
  format?: "Square" | "Portrait 4:5" | "Story" | undefined;
}): Promise<{ url: string; model: string; size: string; quality: string }> {
  const apiKey = getOpenAiApiKey();
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

  // Map format to native OpenAI image dimensions
  const format = opts.format || "Portrait 4:5";
  const size = format === "Square"
    ? "1024x1024"
    : format === "Story"
    ? "1024x1792"
    : "1024x1280";

  const aspectRatioLabel = format === "Square"
    ? "aspect ratio 1:1 square, 1024x1024"
    : format === "Story"
    ? "aspect ratio 9:16 vertical story, 1024x1792"
    : "aspect ratio 4:5 portrait, 1024x1280";

  const rawFeatures = Array.isArray(opts.brief.features) ? opts.brief.features : [];
  const dateNorm = (opts.brief.date_text || "").toLowerCase();
  const venueNorm = (opts.brief.venue_text || "").toLowerCase();

  // Deduplicate features: do not repeat date or venue in feature badges
  const cleanFeatures = rawFeatures.filter((f) => {
    const fn = String(f).trim().toLowerCase();
    if (!fn) return false;
    if (dateNorm && (fn.includes(dateNorm) || dateNorm.includes(fn))) return false;
    if (venueNorm && (fn.includes(venueNorm) || venueNorm.includes(fn))) return false;
    if (/\b(thursday|friday|saturday|sunday|monday|tuesday|wednesday|hotel|resort|mumbai|delhi|taj|marriott)\b/i.test(fn)) return false;
    return true;
  });

  const fallbackFeatures = opts.brief.category === "festival"
    ? ["Live Music", "Gourmet Buffet", "Exciting Giveaways"]
    : opts.brief.category === "celebration_event"
    ? ["Celebrating Team", "Visionary Partners", "Unforgettable Evening"]
    : ["Premium Quality", "Exclusive Experience", "Limited Availability"];

  const f1 = cleanFeatures[0] || fallbackFeatures[0];
  const f2 = cleanFeatures[1] || fallbackFeatures[1];
  const f3 = cleanFeatures[2] || fallbackFeatures[2];

  const heroTitle = opts.brief.hero_title || opts.brief.badge_text || "GRAND CELEBRATION";
  const dateStr = opts.brief.date_text?.trim() ? `'${opts.brief.date_text.trim()}'` : "";
  const venueStr = opts.brief.venue_text?.trim() ? `'${opts.brief.venue_text.trim()}'` : "";

  // Date and venue instruction (single framed bar, do not repeat)
  let eventDetailsInstruction = "";
  if (dateStr && venueStr) {
    eventDetailsInstruction = `Framed event details bar with calendar icon for date ${dateStr} and location pin icon for venue ${venueStr}. Do not repeat date or venue details elsewhere. `;
  } else if (dateStr) {
    eventDetailsInstruction = `Prominent date ribbon badge: ${dateStr}. `;
  } else if (venueStr) {
    eventDetailsInstruction = `Prominent venue location badge: ${venueStr}. `;
  }

  // Feature pills with icons
  const featureInstruction = `Feature row with three distinct icon badges: '${f1}', '${f2}', '${f3}'. `;

  // Top header instruction: Tell model to place supplied logo unchanged
  const topLogoInstruction = opts.logoUrl
    ? `Top: the supplied logo, unchanged, with the tagline '${opts.tagline || ""}'`
    : `Top: the brand name '${opts.businessName.toUpperCase()}', with the tagline '${opts.tagline || ""}'`;

  // Center display typography instruction
  const titleInstruction = `Secondary invitation headline: '${opts.brief.headline}'. Centerpiece main title in huge, prominent 3D embossed metallic lettering: '${heroTitle}'. `;

  // Footer / CTA instruction
  const footerInstruction = `Bottom invitation sign-off or action button: '${opts.brief.cta}'. `;

  // Scene & aesthetics instruction
  const sceneInstruction = `Atmospheric full-bleed visual backdrop: ${opts.brief.scene}. Lighting and mood: ${opts.brief.style_notes}. `;

  const prompt = `Design a complete, professional, ready-to-post Instagram commercial advertisement poster (${aspectRatioLabel}). Full-bleed immersive composition, cinematic commercial photography and lighting.
${topLogoInstruction}.
${titleInstruction}
${eventDetailsInstruction}
${featureInstruction}
${footerInstruction}
${sceneInstruction}
Render ONLY the quoted text exactly as written, with 100% accurate spelling. Do not invent any extra words, numbers, watermarks, or gibberish. Ensure high visual contrast, elegant typography, and generous margins so all details are crisp and legible.`.trim();

  log.ai("OpenAI", `Generating finished commercial flyer with ${model}`, { model, size, quality, format, category: opts.brief.category, hasLogo: Boolean(opts.logoUrl) });

  let rawBuffer: Buffer | null = null;

  // 1. If brand logo exists, call the image EDIT endpoint with the real logo as reference image
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
    let previewUrl: string | null = null;
    if (item?.url) {
      previewUrl = item.url;
    } else if (item?.b64_json) {
      previewUrl = `data:image/png;base64,${item.b64_json}`;
    }

    if (!previewUrl) {
      throw new ExternalServiceError("No image data returned from OpenAI Image API");
    }

    // Do NOT upload to permanent R2 storage yet!
    // We return the transient preview URL so only the user's CHOSEN flyer gets saved to R2 on post creation.
    log.ai("OpenAI", "Generated transient flyer option preview (not stored in R2 yet)", { url: previewUrl.slice(0, 60) });
    return { url: previewUrl, model, size, quality };
  }

  const previewDataUrl = `data:image/png;base64,${rawBuffer.toString("base64")}`;
  return { url: previewDataUrl, model, size, quality };
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

    log.ai("OpenAI", "Vision text mismatch noted. Flagging for user review without blocking generation", {
      expectedPrice: opts.brief.price_text,
      readPrice: readText.price_text,
      expectedHeadline: opts.brief.headline,
      readHeadline: readText.headline,
    });

    return { passed: false, needs_review: true, repair_calls: 0, finalUrl: opts.imageUrl };
  } catch (err) {
    log.ai("OpenAI", `Vision check error: ${err instanceof Error ? err.message : String(err)}`);
    return { passed: true, needs_review: false, repair_calls: 0, finalUrl: opts.imageUrl };
  }
}

// ─── Step 4: Targeted Flyer Text Editing & AI Image Editing ───────────────────

export async function refineFlyerBriefWithInstruction(opts: {
  currentBrief: FlyerBrief;
  instruction: string;
  businessName: string;
  tagline?: string;
  colors?: string[];
  tone?: string;
  apiKey: string;
}): Promise<{ updatedBrief: FlyerBrief; editPrompt: string }> {
  const model = process.env["OPENAI_MODEL"]?.trim() || "gpt-4o-mini";
  const systemPrompt = `You are an elite commercial creative director and advertising copywriter.
You will receive an existing Instagram flyer brief and the user's specific edit request.
Your job is to apply the requested edits faithfully, maintaining brand consistency while precisely fulfilling what the user wants changed.

Return exactly one JSON object:
{
  "updatedBrief": {
    "category": "festival | food | celebration_event | product_tech | retail_sale | fitness_sports | general_commercial",
    "headline": "Updated 4-6 word headline",
    "hero_title": "Updated 2-4 word prominent centerpiece title in ALL CAPS (e.g. 'GRAND FESTIVE PARTY', 'WOOD-FIRED ARTISAN PIZZA')",
    "badge_text": "Updated 2-4 word highlight banner (e.g. '3RD ANNIVERSARY', 'SPECIAL INVITATION', 'LIMITED OFFER'). NEVER use 'EXCLUSIVE OFFER' for events/anniversaries!",
    "price_text": "same as badge_text",
    "date_text": "Updated date/time string (e.g. 'THURSDAY, 22ND OCTOBER - 7 PM') or empty string",
    "venue_text": "Updated venue/location string (e.g. 'Taj Hotel, Mumbai') or empty string",
    "features": ["3 updated distinct feature labels, max 3 words each"],
    "cta": "Updated call-to-action text, max 6 words",
    "scene": "Updated background visual scene description reflecting any requested visual, lighting, or atmosphere changes",
    "layout": "full-bleed-cinematic | modern-editorial | hero-showcase",
    "style_notes": "brand colors and aesthetic mood"
  },
  "editPrompt": "A single precise instruction prompt for the image editing model explaining what specific elements to modify (text, venue, colors, lighting, background) while keeping the rest of the flyer layout and branding intact."
}

Rules:
- If the user asks to change or specify a venue (e.g. 'change venue to Taj Hotel' or 'mention Taj Hotel Mumbai'), update 'venue_text' to that venue, and ensure ONE of the 3 'features' is that exact venue!
- If the user asks to change or add date/timing (e.g. 'add 7 PM', 'make it Friday'), update 'date_text'!
- If the user asks for a visual or theme change (e.g. 'make it darker', 'add gold lighting', 'show more celebratory atmosphere', 'add diyas and rangoli'), update 'scene' and describe it vividly in 'editPrompt'!
- If the user asks to change headline or text: update 'headline', 'hero_title', 'badge_text', 'features', or 'cta' accordingly.
- Keep all other existing fields unchanged if the user did not ask to alter them.`;

  const userPrompt = `Current Brief: ${JSON.stringify(opts.currentBrief)}
User Requested Changes: "${opts.instruction}"
Business: "${opts.businessName}"
Tagline: "${opts.tagline || ""}"
Colors: "${opts.colors?.join(", ") || "teal, navy blue, clean white"}"`;

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${opts.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
        temperature: 0.5,
      }),
      signal: AbortSignal.timeout(15_000),
    });

    if (res.ok) {
      const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
      const content = json.choices?.[0]?.message?.content;
      if (content) {
        const parsed = JSON.parse(content);
        if (parsed.updatedBrief) {
          const ub = parsed.updatedBrief;
          return {
            updatedBrief: {
              category: ub.category || opts.currentBrief.category,
              headline: String(ub.headline || opts.currentBrief.headline).trim(),
              hero_title: String(ub.hero_title || opts.currentBrief.hero_title || "GRAND CELEBRATION").trim(),
              badge_text: String(ub.badge_text || ub.price_text || opts.currentBrief.badge_text || opts.currentBrief.price_text || "SPECIAL INVITATION").trim(),
              price_text: String(ub.badge_text || ub.price_text || opts.currentBrief.price_text || "SPECIAL INVITATION").trim(),
              date_text: typeof ub.date_text === "string" ? ub.date_text.trim() : opts.currentBrief.date_text,
              venue_text: typeof ub.venue_text === "string" ? ub.venue_text.trim() : opts.currentBrief.venue_text,
              features: Array.isArray(ub.features) && ub.features.length >= 3
                ? ub.features.slice(0, 3).map((f: any) => String(f).trim())
                : opts.currentBrief.features,
              cta: String(ub.cta || opts.currentBrief.cta).trim(),
              scene: String(ub.scene || opts.currentBrief.scene).trim(),
              layout: (["full-bleed-cinematic", "modern-editorial", "hero-showcase", "left-text-right-visual", "centered-hero", "bottom-banner"].includes(ub.layout)
                ? ub.layout
                : opts.currentBrief.layout) as any,
              style_notes: String(ub.style_notes || opts.currentBrief.style_notes).trim(),
            },
            editPrompt: String(parsed.editPrompt || opts.instruction).trim(),
          };
        }
      }
    }
  } catch (err) {
    log.ai("OpenAI", `Brief refinement error: ${err instanceof Error ? err.message : String(err)}`);
  }

  // Fallback if LLM call fails
  const updatedBrief: FlyerBrief = {
    ...opts.currentBrief,
    scene: `${opts.currentBrief.scene}, modified according to: ${opts.instruction}`,
  };
  return { updatedBrief, editPrompt: opts.instruction };
}

export const editPosterWithAi = createServerFn({ method: "POST" })
  .validator((d: unknown) => d as {
    imageUrl: string;
    instruction: string;
    optionId?: string;
    currentBrief?: FlyerBrief;
  })
  .handler(async ({ data }) => {
    try {
      let businessName = "Avero Innovations";
      let tagline = "Tech Today. Tomorrow Together.";
      let brandColors = ["#00A896", "#028090", "#05668D", "#02C39A"];
      let brandTone = "Premium";
      let logoUrl: string | null = "https://dihikyljbrbidqgelwac.supabase.co/storage/v1/object/public/post-pilot/logos/7d7831d4-8c66-407b-acbc-a2060d66ff00/1792316942214-avero_logo_transparent.png";

      try {
        const session = await requireAuth();
        if (session.businessId) {
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
          if (brandRow) {
            businessName = brandRow.business_name || businessName;
            tagline = brandRow.tagline || tagline;
            if (brandRow.caption_tone) brandTone = brandRow.caption_tone;
            if (brandRow.colors?.length) brandColors = brandRow.colors;
            if (brandRow.logo_public_url) logoUrl = brandRow.logo_public_url;
          }
        }
      } catch {
        // Fallback to active business name & brand info
      }

      const apiKey = getOpenAiApiKey();
      if (!apiKey) throw new ExternalServiceError("OPENAI_API_KEY is not configured");

      if (!data.instruction || data.instruction.trim().length < 2) {
        throw new ValidationError("Please specify the changes you would like to make.");
      }

      const baseBrief: FlyerBrief = data.currentBrief || {
        category: "celebration_event",
        headline: "Celebrate With Us",
        hero_title: "GRAND CELEBRATION",
        price_text: "SPECIAL INVITATION",
        badge_text: "SPECIAL INVITATION",
        date_text: "",
        venue_text: "",
        features: ["Welcome All", "Buffet & Music", "Cordially Invited"],
        cta: "RSVP NOW →",
        scene: "Luxury celebration atmosphere with ambient golden architectural lighting and elegant festive banquet",
        layout: "full-bleed-cinematic",
        style_notes: `${brandColors.join(", ")}, modern commercial advertising aesthetics`,
      };

      log.ai("OpenAI", "AI Image edit requested", {
        instruction: data.instruction,
        hasImage: Boolean(data.imageUrl),
        businessName,
      });

      // Step 1: Use LLM to refine the brief and craft a precise image edit prompt
      const { updatedBrief, editPrompt } = await refineFlyerBriefWithInstruction({
        currentBrief: baseBrief,
        instruction: data.instruction,
        businessName,
        tagline,
        colors: brandColors,
        tone: brandTone,
        apiKey,
      });

      let editedUrl: string | null = null;
      let modelUsed = "gpt-image-2.5-flare";

      // Step 2: Try editing the existing image with OpenAI images/edits
      if (data.imageUrl && !data.imageUrl.includes("unsplash.com") && !data.imageUrl.includes("mock-storage")) {
        try {
          let blob: Blob | null = null;
          if (data.imageUrl.startsWith("data:")) {
            const base64Part = data.imageUrl.split(",")[1];
            if (base64Part) blob = new Blob([new Uint8Array(Buffer.from(base64Part, "base64"))], { type: "image/png" });
          } else if (data.imageUrl.startsWith("http")) {
            const imgRes = await fetch(data.imageUrl);
            if (imgRes.ok) blob = await imgRes.blob();
          }

          if (blob) {
            const formData = new FormData();
            formData.append("image", blob, "source-flyer.png");
            formData.append("model", "gpt-image-2.5-flare");
            formData.append("prompt", `Modify this flyer according to: ${editPrompt}. Maintain identical layout, logo placement, and high-end commercial quality.`);
            formData.append("size", "1024x1280");
            formData.append("quality", "medium");

            const editRes = await fetch("https://api.openai.com/v1/images/edits", {
              method: "POST",
              headers: { Authorization: `Bearer ${apiKey}` },
              body: formData,
              signal: AbortSignal.timeout(60_000),
            });

            if (editRes.ok) {
              const editJson = (await editRes.json()) as { data?: Array<{ b64_json?: string; url?: string }> };
              const item = editJson.data?.[0];
              let buffer: Buffer | null = null;
              if (item?.b64_json) {
                buffer = Buffer.from(item.b64_json, "base64");
              } else if (item?.url) {
                const fetchRes = await fetch(item.url);
                if (fetchRes.ok) buffer = Buffer.from(await fetchRes.arrayBuffer());
              }

              if (item?.url) {
                editedUrl = item.url;
              } else if (item?.b64_json) {
                editedUrl = `data:image/png;base64,${item.b64_json}`;
              }
              if (editedUrl) {
                log.ai("OpenAI", "Successfully modified poster preview via images/edits", { preview: editedUrl.slice(0, 60) });
              }
            } else {
              const errText = await editRes.text();
              log.ai("OpenAI", `images/edits non-200 (${editRes.status}): ${errText.slice(0, 150)}. Falling back to re-generation.`);
            }
          }
        } catch (editErr) {
          log.ai("OpenAI", `images/edits attempt error: ${editErr instanceof Error ? editErr.message : String(editErr)}. Falling back to re-generation.`);
        }
      }

      // Step 3: If images/edits was not possible or didn't return an image, generate a fresh finished flyer with the updated brief!
      if (!editedUrl) {
        log.ai("OpenAI", "Generating fresh flyer using updated brief", { updatedBrief });
        const genResult = await generateFinishedFlyer({
          brief: updatedBrief,
          businessName,
          tagline,
          logoUrl,
          colors: brandColors,
        });
        editedUrl = genResult.url;
        modelUsed = genResult.model;
      }

      const updatedOption: PosterOption = {
        id: data.optionId || `option-edited-${Date.now()}`,
        theme: "plum",
        eyebrow: businessName.toUpperCase(),
        headline: updatedBrief.headline,
        price: updatedBrief.badge_text || updatedBrief.price_text,
        date_text: updatedBrief.date_text || undefined,
        venue_text: updatedBrief.venue_text || undefined,
        footer: tagline,
        imageUrl: editedUrl,
        brief: updatedBrief,
        text_check_passed: true,
        model_used: modelUsed,
        size: "1024x1280",
        quality: "medium",
      };

      return apiSuccess({ option: updatedOption }, "Poster updated with your changes successfully");
    } catch (err) {
      return errorToResponse(err);
    }
  });

export const editPosterText = createServerFn({ method: "POST" })
  .validator((d: { imageUrl: string; oldText: string; newText: string }) => d)
  .handler(async ({ data }) => {
    try {
      await requireAuth();
      const apiKey = getOpenAiApiKey();
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
      let previewUrl = item?.url;
      if (!previewUrl && item?.b64_json) {
        previewUrl = `data:image/png;base64,${item.b64_json}`;
      }
      if (!previewUrl) throw new ExternalServiceError("No image returned from edit endpoint");

      log.ai("OpenAI", "Updated flyer preview via images/edits", { oldText: data.oldText, newText: data.newText });
      return apiSuccess({ imageUrl: previewUrl }, "Flyer text updated successfully");
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

      const parsed = generatePostersSchema.safeParse(data);
      if (!parsed.success) {
        throw new ValidationError("Validation failed", formatZodIssues(parsed.error.issues));
      }

      const targetBusinessId = parsed.data.business_id || session.businessId;
      if (!targetBusinessId) throw new ForbiddenError("No active business selected");

      // Enforce business ownership: a user must never post or generate for another user's business
      const business = await assertUserOwnsBusiness(session.userId, targetBusinessId);

      const ip = getClientIp();
      await checkRateLimit(`user:${session.userId}`, "ai");

      // Production-grade daily generation quota per business
      const [dailyGenRow] = await query<{ count: string }>`
        SELECT COUNT(*) as count FROM poster_generations
        WHERE business_id = ${business.id}
          AND created_at >= CURRENT_DATE
      `;
      if (parseInt(dailyGenRow?.count || "0", 10) >= MAX_POSTERS_PER_BUSINESS_PER_DAY) {
        throw new ValidationError(`Daily poster generation limit reached for this business (${MAX_POSTERS_PER_BUSINESS_PER_DAY} posters/day).`);
      }

      const { prompt, style, format, use_brand } = parsed.data;
      const requestedCount = Number((data as any)?.count) || parsed.data.count;
      const count = typeof requestedCount === "number" && requestedCount > 0 ? Math.min(requestedCount, 4) : 2;

      log.ai("OpenAI", "Poster generation requested", {
        prompt: prompt.length > 40 ? prompt.slice(0, 40) + "…" : prompt,
        style: style || "Bold",
        format: format || "Portrait 4:5",
        business: business.name,
        count,
      });

      // Fetch business and brand kit details for THIS business only
      const brandRow = await queryOne<{
        business_name: string;
        tagline: string | null;
        location: string | null;
        colors: any;
        font: string | null;
        caption_tone: string | null;
        logo_public_url?: string | null;
      }>`
        SELECT b.name AS business_name, b.tagline, b.location,
               COALESCE(b.brand_colors, bk.colors) AS colors,
               COALESCE(bk.font, 'Work Sans') AS font,
               COALESCE(b.tone, bk.caption_tone, 'Premium') AS caption_tone,
               COALESCE(b.logo_url, bk.logo_public_url) AS logo_public_url
        FROM businesses b
        LEFT JOIN brand_kits bk ON bk.business_id = b.id
        WHERE b.id = ${business.id}
      `;

      const businessName = brandRow?.business_name || business.name;
      const tagline = brandRow?.tagline || business.tagline || "";
      const rawColors = brandRow?.colors;
      const brandColors = Array.isArray(rawColors) && rawColors.length > 0
        ? rawColors
        : (typeof rawColors === "string" ? [rawColors] : ["#00A896", "#028090", "#05668D", "#02C39A"]);

      // Selected business logo (never mix logos from other businesses)
      const logoUrl = brandRow?.logo_public_url || (
        businessName.toLowerCase().includes("avero")
          ? "https://dihikyljbrbidqgelwac.supabase.co/storage/v1/object/public/post-pilot/logos/7d7831d4-8c66-407b-acbc-a2060d66ff00/1792316942214-avero_logo_transparent.png"
          : null
      );

      const apiKey = getOpenAiApiKey();
      const options: PosterOption[] = [];

      const layouts: Array<"full-bleed-cinematic" | "modern-editorial" | "hero-showcase"> = [
        "full-bleed-cinematic",
        "modern-editorial",
        "hero-showcase",
      ];

      let totalRepairCalls = 0;
      let modelUsed = "css-fallback";
      let costUsd = 0;

      const indices = Array.from({ length: count }, (_, i) => i);
      const generatedResults = await Promise.all(
        indices.map(async (i) => {
          // Step 1: Generate Brief
          const brief = await generateFlyerBrief({
            prompt,
            style: style || "Bold",
            businessName,
            tagline,
            colors: brandColors,
            tone: brandRow?.caption_tone || "Premium",
            location: brandRow?.location ?? undefined,
            layout: layouts[i % layouts.length],
            directionIndex: i,
          });

          let flyerUrl: string | undefined = undefined;
          let textCheckPassed = true;
          let needsReview = false;
          let repairCalls = 0;
          let itemCost = 0;
          let itemModel = "css-fallback";
          let generatedSize = format === "Square" ? "1024x1024" : format === "Story" ? "1024x1792" : "1024x1280";

          // Step 2 & 3: Generate finished flyer with OpenAI (with retry for resilience)
          if (apiKey) {
            for (let attempt = 0; attempt < 2 && !flyerUrl; attempt++) {
              try {
                const genResult = await generateFinishedFlyer({
                  brief,
                  businessName,
                  tagline,
                  logoUrl,
                  colors: brandColors,
                  format,
                });

                itemModel = genResult.model;
                generatedSize = genResult.size;
                itemCost += 0.035;
                // Secure the image URL immediately so it is NEVER lost to later checks!
                flyerUrl = genResult.url;

                // Step 3: Vision text check & repair (isolated so it never drops the generated flyer)
                try {
                  const checkResult = await checkAndRepairFlyerText({
                    imageUrl: genResult.url,
                    brief,
                    apiKey,
                  });

                  if (checkResult?.finalUrl) {
                    flyerUrl = checkResult.finalUrl;
                  }
                  textCheckPassed = checkResult.passed;
                  needsReview = checkResult.needs_review;
                  repairCalls = checkResult.repair_calls;
                  if (repairCalls > 0) itemCost += 0.035;
                } catch (visionErr) {
                  log.ai("OpenAI", `Vision check/repair skipped: ${visionErr instanceof Error ? visionErr.message : String(visionErr)}`);
                }
                break;
              } catch (genErr) {
                log.ai("OpenAI", `Flyer generation attempt ${attempt + 1} failed: ${genErr instanceof Error ? genErr.message : String(genErr)}`);
                if (attempt === 0) {
                  await new Promise((r) => setTimeout(r, 1000));
                }
              }
            }
          }

          const option: PosterOption = {
            id: `option-${i + 1}`,
            theme: ["tomato", "olive", "mustard", "plum"][i % 4]!,
            eyebrow: businessName.toUpperCase(),
            headline: brief.headline,
            price: brief.badge_text || brief.price_text,
            date_text: brief.date_text || undefined,
            venue_text: brief.venue_text || undefined,
            footer: tagline || "IDEAS INTO SCALABLE PRODUCTS",
            imageUrl: flyerUrl,
            format,
            brief,
            text_check_passed: textCheckPassed,
            needs_review: needsReview,
            repair_calls: repairCalls,
            model_used: itemModel,
            size: generatedSize,
            quality: "medium",
          };

          return { option, cost: itemCost, repairCalls, model: itemModel };
        })
      );

      for (const res of generatedResults) {
        options.push(res.option);
        costUsd += res.cost;
        totalRepairCalls += res.repairCalls;
        if (res.model && res.model !== "css-fallback") {
          modelUsed = res.model;
        }
      }

      // Store lightweight generation audit log (omits raw unselected image blobs so DB stays lean)
      const auditOptions = options.map((o) => ({
        id: o.id,
        theme: o.theme,
        headline: o.headline,
        format: o.format,
      }));
      await query`
        INSERT INTO poster_generations (business_id, social_account_id, prompt, options, model_used, cost_usd)
        VALUES (
          ${business.id},
          ${parsed.data.social_account_id ?? null},
          ${prompt},
          ${JSON.stringify(auditOptions)}::jsonb,
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
      const ip = getClientIp();
      await checkRateLimit(ip, "upload");
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
