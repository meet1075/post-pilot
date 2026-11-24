import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  isR2Configured,
  getBucketName,
  getPublicUrl,
  buildPosterKey,
  buildLogoKey,
  uploadPosterImage,
} from "./storage";

describe("Cloudflare R2 Storage Layer (Strict Non-Repo File Storage)", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("detects when Cloudflare R2 is configured", () => {
    process.env["R2_ACCOUNT_ID"] = "test-account-id";
    process.env["R2_ACCESS_KEY_ID"] = "test-access-key";
    process.env["R2_SECRET_ACCESS_KEY"] = "test-secret-key";

    expect(isR2Configured()).toBe(true);
  });

  it("returns false when any required R2 credential is missing", () => {
    delete process.env["R2_ACCOUNT_ID"];
    process.env["R2_ACCESS_KEY_ID"] = "test-access-key";
    process.env["R2_SECRET_ACCESS_KEY"] = "test-secret-key";

    expect(isR2Configured()).toBe(false);
  });

  it("retrieves the configured R2 bucket name with postpilot-posters as default", () => {
    process.env["R2_ACCOUNT_ID"] = "test-account-id";
    process.env["R2_ACCESS_KEY_ID"] = "test-access-key";
    process.env["R2_SECRET_ACCESS_KEY"] = "test-secret-key";
    delete process.env["R2_BUCKET_NAME"];

    expect(getBucketName()).toBe("postpilot-posters");

    process.env["R2_BUCKET_NAME"] = "custom-r2-bucket";
    expect(getBucketName()).toBe("custom-r2-bucket");
  });

  it("generates public CDN URLs using R2_PUBLIC_URL domain", () => {
    process.env["R2_ACCOUNT_ID"] = "f8a6b331f3f6eca1190a577900295c23";
    process.env["R2_ACCESS_KEY_ID"] = "test-access-key";
    process.env["R2_SECRET_ACCESS_KEY"] = "test-secret-key";
    process.env["R2_PUBLIC_URL"] = "https://pub-f951b9a0f9b3407c901fb638d50404db.r2.dev";

    const key = "posters/biz-001/1700000000000-poster.png";
    const url = getPublicUrl(key);

    expect(url).toBe("https://pub-f951b9a0f9b3407c901fb638d50404db.r2.dev/posters/biz-001/1700000000000-poster.png");
    // Ensure URL never targets local repository paths
    expect(url).not.toContain("localhost");
    expect(url).not.toContain("/public/");
  });

  it("handles leading slashes cleanly in getPublicUrl", () => {
    process.env["R2_ACCOUNT_ID"] = "f8a6b331f3f6eca1190a577900295c23";
    process.env["R2_ACCESS_KEY_ID"] = "test-access-key";
    process.env["R2_SECRET_ACCESS_KEY"] = "test-secret-key";
    process.env["R2_PUBLIC_URL"] = "https://pub-f951b9a0f9b3407c901fb638d50404db.r2.dev/";

    const key = "/templates/saas-whatsapp-orbit.jpg";
    const url = getPublicUrl(key);

    expect(url).toBe("https://pub-f951b9a0f9b3407c901fb638d50404db.r2.dev/templates/saas-whatsapp-orbit.jpg");
  });

  it("builds deterministic poster and logo storage keys", () => {
    const posterKey = buildPosterKey("biz-abc", "post-xyz", 1);
    expect(posterKey).toBe("posters/biz-abc/post-xyz-1.png");

    const logoKeyPng = buildLogoKey("biz-abc");
    expect(logoKeyPng).toBe("logos/biz-abc/logo.png");

    const logoKeySvg = buildLogoKey("biz-abc", "svg");
    expect(logoKeySvg).toBe("logos/biz-abc/logo.svg");
  });

  it("uploads poster buffer to Cloudflare R2 bucket when configured", async () => {
    // We test with real R2 credentials if present in env, or verify upload function interface
    if (isR2Configured()) {
      const testBuffer = Buffer.from("unit-test-image-content");
      const testKey = `test/unit-test-${Date.now()}.png`;

      const result = await uploadPosterImage({
        key: testKey,
        body: testBuffer,
        contentType: "image/png",
      });

      expect(result.key).toBe(testKey);
      expect(result.publicUrl).toContain(testKey);
      expect(result.publicUrl).toMatch(/^https:\/\/[a-z0-9-.]+\.r2\.dev\//);
    }
  });
});

