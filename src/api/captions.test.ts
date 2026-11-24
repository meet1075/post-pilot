import { describe, it, expect } from "vitest";
import { suggestCaptionsSchema } from "../lib/validators";

describe("Caption Suggestions Feature", () => {
  describe("suggestCaptionsSchema Input Validation", () => {
    it("validates request with headline and price", () => {
      const payload = {
        headline: "Sunday Brunch Special",
        offer: "Bottomless Mimosas",
        price: "$30",
        platform: "Instagram",
        tone: "Friendly",
      };

      const result = suggestCaptionsSchema.safeParse(payload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.headline).toBe("Sunday Brunch Special");
        expect(result.data.price).toBe("$30");
        expect(result.data.tone).toBe("Friendly");
      }
    });

    it("applies default tone and platform when omitted", () => {
      const minimalPayload = {
        headline: "Grand Opening",
      };

      const result = suggestCaptionsSchema.safeParse(minimalPayload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.tone).toBe("Friendly");
        expect(result.data.platform).toBe("Instagram");
      }
    });

    it("accepts all supported tone variations", () => {
      const tones = [
        "Friendly",
        "Professional",
        "Premium",
        "Playful",
        "Direct",
        "Bold",
        "Casual",
        "Luxury",
      ];

      for (const tone of tones) {
        const res = suggestCaptionsSchema.safeParse({ tone });
        expect(res.success).toBe(true);
      }

      // Reject unsupported tone
      expect(suggestCaptionsSchema.safeParse({ tone: "Sarcastic" }).success).toBe(false);
    });
  });

  describe("Hashtag & Caption Formatting Logic", () => {
    it("formats caption with appended hashtags cleanly", () => {
      const formatCaptionWithTags = (caption: string, tags?: string) => {
        if (!tags || !tags.trim()) return caption.trim();
        return `${caption.trim()}\n\n${tags.trim()}`;
      };

      const caption = "Freshly brewed espresso to start your morning right.";
      const tags = "#CoffeeLovers #MorningFuel #Espresso";

      const formatted = formatCaptionWithTags(caption, tags);
      expect(formatted).toBe(
        "Freshly brewed espresso to start your morning right.\n\n#CoffeeLovers #MorningFuel #Espresso"
      );
    });

    it("parses JSON response from AI model safely", () => {
      const parseModelOutput = (rawOutput: string) => {
        try {
          const parsed = JSON.parse(rawOutput.trim());
          if (parsed && typeof parsed.caption === "string") {
            const tags = parsed.hashtags || "";
            return tags ? `${parsed.caption}\n\n${tags}` : parsed.caption;
          }
        } catch {
          // fallback to raw text if not JSON
        }
        return rawOutput.trim();
      };

      const jsonOutput = JSON.stringify({
        caption: "Join us for trivia night this Tuesday!",
        hashtags: "#Trivia #TuesdayFun",
      });

      expect(parseModelOutput(jsonOutput)).toBe(
        "Join us for trivia night this Tuesday!\n\n#Trivia #TuesdayFun"
      );

      const plainText = "Simple plain text caption without JSON";
      expect(parseModelOutput(plainText)).toBe("Simple plain text caption without JSON");
    });
  });
});

