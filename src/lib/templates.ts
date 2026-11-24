/**
 * PostPilot — Templates Catalog & Helpers
 *
 * Provides ready-to-use flyer templates across common marketing occasions
 * (SaaS & software, Offers & sales, New arrivals, Events & invites, Customer reviews, etc.)
 * matching the inspiration designs.
 */

export interface TemplateItem {
  id: string;
  title: string;
  category: TemplateCategory;
  subtitle: string;
  description: string;
  style: "Bold" | "Minimal" | "Festive" | "Elegant";
  format: "Square" | "Portrait 4:5" | "Story";
  aspectRatio: "4:5" | "1:1" | "9:16";
  previewUrl: string;
  referenceImageUrl?: string;
  defaultPrompt: string;
  wordsOnImage?: string;
  tags: string[];
  occasion?: string;
}

export type TemplateCategory =
  | "All"
  | "Offers & sales"
  | "Event and announcement"
  | "SaaS & software"
  | "New arrival"
  | "Events & invites"
  | "Menu & products"
  | "Before & after"
  | "Customer reviews"
  | "Tips & advice"
  | "Infographic"
  | "Quote"
  | "Giveaway & contest"
  | "Behind the scenes";

export const TEMPLATE_CATEGORIES: TemplateCategory[] = [
  "All",
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
  "SaaS & software",
];

export const R2_PUBLIC_BASE_URL = "https://pub-f951b9a0f9b3407c901fb638d50404db.r2.dev";
export const R2_TEMPLATES_CDN_BASE = `${R2_PUBLIC_BASE_URL}/templates`;

