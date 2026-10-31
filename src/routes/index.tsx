import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowDownToLine,
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Copy,
  ExternalLink,
  Eye,
  Instagram,
  Layers,
  LayoutGrid,
  Link2,
  List,
  LoaderCircle,
  LogOut,
  Menu,
  MoreHorizontal,
  Palette,
  Plus,
  Send,
  Settings2,
  ShieldCheck,
  Sparkles,
  Upload,
  X,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  generatePosters,
  editPosterWithAi,
  publishPost,
  suggestCaptions,
  type Platform,
  type PosterOption,
  type PostStatus,
  type SocialPost,
} from "@/lib/mockApi";
import { signIn, signOut, useSession, getSession } from "@/lib/auth-client";
import { getSession as getServerSession } from "@/api/auth";
import { getAccounts, connectAccount, disconnectAccount, getZernioConnectUrl, type SocialAccountItem } from "@/api/accounts";
import { getPosts } from "@/api/posts";
import { uploadPosterDataUrl } from "@/api/posters";
import { getBrandKit, updateBrandKit, uploadBrandLogo } from "@/api/brand-kit";
import {
  listUserBusinesses,
  getBusiness,
  createBusiness,
  updateBusiness,
  deleteBusiness,
  type BusinessSummaryItem,
} from "@/api/businesses";
import { renderPosterCanvas } from "@/lib/posterCanvas";
import { REGEX, generatePostersSchema } from "@/lib/validators";
import { LandingPage } from "@/components/LandingPage";

type Page = "Home" | "Create" | "Scheduled" | "Posted" | "Brand kit" | "Accounts" | "Settings";

export const Route = createFileRoute("/")({
  loader: async () => {
    try {
      const res = await getServerSession();
      return {
        initialUser: res?.session
          ? {
              id: (res.session as any).userId,
              email: (res.session as any).email,
              name: (res.session as any).name,
              image: (res.session as any).image,
            }
          : null,
      };
    } catch {
      return { initialUser: null };
    }
  },
  head: () => ({
    meta: [
      { title: "PostPilot — Social posts, made simple | AI Social Media Generator" },
      {
        name: "description",
        content:
          "Turn ideas into published social media posts in seconds. AI poster design, automated copywriting, custom brand kits, and direct Instagram scheduling for growing businesses.",
      },
      {
        name: "keywords",
        content:
          "social media manager, AI poster generator, Instagram scheduler, content calendar, brand kit design, automated social media, small business marketing, PostPilot",
      },
      { name: "robots", content: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" },
      { name: "theme-color", content: "#C84B31" },
      { name: "application-name", content: "PostPilot" },
      { name: "apple-mobile-web-app-title", content: "PostPilot" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "default" },

      // Open Graph (Facebook, LinkedIn, WhatsApp)
      { property: "og:site_name", content: "PostPilot" },
      { property: "og:type", content: "website" },
      { property: "og:title", content: "PostPilot — Social posts, made simple" },
      {
        property: "og:description",
        content:
          "AI-driven poster generation, smart caption copywriting, and 1-click Instagram publishing tailored for modern brands.",
      },
      { property: "og:url", content: "http://localhost:8080/" },
      { property: "og:image", content: "http://localhost:8080/og-image.png" },
      { property: "og:image:secure_url", content: "http://localhost:8080/og-image.png" },
      { property: "og:image:type", content: "image/png" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:image:alt", content: "PostPilot AI Social Media Creator and Content Calendar" },
      { property: "og:locale", content: "en_US" },

      // Twitter Cards
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:site", content: "@PostPilot" },
      { name: "twitter:creator", content: "@PostPilot" },
      { name: "twitter:title", content: "PostPilot — Social posts, made simple" },
      {
        name: "twitter:description",
        content:
          "Turn ideas into published social media posts in seconds with AI poster generation and seamless Instagram scheduling.",
      },
      { name: "twitter:image", content: "http://localhost:8080/og-image.png" },
      { name: "twitter:image:alt", content: "PostPilot AI Social Media Platform" },
    ],
    links: [
      { rel: "canonical", href: "http://localhost:8080/" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: "PostPilot",
          url: "http://localhost:8080/",
          description: "AI-powered social media post generator, brand kit styling, and scheduled publishing for businesses.",
          applicationCategory: "BusinessApplication",
          operatingSystem: "All modern web browsers",
          image: "http://localhost:8080/og-image.png",
          screenshot: "http://localhost:8080/og-image.png",
          featureList: [
            "AI-powered poster generator and layout designer",
            "Context-aware social caption suggestions",
            "Brand kit color palette and typography integration",
            "Multi-platform scheduling calendar",
            "Direct Instagram publishing via Zernio",
          ],
          offers: {
            "@type": "Offer",
            price: "0",
            priceCurrency: "USD",
            category: "Free",
          },
        }),
      },
    ],
  }),
  component: PostPilot,
});

const navItems: { name: Page; icon: typeof LayoutGrid }[] = [
  { name: "Home", icon: LayoutGrid },
  { name: "Create", icon: Plus },
  { name: "Scheduled", icon: CalendarDays },
  { name: "Posted", icon: Send },
  { name: "Brand kit", icon: Palette },
  { name: "Accounts", icon: Link2 },
  { name: "Settings", icon: Settings2 },
];

export interface BrandKitData {
  businessId?: string | undefined;
  businessName: string;
  tagline: string;
  location: string;
  phone: string;
  colors: string[];
  font: string;
  tone?: string | undefined;
  timezone?: string | undefined;
  defaultHashtags?: string | undefined;
  logoName?: string | undefined;
  logoUrl?: string | undefined;
}

const initialOptions: PosterOption[] = [];
const palette = [
  { name: "Tomato", className: "brand-swatch--tomato" },
  { name: "Olive", className: "brand-swatch--olive" },
  { name: "Mustard", className: "brand-swatch--mustard" },
  { name: "Plum", className: "brand-swatch--plum" },
  { name: "Sky", className: "brand-swatch--sky" },
];

