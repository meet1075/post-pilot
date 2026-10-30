export type PostStatus = "Posted" | "Scheduled" | "Draft";
export type Platform = "Instagram" | "Facebook" | "X";

export interface SocialPost {
  id: string;
  businessId?: string | undefined;
  socialAccountId?: string | null | undefined;
  headline: string;
  caption: string;
  date: string;
  time: string;
  status: PostStatus;
  platform: Platform;
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
  venue_text?: string | undefined;
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
  brandKit?: { businessName?: string | undefined; tagline?: string | undefined; colors?: string[] | undefined; businessId?: string | undefined } | undefined,
  count = 2,
  format?: "Square" | "Portrait 4:5" | "Story" | undefined,
  businessId?: string | undefined,
  socialAccountId?: string | null | undefined
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
  const headline = prompt.trim() || "Transforming ideas into reality";

  const brandColors = (brandKit?.colors && brandKit.colors.length > 0)
    ? brandKit.colors.map((c) => c.toLowerCase())
    : ["tomato", "olive", "mustard", "plum"];

  const brandEyebrow = brandKit?.businessName ? brandKit.businessName.toUpperCase() : null;
  const brandFooter = brandKit?.tagline || "IDEAS INTO SCALABLE PRODUCTS";

  const fallbackImage = prompt.toLowerCase().includes("coffee") || prompt.toLowerCase().includes("brunch") || prompt.toLowerCase().includes("cafe")
    ? SHOWCASE_CAFE_URL
    : SHOWCASE_PIZZA_URL;

  const dayMatch = prompt.match(/\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday|weekend|today|tomorrow)\b/i);
  const dateMatch = prompt.match(/\b(?:\d{1,2}(?:st|nd|rd|th)?\s+(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)|(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+\d{1,2}(?:st|nd|rd|th)?)\b/i);
  const detectedDate = dayMatch ? `THIS ${dayMatch[0].toUpperCase()}` : (dateMatch ? dateMatch[0].toUpperCase() : "");

  return styles.slice(0, count).map((s, index) => ({
    id: `option-${index + 1}`,
    theme: brandColors[index % brandColors.length] || s.theme,
    eyebrow: brandEyebrow || s.eyebrow,
    headline: [headline, "Built for what's next", "A reason to connect", "Experience the difference"][index] ?? headline,
    price,
    date_text: detectedDate || undefined,
    footer: brandFooter,
    imageUrl: fallbackImage,
  }));
}

export async function editPosterWithAi(data: {
  imageUrl: string;
  instruction: string;
  optionId?: string;
  currentBrief?: any;
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
  const offer = price ? ` ${price} —` : "";
  return [
    `Order now: ${headline}${offer}. Handcrafted with passion, shared with love. #QualityFirst #MustTry`,
    `Visit us today for ${headline}${offer}. Made fresh, just for you. #Community #GoodVibes`,
    `Claim your ${headline}${offer} today. The best moments start around our table! ✨ #FeaturedSpot`,
  ];
}

export async function publishPost(post: SocialPost): Promise<SocialPost> {
  try {
    const { createPost } = await import("@/api/posts");
    const { publishPost: serverPublish } = await import("@/api/publish");

    // 1. Create post in Neon DB
    const createRes = await createPost({
      data: {
        headline: post.headline,
        caption: post.caption,
        prompt: post.headline,
        date: post.date,
        time: post.time,
        status: "Draft",
        platform: post.platform,
        theme: post.theme,
        price: post.price,
        image_url: post.imageUrl ?? null,
        business_id: post.businessId,
        social_account_id: post.socialAccountId ?? null,
      },
    });

    if (createRes?.success && createRes.post?.id) {
      // 2. Publish via Zernio to Instagram
      const pubRes = await serverPublish({
        data: {
          post_id: createRes.post.id,
          platforms: [post.platform],
          timing: post.status === "Posted" ? "now" : "schedule",
          scheduled_date: post.date,
          scheduled_time: post.time,
          business_id: post.businessId,
          social_account_id: post.socialAccountId ?? null,
        },
      });

      if (pubRes?.success && pubRes.post) {
        return {
          ...post,
          id: pubRes.post.id,
          status: pubRes.post.status as PostStatus,
        };
      }
    }
  } catch (err) {
    console.warn("[Publish] Live publish failed or demo mode:", err);
  }

  await wait(450);
  return { ...post, id: `post-${Date.now()}` };
}