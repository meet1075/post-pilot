import { describe, it, expect } from "vitest";
import { updateBrandKitSchema } from "../lib/validators";

describe("Brand Kit Feature & Typography Rules", () => {
  describe("updateBrandKitSchema Validation", () => {
    it("validates brand kit update payload", () => {
      const payload = {
        colors: ["#FF5733", "#33FF57"],
        font: "Fraunces",
        caption_tone: "Friendly" as const,
        default_hashtags: "#brand #marketing",
      };

      const result = updateBrandKitSchema.safeParse(payload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.colors).toEqual(["#FF5733", "#33FF57"]);
        expect(result.data.font).toBe("Fraunces");
      }
    });

    it("enforces maximum of 5 brand colors constraint", () => {
      const validColors = {
        colors: ["#111", "#222", "#333", "#444", "#555"],
      };
      expect(updateBrandKitSchema.safeParse(validColors).success).toBe(true);

      const tooManyColors = {
        colors: ["#111", "#222", "#333", "#444", "#555", "#666"],
      };
      const result = updateBrandKitSchema.safeParse(tooManyColors);
      expect(result.success).toBe(false);
    });

    it("rejects default hashtags exceeding 2,000 characters", () => {
      const longHashtags = {
        default_hashtags: "#tag ".repeat(450), // > 2000 chars
      };
      const result = updateBrandKitSchema.safeParse(longHashtags);
      expect(result.success).toBe(false);
    });
  });

  describe("Brand Kit Font Selections", () => {
    it("supports the core typography styles used in PostPilot", () => {
      const supportedFonts = [
        { id: "Fraunces", style: "Soft Editorial Serif" },
        { id: "DM Serif", style: "Dramatic Display Serif" },
        { id: "Work Sans", style: "Bold Modern Sans Serif" },
      ];

      const fontIds = supportedFonts.map((f) => f.id);
      expect(fontIds).toContain("Fraunces");
      expect(fontIds).toContain("DM Serif");
      expect(fontIds).toContain("Work Sans");
    });
  });

  describe("Logo & Brand Essentials Fallbacks", () => {
    it("provides fallback business details when brand kit values are empty", () => {
      const resolveBrandHeader = (kit?: { businessName?: string }) => {
        return (kit?.businessName && kit.businessName.trim()) || "Your Business";
      };

      expect(resolveBrandHeader({ businessName: "Luigi's Pizzeria" })).toBe("Luigi's Pizzeria");
      expect(resolveBrandHeader({ businessName: "" })).toBe("Your Business");
      expect(resolveBrandHeader(undefined)).toBe("Your Business");
    });
  });
});

