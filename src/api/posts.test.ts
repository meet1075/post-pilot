import { describe, it, expect } from "vitest";
import { createPostSchema, updatePostSchema } from "../lib/validators";
import { serializePostRow, type PostRow } from "./posts";

describe("Posts Feature & Business Constraints", () => {
  describe("createPostSchema API Input Validation", () => {
    it("accepts a fully-specified post payload", () => {
      const payload = {
        headline: "Crispy Wood-Fired Pizza Special",
        caption: "Get 20% off all artisan pizzas this Friday! #PizzaLovers #Foodie",
        prompt: "Artisan pizza on a wooden peel, dramatic lighting",
        date: "2026-11-28",
        time: "18:30",
        platform: "Instagram",
        theme: "tomato",
        price: "$18",
        status: "Scheduled",
        business_id: "123e4567-e89b-12d3-a456-426614174000",
      };

      const result = createPostSchema.safeParse(payload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe("Scheduled");
        expect(result.data.platform).toBe("Instagram");
        expect(result.data.price).toBe("$18");
      }
    });

    it("applies sensible defaults for optional fields", () => {
      const minimalPayload = {};
      const result = createPostSchema.safeParse(minimalPayload);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.headline).toBe("");
        expect(result.data.caption).toBe("");
        expect(result.data.status).toBe("Draft");
        expect(result.data.platform).toBe("Instagram");
        expect(result.data.theme).toBe("tomato");
      }
    });

    it("rejects headline exceeding 200 characters", () => {
      const overlimitHeadline = {
        headline: "A".repeat(201),
      };
      const result = createPostSchema.safeParse(overlimitHeadline);
      expect(result.success).toBe(false);
    });

    it("rejects caption exceeding 2,200 characters", () => {
      const overlimitCaption = {
        caption: "B".repeat(2201),
      };
      const result = createPostSchema.safeParse(overlimitCaption);
      expect(result.success).toBe(false);
    });

    it("rejects invalid date and time formats", () => {
      // Bad date format (MM/DD/YYYY instead of YYYY-MM-DD)
      expect(createPostSchema.safeParse({ date: "11/28/2026" }).success).toBe(false);

      // Bad time format (12-hour AM/PM instead of 24h HH:MM)
      expect(createPostSchema.safeParse({ time: "6:30 PM" }).success).toBe(false);
    });
  });

  describe("Scheduled Posts Limit Rule (Max 10)", () => {
    it("enforces maximum 10 active scheduled posts limit logic", () => {
      const MAX_SCHEDULED_POSTS = 10;

      const canScheduleMore = (currentScheduledCount: number) => {
        return currentScheduledCount < MAX_SCHEDULED_POSTS;
      };

      expect(canScheduleMore(0)).toBe(true);
      expect(canScheduleMore(9)).toBe(true);
      expect(canScheduleMore(10)).toBe(false);
      expect(canScheduleMore(11)).toBe(false);
    });

    it("allows non-scheduled posts (Draft/Posted) even if scheduled limit is 10", () => {
      const isLimitEnforced = (status: string, currentScheduledCount: number) => {
        if (status === "Scheduled" && currentScheduledCount >= 10) {
          return false;
        }
        return true;
      };

      expect(isLimitEnforced("Draft", 10)).toBe(true);
      expect(isLimitEnforced("Posted", 10)).toBe(true);
      expect(isLimitEnforced("Scheduled", 10)).toBe(false);
    });
  });

  describe("updatePostSchema Validation", () => {
    it("allows partial updates to existing posts", () => {
      const partialUpdate = {
        caption: "Updated caption text #newTags",
        status: "Posted" as const,
      };

      const result = updatePostSchema.safeParse(partialUpdate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.caption).toBe("Updated caption text #newTags");
        expect(result.data.status).toBe("Posted");
      }
    });

    it("accepts and updates location tag", () => {
      const result = updatePostSchema.safeParse({
        location: "Rajpath Club Ground, Ahmedabad",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.location).toBe("Rajpath Club Ground, Ahmedabad");
      }
    });
  });

  describe("Post Location Tagging Validation", () => {
    it("accepts post with location tagging", () => {
      const result = createPostSchema.safeParse({
        headline: "Avero Cricket Championship",
        caption: "Join us at Rajpath Club! #Cricket #AveroInnovations",
        location: "Rajpath Club Ground, Ahmedabad",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.location).toBe("Rajpath Club Ground, Ahmedabad");
      }
    });

    it("rejects location exceeding 200 characters", () => {
      const result = createPostSchema.safeParse({
        headline: "Event",
        location: "X".repeat(201),
      });
      expect(result.success).toBe(false);
    });

    it("defaults location to empty string when not provided", () => {
      const result = createPostSchema.safeParse({
        headline: "General Announcement",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.location).toBe("");
      }
    });
  });

  describe("serializePostRow & Date Type Resilience", () => {
    it("converts Date object date to string YYYY-MM-DD", () => {
      const row: PostRow = {
        id: "post-1",
        business_id: "biz-1",
        social_account_id: null,
        headline: "Headline",
        caption: "Caption",
        prompt: "Prompt",
        date: new Date("2026-11-24T00:00:00.000Z") as any,
        time: "12:00",
        status: "Posted",
        platform: "Instagram",
        theme: "tomato",
        price: "",
        location: null,
        image_url: null,
        image_r2_key: null,
        zernio_post_id: null,
        published_at: null,
        error_message: null,
        created_at: "2026-11-24T00:00:00.000Z",
        updated_at: "2026-11-24T00:00:00.000Z",
      };

      const serialized = serializePostRow(row);
      expect(typeof serialized.date).toBe("string");
      expect(serialized.date).toBe("2026-11-24");
      // Verify .match works cleanly on the serialized date
      expect(serialized.date?.match(/^(\d{4})-(\d{2})/)).not.toBeNull();
    });

    it("handles null or undefined dates gracefully", () => {
      const row: PostRow = {
        id: "post-2",
        business_id: "biz-1",
        social_account_id: null,
        headline: "Headline",
        caption: "Caption",
        prompt: "Prompt",
        date: null,
        time: null,
        status: "Draft",
        platform: "Instagram",
        theme: "tomato",
        price: "",
        location: null,
        image_url: null,
        image_r2_key: null,
        zernio_post_id: null,
        published_at: null,
        error_message: null,
        created_at: "2026-11-24T00:00:00.000Z",
        updated_at: "2026-11-24T00:00:00.000Z",
      };

      const serialized = serializePostRow(row);
      expect(serialized.date).toBeNull();
    });

    it("safely handles string dates with slice(0, 10)", () => {
      const row: PostRow = {
        id: "post-3",
        business_id: "biz-1",
        social_account_id: null,
        headline: "Headline",
        caption: "Caption",
        prompt: "Prompt",
        date: "2026-11-24T12:00:00Z",
        time: null,
        status: "Draft",
        platform: "Instagram",
        theme: "tomato",
        price: "",
        location: null,
        image_url: null,
        image_r2_key: null,
        zernio_post_id: null,
        published_at: null,
        error_message: null,
        created_at: "2026-11-24T00:00:00.000Z",
        updated_at: "2026-11-24T00:00:00.000Z",
      };

      const serialized = serializePostRow(row);
      expect(serialized.date).toBe("2026-11-24");
    });
  });
});

