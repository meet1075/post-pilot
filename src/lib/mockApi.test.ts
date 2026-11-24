import { describe, it, expect } from "vitest";
import {
  initialPosts,
  suggestCaptions,
  generatePosters,
  type SocialPost,
} from "./mockApi";

describe("Mock API & PostPilot Core Rules", () => {
  it("initialPosts contains valid seed posts with expected fields", () => {
    expect(Array.isArray(initialPosts)).toBe(true);
    expect(initialPosts.length).toBeGreaterThan(0);

    for (const post of initialPosts) {
      expect(post.id).toBeDefined();
      expect(post.headline).toBeDefined();
      expect(["Posted", "Scheduled", "Draft"]).toContain(post.status);
      expect(["Instagram", "Facebook", "X"]).toContain(post.platform);
    }
  });

  it("suggestCaptions produces distinct caption options", async () => {
    const suggestions = await suggestCaptions("Fresh Morning Croissants", "€3.50");
    expect(Array.isArray(suggestions)).toBe(true);
    expect(suggestions.length).toBeGreaterThanOrEqual(3);

    for (const s of suggestions) {
      expect(typeof s).toBe("string");
      expect(s.length).toBeGreaterThan(10);
      expect(s.includes("Fresh Morning Croissants")).toBe(true);
    }
  });

  it("generatePosters returns required poster directions with correct format attributes", async () => {
    const posters = await generatePosters(
      "Special holiday dinner this Friday for $45",
      "Bold",
      true,
      undefined,
      3,
      "Portrait 4:5"
    );

    expect(posters).toHaveLength(3);
    for (const p of posters) {
      expect(p.headline).toBeDefined();
      expect(p.eyebrow).toBeDefined();
      expect(p.footer).toBeDefined();
      // Verifies extracted date from prompt
      expect(p.date_text).toBe("THIS FRIDAY");
    }
  });

  it("generatePosters supports Story and Square formats", async () => {
    const storyPosters = await generatePosters(
      "Grand opening party",
      "Editorial",
      false,
      undefined,
      2,
      "Story"
    );
    expect(storyPosters).toHaveLength(2);

    const squarePosters = await generatePosters(
      "Weekend sale",
      "Minimal",
      false,
      undefined,
      1,
      "Square"
    );
    expect(squarePosters).toHaveLength(1);
  });

  it("generatePosters respects wordsOnImage and tickedBrandDetails", async () => {
    const posters = await generatePosters(
      "Avero.innovations is now Aurelian International, software innovation company",
      "Bold",
      true,
      {
        businessName: "Avero Innovations",
        phone: "63552 06575",
        email: "meetsoni1075@gmail.com",
      },
      2,
      "Portrait 4:5",
      undefined,
      undefined,
      "Avero.innovations is now Aurelian International\nContinuing our commitment to software innovation.",
      {
        logo: true,
        colors: false,
        phone: true,
        location: false,
        website: false,
        email: true,
      },
      "1K"
    );

    expect(posters).toHaveLength(2);
    expect(posters[0]?.headline).toBe("Avero.innovations is now Aurelian International");
    expect(posters[0]?.footer).toContain("63552 06575");
    expect(posters[0]?.footer).toContain("meetsoni1075@gmail.com");
    expect(posters[0]?.imageUrl).toContain("tech_software_showcase.jpg");
  });

  it("generatePosters extracts cricket tournament timing, prizepool, venue and produces distinct images across directions", async () => {
    const cricketPrompt = "Avero innovations is organizing a cricket tournament for all their employees, it is organized at Rajpath club ground and match timing is from 9pm to 1 am from 25-27 nov and the prizepool is 1lac for the winner team";
    const posters = await generatePosters(
      cricketPrompt,
      "Bold",
      true,
      {
        businessName: "Avero Innovations",
        phone: "6355206575",
        email: "averoinnovations@gmail.com",
        website: "https://averoinnovations.com/",
        location: "Ahmedabad",
      },
      2,
      "Story",
      undefined,
      undefined,
      "Please come with your team t-shirts",
      {
        logo: true,
        colors: false,
        phone: true,
        location: true,
        website: true,
        email: true,
      },
      "1K"
    );

    expect(posters).toHaveLength(2);
    expect(posters[0]?.format).toBe("Story");
    expect(posters[0]?.headline).toBe("Please come with your team t-shirts");
    expect(posters[0]?.time_text).toBe("9pm to 1 am");
    expect(posters[0]?.prize_text).toContain("1LAC");
    expect(posters[0]?.venue_text).toContain("Rajpath");
    expect(posters[0]?.footer).toContain("6355206575");
    expect(posters[0]?.footer).toContain("averoinnovations@gmail.com");
    expect(posters[0]?.footer).toContain("https://averoinnovations.com/");

    // Verify directions have distinct images
    expect(posters[0]?.imageUrl).toBeDefined();
    expect(posters[1]?.imageUrl).toBeDefined();
    expect(posters[0]?.imageUrl).not.toBe(posters[1]?.imageUrl);
  });

  it("generatePosters incorporates referenceImageUrl and templateId", async () => {
    const customRefImg = "https://images.unsplash.com/photo-1556742049-0a67c5574f73";
    const posters = await generatePosters(
      "Special festival offer",
      "Bold",
      true,
      undefined,
      2,
      "Portrait 4:5",
      undefined,
      undefined,
      "",
      undefined,
      "1K",
      customRefImg,
      "festive-red-mega-sale"
    );

    expect(posters).toHaveLength(2);
    expect(posters[0]?.imageUrl).toBe(customRefImg);
    expect(posters[0]?.format).toBe("Portrait 4:5");
  });
});
