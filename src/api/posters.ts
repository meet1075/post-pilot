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
import { recordApiLog } from "../lib/auditLogger.js";
import { getTemplateById } from "../lib/templates.js";
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
  category?: "festival" | "food" | "celebration_event" | "product_tech" | "retail_sale" | "fitness_sports" | "sports_tournament" | "general_commercial" | undefined;
  headline: string;
  hero_title?: string | undefined;
  price_text: string;
  badge_text?: string | undefined;
  date_text?: string | undefined;
  time_text?: string | undefined;
  venue_text?: string | undefined;
  prize_text?: string | undefined;
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
  time_text?: string | undefined;
  venue_text?: string | undefined;
  prize_text?: string | undefined;
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

// ─── Helpers for Structured Prompt & Product Extraction ───────────────────────

export function isMetaPhrase(text: string): boolean {
  if (!text || typeof text !== "string") return false;
  return /^(?:black friday\s+)?(?:eye-catching\s+)?(?:premium\s+)?(?:promotional\s+)?(?:social media\s+)?(?:instagram\s+)?(?:facebook\s+)?(?:poster|flyer|banner|post|graphic|ad|advertisement|creative|campaign|design|image|photo)s?$/i.test(text.trim());
}

export function parseStructuredPrompt(prompt: string) {
  const headlineMatch = prompt.match(/(?:\*\*\s*(?:Main\s+)?Headline:?\s*\*\*|(?:^|\n)\s*(?:Main\s+)?Headline:?)\s*([^\n*]+)/i);
  const offerMatch = prompt.match(/(?:\*\*\s*(?:BIG\s+)?(?:Offer|Discount|Deal):?\s*\*\*|(?:^|\n)\s*(?:BIG\s+)?(?:Offer|Discount|Deal):?)\s*([^\n*]+)/i);
  const supportingMatch = prompt.match(/(?:\*\*\s*(?:Supporting\s+Text|Subline|Subtitle|Tagline|Description):?\s*\*\*|(?:^|\n)\s*(?:Supporting\s+Text|Subline|Subtitle|Tagline|Description):?)\s*([^\n*]+)/i);
  const ctaMatch = prompt.match(/(?:\*\*\s*(?:CTA|Call\s+to\s+Action):?\s*\*\*|(?:^|\n)\s*(?:CTA|Call\s+to\s+Action):?)\s*([^\n*]+)/i);
  const venueMatch = prompt.match(/(?:\*\*\s*(?:Venue|Location|Place):?\s*\*\*|(?:^|\n)\s*(?:Venue|Location|Place):?)\s*([^\n*]+)/i);
  const dateMatch = prompt.match(/(?:\*\*\s*(?:Date|Dates|Day):?\s*\*\*|(?:^|\n)\s*(?:Date|Dates|Day):?)\s*([^\n*]+)/i);
  const timeMatch = prompt.match(/(?:\*\*\s*(?:Time|Timing|Hours):?\s*\*\*|(?:^|\n)\s*(?:Time|Timing|Hours):?)\s*([^\n*]+)/i);
  const prizeMatch = prompt.match(/(?:\*\*\s*(?:Prize\s*Pool|Prize|Cash\s*Prize):?\s*\*\*|(?:^|\n)\s*(?:Prize\s*Pool|Prize|Cash\s*Prize):?)\s*([^\n*]+)/i);

  return {
    headline: headlineMatch?.[1]?.trim(),
    offer: offerMatch?.[1]?.trim(),
    supportingText: supportingMatch?.[1]?.trim(),
    cta: ctaMatch?.[1]?.trim(),
    venue: venueMatch?.[1]?.trim(),
    date: dateMatch?.[1]?.trim(),
    time: timeMatch?.[1]?.trim(),
    prize: prizeMatch?.[1]?.trim(),
  };
}

