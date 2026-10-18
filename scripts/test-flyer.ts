/**
 * PostPilot — Single-Shot Finished Flyer Integration Test
 *
 * Generates one flyer from:
 *   Prompt: "get a website for your small business at flat 9999"
 *   Brand: Avero Innovations (with real logo from Supabase)
 *
 * Prints:
 *   1. Flyer Brief
 *   2. Vision Text-Check Result
 *   3. Final Image URL
 *
 * Usage:
 *   npx tsx --env-file=.env scripts/test-flyer.ts
 *   ./scripts/test-flyer
 */

import { generateFlyerBrief, generateFinishedFlyer, checkAndRepairFlyerText } from "../src/api/posters.ts";

async function run() {
  console.log("=== Testing Single-Shot Finished Flyer Pipeline ===");

  const apiKey = process.env["OPENAI_API_KEY"]?.trim();
  if (!apiKey) {
    console.error("[Error] OPENAI_API_KEY is missing from environment");
    process.exit(1);
  }

  const prompt = process.argv[2] || "get a 2 pizza on saturday at flat 999";
  const brandKit = {
    businessName: "Avero Innovations",
    tagline: "Tech Today. Tomorrow Together.",
    colors: ["#00A896", "#028090", "#05668D", "#02C39A"],
    logoUrl: "https://dihikyljbrbidqgelwac.supabase.co/storage/v1/object/public/post-pilot/logos/7d7831d4-8c66-407b-acbc-a2060d66ff00/1792316942214-avero_logo_transparent.png",
  };

  console.log(`[Input Prompt] "${prompt}"`);
  console.log(`[Brand] ${brandKit.businessName} (${brandKit.tagline})`);
  console.log(`[Logo URL] ${brandKit.logoUrl}`);

  // Step 1: Brief Generation
  console.log("\n--- STEP 1: Generating Flyer Brief (gpt-4o-mini) ---");
  const brief = await generateFlyerBrief({
    prompt,
    style: "Bold",
    businessName: brandKit.businessName,
    tagline: brandKit.tagline,
    colors: brandKit.colors,
    layout: "left-text-right-visual",
  });
  console.log("[Flyer Brief]:", JSON.stringify(brief, null, 2));

  // Step 2: Finished Flyer Generation
  console.log("\n--- STEP 2: Generating Finished Flyer (OpenAI) ---");
  const flyerResult = await generateFinishedFlyer({
    brief,
    businessName: brandKit.businessName,
    tagline: brandKit.tagline,
    logoUrl: brandKit.logoUrl,
    colors: brandKit.colors,
  });
  console.log(`[Flyer Generated]: URL = ${flyerResult.url}`);
  console.log(`[Specs]: Model = ${flyerResult.model}, Size = ${flyerResult.size}, Quality = ${flyerResult.quality}`);

  // Step 3: Automatic Vision Text Check & Repair
  console.log("\n--- STEP 3: Automatic Text Verification (gpt-4o-mini vision) ---");
  const checkResult = await checkAndRepairFlyerText({
    imageUrl: flyerResult.url,
    brief,
    apiKey,
  });

  console.log("[Text-Check Result]:", JSON.stringify({
    passed: checkResult.passed,
    needs_review: checkResult.needs_review,
    repair_calls: checkResult.repair_calls,
  }, null, 2));

  console.log("\n=== FINAL RESULT ===");
  console.log(`Final Flyer URL: ${checkResult.finalUrl}`);
  console.log(`Needs Review Flag: ${checkResult.needs_review ? "YES (Needs Review)" : "NO (Verified Passed)"}`);
  console.log("====================\n");
}

run().catch((err) => {
  console.error("[Fatal Error]", err);
  process.exit(1);
});
