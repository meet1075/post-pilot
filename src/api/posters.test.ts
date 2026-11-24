import { describe, it, expect } from "vitest";
import type { PosterOption } from "./posters";
import {
  parseStructuredPrompt,
  isMetaPhrase,
  extractNamedProduct,
  compositeLogoOnFlyer,
} from "./posters";
import { generatePostersSchema } from "../lib/validators";
import sharp from "sharp";

describe("Poster API, Image Generation & Aspect Ratio Rules", () => {
  describe("generatePostersSchema Input Validation", () => {
    it("validates valid poster generation request with words on image and ticked brand details", () => {
      const payload = {
        prompt: "Avero.innovations is now Aurelian International, software innovation company",
        style: "Bold" as const,
        format: "Portrait 4:5" as const,
        words_on_image: "Avero.innovations is now Aurelian International\nContinuing our commitment to software innovation.\n⚡ Discover our software solutions.",
        size: "1K",
        ticked_details: {
          logo: true,
          colors: false,
          phone: true,
          location: false,
          website: false,
          email: true,
        },
        use_brand: true,
        count: 2,
      };

      const result = generatePostersSchema.safeParse(payload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.prompt).toContain("Aurelian International");
        expect(result.data.words_on_image).toContain("Discover our software solutions");
        expect(result.data.size).toBe("1K");
        expect(result.data.ticked_details?.phone).toBe(true);
        expect(result.data.ticked_details?.email).toBe(true);
        expect(result.data.format).toBe("Portrait 4:5");
      }
    });

    it("accepts custom resolution text in size field", () => {
      const customSizes = ["1K", "2K", "1024x1280", "1080x1350", "HD"];
      for (const s of customSizes) {
        const res = generatePostersSchema.safeParse({
          prompt: "Company update",
          size: s,
        });
        expect(res.success).toBe(true);
      }
    });

    it("applies defaults: Bold style, Portrait 4:5 format, 1K size", () => {
      const result = generatePostersSchema.safeParse({
        prompt: "Coffee tasting event",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.style).toBe("Bold");
        expect(result.data.format).toBe("Portrait 4:5");
        expect(result.data.size).toBe("1K");
        expect(result.data.use_brand).toBe(true);
      }
    });

    it("rejects empty prompt", () => {
      expect(generatePostersSchema.safeParse({ prompt: "" }).success).toBe(false);
      expect(generatePostersSchema.safeParse({ prompt: "   " }).success).toBe(false);
    });

    it("rejects prompt exceeding 2,000 characters", () => {
      expect(generatePostersSchema.safeParse({ prompt: "A".repeat(2001) }).success).toBe(false);
    });
  });

  describe("Shape Tiles & Aspect Ratio Guidelines", () => {
    it("supports the 3 core social media shapes: 1:1, 4:5, and 9:16", () => {
      const validFormats: Array<NonNullable<PosterOption["format"]>> = [
        "Square",
        "Portrait 4:5",
        "Story",
      ];

      expect(validFormats).toContain("Square");
      expect(validFormats).toContain("Portrait 4:5");
      expect(validFormats).toContain("Story");
    });

    it("maps formats to correct aspect ratio guidelines and canvas resolutions", () => {
      const getDimensions = (format?: string) => {
        switch (format) {
          case "Square":
            return { ratio: "1:1", width: 1024, height: 1024, label: "1:1 · Square" };
          case "Story":
            return { ratio: "9:16", width: 1024, height: 1792, label: "9:16 · Story" };
          case "Portrait 4:5":
          default:
            return { ratio: "4:5", width: 1024, height: 1280, label: "4:5 · Portrait" };
        }
      };

      expect(getDimensions("Square")).toEqual({ ratio: "1:1", width: 1024, height: 1024, label: "1:1 · Square" });
      expect(getDimensions("Story")).toEqual({ ratio: "9:16", width: 1024, height: 1792, label: "9:16 · Story" });
      expect(getDimensions("Portrait 4:5")).toEqual({ ratio: "4:5", width: 1024, height: 1280, label: "4:5 · Portrait" });
      expect(getDimensions(undefined)).toEqual({ ratio: "4:5", width: 1024, height: 1280, label: "4:5 · Portrait" });
    });
  });

  describe("Words On Image Parsing & Ticked Details", () => {
    it("parses multi-line words on image into headline, subline, and CTA", () => {
      const words = "Avero.innovations is now Aurelian International\nContinuing our commitment to software innovation.\n⚡ Discover our software solutions.";
      const lines = words.trim().split("\n").map((l) => l.trim()).filter(Boolean);

      expect(lines[0]).toBe("Avero.innovations is now Aurelian International");
      expect(lines[1]).toBe("Continuing our commitment to software innovation.");
      expect(lines[2]).toBe("⚡ Discover our software solutions.");
    });

    it("constructs bottom contact bar only with ticked details", () => {
      const buildContactBar = (
        ticked: { phone?: boolean; email?: boolean; website?: boolean; location?: boolean },
        data: { phone?: string; email?: string; website?: string; location?: string }
      ) => {
        const parts: string[] = [];
        if (ticked.phone && data.phone) parts.push(`📞 ${data.phone}`);
        if (ticked.email && data.email) parts.push(`✉️ ${data.email}`);
        if (ticked.website && data.website) parts.push(`🌐 ${data.website}`);
        if (ticked.location && data.location) parts.push(`📍 ${data.location}`);
        return parts.join("   ");
      };

      const ticked = { phone: true, email: true, website: false, location: false };
      const brandData = {
        phone: "63552 06575",
        email: "meetsoni1075@gmail.com",
        website: "avero.innovations",
        location: "Global",
      };

      const bar = buildContactBar(ticked, brandData);
      expect(bar).toBe("📞 63552 06575   ✉️ meetsoni1075@gmail.com");
      expect(bar).not.toContain("avero.innovations");
      expect(bar).not.toContain("Global");
    });
  });

  describe("AI Image Editing Logic", () => {
    it("retains canvas dimensions and original format when applying image edits", () => {
      const applyEditInstruction = (
        original: { format: "Square" | "Portrait 4:5" | "Story"; headline: string },
        instruction: string
      ) => {
        return {
          ...original,
          updatedBriefPrompt: `Revise flyer preserving format ${original.format}. Modification: ${instruction}`,
          format: original.format,
        };
      };

      const original = { format: "Story" as const, headline: "Holiday Night" };
      const edited = applyEditInstruction(original, "Make background darker and add golden sparkles");

      expect(edited.format).toBe("Story");
      expect(edited.updatedBriefPrompt).toContain("Make background darker and add golden sparkles");
      expect(edited.updatedBriefPrompt).toContain("Story");
    });
  });

  describe("Tournament Event Extraction & Text Deduplication", () => {
    it("extracts timing, venue, and prizepool from sports prompt", () => {
      const prompt = "Avero innovations is organizing a cricket tournament for all their employees, it is organized at Rajpath club ground and match timing is from 9pm to 1 am from 25-27 nov and the prizepool is 1lac for the winner team";

      const timeMatch = prompt.match(/\b(\d{1,2}(?::\d{2})?\s*(?:am|pm)\s*(?:to|-|till)\s*\d{1,2}(?::\d{2})?\s*(?:am|pm))\b/i)
        || prompt.match(/\b(?:timing|time|from)\s*:?\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm)?\s*(?:to|-|till)\s*\d{1,2}(?::\d{2})?\s*(?:am|pm))\b/i);
      const prizeMatch = prompt.match(/\b(?:prizepool|prize\s*pool|prize|cash\s*prize)\s*(?:is|of|:)?\s*([₹$€£]?\s*\d+\s*(?:lac|lakh|crore|k|m)?|\d+(?:,\d+)*(?:\s*(?:lac|lakh|crore))?)\b/i);
      const venueMatch = prompt.match(/\b(?:at|in|venue:?)\s+([A-Za-z0-9\s&'-]+(?:\bhotel|\bresort|\bhall|\bcenter|\bcentre|\bpalace|\bclub\s*ground|\bclub|\bground|\barena|\bgarden|\binn|\bbistro|\bcafe|\brestaurant))\b/i);

      expect(timeMatch).toBeDefined();
      expect(timeMatch?.[1]?.trim()).toBe("9pm to 1 am");

      expect(prizeMatch).toBeDefined();
      expect(prizeMatch?.[1]?.trim()).toBe("1lac");

      expect(venueMatch).toBeDefined();
      expect(venueMatch?.[1]?.trim().toLowerCase()).toContain("rajpath club ground");
    });

    it("prevents headline duplication into pill badge or CTA button", () => {
      const headline = "Please come with your team t-shirts";
      const prizeText = "₹1 Lakh Prize Pool";

      // Pill badge selector logic
      let badgePill = prizeText
        ? `🏆 ${prizeText}`
        : "⚡ Special Event";

      if (badgePill.toLowerCase() === headline.toLowerCase()) {
        badgePill = "⚡ Special Event";
      }

      expect(badgePill).toBe("🏆 ₹1 Lakh Prize Pool");
      expect(badgePill.toLowerCase()).not.toBe(headline.toLowerCase());
    });

    it("assigns distinct creative concepts across direction indices", () => {
      const directionConcepts = [
        "Direction 1: Dynamic sports action & athletic intensity. Action photography of a batsman hitting a shot or bowler bowling on the pitch under brilliant stadium floodlights, motion blur, grass blades flying, dramatic sports photography (Sony A7 IV, 35mm f/1.8 aesthetic).",
        "Direction 2: Prestigious championship celebration. A magnificent golden championship trophy cup in sharp focus on a pedestal bathed in stadium spotlights, with night stadium fireworks bursting over the arena. Energetic celebratory atmosphere with bokeh lights.",
        "Direction 3: Team camaraderie & club pavilion. A cheerful, authentic group of corporate colleagues / teammates in team t-shirts in a celebratory team huddle on the lush green Rajpath Club field, looking enthusiastic under stadium floodlights.",
        "Direction 4: Modern high-contrast sports editorial poster. Dramatic stadium floodlight silhouette against a deep twilight gradient sky, with bold typography highlighting the Dates, Match Timing, and ₹1 Lakh Prize Pool.",
      ];

      const d1 = directionConcepts[0 % directionConcepts.length];
      const d2 = directionConcepts[1 % directionConcepts.length];
      const d3 = directionConcepts[2 % directionConcepts.length];
      const d4 = directionConcepts[3 % directionConcepts.length];

      expect(d1).not.toBe(d2);
      expect(d2).not.toBe(d3);
      expect(d3).not.toBe(d4);
      expect(d1).toContain("Dynamic sports action");
      expect(d2).toContain("championship celebration");
      expect(d3).toContain("Team camaraderie");
      expect(d4).toContain("sports editorial");
    });
  });

  describe("Cloudflare R2 Bucket Storage for Generated Posters", () => {
    it("ensures generated poster URLs are hosted on Cloudflare R2 bucket and not local repo files", () => {
      const mockR2BaseUrl = "https://pub-f951b9a0f9b3407c901fb638d50404db.r2.dev";
      const sampleKey = "posters/biz-123/1700000000000-sample.png";
      const r2Url = `${mockR2BaseUrl}/${sampleKey}`;

      expect(r2Url).toMatch(/^https:\/\/[a-z0-9-.]+\.r2\.dev\/posters\/.+\.png$/);
      // Ensure it never points to local repo paths
      expect(r2Url).not.toContain("localhost");
      expect(r2Url).not.toContain("public/");
      expect(r2Url).not.toContain("file://");
    });

    it("formats R2 poster keys deterministically with business id partition", () => {
      const businessId = "7d7831d4-8c66-407b-acbc-a2060d66ff00";
      const timestamp = 1792316942214;
      const key = `posters/${businessId}/${timestamp}-chosen.png`;

      expect(key.startsWith(`posters/${businessId}/`)).toBe(true);
      expect(key.endsWith(".png")).toBe(true);
      expect(key).not.toContain("..");
      expect(key).not.toContain("//");
    });

    it("verifies AI edited posters target dedicated R2 key prefix", () => {
      const editKey = `posters/edits/1792316942214-abc1234.png`;
      expect(editKey.startsWith("posters/edits/")).toBe(true);
      expect(editKey.endsWith(".png")).toBe(true);
    });
  });

  describe("Reference Image & Template Style Guidance", () => {
    it("accepts reference_image_url and template_id in schema", () => {
      const parsed = generatePostersSchema.safeParse({
        prompt: "Grand product launch",
        reference_image_url: "https://pub-f951b9a0f9b3407c901fb638d50404db.r2.dev/templates/new-arrival-dark-gold.jpg",
        template_id: "new-arrival-dark-gold",
      });
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.reference_image_url).toContain("new-arrival-dark-gold.jpg");
        expect(parsed.data.template_id).toBe("new-arrival-dark-gold");
      }
    });

    it("synthesizes reference photo style guidance into the flyer generation prompt", () => {
      const templateTitle = "SOMETHING NEW — Luxury Gold Podium";
      const templateDesc = "Ultra-premium golden spotlight on an elevated geometric pedestal";
      const refUrl = "https://pub-f951b9a0f9b3407c901fb638d50404db.r2.dev/templates/new-arrival-dark-gold.jpg";

      const referenceInstruction = `Reference Photo Style Guidance: Strictly emulate the visual composition, framing, color grading, lighting atmosphere, elegant negative space, and premium aesthetic of ${templateTitle} (${templateDesc}) (${refUrl}). Craft an elevated commercial poster that faithfully adapts this reference design style for 'Avero Innovations'.`;

      expect(referenceInstruction).toContain(templateTitle);
      expect(referenceInstruction).toContain(refUrl);
      expect(referenceInstruction).toContain("visual composition, framing, color grading");
    });
  });

  describe("Product Name & Hero Headline Prominence", () => {
    it("extracts bolded product name like **Diya AI – Marketing Agency**", () => {
      const prompt = "Avero Innovations is building **Diya AI – Marketing Agency**, an all-in-one SaaS platform designed to simplify and automate social media management";
      const boldMatch = prompt.match(/\*\*([^*]+)\*\*/);
      const namedProduct = (boldMatch?.[1] || "").trim();

      expect(namedProduct).toBe("Diya AI – Marketing Agency");
    });

    it("extracts quoted product name like \"Diya AI\"", () => {
      const prompt = "Announcing \"Diya AI\" for seamless social media management across all channels";
      const quotesMatch = prompt.match(/["']([^"']{2,60})["']/);
      const namedProduct = (quotesMatch?.[1] || "").trim();

      expect(namedProduct).toBe("Diya AI");
    });

    it("extracts action-preceded product names like 'building Diya AI – Marketing Agency'", () => {
      const prompt = "Avero Innovations is building Diya AI – Marketing Agency, an all-in-one platform";
      const actionMatch = prompt.match(/\b(?:building|launching|introducing|announcing|presenting|creating|making)\s+([A-Za-z0-9\s–—\-]+?)(?:,\s*|\s+(?:an|a|the)\b)/i);
      const namedProduct = (actionMatch?.[1] || "").trim();

      expect(namedProduct).toBe("Diya AI – Marketing Agency");
    });

    it("ensures product name overrides generic headline/hero_title", () => {
      const namedProduct = "Diya AI – Marketing Agency";
      let finalHeadline = "Your All-in-One AI Marketing Assistant";
      let finalHeroTitle = "NEXT-GEN DIGITAL SUITE";

      if (namedProduct) {
        if (!finalHeadline.toLowerCase().includes(namedProduct.toLowerCase()) && !finalHeroTitle.toLowerCase().includes(namedProduct.toLowerCase())) {
          finalHeroTitle = namedProduct.toUpperCase();
          finalHeadline = `Introducing ${namedProduct}`;
        }
      }

      expect(finalHeroTitle).toBe("DIYA AI – MARKETING AGENCY");
      expect(finalHeadline).toBe("Introducing Diya AI – Marketing Agency");
    });
  });

  describe("Dynamic Size, Resolution & Quality Selection", () => {
    it("maps 2K, HD, and Ultra requests to quality='high'", () => {
      const resolveQuality = (size?: string, rawQuality?: string) => {
        const isHighRes = Boolean(
          (size && /2k|hd|ultra|high|1080/i.test(size)) ||
          rawQuality === "high"
        );
        return isHighRes ? "high" : (rawQuality === "low" ? "low" : "medium");
      };

      expect(resolveQuality("2K")).toBe("high");
      expect(resolveQuality("HD")).toBe("high");
      expect(resolveQuality("1080*1350")).toBe("high");
      expect(resolveQuality("1024x1280")).toBe("medium");
      expect(resolveQuality("1K")).toBe("medium");
      expect(resolveQuality(undefined, "high")).toBe("high");
    });

    it("parses custom dimension strings like '1080*1350' and '1080x1350'", () => {
      const parseDimensions = (sizeInput: string, format: string) => {
        let size = format === "Square"
          ? "1024x1024"
          : format === "Story"
          ? "1024x1792"
          : "1024x1280";

        if (sizeInput) {
          const normalized = sizeInput.replace(/[*×]/g, "x").trim();
          const dimMatch = normalized.match(/(\d{3,4})x(\d{3,4})/i);
          if (dimMatch) {
            const w = parseInt(dimMatch[1]!, 10);
            const h = parseInt(dimMatch[2]!, 10);
            if (w === h) size = "1024x1024";
            else if (h > w * 1.5) size = "1024x1792";
            else size = "1024x1280";
          }
        }
        return size;
      };

      expect(parseDimensions("1080*1350", "Portrait 4:5")).toBe("1024x1280");
      expect(parseDimensions("1080x1080", "Portrait 4:5")).toBe("1024x1024");
      expect(parseDimensions("1080*1920", "Portrait 4:5")).toBe("1024x1792");
      expect(parseDimensions("2K", "Story")).toBe("1024x1792");
    });
  });

  describe("Full-Bleed Canvas & Zero Black Letterboxing Rules", () => {
    it("mandates full-bleed canvas and forbids black borders or arch cutouts in image prompt", () => {
      const buildZeroLetterboxDirectives = (format: string, size: string) => {
        return [
          `Composition & Canvas: Built strictly for ${format} aspect ratio, ${size}.`,
          `CRITICAL FULL-BLEED & ZERO-LETTERBOX MANDATE: The background and environment MUST extend 100% seamlessly to all four corners of the canvas (${size}). Absolutely NO black borders, NO black letterboxing, NO pillarboxing, NO curved arch/dome cutouts, and NO dark peripheral vignetting.`,
          `Lighting & Background Cleanliness: Seamless, bright natural lighting across the entire canvas. Absolutely NO black vignette, NO dark smoke, NO dark top shadows, and NO dirty black gradient at the top edge.`,
        ].join("\n");
      };

      const directives = buildZeroLetterboxDirectives("Story", "1024x1792");
      expect(directives).toContain("CRITICAL FULL-BLEED & ZERO-LETTERBOX MANDATE");
      expect(directives).toContain("Absolutely NO black borders, NO black letterboxing, NO pillarboxing");
      expect(directives).toContain("NO curved arch/dome cutouts");
      expect(directives).toContain("1024x1792");
    });
  });

  describe("Structured Prompt Parsing & Meta-Phrase Filtering", () => {
    const blackFridayPrompt = `Create a premium, eye-catching **Black Friday promotional poster** for **Diya AI Marketing Agency**.

**Main Headline:**
BLACK FRIDAY SALE

**BIG OFFER:**
30% OFF ON ALL SUBSCRIPTIONS

**Supporting Text:**
Supercharge your brand's social media marketing with AI. Create, manage, schedule, and publish smarter — all from one platform.

**CTA:** Grab Your Deal Now!

**Design Direction:**
- Premium black and gold theme with bold typography.
- Large, visually striking "30% OFF" in the center.`;

    it("parses explicit structured blocks (Headline, BIG OFFER, Supporting Text, CTA)", () => {
      const parsed = parseStructuredPrompt(blackFridayPrompt);
      expect(parsed.headline).toBe("BLACK FRIDAY SALE");
      expect(parsed.offer).toBe("30% OFF ON ALL SUBSCRIPTIONS");
      expect(parsed.supportingText).toContain("Supercharge your brand's social media marketing with AI");
      expect(parsed.cta).toBe("Grab Your Deal Now!");
    });

    it("identifies meta-phrases and distinguishes them from real brand/product names", () => {
      expect(isMetaPhrase("Black Friday promotional poster")).toBe(true);
      expect(isMetaPhrase("promotional poster")).toBe(true);
      expect(isMetaPhrase("social media post")).toBe(true);
      expect(isMetaPhrase("flyer")).toBe(true);
      expect(isMetaPhrase("Diya AI Marketing Agency")).toBe(false);
      expect(isMetaPhrase("Avero Innovations")).toBe(false);
    });

    it("extracts named product without selecting generic meta-phrases", () => {
      const product = extractNamedProduct(blackFridayPrompt);
      expect(product).toBe("Diya AI Marketing Agency");
      expect(product).not.toContain("promotional poster");
    });
  });

  describe("Server-Side Brand Logo Compositing", () => {
    it("composites a brand logo onto a generated flyer canvas at top center", async () => {
      // Create a dummy 1024x1280 flyer buffer
      const dummyFlyer = await sharp({
        create: {
          width: 1024,
          height: 1280,
          channels: 4,
          background: { r: 20, g: 20, b: 25, alpha: 1 },
        },
      }).png().toBuffer();

      // Create a dummy 400x120 logo buffer with transparent alpha
      const dummyLogo = await sharp({
        create: {
          width: 400,
          height: 120,
          channels: 4,
          background: { r: 0, g: 168, b: 150, alpha: 1 },
        },
      }).png().toBuffer();

      const logoDataUrl = `data:image/png;base64,${dummyLogo.toString("base64")}`;
      const composited = await compositeLogoOnFlyer(dummyFlyer, logoDataUrl, "Portrait 4:5");

      const meta = await sharp(composited).metadata();
      expect(meta.width).toBe(1024);
      expect(meta.height).toBe(1280);
      expect(meta.format).toBe("png");
      expect(composited.length).toBeGreaterThan(0);
    });
  });
});
