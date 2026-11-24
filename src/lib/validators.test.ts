import { describe, it, expect } from "vitest";
import {
  createPostSchema,
  updatePostSchema,
  createBusinessSchema,
  generatePostersSchema,
  uuidSchema,
  REGEX,
} from "./validators";

describe("Validation Schemas & Production Constraints", () => {
  describe("UUID Validation", () => {
    it("accepts valid UUIDs", () => {
      const validUuid = "123e4567-e89b-12d3-a456-426614174000";
      expect(uuidSchema.safeParse(validUuid).success).toBe(true);
    });

    it("rejects non-UUID strings", () => {
      expect(uuidSchema.safeParse("not-a-uuid").success).toBe(false);
      expect(uuidSchema.safeParse("").success).toBe(false);
    });
  });

  describe("createPostSchema", () => {
    it("validates a complete post payload", () => {
      const validPost = {
        headline: "Special Friday Night Deal",
        caption: "Enjoy fresh cocktails and live music tonight! #FridayVibes",
        prompt: "Friday night music and cocktails",
        date: "2026-11-25",
        time: "19:00",
        status: "Scheduled",
        platform: "Instagram",
        theme: "Tomato",
        price: "$25",
      };

      const result = createPostSchema.safeParse(validPost);
      expect(result.success).toBe(true);
    });

    it("enforces valid date (YYYY-MM-DD) format", () => {
      const invalidDate = {
        headline: "Test",
        date: "25-11-2026", // Invalid order
      };
      const result = createPostSchema.safeParse(invalidDate);
      expect(result.success).toBe(false);
    });

    it("enforces valid time (HH:MM) format", () => {
      const invalidTime = {
        headline: "Test",
        time: "25:70", // Invalid hour/min
      };
      const result = createPostSchema.safeParse(invalidTime);
      expect(result.success).toBe(false);
    });

    it("rejects captions exceeding 2,200 characters", () => {
      const longCaption = {
        headline: "Test",
        caption: "a".repeat(2201),
      };
      const result = createPostSchema.safeParse(longCaption);
      expect(result.success).toBe(false);
    });
  });

  describe("createBusinessSchema", () => {
    it("validates a business with defaults", () => {
      const validBiz = {
        name: "My Local Coffee",
        website: "https://mylocalcoffee.com",
        email: "hello@mylocalcoffee.com",
      };
      const result = createBusinessSchema.safeParse(validBiz);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.tone).toBe("Friendly");
        expect(result.data.business_type).toBe("General");
        expect(result.data.website).toBe("https://mylocalcoffee.com");
        expect(result.data.email).toBe("hello@mylocalcoffee.com");
      }
    });

    it("requires business name", () => {
      const invalidBiz = { name: "" };
      const result = createBusinessSchema.safeParse(invalidBiz);
      expect(result.success).toBe(false);
    });

    it("rejects phone numbers with invalid characters", () => {
      expect(REGEX.phone.test("+1 (555) 123-4567")).toBe(true);
      expect(REGEX.phone.test("abc-not-a-phone")).toBe(false);
    });

    it("validates generatePostersSchema with brand_details and ticked_details", () => {
      const valid = generatePostersSchema.safeParse({
        prompt: "Avero cricket tournament",
        style: "Bold",
        format: "Story",
        words_on_image: "Please come with your team t-shirts",
        size: "1K",
        reference_image_url: "https://example.com/reference-style.jpg",
        template_id: "cricket-tournament-championship",
        ticked_details: {
          logo: true,
          phone: true,
          email: true,
          website: true,
          location: true,
        },
        brand_details: {
          business_name: "Avero Innovations",
          phone: "6355206575",
          email: "averoinnovations@gmail.com",
          website: "https://averoinnovations.com/",
          location: "Ahmedabad",
        },
      });

      expect(valid.success).toBe(true);
      if (valid.success) {
        expect(valid.data.format).toBe("Story");
        expect(valid.data.reference_image_url).toBe("https://example.com/reference-style.jpg");
        expect(valid.data.template_id).toBe("cricket-tournament-championship");
        expect(valid.data.brand_details?.email).toBe("averoinnovations@gmail.com");
        expect(valid.data.brand_details?.website).toBe("https://averoinnovations.com/");
      }
    });

    it("accepts arbitrary social aspect ratios such as 16:9, 3:4, and 21:9", () => {
      const widescreen = generatePostersSchema.safeParse({
        prompt: "Cinematic product reveal banner",
        format: "16:9",
        aspect_ratio: "16:9",
      });
      expect(widescreen.success).toBe(true);

      const tallEditorial = generatePostersSchema.safeParse({
        prompt: "Pinterest editorial poster",
        format: "3:4",
        aspect_ratio: "3:4",
      });
      expect(tallEditorial.success).toBe(true);
    });
  });
});