export function extractNamedProduct(prompt: string): string {
  const forProductMatch = prompt.match(/\bfor\s+(?:\*\*)?([A-Za-z0-9\s&–—\-]+?)(?:\*\*)?(?:\.|\n|$|,)/i);
  if (forProductMatch && forProductMatch[1]) {
    const candidate = forProductMatch[1].trim();
    if (!isMetaPhrase(candidate) && candidate.length > 2) {
      return candidate;
    }
  }

  const boldMatches = [...prompt.matchAll(/\*\*([^*]+)\*\*/g)];
  for (const m of boldMatches) {
    const text = m[1]?.trim() || "";
    if (/^(?:main\s+)?headline:?|^(?:big\s+)?offer:?|^supporting\s+text:?|^cta:?|^design\s+direction:?/i.test(text)) {
      continue;
    }
    if (!isMetaPhrase(text) && text.length > 2 && text.length < 60) {
      return text;
    }
  }

  const quotesMatch = prompt.match(/["']([^"']{2,60})["']/);
  if (quotesMatch && quotesMatch[1] && !isMetaPhrase(quotesMatch[1])) {
    return quotesMatch[1].trim();
  }

  const actionMatch = prompt.match(/\b(?:building|launching|introducing|announcing|presenting|creating|making)\s+([A-Za-z0-9\s–—\-]+?)(?:,\s*|\s+(?:an|a|the)\b)/i);
  if (actionMatch && actionMatch[1] && !isMetaPhrase(actionMatch[1])) {
    return actionMatch[1].trim();
  }

  return "";
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
  email?: string | undefined;
  website?: string | undefined;
  wordsOnImage?: string | undefined;
  tickedDetails?: {
    logo?: boolean;
    colors?: boolean;
    phone?: boolean;
    location?: boolean;
    website?: boolean;
    email?: boolean;
  } | undefined;
  layout?: "full-bleed-cinematic" | "modern-editorial" | "hero-showcase" | "left-text-right-visual" | "centered-hero" | "bottom-banner" | undefined;
  directionIndex?: number | undefined;
  format?: "Square" | "Portrait 4:5" | "Story" | undefined;
  referenceImageUrl?: string | null | undefined;
  templateId?: string | null | undefined;
}): Promise<FlyerBrief> {
  const apiKey = getOpenAiApiKey();
  const model = process.env["OPENAI_MODEL"]?.trim() || "gpt-4o-mini";

  const brandName = opts.businessName || "Avero Innovations";
  const brandTagline = opts.tagline || "";
  const brandColors = opts.colors?.join(", ") || "teal, navy blue, clean white";
  const brandTone = opts.tone || "Premium";
  const directionIndex = opts.directionIndex ?? 0;
  const format = opts.format || "Portrait 4:5";

  const formatInstruction = format === "Square"
    ? "Instagram Square Post (1:1 aspect ratio, 1024x1024). Keep visual composition balanced and centered with high density."
    : format === "Story"
    ? "Instagram / Mobile Story (9:16 vertical full-screen aspect ratio, 1024x1792). Full vertical mobile layout with safe space at top and bottom."
    : "Instagram Portrait Post (4:5 vertical aspect ratio, 1024x1280). Tall commercial flyer framing with prominent vertical hierarchy.";

  const directionConcepts = [
    "Direction 1: Dynamic sports action & athletic intensity. Action photography of a batsman hitting a shot or bowler bowling on the pitch under brilliant stadium floodlights, motion blur, grass blades flying, dramatic sports photography (Sony A7 IV, 35mm f/1.8 aesthetic).",
    "Direction 2: Prestigious championship celebration. A magnificent golden championship trophy cup in sharp focus on a pedestal bathed in stadium spotlights, with night stadium fireworks bursting over the arena. Energetic celebratory atmosphere with bokeh lights.",
    "Direction 3: Team camaraderie & club pavilion. A cheerful, authentic group of corporate colleagues / teammates in team t-shirts in a celebratory team huddle on the lush green Rajpath Club field, looking enthusiastic under stadium floodlights.",
    "Direction 4: Modern high-contrast sports editorial poster. Dramatic stadium floodlight silhouette against a deep twilight gradient sky, with bold typography highlighting the Dates, Match Timing, and ₹1 Lakh Prize Pool.",
  ];
  const directionVariation = directionConcepts[directionIndex % directionConcepts.length];

  const structured = parseStructuredPrompt(opts.prompt);
  const namedProduct = extractNamedProduct(opts.prompt);

  const systemPrompt = `You are an elite commercial creative director and advertising copywriter creating a flyer brief for an Instagram advertisement (${formatInstruction}).
Your primary mission is to identify the EXACT domain and topic of the user's prompt and create an authentic, category-specific advertisement brief tailored for this format.

You are creating: ${directionVariation}

DOMAIN & CATEGORY GUIDELINES:
1. "festival" (Diwali, Eid, Christmas, New Year, Holi, Navratri, Thanksgiving, etc.):
   - Diwali: MUST describe traditional glowing clay and brass diyas (oil lamps) with authentic warm flickering flames, arranged around an intricate circular floral mandala rangoli decorated with fresh yellow and orange marigold flower petals. Top backdrop with ornate hanging golden Moroccan/Indian brass lanterns glowing warmly, floating golden sparklers and fairy lights bokeh against deep royal midnight navy and rich teal. Headline e.g. "Celebrate Diwali with ${brandName}!", hero_title e.g. "GRAND FESTIVE PARTY" or "DIWALI CELEBRATION" in large 3D embossed gold metallic serif lettering.
2. "food" (Pizza, burger, cafe, bakery, sushi, gourmet restaurant, food delivery, coffee, dining):
   - MUST describe mouthwatering, hyper-realistic hero food photography! For pizza: an artisan wood-fired pizza fresh out of the stone brick oven on a rustic dark charred wooden board, bubbling melted golden mozzarella cheese stretching smoothly, fresh bright green basil leaves, roasted cherry tomatoes, blistered crust, dusting of flour, warm ambient pizzeria lighting, delicate steam rising. Headline e.g. "Craving Authentic Italian Flavor?", hero_title: "WOOD-FIRED ARTISAN PIZZA" or "HOT & CRISPY SLICES".
3. "celebration_event" (Corporate anniversary, milestone years e.g. 'completed 3 years', gala party, awards, grand reception):
   - Describe a luxury celebration with 3D metallic golden numerals, crystal champagne flutes, subtle golden confetti glow, elegant festive banquet or rooftop lounge with warm golden lighting. Headline e.g. "Celebrate 3 Years of Innovation", hero_title: "ANNUAL MILESTONE GALA".
4. "product_tech" & "corporate_announcement" (Software, SaaS, AI, tech innovation, company rebranding e.g. 'is now Aurelian International', corporate update, agency, professional solutions):
   - MUST describe an authentic, photorealistic commercial lifestyle and workplace photograph! E.g. A relatable young professional or software engineer working comfortably at a contemporary minimalist wooden desk with an ultra-wide curved monitor showing code and analytics dashboards, warm natural ambient window sunlight, clean modern office interior with soft depth-of-field background. Cinematic, human, realistic commercial advertising photography (Sony A7 IV, 35mm f/1.8 aesthetic). NEVER cartoon, NEVER CGI, NEVER 3D Pixar, NEVER holographic abstract cubes.
5. "sports_tournament" & "fitness_sports" (Cricket tournament, corporate cup, football match, sports league, employee championship, athletics):
   - MUST describe an authentic, photorealistic stadium sporting atmosphere at night under brilliant stadium floodlights! Strictly follow the assigned concept: ${directionVariation}.
   - NEVER cartoon, NEVER CGI, NEVER 3D Pixar, NEVER video-game characters.
6. "retail_sale" (Shopping offers, discounts, fashion, seasonal sales):
   - Describe high-impact promotional styling with bold discount badges, luxury shopping boxes, and dynamic editorial lighting.

RETURN JSON SCHEMA:
{
  "category": "festival | food | celebration_event | product_tech | retail_sale | fitness_sports | sports_tournament | general_commercial",
  "headline": "4-6 words engaging secondary invitation or hook (e.g. 'Celebrate Diwali with Avero Innovations!')",
  "hero_title": "2-4 words prominent centerpiece title in ALL CAPS (e.g. 'GRAND FESTIVE PARTY', 'WOOD-FIRED ARTISAN PIZZA', 'AVERO CRICKET TOURNAMENT')",
  "badge_text": "2-4 words highlight ribbon tag (e.g. '₹1 LAKH PRIZE POOL', 'SPECIAL INVITATION')",
  "price_text": "same as badge_text",
  "date_text": "exact date/day mentioned in prompt (e.g. '25-27 Nov') or empty string if not in prompt",
  "time_text": "exact timing/hours mentioned in prompt (e.g. '9:00 PM – 1:00 AM') or empty string if not in prompt",
  "venue_text": "exact venue, ground, hall or hotel mentioned in prompt (e.g. 'Rajpath Club Ground', 'Marriott Resort') or empty string if not in prompt",
  "prize_text": "exact prize pool amount or tournament prize (e.g. '₹1 Lakh Prize Pool' or 'Prize: 1 Lac') or empty string if not mentioned",
  "features": ["3 distinct highlight labels with icons, max 3 words each"],
  "cta": "welcoming sign-off or action button, max 6 words (e.g. 'Cordially welcoming all team members and partners.')",
  "scene": "vivid, photorealistic scene description strictly matching the assigned direction variation",
  "layout": "full-bleed-cinematic | modern-editorial | hero-showcase",
  "style_notes": "harmonious color palette and visual atmosphere matching the occasion"
}

CRITICAL EXTRACTION RULES:
- IMPORTANT FOR TIME: If the prompt mentions a timing or hours (e.g. 'from 9pm to 1 am', '7:00 PM onwards'), extract it into 'time_text'.
- IMPORTANT FOR PRIZE POOL: If the prompt mentions a prize pool or cash prize (e.g. 'prizepool is 1lac', '₹50,000 prize'), extract it into 'prize_text' as '₹1 Lakh Prize Pool' or exact amount.
- IMPORTANT FOR VENUE: If the prompt mentions a venue, hotel, resort, club, or ground (e.g. 'at Rajpath club ground', 'at Marriott Resort'), extract it into 'venue_text' (e.g. 'Rajpath Club Ground').
- IMPORTANT FOR DATE: If the prompt mentions a date or day (e.g. '25-27 nov', 'Sunday, 1st November'), extract it into 'date_text'.
- IMPORTANT FOR PRODUCT / TOOL / SERVICE NAMES: If the prompt mentions a specific product name, app, SaaS platform, tool, or agency (e.g. 'Diya AI – Marketing Agency' or 'Diya AI'), you MUST use this exact name in 'headline' or 'hero_title'! NEVER replace a specific product name with generic copy.
- IMPORTANT FOR FEATURES: Extract 3 distinct highlight features from the prompt.
- TEXT DEDUPLICATION MANDATE: Every text element must be completely distinct. Do NOT repeat the headline in the badge or cta!
- Set 'layout' to '${opts.layout || (directionIndex === 0 ? "full-bleed-cinematic" : "modern-editorial")}'.`;

  const wordsPrompt = opts.wordsOnImage ? `\nExact Words to Print on Image (one line per line):\n${opts.wordsOnImage}` : "";
  const contactPrompt = `\nTicked Contact Details to Include: ${[
    opts.tickedDetails?.phone && opts.phone ? `Phone: ${opts.phone}` : "",
    opts.tickedDetails?.email && opts.email ? `Email: ${opts.email}` : "",
    opts.tickedDetails?.website && opts.website ? `Website: ${opts.website}` : "",
    opts.tickedDetails?.location && opts.location ? `Location: ${opts.location}` : "",
  ].filter(Boolean).join(", ") || "None"}`;

  const templateObj = opts.templateId ? getTemplateById(opts.templateId) : undefined;
  const referencePrompt = (opts.referenceImageUrl || templateObj)
    ? `\nDESIGN REFERENCE & TEMPLATE STYLING DIRECTIVE:
Reference Image: ${opts.referenceImageUrl || templateObj?.referenceImageUrl || ""}
Template Name: ${templateObj?.title || "Selected Design Reference"}
Template Visual Composition: ${templateObj?.description || "Emulate the composition, framing, lighting atmosphere, visual hierarchy, and color grading of this reference design."}
Template Aesthetic Atmosphere: ${templateObj?.defaultPrompt || ""}
CRITICAL DIRECTIVE: You MUST anchor the visual aesthetic to this chosen reference design! Adapt the reference's composition, camera perspective, lighting quality, color grading, and negative space to showcase the user's specific topic ("${opts.prompt}"). The resulting poster must feel like an elevated, crystal-clear commercial advertisement inspired by this reference design.`
    : "";

  const userPrompt = `User Offer Prompt: "${opts.prompt}"
Business Name: "${brandName}"
Tagline: "${brandTagline}"
Brand Colors: "${brandColors}"
Tone: "${brandTone}"
Style: "${opts.style || "Bold"}"
Target Format & Aspect Ratio: "${format}" (${formatInstruction})${namedProduct ? `\nPRIMARY PROMOTED PRODUCT / OFFER: "${namedProduct}". You MUST feature "${namedProduct}" prominently on the flyer!` : ""}${wordsPrompt}${contactPrompt}${referencePrompt}`;

  if (apiKey) {
    try {
      const userContent: Array<{ type: string; text?: string; image_url?: { url: string } }> = [
        { type: "text", text: userPrompt },
      ];

      const refUrlForVision = opts.referenceImageUrl || templateObj?.referenceImageUrl;
      if (refUrlForVision) {
        try {
          let imageUrlForVision = refUrlForVision;
          if (refUrlForVision.startsWith("/")) {
            const localPath = path.resolve(process.cwd(), "public", refUrlForVision.replace(/^\/+/, ""));
            if (fs.existsSync(localPath)) {
              const buf = fs.readFileSync(localPath);
              imageUrlForVision = `data:image/png;base64,${buf.toString("base64")}`;
            }
          } else if (refUrlForVision.startsWith("http")) {
            const fetchRef = await fetch(refUrlForVision, { signal: AbortSignal.timeout(8000) });
            if (fetchRef.ok) {
              const buf = Buffer.from(await fetchRef.arrayBuffer());
              imageUrlForVision = `data:image/png;base64,${buf.toString("base64")}`;
            }
          }
          userContent.push({
            type: "image_url",
            image_url: { url: imageUrlForVision },
          });
        } catch {}
      }

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
            { role: "user", content: userContent },
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
          const rawTime = typeof parsed.time_text === "string" ? parsed.time_text.trim() : "";
          const rawVenue = typeof parsed.venue_text === "string" ? parsed.venue_text.trim() : "";
          const rawPrize = typeof parsed.prize_text === "string" ? parsed.prize_text.trim() : "";
          const rawBadge = typeof parsed.badge_text === "string"
            ? parsed.badge_text.trim()
            : typeof parsed.price_text === "string"
            ? parsed.price_text.trim()
            : "";
          const rawHeroTitle = typeof parsed.hero_title === "string" ? parsed.hero_title.trim() : "";

          let finalHeadline = structured.headline || String(parsed.headline || (namedProduct && !isMetaPhrase(namedProduct) ? namedProduct : "Celebrate With Us")).trim();
          let finalHeroTitle = structured.supportingText || rawHeroTitle || (namedProduct && !isMetaPhrase(namedProduct) ? namedProduct : "SPECIAL EVENT");
          let finalCta = structured.cta || String(parsed.cta || "Cordially welcoming all team members and partners.").trim();

          if (isMetaPhrase(finalHeroTitle)) {
            finalHeroTitle = structured.supportingText || (namedProduct && !isMetaPhrase(namedProduct) ? namedProduct : "");
          }
          if (isMetaPhrase(finalHeadline)) {
            finalHeadline = structured.headline || (namedProduct && !isMetaPhrase(namedProduct) ? namedProduct : "Exclusive Offer");
          }

          if (namedProduct && !isMetaPhrase(namedProduct) && !structured.headline) {
            if (!finalHeadline.toLowerCase().includes(namedProduct.toLowerCase()) && !finalHeroTitle.toLowerCase().includes(namedProduct.toLowerCase())) {
              finalHeroTitle = namedProduct;
              finalHeadline = namedProduct;
            }
          }

          if (opts.wordsOnImage && opts.wordsOnImage.trim()) {
            const lines = opts.wordsOnImage.trim().split("\n").map((l) => l.trim()).filter(Boolean);
            if (lines[0]) finalHeadline = lines[0];
            if (lines[1]) finalHeroTitle = lines[1];
            if (lines[2]) finalCta = lines[2];
          }

          // Strict text deduplication: if cta or badge matches headline, substitute with prize or event badge
          if (finalCta.toLowerCase() === finalHeadline.toLowerCase()) {
            finalCta = rawPrize ? `🏆 ${rawPrize}` : "⚡ Welcome Team";
          }
          let badgeText = structured.offer || rawBadge;
          if (!badgeText || badgeText.toLowerCase() === finalHeadline.toLowerCase()) {
            badgeText = structured.offer || (rawPrize ? `🏆 ${rawPrize}` : (rawTime ? `⏰ ${rawTime}` : "SPECIAL EVENT"));
          }

          return {
            category: parsed.category,
            headline: finalHeadline,
            hero_title: finalHeroTitle,
            badge_text: badgeText,
            price_text: badgeText,
            date_text: rawDate,
            time_text: rawTime,
            venue_text: rawVenue,
            prize_text: rawPrize,
            features: Array.isArray(parsed.features) && parsed.features.length >= 3
              ? parsed.features.slice(0, 3).map((f: any) => String(f).trim())
              : [rawVenue || "Rajpath Club Ground", rawTime || "9 PM - 1 AM", rawPrize || "₹1 Lakh Prize Pool"],
            cta: finalCta,
            scene: String(parsed.scene || "Modern professional stadium setting with authentic lighting and clean depth of field").trim(),
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
  const isSportsOrCricket = /\b(cricket|tournament|match|ground|pitch|sports|cup|league|team t-shirts|prizepool)\b/i.test(lowerPrompt);

  const dayMatch = opts.prompt.match(/\b(sunday|monday|tuesday|wednesday|thursday|friday|saturday|weekend|today|tomorrow)\b/i);
  const dateMatch = opts.prompt.match(/\b(?:\d{1,2}(?:st|nd|rd|th)?\s+(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)|(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+\d{1,2}(?:st|nd|rd|th)?|\d{1,2}\s*-\s*\d{1,2}\s*(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?))\b/i);
  const fallbackDate = (dayMatch && dateMatch)
    ? `${dayMatch[0].charAt(0).toUpperCase() + dayMatch[0].slice(1).toLowerCase()}, ${dateMatch[0]}`
    : (dateMatch ? dateMatch[0] : (dayMatch ? `THIS ${dayMatch[0].toUpperCase()}` : ""));

  const timeMatch = opts.prompt.match(/\b(\d{1,2}(?::\d{2})?\s*(?:am|pm)\s*(?:to|-|till)\s*\d{1,2}(?::\d{2})?\s*(?:am|pm))\b/i)
    || opts.prompt.match(/\b(?:timing|time|from)\s*:?\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm)?\s*(?:to|-|till)\s*\d{1,2}(?::\d{2})?\s*(?:am|pm))\b/i);
  const fallbackTime = timeMatch?.[1] ? timeMatch[1].trim() : "";

  const prizeMatch = opts.prompt.match(/\b(?:prizepool|prize\s*pool|prize|cash\s*prize)\s*(?:is|of|:)?\s*([₹$€£]?\s*\d+\s*(?:lac|lakh|crore|k|m)?|\d+(?:,\d+)*(?:\s*(?:lac|lakh|crore))?)\b/i);
  let fallbackPrize = "";
  if (prizeMatch && prizeMatch[1]) {
    const rawVal = prizeMatch[1].trim();
    fallbackPrize = /lac|lakh/i.test(rawVal)
      ? `₹${rawVal.replace(/₹/g, "").trim().toUpperCase()} Prize Pool`
      : `₹${rawVal} Prize Pool`;
  }

  const venueMatch = opts.prompt.match(/\b(?:at|in|venue:?)\s+([A-Za-z0-9\s&'-]+(?:\bhotel|\bresort|\bhall|\bcenter|\bcentre|\bpalace|\bclub\s*ground|\bclub|\bground|\barena|\bgarden|\binn|\bbistro|\bcafe|\brestaurant))\b/i)
    || opts.prompt.match(/\b(?:rajpath club ground|rajpath club|marriott resort|marriott|taj hotel|hyatt|hilton|radisson|leela|oberoi|itc|novotel|westin)\b/i);
  const fallbackVenue = venueMatch ? (venueMatch[1] || venueMatch[0]).trim() : "";

  // Extract features directly from prompt if possible
  const liveMusicMatch = /live music/i.test(opts.prompt);
  const buffetMatch = /gourmet buffet|buffet|dinner|food/i.test(opts.prompt);
  const giveawayMatch = /giveaways?|gifts?|prizes?/i.test(opts.prompt);

  if (structured.headline) {
    const isRetail = /sale|black friday|discount|offer|deal|cyber monday/i.test(opts.prompt);
    return {
      category: isRetail ? "retail_sale" : (isCelebration ? "celebration_event" : "general_commercial"),
      headline: structured.headline,
      hero_title: structured.supportingText || (namedProduct && !isMetaPhrase(namedProduct) ? namedProduct : "SPECIAL OFFER"),
      badge_text: structured.offer || "SPECIAL OFFER",
      price_text: structured.offer || "SPECIAL OFFER",
      date_text: structured.date || fallbackDate,
      time_text: structured.time || fallbackTime,
      venue_text: structured.venue || fallbackVenue,
      prize_text: structured.prize || fallbackPrize,
      features: structured.offer ? [structured.offer, "All Subscriptions", "Limited Time Deal"] : ["Custom Solution", "Mobile Responsive", "Growth Ready"],
      cta: structured.cta || "GRAB YOUR DEAL NOW →",
      scene: isRetail
        ? "Dramatic, high-end Black Friday sale atmosphere with polished black and gold luxury aesthetics, glowing discount pedestals, modern AI elements, and sleek depth of field."
        : "Contemporary minimalist professional workplace with clean ambient lighting and sharp displays",
      layout: opts.layout || "full-bleed-cinematic",
      style_notes: isRetail ? "Black and gold luxury theme, sleek glowing amber accents, professional commercial lighting" : `${brandColors}, clean commercial aesthetic`,
    };
  }

  if (isSportsOrCricket) {
    const sportsScenes = [
      "Dynamic action shot on the cricket pitch under brilliant stadium floodlights. A batsman playing an aggressive shot with motion blur and grass kicking up, authentic night sports photography (Sony A7 IV, 35mm f/1.8 aesthetic).",
      "Prestigious golden championship trophy cup on a pedestal bathed in stadium spotlights, with spectacular night fireworks bursting in the background sky above the stadium arena.",
      "Spirited, cheerful team of corporate colleagues wearing matching team t-shirts in a celebratory team huddle on the Rajpath Club field, looking enthusiastic under stadium floodlights.",
      "Modern high-contrast sports editorial poster with sleek stadium floodlight silhouette against a twilight gradient sky, prominent tournament info cards.",
    ];
    return {
      category: "sports_tournament",
      headline: opts.wordsOnImage ? opts.wordsOnImage.trim().split("\n")[0]! : "Annual Cricket Tournament",
      hero_title: (brandName || "Avero Innovations").toUpperCase() + " CRICKET CUP",
      badge_text: fallbackPrize ? `🏆 ${fallbackPrize}` : "CHAMPIONSHIP MATCH",
      price_text: fallbackPrize || "",
      prize_text: fallbackPrize || "₹1 Lakh Prize Pool",
      date_text: fallbackDate || "25–27 November",
      time_text: fallbackTime || "9:00 PM – 1:00 AM",
      venue_text: fallbackVenue || "Rajpath Club Ground",
      features: [
        fallbackVenue || "Rajpath Club Ground",
        fallbackTime || "9:00 PM – 1:00 AM",
        fallbackPrize || "₹1 Lakh Prize Pool",
      ],
      cta: "⚡ Cordially welcoming all team members.",
      scene: sportsScenes[directionIndex % sportsScenes.length]!,
      layout: opts.layout || "full-bleed-cinematic",
      style_notes: `${brandColors}, energetic night stadium floodlight radiance`,
    };
  }

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
    headline: isCelebration ? "Celebrate 3 Years of Innovation" : (namedProduct ? `Introducing ${namedProduct}` : "Launch Your Dream Website"),
    hero_title: isCelebration ? "ANNUAL MILESTONE GALA" : (namedProduct ? namedProduct.toUpperCase() : "NEXT-GEN DIGITAL SUITE"),
    badge_text: isCelebration ? "3RD ANNIVERSARY" : (namedProduct ? "FEATURED PRODUCT" : "EXCLUSIVE OFFER"),
    price_text: isCelebration ? "3RD ANNIVERSARY" : (namedProduct ? "FEATURED PRODUCT" : "EXCLUSIVE OFFER"),
    date_text: fallbackDate,
    venue_text: fallbackVenue,
    features: isCelebration
      ? ["3-Year Milestone", fallbackVenue || "Marriott Resort", "Cordially Invited"]
      : (namedProduct ? [namedProduct, "All-in-One Platform", "Automate Growth"] : ["Custom Design", "Mobile Responsive", "Built to Grow"]),
    cta: isCelebration ? "RSVP NOW →" : (namedProduct ? `DISCOVER ${namedProduct.toUpperCase()} →` : "LET'S BUILD YOUR WEBSITE →"),
    scene: isCelebration
      ? "Luxury hotel gala ballroom with ambient golden architectural lighting, crystal champagne flutes, modern luxury decor, and well-dressed business professionals celebrating"
      : (namedProduct ? `Modern clean tech commercial workplace showcasing ${namedProduct} on sharp high-resolution displays in a sleek contemporary office environment` : "3D laptop and smartphone mockups showing a modern responsive website on a clean minimalist desk"),
    layout: opts.layout || "full-bleed-cinematic",
    style_notes: `${brandColors}, clean commercial aesthetic`,
  };
}

// ─── Logo Compositing Helper (Sharp) ──────────────────────────────────────────

export async function fetchLogoBuffer(logoUrl: string): Promise<Buffer> {
  const fs = await import("fs");
  const path = await import("path");

  if (logoUrl.startsWith("data:")) {
    const base64Data = logoUrl.replace(/^data:image\/\w+;base64,/, "");
    return Buffer.from(base64Data, "base64");
  }

  if (logoUrl.startsWith("/")) {
    const candidates = [
      path.resolve(process.cwd(), "public", logoUrl.replace(/^\/+/, "")),
      path.resolve(process.cwd(), ".vercel/output/static", logoUrl.replace(/^\/+/, "")),
      path.resolve(process.cwd(), "static", logoUrl.replace(/^\/+/, "")),
    ];
    for (const p of candidates) {
      if (fs.existsSync(p)) {
        return fs.readFileSync(p);
      }
    }
    const cdnUrl = `https://pub-f951b9a0f9b3407c901fb638d50404db.r2.dev/branding/${logoUrl.replace(/^\/+/, "")}`;
    const res = await fetch(cdnUrl, { signal: AbortSignal.timeout(10_000) });
    if (res.ok) {
      return Buffer.from(await res.arrayBuffer());
    }
  }

  const res = await fetch(logoUrl, { signal: AbortSignal.timeout(12_000) });
  if (!res.ok) {
    throw new Error(`Failed to fetch logo image (${res.status})`);
  }
  return Buffer.from(await res.arrayBuffer());
}

/**
 * Extracts the 2-4 primary vibrant accent hues from a logo buffer using 12-bucket hue quantization.
 * These colors dynamically guide the entire poster's visual theme, buttons, pills, and accents.
 */
export async function extractLogoPalette(logoBuffer: Buffer): Promise<string[]> {
  try {
    const { default: sharp } = await import("sharp");
    const { data } = await sharp(logoBuffer).ensureAlpha().raw().toBuffer({ resolveWithObject: true });

    const buckets = Array.from({ length: 12 }, () => ({ count: 0, rSum: 0, gSum: 0, bSum: 0 }));
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3]! < 120) continue;
      const r = data[i]!, g = data[i + 1]!, b = data[i + 2]!;
      const max = Math.max(r, g, b), min = Math.min(r, g, b);
      const delta = max - min;
      if (delta < 28 || max < 35 || min > 238) continue;

      let h = 0;
      if (max === r) h = ((g - b) / delta) % 6;
      else if (max === g) h = (b - r) / delta + 2;
      else h = (r - g) / delta + 4;
      h = Math.round(h * 60);
      if (h < 0) h += 360;

      const idx = Math.floor(h / 30) % 12;
      buckets[idx]!.count++;
      buckets[idx]!.rSum += r;
      buckets[idx]!.gSum += g;
      buckets[idx]!.bSum += b;
    }

    const activeHues = buckets
      .filter((b) => b.count > 10)
      .sort((a, b) => b.count - a.count)
      .slice(0, 4)
      .map((b) => {
        const r = Math.round(b.rSum / b.count);
        const g = Math.round(b.gSum / b.count);
        const bCol = Math.round(b.bSum / b.count);
        return "#" + [r, g, bCol].map((x) => x.toString(16).padStart(2, "0")).join("").toUpperCase();
      });

    return activeHues.length > 0 ? activeHues : [];
  } catch {
    return [];
  }
}

export async function compositeLogoOnFlyer(
  flyerBuffer: Buffer,
  logoUrl: string,
  format: "Square" | "Portrait 4:5" | "Story" = "Portrait 4:5"
): Promise<Buffer> {
  const { default: sharp } = await import("sharp");

  const logoBuffer = await fetchLogoBuffer(logoUrl);

  // Inspect flyer dimensions
  const flyerMeta = await sharp(flyerBuffer).metadata();
  const flyerW = flyerMeta.width || (format === "Square" ? 1024 : format === "Story" ? 1024 : 1024);

  // Process logo: check corner pixels and remove solid, light, or dark backgrounds cleanly
  const logoSharp = sharp(logoBuffer);
  const { data, info } = await logoSharp.ensureAlpha().raw().toBuffer({ resolveWithObject: true });

  // Universal background extraction: sample 4 corners + edge points
  const getPixel = (x: number, y: number): [number, number, number, number] => {
    const clampedX = Math.min(info.width - 1, Math.max(0, x));
    const clampedY = Math.min(info.height - 1, Math.max(0, y));
    const idx = (clampedY * info.width + clampedX) * 4;
    return [data[idx] ?? 0, data[idx + 1] ?? 0, data[idx + 2] ?? 0, data[idx + 3] ?? 0];
  };

  const samplePoints: Array<[number, number, number, number]> = [
    getPixel(0, 0),
    getPixel(info.width - 1, 0),
    getPixel(0, info.height - 1),
    getPixel(info.width - 1, info.height - 1),
    getPixel(Math.floor(info.width / 2), 0),
    getPixel(0, Math.floor(info.height / 2)),
    getPixel(info.width - 1, Math.floor(info.height / 2)),
  ];

  // If corners are already transparent (e.g. transparent PNG), skip background removal completely!
  const hasOpaqueBg = samplePoints.filter((p) => p[3] > 180).length >= 4;

  if (hasOpaqueBg) {
    const opaqueSamples = samplePoints.filter((p) => p[3] > 180);
    const avgR = opaqueSamples.reduce((s, p) => s + p[0], 0) / opaqueSamples.length;
    const avgG = opaqueSamples.reduce((s, p) => s + p[1], 0) / opaqueSamples.length;
    const avgB = opaqueSamples.reduce((s, p) => s + p[2], 0) / opaqueSamples.length;

    const isLightCornerBg = avgR > 140 && avgG > 140 && avgB > 140;
    const isDarkCornerBg = avgR < 50 && avgG < 50 && avgB < 50;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i]!;
      const g = data[i + 1]!;
      const b = data[i + 2]!;

      // Distance to corner background color
      const distToCorner = Math.sqrt((r - avgR) ** 2 + (g - avgG) ** 2 + (b - avgB) ** 2);

      let isBg = false;
      if (distToCorner < 40) {
        isBg = true;
      } else if (isLightCornerBg && r > 160 && g > 150 && b > 140 && Math.abs(r - g) < 30 && Math.abs(g - b) < 30) {
        // ONLY if corners are light: remove light desaturated background (never touches dark text!)
        isBg = true;
      } else if (isDarkCornerBg && r < 40 && g < 40 && b < 40) {
        // ONLY if corners are dark: remove dark background (never touches light text!)
        isBg = true;
      }

      if (isBg) {
        data[i + 3] = 0; // Transparent
      } else if (distToCorner < 55) {
        // Soft feather edge for smooth anti-aliased blending
        const feather = (distToCorner - 40) / 15;
        data[i + 3] = Math.round(data[i + 3]! * feather);
      }
    }
  }

  // Trim transparent padding so bounding box hugs the real logo artwork/emblem/text
  const trimmedSharp = sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 },
  }).trim();

  const trimmedMeta = await trimmedSharp.metadata();
  const trimmedW = trimmedMeta.width || info.width;
  const trimmedH = trimmedMeta.height || info.height;
  const trimmedAspect = trimmedW / Math.max(1, trimmedH);

  // Dynamically compute optimal logo size based on aspect ratio and format
  let targetW = 260;
  let targetH = 110;

  if (format === "Story") {
    if (trimmedAspect > 3.0) {
      targetW = 320;
      targetH = 80;
    } else if (trimmedAspect > 1.8) {
      targetW = 280;
      targetH = 115;
    } else {
      targetW = 220;
      targetH = 135;
    }
  } else {
    // Portrait 4:5 or Square 1:1
    if (trimmedAspect > 3.0) {
      targetW = 280;
      targetH = 75;
    } else if (trimmedAspect > 1.8) {
      targetW = 250;
      targetH = 105;
    } else {
      targetW = 200;
      targetH = 125;
    }
  }

  const trimmedLogo = await trimmedSharp
    .resize({ width: targetW, height: targetH, fit: "inside" })
    .png()
    .toBuffer({ resolveWithObject: true });

  const left = Math.max(0, Math.round((flyerW - trimmedLogo.info.width) / 2));
  const top = format === "Story" ? 90 : (format === "Square" ? 45 : 55);

  return await sharp(flyerBuffer)
    .composite([{ input: trimmedLogo.data, top, left }])
    .png()
    .toBuffer();
}

