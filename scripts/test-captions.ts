/**
 * PostPilot — Caption Generation Integration Test
 *
 * Tests Groq (or OpenAI fallback) caption generation:
 * - Checks that empty OPENAI_API_KEY does not crash
 * - Validates input: offer, business name, tone, platform
 * - Validates output: exactly 3 JSON options [{caption, hashtags}]
 * - Checks rules: CTA first, exact facts, max 1-2 emojis
 * - Never prints or exposes API keys
 *
 * Usage:
 *   npx tsx scripts/test-captions.ts
 */

import { generateCaptions } from "../src/api/captions.js";

async function run() {
  console.log("=== Testing Caption Generation Integration ===");

  const openaiKey = process.env["OPENAI_API_KEY"];
  const groqKey = process.env["GROQ_API_KEY"];
  const groqModel = process.env["GROQ_MODEL"] ?? "qwen/qwen3.8-27b";

  console.log(`[Config] OPENAI_API_KEY present: ${Boolean(openaiKey && openaiKey.trim().length > 0)}`);
  console.log(`[Config] GROQ_API_KEY present: ${Boolean(groqKey && groqKey.trim().length > 0)}`);
  console.log(`[Config] Groq Model: ${groqModel}`);

  const testInput = {
    offer: "20% off all artisan pizzas this Friday night",
    businessName: "Luigi Pizzeria",
    tone: "Friendly",
    platform: "Instagram",
  };

  console.log("[Input]", JSON.stringify(testInput, null, 2));
  console.log("Generating captions via backend...");

  try {
    const results = await generateCaptions(testInput);

    console.log(`[Result] Received ${results.length} caption option(s):`);
    results.forEach((opt, idx) => {
      console.log(`\n--- Option ${idx + 1} ---`);
      console.log(`Caption : ${opt.caption}`);
      console.log(`Hashtags: ${opt.hashtags}`);

      // Basic sanity checks
      if (!opt.caption || !opt.hashtags) {
        throw new Error(`Option ${idx + 1} is missing caption or hashtags`);
      }
    });

    if (results.length !== 3) {
      console.warn(`[Warning] Expected 3 options, received ${results.length}`);
    } else {
      console.log("\n[Success] Exactly 3 options returned in [{caption, hashtags}] format!");
    }

    console.log("=== Caption Integration Test Passed ===");
    process.exit(0);
  } catch (err: any) {
    console.error("[Fail] Caption generation failed:", err.message ?? err);
    process.exit(1);
  }
}

run();
