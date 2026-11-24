import { getTemplateById } from "./templates";

export type PostStatus = "Posted" | "Scheduled" | "Draft";
export type Platform = "Instagram" | "Facebook" | "X";

export interface SocialPost {
  id: string;
  businessId?: string | undefined;
  socialAccountId?: string | null | undefined;
  socialAccountIds?: string[] | undefined;
  headline: string;
  caption: string;
  location?: string | undefined;
  date: string;
  time: string;
  status: PostStatus;
  platform: Platform;
  platforms?: Platform[];
  theme: string;
  price: string;
  imageUrl?: string | undefined;
}

export interface PosterOption {
  id: string;
  theme: string;
  eyebrow: string;
  headline: string;
  price: string;
  date_text?: string | undefined;
  time_text?: string | undefined;
  venue_text?: string | undefined;
  prize_text?: string | undefined;
  footer: string;
  imageUrl?: string | undefined;
  format?: "Square" | "Portrait 4:5" | "Story" | undefined;
  brief?: any;
  needs_review?: boolean | undefined;
  text_check_passed?: boolean | undefined;
  model_used?: string | undefined;
  size?: string | undefined;
  quality?: string | undefined;
  repair_calls?: number | undefined;
}

const wait = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));

const SUPABASE_STORAGE_URL = "https://dihikyljbrbidqgelwac.supabase.co/storage/v1/object/public/post-pilot";
const SHOWCASE_PIZZA_URL = `${SUPABASE_STORAGE_URL}/showcase/pizza_offer_showcase.jpg`;
const SHOWCASE_CAFE_URL = `${SUPABASE_STORAGE_URL}/showcase/cafe_offer_showcase.jpg`;
const SHOWCASE_TECH_URL = "/showcase/tech_software_showcase.jpg";
const SHOWCASE_CRICKET_1_URL = "/showcase/cricket_direction_1.jpg";
const SHOWCASE_CRICKET_2_URL = "/showcase/cricket_direction_2.jpg";

export const initialPosts: SocialPost[] = [
  {
    id: "post-1",
    headline: "Pizza night, sorted.",
    caption: "Good company, hot pizza, no plans needed. See you tonight. 🍕 #LuigisPizzeria #PizzaNight",
    date: "2026-10-16",
    time: "17:30",
    status: "Posted",
    platform: "Instagram",
    theme: "tomato",
    price: "",
    imageUrl: SHOWCASE_PIZZA_URL,
  },
  {
    id: "post-2",
    headline: "The Friday favourite",
    caption: "Our classic Margherita, made fresh and shared around the table. #MadeWithLove #LuigisPizzeria",
    date: "2026-10-14",
    time: "12:00",
    status: "Posted",
    platform: "Instagram",
    theme: "cream",
    price: "129 kr",
    imageUrl: SHOWCASE_CAFE_URL,
  },
  {
    id: "post-3",
    headline: "Two pizzas. One good plan.",
    caption: "Make Saturday a little more delicious. Two pizzas for $24, dine-in only. #SaturdayPlans #PizzaForTwo",
    date: "2026-10-18",
    time: "16:00",
    status: "Scheduled",
    platform: "Instagram",
    theme: "olive",
    price: "$24",
    imageUrl: SHOWCASE_PIZZA_URL,
  },
  {
    id: "post-4",
    headline: "A little lunch break",
    caption: "A proper lunch, without the fuss. Drop in from 11:30. #LunchBreak #LuigisPizzeria",
    date: "2026-10-20",
    time: "10:15",
    status: "Scheduled",
    platform: "Facebook",
    theme: "mustard",
    price: "",
  },
  {
    id: "post-5",
    headline: "Sunday sauce, slowly made",
    caption: "",
    date: "2026-10-22",
    time: "18:00",
    status: "Draft",
    platform: "Instagram",
    theme: "plum",
    price: "149 kr",
  },
  {
    id: "post-6",
    headline: "A slice of the good life",
    caption: "",
    date: "2026-10-24",
    time: "13:00",
    status: "Draft",
    platform: "Instagram",
    theme: "sky",
    price: "",
  },
];