function PostPilot() {
  const loaderData = Route.useLoaderData();
  const { data: session, isPending: isSessionPending } = useSession();
  const [clientChecked, setClientChecked] = useState(false);
  const [clientUser, setClientUser] = useState<any>(null);

  useEffect(() => {
    if (loaderData?.initialUser || session?.user) {
      setClientChecked(true);
      return;
    }

    // Query client session to ensure freshly established cookies from OAuth callback are recognized immediately
    getSession()
      .then((res) => {
        if (res?.data?.user) {
          setClientUser(res.data.user);
        }
      })
      .catch(() => {})
      .finally(() => {
        setClientChecked(true);
      });
  }, [session?.user, loaderData?.initialUser]);

  const [page, setPage] = useState<Page>("Home");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [posts, setPosts] = useState<SocialPost[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const cached = localStorage.getItem("postpilot_cached_posts");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [];
  });
  const [loadingPosts, setLoadingPosts] = useState(() => {
    if (typeof window === "undefined") return true;
    try {
      const cached = localStorage.getItem("postpilot_cached_posts");
      if (cached && JSON.parse(cached).length > 0) return false;
    } catch {}
    return true;
  });
  const [selectedPostForDetail, setSelectedPostForDetail] = useState<SocialPost | null>(null);
  const [businessMenuOpen, setBusinessMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);

  const activeUser = session?.user ?? clientUser ?? (loaderData?.initialUser as any);
  const isMeetSoni = activeUser?.email === "meetsoni1075@gmail.com";

  // Multi-business workspace state
  const [businesses, setBusinesses] = useState<BusinessSummaryItem[]>([]);
  const [activeBusinessId, setActiveBusinessId] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("postpilot_active_business_id") || "";
    }
    return "";
  });
  const [billingInfo, setBillingInfo] = useState<{ isFreeTier: boolean; notice: string; totalAccounts: number }>({
    isFreeTier: true,
    notice: "Free Tier: 2 connected accounts included.",
    totalAccounts: 0,
  });

  // Modal dialog states
  const [addBusinessModalOpen, setAddBusinessModalOpen] = useState(false);
  const [connectPromptOpen, setConnectPromptOpen] = useState(false);
  const [connectPromptBiz, setConnectPromptBiz] = useState<{ id: string; name: string } | null>(null);

  // New business form fields
  const [newBizName, setNewBizName] = useState("");
  const [newBizTagline, setNewBizTagline] = useState("");
  const [newBizLogoUrl, setNewBizLogoUrl] = useState("");
  const [newBizColors, setNewBizColors] = useState<string[]>(["Tomato", "Olive"]);
  const [newBizTone, setNewBizTone] = useState("Friendly");
  const [newBizTimezone, setNewBizTimezone] = useState("Asia/Kolkata");
  const [creatingBusiness, setCreatingBusiness] = useState(false);
  const [uploadingNewBizLogo, setUploadingNewBizLogo] = useState(false);

  // Persistent brand kit state shared across CreateFlow and BrandKit
  const [brandKit, setBrandKit] = useState<BrandKitData>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("postpilot_brand_kit");
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return {
      businessName: isMeetSoni ? "Avero Innovations" : "My Workspace",
      tagline: "Ideas into scalable products.",
      location: "Ahmedabad / Global",
      phone: "+91 98765 43210",
      colors: ["Olive", "Tomato"],
      font: "Fraunces",
    };
  });

  const businessName = brandKit.businessName;
  const setBusinessName = (name: string) => {
    setBrandKit((prev) => {
      const updated = { ...prev, businessName: name };
      try {
        localStorage.setItem("postpilot_brand_kit", JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  // Connected accounts for active business
  const [connectedAccounts, setConnectedAccounts] = useState<Array<{
    id?: string;
    platform: string;
    handle: string;
    status?: string;
    externalAccountId?: string;
  }>>([]);

  // Load and refresh workspace data per active business
  const refreshWorkspace = async (targetId?: string) => {
    try {
      const bizRes = await listUserBusinesses();
      if (bizRes && "data" in bizRes && bizRes.data) {
        const list: BusinessSummaryItem[] = bizRes.data.businesses || [];
        setBusinesses(list);

        const chosenId = targetId || activeBusinessId || localStorage.getItem("postpilot_active_business_id") || bizRes.data.activeBusinessId || list[0]?.id;

        if (chosenId) {
          setActiveBusinessId(chosenId);
          try {
            localStorage.setItem("postpilot_active_business_id", chosenId);
            document.cookie = `postpilot_active_business=${encodeURIComponent(chosenId)}; path=/; max-age=31536000`;
          } catch {}

          // Load active business brand kit
          const bRes = await getBusiness({ data: { businessId: chosenId } });
          if (bRes?.success && bRes.business) {
            const b = bRes.business;
            setBrandKit({
              businessId: b.id,
              businessName: b.name,
              tagline: b.tagline || "",
              location: b.location || "",
              phone: b.phone || "",
              colors: Array.isArray(b.brand_colors) && b.brand_colors.length > 0 ? b.brand_colors : ["Tomato", "Olive"],
              font: "Fraunces",
              tone: b.tone || "Friendly",
              timezone: b.timezone || "UTC",
              defaultHashtags: b.default_hashtags || "",
              logoUrl: b.logo_url || undefined,
            });
          }

          // Load accounts for this business
          const accRes = await getAccounts({ data: { businessId: chosenId } });
          if (accRes && "data" in accRes && accRes.data) {
            const accs = accRes.data.accounts;
            if (Array.isArray(accs)) {
              const mapped = accs
                .filter((a: any) => a.status === "connected")
                .map((a: any) => ({
                  id: a.id,
                  platform: a.platform,
                  handle: a.username || a.platform_handle || "Connected",
                  status: a.status,
                  externalAccountId: a.external_account_id,
                }));
              setConnectedAccounts(mapped);
            }
            if (accRes.data.billing) {
              setBillingInfo({
                isFreeTier: accRes.data.billing.isFreeTier,
                notice: accRes.data.billing.notice,
                totalAccounts: (accRes.data.billing as any).totalAccounts ?? (accRes.data.totalConnectedAccounts ?? 0),
              });
            }
          }

          // Load posts for this business
          setLoadingPosts(true);
          const postsRes = await getPosts({ data: { businessId: chosenId } });
          if (postsRes && "data" in postsRes && postsRes.data) {
            const rawPosts = postsRes.data.posts;
            if (Array.isArray(rawPosts)) {
              const mapped: SocialPost[] = rawPosts.map((p: any) => {
                let dateStr = "";
                if (p.date) {
                  dateStr = typeof p.date === "string" ? p.date.slice(0, 10) : new Date(p.date).toISOString().slice(0, 10);
                }
                return {
                  id: p.id,
                  businessId: p.business_id,
                  socialAccountId: p.social_account_id ?? undefined,
                  headline: p.headline,
                  caption: p.caption,
                  date: dateStr,
                  time: p.time ? String(p.time).slice(0, 5) : "",
                  status: (p.status === "Failed" ? "Draft" : p.status) as PostStatus,
                  platform: p.platform as Platform,
                  theme: p.theme || "tomato",
                  price: p.price || "",
                  imageUrl: p.image_url ?? undefined,
                };
              });
              setPosts(mapped);
              try {
                localStorage.setItem("postpilot_cached_posts", JSON.stringify(mapped));
              } catch {}
            }
          }
          setLoadingPosts(false);
        }
      }
    } catch (err) {
      console.error("[refreshWorkspace Error]", err);
      setLoadingPosts(false);
    }
  };

  // Keep in sync whenever activeUser changes
  useEffect(() => {
    if (!activeUser) return;
    refreshWorkspace();
  }, [activeUser?.id, activeUser?.email]);

  const handleSwitchBusiness = async (bizId: string) => {
    setBusinessMenuOpen(false);
    const target = businesses.find((b) => b.id === bizId);
    if (!target) return;
    toast(`Switching to workspace: ${target.name}...`);
    await refreshWorkspace(bizId);
    toast.success(`Active workspace: ${target.name}`);
  };

  const handleAddBusinessSubmit = async () => {
    if (!newBizName.trim()) {
      toast.error("Please enter a business name");
      return;
    }
    setCreatingBusiness(true);
    try {
      const res = await createBusiness({
        data: {
          name: newBizName.trim(),
          tagline: newBizTagline.trim(),
          logo_url: newBizLogoUrl || null,
          brand_colors: newBizColors,
          tone: newBizTone as any,
          timezone: newBizTimezone,
        },
      });

      if (res && (res.status === "success" || (res as any).success)) {
        const createdBiz = (res as any).data?.business || (res as any).business;
        toast.success(`Workspace "${createdBiz.name}" created!`);
        setAddBusinessModalOpen(false);
        setNewBizName("");
        setNewBizTagline("");
        setNewBizLogoUrl("");
        await refreshWorkspace(createdBiz.id);
        // Prompt user to connect Instagram for this new business
        setConnectPromptBiz({ id: createdBiz.id, name: createdBiz.name });
        setConnectPromptOpen(true);
      } else {
        toast.error((res as any)?.message || "Failed to create business");
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to create business");
    } finally {
      setCreatingBusiness(false);
    }
  };

  const handleDeleteBusiness = async (bizId: string) => {
    try {
      const res = await deleteBusiness({ data: { business_id: bizId } });
      if (res && (res.status === "success" || (res as any).success)) {
        toast.success((res as any)?.message || "Business deleted");
        await refreshWorkspace();
      } else {
        toast.error((res as any)?.message || "Could not delete business");
      }
    } catch (err: any) {
      toast.error(err?.message || "Could not delete business");
    }
  };

  const startOAuthForBiz = async (bizId: string, platform: Platform = "Instagram") => {
    try {
      toast.info(`Connecting ${platform} account...`);
      const res = await getZernioConnectUrl({
        data: {
          platform,
          businessId: bizId,
          origin: typeof window !== "undefined" ? window.location.origin : undefined,
        },
      });
      const url = (res as any)?.data?.url ?? (res as any)?.url;
      if (url) {
        window.location.href = url;
        return;
      }
      const errMsg = (res as any)?.error?.message || (res as any)?.message || `Could not obtain connect URL for ${platform}`;
      toast.error(errMsg);
    } catch (err: any) {
      toast.error(err?.message || `Failed to initiate ${platform} connect`);
    }
  };

  const instagramAccount = connectedAccounts.find(
    (a) => a.platform.toLowerCase() === "instagram"
  );
  const isInstagramConnected = Boolean(instagramAccount);
  const instagramHandle = instagramAccount?.handle || "";

  const userName = activeUser?.name || (isMeetSoni ? "Meet Soni" : "User");
  const userEmail = activeUser?.email || (isMeetSoni ? "meetsoni1075@gmail.com" : "");
  const userAvatar = activeUser?.image;
  const userInitial = (activeUser?.name || activeUser?.email || "U").charAt(0).toUpperCase();
  const businessInitial = (businessName || "M").charAt(0).toUpperCase();

  const navigate = (nextPage: Page) => {
    setPage(nextPage);
    setMobileNavOpen(false);
    setBusinessMenuOpen(false);
  };

  // If session is still verifying, show clean splash screen to avoid login screen flash
  if ((isSessionPending && !activeUser) || (!activeUser && !clientChecked)) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <div className="flex items-center gap-3 animate-pulse">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Send className="h-5 w-5" />
          </span>
          <span className="font-display text-2xl font-medium tracking-tight">postpilot</span>
        </div>
      </div>
    );
  }

  const isAuthenticated = Boolean(activeUser);

  if (!isAuthenticated) {
    return <SignInScreen />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary/25 selection:text-primary">
      <header className="sticky top-0 z-30 flex h-[68px] items-center justify-between border-b border-white/[0.08] bg-background/80 backdrop-blur-xl">
        <div className="flex h-full items-center">
          {/* Logo block: exact width matches sidebar (w-[260px]) with matching border-r on desktop */}
          <div className="flex h-full items-center gap-3 px-4 sm:px-6 md:w-[260px] md:border-r md:border-white/[0.08] md:px-5">
            <Button
              variant="ghost"
              size="icon"
              className="-ml-1 md:hidden"
              aria-label="Open navigation"
              onClick={() => setMobileNavOpen(!mobileNavOpen)}
            >
              {mobileNavOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            <button
              className="group flex items-center gap-2.5 text-left focus-visible:outline-none"
              onClick={() => navigate("Home")}
              aria-label="PostPilot home"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-primary via-orange-500 to-rose-500 text-white shadow-md shadow-primary/25 transition-transform group-hover:scale-105 active:scale-95">
                <Send className="h-4 w-4" />
              </span>
              <span className="font-display text-[22px] font-semibold leading-none tracking-tight text-foreground">postpilot</span>
            </button>
          </div>

          {/* Business Switcher in top bar (visible on mobile and desktop) */}
          <div className="relative flex items-center px-2 sm:px-4">
            <Button
              variant="ghost"
              className="h-9 gap-2.5 rounded-xl border border-white/[0.08] bg-secondary/40 px-3 text-xs font-medium text-foreground hover:bg-secondary/70 hover:border-primary/40 transition-all"
              onClick={() => setBusinessMenuOpen(!businessMenuOpen)}
              aria-expanded={businessMenuOpen}
            >
              {brandKit.logoUrl ? (
                <div className="h-5 w-5 rounded-md overflow-hidden border border-white/10 bg-white p-0.5 shrink-0 flex items-center justify-center shadow-xs">
                  <img src={brandKit.logoUrl} alt="Logo" className="h-full w-full object-contain" />
                </div>
              ) : (
                <span className="flex h-5 w-5 items-center justify-center rounded-md bg-primary/20 text-[10px] font-bold text-primary">{businessInitial}</span>
              )}
              <span className="font-semibold max-w-[140px] truncate">{businessName}</span>
              <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[9px] font-semibold text-emerald-400">Active</span>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground transition-transform duration-200" />
            </Button>
            {businessMenuOpen && (
              <div className="absolute left-2 sm:left-4 top-11 z-50 w-72 rounded-2xl border border-white/[0.1] bg-card/95 p-2 shadow-2xl backdrop-blur-xl animate-in fade-in-50 zoom-in-95">
                <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                  <span>YOUR WORKSPACES</span>
                  <span className="text-[10px] text-muted-foreground font-mono">{businesses.length}/10</span>
                </div>
                <div className="max-h-56 overflow-y-auto space-y-1 py-1">
                  {businesses.map((biz) => {
                    const isActive = biz.id === activeBusinessId || biz.name === businessName;
                    return (
                      <button
                        key={biz.id}
                        type="button"
                        className={`w-full flex items-center justify-between rounded-xl px-2.5 py-2 text-xs transition-colors ${
                          isActive ? "bg-primary/10 font-semibold text-primary border border-primary/20" : "hover:bg-secondary/60 text-muted-foreground hover:text-foreground"
                        }`}
                        onClick={() => handleSwitchBusiness(biz.id)}
                      >
                        <span className="flex items-center gap-2.5 truncate">
                          {biz.logo_url ? (
                            <img src={biz.logo_url} alt="" className="h-5 w-5 rounded object-contain border bg-white p-0.5 shrink-0" />
                          ) : (
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-primary/15 text-[10px] font-bold text-primary">
                              {biz.name.charAt(0).toUpperCase()}
                            </span>
                          )}
                          <span className="truncate">{biz.name}</span>
                        </span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {biz.connected_accounts_count > 0 ? (
                            <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                              <Instagram className="h-3 w-3" /> {biz.connected_accounts_count}
                            </span>
                          ) : (
                            <span className="text-[10px] text-muted-foreground">No accounts</span>
                          )}
                          {isActive && <Check className="h-3.5 w-3.5 text-primary ml-1" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
                <div className="border-t border-white/[0.08] my-1.5" />
                <Button
                  variant="ghost"
                  className="w-full justify-start text-xs font-semibold text-primary hover:text-primary hover:bg-primary/10 h-8 rounded-lg"
                  onClick={() => {
                    setBusinessMenuOpen(false);
                    setAddBusinessModalOpen(true);
                  }}
                >
                  <Plus className="mr-2 h-3.5 w-3.5" /> Add business
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-xs text-muted-foreground hover:text-foreground h-8 rounded-lg"
                  onClick={() => {
                    setBusinessMenuOpen(false);
                    navigate("Settings");
                  }}
                >
                  <Settings2 className="mr-2 h-3.5 w-3.5" /> Business settings
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Header Right */}
        <div className="relative flex items-center gap-3 px-4 sm:px-7">
          <div className="hidden sm:flex items-center gap-2 rounded-full border border-white/[0.08] bg-secondary/40 px-3 py-1 text-xs text-muted-foreground shadow-xs">
            <span className={`h-2 w-2 rounded-full ${isInstagramConnected ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" : "bg-muted-foreground/60"}`} />
            <span className="font-medium text-[11px]">{isInstagramConnected ? "Instagram connected" : "No social connected"}</span>
          </div>
          <span className="hidden text-xs text-muted-foreground/80 lg:inline">Your week, at a glance</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full overflow-hidden border border-white/[0.08] bg-secondary/60 text-sm font-semibold hover:border-primary/50 hover:ring-2 hover:ring-primary/20 transition-all"
            aria-label="Open account menu"
            onClick={() => setAccountMenuOpen(!accountMenuOpen)}
          >
            {userAvatar ? (
              <img
                src={userAvatar}
                alt={userName}
                referrerPolicy="no-referrer"
                className="h-full w-full object-cover"
              />
            ) : (
              userInitial
            )}
          </Button>
          {accountMenuOpen && (
            <div className="absolute right-4 top-12 z-50 w-64 rounded-2xl border border-white/[0.1] bg-card/95 p-2.5 shadow-2xl backdrop-blur-xl animate-in fade-in-50 zoom-in-95">
              <div className="border-b border-white/[0.08] px-2.5 pb-2.5 pt-1">
                <p className="text-sm font-semibold truncate text-foreground">{userName}</p>
                <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
                {activeUser && (
                  <span className="mt-1.5 inline-flex items-center gap-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                    Google Connected
                  </span>
                )}
              </div>
              <Button
                variant="ghost"
                className="mt-1.5 w-full justify-start text-xs rounded-lg"
                onClick={() => {
                  setAccountMenuOpen(false);
                  navigate("Settings");
                }}
              >
                <Settings2 className="mr-2 h-3.5 w-3.5" /> Settings
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start text-xs rounded-lg text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={async () => {
                  setAccountMenuOpen(false);
                  try {
                    await signOut();
                  } catch (err) {
                    console.error("Sign out error:", err);
                  }
                  setClientUser(null);
                  try {
                    localStorage.removeItem("postpilot_cached_posts");
                  } catch {}
                  toast.success("Signed out successfully");
                  window.location.href = "/";
                }}
              >
                <LogOut className="mr-2 h-3.5 w-3.5" /> Sign out
              </Button>
            </div>
          )}
        </div>
      </header>

      {mobileNavOpen && (
        <button
          className="fixed inset-0 z-20 bg-black/60 backdrop-blur-xs md:hidden"
          aria-label="Close navigation"
          onClick={() => setMobileNavOpen(false)}
        />
      )}
      <div className="flex flex-1 w-full">
        <aside
          className={`fixed inset-y-[68px] left-0 z-30 w-[260px] shrink-0 border-r border-white/[0.08] bg-sidebar/95 backdrop-blur-xl transition-transform duration-200 md:sticky md:top-[68px] md:z-10 md:block md:h-[calc(100vh-68px)] md:translate-x-0 ${
            mobileNavOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
          }`}
        >
          <div className="flex h-full flex-col justify-between overflow-y-auto px-4 py-6">
            {/* Top actions & navigation */}
            <div className="space-y-6">
              {/* Primary Create Button */}
              <div>
                <Button
                  onClick={() => navigate("Create")}
                  className={`h-11 w-full justify-center gap-2 rounded-xl font-semibold shadow-lg transition-all duration-200 ${
                    page === "Create"
                      ? "bg-gradient-to-r from-primary to-orange-500 text-white ring-2 ring-primary/40 shadow-primary/30"
                      : "bg-gradient-to-r from-primary via-orange-500 to-rose-500 text-white shadow-primary/20 hover:shadow-primary/35 hover:brightness-105 active:scale-[0.98]"
                  }`}
                >
                  <Plus className="h-4 w-4 stroke-[2.5]" />
                  <span>Create a post</span>
                </Button>
              </div>

              {/* Workspace Navigation */}
              <div>
                <p className="mb-2.5 px-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">
                  WORKSPACE
                </p>
                <nav className="space-y-1" aria-label="Workspace navigation">
                  {[
                    { name: "Home" as Page, icon: LayoutGrid },
                    {
                      name: "Scheduled" as Page,
                      icon: CalendarDays,
                      badge: posts.filter((p) => p.status === "Scheduled").length > 0
                        ? String(posts.filter((p) => p.status === "Scheduled").length)
                        : undefined,
                    },
                    { name: "Posted" as Page, icon: Send },
                  ].map(({ name, icon: Icon, badge }) => {
                    const active = page === name;
                    return (
                      <button
                        key={name}
                        onClick={() => navigate(name)}
                        className={`group relative flex h-10 w-full items-center gap-3 rounded-xl px-3.5 text-sm transition-all duration-150 ${
                          active
                            ? "bg-primary/10 font-semibold text-primary border border-primary/20 shadow-xs"
                            : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground font-medium"
                        }`}
                        aria-current={active ? "page" : undefined}
                      >
                        <Icon
                          className={`h-4 w-4 transition-colors ${
                            active ? "text-primary stroke-[2.2]" : "text-muted-foreground group-hover:text-foreground"
                          }`}
                        />
                        <span>{name}</span>
                        {badge && (
                          <span
                            className={`ml-auto flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold ${
                              active ? "bg-primary text-white" : "bg-secondary text-muted-foreground border border-border/60"
                            }`}
                          >
                            {badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* Manage Navigation */}
              <div>
                <p className="mb-2.5 px-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">
                  PREFERENCES
                </p>
                <nav className="space-y-1" aria-label="Management navigation">
                  {[
                    { name: "Brand kit" as Page, icon: Palette },
                    { name: "Accounts" as Page, icon: Link2, dot: isInstagramConnected },
                    { name: "Settings" as Page, icon: Settings2 },
                  ].map(({ name, icon: Icon, dot }) => {
                    const active = page === name;
                    return (
                      <button
                        key={name}
                        onClick={() => navigate(name)}
                        className={`group relative flex h-10 w-full items-center gap-3 rounded-xl px-3.5 text-sm transition-all duration-150 ${
                          active
                            ? "bg-primary/10 font-semibold text-primary border border-primary/20 shadow-xs"
                            : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground font-medium"
                        }`}
                        aria-current={active ? "page" : undefined}
                      >
                        <Icon
                          className={`h-4 w-4 transition-colors ${
                            active ? "text-primary stroke-[2.2]" : "text-muted-foreground group-hover:text-foreground"
                          }`}
                        />
                        <span>{name}</span>
                        {dot && (
                          <span className="ml-auto h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
                        )}
                      </button>
                    );
                  })}
                </nav>
              </div>
            </div>

            {/* Bottom Account & Workspace Card */}
            <div className="border-t border-white/[0.08] pt-3">
              <button
                onClick={() => setAccountMenuOpen(!accountMenuOpen)}
                className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition-colors hover:bg-secondary/60 group"
                aria-expanded={accountMenuOpen}
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-xs font-semibold text-primary overflow-hidden">
                  {userAvatar ? (
                    <img
                      src={userAvatar}
                      alt={userName}
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    userInitial
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-foreground">{userName}</p>
                  <p className="truncate text-[11px] text-muted-foreground">{userEmail}</p>
                </div>
                <MoreHorizontal className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </button>
            </div>
          </div>
        </aside>
        <main className="min-w-0 flex-1 px-4 pb-24 pt-8 sm:px-8 lg:px-12 lg:pt-10">
          <div className="mx-auto w-full max-w-[1180px]">
            {page === "Home" && (
              <Dashboard
                posts={posts}
                loadingPosts={loadingPosts}
                onNavigate={navigate}
                userName={userName}
                businessName={businessName}
                instagramAccount={instagramAccount}
                onSelectPost={setSelectedPostForDetail}
              />
            )}
            {page === "Create" && (
              <CreateFlow
                brandKit={brandKit}
                businessName={businessName}
                activeBusinessId={activeBusinessId}
                businesses={businesses}
                connectedAccounts={connectedAccounts}
                onSwitchBusiness={handleSwitchBusiness}
                onOpenAddBusiness={() => setAddBusinessModalOpen(true)}
                onPublished={(post) => {
                  setPosts((current) => {
                    const updated = [post, ...current];
                    try {
                      localStorage.setItem("postpilot_cached_posts", JSON.stringify(updated));
                    } catch {}
                    return updated;
                  });
                }}
                onCancel={() => navigate("Home")}
                onNavigate={navigate}
              />
            )}
            {page === "Scheduled" && (
              <ScheduledPage
                posts={posts}
                businessName={businessName}
                onChange={setPosts}
                onCreate={() => navigate("Create")}
                onSelectPost={setSelectedPostForDetail}
              />
            )}
            {page === "Posted" && (
              <PostedPage
                posts={posts}
                businessName={businessName}
                onSelectPost={setSelectedPostForDetail}
              />
            )}
            {page === "Brand kit" && (
              <BrandKit
                data={brandKit}
                onSave={async (updated) => {
                  setBrandKit(updated);
                  try {
                    localStorage.setItem("postpilot_brand_kit", JSON.stringify(updated));
                  } catch {}
                  if (activeBusinessId) {
                    try {
                      await updateBusiness({
                        data: {
                          business_id: activeBusinessId,
                          name: updated.businessName,
                          tagline: updated.tagline,
                          location: updated.location,
                          phone: updated.phone,
                          brand_colors: updated.colors,
                          logo_url: updated.logoUrl || null,
                          tone: (updated.tone as any) || "Friendly",
                          timezone: updated.timezone || "Asia/Kolkata",
                          default_hashtags: updated.defaultHashtags || null,
                        },
                      });
                    } catch (err: any) {
                      console.error("Failed to update business in database", err);
                    }
                  }
                  toast.success("Brand kit saved & applied across PostPilot");
                }}
              />
            )}
            {page === "Accounts" && (
              <Accounts
                connectedAccounts={connectedAccounts}
                businessName={businessName}
                activeBusinessId={activeBusinessId}
                businesses={businesses}
                billingInfo={billingInfo}
                userEmail={userEmail}
                onRefresh={() => refreshWorkspace()}
                onAccountsChange={setConnectedAccounts}
                onConnect={(bizId, platform) => startOAuthForBiz(bizId, platform)}
              />
            )}
            {page === "Settings" && (
              <SettingsPage
                businessName={businessName}
                activeBusinessId={activeBusinessId}
                businesses={businesses}
                brandKit={brandKit}
                posts={posts}
                onBusinessNameChange={setBusinessName}
                onRefresh={() => refreshWorkspace()}
                onDeleteBusiness={handleDeleteBusiness}
                isMeetSoni={isMeetSoni}
              />
            )}
            <PostDetailModal
              post={selectedPostForDetail}
              businessName={businessName}
              isOpen={Boolean(selectedPostForDetail)}
              onClose={() => setSelectedPostForDetail(null)}
            />

            {/* Add Business Modal Dialog */}
            <Dialog open={addBusinessModalOpen} onOpenChange={setAddBusinessModalOpen}>
              <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="font-display text-2xl flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Plus className="h-4 w-4" />
                    </span>
                    Add New Business
                  </DialogTitle>
                  <DialogDescription>
                    Create a separate workspace with its own brand identity, tone, and connected Instagram accounts.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                  <div>
                    <label className="text-xs font-semibold text-foreground">Business Name *</label>
                    <Input
                      placeholder="e.g. Acme Coffee Roasters"
                      value={newBizName}
                      onChange={(e) => setNewBizName(e.target.value)}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-foreground">Tagline / Slogan</label>
                    <Input
                      placeholder="e.g. Ethically sourced, perfectly roasted."
                      value={newBizTagline}
                      onChange={(e) => setNewBizTagline(e.target.value)}
                      className="mt-1"
                    />
                  </div>

                  {/* Logo Upload */}
                  <div>
                    <label className="text-xs font-semibold text-foreground">Brand Logo</label>
                    <div className="mt-1.5 flex items-center gap-3">
                      {newBizLogoUrl ? (
                        <div className="relative h-12 w-12 rounded-lg border bg-white p-1 overflow-hidden shrink-0 flex items-center justify-center">
                          <img src={newBizLogoUrl} alt="Logo preview" className="h-full w-full object-contain" />
                          <button
                            type="button"
                            onClick={() => setNewBizLogoUrl("")}
                            className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg border-2 border-dashed bg-secondary/50 text-muted-foreground shrink-0">
                          <Upload className="h-4 w-4" />
                        </div>
                      )}
                      <div className="flex-1">
                        <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border bg-secondary/60 px-3 py-2 text-xs font-medium hover:bg-secondary">
                          <Upload className="h-3.5 w-3.5 text-muted-foreground" />
                          {uploadingNewBizLogo ? "Uploading..." : "Choose logo file"}
                          <input
                            type="file"
                            accept="image/*"
                            className="sr-only"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              setUploadingNewBizLogo(true);
                              const reader = new FileReader();
                              reader.onload = async () => {
                                try {
                                  const dataUrl = reader.result as string;
                                  setNewBizLogoUrl(dataUrl);
                                  const res = await uploadBrandLogo({ data: { dataUrl, filename: file.name } });
                                  if (res?.success && res.publicUrl) {
                                    setNewBizLogoUrl(res.publicUrl);
                                    toast.success("Logo uploaded!");
                                  }
                                } catch {
                                  toast.error("Upload failed, using local preview");
                                } finally {
                                  setUploadingNewBizLogo(false);
                                }
                              };
                              reader.readAsDataURL(file);
                            }}
                          />
                        </label>
                        <p className="mt-1 text-[11px] text-muted-foreground">PNG, SVG or JPG. Max 5MB.</p>
                      </div>
                    </div>
                  </div>

                  {/* Brand Colors */}
                  <div>
                    <label className="text-xs font-semibold text-foreground">Brand Colors (Pick 2-3)</label>
                    <div className="mt-1.5 flex flex-wrap gap-2">
                      {palette.map((p) => {
                        const isSelected = newBizColors.includes(p.name);
                        return (
                          <button
                            key={p.name}
                            type="button"
                            onClick={() => {
                              setNewBizColors((prev) =>
                                prev.includes(p.name)
                                  ? prev.length > 1
                                    ? prev.filter((c) => c !== p.name)
                                    : prev
                                  : [...prev, p.name].slice(-3)
                              );
                            }}
                            className={`flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs transition-all ${
                              isSelected
                                ? "border-primary bg-primary/10 font-medium text-foreground ring-1 ring-primary/40"
                                : "hover:bg-secondary/60 text-muted-foreground"
                            }`}
                          >
                            <span className={`h-3 w-3 rounded-full ${p.className}`} />
                            {p.name}
                            {isSelected && <Check className="h-3 w-3 text-primary ml-0.5" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Tone */}
                  <div>
                    <label className="text-xs font-semibold text-foreground">Caption Tone</label>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {["Friendly", "Professional", "Bold", "Playful", "Casual", "Luxury"].map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setNewBizTone(t)}
                          className={`rounded-lg border px-2.5 py-1 text-xs transition-colors ${
                            newBizTone === t
                              ? "border-primary bg-primary text-primary-foreground font-medium"
                              : "hover:bg-secondary/60 text-muted-foreground"
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Timezone */}
                  <div>
                    <label className="text-xs font-semibold text-foreground">Posting Timezone</label>
                    <select
                      value={newBizTimezone}
                      onChange={(e) => setNewBizTimezone(e.target.value)}
                      className="mt-1 flex h-9 w-full rounded-lg border border-input bg-background px-3 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      <option value="Asia/Kolkata">India Standard Time (IST - UTC+5:30)</option>
                      <option value="America/New_York">Eastern Time (ET - UTC-5/4)</option>
                      <option value="America/Chicago">Central Time (CT - UTC-6/5)</option>
                      <option value="America/Los_Angeles">Pacific Time (PT - UTC-8/7)</option>
                      <option value="Europe/London">London (GMT/BST - UTC+0/1)</option>
                      <option value="Europe/Stockholm">Central European (CET - UTC+1/2)</option>
                      <option value="Asia/Dubai">Gulf Standard Time (GST - UTC+4)</option>
                      <option value="Australia/Sydney">Australian Eastern (AEST - UTC+10/11)</option>
                    </select>
                  </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                  <Button variant="outline" onClick={() => setAddBusinessModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAddBusinessSubmit}
                    disabled={creatingBusiness || !newBizName.trim()}
                    className="gap-2"
                  >
                    {creatingBusiness ? (
                      <>
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                        Creating Workspace...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4" />
                        Create Business
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Prompt to Connect Instagram Modal Dialog */}
            <Dialog open={connectPromptOpen} onOpenChange={setConnectPromptOpen}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="font-display text-2xl flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-olive/10 text-olive">
                      <Instagram className="h-4 w-4" />
                    </span>
                    Connect Instagram
                  </DialogTitle>
                  <DialogDescription>
                    Link your Instagram account for <strong>{connectPromptBiz?.name}</strong> to enable one-click publishing and scheduling.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-3 py-2 text-xs">
                  <div className="rounded-lg border bg-secondary/50 p-3 leading-relaxed text-muted-foreground">
                    <p className="font-medium text-foreground mb-1">Separate Accounts per Business</p>
                    Each business workspace has its own independent Instagram connection. You can connect different handles to each workspace.
                  </div>
                  <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-[11px] leading-relaxed text-muted-foreground">
                    <span className="font-semibold text-primary">Zernio Free Tier:</span> First 2 connected accounts across PostPilot are free. Subsequent accounts are billed at $6/month.
                  </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                  <Button variant="outline" onClick={() => setConnectPromptOpen(false)}>
                    I'll do this later
                  </Button>
                  <Button
                    className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
                    onClick={() => {
                      if (connectPromptBiz) {
                        setConnectPromptOpen(false);
                        startOAuthForBiz(connectPromptBiz.id, "Instagram");
                      }
                    }}
                  >
                    <Instagram className="h-4 w-4" />
                    Connect Instagram Now
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </main>
      </div>
      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t bg-background/95 px-1 pb-[env(safe-area-inset-bottom)] pt-1 backdrop-blur md:hidden" aria-label="Mobile navigation">
        {(["Home", "Create", "Scheduled", "Posted", "Brand kit"] as Page[]).map((name) => { const Icon = navItems.find((item) => item.name === name)?.icon ?? LayoutGrid; return <Button key={name} variant="ghost" className={`flex h-[56px] flex-col gap-1 rounded-none px-1 text-[10px] ${page === name ? "text-primary" : "text-muted-foreground"}`} onClick={() => navigate(name)}><Icon className="h-4 w-4" />{name}</Button>; })}
      </nav>
    </div>
  );
}

function ScreenTitle({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-primary">{eyebrow}</p>}
        <h1 className="font-display text-4xl font-semibold tracking-tight leading-tight sm:text-[42px] text-foreground">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>}
      </div>
      {action && <div className="flex items-center shrink-0">{action}</div>}
    </div>
  );
}

function Dashboard({
  posts,
  loadingPosts = false,
  onNavigate,
  userName,
  businessName,
  instagramAccount,
  onSelectPost,
}: {
  posts: SocialPost[];
  loadingPosts?: boolean;
  onNavigate: (page: Page) => void;
  userName?: string | undefined;
  businessName: string;
  instagramAccount?: { platform: string; handle: string } | undefined;
  onSelectPost?: ((post: SocialPost) => void) | undefined;
}) {
  const latestPosts = posts.slice(0, 3);
  const postedCount = posts.filter((post) => post.status === "Posted").length;
  const scheduledCount = posts.filter((post) => post.status === "Scheduled").length;
  const greetingName = userName ? userName.split(" ")[0] : "there";
  const todayLabel = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }).toUpperCase();

  return (
    <>
      <ScreenTitle
        eyebrow={todayLabel}
        title={`Welcome back, ${greetingName}.`}
        description="Create, schedule, and publish attractive social posts with ease."
        action={
          <Button onClick={() => onNavigate("Create")} className="h-11 px-6 rounded-xl font-semibold gap-2 shadow-lg shadow-primary/25 hover:shadow-primary/40">
            <Plus className="h-4 w-4 stroke-[2.5]" /> Create a post
          </Button>
        }
      />
      <section className="mb-8 grid gap-4 sm:grid-cols-3" aria-label="Posting overview">
        <Stat label="Posts this month" value={String(postedCount)} note={postedCount > 0 ? `${postedCount} posts published` : "No posts published yet"} />
        <Stat label="In the calendar" value={String(scheduledCount)} note={scheduledCount > 0 ? `${scheduledCount} posts queued` : "No scheduled posts"} />
        <Stat
          label="Connected channel"
          value={instagramAccount ? "Instagram" : "None"}
          note={instagramAccount ? `@${instagramAccount.handle} · Active` : "Connect in Accounts"}
        />
      </section>
      <section className="relative mb-10 overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-card via-card/85 to-secondary/40 p-6 sm:p-8 shadow-xl backdrop-blur-md">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        <div className="grid items-center gap-6 md:grid-cols-[1fr_auto] relative z-10">
          <div>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-primary">A FRESH IDEA</p>
            <h2 className="font-display text-3xl font-semibold leading-tight sm:text-[34px] text-foreground">What would you like to share today?</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">Start with an offer, an update, or a moment from your business. We'll help shape the poster and caption.</p>
          </div>
          <Button className="h-11 gap-2 self-center px-6 rounded-xl font-semibold shadow-lg shadow-primary/25 hover:shadow-primary/40" onClick={() => onNavigate("Create")}>
            <Plus className="h-4 w-4 stroke-[2.5]" /> Start a new post
          </Button>
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-white/[0.08] pt-4 text-xs text-muted-foreground">
          {instagramAccount ? (
            <span className="inline-flex items-center gap-2 font-medium text-foreground"><Instagram className="h-3.5 w-3.5 text-pink-500" /> Instagram (@{instagramAccount.handle})</span>
          ) : (
            <span className="inline-flex items-center gap-2 text-muted-foreground"><Instagram className="h-3.5 w-3.5" /> No Instagram connected</span>
          )}
          <span className="inline-flex items-center gap-1.5"><Clock3 className="h-3.5 w-3.5 text-primary" /> {instagramAccount ? "Ready to publish" : "Connect an account in Accounts"}</span>
        </div>
      </section>
      <section>
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="font-display text-2xl font-semibold text-foreground">Recent posts</h2>
            <p className="mt-1 text-sm text-muted-foreground">Your recent created and published posts.</p>
          </div>
          {posts.length > 0 && (
            <Button variant="ghost" className="gap-1.5 text-xs text-primary font-semibold hover:text-primary hover:bg-primary/10 rounded-xl" onClick={() => onNavigate("Scheduled")}>
              See your calendar <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
        {latestPosts.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {latestPosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                businessName={businessName}
                onSelectPost={onSelectPost}
              />
            ))}
          </div>
        ) : loadingPosts ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse rounded-2xl border border-white/[0.08] bg-card/60 p-4 flex gap-4">
                <div className="w-[96px] h-[120px] bg-secondary/80 rounded-xl" />
                <div className="flex-1 space-y-2.5 py-2">
                  <div className="h-4 w-16 bg-secondary/80 rounded-lg" />
                  <div className="h-4 w-3/4 bg-secondary/80 rounded-lg" />
                  <div className="h-3 w-full bg-secondary/80 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No posts yet."
            message="Type your first post prompt to create and publish an attractive social poster."
            action="Create your first post"
            onAction={() => onNavigate("Create")}
          />
        )}
      </section>
      <div className="mt-10 flex flex-wrap items-center gap-5 border-t border-white/[0.08] pt-5 text-xs text-muted-foreground">
        <span>{postedCount} posts shared so far</span>
        <span>•</span>
        <span>Social posts made simple.</span>
      </div>
    </>
  );
}

function Stat({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="group rounded-2xl border border-white/[0.08] bg-card/70 p-5 shadow-sm backdrop-blur-sm transition-all duration-200 hover:border-primary/40 hover:bg-card hover:shadow-xl hover:shadow-black/40">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-2.5 font-display text-3xl font-semibold text-foreground tracking-tight group-hover:text-primary transition-colors">{value}</p>
      <p className="mt-1.5 text-xs text-muted-foreground/90">{note}</p>
    </div>
  );
}

function formatPostDate(dateStr?: string, timeStr?: string): string {
  if (!dateStr) return "Recently";
  try {
    const parts = dateStr.slice(0, 10).split("-").map(Number);
    const y = parts[0] || 2026;
    const m = (parts[1] || 1) - 1;
    const d = parts[2] || 1;
    const formatted = new Date(y, m, d).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    return timeStr ? `${formatted} · ${timeStr.slice(0, 5)}` : formatted;
  } catch {
    return dateStr;
  }
}

function cleanCaptionDisplay(caption?: string): string {
  if (!caption) return "Caption not added yet";
  const trimmed = caption.trim();
  if (trimmed.includes('"caption"')) {
    try {
      const jsonMatch = trimmed.match(/\{[\s\S]*?\}/);
      if (jsonMatch) {
        const p = JSON.parse(jsonMatch[0]);
        let remaining = trimmed.replace(jsonMatch[0], "").replace(/^[,\s]+/, "").trim();
        let res = p.caption || "";
        if (p.hashtags) res += (res ? "\n\n" : "") + p.hashtags;
        if (remaining) res += (res ? "\n\n" : "") + remaining;
        return res.trim();
      }
    } catch {}
    const capMatch = trimmed.match(/"caption"\s*:\s*"([^"]+)"/);
    if (capMatch?.[1]) {
      const tagMatch = trimmed.match(/"hashtags"\s*:\s*"([^"]+)"/);
      return tagMatch?.[1] ? `${capMatch[1]}\n\n${tagMatch[1]}` : capMatch[1];
    }
  }
  return caption;
}

export function getHeadingFontFamily(font?: string): string {
  if (!font) return "var(--font-display)";
  const normalized = font.toLowerCase().trim();
  if (normalized.includes("dm serif")) {
    return "'DM Serif Display', Georgia, serif";
  }
  if (normalized.includes("work sans")) {
    return "'Work Sans', -apple-system, BlinkMacSystemFont, sans-serif";
  }
  return "'Fraunces', Georgia, serif";
}

function Poster({
  theme,
  eyebrow,
  headline,
  price,
  dateText,
  footer,
  selected = false,
  imageUrl,
  logoUrl,
  font,
  format = "Portrait 4:5",
  needsReview = false,
}: {
  theme: string;
  eyebrow: string;
  headline: string;
  price: string;
  dateText?: string | undefined;
  footer: string;
  selected?: boolean;
  imageUrl?: string | undefined;
  logoUrl?: string | undefined;
  font?: string | undefined;
  format?: string | undefined;
  needsReview?: boolean | undefined;
}) {
  const isWorkSans = font?.toLowerCase().includes("work sans");

  const aspectClass = format === "Square"
    ? "aspect-square"
    : format === "Story"
    ? "aspect-[9/16]"
    : "aspect-[4/5]";

  if (imageUrl) {
    return (
      <div
        className={`poster ${selected ? "ring-2 ring-primary ring-offset-2" : ""} relative overflow-hidden bg-muted group rounded-md shadow-xs ${aspectClass}`}
      >
        <img
          src={imageUrl}
          alt={headline || "Finished flyer"}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
        />

        {needsReview && (
          <div className="absolute top-2 left-2 z-20 flex items-center gap-1 rounded-full bg-amber-500/95 px-2.5 py-1 text-[10px] font-semibold text-white shadow-md backdrop-blur-xs">
            <span>⚠️</span> Needs Review
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={`poster poster--${theme} ${selected ? "ring-2 ring-primary ring-offset-2" : ""} relative overflow-hidden flex flex-col justify-between p-5 text-center ${aspectClass}`}
    >
      {logoUrl && (
        <div className="absolute top-2.5 right-2.5 z-20 flex h-7 w-7 items-center justify-center rounded-full bg-white/95 p-1 shadow-md border border-black/10 backdrop-blur-xs">
          <img src={logoUrl} alt="Logo" className="h-full w-full object-contain" />
        </div>
      )}
      <p className="poster__top relative z-10 text-[0.62rem] font-bold tracking-[0.14em] uppercase">{eyebrow}</p>
      <div className="relative z-10 my-auto py-2">
        <div className="poster__ornament mx-auto mb-2 w-8 h-[1px] bg-current opacity-40" />
        <p
          className="poster__title"
          style={{
            fontFamily: getHeadingFontFamily(font),
            fontWeight: isWorkSans ? 700 : 500,
            fontSize: "clamp(1.1rem, 2.2vw, 1.7rem)",
            lineHeight: 1.15,
            wordBreak: "normal",
            overflowWrap: "break-word",
            hyphens: "none",
          }}
        >
          {headline}
        </p>
        <div className="poster__ornament mx-auto mt-2 mb-2 w-8 h-[1px] bg-current opacity-40" />
        {dateText && (
          <span className="poster__date mb-1 inline-block rounded-full bg-black/10 px-2 py-0.5 text-[0.62rem] font-bold uppercase tracking-wider dark:bg-white/10">
            {dateText}
          </span>
        )}
        {price && <p className="poster__price font-bold text-base mt-1">{price}</p>}
      </div>
      <p className="poster__foot relative z-10 text-[0.58rem] font-semibold tracking-[0.12em] uppercase">{footer}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: PostStatus }) {
  const isPosted = status === "Posted";
  const isScheduled = status === "Scheduled";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold border ${
        isPosted
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
          : isScheduled
          ? "border-sky-500/30 bg-sky-500/10 text-sky-400"
          : "border-border bg-secondary/80 text-muted-foreground"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          isPosted ? "bg-emerald-400" : isScheduled ? "bg-sky-400" : "bg-muted-foreground"
        }`}
      />
      {status}
    </span>
  );
}

function PostCard({
  post,
  businessName,
  onSelectPost,
}: {
  post: SocialPost;
  businessName?: string;
  onSelectPost?: ((post: SocialPost) => void) | undefined;
}) {
  const dateLabel = formatPostDate(post.date, post.time);
  return (
    <article
      onClick={() => onSelectPost?.(post)}
      className="group cursor-pointer overflow-hidden rounded-2xl border border-white/[0.08] bg-card/70 p-4 shadow-sm backdrop-blur-sm transition-all duration-200 hover:border-primary/50 hover:bg-card hover:shadow-xl hover:shadow-black/50"
    >
      <div className="grid grid-cols-[96px_1fr] gap-4">
        <div className="w-[96px] shrink-0">
          {post.imageUrl ? (
            <div className="aspect-[4/5] w-full overflow-hidden rounded-xl border border-white/[0.08] bg-muted shadow-sm">
              <img
                src={post.imageUrl}
                alt={post.headline}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />
            </div>
          ) : (
            <Poster
              theme={post.theme}
              eyebrow={businessName?.toUpperCase() ?? "POSTPILOT"}
              headline={post.headline}
              price={post.price}
              footer="FRESH DAILY"
            />
          )}
        </div>
        <div className="flex min-w-0 flex-col py-0.5">
          <div className="flex items-center justify-between gap-2">
            <StatusBadge status={post.status} />
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground"
              aria-label={`View details for ${post.headline}`}
              onClick={(e) => {
                e.stopPropagation();
                onSelectPost?.(post);
              }}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
          <h3 className="mt-3 line-clamp-2 text-sm font-semibold leading-5 text-foreground group-hover:text-primary transition-colors">
            {post.headline}
          </h3>
          <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground whitespace-pre-line">
            {cleanCaptionDisplay(post.caption)}
          </p>
          <div className="mt-auto flex items-center justify-between pt-3 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1.5 font-medium">
              <Instagram className="h-3.5 w-3.5 text-pink-500" />
              {dateLabel}
            </span>
            <span className="text-[10px] text-primary font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
              View details →
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}

function CreateFlow({
  brandKit,
  businessName,
  activeBusinessId,
  businesses = [],
  connectedAccounts = [],
  onSwitchBusiness,
  onOpenAddBusiness,
  onPublished,
  onCancel,
  onNavigate,
}: {
  brandKit: BrandKitData;
  businessName: string;
  activeBusinessId?: string;
  businesses?: BusinessSummaryItem[];
  connectedAccounts?: Array<{ id?: string; platform: string; handle: string; status?: string; externalAccountId?: string }>;
  onSwitchBusiness?: (bizId: string) => void;
  onOpenAddBusiness?: () => void;
  onPublished: (post: SocialPost) => void;
  onCancel: () => void;
  onNavigate: (page: Page) => void;
}) {
  const [step, setStep] = useState(1);
  const [selectedBizId, setSelectedBizId] = useState<string>(() => activeBusinessId || businesses[0]?.id || "");
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>(() => {
    return connectedAccounts.map((a) => a.id || a.handle).filter(Boolean) as string[];
  });

  // Keep in sync with incoming activeBusinessId
  useEffect(() => {
    if (activeBusinessId) {
      setSelectedBizId(activeBusinessId);
    }
  }, [activeBusinessId]);

  useEffect(() => {
    if (connectedAccounts.length > 0) {
      setSelectedAccountIds((prev) => {
        const stillValid = prev.filter((id) =>
          connectedAccounts.some((a) => (a.id || a.handle) === id)
        );
        return stillValid.length > 0
          ? stillValid
          : (connectedAccounts.map((a) => a.id || a.handle).filter(Boolean) as string[]);
      });
    } else {
      setSelectedAccountIds([]);
    }
  }, [connectedAccounts]);

  const selectedAccountId = selectedAccountIds[0] || "";

  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState("Bold");
  const [format, setFormat] = useState("Portrait 4:5");
  const [useBrand, setUseBrand] = useState(true);
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<PosterOption[]>(initialOptions);
  const [selected, setSelected] = useState(0);
  const [headline, setHeadline] = useState("");
  const [price, setPrice] = useState("");
  const [dateText, setDateText] = useState("");
  const [caption, setCaption] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [suggesting, setSuggesting] = useState(false);
  const [ownCaption, setOwnCaption] = useState(true);
  const [platforms, setPlatforms] = useState<Platform[]>(["Instagram"]);

  // Automatically keep platforms synchronized with selected accounts
  useEffect(() => {
    const matched = connectedAccounts.filter((a) =>
      selectedAccountIds.includes(a.id || a.handle)
    );
    const newPlatforms = Array.from(new Set(matched.map((a) => a.platform as Platform)));
    if (newPlatforms.length > 0) {
      setPlatforms(newPlatforms);
    }
  }, [selectedAccountIds, connectedAccounts]);
  const [timing, setTiming] = useState<"now" | "schedule">("now");
  const [scheduledDate, setScheduledDate] = useState("2026-10-18");
  const [scheduledTime, setScheduledTime] = useState("16:00");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [success, setSuccess] = useState(false);

  // Mid-flow business switch warning
  const [switchWarnOpen, setSwitchWarnOpen] = useState(false);
  const [pendingBizId, setPendingBizId] = useState<string | null>(null);

  const handleRequestSwitchBiz = (targetId: string) => {
    if (targetId === selectedBizId) return;
    if (step > 1 || options.length > 0) {
      setPendingBizId(targetId);
      setSwitchWarnOpen(true);
    } else {
      executeBizSwitch(targetId);
    }
  };

  const executeBizSwitch = (targetId: string) => {
    setSelectedBizId(targetId);
    setOptions([]);
    setSelected(0);
    setHeadline("");
    setPrice("");
    setCaption("");
    setSuggestions([]);
    setStep(1);
    onSwitchBusiness?.(targetId);
    setSwitchWarnOpen(false);
    setPendingBizId(null);
  };

  const currentOption = options[selected];
  const startGeneration = async () => {
    const parsed = generatePostersSchema.safeParse({ prompt, style, format });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Please provide a description for your post");
      return;
    }
    setLoading(true);
    setStep(2);
    try {
      const results = await generatePosters(
        prompt,
        style,
        useBrand,
        brandKit,
        2,
        format as any,
        selectedBizId,
        selectedAccountId
      );
      if (Array.isArray(results) && results.length > 0) {
        setOptions(results);
        setSelected(0);
        setHeadline(results[0]?.headline ?? "");
        setPrice(results[0]?.price ?? "");
        const detectedDate = results[0]?.brief?.date_text || results[0]?.date_text;
        setDateText(detectedDate || new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }).toUpperCase());
      } else {
        toast.error("Could not load poster options. Please try again.");
      }
    } catch (err) {
      console.error("[startGeneration Error]", err);
      toast.error("Poster generation failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const regenerate = async () => {
    setLoading(true);
    try {
      const results = await generatePosters(
        prompt,
        style,
        useBrand,
        brandKit,
        2,
        format as any,
        selectedBizId,
        selectedAccountId
      );
      if (Array.isArray(results) && results.length > 0) {
        setOptions(results);
        setSelected(0);
        setHeadline(results[0]?.headline ?? "");
        setPrice(results[0]?.price ?? "");
        const detectedDate = results[0]?.brief?.date_text || results[0]?.date_text;
        if (detectedDate) setDateText(detectedDate);
        toast.success("Two fresh layouts are ready");
      } else {
        toast.error("Could not regenerate poster options.");
      }
    } catch (err) {
      console.error("[regenerate Error]", err);
      toast.error("Failed to regenerate posters. Please try again.");
    } finally { setLoading(false); }
  };

  const loadSuggestions = async () => {
    setOwnCaption(false);
    setSuggesting(true);
    try {
      const next = await suggestCaptions(headline, price, selectedBizId);
      const cleaned = next.map((item) => {
        if (item.trim().startsWith("{") && item.includes('"caption"')) {
          try {
            const parsed = JSON.parse(item.trim().replace(/,\s*$/, ""));
            if (parsed.caption) {
              return `${parsed.caption}\n\n${parsed.hashtags || ""}`.trim();
            }
          } catch {}
        }
        return item;
      });
      setSuggestions(cleaned);
      setCaption(cleaned[0] ?? "");
    } finally { setSuggesting(false); }
  };

  const submitPost = async () => {
    if (platforms.length === 0) {
      toast.error("Please select at least one social media platform");
      return;
    }
    if (timing === "schedule") {
      if (!scheduledDate || !REGEX.date.test(scheduledDate)) {
        toast.error("Please enter a valid scheduled date (YYYY-MM-DD)");
        return;
      }
      if (!scheduledTime || !REGEX.time.test(scheduledTime)) {
        toast.error("Please enter a valid scheduled time (HH:MM)");
        return;
      }
      const schedTime = new Date(`${scheduledDate}T${scheduledTime}:00`);
      if (schedTime.getTime() <= Date.now()) {
        toast.error("Scheduled time must be in the future");
        return;
      }
    }
    setPublishing(true);
    const now = new Date();
    const todayIso = now.toISOString().slice(0, 10);
    const timeIso = now.toTimeString().slice(0, 5);
    const targetDate = timing === "now" ? todayIso : (scheduledDate || todayIso);
    const targetTime = timing === "now" ? timeIso : (scheduledTime || "12:00");

    let finalImageUrl = currentOption?.imageUrl;
    if (!finalImageUrl) {
      try {
        const dataUrl = await renderPosterCanvas({
          theme: currentOption?.theme ?? (brandKit.colors[0]?.toLowerCase() || "tomato"),
          eyebrow: currentOption?.eyebrow ?? (brandKit.businessName ? brandKit.businessName.toUpperCase() : businessName.toUpperCase()),
          headline,
          price,
          footer: currentOption?.footer ?? brandKit.tagline ?? "IDEAS INTO SCALABLE PRODUCTS",
          logoUrl: brandKit.logoUrl,
          font: brandKit.font,
        });
        const uploadRes = await uploadPosterDataUrl({ data: { dataUrl } });
        if (uploadRes?.success && uploadRes.publicUrl) {
          finalImageUrl = uploadRes.publicUrl;
        }
      } catch (canvasErr) {
        console.warn("Poster canvas render failed:", canvasErr);
      }
    }

    const chosenAccounts = connectedAccounts.filter((a) =>
      selectedAccountIds.includes(a.id || a.handle)
    );
    const chosenPlatforms = Array.from(
      new Set(chosenAccounts.map((a) => a.platform as Platform))
    );
    const finalPlatforms = chosenPlatforms.length > 0 ? chosenPlatforms : platforms.length > 0 ? platforms : ["Instagram" as Platform];

    const record = await publishPost({
      id: "pending",
      businessId: selectedBizId,
      socialAccountId: selectedAccountIds[0] || undefined,
      socialAccountIds: selectedAccountIds.length > 0 ? selectedAccountIds : undefined,
      headline,
      caption,
      date: targetDate,
      time: targetTime,
      status: timing === "now" ? "Posted" : "Scheduled",
      platform: finalPlatforms[0] ?? "Instagram",
      platforms: finalPlatforms,
      theme: currentOption?.theme ?? "tomato",
      price,
      imageUrl: finalImageUrl,
    });
    onPublished(record);
    setPublishing(false);
    setConfirmOpen(false);
    setSuccess(true);
  };

  const steps = ["Describe", "Choose a poster", "Caption & publish"];
  if (success) {
    return <div className="mx-auto max-w-xl py-16 text-center sm:py-24"><span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-olive/10 text-olive"><Check className="h-7 w-7" /></span><p className="mt-6 text-[11px] font-semibold uppercase text-primary">ALL SET</p><h1 className="mt-2 font-display text-4xl">{timing === "now" ? "Your post is out there." : "It's in the calendar."}</h1><p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">{timing === "now" ? "Your post is marked as shared. Your next good idea can start whenever you're ready." : `Your post is lined up for ${new Date(`${scheduledDate}T${scheduledTime}`).toLocaleString("en-US", { weekday: "long", month: "long", day: "numeric", hour: "numeric", minute: "2-digit" })}.`}</p><div className="mt-7 flex flex-wrap justify-center gap-3"><Button variant="outline" onClick={() => onNavigate(timing === "now" ? "Posted" : "Scheduled")}>{timing === "now" ? "View posted history" : "Open your calendar"}<ArrowRight className="h-4 w-4" /></Button><Button onClick={onCancel}>Back to home</Button></div></div>;
  }

  const activeInstagram = connectedAccounts.find((a) => a.platform.toLowerCase() === "instagram");

  return (
    <>
      <div className="mb-7 flex items-center justify-between gap-3">
        <div>
          <button className="mb-2 inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground" onClick={onCancel}>
            <ArrowLeft className="h-3.5 w-3.5" /> Back to workspace
          </button>
          <h1 className="font-display text-4xl font-semibold text-foreground tracking-tight">Create a post</h1>
        </div>
        <span className="hidden text-xs text-muted-foreground/80 sm:inline">A little idea can go a long way.</span>
      </div>
      <div className="mb-8 grid grid-cols-3 rounded-2xl border border-white/[0.08] bg-card/60 p-1.5 backdrop-blur-sm" aria-label="Post creation steps">
        {steps.map((label, index) => {
          const isCurrent = step === index + 1;
          const isPassed = step > index + 1;
          return (
            <button
              key={label}
              onClick={() => index + 1 <= step && setStep(index + 1)}
              className={`flex items-center justify-center gap-2.5 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all ${
                isCurrent
                  ? "bg-primary text-white shadow-md shadow-primary/25"
                  : isPassed
                  ? "text-primary hover:bg-primary/10"
                  : "text-muted-foreground cursor-not-allowed opacity-60"
              }`}
              aria-current={isCurrent ? "step" : undefined}
            >
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                  isCurrent
                    ? "bg-white text-primary"
                    : isPassed
                    ? "bg-primary/20 text-primary"
                    : "bg-secondary text-muted-foreground"
                }`}
              >
                {isPassed ? <Check className="h-3 w-3 stroke-[3]" /> : index + 1}
              </span>
              <span className="hidden sm:inline">{label}</span>
              <span className="sm:hidden">{index === 0 ? "Describe" : index === 1 ? "Poster" : "Publish"}</span>
            </button>
          );
        })}
      </div>
      {step === 1 && (
        <section className="max-w-3xl rounded-2xl border border-white/[0.08] bg-card/80 p-6 sm:p-8 shadow-xl backdrop-blur-sm">
          {/* POST TO SELECTOR */}
          <div className="mb-6 rounded-xl border border-white/[0.08] bg-secondary/40 p-4">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Send className="h-3.5 w-3.5 text-primary" />
                POST TO
              </span>
              {onOpenAddBusiness && (
                <button
                  type="button"
                  onClick={onOpenAddBusiness}
                  className="text-xs text-primary font-semibold hover:underline flex items-center gap-1"
                >
                  <Plus className="h-3 w-3 stroke-[2.5]" /> Add business
                </button>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {/* Business selection */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Target Business</label>
                <select
                  value={selectedBizId}
                  onChange={(e) => handleRequestSwitchBiz(e.target.value)}
                  className="flex h-10 w-full rounded-xl border border-white/[0.08] bg-background px-3 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25"
                >
                  {businesses.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Account Multi-Selection */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-muted-foreground">
                    Post to Accounts {connectedAccounts.length > 0 && `(${selectedAccountIds.length}/${connectedAccounts.length} selected)`}
                  </label>
                  {connectedAccounts.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedAccountIds.length === connectedAccounts.length) {
                          setSelectedAccountIds([]);
                        } else {
                          setSelectedAccountIds(connectedAccounts.map((a) => a.id || a.handle).filter(Boolean) as string[]);
                        }
                      }}
                      className="text-[11px] font-semibold text-primary hover:underline"
                    >
                      {selectedAccountIds.length === connectedAccounts.length ? "Deselect all" : "Select all"}
                    </button>
                  )}
                </div>
                {connectedAccounts.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {connectedAccounts.map((acc) => {
                      const accKey = acc.id || acc.handle;
                      const isSelected = selectedAccountIds.includes(accKey);
                      const isInstagram = acc.platform.toLowerCase() === "instagram";
                      return (
                        <button
                          key={accKey}
                          type="button"
                          onClick={() => {
                            setSelectedAccountIds((prev) =>
                              prev.includes(accKey)
                                ? prev.filter((id) => id !== accKey)
                                : [...prev, accKey]
                            );
                          }}
                          className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${
                            isSelected
                              ? "border-primary bg-primary/15 text-primary ring-1 ring-primary/40 shadow-xs"
                              : "border-white/[0.08] bg-background/80 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                          }`}
                        >
                          <div
                            className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-md border ${
                              isSelected
                                ? "border-primary bg-primary text-white"
                                : "border-muted-foreground/40"
                            }`}
                          >
                            {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                          </div>
                          <span className="flex items-center gap-1.5">
                            {isInstagram ? (
                              <Instagram className="h-3.5 w-3.5 text-pink-500 shrink-0" />
                            ) : (
                              <span className="inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[9px] font-bold text-white leading-none">f</span>
                            )}
                            @{acc.handle}
                          </span>
                          <span className="rounded-md bg-muted px-1.5 py-0.5 text-[9px] uppercase font-bold text-muted-foreground">
                            {acc.platform}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex h-10 items-center justify-between rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 text-xs text-amber-200">
                    <span className="truncate">No accounts linked</span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs border-amber-500/40 text-amber-200 hover:bg-amber-500/20 shrink-0 rounded-lg"
                      onClick={() => onNavigate("Accounts")}
                    >
                      Connect account
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {connectedAccounts.length === 0 && (
              <div className="mt-3 flex items-center justify-between rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs">
                <span className="text-amber-200">
                  <strong>{businessName}</strong> does not have a social account connected yet.
                </span>
                <Button
                  size="sm"
                  className="h-8 gap-1.5 text-xs bg-primary text-white hover:bg-primary/90 rounded-lg"
                  onClick={() => onNavigate("Accounts")}
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Connect account first
                </Button>
              </div>
            )}
          </div>

          <p className="text-[11px] font-bold uppercase tracking-widest text-primary">THE STARTING POINT</p>
          <h2 className="mt-2 font-display text-3xl font-semibold text-foreground">What's happening at {businessName}?</h2>
          <label htmlFor="post-prompt" className="sr-only">Describe your post</label>
          <Textarea
            id="post-prompt"
            className="mt-5 min-h-[140px] resize-y rounded-2xl border border-white/[0.08] bg-secondary/50 px-4 py-4 text-base leading-7 placeholder:text-muted-foreground/60 focus:bg-background/90 focus:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary/25 shadow-inner"
            placeholder="Special announcement, offer, or new update from your business"
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
          />
          <div className="mt-5 grid gap-5 border-t border-white/[0.08] pt-5 sm:grid-cols-2">
            <ChoiceRow label="Style" choices={["Bold", "Minimal", "Festive", "Elegant"]} value={style} onChange={setStyle} />
            <ChoiceRow label="Format" choices={["Square", "Portrait 4:5", "Story"]} value={format} onChange={setFormat} />
          </div>
          <div className="mt-5 flex items-center justify-between border-t border-white/[0.08] pt-5">
            <div>
              <p className="text-sm font-semibold text-foreground">Use my brand colors and logo</p>
              <p className="mt-1 text-xs text-muted-foreground">Keep each post feeling like {businessName}.</p>
            </div>
            <Switch checked={useBrand} onCheckedChange={setUseBrand} aria-label="Use my brand colors and logo" />
          </div>
          <div className="mt-6 flex items-center justify-between gap-3 border-t border-white/[0.08] pt-5">
            <p className="text-xs text-muted-foreground">You can edit every detail next.</p>
            <Button className="h-11 px-6 rounded-xl font-semibold gap-2 shadow-lg shadow-primary/25 hover:shadow-primary/40" onClick={startGeneration}>
              Generate poster <ArrowRight className="h-4 w-4 stroke-[2.5]" />
            </Button>
          </div>
        </section>
      )}
    {step === 2 && (
      <PosterStep
        businessName={businessName}
        logoUrl={useBrand ? brandKit.logoUrl : undefined}
        font={brandKit.font}
        options={options}
        selected={selected}
        loading={loading}
        headline={headline}
        price={price}
        dateText={dateText}
        onOptionsChange={setOptions}
        onSelect={(index) => {
          setSelected(index);
          setHeadline(options[index]?.headline ?? "");
          setPrice(options[index]?.price ?? "");
          const d = options[index]?.brief?.date_text || options[index]?.date_text;
          if (d) setDateText(d);
        }}
        onHeadline={setHeadline}
        onPrice={setPrice}
        onDate={setDateText}
        onRegenerate={regenerate}
        format={format}
        onBack={() => setStep(1)}
        onContinue={() => {
          if (!currentOption) return;
          setStep(3);
        }}
      />
    )}
    {step === 3 && (
      <PublishStep
        businessName={businessName}
        logoUrl={useBrand ? brandKit.logoUrl : undefined}
        font={brandKit.font}
        instagramAccount={activeInstagram}
        connectedAccounts={connectedAccounts}
        selectedAccountIds={selectedAccountIds}
        onUpdateSelectedAccountIds={setSelectedAccountIds}
        option={currentOption}
        headline={headline}
        price={price}
        caption={caption}
        suggestions={suggestions}
        suggesting={suggesting}
        ownCaption={ownCaption}
        platforms={platforms}
        timing={timing}
        scheduledDate={scheduledDate}
        scheduledTime={scheduledTime}
        onCaption={setCaption}
        onSuggest={loadSuggestions}
        onChooseSuggestion={(text) => setCaption(text)}
        onPlatforms={setPlatforms}
        onTiming={setTiming}
        onDate={setScheduledDate}
        onTime={setScheduledTime}
        onBack={() => setStep(2)}
        onSubmit={() => setConfirmOpen(true)}
      />
    )}
    <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">{timing === "now" ? "Ready to share?" : "Save this to your calendar?"}</DialogTitle>
          <DialogDescription>
            {timing === "now" ? `Your post will be published to ${businessName}'s ${platforms.join(" and ")} account.` : `Your post will be scheduled for ${new Date(`${scheduledDate}T${scheduledTime}`).toLocaleString("en-US", { weekday: "long", month: "long", day: "numeric", hour: "numeric", minute: "2-digit" })} in ${brandKit.timezone || "local timezone"}.`}
          </DialogDescription>
        </DialogHeader>
        <div className="my-2 flex gap-3 border-y py-4">
          <div className="w-[72px]">
            <Poster
              theme={currentOption?.theme ?? (brandKit.colors[0]?.toLowerCase() || "tomato")}
              eyebrow={brandKit.businessName ? brandKit.businessName.toUpperCase() : businessName.toUpperCase()}
              headline={headline}
              price={price}
              dateText={dateText}
              footer={currentOption?.footer ?? brandKit.tagline ?? "IDEAS INTO SCALABLE PRODUCTS"}
              logoUrl={brandKit.logoUrl}
              font={brandKit.font}
              imageUrl={currentOption?.imageUrl}
            />
          </div>
          <div className="min-w-0 py-2">
            <p className="text-sm font-medium">{headline}</p>
            <p className="mt-1 line-clamp-3 text-xs text-muted-foreground">{caption || "No caption added"}</p>
            <p className="mt-2 text-xs text-muted-foreground">{platforms.join(" · ")}</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setConfirmOpen(false)}>Keep editing</Button>
          <Button disabled={publishing} onClick={submitPost}>{publishing ? <LoaderCircle className="h-4 w-4 animate-spin" /> : timing === "now" ? "Post now" : "Schedule post"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Mid-flow Business Switch Warning Dialog */}
    <Dialog open={switchWarnOpen} onOpenChange={setSwitchWarnOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl text-amber-600 flex items-center gap-2">
            <span>⚠️</span> Switch Business Workspace?
          </DialogTitle>
          <DialogDescription>
            You are currently in the middle of creating a post. Switching business now will reset your generated poster layouts and custom edits.
          </DialogDescription>
        </DialogHeader>
        <div className="py-2 text-xs text-muted-foreground leading-relaxed">
          Each business has its own distinct brand kit, logos, and connected Instagram accounts. Posters generated for one workspace cannot be posted to another.
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => setSwitchWarnOpen(false)}>
            Keep Editing Current Post
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              if (pendingBizId) {
                executeBizSwitch(pendingBizId);
              }
            }}
          >
            Switch & Reset Poster
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}

function ChoiceRow({ label, choices, value, onChange }: { label: string; choices: string[]; value: string; onChange: (choice: string) => void }) {
  return (
    <div>
      <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
      <div className="flex flex-wrap gap-2">
        {choices.map((choice) => {
          const isSelected = value === choice;
          return (
            <button
              key={choice}
              type="button"
              className={`h-9 px-4 rounded-xl text-xs font-semibold transition-all duration-150 border ${
                isSelected
                  ? "border-primary bg-primary/15 text-primary ring-1 ring-primary/40 shadow-xs"
                  : "border-white/[0.08] bg-card/60 text-muted-foreground hover:border-primary/40 hover:text-foreground hover:bg-card"
              }`}
              onClick={() => onChange(choice)}
              aria-pressed={isSelected}
            >
              {choice}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function PosterStep({
  businessName,
  logoUrl,
  font,
  format = "Portrait 4:5",
  options,
  selected,
  loading,
  headline,
  price,
  dateText,
  onOptionsChange,
  onSelect,
  onHeadline,
  onPrice,
  onDate,
  onRegenerate,
  onBack,
  onContinue,
}: {
  businessName?: string;
  logoUrl?: string | undefined;
  font?: string | undefined;
  format?: string | undefined;
  options: PosterOption[];
  selected: number;
  loading: boolean;
  headline: string;
  price: string;
  dateText: string;
  onOptionsChange?: (options: PosterOption[]) => void;
  onSelect: (index: number) => void;
  onHeadline: (value: string) => void;
  onPrice: (value: string) => void;
  onDate: (value: string) => void;
  onRegenerate: () => void;
  onBack: () => void;
  onContinue: () => void;
}) {
  const [aiEditOpen, setAiEditOpen] = useState(false);
  const [aiEditInstruction, setAiEditInstruction] = useState("");
  const [aiEditing, setAiEditing] = useState(false);
  const [renderTick, setRenderTick] = useState(0);
  const aiEditInputRef = useRef<HTMLTextAreaElement>(null);

  const option = options[selected] || options[0];

  useEffect(() => {
    if (!loading) return;
    const id = window.setInterval(() => setRenderTick((value) => value + 1), 850);
    return () => window.clearInterval(id);
  }, [loading]);

  const dynamicSuggestions = useMemo(() => {
    const category = option?.brief?.category;
    const hl = (option?.headline || headline || "").toLowerCase();

    if (category === "product_tech" || hl.includes("ai") || hl.includes("masterclass") || hl.includes("tech") || hl.includes("software") || hl.includes("engineer")) {
      return {
        placeholder: "Describe what you want to change (e.g. Change timing to 6:00 PM IST. Add interactive hands-on demo highlight and make neon tech lighting brighter)...",
        suggestions: [
          "Change timing to 6:00 PM IST",
          "Make neon tech lighting brighter",
          "Change badge to Free Registration",
          "Highlight live hands-on coding",
        ],
      };
    }

    if (category === "festival" || hl.includes("diwali") || hl.includes("festiv") || hl.includes("eid")) {
      return {
        placeholder: "Describe what you want to change (e.g. Change venue to Marriott Resort. Add 7 PM timing and add more golden glowing diyas and lanterns)...",
        suggestions: [
          "Change venue to Marriott Resort",
          "Add timing: 7 PM onwards",
          "Add more glowing diyas & lanterns",
          "Change badge to Grand Diwali Party",
        ],
      };
    }

    if (category === "food" || hl.includes("pizza") || hl.includes("burger") || hl.includes("cafe") || hl.includes("food") || hl.includes("dining")) {
      return {
        placeholder: "Describe what you want to change (e.g. Add 20% OFF badge. Make food photography warmer and add 'Free Home Delivery' tag)...",
        suggestions: [
          "Add 20% OFF Special Offer",
          "Make food lighting warmer",
          "Add 'Free Home Delivery' badge",
          "Change crust to Wood-Fired Artisan",
        ],
      };
    }

    return {
      placeholder: "Describe what you want to change (e.g. Change venue to Taj Hotel, Mumbai. Add 7 PM timing and make background lighting more golden and festive)...",
      suggestions: [
        "Change venue to Taj Hotel, Mumbai",
        "Add timing: 7 PM onwards",
        "Make background more grand and festive",
        "Change badge to 3rd Anniversary",
      ],
    };
  }, [option?.brief?.category, option?.headline, headline]);

  const focusAiEdit = () => {
    aiEditInputRef.current?.focus();
    aiEditInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  if (loading || !options.length) {
    return (
      <div className="grid gap-8 lg:grid-cols-[1fr_270px]">
        <div>
          <p className="text-xs text-muted-foreground">A FEW DIRECTIONS TO TRY</p>
          <h2 className="mt-2 font-display text-3xl">Finding the right feeling.</h2>
          <div className="mt-6 grid grid-cols-2 gap-3 max-w-[540px]">
            {[0, 1].map((index) => (
              <div key={index} className="aspect-[4/5] animate-pulse border bg-secondary" />
            ))}
          </div>
        </div>
        <div className="flex flex-col justify-center border-t pt-6 lg:border-l lg:border-t-0 lg:pl-7 lg:pt-0">
          <span className="text-[11px] font-semibold uppercase text-primary">
            {["Writing the design brief", "Rendering two directions", "Adding your brand details"][renderTick % 3]}
          </span>
          <div className="mt-4 h-1 overflow-hidden bg-secondary">
            <div className="h-full w-2/3 animate-pulse bg-primary" />
          </div>
          <p className="mt-3 text-xs text-muted-foreground">Good things take a moment.</p>
        </div>
      </div>
    );
  }

  if (!option) return null;

  const savePoster = async () => {
    try {
      const dataUrl = await renderPosterCanvas({
        theme: option.theme,
        eyebrow: option.eyebrow,
        headline,
        price,
        dateText,
        footer: option.footer,
        imageUrl: option.imageUrl,
        logoUrl,
        font,
        format: option.format || format,
      });
      const anchor = document.createElement("a");
      anchor.href = dataUrl;
      anchor.download = `${headline.slice(0, 20).replace(/\s+/g, "-").toLowerCase()}-poster.png`;
      anchor.click();
      toast.success("Poster image downloaded");
    } catch {
      toast.error("Failed to export poster image");
    }
  };

  const handleAiEditSubmit = async () => {
    if (!aiEditInstruction.trim()) {
      toast.error("Please enter what changes you would like to make.");
      return;
    }
    const currentOpt = options[selected];
    if (!currentOpt) return;

    setAiEditing(true);
    try {
      const updatedOption = await editPosterWithAi({
        imageUrl: currentOpt.imageUrl || "",
        instruction: aiEditInstruction.trim(),
        optionId: currentOpt.id,
        currentBrief: currentOpt.brief,
      });

      const nextOptions = [...options];
      nextOptions[selected] = updatedOption;
      if (onOptionsChange) {
        onOptionsChange(nextOptions);
      }
      if (updatedOption.headline) onHeadline(updatedOption.headline);
      if (updatedOption.price) onPrice(updatedOption.price);
      const newDate = updatedOption.brief?.date_text || updatedOption.date_text;
      if (newDate) onDate(newDate);

      setAiEditOpen(false);
      setAiEditInstruction("");
      toast.success("Poster image updated with your changes!");
    } catch (err: any) {
      console.error("[AI Poster Edit Error]", err);
      toast.error(err?.message || "Failed to update poster with AI");
    } finally {
      setAiEditing(false);
    }
  };

  return (
    <>
      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-primary">A FEW DIRECTIONS TO TRY</p>
          <h2 className="mt-2 font-display text-3xl font-semibold text-foreground">Choose the one that feels right.</h2>
          <div className={`mt-5 grid gap-4 max-w-[560px] ${options.length <= 2 ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-4"}`}>
            {options.map((item, index) => (
              <button
                key={item.id}
                onClick={() => onSelect(index)}
                className={`group rounded-2xl border p-3 text-left transition-all duration-200 relative ${
                  selected === index
                    ? "border-primary bg-card/90 ring-2 ring-primary/40 shadow-xl shadow-primary/10"
                    : "border-white/[0.08] bg-card/60 hover:border-primary/50 hover:bg-card/90 hover:shadow-lg"
                }`}
                aria-pressed={selected === index}
                aria-label={`Select poster ${index + 1}`}
              >
                <Poster
                  theme={item.theme}
                  eyebrow={item.eyebrow}
                  headline={item.headline}
                  price={item.price}
                  dateText={item.date_text || item.brief?.date_text}
                  footer={item.footer}
                  selected={selected === index}
                  logoUrl={logoUrl}
                  font={font}
                  format={item.format || format}
                  imageUrl={item.imageUrl}
                  needsReview={item.needs_review}
                />
                <div className="mt-2.5 flex items-center justify-between">
                  <span className="block text-[11px] text-muted-foreground font-semibold">Direction {index + 1}</span>
                  {selected === index && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-primary">
                      <Sparkles className="h-3 w-3" /> Selected
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button variant="outline" className="h-10 px-4 rounded-xl gap-2 font-medium" onClick={onRegenerate}>
              <Sparkles className="h-4 w-4" /> Try two more
            </Button>
            <Button
              variant="outline"
              className="h-10 px-4 rounded-xl gap-2 text-primary border-primary/40 hover:bg-primary/10 hover:text-primary font-medium"
              onClick={focusAiEdit}
            >
              <Sparkles className="h-4 w-4 text-primary" /> Edit with AI
            </Button>
            <Button variant="ghost" className="h-10 px-4 rounded-xl gap-2 font-medium hover:bg-secondary/60" onClick={savePoster}>
              <ArrowDownToLine className="h-4 w-4" /> Download
            </Button>
          </div>
        </div>

        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">YOUR PICK</p>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-[11px] gap-1 rounded-lg text-primary border-primary/30 hover:bg-primary/10 font-semibold"
              onClick={focusAiEdit}
            >
              <Sparkles className="h-3 w-3" /> Edit with AI
            </Button>
          </div>

          <div className="mx-auto max-w-[280px] rounded-2xl border border-white/[0.08] bg-card/75 p-3.5 shadow-2xl backdrop-blur-xl relative">
            <Poster
              theme={option.theme}
              eyebrow={option.eyebrow}
              headline={headline}
              price={price}
              dateText={dateText}
              footer={option.footer}
              logoUrl={logoUrl}
              font={font}
              format={option.format || format}
              imageUrl={option.imageUrl}
              needsReview={option.needs_review}
            />

            {aiEditing && (
              <div className="absolute inset-0 bg-background/90 backdrop-blur-xs flex flex-col items-center justify-center p-4 rounded-2xl text-center gap-2 z-10 border border-primary/40">
                <LoaderCircle className="h-6 w-6 animate-spin text-primary" />
                <p className="text-xs font-semibold text-foreground">Applying changes with AI...</p>
                <p className="text-[11px] text-muted-foreground">Refining design brief & rendering image</p>
              </div>
            )}
          </div>

          {/* AI Image Edit Box right under YOUR PICK */}
          <div className="mt-4 rounded-2xl border border-primary/25 bg-card/90 p-4 shadow-xl backdrop-blur-md space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Edit this image with AI</span>
              </div>
              {aiEditInstruction && (
                <button
                  type="button"
                  onClick={() => setAiEditInstruction("")}
                  className="text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors"
                  disabled={aiEditing}
                >
                  Clear
                </button>
              )}
            </div>

            <Textarea
              ref={aiEditInputRef}
              id="ai-edit-textarea-yourpick"
              aria-label="Describe changes to make to this image"
              className="min-h-[85px] resize-none text-xs leading-5 rounded-xl border-white/[0.08] bg-background/80 placeholder:text-muted-foreground/60 focus-visible:ring-2 focus-visible:ring-primary/25"
              placeholder={dynamicSuggestions.placeholder}
              value={aiEditInstruction}
              onChange={(e) => setAiEditInstruction(e.target.value)}
              disabled={aiEditing}
            />

            {/* Quick Suggestion Chips */}
            <div className="space-y-1.5">
              <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Quick Suggestions</p>
              <div className="flex flex-wrap gap-1.5">
                {dynamicSuggestions.suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() =>
                      setAiEditInstruction((prev) =>
                        prev ? `${prev}. ${suggestion}` : suggestion
                      )
                    }
                    className="rounded-lg border border-white/[0.08] bg-secondary/50 px-2.5 py-1 text-[10px] font-medium text-muted-foreground hover:border-primary/50 hover:text-foreground transition-colors"
                    disabled={aiEditing}
                  >
                    + {suggestion}
                  </button>
                ))}
              </div>
            </div>

            <Button
              size="sm"
              className="w-full gap-2 text-xs h-10 rounded-xl shadow-md font-semibold"
              onClick={handleAiEditSubmit}
              disabled={aiEditing || !aiEditInstruction.trim()}
            >
              {aiEditing ? (
                <>
                  <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                  Applying Changes to Image...
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  Update Image with AI
                </>
              )}
            </Button>
          </div>

          <div className="mt-4 flex gap-3">
            <Button variant="outline" className="flex-1 h-11 rounded-xl font-medium" onClick={onBack}>
              Back
            </Button>
            <Button className="flex-1 gap-2 h-11 rounded-xl font-semibold shadow-lg shadow-primary/25 hover:shadow-primary/40" onClick={onContinue}>
              Continue <ArrowRight className="h-4 w-4 stroke-[2.5]" />
            </Button>
          </div>
        </div>
      </div>

      {/* AI Edit Modal Dialog */}
      <Dialog
        open={aiEditOpen}
        onOpenChange={(open) => {
          if (!aiEditing) setAiEditOpen(open);
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-display text-xl">
              <Sparkles className="h-5 w-5 text-primary" />
              Edit Poster with AI
            </DialogTitle>
            <DialogDescription className="text-xs leading-5">
              Enter the exact changes you want (venue, dates, timing, background, colors, or headline). An AI LLM will refine the design brief and update the image.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Current Poster Info Preview */}
            <div className="flex items-center gap-3.5 rounded-lg border bg-secondary/30 p-2.5">
              <div className="h-20 w-16 shrink-0 overflow-hidden rounded border bg-black shadow-sm">
                {option.imageUrl ? (
                  <img
                    src={option.imageUrl}
                    alt="Current poster"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full bg-secondary flex items-center justify-center text-[10px] text-muted-foreground">
                    Poster
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold">{headline || option.headline}</p>
                <p className="truncate text-[11px] text-primary font-medium mt-0.5">
                  {option.brief?.venue_text ? `Venue: ${option.brief.venue_text}` : (option.venue_text ? `Venue: ${option.venue_text}` : "Custom Venue")}
                </p>
                <p className="truncate text-[11px] text-muted-foreground mt-0.5">
                  {dateText || option.date_text || "Ready for AI refinement"}
                </p>
              </div>
            </div>

            {/* Instruction Textarea */}
            <div>
              <label htmlFor="ai-edit-prompt" className="text-xs font-medium text-foreground block mb-1.5">
                What changes would you like to make?
              </label>
              <Textarea
                id="ai-edit-prompt"
                className="min-h-[100px] resize-none text-xs leading-5 border-border bg-background"
                placeholder="e.g. Change venue to Taj Hotel, Mumbai. Add 7 PM timing and make the background lighting more warm, celebratory with golden accents."
                value={aiEditInstruction}
                onChange={(e) => setAiEditInstruction(e.target.value)}
                disabled={aiEditing}
              />
            </div>

            {/* Quick Suggestion Chips */}
            <div>
              <p className="text-[10px] uppercase font-semibold text-muted-foreground mb-1.5">Quick Suggestions</p>
              <div className="flex flex-wrap gap-1.5">
                {[
                  "Change venue to Taj Hotel, Mumbai",
                  "Add timing: 7 PM onwards",
                  "Change badge to 3rd Anniversary",
                  "Make background more grand and festive",
                  "Add cocktail & dinner gala detail",
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => setAiEditInstruction((prev) => prev ? `${prev}. ${suggestion}` : suggestion)}
                    className="rounded-full border border-border bg-secondary/50 px-2.5 py-1 text-[11px] text-muted-foreground hover:border-primary/50 hover:text-foreground transition-colors"
                    disabled={aiEditing}
                  >
                    + {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 border-t pt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAiEditOpen(false)}
              disabled={aiEditing}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="gap-2"
              onClick={handleAiEditSubmit}
              disabled={aiEditing || !aiEditInstruction.trim()}
            >
              {aiEditing ? (
                <>
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  Applying Changes with AI...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function PublishStep({
  businessName,
  logoUrl,
  font,
  instagramAccount,
  connectedAccounts = [],
  selectedAccountIds = [],
  onUpdateSelectedAccountIds,
  option,
  headline,
  price,
  caption,
  suggestions,
  suggesting,
  ownCaption,
  platforms,
  timing,
  scheduledDate,
  scheduledTime,
  onCaption,
  onSuggest,
  onChooseSuggestion,
  onPlatforms,
  onTiming,
  onDate,
  onTime,
  onBack,
  onSubmit,
}: {
  businessName: string;
  logoUrl?: string | undefined;
  font?: string | undefined;
  instagramAccount?: { platform: string; handle: string } | undefined;
  connectedAccounts?: Array<{ id?: string; platform: string; handle: string; status?: string }> | undefined;
  selectedAccountIds?: string[] | undefined;
  onUpdateSelectedAccountIds?: ((ids: string[]) => void) | undefined;
  option?: PosterOption | undefined;
  headline: string;
  price: string;
  caption: string;
  suggestions: string[];
  suggesting: boolean;
  ownCaption: boolean;
  platforms: Platform[];
  timing: "now" | "schedule";
  scheduledDate: string;
  scheduledTime: string;
  onCaption: (value: string) => void;
  onSuggest: () => void;
  onChooseSuggestion: (value: string) => void;
  onPlatforms: (value: Platform[]) => void;
  onTiming: (value: "now" | "schedule") => void;
  onDate: (value: string) => void;
  onTime: (value: string) => void;
  onBack: () => void;
  onSubmit: () => void;
}) {
  const togglePlatform = (platform: Platform) => onPlatforms(platforms.includes(platform) ? platforms.filter((item) => item !== platform) : [...platforms, platform]);
  const initial = (businessName || "P").charAt(0).toUpperCase();
  const displayHandle = instagramAccount?.handle ? `@${instagramAccount.handle}` : businessName.toLowerCase().replace(/\s+/g, ".");

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(250px,0.85fr)_minmax(380px,1.15fr)]">
      <section className="lg:sticky lg:top-24 lg:self-start">
        <p className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">A LITTLE PREVIEW</p>
        <div className="mx-auto max-w-[320px] rounded-2xl border border-white/[0.08] bg-card/85 p-4 shadow-2xl backdrop-blur-xl">
          <div className="mb-3.5 flex items-center gap-2.5">
            {logoUrl ? (
              <div className="h-7 w-7 rounded-full overflow-hidden border border-white/10 bg-white p-0.5 shrink-0 flex items-center justify-center shadow-xs">
                <img src={logoUrl} alt="Logo" className="h-full w-full object-contain" />
              </div>
            ) : (
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/20 text-[10px] font-bold text-primary">
                {initial}
              </span>
            )}
            <span className="text-xs font-semibold text-foreground truncate">{displayHandle}</span>
            <MoreHorizontal className="ml-auto h-4 w-4 text-muted-foreground" />
          </div>
          <Poster
            theme={option?.theme ?? "tomato"}
            eyebrow={option?.eyebrow ?? businessName.toUpperCase()}
            headline={headline}
            price={price}
            footer={option?.footer ?? "IDEAS INTO SCALABLE PRODUCTS"}
            logoUrl={logoUrl}
            font={font}
            imageUrl={option?.imageUrl}
          />
          <p className="mt-3.5 line-clamp-3 text-xs leading-5 text-foreground/90">
            <span className="font-semibold text-foreground">{displayHandle} </span>
            {caption || "Your caption will show up here."}
          </p>
        </div>
      </section>
      <section className="rounded-2xl border border-white/[0.08] bg-card/80 p-6 sm:p-8 shadow-xl backdrop-blur-sm">
        <p className="text-[11px] font-bold uppercase tracking-widest text-primary">ONE LAST THING</p>
        <h2 className="mt-2 font-display text-3xl font-semibold text-foreground">Give it a voice.</h2>
        <div className="mt-5 grid grid-cols-2 rounded-xl border border-white/[0.08] bg-secondary/50 p-1" role="group" aria-label="Caption method">
          <Button
            variant="ghost"
            className={`h-9 rounded-lg text-xs font-semibold transition-all ${
              ownCaption
                ? "bg-primary text-white shadow-sm shadow-primary/25"
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => onCaption(caption)}
          >
            Write my own
          </Button>
          <Button
            variant="ghost"
            className={`h-9 rounded-lg text-xs font-semibold transition-all ${
              !ownCaption
                ? "bg-primary text-white shadow-sm shadow-primary/25"
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={onSuggest}
          >
            Suggest captions
          </Button>
        </div>
        {ownCaption ? (
          <>
            <label htmlFor="caption-text" className="sr-only">Write a caption</label>
            <Textarea
              id="caption-text"
              className="mt-4 min-h-36 resize-y text-sm leading-6 rounded-2xl border-white/[0.08] bg-secondary/50 p-4 focus:bg-background/90"
              maxLength={2200}
              placeholder="A good caption that shares what's new and engages your followers…"
              value={caption}
              onChange={(event) => onCaption(event.target.value)}
            />
            <div className="mt-1.5 text-right text-[11px] font-mono text-muted-foreground">{caption.length} / 2,200</div>
          </>
        ) : (
          <div className="mt-4 space-y-2.5">
            {suggesting ? (
              <div className="flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-secondary/30 p-6 text-sm text-muted-foreground">
                <LoaderCircle className="h-5 w-5 animate-spin text-primary" /> Finding the right words…
              </div>
            ) : (
              suggestions.map((item, index) => (
                <button
                  key={item}
                  onClick={() => onChooseSuggestion(item)}
                  className={`w-full rounded-xl border p-3.5 text-left text-xs leading-5 transition-all ${
                    caption === item
                      ? "border-primary bg-primary/10 shadow-xs ring-1 ring-primary/40 font-medium"
                      : "border-white/[0.08] bg-secondary/30 hover:border-primary/40 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-primary">Option {index + 1}</span>
                  {item}
                </button>
              ))
            )}
            {!suggesting && suggestions.length > 0 && (
              <Button variant="ghost" size="sm" className="mt-1 h-8 px-2 text-xs text-primary font-semibold hover:bg-primary/10" onClick={onSuggest}>
                <Sparkles className="h-3.5 w-3.5 mr-1" /> Regenerate suggestions
              </Button>
            )}
          </div>
        )}
        <div className="mt-6 border-t border-white/[0.08] pt-5">
          <div className="flex items-baseline justify-between mb-2">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Where should it go?</h3>
              <p className="text-xs text-muted-foreground">Select 1, multiple, or all accounts to publish</p>
            </div>
            {connectedAccounts.length > 1 && onUpdateSelectedAccountIds && (
              <button
                type="button"
                onClick={() => {
                  if (selectedAccountIds.length === connectedAccounts.length) {
                    onUpdateSelectedAccountIds([]);
                  } else {
                    onUpdateSelectedAccountIds(connectedAccounts.map((a) => a.id || a.handle).filter(Boolean) as string[]);
                  }
                }}
                className="text-xs font-semibold text-primary hover:underline"
              >
                {selectedAccountIds.length === connectedAccounts.length ? "Deselect all" : "Select all accounts"}
              </button>
            )}
          </div>

          {connectedAccounts.length > 0 ? (
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {connectedAccounts.map((acc) => {
                const accKey = acc.id || acc.handle;
                const isSelected = selectedAccountIds.includes(accKey);
                const isInstagram = acc.platform.toLowerCase() === "instagram";
                return (
                  <button
                    key={accKey}
                    type="button"
                    onClick={() => {
                      if (!onUpdateSelectedAccountIds) return;
                      const next = isSelected
                        ? selectedAccountIds.filter((id) => id !== accKey)
                        : [...selectedAccountIds, accKey];
                      onUpdateSelectedAccountIds(next);
                    }}
                    className={`flex items-center justify-between p-3.5 rounded-xl border transition-all text-left ${
                      isSelected
                        ? "border-primary bg-primary/15 shadow-sm ring-1 ring-primary/40 font-semibold"
                        : "border-white/[0.08] bg-secondary/30 hover:border-primary/40 text-muted-foreground hover:text-foreground"
                    }`}
                    aria-pressed={isSelected}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-md border ${
                          isSelected
                            ? "border-primary bg-primary text-white"
                            : "border-muted-foreground/40"
                        }`}
                      >
                        {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 font-semibold text-xs truncate">
                          {isInstagram ? (
                            <Instagram className="h-3.5 w-3.5 text-pink-500 shrink-0" />
                          ) : (
                            <span className="inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[9px] font-bold text-white leading-none">f</span>
                          )}
                          <span className="truncate">@{acc.handle}</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground uppercase font-bold">
                          {acc.platform}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold text-emerald-400 shrink-0 ml-2">Connected</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="mt-3 grid grid-cols-2 gap-3">
              {(["Instagram", "Facebook"] as Platform[]).map((platform) => {
                const isSelected = platforms.includes(platform);
                return (
                  <button
                    key={platform}
                    type="button"
                    onClick={() => togglePlatform(platform)}
                    className={`flex min-h-[70px] flex-col items-center justify-center gap-1.5 rounded-xl border transition-all ${
                      isSelected ? "border-primary bg-primary/15 shadow-sm ring-1 ring-primary/40" : "border-white/[0.08] bg-secondary/30 hover:border-primary/40 opacity-75"
                    }`}
                    aria-pressed={isSelected}
                  >
                    <span className="text-sm font-semibold">{platform === "Instagram" ? <Instagram className="h-5 w-5 text-pink-500" /> : <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">f</span>}</span>
                    <span className="text-[11px] font-medium">{platform}</span>
                    <span className="text-[10px] text-muted-foreground">Not linked</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
        <div className="mt-6 border-t border-white/[0.08] pt-5">
          <h3 className="text-sm font-semibold text-foreground">When would you like it to go out?</h3>
          <div className="mt-3 grid grid-cols-2 rounded-xl border border-white/[0.08] bg-secondary/50 p-1">
            <Button
              variant="ghost"
              className={`h-9 rounded-lg text-xs font-semibold transition-all ${timing === "now" ? "bg-primary text-white shadow-sm shadow-primary/25" : "text-muted-foreground hover:text-foreground"}`}
              onClick={() => onTiming("now")}
              aria-pressed={timing === "now"}
            >
              Post now
            </Button>
            <Button
              variant="ghost"
              className={`h-9 rounded-lg text-xs font-semibold transition-all ${timing === "schedule" ? "bg-primary text-white shadow-sm shadow-primary/25" : "text-muted-foreground hover:text-foreground"}`}
              onClick={() => onTiming("schedule")}
              aria-pressed={timing === "schedule"}
            >
              Schedule
            </Button>
          </div>
          {timing === "schedule" && (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="text-xs font-semibold text-muted-foreground">Day<Input className="mt-1.5 text-foreground rounded-xl" type="date" value={scheduledDate} onChange={(event) => onDate(event.target.value)} /></label>
              <label className="text-xs font-semibold text-muted-foreground">Time<Input className="mt-1.5 text-foreground rounded-xl" type="time" value={scheduledTime} onChange={(event) => onTime(event.target.value)} /></label>
              <p className="sm:col-span-2 text-xs text-muted-foreground">Times shown in your local timezone.</p>
            </div>
          )}
        </div>
        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.08] pt-6">
          <Button variant="outline" className="h-11 px-5 rounded-xl font-medium" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" /> Back to poster
          </Button>
          <Button
            className="h-11 px-7 rounded-xl font-semibold gap-2 shadow-lg shadow-primary/25 hover:shadow-primary/40"
            disabled={connectedAccounts.length > 0 && selectedAccountIds.length === 0}
            onClick={onSubmit}
          >
            {timing === "now" ? "Post now" : "Schedule post"}<ArrowRight className="h-4 w-4 stroke-[2.5]" />
          </Button>
        </div>
      </section>
    </div>
  );
}

function ScheduledPage({
  posts,
  businessName,
  onChange,
  onCreate,
  onSelectPost,
}: {
  posts: SocialPost[];
  businessName: string;
  onChange: (posts: SocialPost[]) => void;
  onCreate: () => void;
  onSelectPost?: ((post: SocialPost) => void) | undefined;
}) {
  const [view, setView] = useState<"list" | "calendar">("list");
  const [month, setMonth] = useState(new Date(2026, 9, 1));
  const scheduled = posts.filter((post) => post.status === "Scheduled").sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1).getDay();
  const monthLabel = month.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const shiftMonth = (amount: number) => setMonth(new Date(month.getFullYear(), month.getMonth() + amount, 1));

  return (
    <>
      <ScreenTitle
        eyebrow="YOUR CONTENT CALENDAR"
        title="Scheduled posts"
        description="A steady rhythm, without the last-minute rush."
        action={
          <Button onClick={onCreate} className="h-11 px-6 rounded-xl font-semibold gap-2 shadow-lg shadow-primary/25 hover:shadow-primary/40">
            <Plus className="h-4 w-4 stroke-[2.5]" /> New post
          </Button>
        }
      />
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] pb-4">
        <div className="rounded-xl border border-white/[0.08] bg-secondary/50 p-1 flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            className={`h-8 rounded-lg px-3 text-xs font-semibold gap-2 transition-all ${
              view === "list" ? "bg-primary text-white shadow-xs" : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setView("list")}
            aria-pressed={view === "list"}
          >
            <List className="h-3.5 w-3.5" /> List
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={`h-8 rounded-lg px-3 text-xs font-semibold gap-2 transition-all ${
              view === "calendar" ? "bg-primary text-white shadow-xs" : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setView("calendar")}
            aria-pressed={view === "calendar"}
          >
            <CalendarDays className="h-3.5 w-3.5" /> Month
          </Button>
        </div>
        {view === "calendar" && (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" aria-label="Previous month" onClick={() => shiftMonth(-1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="min-w-32 text-center text-sm font-semibold text-foreground">{monthLabel}</span>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" aria-label="Next month" onClick={() => shiftMonth(1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
      {view === "list" ? (
        <div className="space-y-3">
          {scheduled.length ? (
            scheduled.map((post) => (
              <ScheduledRow
                key={post.id}
                post={post}
                businessName={businessName}
                onReschedule={(nextDate) => onChange(posts.map((item) => item.id === post.id ? { ...item, date: nextDate } : item))}
                onCancel={() => { onChange(posts.filter((item) => item.id !== post.id)); toast.success("Scheduled post cancelled"); }}
                onSelectPost={onSelectPost}
              />
            ))
          ) : (
            <EmptyState title="Your calendar is clear." message="Create a post whenever a good idea comes along." action="Create a post" onAction={onCreate} />
          )}
        </div>
      ) : (
        <div className="grid grid-cols-7 border-l border-t border-white/[0.08] rounded-2xl overflow-hidden shadow-xl">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="border-b border-r border-white/[0.08] bg-secondary/70 px-1 py-2.5 text-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground sm:px-3 sm:text-xs">{day}</div>
          ))}
          {Array.from({ length: firstDay + daysInMonth }, (_, index) => {
            const day = index - firstDay + 1;
            const matches = scheduled.filter((post) => Number(post.date.slice(-2)) === day && Number(post.date.slice(5, 7)) === month.getMonth() + 1 && Number(post.date.slice(0, 4)) === month.getFullYear());
            return (
              <div key={index} className={`min-h-[76px] border-b border-r border-white/[0.08] p-1.5 sm:min-h-28 sm:p-2.5 ${day < 1 ? "bg-secondary/20" : "bg-card/70"}`}>
                <span className={`text-[10px] sm:text-xs font-semibold ${day === 17 && month.getMonth() === 9 ? "flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white" : "text-muted-foreground"}`}>{day > 0 ? day : ""}</span>
                {matches.map((post) => (
                  <button
                    key={post.id}
                    onClick={() => onSelectPost ? onSelectPost(post) : toast(`${post.headline} · ${post.time}`)}
                    className="mt-1.5 block w-full truncate rounded-md border-l-2 border-primary bg-primary/15 px-1.5 py-1 text-left text-[9px] font-medium text-foreground sm:text-[11px] hover:bg-primary/25 transition-colors"
                  >
                    {post.headline}
                  </button>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

function ScheduledRow({
  post,
  businessName,
  onReschedule,
  onCancel,
  onSelectPost,
}: {
  post: SocialPost;
  businessName: string;
  onReschedule: (date: string) => void;
  onCancel: () => void;
  onSelectPost?: ((post: SocialPost) => void) | undefined;
}) {
  const [editing, setEditing] = useState(false);
  const [date, setDate] = useState(post.date);
  const displayDate = formatPostDate(post.date, post.time);

  return (
    <article
      onClick={() => onSelectPost?.(post)}
      className="group cursor-pointer rounded-2xl border border-white/[0.08] bg-card/60 p-4 transition-all duration-200 hover:border-primary/40 hover:bg-card/90 hover:shadow-xl hover:shadow-black/40 grid gap-4 sm:grid-cols-[76px_1fr_auto] sm:items-center"
    >
      <div className="w-[76px] shrink-0">
        {post.imageUrl ? (
          <div className="aspect-[4/5] w-full overflow-hidden rounded-xl border border-white/10 bg-secondary/40 shadow-md">
            <img
              src={post.imageUrl}
              alt={post.headline}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
          </div>
        ) : (
          <div className="w-full rounded-xl overflow-hidden border border-white/10 shadow-md">
            <Poster
              theme={post.theme}
              eyebrow={businessName.toUpperCase()}
              headline={post.headline}
              price={post.price}
              footer="FRESH DAILY"
            />
          </div>
        )}
      </div>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={post.status} />
          <span className="text-xs font-medium text-muted-foreground">{post.platform}</span>
        </div>
        <h3 className="mt-2 text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
          {post.headline}
        </h3>
        <p className="mt-1 line-clamp-1 text-xs text-muted-foreground whitespace-pre-line leading-relaxed">
          {cleanCaptionDisplay(post.caption)}
        </p>
        <div className="mt-2.5 flex items-center gap-1.5 text-xs text-muted-foreground">
          <CalendarDays className="h-3.5 w-3.5 text-primary/70" />
          <span>{displayDate}</span>
        </div>
      </div>
      <div
        className="flex items-center gap-2 shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        <Button variant="outline" size="sm" className="h-9 rounded-xl text-xs" onClick={() => setEditing(!editing)}>
          {editing ? "Close" : "Reschedule"}
        </Button>
        <Button variant="ghost" size="sm" className="h-9 rounded-xl text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={onCancel}>
          Cancel
        </Button>
      </div>
      {editing && (
        <div
          className="flex items-end gap-2.5 border-t border-white/[0.08] pt-3 sm:col-span-3"
          onClick={(e) => e.stopPropagation()}
        >
          <label className="text-xs text-muted-foreground font-medium">
            New scheduled date
            <Input className="mt-1.5 h-9 rounded-xl" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
          </label>
          <Button size="sm" className="h-9 rounded-xl" onClick={() => { onReschedule(date); setEditing(false); toast.success("Post rescheduled"); }}>
            Save date
          </Button>
        </div>
      )}
    </article>
  );
}

function PostedPage({
  posts,
  businessName,
  onSelectPost,
}: {
  posts: SocialPost[];
  businessName: string;
  onSelectPost?: ((post: SocialPost) => void) | undefined;
}) {
  const [filter, setFilter] = useState<"All" | Platform>("All");
  const posted = posts.filter((post) => post.status === "Posted" && (filter === "All" || post.platform === filter));

  return (
    <>
      <ScreenTitle eyebrow="A LITTLE MOMENTUM" title="Posted history" description="Everything you've shared, all in one place." />
      <div className="mb-6 inline-flex rounded-xl border border-white/[0.08] bg-secondary/40 p-1.5 gap-1.5">
        {(["All", "Instagram", "Facebook"] as const).map((item) => (
          <Button
            key={item}
            variant={filter === item ? "secondary" : "ghost"}
            size="sm"
            className={`h-8 rounded-lg text-xs font-medium transition-all ${
              filter === item ? "bg-card text-foreground shadow-sm border border-white/[0.08]" : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setFilter(item)}
            aria-pressed={filter === item}
          >
            {item}
          </Button>
        ))}
      </div>
      <div className="space-y-3">
        {posted.length ? (
          posted.map((post) => (
            <article
              key={post.id}
              onClick={() => onSelectPost?.(post)}
              className="group cursor-pointer rounded-2xl border border-white/[0.08] bg-card/60 p-4 transition-all duration-200 hover:border-primary/40 hover:bg-card/90 hover:shadow-xl hover:shadow-black/40 grid gap-4 sm:grid-cols-[76px_1fr_auto] sm:items-center"
            >
              <div className="w-[76px] shrink-0">
                {post.imageUrl ? (
                  <div className="aspect-[4/5] w-full overflow-hidden rounded-xl border border-white/10 bg-secondary/40 shadow-md">
                    <img
                      src={post.imageUrl}
                      alt={post.headline}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>
                ) : (
                  <div className="w-full rounded-xl overflow-hidden border border-white/10 shadow-md">
                    <Poster
                      theme={post.theme}
                      eyebrow={businessName.toUpperCase()}
                      headline={post.headline}
                      price={post.price}
                      footer="FRESH DAILY"
                    />
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                  {post.headline}
                </h3>
                <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground whitespace-pre-line">
                  {cleanCaptionDisplay(post.caption)}
                </p>
                <div className="mt-2.5 flex items-center gap-2 text-xs text-muted-foreground font-medium">
                  <Instagram className="h-3.5 w-3.5 text-primary/70" />
                  <span>{post.platform}</span>
                  <span className="text-white/20">·</span>
                  <span>{formatPostDate(post.date, post.time)}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 rounded-xl gap-2 text-xs"
                  onClick={() => onSelectPost?.(post)}
                >
                  <Eye className="h-3.5 w-3.5" /> View details
                </Button>
                {post.platform === "Instagram" && (
                  <a
                    href="https://www.instagram.com/avero.innovations/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="ghost" size="sm" className="h-9 rounded-xl gap-1.5 text-xs text-muted-foreground hover:text-foreground">
                      <ExternalLink className="h-3.5 w-3.5" /> Instagram
                    </Button>
                  </a>
                )}
              </div>
            </article>
          ))
        ) : (
          <EmptyState title="Nothing shared here yet." message="Your finished posts will show up in this history." />
        )}
      </div>
    </>
  );
}

function PostDetailModal({
  post,
  businessName,
  isOpen,
  onClose,
}: {
  post: SocialPost | null;
  businessName: string;
  isOpen: boolean;
  onClose: () => void;
}) {
  if (!post) return null;
  const cleanCaption = cleanCaptionDisplay(post.caption);
  const formattedDateTime = formatPostDate(post.date, post.time);

  const handleCopyCaption = () => {
    navigator.clipboard.writeText(cleanCaption);
    toast.success("Caption copied to clipboard");
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto p-6 rounded-2xl border-white/10 bg-card/95 backdrop-blur-2xl shadow-2xl">
        <DialogHeader className="border-b border-white/[0.08] pb-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-secondary/60 text-foreground border border-white/10">
                {post.platform === "Instagram" ? (
                  <Instagram className="h-4 w-4 text-rose-400" />
                ) : (
                  <span className="text-xs font-bold text-sky-400">{post.platform === "Facebook" ? "f" : "𝕏"}</span>
                )}
              </span>
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {post.platform}
              </span>
              <StatusBadge status={post.status} />
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock3 className="h-3.5 w-3.5 text-primary/70" />
              <span>{formattedDateTime}</span>
            </div>
          </div>
          <DialogTitle className="mt-3 font-display text-2xl font-semibold leading-snug text-left text-foreground">
            {post.headline}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Details for post {post.headline}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4 md:grid-cols-[280px_1fr]">
          {/* Left Column: Image or Poster Preview */}
          <div className="flex flex-col items-center">
            {post.imageUrl ? (
              <div className="aspect-[4/5] w-full overflow-hidden rounded-2xl border border-white/10 bg-secondary/40 shadow-xl">
                <img
                  src={post.imageUrl}
                  alt={post.headline}
                  className="h-full w-full object-cover"
                />
              </div>
            ) : (
              <div className="w-full shadow-xl rounded-2xl overflow-hidden border border-white/10">
                <Poster
                  theme={post.theme}
                  eyebrow={businessName.toUpperCase()}
                  headline={post.headline}
                  price={post.price}
                  footer="FRESH DAILY"
                />
              </div>
            )}
            {post.price && (
              <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-secondary/80 border border-white/[0.08] px-3.5 py-1 text-xs font-semibold text-foreground">
                Offer / Price: {post.price}
              </div>
            )}
          </div>

          {/* Right Column: Full Caption and Metadata */}
          <div className="flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Post Caption & Hashtags
                </h4>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 rounded-lg gap-1.5 text-xs text-primary hover:text-primary/80 hover:bg-primary/10"
                  onClick={handleCopyCaption}
                >
                  <Copy className="h-3.5 w-3.5" /> Copy caption
                </Button>
              </div>

              <div className="rounded-2xl border border-white/[0.08] bg-secondary/30 p-4 max-h-[300px] overflow-y-auto">
                <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground selection:bg-primary/20">
                  {cleanCaption}
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-white/[0.08] bg-secondary/20 p-3.5 space-y-2 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>Account:</span>
                <span className="font-medium text-foreground">
                  {post.platform === "Instagram" ? "@avero.innovations" : businessName}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Posted time:</span>
                <span className="font-medium text-foreground">{formattedDateTime}</span>
              </div>
              <div className="flex justify-between">
                <span>Status:</span>
                <span className="font-medium text-emerald-400">{post.status}</span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.08] pt-4">
          <div className="flex items-center gap-2">
            {post.platform === "Instagram" && (
              <a
                href="https://www.instagram.com/avero.innovations/"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" className="h-10 rounded-xl gap-2 text-xs font-medium">
                  <Instagram className="h-4 w-4" /> View on Instagram <ExternalLink className="h-3.5 w-3.5" />
                </Button>
              </a>
            )}
          </div>
          <Button variant="default" className="h-10 rounded-xl px-6 font-medium" onClick={onClose}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function BrandKit({
  data,
  onSave,
}: {
  data: BrandKitData;
  onSave: (updated: BrandKitData) => void;
}) {
  const [name, setName] = useState(data.businessName || "Avero Innovations");
  const [tagline, setTagline] = useState(data.tagline || "Ideas into scalable products.");
  const [location, setLocation] = useState(data.location || "Online / Global");
  const [phone, setPhone] = useState(data.phone || "");
  const [colors, setColors] = useState<string[]>(data.colors && data.colors.length > 0 ? data.colors : ["Tomato", "Olive"]);
  const [font, setFont] = useState(data.font || "Fraunces");
  const [logoName, setLogoName] = useState(data.logoName || "");
  const [logoUrl, setLogoUrl] = useState(data.logoUrl || "");
  const [tone, setTone] = useState(data.tone || "Friendly");
  const [timezone, setTimezone] = useState(data.timezone || "Asia/Kolkata");
  const [defaultHashtags, setDefaultHashtags] = useState(data.defaultHashtags || "");
  const [uploadingLogo, setUploadingLogo] = useState(false);

  useEffect(() => {
    setName(data.businessName || "");
    setTagline(data.tagline || "");
    setLocation(data.location || "");
    setPhone(data.phone || "");
    setColors(data.colors && data.colors.length > 0 ? data.colors : ["Tomato", "Olive"]);
    setFont(data.font || "Fraunces");
    setLogoName(data.logoName || "");
    setLogoUrl(data.logoUrl || "");
    setTone(data.tone || "Friendly");
    setTimezone(data.timezone || "Asia/Kolkata");
    setDefaultHashtags(data.defaultHashtags || "");
  }, [data.businessId, data.businessName, data.logoUrl]);

  const toggleColor = (color: string) =>
    setColors(
      colors.includes(color)
        ? colors.filter((item) => item !== color)
        : colors.length < 3
        ? [...colors, color]
        : [colors[0] ?? color, colors[2] ?? color, color]
    );

  const handleSave = () => {
    if (phone && !REGEX.phone.test(phone)) {
      toast.error("Please enter a valid phone number");
      return;
    }
    const updated: BrandKitData = {
      businessId: data.businessId,
      businessName: name.trim() || "Avero Innovations",
      tagline: tagline.trim(),
      location: location.trim(),
      phone: phone.trim(),
      colors: colors.length > 0 ? colors : ["Tomato", "Olive"],
      font,
      logoName,
      logoUrl,
      tone,
      timezone,
      defaultHashtags,
    };
    onSave(updated);
  };

  const handleLogoFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const dataUrl = reader.result as string;
        // Instantly display local preview so user sees it right away
        setLogoUrl(dataUrl);
        setLogoName(file.name);

        const res = await uploadBrandLogo({
          data: {
            dataUrl,
            filename: file.name,
          },
        });

        if (res && res.success && res.publicUrl) {
          setLogoUrl(res.publicUrl);
          setLogoName(file.name);
          toast.success("Logo uploaded successfully!");
        } else {
          toast.error("Logo upload failed. Using local preview.");
        }
      } catch (err: any) {
        toast.error(err?.message || "Logo upload failed");
      } finally {
        setUploadingLogo(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const previewTheme = (colors[0] ? colors[0].toLowerCase() : "tomato");

  return (
    <>
      <ScreenTitle
        eyebrow="YOUR LOOK, YOUR VOICE"
        title="Brand kit"
        description="A few details help every post feel like it came from you."
        action={
          <Button onClick={handleSave} className="h-10 rounded-xl gap-2 font-medium shadow-md shadow-primary/20">
            <Check className="h-4 w-4" /> Save changes
          </Button>
        }
      />
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px] items-start w-full">
        <div className="space-y-8 min-w-0 w-full">
          <section className="border-b border-white/[0.08] pb-7">
            <h2 className="font-display text-2xl font-semibold text-foreground">The essentials</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <LabeledInput label="Business name" value={name} onChange={setName} />
              <LabeledInput label="Tagline" value={tagline} onChange={setTagline} />
              <LabeledInput label="Location" value={location} onChange={setLocation} />
              <LabeledInput label="Phone" value={phone} onChange={setPhone} />
            </div>
          </section>
          <section className="border-b border-white/[0.08] pb-7">
            <div className="flex items-baseline justify-between">
              <h2 className="font-display text-2xl font-semibold text-foreground">Your colors</h2>
              <span className="text-xs text-muted-foreground">Pick up to three</span>
            </div>
            <div className="mt-4 flex flex-wrap gap-2.5">
              {palette.map((color) => {
                const isSelected = colors.includes(color.name);
                return (
                  <button
                    key={color.name}
                    onClick={() => toggleColor(color.name)}
                    className={`flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-xs font-medium transition-all ${
                      isSelected
                        ? "border-primary bg-primary/10 text-primary shadow-xs"
                        : "border-white/[0.08] bg-secondary/30 text-muted-foreground hover:border-white/20 hover:text-foreground"
                    }`}
                    aria-pressed={isSelected}
                  >
                    <span className={`brand-swatch ${color.className}`} />
                    <span>{color.name}</span>
                    {isSelected && <Check className="h-3 w-3 text-primary ml-0.5" />}
                  </button>
                );
              })}
            </div>
          </section>
          <section className="border-b border-white/[0.08] pb-7">
            <div className="flex items-baseline justify-between">
              <h2 className="font-display text-2xl font-semibold text-foreground">Heading style</h2>
              <span className="text-xs text-muted-foreground">Used for the big words on your posters</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Select a typeface below to see your posters update in real-time.</p>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {[
                { name: "Fraunces", style: "Soft Editorial Serif", family: "'Fraunces', Georgia, serif" },
                { name: "DM Serif", style: "Dramatic Display Serif", family: "'DM Serif Display', Georgia, serif" },
                { name: "Work Sans", style: "Bold Modern Sans-Serif", family: "'Work Sans', sans-serif" },
              ].map((item) => {
                const isSelected = font === item.name;
                return (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => {
                      setFont(item.name);
                      toast.info(`Heading style set to ${item.name}`);
                    }}
                    className={`flex flex-col items-start rounded-2xl border p-4 text-left transition-all ${
                      isSelected
                        ? "border-primary bg-primary/10 ring-1 ring-primary shadow-md shadow-primary/10"
                        : "border-white/[0.08] bg-card/60 hover:border-primary/40 hover:bg-card/90"
                    }`}
                    aria-pressed={isSelected}
                  >
                    <div className="flex w-full items-center justify-between">
                      <span
                        className="text-lg leading-tight text-foreground"
                        style={{
                          fontFamily: item.family,
                          fontWeight: item.name === "Work Sans" ? 700 : 600,
                        }}
                      >
                        {item.name}
                      </span>
                      {isSelected && (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white text-[10px]">
                          <Check className="h-3 w-3" />
                        </span>
                      )}
                    </div>
                    <span className="mt-1 text-[11px] text-muted-foreground">
                      {item.style}
                    </span>
                    <div
                      className="mt-3 text-xs truncate max-w-full text-foreground/80 border-t border-white/[0.08] pt-2 w-full"
                      style={{
                        fontFamily: item.family,
                        fontWeight: item.name === "Work Sans" ? 700 : 500,
                      }}
                    >
                      Turning ideas into reality
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
          <section>
            <h2 className="font-display text-2xl font-semibold text-foreground">Logo</h2>
            <p className="mt-1 text-xs text-muted-foreground">Add your mark to the corner of a poster.</p>
            
            {logoUrl ? (
              <div className="mt-4 rounded-2xl border border-white/[0.08] bg-card/70 p-5 space-y-3.5 shadow-md">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white p-2 shadow-xs">
                      <img src={logoUrl} alt="Logo preview" className="h-full w-full object-contain" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{logoName || "Brand Mark"}</p>
                      <span className="inline-flex items-center gap-1 mt-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-[10px] font-medium text-emerald-400">
                        <Check className="h-3 w-3 text-emerald-400" /> Stored in Cloud Storage (R2)
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <label className="cursor-pointer">
                      <Button variant="outline" size="sm" className="h-9 rounded-xl text-xs gap-1.5" asChild>
                        <span>
                          <Upload className="h-3.5 w-3.5" />
                          {uploadingLogo ? "Uploading..." : "Replace"}
                        </span>
                      </Button>
                      <input
                        className="sr-only"
                        type="file"
                        accept="image/*"
                        disabled={uploadingLogo}
                        onChange={handleLogoFile}
                      />
                    </label>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-9 rounded-xl text-xs text-destructive hover:bg-destructive/10"
                      onClick={() => {
                        setLogoUrl("");
                        setLogoName("");
                        toast.info("Logo removed");
                      }}
                    >
                      <X className="h-3.5 w-3.5 mr-1" /> Remove
                    </Button>
                  </div>
                </div>

                {/* Show direct CDN link */}
                <div className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-secondary/30 px-3.5 py-2 min-w-0 max-w-full overflow-hidden">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider shrink-0">CDN Link</span>
                  <div className="min-w-0 flex-1 overflow-hidden">
                    <p className="text-[11px] font-mono text-foreground/80 truncate select-all" title={logoUrl}>
                      {logoUrl}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2.5 rounded-lg text-[11px] gap-1 shrink-0 hover:bg-secondary/60"
                    onClick={() => {
                      navigator.clipboard.writeText(logoUrl);
                      toast.success("CDN link copied to clipboard");
                    }}
                  >
                    <Copy className="h-3 w-3" /> Copy
                  </Button>
                </div>
              </div>
            ) : (
              <label className="mt-4 flex min-h-32 cursor-pointer flex-col items-center justify-center gap-2 border-2 border-dashed border-white/10 rounded-2xl text-xs text-muted-foreground transition-all hover:border-primary/50 hover:bg-secondary/20 bg-secondary/10 p-6">
                {uploadingLogo ? (
                  <div className="flex items-center gap-2.5 py-2">
                    <LoaderCircle className="h-5 w-5 animate-spin text-primary" />
                    <span className="font-medium text-foreground">Uploading to Cloud Storage...</span>
                  </div>
                ) : (
                  <>
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/60 text-muted-foreground">
                      <Upload className="h-5 w-5" />
                    </span>
                    <span className="font-medium text-sm text-foreground">Click to upload your logo</span>
                    <span className="text-xs text-muted-foreground">PNG, JPG, SVG or WEBP (Uploaded directly to Cloud CDN)</span>
                  </>
                )}
                <input
                  className="sr-only"
                  type="file"
                  accept="image/*"
                  disabled={uploadingLogo}
                  onChange={handleLogoFile}
                />
              </label>
            )}
          </section>
        </div>
        <aside className="w-full lg:w-[300px] shrink-0 lg:sticky lg:top-24 lg:self-start">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Live Poster Preview</p>
          <div className="rounded-2xl border border-white/[0.08] bg-card/70 backdrop-blur-xl p-4 shadow-xl shadow-black/30 w-full max-w-[300px]">
            <div className="mb-3.5 flex items-center gap-2.5">
              {logoUrl ? (
                <div className="h-8 w-8 rounded-full overflow-hidden border border-primary/20 bg-white p-0.5 shrink-0 flex items-center justify-center">
                  <img src={logoUrl} alt="Logo" className="h-full w-full object-contain" />
                </div>
              ) : (
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary shrink-0">
                  {(name || "B").charAt(0).toUpperCase()}
                </span>
              )}
              <div className="min-w-0">
                <p className="text-xs font-semibold text-foreground truncate">{name || "Your business"}</p>
                {logoName && <p className="text-[10px] text-muted-foreground truncate">{logoName}</p>}
              </div>
            </div>
            <div className="rounded-xl overflow-hidden border border-white/10 shadow-md">
              <Poster
                theme={previewTheme}
                eyebrow={location || (name ? name.toUpperCase() : "YOUR BRAND")}
                headline="Turning ideas into reality"
                price="Available now"
                footer={tagline || "YOUR TAGLINE"}
                logoUrl={logoUrl}
                font={font}
              />
            </div>
            <p className="mt-3 text-[11px] text-muted-foreground">Typeface · <strong className="font-semibold text-foreground">{font}</strong></p>
          </div>
        </aside>
      </div>
    </>
  );
}

function LabeledInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="text-xs font-medium text-foreground">
      {label}
      <Input className="mt-2 font-normal" value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function Accounts({
  connectedAccounts,
  businessName,
  activeBusinessId,
  businesses = [],
  billingInfo,
  userEmail,
  onRefresh,
  onAccountsChange,
  onConnect,
}: {
  connectedAccounts: Array<{ id?: string; platform: string; handle: string; status?: string; externalAccountId?: string }>;
  businessName: string;
  activeBusinessId?: string;
  businesses?: BusinessSummaryItem[];
  billingInfo?: { isFreeTier: boolean; notice: string; totalAccounts: number };
  userEmail: string;
  onRefresh?: () => void;
  onAccountsChange?: (accounts: any[]) => void;
  onConnect?: (bizId: string, platform?: Platform) => void;
}) {
  const isMeetSoni = userEmail === "meetsoni1075@gmail.com";
  const [connectModalOpen, setConnectModalOpen] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>("Instagram");
  const [loading, setLoading] = useState(false);

  const instagramAccounts = connectedAccounts.filter(
    (a) => a.platform.toLowerCase() === "instagram"
  );
  const isInstagramActive = instagramAccounts.length > 0;

  const handleDisconnect = async (accountId?: string, platform: Platform = "Instagram") => {
    try {
      await disconnectAccount({
        data: {
          business_id: activeBusinessId,
          account_id: accountId,
          platform,
        },
      });
      toast.success(`${platform} disconnected`);
      onRefresh?.();
    } catch (err: any) {
      toast.error(err?.message || `Failed to disconnect ${platform}`);
    }
  };

  const handleStartOAuth = async () => {
    if (!activeBusinessId) {
      toast.error("No active business selected");
      return;
    }
    setLoading(true);
    try {
      if (onConnect) {
        onConnect(activeBusinessId, selectedPlatform);
        return;
      }
      const res = await getZernioConnectUrl({
        data: {
          platform: selectedPlatform,
          businessId: activeBusinessId,
          origin: typeof window !== "undefined" ? window.location.origin : undefined,
        },
      });
      const url = (res as any)?.data?.url ?? (res as any)?.url;
      if (url) {
        toast.info(`Redirecting to ${selectedPlatform} OAuth authorization...`);
        window.location.href = url;
        return;
      }
      const errMsg = (res as any)?.error?.message || (res as any)?.message || "Could not generate OAuth connect URL";
      toast.error(errMsg);
    } catch (err: any) {
      toast.error(err?.message || "Failed to start OAuth flow");
    } finally {
      setLoading(false);
    }
  };

  const totalConnected = billingInfo?.totalAccounts ?? connectedAccounts.length;
  const isFreeTier = billingInfo?.isFreeTier ?? totalConnected <= 2;

  return (
    <>
      <ScreenTitle
        eyebrow="WORKSPACE SOCIAL CONNECTIONS"
        title="Accounts"
        description={`Manage Instagram and social media connections specifically for ${businessName}.`}
      />

      {/* Zernio Account Billing Notice */}
      <div className="mb-6 max-w-3xl rounded-2xl border border-white/[0.08] bg-card/70 backdrop-blur-xl p-4 shadow-lg shadow-black/20">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className={`h-3 w-3 rounded-full ${isFreeTier ? "bg-emerald-500 shadow-sm shadow-emerald-500/50 animate-pulse" : "bg-primary shadow-sm shadow-primary/50"}`} />
            <div>
              <p className="text-xs font-semibold text-foreground">
                Zernio Account Tier · {totalConnected} Connected Account{totalConnected === 1 ? "" : "s"} Total
              </p>
              <p className="mt-0.5 text-[11px] text-muted-foreground leading-relaxed">
                {billingInfo?.notice ||
                  (isFreeTier
                    ? "Free Tier active: First 2 connected accounts across your workspaces are included free."
                    : "Paid Tier: Billed per connected account ($6/mo for 3-10 accounts, $3/mo for 11+ accounts).")}
              </p>
            </div>
          </div>
          <span className="rounded-full border border-white/[0.08] bg-secondary/50 px-3 py-1 text-[10px] font-mono font-medium text-foreground">
            {isFreeTier ? `${totalConnected}/2 Free Used` : `${totalConnected} Accounts Active`}
          </span>
        </div>
      </div>

      <div className="max-w-3xl space-y-4">
        {/* Instagram Section */}
        <div className="rounded-2xl border border-white/[0.08] bg-card/60 backdrop-blur-xl p-5 shadow-lg shadow-black/20 transition-all hover:border-white/15">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-secondary/40 text-foreground shadow-sm">
                <Instagram className="h-6 w-6 text-rose-400" />
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                  Instagram Professional
                  {isInstagramActive && (
                    <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-[10px] font-medium text-emerald-400">
                      Active
                    </span>
                  )}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Direct image and carousel posting via Meta Graph API for {businessName}.
                </p>
              </div>
            </div>
            <Button
              className="h-10 rounded-xl gap-2 font-medium"
              onClick={() => {
                setSelectedPlatform("Instagram");
                setConnectModalOpen(true);
              }}
            >
              <Instagram className="h-4 w-4" />
              {isInstagramActive ? "Add Another Account" : "Connect Instagram"}
            </Button>
          </div>

          {/* Connected Instagram Accounts List */}
          {instagramAccounts.length > 0 && (
            <div className="mt-5 space-y-2.5 border-t border-white/[0.08] pt-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Connected Handles for {businessName}:
              </p>
              <div className="space-y-2">
                {instagramAccounts.map((acc) => {
                  const isExpired = acc.status === "expired" || acc.status === "failed";
                  return (
                    <div
                      key={acc.id || acc.handle}
                      className="flex items-center justify-between rounded-xl border border-white/[0.08] bg-secondary/30 p-3.5 transition-colors hover:bg-secondary/50"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                          @
                        </span>
                        <div>
                          <p className="text-xs font-semibold text-foreground">@{acc.handle}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                isExpired ? "bg-amber-500" : "bg-emerald-500 animate-pulse"
                              }`}
                            />
                            <span className="text-[10px] text-muted-foreground capitalize">
                              {isExpired ? "Token Expired" : "Connected & Verified"}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isExpired && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 rounded-xl text-xs text-amber-500 border-amber-500/40 hover:bg-amber-500/10"
                            onClick={() => onConnect?.(activeBusinessId || "")}
                          >
                            Reconnect
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 rounded-xl text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => handleDisconnect(acc.id, "Instagram")}
                        >
                          Disconnect
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Facebook row */}
        {(["Facebook"] as Platform[]).map((platform) => {
          const acc = connectedAccounts.find((a) => a.platform.toLowerCase() === platform.toLowerCase());
          const connected = Boolean(acc);
          return (
            <div
              key={platform}
              className="rounded-2xl border border-white/[0.08] bg-card/60 backdrop-blur-xl p-5 shadow-lg shadow-black/20 flex flex-wrap items-center justify-between gap-4 transition-all hover:border-white/15"
            >
              <div className="flex items-center gap-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-secondary/40">
                  <span className="text-lg font-bold text-sky-400">f</span>
                </span>
                <div>
                  <p className="text-sm font-semibold text-foreground">{platform}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {connected ? `Connected · @${acc?.handle}` : "Not connected yet"}
                  </p>
                </div>
              </div>
              <Button
                variant={connected ? "outline" : "default"}
                size="sm"
                className="h-10 rounded-xl font-medium"
                onClick={() => {
                  if (connected) {
                    handleDisconnect(acc?.id, platform);
                  } else {
                    setSelectedPlatform(platform);
                    setConnectModalOpen(true);
                  }
                }}
              >
                {connected ? "Disconnect" : "Connect"}
              </Button>
            </div>
          );
        })}
      </div>

      <p className="mt-6 max-w-3xl border-l-2 border-primary/50 py-1 pl-4 text-xs leading-relaxed text-muted-foreground">
        {isInstagramActive
          ? `Instagram Business/Creator account active for ${businessName}. Posters generated in this workspace publish exclusively to this account.`
          : `Connect your Instagram Professional (Business or Creator) account for ${businessName} to enable automated publishing.`}
      </p>

      {/* Connect Account Modal */}
      <Dialog open={connectModalOpen} onOpenChange={setConnectModalOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl border-white/10 bg-card/95 backdrop-blur-2xl">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl flex items-center gap-2">
              {selectedPlatform === "Instagram" && <Instagram className="h-5 w-5 text-primary" />}
              {selectedPlatform === "Facebook" && <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-sm">f</span>}
              Connect {selectedPlatform} to {businessName}
            </DialogTitle>
            <DialogDescription>
              Link your professional social account for <strong>{businessName}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="my-2 space-y-4">
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-left text-xs leading-relaxed text-amber-200">
              <p className="font-semibold flex items-center gap-1.5 text-foreground">
                <span className="text-amber-500 font-bold">⚠️</span> {selectedPlatform} Account Requirement
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed">
                {selectedPlatform === "Instagram" && (
                  <>Meta Graph API and Zernio require an Instagram <strong>Business</strong> or <strong>Creator</strong> profile. Personal accounts are not supported by Meta's API.</>
                )}
                {selectedPlatform === "Facebook" && (
                  <>Connect a <strong>Facebook Page</strong> that you manage. Meta Graph API allows automated publishing to Facebook Pages.</>
                )}
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold text-foreground">Automated OAuth Flow via Zernio</p>
              <p className="mb-3 text-xs text-muted-foreground leading-relaxed">
                You will be redirected to {selectedPlatform} to authorize posting for <strong>{businessName}</strong>. The connection will be mapped exclusively to this workspace.
              </p>
              <Button
                type="button"
                className="h-12 w-full gap-2 rounded-xl text-sm font-semibold shadow-md shadow-primary/20"
                disabled={loading}
                onClick={handleStartOAuth}
              >
                {loading ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" /> Connect with {selectedPlatform} via OAuth <ExternalLink className="h-3.5 w-3.5 ml-auto opacity-70" />
                  </>
                )}
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setConnectModalOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function SettingsPage({
  businessName,
  activeBusinessId,
  businesses = [],
  brandKit,
  posts = [],
  onBusinessNameChange,
  onRefresh,
  onDeleteBusiness,
  isMeetSoni,
}: {
  businessName: string;
  activeBusinessId?: string;
  businesses?: BusinessSummaryItem[];
  brandKit?: BrandKitData;
  posts?: SocialPost[];
  onBusinessNameChange: (name: string) => void;
  onRefresh?: () => void;
  onDeleteBusiness?: (bizId: string) => void;
  isMeetSoni: boolean;
}) {
  const [business, setBusiness] = useState(businessName);
  const [tagline, setTagline] = useState(brandKit?.tagline || "");
  const [timezone, setTimezone] = useState(brandKit?.timezone || "Asia/Kolkata");
  const [tone, setTone] = useState(brandKit?.tone || "Friendly");
  const [hashtags, setHashtags] = useState(
    brandKit?.defaultHashtags ||
      (isMeetSoni
        ? "#AveroInnovations, #DigitalProducts, #Tech"
        : "#Community, #Growth, #Social")
  );
  const [saving, setSaving] = useState(false);

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setBusiness(businessName);
    setTagline(brandKit?.tagline || "");
    setTimezone(brandKit?.timezone || "Asia/Kolkata");
    setTone(brandKit?.tone || "Friendly");
    setHashtags(brandKit?.defaultHashtags || "");
  }, [businessName, brandKit?.tagline, brandKit?.timezone, brandKit?.tone, brandKit?.defaultHashtags]);

  const handleSave = async () => {
    if (!business.trim()) {
      toast.error("Business name cannot be empty");
      return;
    }
    setSaving(true);
    try {
      if (activeBusinessId) {
        await updateBusiness({
          data: {
            business_id: activeBusinessId,
            name: business.trim(),
            tagline: tagline.trim(),
            timezone,
            tone: tone as any,
            default_hashtags: hashtags.trim() || null,
          },
        });
      }
      onBusinessNameChange(business.trim());
      onRefresh?.();
      toast.success("Workspace settings saved");
    } catch (err: any) {
      toast.error(err?.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const scheduledCount = posts.filter((p) => p.status === "Scheduled").length;
  const canDelete = businesses.length > 1;

  const handleConfirmDelete = async () => {
    if (!activeBusinessId) return;
    setDeleting(true);
    try {
      await onDeleteBusiness?.(activeBusinessId);
      setDeleteModalOpen(false);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <ScreenTitle
        eyebrow="WORKSPACE PREFERENCES"
        title="Settings"
        description={`Configure details, posting schedule timezone, and caption defaults for ${businessName}.`}
        action={
          <Button onClick={handleSave} disabled={saving} className="h-10 rounded-xl gap-2 font-medium shadow-md shadow-primary/20">
            {saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            Save settings
          </Button>
        }
      />
      <div className="max-w-2xl space-y-6">
        <section className="rounded-2xl border border-white/[0.08] bg-card/60 backdrop-blur-xl p-6 shadow-lg shadow-black/20">
          <h2 className="font-display text-2xl font-semibold text-foreground">Business details</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <LabeledInput label="Business name" value={business} onChange={setBusiness} />
            <LabeledInput label="Tagline" value={tagline} onChange={setTagline} />
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-foreground">
                Posting Timezone
                <select
                  className="mt-2 flex h-10 w-full rounded-xl border border-white/[0.08] bg-secondary/40 px-3.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25"
                  value={timezone}
                  onChange={(event) => setTimezone(event.target.value)}
                >
                  <option value="Asia/Kolkata">India (IST - UTC+5:30)</option>
                  <option value="Europe/Stockholm">Stockholm (CEST - UTC+2)</option>
                  <option value="America/New_York">New York (EDT - UTC-4)</option>
                  <option value="Europe/London">London (BST - UTC+1)</option>
                  <option value="America/Los_Angeles">Pacific (PDT - UTC-7)</option>
                  <option value="Asia/Dubai">Dubai (GST - UTC+4)</option>
                </select>
              </label>
              <p className="mt-1 text-[11px] text-muted-foreground">
                All scheduled posts for this business will release according to this timezone.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-white/[0.08] bg-card/60 backdrop-blur-xl p-6 shadow-lg shadow-black/20">
          <h2 className="font-display text-2xl font-semibold text-foreground">Caption preferences</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Pick the tone that sounds most like {businessName}.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {["Friendly", "Professional", "Bold", "Playful", "Casual", "Luxury"].map((item) => (
              <Button
                key={item}
                variant={tone === item ? "secondary" : "outline"}
                size="sm"
                className={`h-9 rounded-xl text-xs font-medium transition-all ${
                  tone === item ? "border-primary/40 bg-primary/10 text-primary shadow-xs" : "border-white/[0.08] text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => setTone(item)}
                aria-pressed={tone === item}
              >
                {item}
              </Button>
            ))}
          </div>
          <label className="mt-5 block text-xs font-medium text-foreground">
            Default hashtags
            <Textarea
              className="mt-2 min-h-20 text-sm font-normal rounded-xl border-white/[0.08] bg-secondary/40"
              value={hashtags}
              onChange={(event) => setHashtags(event.target.value)}
              placeholder="#Brand, #Community, #Launch"
            />
          </label>
        </section>

        {/* Danger Zone: Delete Business */}
        <section className="rounded-2xl border border-destructive/30 bg-destructive/5 backdrop-blur-xl p-6">
          <h3 className="font-display text-lg font-semibold text-destructive">Danger Zone</h3>
          <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
            Deleting a workspace will remove all its flyers, drafts, and disconnect any linked Instagram accounts.
          </p>
          {scheduledCount > 0 && (
            <p className="mt-2 text-xs font-medium text-amber-500">
              ⚠️ Notice: {scheduledCount} scheduled post(s) currently queued for this workspace.
            </p>
          )}
          <div className="mt-4">
            <Button
              variant="destructive"
              size="sm"
              className="h-9 rounded-xl font-medium"
              onClick={() => setDeleteModalOpen(true)}
              disabled={!canDelete}
            >
              Delete {businessName}
            </Button>
            {!canDelete && (
              <p className="mt-1.5 text-[11px] text-muted-foreground">
                You cannot delete your only workspace. Add another business first.
              </p>
            )}
          </div>
        </section>
      </div>

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl border-white/10 bg-card/95 backdrop-blur-2xl">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl text-destructive">
              Delete "{businessName}"?
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently delete this workspace?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs text-muted-foreground">
            {scheduledCount > 0 ? (
              <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-destructive font-medium leading-relaxed">
                ⚠️ Warning: There are {scheduledCount} scheduled post(s) queued. Deleting this workspace will cancel them immediately.
              </div>
            ) : (
              <p>This action cannot be undone. Its brand assets and accounts will be unlinked.</p>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleting}
              onClick={handleConfirmDelete}
              className="gap-2"
            >
              {deleting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
              Confirm & Delete Business
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function GoogleIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
        fill="#EA4335"
      />
    </svg>
  );
}

function SignInScreen() {
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const res = await signIn.social({
        provider: "google",
        callbackURL: "/",
      });

      if ((res as any)?.error) {
        const errorMsg =
          (res as any).error.message ||
          (res as any).error.statusText ||
          "Failed to initiate Google sign-in. Check GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.";
        console.error("[Google Sign-In Error]", (res as any).error);
        toast.error(errorMsg);
        return;
      }

      if ((res as any)?.data?.url) {
        window.location.href = (res as any).data.url;
      }
    } catch (err: any) {
      console.error("[Google Sign-In Exception]", err);
      toast.error(err?.message || "Failed to initiate Google sign-in. Check GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.");
    } finally {
      setGoogleLoading(false);
    }
  };

  return <LandingPage onSignIn={handleGoogleSignIn} googleLoading={googleLoading} />;
}

function EmptyState({ title, message, action, onAction }: { title: string; message: string; action?: string; onAction?: () => void }) {
  return <div className="py-14 text-center"><p className="font-display text-2xl">{title}</p><p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted-foreground">{message}</p>{action && onAction && <Button className="mt-5 gap-2" onClick={onAction}><Plus className="h-4 w-4" />{action}</Button>}</div>;
}