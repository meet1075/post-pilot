import { describe, it, expect } from "vitest";
import { TEMPLATES, TEMPLATE_CATEGORIES, getTemplateById, filterTemplates, R2_TEMPLATES_CDN_BASE, R2_PUBLIC_BASE_URL } from "./templates";

describe("Templates Catalog & Filter Helper", () => {
  it("provides predefined templates hosted on Cloudflare R2 bucket", () => {
    expect(TEMPLATES.length).toBeGreaterThanOrEqual(14);
    expect(R2_PUBLIC_BASE_URL).toContain("r2.dev");
    expect(R2_TEMPLATES_CDN_BASE).toContain("r2.dev/templates");

    for (const t of TEMPLATES) {
      expect(t.id).toBeTruthy();
      expect(t.title).toBeTruthy();
      expect(t.category).toBeTruthy();
      expect(t.defaultPrompt).toBeTruthy();
      // Ensure preview and reference URLs point directly to Cloudflare R2 storage, NOT local repo paths
      expect(t.previewUrl).toMatch(/^https:\/\/[a-z0-9-.]+\.r2\.dev\/templates\/[a-z0-9-]+\.jpg$/);
      expect(t.referenceImageUrl).toMatch(/^https:\/\/[a-z0-9-.]+\.r2\.dev\/templates\/[a-z0-9-]+\.jpg$/);
      expect(t.previewUrl).not.toContain("localhost");
      expect(t.previewUrl).not.toMatch(/^\/templates\//);
    }
  });

  it("includes all 12 core design categories from inspiration", () => {
    const requiredCategories = [
      "Offers & sales",
      "Event and announcement",
      "New arrival",
      "Menu & products",
      "Before & after",
      "Customer reviews",
      "Events & invites",
      "Tips & advice",
      "Infographic",
      "Quote",
      "Giveaway & contest",
      "Behind the scenes",
    ];
    for (const cat of requiredCategories) {
      expect(TEMPLATE_CATEGORIES).toContain(cat);
    }
  });

  it("finds template by ID", () => {
    const found = getTemplateById("saas-whatsapp-orbit");
    expect(found).toBeDefined();
    expect(found?.title).toContain("WhatsApp");
  });

  it("filters templates by category", () => {
    const saasOnly = filterTemplates({ category: "SaaS & software" });
    expect(saasOnly.length).toBeGreaterThan(0);
    expect(saasOnly.every((t) => t.category === "SaaS & software")).toBe(true);
  });

  it("filters templates by search query", () => {
    const diwaliOffers = filterTemplates({ query: "diwali offer" });
    expect(diwaliOffers.length).toBeGreaterThanOrEqual(1);

    const cricket = filterTemplates({ query: "cricket" });
    expect(cricket.length).toBeGreaterThanOrEqual(1);
    expect(cricket[0]?.id).toBe("cricket-tournament-championship");
  });

  it("filters templates by aspect ratio", () => {
    const squareOnly = filterTemplates({ aspectRatio: "1:1" });
    expect(squareOnly.length).toBeGreaterThan(0);
    expect(squareOnly.every((t) => t.aspectRatio === "1:1")).toBe(true);

    const portraitOnly = filterTemplates({ aspectRatio: "4:5" });
    expect(portraitOnly.length).toBeGreaterThan(0);
    expect(portraitOnly.every((t) => t.aspectRatio === "4:5")).toBe(true);
  });
});

