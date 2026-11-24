import { describe, it, expect } from "vitest";
import { publishPostSchema } from "../lib/validators";

describe("Publish & Schedule Feature", () => {
  const validPostId = "123e4567-e89b-12d3-a456-426614174000";

  describe("publishPostSchema Validation", () => {
    it("validates immediate publish payload", () => {
      const immediatePayload = {
        post_id: validPostId,
        platforms: ["Instagram", "Facebook"],
        timing: "now",
      };

      const result = publishPostSchema.safeParse(immediatePayload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.timing).toBe("now");
        expect(result.data.platforms).toEqual(["Instagram", "Facebook"]);
      }
    });

    it("validates scheduled publish payload with future date and time", () => {
      const scheduledPayload = {
        post_id: validPostId,
        platforms: ["Instagram"],
        timing: "schedule",
        scheduled_date: "2026-12-01",
        scheduled_time: "14:00",
      };

      const result = publishPostSchema.safeParse(scheduledPayload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.timing).toBe("schedule");
        expect(result.data.scheduled_date).toBe("2026-12-01");
        expect(result.data.scheduled_time).toBe("14:00");
      }
    });

    it("rejects invalid post_id that is not a UUID", () => {
      const badIdPayload = {
        post_id: "invalid-id-123",
        timing: "now",
      };

      const result = publishPostSchema.safeParse(badIdPayload);
      expect(result.success).toBe(false);
    });

    it("rejects unknown timing options", () => {
      const badTimingPayload = {
        post_id: validPostId,
        timing: "later",
      };

      const result = publishPostSchema.safeParse(badTimingPayload);
      expect(result.success).toBe(false);
    });
  });

  describe("Future Scheduling Constraints", () => {
    it("detects whether a scheduled time is in the future", () => {
      const validateFutureDate = (dateStr: string, timeStr: string) => {
        const scheduledAt = new Date(`${dateStr}T${timeStr}:00`);
        return scheduledAt.getTime() > Date.now();
      };

      // Past date
      expect(validateFutureDate("2020-01-01", "12:00")).toBe(false);

      // Distant future date
      expect(validateFutureDate("2030-12-31", "23:59")).toBe(true);
    });

    it("requires both date and time when scheduling", () => {
      const checkScheduleRequirements = (timing: string, date?: string, time?: string) => {
        if (timing === "schedule") {
          return Boolean(date && time);
        }
        return true;
      };

      expect(checkScheduleRequirements("now")).toBe(true);
      expect(checkScheduleRequirements("schedule", "2026-12-01", "12:00")).toBe(true);
      expect(checkScheduleRequirements("schedule", "2026-12-01", undefined)).toBe(false);
      expect(checkScheduleRequirements("schedule", undefined, "12:00")).toBe(false);
    });
  });

  describe("Zernio Cancel & Reschedule Operations", () => {
    it("simulates Zernio post cancellation when ZERNIO_API_KEY is not configured", async () => {
      const { callZernioCancel } = await import("./publish.js");
      const result = await callZernioCancel({
        zernioPostId: "zernio_post_123",
        businessId: "biz-1",
      });
      expect(result).toBe(true);
    });

    it("simulates Zernio post rescheduling when ZERNIO_API_KEY is not configured", async () => {
      const { callZernioReschedule } = await import("./publish.js");
      const result = await callZernioReschedule({
        zernioPostId: "zernio_post_123",
        scheduledAtIso: "2026-12-01T14:00:00.000Z",
        businessId: "biz-1",
      });
      expect(result).toBe(true);
    });
  });
});