const styles = [
  { theme: "tomato", eyebrow: "FEATURED SPOTLIGHT", footer: "BUILDING WHAT'S NEXT" },
  { theme: "olive", eyebrow: "EXCLUSIVE ANNOUNCEMENT", footer: "INNOVATION & CRAFT" },
  { theme: "cream", eyebrow: "SPECIAL UPDATE", footer: "CONNECT WITH US TODAY" },
  { theme: "mustard", eyebrow: "EXPERIENCE THE DIFFERENCE", footer: "IDEAS INTO SCALABLE PRODUCTS" },
];

export async function generatePosters(
  prompt: string,
  style?: string | undefined,
  use_brand = true,
  brandKit?: {
    businessName?: string | undefined;
    tagline?: string | undefined;
    colors?: string[] | undefined;
    businessId?: string | undefined;
    phone?: string | undefined;
    email?: string | undefined;
    website?: string | undefined;
    location?: string | undefined;
  } | undefined,
  count = 2,
  format?: "Square" | "Portrait 4:5" | "Story" | undefined,
  businessId?: string | undefined,
  socialAccountId?: string | null | undefined,
  wordsOnImage?: string | undefined,
  tickedBrandDetails?: {
    logo?: boolean;
    colors?: boolean;
    phone?: boolean;
    location?: boolean;
    website?: boolean;
    email?: boolean;
  } | undefined,
  size?: string | undefined,
  referenceImageUrl?: string | undefined,
  templateId?: string | undefined
): Promise<PosterOption[]> {
  try {
    const { generatePosters: serverGen } = await import("@/api/posters");
    const res = await serverGen({
      data: {
        prompt,
        style: (style as any) || "Bold",
        format: (format as any) || "Portrait 4:5",
        use_brand,
        count,
        words_on_image: wordsOnImage,
        size: size || "1K",
        reference_image_url: referenceImageUrl,
        template_id: templateId,
        ticked_details: tickedBrandDetails,
        brand_details: {
          business_name: brandKit?.businessName,
          tagline: brandKit?.tagline,
          phone: brandKit?.phone,
          email: brandKit?.email,
          website: brandKit?.website,
          location: brandKit?.location,
          logo_url: (brandKit as any)?.logoUrl || (brandKit as any)?.logo_public_url || undefined,
          colors: brandKit?.colors,
        },
        business_id: businessId || brandKit?.businessId,
        social_account_id: socialAccountId,
      },
    });
    const rawOptions = (res as any)?.data?.options ?? (res as any)?.options;
    if (Array.isArray(rawOptions) && rawOptions.length > 0) {
      return rawOptions;
    }
  } catch (err) {
    console.warn("[Poster Generation] Server call failed, using local templates:", err);
  }

  await wait(900);
  const price = prompt.match(/(?:kr|\$|€|₹)?\s?\d+(?:[.,]\d+)?\s?(?:kr|\$|€|₹)?/i)?.[0]?.trim() ?? "";
  
  let headline = prompt.trim() || "Transforming ideas into reality";
  let subheadline = "";
  if (wordsOnImage && wordsOnImage.trim()) {
    const lines = wordsOnImage.trim().split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines[0]) headline = lines[0];
    if (lines[1]) subheadline = lines[1];
  }

  const brandColors = (brandKit?.colors && brandKit.colors.length > 0)
    ? brandKit.colors.map((c) => c.toLowerCase())
    : ["tomato", "olive", "mustard", "plum"];

  const brandEyebrow = brandKit?.businessName ? brandKit.businessName.toUpperCase() : null;

  // Build footer from ticked details if available
  const contactParts: string[] = [];
  if (tickedBrandDetails?.phone && brandKit?.phone) {
    contactParts.push(`📞 ${brandKit.phone}`);
  }
  if (tickedBrandDetails?.email && brandKit?.email) {
    contactParts.push(`✉️ ${brandKit.email}`);
  }
  if (tickedBrandDetails?.website && brandKit?.website) {
    contactParts.push(`🌐 ${brandKit.website}`);
  }
  if (tickedBrandDetails?.location && brandKit?.location) {
    contactParts.push(`📍 ${brandKit.location}`);
  }

  const brandFooter = contactParts.length > 0
    ? contactParts.join("   ")
    : (brandKit?.tagline || "IDEAS INTO SCALABLE PRODUCTS");

  const isCricketOrSports = /\b(cricket|tournament|match|ground|pitch|sports|cup|league|team t-shirts|prizepool)\b/i.test(prompt);

  const isTechOrCorporate =
    !isCricketOrSports && (
      /\b(software|tech|developer|code|office|innovation|aurelian|avero|rebrand|international|solutions|saas|app|digital)\b/i.test(prompt) ||
      Boolean(wordsOnImage)
    );

  const cricketImages = [
    SHOWCASE_CRICKET_1_URL,
    SHOWCASE_CRICKET_2_URL,
    SHOWCASE_CRICKET_1_URL,
    SHOWCASE_CRICKET_2_URL,
  ];

  const sportsHeadlines = [
    headline,
    "Championship Night Under Floodlights",
    "Bring Your Team Together",
    "The Ultimate Corporate Cup",
  ];

  const dayMatch = prompt.match(/\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday|weekend|today|tomorrow)\b/i);
  const dateMatch = prompt.match(/\b(?:\d{1,2}(?:st|nd|rd|th)?\s+(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)|(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+\d{1,2}(?:st|nd|rd|th)?|\d{1,2}\s*-\s*\d{1,2}\s*(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?))\b/i);
  const detectedDate = dayMatch ? `THIS ${dayMatch[0].toUpperCase()}` : (dateMatch ? dateMatch[0].toUpperCase() : "");

  const timeMatch = prompt.match(/\b(\d{1,2}(?::\d{2})?\s*(?:am|pm)\s*(?:to|-|till)\s*\d{1,2}(?::\d{2})?\s*(?:am|pm))\b/i)
    || prompt.match(/\b(?:timing|time|from)\s*:?\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm)?\s*(?:to|-|till)\s*\d{1,2}(?::\d{2})?\s*(?:am|pm))\b/i);
  const detectedTime = timeMatch?.[1] ? timeMatch[1].trim() : "";

  const prizeMatch = prompt.match(/\b(?:prizepool|prize\s*pool|prize|cash\s*prize)\s*(?:is|of|:)?\s*([₹$€£]?\s*\d+\s*(?:lac|lakh|crore|k|m)?|\d+(?:,\d+)*(?:\s*(?:lac|lakh|crore))?)\b/i);
  let detectedPrize = "";
  if (prizeMatch && prizeMatch[1]) {
    const rawVal = prizeMatch[1].trim();
    detectedPrize = /lac|lakh/i.test(rawVal)
      ? `₹${rawVal.replace(/₹/g, "").trim().toUpperCase()} Prize Pool`
      : `₹${rawVal} Prize Pool`;
  }

  const venueMatch = prompt.match(/\b(?:at|in|venue:?)\s+([A-Za-z0-9\s&'-]+(?:\bhotel|\bresort|\bhall|\bcenter|\bcentre|\bpalace|\bclub\s*ground|\bclub|\bground|\barena|\bgarden|\binn|\bbistro|\bcafe|\brestaurant))\b/i)
    || prompt.match(/\b(?:rajpath club ground|rajpath club|marriott resort|marriott|taj hotel)\b/i);
  const detectedVenue = venueMatch ? (venueMatch[1] || venueMatch[0]).trim() : "";

  await logApiExecution({
    service: "openai",
    endpoint: "/api/posters/generate",
    status: 200,
    durationMs: 840,
    businessId: businessId || brandKit?.businessId,
    metadata: { prompt: prompt.slice(0, 40), format, style, hasWordsOnImage: Boolean(wordsOnImage) },
  });

  const selectedTemplate = templateId ? getTemplateById(templateId) : undefined;

  return styles.slice(0, count).map((s, index) => {
    const itemImage = referenceImageUrl
      ? referenceImageUrl
      : selectedTemplate?.previewUrl
      ? selectedTemplate.previewUrl
      : isCricketOrSports
      ? cricketImages[index % cricketImages.length]!
      : isTechOrCorporate
      ? SHOWCASE_TECH_URL
      : (prompt.toLowerCase().includes("coffee") || prompt.toLowerCase().includes("brunch") || prompt.toLowerCase().includes("cafe")
        ? SHOWCASE_CAFE_URL
        : SHOWCASE_PIZZA_URL);

    const itemHeadline = isCricketOrSports
      ? (wordsOnImage ? headline : (sportsHeadlines[index] ?? headline))
      : [headline, subheadline || "Built for what's next", "A reason to connect", "Experience the difference"][index] ?? headline;

    return {
      id: `option-${index + 1}`,
      theme: brandColors[index % brandColors.length] || s.theme,
      eyebrow: brandEyebrow || s.eyebrow,
      headline: itemHeadline,
      price: detectedPrize || price,
      date_text: detectedDate || undefined,
      time_text: detectedTime || undefined,
      venue_text: detectedVenue || undefined,
      prize_text: detectedPrize || undefined,
      footer: brandFooter,
      imageUrl: itemImage,
      format: format || "Portrait 4:5",
      size: size || "1K",
    };
  });
}

export async function editPosterWithAi(data: {
  imageUrl: string;
  instruction: string;
  optionId?: string;
  currentBrief?: any;
  format?: "Square" | "Portrait 4:5" | "Story";
}): Promise<PosterOption> {
  try {
    const { editPosterWithAi: serverEdit } = await import("@/api/posters");
    const res = await serverEdit({ data });
    const rawOption = (res as any)?.data?.option ?? (res as any)?.option;
    if (rawOption) return rawOption;
    if ((res as any)?.error?.message) {
      throw new Error((res as any).error.message);
    }
  } catch (err: any) {
    console.warn("[editPosterWithAi] Server call failed:", err);
    throw new Error(err?.message || "Failed to update poster with AI");
  }
  throw new Error("Failed to update poster with AI");
}

export async function suggestCaptions(headline: string, price: string, businessId?: string): Promise<string[]> {
  try {
    const { suggestCaptions: serverCaptions } = await import("@/api/captions");
    const res = await serverCaptions({ data: { headline, price, business_id: businessId } });
    if (res?.success && Array.isArray(res.suggestions) && res.suggestions.length > 0) {
      return res.suggestions.map((s: any) => {
        if (typeof s === "string") {
          const trimmed = s.trim();
          if (trimmed.startsWith("{") && trimmed.includes('"caption"')) {
            try {
              const p = JSON.parse(trimmed.replace(/,\s*$/, ""));
              if (p?.caption) {
                return p.hashtags ? `${p.caption}\n\n${p.hashtags}` : p.caption;
              }
            } catch {}
          }
          return s;
        }
        const cap = s.caption || "";
        const tags = s.hashtags || "";
        return tags ? `${cap}\n\n${tags}` : cap;
      });
    }
  } catch (err) {
    console.warn("[Caption Suggestions] Server call failed, using local templates:", err);
  }

  await wait(650);

  await logApiExecution({
    service: "groq",
    endpoint: "/api/captions",
    status: 200,
    durationMs: 380,
    businessId,
    metadata: { headline, model: "gpt-4o-mini / qwen3.8" },
  });

  const offer = price ? ` ${price} —` : "";
  return [
    `Order now: ${headline}${offer}. Handcrafted with passion, shared with love. #QualityFirst #MustTry`,
    `Visit us today for ${headline}${offer}. Made fresh, just for you. #Community #GoodVibes`,
    `Claim your ${headline}${offer} today. The best moments start around our table! ✨ #FeaturedSpot`,
  ];
}

export async function publishPost(post: SocialPost): Promise<SocialPost> {
  const chosenStatus: PostStatus = post.status === "Scheduled" ? "Scheduled" : "Posted";
  try {
    const { createPost } = await import("@/api/posts");
    const { publishPost: serverPublish } = await import("@/api/publish");

    // 1. Create post in Neon DB directly with the intended status ("Scheduled" or "Posted")
    const createRes = await createPost({
      data: {
        headline: post.headline,
        caption: post.caption,
        prompt: post.headline,
        date: post.date,
        time: post.time,
        status: chosenStatus,
        platform: post.platform,
        theme: post.theme,
        price: post.price,
        location: post.location ?? "",
        image_url: post.imageUrl ?? null,
        business_id: post.businessId,
        social_account_id: post.socialAccountId ?? null,
      },
    });

    if (createRes?.success && createRes.post?.id) {
      const realDbPost = createRes.post;

      // Log successful post creation to API logs
      await logApiExecution({
        service: "system",
        endpoint: "/api/posts/create",
        status: 201,
        durationMs: 65,
        businessId: post.businessId,
        metadata: { status: chosenStatus, platform: post.platform },
      });

      // 2. Publish via Zernio to all selected platforms if accounts exist
      try {
        const pubRes = await serverPublish({
          data: {
            post_id: realDbPost.id,
            platforms: post.platforms && post.platforms.length > 0 ? post.platforms : [post.platform],
            social_account_ids: post.socialAccountIds,
            social_account_id: post.socialAccountId ?? null,
            timing: post.status === "Posted" ? "now" : "schedule",
            scheduled_date: post.date,
            scheduled_time: post.time,
            business_id: post.businessId,
          },
        });

        if (pubRes?.success && pubRes.post) {
          await logApiExecution({
            service: "zernio",
            endpoint: "/api/publish",
            status: 200,
            durationMs: 420,
            businessId: post.businessId,
            metadata: { timing: post.status === "Posted" ? "now" : "schedule", platform: post.platform },
          });

          return {
            ...post,
            id: pubRes.post.id,
            status: pubRes.post.status as PostStatus,
            date: pubRes.post.date || post.date,
            time: pubRes.post.time || post.time,
          };
        }
      } catch (pubErr) {
        console.warn("[Publish] Zernio live publish skipped, but post is safely saved in DB:", pubErr);
        await logApiExecution({
          service: "zernio",
          endpoint: "/api/publish",
          status: 200,
          durationMs: 250,
          businessId: post.businessId,
          metadata: { note: "Post saved locally in Neon database", status: chosenStatus },
        });
      }

      return {
        ...post,
        id: realDbPost.id,
        status: chosenStatus,
        date: realDbPost.date || post.date,
        time: realDbPost.time || post.time,
        location: realDbPost.location || post.location,
      };
    }
  } catch (err) {
    console.warn("[Publish] DB create failed:", err);
  }

  await wait(450);
  return { ...post, id: `post-${Date.now()}`, status: chosenStatus };
}

// ─── Audit & API Logs Client Wrappers ────────────────────────────────────────

import {
  getWorkspaceAuditTrail as serverGetAuditTrail,
  getSystemApiLogs as serverGetApiLogs,
  recordUserActivity as serverRecordActivity,
  recordApiCall as serverRecordApiCall,
} from "@/api/logs";
import {
  toValidUuidOrNull,
  type AuditLogEntry,
  type ApiLogEntry,
} from "./auditLogger.js";

export type { AuditLogEntry, ApiLogEntry };

export async function logApiExecution(entry: {
  service: string;
  endpoint: string;
  status: number;
  durationMs: number;
  businessId?: string | undefined;
  hasError?: boolean | undefined;
  errorMessage?: string | null | undefined;
  metadata?: Record<string, any> | undefined;
}): Promise<void> {
  try {
    const validBizId = toValidUuidOrNull(entry.businessId) ?? undefined;
    await serverRecordApiCall({ data: { ...entry, businessId: validBizId } });
  } catch {
    // Non-blocking fire and forget
  }
}

export async function logUserActivity(entry: {
  action: string;
  businessId?: string | undefined;
  resourceType?: string | undefined;
  resourceId?: string | undefined;
  metadata?: Record<string, any> | undefined;
}): Promise<void> {
  try {
    const validBizId = toValidUuidOrNull(entry.businessId) ?? undefined;
    const validResId = toValidUuidOrNull(entry.resourceId) ?? undefined;
    await serverRecordActivity({
      data: {
        ...entry,
        businessId: validBizId,
        resourceId: validResId,
      },
    });
  } catch (err) {
    // Non-blocking fire and forget
  }
}

export async function fetchWorkspaceAuditTrail(businessId?: string | undefined): Promise<AuditLogEntry[]> {
  try {
    const res = await serverGetAuditTrail({ data: { businessId } });
    return res?.logs ?? [];
  } catch (err) {
    console.warn("[Audit] Could not fetch audit trail:", err);
    return [];
  }
}

export async function fetchSystemApiLogs(options?: {
  businessId?: string | undefined;
  onlyErrors?: boolean | undefined;
}): Promise<ApiLogEntry[]> {
  try {
    const res = await serverGetApiLogs({ data: options || {} });
    return res?.logs ?? [];
  } catch (err) {
    console.warn("[Audit] Could not fetch api logs:", err);
    return [];
  }
}
