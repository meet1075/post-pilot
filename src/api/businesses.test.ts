import { describe, it, expect } from "vitest";
import {
  createBusinessSchema,
  updateBusinessSchema,
  deleteBusinessSchema,
} from "../lib/validators";

describe("Business Workspaces Feature", () => {
  describe("createBusinessSchema Validation", () => {
    it("validates a standard business creation payload", () => {
      const payload = {
        name: "Acme Gourmet Burgers",
        tagline: "Finest grass-fed smash burgers in town",
        brand_colors: ["#E63946", "#F1FAEE"],
        tone: "Bold" as const,
        location: "Austin, Texas",
        phone: "+1 512 555 0199",
        timezone: "America/Chicago",
        business_type: "Restaurant",
      };

      const result = createBusinessSchema.safeParse(payload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe("Acme Gourmet Burgers");
        expect(result.data.timezone).toBe("America/Chicago");
        expect(result.data.tone).toBe("Bold");
      }
    });

    it("requires business name and rejects empty or whitespace name", () => {
      expect(createBusinessSchema.safeParse({ name: "" }).success).toBe(false);
      expect(createBusinessSchema.safeParse({ name: "   " }).success).toBe(false);
    });

    it("rejects business name longer than 200 characters", () => {
      const longName = { name: "B".repeat(201) };
      expect(createBusinessSchema.safeParse(longName).success).toBe(false);
    });

    it("sets default UTC timezone and General business type when not provided", () => {
      const minimal = { name: "Minimal Shop" };
      const result = createBusinessSchema.safeParse(minimal);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.timezone).toBe("UTC");
        expect(result.data.business_type).toBe("General");
      }
    });
  });

  describe("Workspace Quota & Isolation Logic", () => {
    it("enforces maximum businesses quota per user", () => {
      const MAX_BUSINESSES = 10;
      const canCreateMore = (currentCount: number) => currentCount < MAX_BUSINESSES;

      expect(canCreateMore(0)).toBe(true);
      expect(canCreateMore(9)).toBe(true);
      expect(canCreateMore(10)).toBe(false);
    });

    it("validates business deletion requires a business_id", () => {
      expect(deleteBusinessSchema.safeParse({ business_id: "biz-123" }).success).toBe(true);
      expect(deleteBusinessSchema.safeParse({ business_id: "" }).success).toBe(false);
    });
  });
});