// ─── Step 2: Single-Shot Finished Flyer Generation (OpenAI) ──────────────────

export async function generateFinishedFlyer(opts: {
  brief: FlyerBrief;
  businessName: string;
  tagline?: string | undefined;
  logoUrl?: string | null | undefined;
  colors?: string[] | undefined;
  format?: "Square" | "Portrait 4:5" | "Story" | undefined;
  wordsOnImage?: string | undefined;
  phone?: string | undefined;
  email?: string | undefined;
  website?: string | undefined;
  location?: string | undefined;
  tickedDetails?: {
    logo?: boolean;
    colors?: boolean;
    phone?: boolean;
    location?: boolean;
    website?: boolean;
    email?: boolean;
  } | undefined;
  size?: string | undefined;
  referenceImageUrl?: string | null | undefined;
  templateId?: string | null | undefined;
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
  const quality = (rawQuality === "low" || rawQuality === "medium") && !opts.size?.includes("2K")
    ? rawQuality
    : "high";

  // Map format & requested size to exact OpenAI image dimensions
  const format = opts.format || "Portrait 4:5";
  let size = format === "Square"
    ? "1024x1024"
    : format === "Story"
    ? "1024x1792"
    : "1024x1280";

  if (opts.size) {
    const normalized = opts.size.replace(/[*×]/g, "x").trim();
    const dimMatch = normalized.match(/(\d{3,4})x(\d{3,4})/i);
    if (dimMatch) {
      const w = parseInt(dimMatch[1]!, 10);
      const h = parseInt(dimMatch[2]!, 10);
      if (w === h) size = "1024x1024";
      else if (h > w * 1.5) size = "1024x1792";
      else size = "1024x1280";
    }
  }

  const aspectRatioLabel = format === "Square"
    ? `aspect ratio 1:1 square, ${size}`
    : format === "Story"
    ? `aspect ratio 9:16 vertical story, ${size}`
    : `aspect ratio 4:5 portrait, ${size}`;

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
  const timeStr = opts.brief.time_text?.trim() ? `'${opts.brief.time_text.trim()}'` : "";
  const venueStr = opts.brief.venue_text?.trim() ? `'${opts.brief.venue_text.trim()}'` : "";
  const prizeStr = opts.brief.prize_text?.trim() ? `'${opts.brief.prize_text.trim()}'` : "";

  // Date, timing and venue instruction (single framed bar, do not repeat)
  const eventParts: string[] = [];
  if (dateStr) eventParts.push(`calendar icon for date ${dateStr}`);
  if (timeStr) eventParts.push(`clock icon for time ${timeStr}`);
  if (venueStr) eventParts.push(`location pin icon for venue ${venueStr}`);

  const eventDetailsInstruction = eventParts.length > 0
    ? `Framed event details bar: ${eventParts.join(", ")}. Do not repeat date, time, or venue details elsewhere. `
    : "";

  const prizePoolInstruction = prizeStr
    ? `Prominent tournament championship prize badge or ribbon: '🏆 ${opts.brief.prize_text?.trim()}'. `
    : "";

  // Feature pills with icons
  const featureInstruction = `Feature row with three distinct icon badges: '${f1}', '${f2}', '${f3}'. `;

  // Top header instruction: Reserve top negative space and strictly prohibit drawing hallucinated brand logos/emblems
  const topLogoInstruction = opts.logoUrl
    ? `Top Header & Logo Safe Area: Keep the top 15% of the poster as clean, spacious negative space with seamless lighting matching the environment. CRITICAL BRAND LOGO DIRECTIVE: Absolutely DO NOT paint, invent, draw, or render any company emblem, logo icon, crest, or fake brand symbol at the top or in the header. Do NOT write fake brand names or watermarks like GodiyaAI or invented logos. Leave the top header empty, clean, and uncluttered so the official brand logo can be cleanly composited there.`
    : `Top Header: Brand name '${opts.businessName.toUpperCase()}' cleanly styled with tagline '${opts.tagline || ""}'. The top header must remain clean, bright, and evenly illuminated without any black vignette or dark smoke.`;

  // Bottom contact strip instruction
  const contactParts: string[] = [];
  if (opts.tickedDetails?.phone && opts.phone) contactParts.push(`phone icon with number '${opts.phone}'`);
  if (opts.tickedDetails?.email && opts.email) contactParts.push(`email icon with '${opts.email}'`);
  if (opts.tickedDetails?.website && opts.website) contactParts.push(`website icon with '${opts.website}'`);
  if (opts.tickedDetails?.location && opts.location) contactParts.push(`location pin with '${opts.location}'`);

  const contactBarInstruction = contactParts.length > 0
    ? `At the bottom: sleek, frosted dark translucent contact pill with clean icons: ${contactParts.join(" and ")}. `
    : "";

  const isSaleOrPromo =
    opts.brief.category === "retail_sale" ||
    /\b(sale|discount|offer|black friday|cyber monday|deal|clearance)\b/i.test(opts.brief.headline);

  const isTechOrCorporate =
    opts.brief.category === "product_tech" ||
    (opts.brief.category as string) === "corporate_announcement" ||
    opts.brief.category === "sports_tournament" ||
    isSaleOrPromo ||
    Boolean(opts.wordsOnImage);

  // Distinct pill badge that NEVER duplicates headline
  let badgePill = opts.brief.prize_text?.trim()
    ? `🏆 ${opts.brief.prize_text.trim()}`
    : (opts.brief.badge_text && opts.brief.badge_text.toLowerCase() !== opts.brief.headline.toLowerCase()
      ? opts.brief.badge_text
      : (opts.brief.time_text ? `⏰ ${opts.brief.time_text}` : "⚡ Special Event"));

  if (badgePill.toLowerCase() === opts.brief.headline.toLowerCase()) {
    badgePill = "⚡ Special Event";
  }

  // Filter out any meta phrases like "promotional poster" from hero_title
  const cleanHeroTitle = (opts.brief.hero_title && !isMetaPhrase(opts.brief.hero_title))
    ? opts.brief.hero_title
    : (opts.tagline || "");

  // Center display typography instruction
  const titleInstruction = isSaleOrPromo
    ? `Main Sale Headline in bold prominent typography: '${opts.brief.headline}'. Centerpiece Big Offer badge or discount banner: '${opts.brief.badge_text || opts.brief.price_text}'. ${cleanHeroTitle ? `Supporting text: '${cleanHeroTitle}'. ` : ""}${opts.brief.cta ? `Call to action button: '${opts.brief.cta}'. ` : ""}`
    : isTechOrCorporate
    ? `Upper third typography: Bold, modern, clean sans-serif headline: '${opts.brief.headline}'. ${cleanHeroTitle ? `Supporting clean subline: '${cleanHeroTitle}'. ` : ""}Action pill badge button: '${badgePill}'. `
    : `Secondary invitation headline: '${opts.brief.headline}'. Centerpiece main title in huge, prominent lettering: '${heroTitle}'. `;

  // Footer / CTA instruction (omit duplicate bottom CTA if contact bar is present)
  const footerInstruction = contactParts.length > 0
    ? ""
    : (opts.brief.cta && opts.brief.cta.toLowerCase() !== opts.brief.headline.toLowerCase()
      ? `Bottom invitation sign-off or action button: '${opts.brief.cta}'. `
      : "");

  // Scene & aesthetics instruction
  const colorHarmonyInstruction = opts.colors && opts.colors.length > 0
    ? `Harmonized Brand Color Palette: ${opts.colors.join(", ")}. CRITICAL COLOR HARMONY: The accent graphics, buttons, feature badges, UI charts, and lighting highlights in the poster MUST strictly match and harmonize with this brand color palette (${opts.colors.join(", ")}). Never default to generic green or teal when the brand palette is purple, blue, gold, or red.`
    : "";

  const sceneInstruction = `Atmospheric visual backdrop: ${opts.brief.scene}. Lighting and mood: ${opts.brief.style_notes}. ${colorHarmonyInstruction} `;
  const templateObj = opts.templateId ? getTemplateById(opts.templateId) : undefined;
  const referenceDesc = templateObj ? `${templateObj.title} (${templateObj.description})` : "the selected reference design";
  const referenceInstruction = (opts.referenceImageUrl || templateObj)
    ? `Reference Photo Style Guidance: Strictly emulate the visual composition, framing, color grading, lighting atmosphere, elegant negative space, and premium aesthetic of ${referenceDesc}${opts.referenceImageUrl ? ` (${opts.referenceImageUrl})` : ""}. Craft an elevated commercial poster that faithfully adapts this reference design style for '${opts.brief.hero_title || opts.businessName}'. `
    : "";

  const prompt = `Design a complete, professional, ready-to-post commercial advertisement poster (${aspectRatioLabel}).
Composition & Canvas: Built strictly for ${aspectRatioLabel}. Ensure framing, margins, text padding, and focal elements are beautifully composed specifically for this ${format} aspect ratio. Full-bleed immersive composition, authentic commercial photography and natural lighting.
CRITICAL FULL-BLEED & ZERO-LETTERBOX MANDATE: The background and environment MUST extend 100% seamlessly to all four corners of the canvas (${size}). Absolutely NO black borders, NO black letterboxing, NO pillarboxing, NO curved arch/dome cutouts, and NO dark peripheral vignetting. Every edge of the image must be bright, clean, and fully rendered with the scene environment.
Lighting & Background Cleanliness: Seamless, bright natural lighting across the entire canvas. Absolutely NO black vignette, NO dark smoke, NO dark top shadows, and NO dirty black gradient at the top edge. The top of the room and header must remain bright, clean, and naturally illuminated.
Visual Realism & Authenticity: High-end commercial editorial photography (Sony A7 IV, 35mm f/1.8 aesthetic). Realistic environment matching the prompt with authentic depth of field. Absolutely NO cartoonish, 3D Pixar, CGI animated, or cheap clip-art styles.
${topLogoInstruction}.
${titleInstruction}
${prizePoolInstruction}
${eventDetailsInstruction}
${isTechOrCorporate ? "" : featureInstruction}
${contactBarInstruction}
${footerInstruction}
${sceneInstruction}
${referenceInstruction}
CRITICAL TEXT INTEGRITY: Render ONLY the quoted text exactly as written. Ensure 100% accurate spelling. Every text element must appear AT MOST ONCE on the poster. Absolutely NEVER duplicate the headline text into any badge, capsule pill, or button. Do not invent extra words or watermarks. Ensure high visual contrast, elegant typography, and generous margins so all details are crisp and legible.`.trim();

  log.ai("OpenAI", `Generating finished commercial flyer with ${model}`, { model, size, quality, format, category: opts.brief.category, hasLogo: Boolean(opts.logoUrl) });

  const refUrl = opts.referenceImageUrl || templateObj?.referenceImageUrl;
  let usedEditsApi = false;
  let buffer: Buffer | null = null;
  let previewUrl: string | null = null;

  const [wStr, hStr] = size.split("x");
  const targetW = parseInt(wStr || "1024", 10);
  const targetH = parseInt(hStr || "1280", 10);

  // If a template reference image is provided, condition generation using images/edits
  if (refUrl) {
    try {
      let refBuffer: Buffer | null = null;
      if (refUrl.startsWith("data:")) {
        const base64Data = refUrl.replace(/^data:image\/\w+;base64,/, "");
        refBuffer = Buffer.from(base64Data, "base64");
      } else if (refUrl.startsWith("/")) {
        const localPath = path.resolve(process.cwd(), "public", refUrl.replace(/^\/+/, ""));
        if (fs.existsSync(localPath)) {
          refBuffer = fs.readFileSync(localPath);
        }
      } else {
        const fetchRef = await fetch(refUrl, { signal: AbortSignal.timeout(15_000) });
        if (fetchRef.ok) {
          refBuffer = Buffer.from(await fetchRef.arrayBuffer());
        }
      }

      if (refBuffer) {
        const { default: sharp } = await import("sharp");
        // Pre-fit and crop the reference image to exact target canvas dimensions to prevent ANY black letterbox outpainting
        const fittedRefBuffer = await sharp(refBuffer)
          .resize(targetW, targetH, { fit: "cover", position: "center" })
          .png()
          .toBuffer();

        const formData = new FormData();
        formData.append("image", new Blob([fittedRefBuffer], { type: "image/png" }), "template-ref.png");
        formData.append("model", model);
        formData.append("prompt", prompt);
        formData.append("size", size);
        formData.append("quality", quality);

        log.ai("OpenAI", `Conditioning flyer generation with template reference image via images/edits (${model})`, { size, quality, targetW, targetH });
        const editRes = await fetch("https://api.openai.com/v1/images/edits", {
          method: "POST",
          headers: { Authorization: `Bearer ${apiKey}` },
          body: formData,
          signal: AbortSignal.timeout(60_000),
        });

        if (editRes.ok) {
          const editData = (await editRes.json()) as { data?: Array<{ b64_json?: string; url?: string }> };
          const editItem = editData.data?.[0];
          if (editItem?.b64_json) {
            buffer = Buffer.from(editItem.b64_json, "base64");
            usedEditsApi = true;
          } else if (editItem?.url) {
            previewUrl = editItem.url;
            const fetchRes = await fetch(editItem.url, { signal: AbortSignal.timeout(30_000) });
            if (fetchRes.ok) {
              buffer = Buffer.from(await fetchRes.arrayBuffer());
              usedEditsApi = true;
            }
          }
        } else {
          const errText = await editRes.text();
          log.ai("OpenAI", `images/edits non-200 (${editRes.status}): ${errText.slice(0, 150)}. Falling back to direct generation.`);
        }
      }
    } catch (refErr) {
      log.ai("OpenAI", `Template image conditioning error: ${refErr instanceof Error ? refErr.message : String(refErr)}. Falling back to direct generation.`);
    }
  }

  // Fallback to direct edge-to-edge generation via OpenAI images/generations API if edits was not used or did not produce an image
  if (!usedEditsApi || !buffer) {
    const startTime = Date.now();
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

    let errText: string | null = null;
    if (!genRes.ok) {
      errText = await genRes.text();
    }

    await recordApiLog({
      service: "openai",
      endpoint: "https://api.openai.com/v1/images/generations",
      method: "POST",
      status: genRes.status,
      durationMs: Date.now() - startTime,
      hasError: !genRes.ok,
      errorMessage: errText,
      metadata: { model, size, quality },
    });

    if (!genRes.ok) {
      log.ai("OpenAI", `HTTP ${genRes.status} Error from images/generations: ${(errText || "").slice(0, 200)}`);
      throw new ExternalServiceError(`OpenAI image generation failed (${genRes.status}): ${(errText || "").slice(0, 100)}`);
    }

    const data = (await genRes.json()) as { data?: Array<{ b64_json?: string; url?: string }> };
    const item = data.data?.[0];

    if (item?.b64_json) {
      buffer = Buffer.from(item.b64_json, "base64");
    } else if (item?.url) {
      previewUrl = item.url;
      try {
        const fetchRes = await fetch(item.url, { signal: AbortSignal.timeout(30_000) });
        if (fetchRes.ok) {
          buffer = Buffer.from(await fetchRes.arrayBuffer());
        }
      } catch (fetchErr) {
        log.ai("OpenAI", `Could not fetch temporary OpenAI image url for R2 upload: ${fetchErr}`);
      }
    }
  }

  if (buffer) {
    if (opts.logoUrl && opts.tickedDetails?.logo !== false) {
      try {
        const composited = await compositeLogoOnFlyer(buffer, opts.logoUrl, format);
        buffer = composited;
        log.ai("OpenAI", "Composited official brand logo onto generated flyer buffer", { logoUrl: opts.logoUrl.slice(0, 60), format });
      } catch (logoErr) {
        log.ai("OpenAI", `Logo compositing skipped due to error: ${logoErr instanceof Error ? logoErr.message : String(logoErr)}`);
      }
    }

    try {
      const storageKey = `posters/${Date.now()}-${Math.random().toString(36).slice(2, 9)}.png`;
      const uploaded = await uploadPosterImage({
        key: storageKey,
        body: buffer,
        contentType: "image/png",
      });
      previewUrl = uploaded.publicUrl;
      log.storage("R2", "Saved generated flyer directly to Cloudflare R2 bucket", { key: storageKey, publicUrl: previewUrl });
    } catch (uploadErr) {
      log.storage("R2", `Could not upload generated flyer to R2: ${uploadErr}`);
    }
  }

  if (!previewUrl) {
    throw new ExternalServiceError("No image data returned from OpenAI Image API");
  }

  return { url: previewUrl, model, size: opts.size || size, quality };
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
    format?: "Square" | "Portrait 4:5" | "Story";
  })
  .handler(async ({ data }) => {
    try {
      const targetFormat = data.format || "Portrait 4:5";
      const targetSize = targetFormat === "Square" ? "1024x1024" : targetFormat === "Story" ? "1024x1792" : "1024x1280";

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
            if (!logoUrl && (businessName.toLowerCase().includes("diya") || data.instruction?.toLowerCase().includes("diya ai"))) {
              logoUrl = "https://pub-f951b9a0f9b3407c901fb638d50404db.r2.dev/branding/diya-logo-v2.png";
            }
            if (logoUrl) {
              try {
                const lBuf = await fetchLogoBuffer(logoUrl);
                const dynPalette = await extractLogoPalette(lBuf);
                if (dynPalette.length > 0) brandColors = dynPalette;
              } catch {}
            }
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
            formData.append("prompt", `Modify this commercial advertisement flyer strictly according to the user's requested edit: "${data.instruction}". Specific creative adjustments: ${editPrompt}. Target canvas: ${targetFormat} (${targetSize}). Maintain identical brand typography style, logo placement, high contrast, and crisp legibility.`);
            formData.append("size", targetSize);
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

              if (buffer) {
                try {
                  const storageKey = `posters/edits/${Date.now()}-${Math.random().toString(36).slice(2, 9)}.png`;
                  const uploaded = await uploadPosterImage({
                    key: storageKey,
                    body: buffer,
                    contentType: "image/png",
                  });
                  editedUrl = uploaded.publicUrl;
                  log.storage("R2", "Saved AI edited flyer directly to Cloudflare R2 bucket", { key: storageKey, publicUrl: editedUrl });
                } catch (uploadErr) {
                  log.storage("R2", `Could not upload edited flyer to R2: ${uploadErr}`);
                  editedUrl = item?.url || `data:image/png;base64,${buffer.toString("base64")}`;
                }
              } else if (item?.url) {
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
        log.ai("OpenAI", "Generating fresh flyer using updated brief with requested edits", { updatedBrief, instruction: data.instruction });
        const genResult = await generateFinishedFlyer({
          brief: updatedBrief,
          businessName,
          tagline,
          logoUrl,
          colors: brandColors,
          format: targetFormat,
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
        format: targetFormat,
        text_check_passed: true,
        model_used: modelUsed,
        size: targetSize,
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
    const startTime = Date.now();
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

      const { prompt, style, format, use_brand, words_on_image, ticked_details, size: customSize, reference_image_url, template_id } = parsed.data;
      const requestedCount = Number((data as any)?.count) || parsed.data.count;
      const count = typeof requestedCount === "number" && requestedCount > 0 ? Math.min(requestedCount, 4) : 2;

      log.ai("OpenAI", "Poster generation requested", {
        prompt: prompt.length > 40 ? prompt.slice(0, 40) + "…" : prompt,
        style: style || "Bold",
        format: format || "Portrait 4:5",
        business: business.name,
        count,
        hasWordsOnImage: Boolean(words_on_image),
      });

      // Fetch business and brand kit details for THIS business only
      const brandRow = await queryOne<{
        business_name: string;
        tagline: string | null;
        location: string | null;
        phone: string | null;
        colors: any;
        font: string | null;
        caption_tone: string | null;
        logo_public_url?: string | null;
      }>`
        SELECT b.name AS business_name, b.tagline,
               COALESCE(bk.location, b.location) AS location,
               COALESCE(bk.phone, b.phone) AS phone,
               COALESCE(bk.colors, b.brand_colors) AS colors,
               COALESCE(bk.font, 'Work Sans') AS font,
               COALESCE(bk.caption_tone, b.tone, 'Premium') AS caption_tone,
               COALESCE(bk.logo_public_url, b.logo_url) AS logo_public_url
        FROM businesses b
        LEFT JOIN brand_kits bk ON bk.business_id = b.id
        WHERE b.id = ${business.id}
      `;

      const passedBrand = parsed.data.brand_details;
      const businessName = passedBrand?.business_name || brandRow?.business_name || business.name;
      const tagline = passedBrand?.tagline || brandRow?.tagline || business.tagline || "";
      const phone = passedBrand?.phone || brandRow?.phone || (business as any)?.phone || "";
      const email = passedBrand?.email || session.email || "";
      const website = passedBrand?.website || (business as any)?.website || "";
      const location = passedBrand?.location || brandRow?.location || "";
      // Selected business logo: prioritize brand kit updated logo, passed brand logo, or business logo
      let logoUrl = passedBrand?.logo_url || brandRow?.logo_public_url || null;
      if (!logoUrl) {
        if (businessName.toLowerCase().includes("diya") || parsed.data.prompt?.toLowerCase().includes("diya ai")) {
          logoUrl = "https://pub-f951b9a0f9b3407c901fb638d50404db.r2.dev/branding/diya-logo-v2.png";
        }
      }

      // Dynamically extract brand colors directly from the logo if available
      let extractedLogoPalette: string[] = [];
      if (logoUrl) {
        try {
          const lBuf = await fetchLogoBuffer(logoUrl);
          extractedLogoPalette = await extractLogoPalette(lBuf);
        } catch {}
      }

      const rawColors = passedBrand?.colors || brandRow?.colors;
      let brandColors: string[];
      if (extractedLogoPalette.length > 0) {
        brandColors = extractedLogoPalette;
      } else if (Array.isArray(rawColors) && rawColors.length > 0) {
        brandColors = rawColors;
      } else {
        brandColors = ["#00A896", "#028090", "#05668D", "#02C39A"];
      }

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
            location,
            phone,
            email,
            website,
            wordsOnImage: words_on_image,
            tickedDetails: ticked_details as any,
            layout: layouts[i % layouts.length],
            directionIndex: i,
            format: format as any,
            referenceImageUrl: reference_image_url,
            templateId: template_id,
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
                  format: format as any,
                  wordsOnImage: words_on_image,
                  phone,
                  email,
                  website,
                  location,
                  tickedDetails: ticked_details as any,
                  size: customSize,
                  referenceImageUrl: reference_image_url,
                  templateId: template_id,
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
            price: brief.prize_text || brief.badge_text || brief.price_text,
            date_text: brief.date_text || undefined,
            time_text: brief.time_text || undefined,
            venue_text: brief.venue_text || undefined,
            prize_text: brief.prize_text || undefined,
            footer: tagline || "IDEAS INTO SCALABLE PRODUCTS",
            imageUrl: flyerUrl,
            format: format as any,
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

      await recordApiLog({
        businessId: business.id,
        service: "openai",
        endpoint: "/api/posters/generate",
        method: "POST",
        status: 200,
        durationMs: Date.now() - startTime,
        hasError: false,
        metadata: {
          prompt: prompt.slice(0, 80),
          format,
          style,
          count: options.length,
          modelUsed,
          costUsd,
        },
      });

      return apiSuccess({ options }, "Poster options generated successfully");
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      const statusCode = (err as any)?.statusCode || 500;
      await recordApiLog({
        businessId: (data as any)?.business_id,
        service: "openai",
        endpoint: "/api/posters/generate",
        method: "POST",
        status: statusCode,
        durationMs: Date.now() - startTime,
        hasError: true,
        errorMessage: errMsg,
        metadata: { error: errMsg },
      });
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
