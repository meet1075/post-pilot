import { describe, it, expect } from "vitest";
import { connectAccountSchema, platformSchema } from "../lib/validators";

describe("Connected Accounts & Social Connections Feature", () => {
  describe("connectAccountSchema Validation", () => {
    it("validates successful account connection payload", () => {
      const payload = {
        platform: "Instagram" as const,
        zernio_account_id: "acc_zernio_987654",
        platform_handle: "avero_official",
        platform_user_id: "meta_user_456",
        business_id: "123e4567-e89b-12d3-a456-426614174000",
      };

      const result = connectAccountSchema.safeParse(payload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.platform).toBe("Instagram");
        expect(result.data.platform_handle).toBe("avero_official");
      }
    });

    it("accepts valid platforms: Instagram, Facebook, X", () => {
      expect(platformSchema.safeParse("Instagram").success).toBe(true);
      expect(platformSchema.safeParse("Facebook").success).toBe(true);
      expect(platformSchema.safeParse("X").success).toBe(true);
      expect(platformSchema.safeParse("TikTok").success).toBe(false);
      expect(platformSchema.safeParse("LinkedIn").success).toBe(false);
    });

    it("rejects invalid social handle formats", () => {
      // Handles cannot have spaces or special symbols like @ or !
      const badHandle = {
        platform: "Instagram" as const,
        zernio_account_id: "acc-1",
        platform_handle: "bad handle with spaces",
      };
      expect(connectAccountSchema.safeParse(badHandle).success).toBe(false);
    });
  });

  describe("Billing Limits & Free Tier Rules", () => {
    it("calculates free tier allowance and additional billing correctly", () => {
      const calculateAccountBilling = (connectedCount: number) => {
        const FREE_TIER_LIMIT = 2;
        const COST_PER_EXTRA_ACCOUNT = 6;

        const isFreeTier = connectedCount <= FREE_TIER_LIMIT;
        const billableAccounts = Math.max(0, connectedCount - FREE_TIER_LIMIT);
        const monthlyCost = billableAccounts * COST_PER_EXTRA_ACCOUNT;

        return {
          isFreeTier,
          billableAccounts,
          monthlyCost,
        };
      };

      expect(calculateAccountBilling(1)).toEqual({
        isFreeTier: true,
        billableAccounts: 0,
        monthlyCost: 0,
      });

      expect(calculateAccountBilling(2)).toEqual({
        isFreeTier: true,
        billableAccounts: 0,
        monthlyCost: 0,
      });

      expect(calculateAccountBilling(3)).toEqual({
        isFreeTier: false,
        billableAccounts: 1,
        monthlyCost: 6,
      });

      expect(calculateAccountBilling(5)).toEqual({
        isFreeTier: false,
        billableAccounts: 3,
        monthlyCost: 18,
      });
    });
  });

  describe("Facebook Page vs Personal Account Restriction Rule", () => {
    it("verifies that only Facebook Pages or Creator accounts are permitted for API publishing", () => {
      const isEligibleForApiPublishing = (account: {
        platform: string;
        accountType: "facebook_page" | "facebook_personal_profile" | "instagram_business";
      }) => {
        // Meta Graph API strictly requires Facebook Pages or Instagram Professional accounts
        if (account.accountType === "facebook_personal_profile") {
          return false;
        }
        return true;
      };

      expect(
        isEligibleForApiPublishing({
          platform: "Facebook",
          accountType: "facebook_page",
        })
      ).toBe(true);

      expect(
        isEligibleForApiPublishing({
          platform: "Facebook",
          accountType: "facebook_personal_profile",
        })
      ).toBe(false);
    });
  });
});

