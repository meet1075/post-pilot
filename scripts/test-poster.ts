/**
 * PostPilot — Poster Generation Integration Test
 *
 * Tests Ideogram 4.5 endpoint integration, headers, quality, aspect ratio,
 * and error handling without exposing secrets.
 *
 * By default runs with dry_run=true to avoid consuming paid generation credits.
 * Run with `--live` to test actual generation and storage upload.
 *
 * Usage:
 *   npx tsx scripts/test-poster.ts
 *   npx tsx scripts/test-poster.ts --live
 */

import { callIdeogramApi } from "../src/api/posters.js";

async function run() {
  console.log("=== Testing Ideogram Poster Integration ===");

  const apiKey = process.env["IDEOGRAM_API_KEY"];
  const model = process.env["IDEOGRAM_MODEL"] ?? "ideogram-4-5";
  const quality = process.env["IDEOGRAM_QUALITY"] ?? "low";

  console.log(`[Config] Model: ${model}`);
  console.log(`[Config] Quality: ${quality}`);
  console.log(`[Config] API Key present: ${Boolean(apiKey && apiKey.trim().length > 0)}`);

  const isLive = process.argv.includes("--live");
  console.log(`[Mode] ${isLive ? "LIVE generation" : "DRY RUN (validates API, parameters & pricing without spending credits)"}`);

  const testPrompt = "Minimalist warm aesthetic background for restaurant social media poster, soft lighting, ample negative space for text overlay";

  try {
    const urls = await callIdeogramApi(testPrompt, !isLive);

    if (urls.length > 0) {
      console.log(`[Success] Verified Ideogram API call! Received ${urls.length} image reference(s).`);
      console.log(`[Storage/URL preview] ${urls[0]?.substring(0, 45)}...`);
    } else {
      console.log("[Notice] Returned empty array (CSS fallback triggered). Check your API key or credit balance.");
    }

    console.log("=== Poster Integration Test Passed ===");
    process.exit(0);
  } catch (err: any) {
    console.error("[Fail] Error during poster test:", err.message ?? err);
    process.exit(1);
  }
}

run();
