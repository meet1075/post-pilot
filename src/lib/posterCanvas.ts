/**
 * PostPilot — Poster Canvas Renderer
 *
 * Renders the typographic/CSS poster onto an HTML5 Canvas (1080x1350, 4:5 Instagram feed aspect ratio)
 * and exports as a high-resolution PNG data URL.
 *
 * This guarantees that even when AI credits are 0 or offline, the exact poster
 * designed on screen is uploaded and published to Instagram rather than a random fallback image.
 */

export interface RenderPosterOptions {
  theme: string;
  eyebrow: string;
  headline: string;
  price?: string | undefined;
  footer?: string | undefined;
}

const THEME_COLORS: Record<string, { bg: string; text: string; accent: string }> = {
  tomato: { bg: "#B91C1C", text: "#FFFFFF", accent: "rgba(255, 255, 255, 0.45)" },
  olive: { bg: "#365314", text: "#FFFFFF", accent: "rgba(255, 255, 255, 0.45)" },
  mustard: { bg: "#78350F", text: "#FFFFFF", accent: "rgba(255, 255, 255, 0.45)" },
  cream: { bg: "#F5F2EB", text: "#1C1917", accent: "rgba(28, 25, 23, 0.35)" },
  sky: { bg: "#0369A1", text: "#FFFFFF", accent: "rgba(255, 255, 255, 0.45)" },
  plum: { bg: "#581C87", text: "#FFFFFF", accent: "rgba(255, 255, 255, 0.45)" },
};

export async function renderPosterCanvas(opts: RenderPosterOptions): Promise<string> {
  const width = 1080;
  const height = 1350;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not acquire 2D canvas context");

  const colors = THEME_COLORS[opts.theme.toLowerCase()] ?? THEME_COLORS["tomato"]!;

  // 1. Background fill
  ctx.fillStyle = colors.bg;
  ctx.fillRect(0, 0, width, height);

  // 2. Elegant double-border inset
  ctx.strokeStyle = colors.accent;
  ctx.lineWidth = 3;
  ctx.strokeRect(48, 48, width - 96, height - 96);

  ctx.lineWidth = 1;
  ctx.strokeRect(60, 60, width - 120, height - 120);

  // 3. Eyebrow text (top)
  ctx.fillStyle = colors.text;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = '700 26px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  
  const eyebrowSpaced = (opts.eyebrow || "POSTPILOT").toUpperCase().split("").join(" ");
  ctx.fillText(eyebrowSpaced, width / 2, 140);

  // 4. Top ornament line
  ctx.fillStyle = colors.accent;
  ctx.fillRect(width / 2 - 50, 420, 100, 2);

  // 5. Headline in serif font (wrapped)
  ctx.fillStyle = colors.text;
  ctx.font = '600 76px "DM Serif Display", Georgia, serif';

  const headline = opts.headline || "A good reason to gather";
  const words = headline.split(" ");
  const lines: string[] = [];
  let currentLine = words[0] || "";

  const maxWidth = width - 260; // 820px max text width
  for (let i = 1; i < words.length; i++) {
    const word = words[i]!;
    const testLine = `${currentLine} ${word}`;
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  lines.push(currentLine);

  // Vertical positioning centered in upper-middle
  const lineHeight = 94;
  const startY = 620 - ((lines.length - 1) * lineHeight) / 2;

  lines.forEach((line, index) => {
    ctx.fillText(line, width / 2, startY + index * lineHeight);
  });

  // 6. Bottom ornament line
  const endHeadlineY = startY + lines.length * lineHeight;
  ctx.fillStyle = colors.accent;
  ctx.fillRect(width / 2 - 50, endHeadlineY + 30, 100, 2);

  // 7. Price badge (if present)
  if (opts.price && opts.price.trim().length > 0) {
    const priceText = opts.price.trim();
    ctx.fillStyle = colors.text;
    ctx.font = '700 46px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(priceText, width / 2, endHeadlineY + 110);
  }

  // 8. Footer text
  ctx.fillStyle = colors.text;
  ctx.font = '700 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  const footerSpaced = (opts.footer || "GOOD FOOD, GOOD COMPANY").toUpperCase().split("").join(" ");
  ctx.fillText(footerSpaced, width / 2, height - 140);

  return canvas.toDataURL("image/png");
}