export const TEMPLATES: TemplateItem[] = [
  {
    id: "saas-whatsapp-orbit",
    title: "WhatsApp Inside Orbit",
    category: "SaaS & software",
    subtitle: "Every lead's chat in one place",
    description: "Dark modern software launch card with clean laptop display mockup and date badge.",
    style: "Bold",
    format: "Portrait 4:5",
    aspectRatio: "4:5",
    previewUrl: `${R2_TEMPLATES_CDN_BASE}/saas-whatsapp-orbit.jpg`,
    referenceImageUrl: `${R2_TEMPLATES_CDN_BASE}/saas-whatsapp-orbit.jpg`,
    defaultPrompt:
      "Avero Innovations introduces seamless WhatsApp CRM sync. Modern dark navy background, sleek laptop frame displaying customer chats, high contrast white typography, and launch date badge.",
    wordsOnImage: "WhatsApp Inside Orbit\nEvery lead's chat in one place.\nNov 01 • Available Now",
    tags: ["saas", "software", "crm", "whatsapp", "launch"],
    occasion: "Feature Launch",
  },
  {
    id: "saas-orbit-reports",
    title: "Orbit Reports Monday, In Your Inbox",
    category: "SaaS & software",
    subtitle: "Automated executive summary delivered weekly",
    description: "Minimalist executive dashboard layout highlighting scheduled weekly analytics delivery.",
    style: "Minimal",
    format: "Portrait 4:5",
    aspectRatio: "4:5",
    previewUrl: `${R2_TEMPLATES_CDN_BASE}/saas-orbit-reports.jpg`,
    referenceImageUrl: `${R2_TEMPLATES_CDN_BASE}/saas-orbit-reports.jpg`,
    defaultPrompt:
      "Weekly analytics executive digest delivered to your email every Monday. Clean dark dashboard layout with subtle purple gradients, high contrast data widgets, and calendar marker.",
    wordsOnImage: "Orbit Reports.\nMonday, In your inbox.\nAutomated weekly metrics.",
    tags: ["saas", "analytics", "reports", "automation", "digest"],
    occasion: "Product Update",
  },
  {
    id: "luxury-new-arrival",
    title: "SOMETHING NEW — Luxury Reveal",
    category: "New arrival",
    subtitle: "Elevated product reveal on illuminated podium",
    description: "Ultra-premium golden spotlight on an elevated geometric pedestal with floating crystal facets.",
    style: "Elegant",
    format: "Portrait 4:5",
    aspectRatio: "4:5",
    previewUrl: `${R2_TEMPLATES_CDN_BASE}/new-arrival-dark-gold.jpg`,
    referenceImageUrl: `${R2_TEMPLATES_CDN_BASE}/new-arrival-dark-gold.jpg`,
    defaultPrompt:
      "Exclusive new product reveal on a dark marble illuminated podium surrounded by floating geometric crystalline prisms and warm volumetric spotlight. Elegant serif typography: SOMETHING NEW.",
    wordsOnImage: "SOMETHING NEW\nNow Available • Limited Edition",
    tags: ["new arrival", "luxury", "product", "podium", "exclusive"],
    occasion: "Product Drop",
  },
  {
    id: "new-arrival-white-marble",
    title: "SOMETHING NEW — Minimal White Marble",
    category: "New arrival",
    subtitle: "Clean architectural marble pedestal with floating modern frames",
    description: "Sophisticated white marble pedestal and crisp daylight studio photography.",
    style: "Minimal",
    format: "Portrait 4:5",
    aspectRatio: "4:5",
    previewUrl: `${R2_TEMPLATES_CDN_BASE}/new-arrival-white-marble.jpg`,
    referenceImageUrl: `${R2_TEMPLATES_CDN_BASE}/new-arrival-white-marble.jpg`,
    defaultPrompt:
      "Modern minimalist product release on an elevated white marble block pedestal. Crisp clean architectural shadows, floating geometric frames, and bold black typography.",
    wordsOnImage: "SOMETHING NEW\nNow Available • Launch Price 20% Off",
    tags: ["new arrival", "minimal", "marble", "pedestal", "clean"],
    occasion: "Product Drop",
  },
  {
    id: "new-arrival-blue-crystal",
    title: "Introducing Something New — Crystal Spotlight",
    category: "New arrival",
    subtitle: "Vibrant sapphire blue backdrop with floating crystals and spotlight",
    description: "Striking blue podium with floating crystalline shards and high contrast typography.",
    style: "Bold",
    format: "Portrait 4:5",
    aspectRatio: "4:5",
    previewUrl: `${R2_TEMPLATES_CDN_BASE}/new-arrival-blue-crystal.jpg`,
    referenceImageUrl: `${R2_TEMPLATES_CDN_BASE}/new-arrival-blue-crystal.jpg`,
    defaultPrompt:
      "Introducing something new product launch poster with vibrant sapphire blue lighting, centered pedestal with dramatic top spotlight, and floating crystalline prisms.",
    wordsOnImage: "Introducing Something New\nLaunch Price 20% Off",
    tags: ["new arrival", "blue", "spotlight", "crystal", "launch"],
    occasion: "Feature Launch",
  },
  {
    id: "weekend-sale-boutique",
    title: "This WEEKEND — Exclusive Sale",
    category: "Offers & sales",
    subtitle: "Two days only special discount with warm boutique aesthetics",
    description: "Warm artisanal café & boutique flyer with gold script typography and cozy ambient light.",
    style: "Festive",
    format: "Portrait 4:5",
    aspectRatio: "4:5",
    previewUrl: `${R2_TEMPLATES_CDN_BASE}/weekend-sale-boutique.jpg`,
    referenceImageUrl: `${R2_TEMPLATES_CDN_BASE}/weekend-sale-boutique.jpg`,
    defaultPrompt:
      "Exclusive weekend special offer with 30% off across handcrafted selection. Warm inviting ambient sunlight, artisanal lifestyle arrangement, and elegant gold script accents.",
    wordsOnImage: "This WEEKEND\nSaturday and Sunday Only • Flat 30% Off",
    tags: ["offers", "sale", "weekend", "discount", "boutique"],
    occasion: "Weekend Promo",
  },
  {
    id: "festive-red-mega-sale",
    title: "Festive Mega SALE",
    category: "Event and announcement",
    subtitle: "Celebratory shopping festival with gold ribbons & luxury gift bags",
    description: "High-impact retail promotion with vibrant crimson backdrop, gold confetti, and 3D SALE lettering.",
    style: "Bold",
    format: "Portrait 4:5",
    aspectRatio: "4:5",
    previewUrl: `${R2_TEMPLATES_CDN_BASE}/festive-red-mega-sale.jpg`,
    referenceImageUrl: `${R2_TEMPLATES_CDN_BASE}/festive-red-mega-sale.jpg`,
    defaultPrompt:
      "Festive holiday mega sale with rich crimson red backdrop, celebratory gold ribbon swirls, luxury glossy shopping bags, and bold 3D embossed SALE typography.",
    wordsOnImage: "SALE • THIS WEEK ONLY\nSave up to 50% on all orders",
    tags: ["sale", "offers", "event and announcement", "diwali offer", "mega sale", "festive"],
    occasion: "Holiday Sale",
  },
  {
    id: "cricket-tournament-championship",
    title: "Corporate Cricket Championship",
    category: "Events & invites",
    subtitle: "Night floodlights, trophy celebration, and employee tournament action",
    description: "Electrifying stadium atmosphere with championship trophy, floodlights, and team camaraderie.",
    style: "Bold",
    format: "Portrait 4:5",
    aspectRatio: "4:5",
    previewUrl: `${R2_TEMPLATES_CDN_BASE}/cricket-tournament-championship.jpg`,
    referenceImageUrl: `${R2_TEMPLATES_CDN_BASE}/cricket-tournament-championship.jpg`,
    defaultPrompt:
      "Avero innovations is organizing a cricket tournament for all employees at Rajpath club ground. Match timing 9pm to 1am from 25-27 nov, ₹1 Lakh prizepool for the winner team. Please come with your team t-shirts.",
    wordsOnImage: "CRICKET TOURNAMENT\n25-27 Nov • Rajpath Club Ground • ₹1 Lakh Prize Pool",
    tags: ["events", "invites", "cricket", "tournament", "sports", "championship"],
    occasion: "Sports Event",
  },
  {
    id: "easy-emi-smart-finance",
    title: "EASY EMI — Zero Cost Financing",
    category: "Offers & sales",
    subtitle: "Fintech & retail financing promo with floating 3D coins & cards",
    description: "Modern fintech card with floating gold coins, payment card mockup, and clear call-to-action.",
    style: "Bold",
    format: "Square",
    aspectRatio: "1:1",
    previewUrl: `${R2_TEMPLATES_CDN_BASE}/easy-emi-smart-finance.jpg`,
    referenceImageUrl: `${R2_TEMPLATES_CDN_BASE}/easy-emi-smart-finance.jpg`,
    defaultPrompt:
      "Smart financing made easy with zero down payment and flexible EMI options. Clean vibrant cyan-blue background with glossy 3D gold coins and gift box.",
    wordsOnImage: "EASY EMI\nNo Cost • Zero Down Payment • Apply in 60s",
    tags: ["emi", "finance", "offers", "sales", "fintech"],
    occasion: "Financing Offer",
  },
  {
    id: "customer-social-proof",
    title: "Customer Review & Social Proof",
    category: "Customer reviews",
    subtitle: "5-star rating, genuine client testimonial, and verified badge",
    description: "Clean editorial card showcasing client satisfaction, bold rating stars, and verified quotes.",
    style: "Minimal",
    format: "Square",
    aspectRatio: "1:1",
    previewUrl: `${R2_TEMPLATES_CDN_BASE}/customer-social-proof.jpg`,
    referenceImageUrl: `${R2_TEMPLATES_CDN_BASE}/customer-social-proof.jpg`,
    defaultPrompt:
      "Client testimonial highlighting 5-star experience, rapid turnaround, and scalable software architecture. Elegant quote marks and sleek verification badge.",
    wordsOnImage: "5-Star Experience\n'dIyA transformed our social reach overnight.'\n— Verified Client",
    tags: ["customer reviews", "social proof", "testimonial", "quote"],
    occasion: "Testimonial",
  },
  {
    id: "chef-special-menu",
    title: "Gourmet Menu & Product Highlights",
    category: "Menu & products",
    subtitle: "Appetizing dish presentation with price badge and fresh herbs",
    description: "Rich top-down food photography with warm lighting and bold promotional pricing pill.",
    style: "Festive",
    format: "Portrait 4:5",
    aspectRatio: "4:5",
    previewUrl: `${R2_TEMPLATES_CDN_BASE}/chef-special-menu.jpg`,
    referenceImageUrl: `${R2_TEMPLATES_CDN_BASE}/chef-special-menu.jpg`,
    defaultPrompt:
      "Delicious artisanal specialty combo meal with fresh gourmet ingredients, dramatic warm top-down lighting, and clean transparent pricing pills.",
    wordsOnImage: "Chef's Signature Special\nHandcrafted Daily • Order Now",
    tags: ["menu", "food", "products", "restaurant"],
    occasion: "Food Special",
  },
  {
    id: "tech-multilingual-support",
    title: "Multi-Language Support Announcement",
    category: "SaaS & software",
    subtitle: "Software toggle card showcasing global language support",
    description: "Sleek SaaS product release featuring iOS/Android style toggle settings and language list.",
    style: "Minimal",
    format: "Portrait 4:5",
    aspectRatio: "4:5",
    previewUrl: `${R2_TEMPLATES_CDN_BASE}/saas-multilingual-hindi.jpg`,
    referenceImageUrl: `${R2_TEMPLATES_CDN_BASE}/saas-multilingual-hindi.jpg`,
    defaultPrompt:
      "Software platform feature announcement showcasing multi-language localization with sleek toggle switches and floating UI badges.",
    wordsOnImage: "Now Speaks Hindi & 10+ Languages\nInstant localized experience.",
    tags: ["features", "saas", "software", "update", "languages"],
    occasion: "Feature Drop",
  },
  {
    id: "team-milestone-growth",
    title: "10,000 Workspaces Strong",
    category: "Behind the scenes",
    subtitle: "Celebrating business milestone with genuine team energy",
    description: "Inspiring full-height vertical story celebrating company milestones and community trust.",
    style: "Elegant",
    format: "Story",
    aspectRatio: "9:16",
    previewUrl: `${R2_TEMPLATES_CDN_BASE}/team-milestone-growth.jpg`,
    referenceImageUrl: `${R2_TEMPLATES_CDN_BASE}/team-milestone-growth.jpg`,
    defaultPrompt:
      "Celebrating reaching 10,000 active business workspaces. Warm celebratory team huddle, energetic lighting, and clean milestone statistic badge.",
    wordsOnImage: "10,000 Teams Strong\nThank you for growing with us.",
    tags: ["behind the scenes", "milestone", "team", "celebration", "growth"],
    occasion: "Milestone",
  },
  {
    id: "pro-marketing-tip",
    title: "Pro Tip: 1 Bold Idea Per Post",
    category: "Tips & advice",
    subtitle: "Numbered editorial insight for high-converting social designs",
    description: "Clean numbered editorial card with actionable marketing advice and strong typographic hierarchy.",
    style: "Minimal",
    format: "Portrait 4:5",
    aspectRatio: "4:5",
    previewUrl: `${R2_TEMPLATES_CDN_BASE}/pro-marketing-tip.jpg`,
    referenceImageUrl: `${R2_TEMPLATES_CDN_BASE}/pro-marketing-tip.jpg`,
    defaultPrompt:
      "3 Proven Rules for High-Converting Social Media Visuals. Clean editorial carousel slide with high contrast typography and numbered layout.",
    wordsOnImage: "Pro Tip of the Week\nFocus on 1 Bold Idea per Post.",
    tags: ["tips", "advice", "infographic", "marketing"],
    occasion: "Weekly Tips",
  },
  {
    id: "before-after-transformation",
    title: "Before & After: Social Growth",
    category: "Before & after",
    subtitle: "High impact split card comparing manual vs automated results",
    description: "Clear before/after transformation layout showing time saved and reach increase.",
    style: "Bold",
    format: "Portrait 4:5",
    aspectRatio: "4:5",
    previewUrl: `${R2_TEMPLATES_CDN_BASE}/before-after-transformation.jpg`,
    referenceImageUrl: `${R2_TEMPLATES_CDN_BASE}/before-after-transformation.jpg`,
    defaultPrompt:
      "Before and after social media transformation. Split screen layout showcasing 3 hours manual design reduced to 30 seconds AI generation, with +450% social reach.",
    wordsOnImage: "Before & After • dIyA Marketing Engine\n30 Seconds / Post • +450% Reach",
    tags: ["before & after", "transformation", "case study", "growth", "results"],
    occasion: "Case Study",
  },
  {
    id: "quote-founder-vision",
    title: "Leadership & Vision Quote",
    category: "Quote",
    subtitle: "Inspirational editorial typography with large quotes and brand badge",
    description: "Editorial leadership thought layout designed to build authority and foster discussion.",
    style: "Elegant",
    format: "Portrait 4:5",
    aspectRatio: "4:5",
    previewUrl: `${R2_TEMPLATES_CDN_BASE}/quote-founder-vision.jpg`,
    referenceImageUrl: `${R2_TEMPLATES_CDN_BASE}/quote-founder-vision.jpg`,
    defaultPrompt:
      "Inspirational leadership quote card for entrepreneurs and marketing leaders. Large quotation marks, dark editorial background, refined serif typography.",
    wordsOnImage: "“Great companies aren't built by doing everything manually.”\n— Leadership Insight",
    tags: ["quote", "quotes", "leadership", "inspiration", "vision", "founder"],
    occasion: "Weekly Inspiration",
  },
  {
    id: "giveaway-contest-alert",
    title: "Mega Giveaway & Contest",
    category: "Giveaway & contest",
    subtitle: "High-energy neon celebration flyer with step-by-step entry rules",
    description: "Vibrant promotional giveaway flyer with prize badges, 3 entry steps, and live winner date.",
    style: "Festive",
    format: "Portrait 4:5",
    aspectRatio: "4:5",
    previewUrl: `${R2_TEMPLATES_CDN_BASE}/giveaway-contest-alert.jpg`,
    referenceImageUrl: `${R2_TEMPLATES_CDN_BASE}/giveaway-contest-alert.jpg`,
    defaultPrompt:
      "Mega giveaway and contest announcement with neon pink and gold aesthetic, ₹50,000 prize pool, 3 numbered entry steps, and festive party accents.",
    wordsOnImage: "MEGA GIVEAWAY • Win ₹50,000 Prizes\nFollow, Tag 2 Friends, Share to Story",
    tags: ["giveaway & contest", "contest", "giveaway", "win", "prizes", "competition"],
    occasion: "Contest",
  },
];

export function getTemplateById(id: string): TemplateItem | undefined {
  return TEMPLATES.find((t) => t.id === id);
}

export function filterTemplates(options: {
  query?: string;
  category?: TemplateCategory;
  style?: string;
  aspectRatio?: string;
}): TemplateItem[] {
  let list = TEMPLATES;

  if (options.category && options.category !== "All") {
    list = list.filter((t) => t.category === options.category);
  }

  if (options.style && options.style !== "All") {
    list = list.filter((t) => t.style.toLowerCase() === options.style?.toLowerCase());
  }

  if (options.aspectRatio && options.aspectRatio !== "All") {
    list = list.filter((t) => t.aspectRatio === options.aspectRatio);
  }

  if (options.query && options.query.trim()) {
    const q = options.query.trim().toLowerCase();
    list = list.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.subtitle.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        t.tags.some((tag) => tag.toLowerCase().includes(q))
    );
  }

  return list;
}

