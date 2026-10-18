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
  dateText?: string | undefined;
  footer?: string | undefined;
  imageUrl?: string | undefined;
  logoUrl?: string | undefined;
  font?: string | undefined;
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

  // 1. If single-shot finished flyer image is present, render it directly onto the high-res canvas
  if (opts.imageUrl) {
    try {
      await new Promise<void>((resolve) => {
        const bgImg = new Image();
        bgImg.crossOrigin = "anonymous";
        bgImg.onload = () => {
          const scale = Math.max(width / bgImg.width, height / bgImg.height);
          const x = (width - bgImg.width * scale) / 2;
          const y = (height - bgImg.height * scale) / 2;
          ctx.drawImage(bgImg, x, y, bgImg.width * scale, bgImg.height * scale);
          resolve();
        };
        bgImg.onerror = () => resolve();
        bgImg.src = opts.imageUrl!;
      });
      return canvas.toDataURL("image/png");
    } catch {
      // Fall through to typographic layout if image load fails
    }
  }

  // Fallback typographic style
  ctx.fillStyle = colors.bg;
  ctx.fillRect(0, 0, width, height);

  // Elegant double-border inset
  ctx.strokeStyle = colors.accent;
  ctx.lineWidth = 3;
  ctx.strokeRect(48, 48, width - 96, height - 96);

  ctx.lineWidth = 1;
  ctx.strokeRect(60, 60, width - 120, height - 120);

  const textColor = opts.imageUrl ? "#FFFFFF" : colors.text;
  const accentColor = opts.imageUrl ? "rgba(255, 255, 255, 0.55)" : colors.accent;

  // Configure text shadow for high readability over image backdrops
  if (opts.imageUrl) {
    ctx.shadowColor = "rgba(0, 0, 0, 0.85)";
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 3;
  } else {
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
  }

  // 2. Eyebrow text (top)
  ctx.fillStyle = textColor;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = '700 26px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  
  const eyebrowSpaced = (opts.eyebrow || "POSTPILOT").toUpperCase().split("").join(" ");
  ctx.fillText(eyebrowSpaced, width / 2, 140);

  // 3. Top ornament line
  ctx.fillStyle = accentColor;
  ctx.fillRect(width / 2 - 50, 420, 100, 2);

  // 4. Headline in selected brand font (wrapped)
  ctx.fillStyle = textColor;
  const fontStyle = (opts.font || "").toLowerCase();
  if (fontStyle.includes("work sans")) {
    ctx.font = '700 74px "Work Sans", -apple-system, BlinkMacSystemFont, sans-serif';
  } else if (fontStyle.includes("dm serif")) {
    ctx.font = '600 78px "DM Serif Display", Georgia, serif';
  } else {
    ctx.font = '500 76px "Fraunces", Georgia, serif';
  }

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

  // 5. Bottom ornament line
  const endHeadlineY = startY + lines.length * lineHeight;
  ctx.fillStyle = accentColor;
  ctx.fillRect(width / 2 - 50, endHeadlineY + 30, 100, 2);

  // 6. Price badge (if present)
  if (opts.price && opts.price.trim().length > 0) {
    const priceText = opts.price.trim();
    if (opts.imageUrl) {
      // Draw prominent promotional price badge
      ctx.font = '700 42px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      const textMetrics = ctx.measureText(priceText);
      const badgeW = textMetrics.width + 60;
      const badgeH = 70;
      const badgeX = (width - badgeW) / 2;
      const badgeY = endHeadlineY + 80;

      // Draw red rounded pill
      ctx.save();
      ctx.shadowColor = "rgba(0, 0, 0, 0.6)";
      ctx.shadowBlur = 12;
      ctx.shadowOffsetY = 4;
      ctx.fillStyle = "#DC2626";
      ctx.beginPath();
      ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 35);
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#FDE047";
      ctx.stroke();

      // Badge text in yellow
      ctx.fillStyle = "#FEF08A";
      ctx.fillText(priceText, width / 2, badgeY + badgeH / 2 + 2);
      ctx.restore();
    } else {
      ctx.fillStyle = textColor;
      ctx.font = '700 46px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText(priceText, width / 2, endHeadlineY + 110);
    }
  }

  // 6b. Date badge (if present)
  if (opts.dateText && opts.dateText.trim().length > 0) {
    const dateStr = opts.dateText.trim().toUpperCase();
    ctx.save();
    ctx.fillStyle = textColor;
    ctx.font = '600 28px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(dateStr, width / 2, endHeadlineY + 175);
    ctx.restore();
  }

  // 7. Footer text
  ctx.fillStyle = textColor;
  ctx.font = '700 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  const footerSpaced = (opts.footer || "GOOD FOOD, GOOD COMPANY").toUpperCase().split("").join(" ");
  ctx.fillText(footerSpaced, width / 2, height - 140);

  // 9. Brand Logo mark badge (top-right)
  if (opts.logoUrl) {
    try {
      await new Promise<void>((resolve) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          const size = 96;
          const x = width - 80 - size;
          const y = 80;
          ctx.save();
          ctx.beginPath();
          ctx.arc(x + size / 2, y + size / 2, size / 2 + 6, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
          ctx.fill();
          ctx.clip();
          ctx.drawImage(img, x, y, size, size);
          ctx.restore();
          resolve();
        };
        img.onerror = () => resolve();
        img.src = opts.logoUrl!;
      });
    } catch {
      // Ignore cross-origin error
    }
  }

  return canvas.toDataURL("image/png");
}
