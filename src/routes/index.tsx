import { useEffect, useMemo, useState } from "react";
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
  publishPost,
  suggestCaptions,
  type Platform,
  type PosterOption,
  type PostStatus,
  type SocialPost,
} from "@/lib/mockApi";
import { signIn, signOut, useSession, getSession } from "@/lib/auth-client";
import { getSession as getServerSession } from "@/api/auth";
import { getAccounts, connectAccount, disconnectAccount, getZernioConnectUrl } from "@/api/accounts";
import { getPosts } from "@/api/posts";
import { uploadPosterDataUrl } from "@/api/posters";
import { uploadBrandLogo } from "@/api/brand-kit";
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
  businessName: string;
  tagline: string;
  location: string;
  phone: string;
  colors: string[];
  font: string;
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

  useEffect(() => {
    if (!session?.user && !loaderData?.initialUser) {
      getSession()
        .catch(() => {})
        .finally(() => setClientChecked(true));
    } else {
      setClientChecked(true);
    }
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

  const activeUser = session?.user ?? (loaderData?.initialUser as any);
  const isMeetSoni = activeUser?.email === "meetsoni1075@gmail.com";

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

  // Decoupled account state per Google user (loaded directly from database)
  const [connectedAccounts, setConnectedAccounts] = useState<{ platform: string; handle: string }[]>([]);

  // Keep in sync whenever activeUser changes or DB accounts return
  useEffect(() => {
    if (!activeUser) return;

    setBusinessName(activeUser.name ? `${activeUser.name}'s Workspace` : "My Workspace");

    getAccounts()
      .then((res: any) => {
        if (res && (res.status === "success" || res.success)) {
          const biz = res.data?.businessName ?? res.businessName;
          const accs = res.data?.accounts ?? res.accounts;
          if (biz) {
            setBusinessName(biz);
          }
          if (Array.isArray(accs)) {
            const mapped = accs
              .filter((a: any) => a.status === "connected")
              .map((a: any) => ({
                platform: a.platform,
                handle: a.platform_handle || a.platform || "Connected",
              }));
            setConnectedAccounts(mapped);
          }
        }
      })
      .catch((err) => {
        console.error("Failed to load accounts:", err);
      });

    // Load persisted posts from database
    getPosts()
      .then((res: any) => {
        if (res && (res.status === "success" || res.success)) {
          const rawPosts = res.data?.posts ?? res.posts;
          if (Array.isArray(rawPosts)) {
            const mapped: SocialPost[] = rawPosts.map((p: any) => {
              let dateStr = "";
              if (p.date) {
                dateStr = typeof p.date === "string" ? p.date.slice(0, 10) : new Date(p.date).toISOString().slice(0, 10);
              }
              return {
                id: p.id,
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
            setLoadingPosts(false);
          }
        }
      })
      .catch((err) => {
        console.error("Failed to load posts from DB:", err);
        setLoadingPosts(false);
      });
  }, [activeUser?.id, activeUser?.email]);

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
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="sticky top-0 z-30 flex h-[68px] items-center justify-between border-b bg-background/95 backdrop-blur-sm">
        <div className="flex h-full items-center">
          {/* Logo block: exact width matches sidebar (w-[260px]) with matching border-r on desktop */}
          <div className="flex h-full items-center gap-3 px-4 sm:px-6 md:w-[260px] md:border-r md:px-5">
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
              className="group flex items-center gap-2.5 text-left"
              onClick={() => navigate("Home")}
              aria-label="PostPilot home"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm transition-transform group-hover:scale-105">
                <Send className="h-4 w-4" />
              </span>
              <span className="font-display text-[21px] font-medium leading-none tracking-tight">postpilot</span>
            </button>
          </div>

          {/* Business Switcher on md+ to the right of border-r */}
          <div className="relative hidden sm:flex items-center px-4">
            <Button
              variant="ghost"
              className="h-9 gap-2 px-2.5 text-sm hover:bg-secondary"
              onClick={() => setBusinessMenuOpen(!businessMenuOpen)}
              aria-expanded={businessMenuOpen}
            >
              {brandKit.logoUrl ? (
                <div className="h-6 w-6 rounded overflow-hidden border border-primary/20 bg-white p-0.5 shrink-0 flex items-center justify-center">
                  <img src={brandKit.logoUrl} alt="Logo" className="h-full w-full object-contain" />
                </div>
              ) : (
                <span className="flex h-6 w-6 items-center justify-center rounded bg-primary/10 text-[11px] font-semibold text-primary">{businessInitial}</span>
              )}
              <span className="font-medium">{businessName}</span>
              <span className="rounded border bg-secondary px-1.5 py-0.5 text-[10px] text-muted-foreground">Active</span>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>
            {businessMenuOpen && (
              <div className="absolute left-4 top-11 z-50 w-64 rounded-lg border bg-popover p-2 shadow-lg">
                <div className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">YOUR BUSINESSES</div>
                <Button
                  variant="ghost"
                  className="w-full justify-between text-xs"
                  onClick={() => {
                    setBusinessMenuOpen(false);
                    toast(`Viewing ${businessName}`);
                  }}
                >
                  <span className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-primary" /> {businessName}
                  </span>
                  <span className="text-[10px] text-olive font-medium">
                    {isInstagramConnected ? "Connected" : "Active"}
                  </span>
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-xs text-muted-foreground hover:text-foreground"
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
          <div className="hidden sm:flex items-center gap-2 rounded-full border bg-secondary/60 px-3 py-1 text-xs text-muted-foreground">
            <span className={`h-2 w-2 rounded-full ${isInstagramConnected ? "bg-olive animate-pulse" : "bg-muted-foreground"}`} />
            <span>{isInstagramConnected ? "Instagram connected" : "No social connected"}</span>
          </div>
          <span className="hidden text-xs text-muted-foreground lg:inline">Your week, at a glance</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full overflow-hidden bg-secondary text-sm font-medium hover:ring-2 hover:ring-primary/20"
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
            <div className="absolute right-4 top-12 z-50 w-64 rounded-lg border bg-popover p-2 shadow-lg">
              <div className="border-b px-2.5 pb-2.5 pt-1.5">
                <p className="text-sm font-medium truncate">{userName}</p>
                <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
                {activeUser && (
                  <span className="mt-1.5 inline-flex items-center gap-1 rounded bg-olive/10 px-1.5 py-0.5 text-[10px] font-medium text-olive">
                    Google Connected
                  </span>
                )}
              </div>
              <Button
                variant="ghost"
                className="mt-1 w-full justify-start text-xs"
                onClick={() => {
                  setAccountMenuOpen(false);
                  navigate("Settings");
                }}
              >
                <Settings2 className="mr-2 h-3.5 w-3.5" /> Settings
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={async () => {
                  setAccountMenuOpen(false);
                  try {
                    await signOut();
                  } catch (err) {
                    console.error("Sign out error:", err);
                  }
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
          className="fixed inset-0 z-20 bg-foreground/20 backdrop-blur-xs md:hidden"
          aria-label="Close navigation"
          onClick={() => setMobileNavOpen(false)}
        />
      )}
      <div className="flex flex-1 w-full">
        <aside
          className={`fixed inset-y-[68px] left-0 z-30 w-[260px] shrink-0 border-r bg-background transition-transform duration-200 md:sticky md:top-[68px] md:z-10 md:block md:h-[calc(100vh-68px)] md:translate-x-0 ${
            mobileNavOpen ? "translate-x-0 shadow-xl" : "-translate-x-full"
          }`}
        >
          <div className="flex h-full flex-col justify-between overflow-y-auto px-3.5 py-5">
            {/* Top actions & navigation */}
            <div className="space-y-6">
              {/* Primary Create Button */}
              <div>
                <Button
                  onClick={() => navigate("Create")}
                  className={`h-10 w-full justify-center gap-2 font-medium shadow-sm transition-all ${
                    page === "Create"
                      ? "bg-primary text-primary-foreground ring-2 ring-primary/30"
                      : "hover:opacity-95"
                  }`}
                >
                  <Plus className="h-4 w-4" />
                  <span>Create a post</span>
                </Button>
              </div>

              {/* Workspace Navigation */}
              <div>
                <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
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
                        className={`group relative flex h-10 w-full items-center gap-3 rounded-lg px-3 text-sm transition-all duration-150 ${
                          active
                            ? "bg-secondary font-medium text-foreground"
                            : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground font-normal"
                        }`}
                        aria-current={active ? "page" : undefined}
                      >
                        {active && (
                          <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-primary" />
                        )}
                        <Icon
                          className={`h-[18px] w-[18px] transition-colors ${
                            active ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                          }`}
                        />
                        <span>{name}</span>
                        {badge && (
                          <span
                            className={`ml-auto flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-semibold ${
                              active ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"
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
                <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
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
                        className={`group relative flex h-10 w-full items-center gap-3 rounded-lg px-3 text-sm transition-all duration-150 ${
                          active
                            ? "bg-secondary font-medium text-foreground"
                            : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground font-normal"
                        }`}
                        aria-current={active ? "page" : undefined}
                      >
                        {active && (
                          <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-primary" />
                        )}
                        <Icon
                          className={`h-[18px] w-[18px] transition-colors ${
                            active ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                          }`}
                        />
                        <span>{name}</span>
                        {dot && (
                          <span className="ml-auto flex items-center gap-1.5 text-[10px] text-olive font-medium">
                            <span className="h-1.5 w-1.5 rounded-full bg-olive animate-pulse" />
                            Connected
                          </span>
                        )}
                      </button>
                    );
                  })}
                </nav>
              </div>
            </div>

            {/* Bottom Account & Workspace Card */}
            <div className="border-t pt-3">
              <button
                onClick={() => setAccountMenuOpen(!accountMenuOpen)}
                className="flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-secondary/70 group"
                aria-expanded={accountMenuOpen}
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-semibold text-primary overflow-hidden">
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
                  <p className="truncate text-xs font-medium text-foreground">{userName}</p>
                  <p className="truncate text-[11px] text-muted-foreground">{userEmail}</p>
                </div>
                <MoreHorizontal className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
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
                instagramAccount={instagramAccount}
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
                onSave={(updated) => {
                  setBrandKit(updated);
                  try {
                    localStorage.setItem("postpilot_brand_kit", JSON.stringify(updated));
                  } catch {}
                  toast.success("Brand kit saved & applied across PostPilot");
                }}
              />
            )}
            {page === "Accounts" && (
              <Accounts
                connectedAccounts={connectedAccounts}
                businessName={businessName}
                userEmail={userEmail}
                onAccountsChange={setConnectedAccounts}
              />
            )}
            {page === "Settings" && (
              <SettingsPage
                businessName={businessName}
                onBusinessNameChange={setBusinessName}
                isMeetSoni={isMeetSoni}
              />
            )}
            <PostDetailModal
              post={selectedPostForDetail}
              businessName={businessName}
              isOpen={Boolean(selectedPostForDetail)}
              onClose={() => setSelectedPostForDetail(null)}
            />
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
  return <div className="mb-8 flex flex-wrap items-end justify-between gap-4"><div>{eyebrow && <p className="mb-2 text-[11px] font-semibold uppercase text-primary">{eyebrow}</p>}<h1 className="font-display text-4xl font-medium leading-tight sm:text-[42px]">{title}</h1>{description && <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>}</div>{action}</div>;
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

  return <>
    <ScreenTitle eyebrow={todayLabel} title={`Welcome back, ${greetingName}.`} description="Create, schedule, and publish attractive social posts with ease." action={<Button onClick={() => onNavigate("Create")} className="h-10 gap-2"><Plus className="h-4 w-4" /> Create a post</Button>} />
    <section className="mb-8 grid gap-3 sm:grid-cols-3" aria-label="Posting overview">
      <Stat label="Posts this month" value={String(postedCount)} note={postedCount > 0 ? `${postedCount} posts published` : "No posts published yet"} />
      <Stat label="In the calendar" value={String(scheduledCount)} note={scheduledCount > 0 ? `${scheduledCount} posts queued` : "No scheduled posts"} />
      <Stat
        label="Connected channel"
        value={instagramAccount ? "Instagram" : "None"}
        note={instagramAccount ? `@${instagramAccount.handle} · Active` : "Connect in Accounts"}
      />
    </section>
    <section className="mb-10 border bg-card p-5 sm:p-7">
      <div className="grid items-center gap-6 md:grid-cols-[1fr_auto]">
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase text-primary">A FRESH IDEA</p>
          <h2 className="font-display text-3xl leading-tight sm:text-[34px]">What would you like to share today?</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">Start with an offer, an update, or a moment from your business. We'll help shape the poster and caption.</p>
        </div>
        <Button className="h-11 gap-2 self-center px-5" onClick={() => onNavigate("Create")}><Plus className="h-4 w-4" /> Start a new post</Button>
      </div>
      <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 border-t pt-4 text-xs text-muted-foreground">
        {instagramAccount ? (
          <span className="inline-flex items-center gap-1.5"><Instagram className="h-3.5 w-3.5" /> Instagram (@{instagramAccount.handle})</span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-muted-foreground"><Instagram className="h-3.5 w-3.5" /> No Instagram connected</span>
        )}
        <span className="inline-flex items-center gap-1.5"><Clock3 className="h-3.5 w-3.5" /> {instagramAccount ? "Ready to publish" : "Connect an account in Accounts"}</span>
      </div>
    </section>
    <section>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl">Recent posts</h2>
          <p className="mt-1 text-sm text-muted-foreground">Your recent created and published posts.</p>
        </div>
        {posts.length > 0 && (
          <Button variant="ghost" className="gap-1.5 text-xs text-primary" onClick={() => onNavigate("Scheduled")}>
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
            <div key={i} className="animate-pulse border bg-card p-3.5 flex gap-4">
              <div className="w-[92px] h-[115px] bg-secondary rounded" />
              <div className="flex-1 space-y-2 py-2">
                <div className="h-4 w-16 bg-secondary rounded" />
                <div className="h-4 w-3/4 bg-secondary rounded" />
                <div className="h-3 w-full bg-secondary rounded" />
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
    <div className="mt-9 flex flex-wrap items-center gap-5 border-t pt-5 text-xs text-muted-foreground">
      <span>{postedCount} posts shared so far</span>
      <span>•</span>
      <span>Social posts made simple.</span>
    </div>
  </>;
}

function Stat({ label, value, note }: { label: string; value: string; note: string }) {
  return <div className="border bg-card px-5 py-4"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-2 font-display text-3xl">{value}</p><p className="mt-1.5 text-xs text-muted-foreground">{note}</p></div>;
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
  needsReview?: boolean | undefined;
}) {
  const isWorkSans = font?.toLowerCase().includes("work sans");

  if (imageUrl) {
    return (
      <div
        className={`poster ${selected ? "ring-2 ring-primary ring-offset-2" : ""} relative overflow-hidden bg-muted group rounded-md shadow-xs aspect-[4/5]`}
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
      className={`poster poster--${theme} ${selected ? "ring-2 ring-primary ring-offset-2" : ""} relative overflow-hidden flex flex-col justify-between p-5 text-center`}
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
  return <span className={`inline-flex items-center gap-1.5 border px-2 py-1 text-[10px] font-medium ${status === "Posted" ? "border-olive/25 bg-olive/10 text-olive" : status === "Scheduled" ? "border-sky/25 bg-sky/10 text-sky" : "border-border bg-secondary text-muted-foreground"}`}><span className={`h-1.5 w-1.5 rounded-full ${status === "Posted" ? "bg-olive" : status === "Scheduled" ? "bg-sky" : "bg-muted-foreground"}`} />{status}</span>;
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
      className="group cursor-pointer overflow-hidden border bg-card transition-all duration-200 hover:border-primary/50 hover:shadow-md"
    >
      <div className="grid grid-cols-[92px_1fr] gap-4 p-3.5">
        <div className="w-[92px] shrink-0">
          {post.imageUrl ? (
            <div className="aspect-[4/5] w-full overflow-hidden rounded-md border bg-muted shadow-sm">
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
        <div className="flex min-w-0 flex-col py-1">
          <div className="flex items-center justify-between gap-2">
            <StatusBadge status={post.status} />
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              aria-label={`View details for ${post.headline}`}
              onClick={(e) => {
                e.stopPropagation();
                onSelectPost?.(post);
              }}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
          <h3 className="mt-3 line-clamp-2 text-sm font-semibold leading-5 group-hover:text-primary transition-colors">
            {post.headline}
          </h3>
          <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground whitespace-pre-line">
            {cleanCaptionDisplay(post.caption)}
          </p>
          <div className="mt-auto flex items-center justify-between pt-3 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Instagram className="h-3.5 w-3.5" />
              {dateLabel}
            </span>
            <span className="text-[10px] text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">
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
  instagramAccount,
  onPublished,
  onCancel,
  onNavigate,
}: {
  brandKit: BrandKitData;
  businessName: string;
  instagramAccount?: { platform: string; handle: string } | undefined;
  onPublished: (post: SocialPost) => void;
  onCancel: () => void;
  onNavigate: (page: Page) => void;
}) {
  const [step, setStep] = useState(1);
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
  const [timing, setTiming] = useState<"now" | "schedule">("now");
  const [scheduledDate, setScheduledDate] = useState("2026-10-18");
  const [scheduledTime, setScheduledTime] = useState("16:00");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [success, setSuccess] = useState(false);

  const currentOption = options[selected];
  const startGeneration = async () => {
    const parsed = generatePostersSchema.safeParse({ prompt, style });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Please provide a description for your post");
      return;
    }
    setLoading(true);
    setStep(2);
    try {
      const results = await generatePosters(prompt, style, useBrand, brandKit, 2);
      setOptions(results);
      setSelected(0);
      setHeadline(results[0]?.headline ?? "");
      setPrice(results[0]?.price ?? "");
      const detectedDate = results[0]?.brief?.date_text || results[0]?.date_text;
      setDateText(detectedDate || new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }).toUpperCase());
    } finally {
      setLoading(false);
    }
  };
  const regenerate = async () => {
    setLoading(true);
    try {
      const results = await generatePosters(prompt, style, useBrand, brandKit, 2);
      setOptions(results);
      setSelected(0);
      setHeadline(results[0]?.headline ?? "");
      setPrice(results[0]?.price ?? "");
      const detectedDate = results[0]?.brief?.date_text || results[0]?.date_text;
      if (detectedDate) setDateText(detectedDate);
      toast.success("Two fresh layouts are ready");
    } finally { setLoading(false); }
  };
  const loadSuggestions = async () => {
    setOwnCaption(false);
    setSuggesting(true);
    try {
      const next = await suggestCaptions(headline, price);
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

    const record = await publishPost({
      id: "pending",
      headline,
      caption,
      date: targetDate,
      time: targetTime,
      status: timing === "now" ? "Posted" : "Scheduled",
      platform: platforms[0] ?? "Instagram",
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

  return <>
    <div className="mb-7 flex items-center justify-between gap-3"><div><button className="mb-2 inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground" onClick={onCancel}><ArrowLeft className="h-3.5 w-3.5" /> Back to workspace</button><h1 className="font-display text-4xl">Create a post</h1></div><span className="hidden text-xs text-muted-foreground sm:inline">A little idea can go a long way.</span></div>
    <div className="mb-8 grid grid-cols-3 border-y" aria-label="Post creation steps">{steps.map((label, index) => <button key={label} onClick={() => index + 1 <= step && setStep(index + 1)} className={`relative flex items-center gap-2.5 py-3 text-left text-xs transition-colors ${step === index + 1 ? "font-semibold text-foreground" : step > index + 1 ? "text-primary" : "text-muted-foreground"}`} aria-current={step === index + 1 ? "step" : undefined}><span className={`flex h-6 w-6 items-center justify-center rounded-full border text-[11px] ${step === index + 1 ? "border-primary bg-primary text-primary-foreground" : step > index + 1 ? "border-primary bg-primary/10" : "border-border"}`}>{step > index + 1 ? <Check className="h-3.5 w-3.5" /> : index + 1}</span><span className="hidden sm:inline">{label}</span><span className="sm:hidden">{index === 0 ? "Describe" : index === 1 ? "Poster" : "Publish"}</span>{index < 2 && <span className="absolute right-0 top-1/2 hidden w-5 border-t sm:block" />}</button>)}</div>
    {step === 1 && <section className="max-w-3xl border bg-card p-5 sm:p-8"><p className="text-xs text-muted-foreground">THE STARTING POINT</p><h2 className="mt-2 font-display text-3xl">What's happening at {businessName}?</h2><label htmlFor="post-prompt" className="sr-only">Describe your post</label><Textarea id="post-prompt" className="mt-5 min-h-[150px] resize-y border-0 bg-secondary/60 px-4 py-4 text-base leading-7 shadow-none placeholder:text-muted-foreground focus-visible:ring-1" placeholder="Special announcement, offer, or new update from your business" value={prompt} onChange={(event) => setPrompt(event.target.value)} /><div className="mt-5 grid gap-5 border-t pt-5 sm:grid-cols-2"><ChoiceRow label="Style" choices={["Bold", "Minimal", "Festive", "Elegant"]} value={style} onChange={setStyle} /><ChoiceRow label="Format" choices={["Square", "Portrait 4:5", "Story"]} value={format} onChange={setFormat} /></div><div className="mt-5 flex items-center justify-between border-t pt-5"><div><p className="text-sm font-medium">Use my brand colors and logo</p><p className="mt-1 text-xs text-muted-foreground">Keep each post feeling like {businessName}.</p></div><Switch checked={useBrand} onCheckedChange={setUseBrand} aria-label="Use my brand colors and logo" /></div><div className="mt-6 flex items-center justify-between gap-3 border-t pt-5"><p className="text-xs text-muted-foreground">You can edit every detail next.</p><Button className="h-10 gap-2" onClick={startGeneration}>Generate poster <ArrowRight className="h-4 w-4" /></Button></div></section>}
    {step === 2 && <PosterStep businessName={businessName} logoUrl={brandKit.logoUrl} font={brandKit.font} options={options} selected={selected} loading={loading} headline={headline} price={price} dateText={dateText} onSelect={(index) => { setSelected(index); setHeadline(options[index]?.headline ?? ""); setPrice(options[index]?.price ?? ""); const d = options[index]?.brief?.date_text || options[index]?.date_text; if (d) setDateText(d); }} onHeadline={setHeadline} onPrice={setPrice} onDate={setDateText} onRegenerate={regenerate} onBack={() => setStep(1)} onContinue={() => { if (!currentOption) return; setStep(3); }} />}
    {step === 3 && <PublishStep businessName={businessName} logoUrl={brandKit.logoUrl} font={brandKit.font} instagramAccount={instagramAccount} option={currentOption} headline={headline} price={price} caption={caption} suggestions={suggestions} suggesting={suggesting} ownCaption={ownCaption} platforms={platforms} timing={timing} scheduledDate={scheduledDate} scheduledTime={scheduledTime} onCaption={setCaption} onSuggest={loadSuggestions} onChooseSuggestion={(text) => setCaption(text)} onPlatforms={setPlatforms} onTiming={setTiming} onDate={setScheduledDate} onTime={setScheduledTime} onBack={() => setStep(2)} onSubmit={() => setConfirmOpen(true)} />}
    <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}><DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle className="font-display text-2xl">{timing === "now" ? "Ready to share?" : "Save this to your calendar?"}</DialogTitle><DialogDescription>{timing === "now" ? `Your post will be marked as shared to ${platforms.join(" and ")}.` : `Your post will be scheduled for ${new Date(`${scheduledDate}T${scheduledTime}`).toLocaleString("en-US", { weekday: "long", month: "long", day: "numeric", hour: "numeric", minute: "2-digit" })}.`}</DialogDescription></DialogHeader><div className="my-2 flex gap-3 border-y py-4"><div className="w-[72px]"><Poster theme={currentOption?.theme ?? (brandKit.colors[0]?.toLowerCase() || "tomato")} eyebrow={brandKit.businessName ? brandKit.businessName.toUpperCase() : businessName.toUpperCase()} headline={headline} price={price} dateText={dateText} footer={currentOption?.footer ?? brandKit.tagline ?? "IDEAS INTO SCALABLE PRODUCTS"} logoUrl={brandKit.logoUrl} font={brandKit.font} imageUrl={currentOption?.imageUrl} /></div><div className="min-w-0 py-2"><p className="text-sm font-medium">{headline}</p><p className="mt-1 line-clamp-3 text-xs text-muted-foreground">{caption || "No caption added"}</p><p className="mt-2 text-xs text-muted-foreground">{platforms.join(" · ")}</p></div></div><DialogFooter><Button variant="outline" onClick={() => setConfirmOpen(false)}>Keep editing</Button><Button disabled={publishing} onClick={submitPost}>{publishing ? <LoaderCircle className="h-4 w-4 animate-spin" /> : timing === "now" ? "Post now" : "Schedule post"}</Button></DialogFooter></DialogContent></Dialog>
  </>;
}

function ChoiceRow({ label, choices, value, onChange }: { label: string; choices: string[]; value: string; onChange: (choice: string) => void }) {
  return <div><p className="mb-2 text-xs font-medium">{label}</p><div className="flex flex-wrap gap-1.5">{choices.map((choice) => <Button key={choice} variant={value === choice ? "secondary" : "outline"} size="sm" className={`h-8 px-2.5 text-xs ${value === choice ? "border-primary/30 text-primary" : "font-normal text-muted-foreground"}`} onClick={() => onChange(choice)} aria-pressed={value === choice}>{choice}</Button>)}</div></div>;
}

function PosterStep({ businessName, logoUrl, font, options, selected, loading, headline, price, dateText, onSelect, onHeadline, onPrice, onDate, onRegenerate, onBack, onContinue }: { businessName?: string; logoUrl?: string | undefined; font?: string | undefined; options: PosterOption[]; selected: number; loading: boolean; headline: string; price: string; dateText: string; onSelect: (index: number) => void; onHeadline: (value: string) => void; onPrice: (value: string) => void; onDate: (value: string) => void; onRegenerate: () => void; onBack: () => void; onContinue: () => void }) {
  const [editText, setEditText] = useState(false);
  const [renderTick, setRenderTick] = useState(0);
  useMemo(() => { if (!loading) return undefined; const id = window.setInterval(() => setRenderTick((value) => value + 1), 850); return () => window.clearInterval(id); }, [loading]);
  if (loading || !options.length) return <div className="grid gap-8 lg:grid-cols-[1fr_270px]"><div><p className="text-xs text-muted-foreground">A FEW DIRECTIONS TO TRY</p><h2 className="mt-2 font-display text-3xl">Finding the right feeling.</h2><div className="mt-6 grid grid-cols-2 gap-3 max-w-[540px]">{[0,1].map((index) => <div key={index} className="aspect-[4/5] animate-pulse border bg-secondary" />)}</div></div><div className="flex flex-col justify-center border-t pt-6 lg:border-l lg:border-t-0 lg:pl-7 lg:pt-0"><span className="text-[11px] font-semibold uppercase text-primary">{["Writing the design brief", "Rendering two directions", "Adding your brand details"][renderTick % 3]}</span><div className="mt-4 h-1 overflow-hidden bg-secondary"><div className="h-full w-2/3 animate-pulse bg-primary" /></div><p className="mt-3 text-xs text-muted-foreground">Good things take a moment.</p></div></div>;
  const option = options[selected];
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
  return <div className="grid gap-8 lg:grid-cols-[1fr_310px]"><div><p className="text-xs text-muted-foreground">A FEW DIRECTIONS TO TRY</p><h2 className="mt-2 font-display text-3xl">Choose the one that feels right.</h2><div className={`mt-5 grid gap-3 max-w-[540px] ${options.length <= 2 ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-4"}`}>{options.map((item, index) => <button key={item.id} onClick={() => onSelect(index)} className={`group border bg-card p-2.5 text-left transition-colors ${selected === index ? "border-primary" : "border-border hover:border-primary/50"}`} aria-pressed={selected === index} aria-label={`Select poster ${index + 1}`}><Poster theme={item.theme} eyebrow={item.eyebrow} headline={item.headline} price={item.price} dateText={item.date_text || item.brief?.date_text} footer={item.footer} selected={selected === index} logoUrl={logoUrl} font={font} imageUrl={item.imageUrl} needsReview={item.needs_review} /><span className="mt-2 block text-[11px] text-muted-foreground">Direction {index + 1}</span></button>)}</div><div className="mt-5 flex flex-wrap gap-2"><Button variant="outline" className="gap-2" onClick={onRegenerate}><Sparkles className="h-4 w-4" /> Try two more</Button><Button variant="ghost" className="gap-2" onClick={savePoster}><ArrowDownToLine className="h-4 w-4" /> Download</Button></div></div><div className="lg:sticky lg:top-24 lg:self-start"><p className="mb-3 text-xs font-medium">YOUR PICK</p><div className="mx-auto max-w-[270px]"><Poster theme={option.theme} eyebrow={option.eyebrow} headline={headline} price={price} dateText={dateText} footer={option.footer} logoUrl={logoUrl} font={font} imageUrl={option.imageUrl} needsReview={option.needs_review} /></div><div className="mt-4 flex items-center justify-between"><p className="text-xs text-muted-foreground">Make a quick edit</p><Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => setEditText(!editText)}>{editText ? "Done" : "Edit text"}</Button></div>{editText && <div className="mt-3 space-y-2"><Input aria-label="Poster headline" value={headline} onChange={(event) => onHeadline(event.target.value)} placeholder="Headline" /><Input aria-label="Poster price" value={price} onChange={(event) => onPrice(event.target.value)} placeholder="Price" /><Input aria-label="Poster date or offer detail" value={dateText} onChange={(event) => onDate(event.target.value)} placeholder="Date or offer detail" /></div>}<div className="mt-4 flex gap-2"><Button variant="outline" className="flex-1" onClick={onBack}>Back</Button><Button className="flex-1 gap-2" onClick={onContinue}>Continue <ArrowRight className="h-4 w-4" /></Button></div></div></div>;
}

function PublishStep({
  businessName,
  logoUrl,
  font,
  instagramAccount,
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
    <div className="grid gap-10 lg:grid-cols-[minmax(230px,0.8fr)_minmax(360px,1.2fr)]">
      <section className="lg:sticky lg:top-24 lg:self-start">
        <p className="mb-3 text-xs font-medium">A LITTLE PREVIEW</p>
        <div className="mx-auto max-w-[300px] border bg-card p-3">
          <div className="mb-3 flex items-center gap-2">
            {logoUrl ? (
              <div className="h-7 w-7 rounded-full overflow-hidden border border-primary/20 bg-white p-0.5 shrink-0 flex items-center justify-center">
                <img src={logoUrl} alt="Logo" className="h-full w-full object-contain" />
              </div>
            ) : (
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">
                {initial}
              </span>
            )}
            <span className="text-xs font-semibold">{displayHandle}</span>
            <MoreHorizontal className="ml-auto h-4 w-4" />
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
          <p className="mt-3 line-clamp-3 text-xs leading-5">
            <span className="font-semibold">{displayHandle} </span>
            {caption || "Your caption will show up here."}
          </p>
        </div>
      </section>
      <section>
        <p className="text-xs text-muted-foreground">ONE LAST THING</p>
        <h2 className="mt-2 font-display text-3xl">Give it a voice.</h2>
        <div className="mt-5 flex border-b" role="group" aria-label="Caption method">
          <Button
            variant="ghost"
            className={`rounded-none border-b-2 px-3 text-xs ${ownCaption ? "border-primary text-foreground" : "border-transparent text-muted-foreground"}`}
            onClick={() => onCaption(caption)}
          >
            Write my own
          </Button>
          <Button
            variant="ghost"
            className={`rounded-none border-b-2 px-3 text-xs ${!ownCaption ? "border-primary text-foreground" : "border-transparent text-muted-foreground"}`}
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
              className="mt-3 min-h-32 resize-y text-sm leading-6"
              maxLength={2200}
              placeholder="A good caption that shares what's new and engages your followers…"
              value={caption}
              onChange={(event) => onCaption(event.target.value)}
            />
            <div className="mt-1 text-right text-[11px] text-muted-foreground">{caption.length} / 2,200</div>
          </>
        ) : (
          <div className="mt-3 space-y-2">
            {suggesting ? (
              <div className="flex items-center gap-2 border p-5 text-sm text-muted-foreground">
                <LoaderCircle className="h-4 w-4 animate-spin" /> Finding the right words…
              </div>
            ) : (
              suggestions.map((item, index) => (
                <button
                  key={item}
                  onClick={() => onChooseSuggestion(item)}
                  className={`w-full border p-3 text-left text-xs leading-5 transition-colors ${caption === item ? "border-primary bg-primary/5" : "hover:border-primary/40"}`}
                >
                  <span className="mb-1 block text-[10px] font-semibold uppercase text-primary">Option {index + 1}</span>
                  {item}
                </button>
              ))
            )}
            {!suggesting && suggestions.length > 0 && (
              <Button variant="ghost" size="sm" className="mt-1 h-8 px-1 text-xs text-primary" onClick={onSuggest}>
                Regenerate suggestions
              </Button>
            )}
          </div>
        )}
        <div className="mt-6 border-t pt-5">
          <div className="flex items-baseline justify-between">
            <h3 className="text-sm font-semibold">Where should it go?</h3>
            <span className="text-xs text-muted-foreground">Choose one or more</span>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {(["Instagram", "Facebook", "X"] as Platform[]).map((platform) => {
              const connected = platform === "Instagram" ? Boolean(instagramAccount) : false;
              return (
                <button
                  key={platform}
                  onClick={() => togglePlatform(platform)}
                  className={`flex min-h-[70px] flex-col items-center justify-center gap-1.5 border transition-colors ${platforms.includes(platform) ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}
                  aria-pressed={platforms.includes(platform)}
                >
                  <span className="text-sm font-semibold">{platform === "Instagram" ? <Instagram className="h-[18px] w-[18px]" /> : platform === "Facebook" ? "f" : "𝕏"}</span>
                  <span className="text-[11px]">{platform}</span>
                  <span className={`text-[9px] ${connected ? "text-olive" : "text-muted-foreground"}`}>{connected ? "Connected" : "Optional"}</span>
                </button>
              );
            })}
          </div>
        </div>
        <div className="mt-6 border-t pt-5">
          <h3 className="text-sm font-semibold">When would you like it to go out?</h3>
          <div className="mt-3 grid grid-cols-2 border">
            <Button variant="ghost" className={`h-10 rounded-none ${timing === "now" ? "bg-secondary font-semibold" : "font-normal text-muted-foreground"}`} onClick={() => onTiming("now")} aria-pressed={timing === "now"}>Post now</Button>
            <Button variant="ghost" className={`h-10 rounded-none ${timing === "schedule" ? "bg-secondary font-semibold" : "font-normal text-muted-foreground"}`} onClick={() => onTiming("schedule")} aria-pressed={timing === "schedule"}>Schedule</Button>
          </div>
          {timing === "schedule" && (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="text-xs text-muted-foreground">Day<Input className="mt-1.5 text-foreground" type="date" value={scheduledDate} onChange={(event) => onDate(event.target.value)} /></label>
              <label className="text-xs text-muted-foreground">Time<Input className="mt-1.5 text-foreground" type="time" value={scheduledTime} onChange={(event) => onTime(event.target.value)} /></label>
              <p className="sm:col-span-2 text-xs text-muted-foreground">Times shown in your local timezone.</p>
            </div>
          )}
        </div>
        <div className="mt-6 flex flex-wrap justify-between gap-2 border-t pt-5">
          <Button variant="outline" onClick={onBack}>Back to poster</Button>
          <Button className="h-10 gap-2" onClick={onSubmit}>{timing === "now" ? "Post now" : "Schedule post"}<ArrowRight className="h-4 w-4" /></Button>
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

  return <>
    <ScreenTitle eyebrow="YOUR CONTENT CALENDAR" title="Scheduled posts" description="A steady rhythm, without the last-minute rush." action={<Button onClick={onCreate} className="gap-2"><Plus className="h-4 w-4" /> New post</Button>} />
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b pb-4">
      <div className="flex gap-1">
        <Button variant={view === "list" ? "secondary" : "ghost"} size="sm" className="gap-2" onClick={() => setView("list")} aria-pressed={view === "list"}>
          <List className="h-4 w-4" /> List
        </Button>
        <Button variant={view === "calendar" ? "secondary" : "ghost"} size="sm" className="gap-2" onClick={() => setView("calendar")} aria-pressed={view === "calendar"}>
          <CalendarDays className="h-4 w-4" /> Month
        </Button>
      </div>
      {view === "calendar" && (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Previous month" onClick={() => shiftMonth(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-32 text-center text-sm font-medium">{monthLabel}</span>
          <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Next month" onClick={() => shiftMonth(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
    {view === "list" ? (
      <div className="divide-y border-y">
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
      <div className="grid grid-cols-7 border-l border-t">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day} className="border-b border-r bg-secondary/60 px-1 py-2 text-center text-[10px] text-muted-foreground sm:px-3 sm:text-xs">{day}</div>
        ))}
        {Array.from({ length: firstDay + daysInMonth }, (_, index) => {
          const day = index - firstDay + 1;
          const matches = scheduled.filter((post) => Number(post.date.slice(-2)) === day && Number(post.date.slice(5, 7)) === month.getMonth() + 1 && Number(post.date.slice(0, 4)) === month.getFullYear());
          return (
            <div key={index} className={`min-h-[76px] border-b border-r p-1 sm:min-h-28 sm:p-2 ${day < 1 ? "bg-secondary/25" : "bg-card"}`}>
              <span className={`text-[10px] sm:text-xs ${day === 17 && month.getMonth() === 9 ? "flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground" : "text-muted-foreground"}`}>{day > 0 ? day : ""}</span>
              {matches.map((post) => (
                <button
                  key={post.id}
                  onClick={() => onSelectPost ? onSelectPost(post) : toast(`${post.headline} · ${post.time}`)}
                  className="mt-1 block w-full truncate border-l-2 border-primary bg-primary/10 px-1 py-1 text-left text-[9px] text-foreground sm:text-[11px] hover:bg-primary/20"
                >
                  {post.headline}
                </button>
              ))}
            </div>
          );
        })}
      </div>
    )}
  </>;
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
      className="group cursor-pointer grid gap-4 py-4 sm:grid-cols-[70px_1fr_auto] sm:items-center px-2 rounded-lg transition-colors hover:bg-secondary/40"
    >
      <div className="w-[70px] shrink-0">
        {post.imageUrl ? (
          <div className="aspect-[4/5] w-full overflow-hidden rounded-md border bg-muted shadow-sm">
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
            eyebrow={businessName.toUpperCase()}
            headline={post.headline}
            price={post.price}
            footer="FRESH DAILY"
          />
        )}
      </div>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={post.status} />
          <span className="text-xs text-muted-foreground">{post.platform}</span>
        </div>
        <h3 className="mt-2 text-sm font-semibold group-hover:text-primary transition-colors">
          {post.headline}
        </h3>
        <p className="mt-1 line-clamp-1 text-xs text-muted-foreground whitespace-pre-line">
          {cleanCaptionDisplay(post.caption)}
        </p>
        <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
          <CalendarDays className="h-3.5 w-3.5" />
          {displayDate}
        </div>
      </div>
      <div
        className="flex items-center gap-1"
        onClick={(e) => e.stopPropagation()}
      >
        <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => setEditing(!editing)}>
          {editing ? "Close" : "Reschedule"}
        </Button>
        <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground" onClick={onCancel}>
          Cancel
        </Button>
      </div>
      {editing && (
        <div
          className="flex items-end gap-2 border-t pt-3 sm:col-span-3"
          onClick={(e) => e.stopPropagation()}
        >
          <label className="text-xs text-muted-foreground">
            New day
            <Input className="mt-1 h-8" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
          </label>
          <Button size="sm" onClick={() => { onReschedule(date); setEditing(false); toast.success("Post rescheduled"); }}>
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
      <div className="mb-4 flex gap-1">
        {(["All", "Instagram", "Facebook", "X"] as const).map((item) => (
          <Button key={item} variant={filter === item ? "secondary" : "ghost"} size="sm" onClick={() => setFilter(item)} aria-pressed={filter === item}>
            {item}
          </Button>
        ))}
      </div>
      <div className="divide-y border-y">
        {posted.length ? (
          posted.map((post) => (
            <article
              key={post.id}
              onClick={() => onSelectPost?.(post)}
              className="group cursor-pointer grid gap-4 py-4 sm:grid-cols-[72px_1fr_auto] sm:items-center px-2 rounded-lg transition-colors hover:bg-secondary/40"
            >
              <div className="w-[72px] shrink-0">
                {post.imageUrl ? (
                  <div className="aspect-[4/5] w-full overflow-hidden rounded-md border bg-muted shadow-sm">
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
                    eyebrow={businessName.toUpperCase()}
                    headline={post.headline}
                    price={post.price}
                    footer="FRESH DAILY"
                  />
                )}
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold group-hover:text-primary transition-colors">
                  {post.headline}
                </h3>
                <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground whitespace-pre-line">
                  {cleanCaptionDisplay(post.caption)}
                </p>
                <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                  <Instagram className="h-3.5 w-3.5" />
                  {post.platform} <span>·</span>
                  {formatPostDate(post.date, post.time)}
                </div>
              </div>
              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
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
                    <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-muted-foreground hover:text-foreground">
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
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader className="border-b pb-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-secondary text-foreground">
                {post.platform === "Instagram" ? (
                  <Instagram className="h-4 w-4" />
                ) : (
                  <span className="text-xs font-bold">{post.platform === "Facebook" ? "f" : "𝕏"}</span>
                )}
              </span>
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {post.platform}
              </span>
              <StatusBadge status={post.status} />
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock3 className="h-3.5 w-3.5" />
              <span>{formattedDateTime}</span>
            </div>
          </div>
          <DialogTitle className="mt-3 font-display text-2xl font-semibold leading-snug text-left">
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
              <div className="aspect-[4/5] w-full overflow-hidden rounded-xl border bg-muted shadow-md">
                <img
                  src={post.imageUrl}
                  alt={post.headline}
                  className="h-full w-full object-cover"
                />
              </div>
            ) : (
              <div className="w-full shadow-md rounded-xl overflow-hidden">
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
              <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-foreground">
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
                  className="h-7 gap-1.5 text-xs text-primary hover:text-primary/80"
                  onClick={handleCopyCaption}
                >
                  <Copy className="h-3.5 w-3.5" /> Copy caption
                </Button>
              </div>

              <div className="rounded-xl border bg-secondary/30 p-4 max-h-[300px] overflow-y-auto">
                <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground selection:bg-primary/20">
                  {cleanCaption}
                </p>
              </div>
            </div>

            <div className="rounded-lg border bg-card p-3 space-y-2 text-xs text-muted-foreground">
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
                <span className="font-medium text-olive">{post.status}</span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
          <div className="flex items-center gap-2">
            {post.platform === "Instagram" && (
              <a
                href="https://www.instagram.com/avero.innovations/"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" className="gap-2">
                  <Instagram className="h-4 w-4" /> View on Instagram <ExternalLink className="h-3.5 w-3.5" />
                </Button>
              </a>
            )}
          </div>
          <Button variant="default" onClick={onClose}>
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
  const [uploadingLogo, setUploadingLogo] = useState(false);

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
      businessName: name.trim() || "Avero Innovations",
      tagline: tagline.trim(),
      location: location.trim(),
      phone: phone.trim(),
      colors: colors.length > 0 ? colors : ["Tomato", "Olive"],
      font,
      logoName,
      logoUrl,
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
          toast.success("Logo uploaded to Supabase Storage!");
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
          <Button onClick={handleSave} className="gap-2">
            <Check className="h-4 w-4" /> Save changes
          </Button>
        }
      />
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px] items-start w-full">
        <div className="space-y-7 min-w-0 w-full">
          <section className="border-b pb-6">
            <h2 className="font-display text-2xl">The essentials</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <LabeledInput label="Business name" value={name} onChange={setName} />
              <LabeledInput label="Tagline" value={tagline} onChange={setTagline} />
              <LabeledInput label="Location" value={location} onChange={setLocation} />
              <LabeledInput label="Phone" value={phone} onChange={setPhone} />
            </div>
          </section>
          <section className="border-b pb-6">
            <div className="flex items-baseline justify-between">
              <h2 className="font-display text-2xl">Your colors</h2>
              <span className="text-xs text-muted-foreground">Pick up to three</span>
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              {palette.map((color) => (
                <button
                  key={color.name}
                  onClick={() => toggleColor(color.name)}
                  className={`flex items-center gap-2 border px-3 py-2 text-xs transition-colors ${
                    colors.includes(color.name) ? "border-primary font-medium" : "border-border"
                  }`}
                  aria-pressed={colors.includes(color.name)}
                >
                  <span className={`brand-swatch ${color.className}`} />
                  {color.name}
                  {colors.includes(color.name) && <Check className="h-3 w-3 text-primary" />}
                </button>
              ))}
            </div>
          </section>
          <section className="pb-3">
            <div className="flex items-baseline justify-between">
              <h2 className="font-display text-2xl">Heading style</h2>
              <span className="text-xs text-muted-foreground">Used for the big words on your posters</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Select a typeface below to see your posters update in real-time.</p>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {[
                { name: "Fraunces", style: "Soft Editorial Serif", family: "'Fraunces', Georgia, serif" },
                { name: "DM Serif", style: "Dramatic Display Serif", family: "'DM Serif Display', Georgia, serif" },
                { name: "Work Sans", style: "Bold Modern Sans-Serif", family: "'Work Sans', sans-serif" },
              ].map((item) => (
                <button
                  key={item.name}
                  type="button"
                  onClick={() => {
                    setFont(item.name);
                    toast.info(`Heading style set to ${item.name}`);
                  }}
                  className={`flex flex-col items-start rounded-lg border p-3.5 text-left transition-all ${
                    font === item.name
                      ? "border-primary bg-primary/5 ring-1 ring-primary shadow-xs"
                      : "border-border bg-card hover:border-primary/50"
                  }`}
                  aria-pressed={font === item.name}
                >
                  <div className="flex w-full items-center justify-between">
                    <span
                      className="text-lg leading-tight"
                      style={{
                        fontFamily: item.family,
                        fontWeight: item.name === "Work Sans" ? 700 : 600,
                      }}
                    >
                      {item.name}
                    </span>
                    {font === item.name && (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white text-[10px]">
                        <Check className="h-3 w-3" />
                      </span>
                    )}
                  </div>
                  <span className="mt-1 text-[11px] text-muted-foreground">
                    {item.style}
                  </span>
                  <div
                    className="mt-2 text-xs truncate max-w-full text-foreground/80 border-t pt-1.5 w-full"
                    style={{
                      fontFamily: item.family,
                      fontWeight: item.name === "Work Sans" ? 700 : 500,
                    }}
                  >
                    Turning ideas into reality
                  </div>
                </button>
              ))}
            </div>
          </section>
          <section>
            <h2 className="font-display text-2xl">Logo</h2>
            <p className="mt-1 text-xs text-muted-foreground">Add your mark to the corner of a poster.</p>
            
            {logoUrl ? (
              <div className="mt-4 rounded-lg border bg-card p-4 space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border bg-white p-1.5 shadow-xs">
                      <img src={logoUrl} alt="Logo preview" className="h-full w-full object-contain" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{logoName || "Brand Mark"}</p>
                      <span className="inline-flex items-center gap-1 mt-0.5 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-medium text-emerald-800">
                        <Check className="h-3 w-3 text-emerald-600" /> Stored in Supabase Bucket
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <label className="cursor-pointer">
                      <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" asChild>
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
                      className="h-8 text-xs text-destructive hover:bg-destructive/10"
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

                {/* Show direct Supabase CDN link as requested */}
                <div className="flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-2 min-w-0 max-w-full overflow-hidden">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider shrink-0">Supabase Link</span>
                  <div className="min-w-0 flex-1 overflow-hidden">
                    <p className="text-[11px] font-mono text-foreground/80 truncate select-all" title={logoUrl}>
                      {logoUrl}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-[11px] gap-1 shrink-0 hover:bg-muted"
                    onClick={() => {
                      navigator.clipboard.writeText(logoUrl);
                      toast.success("Supabase link copied to clipboard");
                    }}
                  >
                    <Copy className="h-3 w-3" /> Copy
                  </Button>
                </div>
              </div>
            ) : (
              <label className="mt-4 flex min-h-28 cursor-pointer flex-col items-center justify-center gap-2 border border-dashed rounded-lg text-xs text-muted-foreground transition-colors hover:border-primary hover:text-foreground bg-muted/10">
                {uploadingLogo ? (
                  <div className="flex items-center gap-2 py-2">
                    <LoaderCircle className="h-5 w-5 animate-spin text-primary" />
                    <span>Uploading to Supabase Storage...</span>
                  </div>
                ) : (
                  <>
                    <Upload className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium text-foreground">Click to upload your logo</span>
                    <span className="text-[11px] text-muted-foreground">PNG, JPG, SVG or WEBP (Uploaded directly to Supabase CDN)</span>
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
        <aside className="w-full lg:w-[280px] shrink-0 lg:sticky lg:top-24 lg:self-start">
          <p className="mb-3 text-xs font-medium">A LITTLE PREVIEW</p>
          <div className="border bg-card p-3 rounded-lg shadow-xs w-full max-w-[280px]">
            <div className="mb-3 flex items-center gap-2">
              {logoUrl ? (
                <div className="h-7 w-7 rounded-full overflow-hidden border border-primary/20 bg-white p-0.5 shrink-0 flex items-center justify-center">
                  <img src={logoUrl} alt="Logo" className="h-full w-full object-contain" />
                </div>
              ) : (
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary shrink-0">
                  {(name || "B").charAt(0).toUpperCase()}
                </span>
              )}
              <div className="min-w-0">
                <p className="text-xs font-semibold truncate">{name || "Your business"}</p>
                {logoName && <p className="text-[10px] text-muted-foreground truncate">{logoName}</p>}
              </div>
            </div>
            <Poster
              theme={previewTheme}
              eyebrow={location || (name ? name.toUpperCase() : "YOUR BRAND")}
              headline="Turning ideas into reality"
              price="Available now"
              footer={tagline || "YOUR TAGLINE"}
              logoUrl={logoUrl}
              font={font}
            />
            <p className="mt-3 text-[11px] text-muted-foreground">Typeface · <strong className="font-semibold text-foreground">{font}</strong></p>
          </div>
        </aside>
      </div>
    </>
  );
}

function LabeledInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="text-xs font-medium">{label}<Input className="mt-2 font-normal" value={value} onChange={(event) => onChange(event.target.value)} /></label>;
}

function Accounts({
  connectedAccounts,
  businessName,
  userEmail,
  onAccountsChange,
}: {
  connectedAccounts: { platform: string; handle: string }[];
  businessName: string;
  userEmail: string;
  onAccountsChange: (accounts: { platform: string; handle: string }[]) => void;
}) {
  const isMeetSoni = userEmail === "meetsoni1075@gmail.com";
  const [connectModalOpen, setConnectModalOpen] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>("Instagram");
  const [handleInput, setHandleInput] = useState("");
  const [loading, setLoading] = useState(false);

  const isConnected = (p: Platform) =>
    connectedAccounts.some((a) => a.platform.toLowerCase() === p.toLowerCase());

  const getHandle = (p: Platform) =>
    connectedAccounts.find((a) => a.platform.toLowerCase() === p.toLowerCase())?.handle;

  const handleDisconnect = async (platform: Platform) => {
    try {
      await disconnectAccount({ data: { platform } });
    } catch {}
    onAccountsChange(connectedAccounts.filter((a) => a.platform.toLowerCase() !== platform.toLowerCase()));
    toast.success(`${platform} disconnected`);
  };

  const handleConnectClick = (platform: Platform) => {
    setSelectedPlatform(platform);
    setHandleInput("");
    setConnectModalOpen(true);
  };

  const handleConfirmConnect = async () => {
    const handle = handleInput.trim().replace(/^@/, "");
    if (!handle) {
      toast.error("Please enter a valid handle or username");
      return;
    }
    if (!REGEX.socialHandle.test(handle)) {
      toast.error("Invalid handle: 1-30 characters, letters, numbers, periods, or underscores only");
      return;
    }

    if (selectedPlatform === "Instagram") {
      const isAvero = handle.toLowerCase() === "avero.innovations";
      if (!isAvero && !isMeetSoni) {
        toast.error("Real Meta/Instagram OAuth required for this account. Fake simulated connections are disabled.");
        return;
      }
      setLoading(true);
      try {
        await connectAccount({
          data: {
            platform: "Instagram",
            platform_handle: handle,
            zernio_account_id: "6ad374deed0fd3de6bd7bee9",
          },
        });
        onAccountsChange([
          ...connectedAccounts.filter((a) => a.platform.toLowerCase() !== "instagram"),
          { platform: "Instagram", handle },
        ]);
        toast.success(`Instagram connected (@${handle})`);
      } catch (err: any) {
        toast.error(err?.message || "Failed to connect Instagram");
      } finally {
        setLoading(false);
        setConnectModalOpen(false);
      }
      return;
    }

    // Facebook / X
    toast.error(`${selectedPlatform} live publishing requires active API credentials. Fake simulated connections are disabled.`);
  };

  const handleStartOAuth = async () => {
    setLoading(true);
    try {
      const res = await getZernioConnectUrl({ data: { platform: selectedPlatform } });
      const url = (res as any)?.data?.url ?? (res as any)?.url;
      if (url) {
        toast.info(`Redirecting to ${selectedPlatform} OAuth authorization...`);
        window.location.href = url;
        return;
      }
      toast.error("Could not generate OAuth connect URL");
    } catch (err: any) {
      toast.error(err?.message || "Failed to start OAuth flow");
    } finally {
      setLoading(false);
    }
  };

  const isInstagramActive = isConnected("Instagram");

  return (
    <>
      <ScreenTitle
        eyebrow="YOUR SOCIAL CONNECTIONS"
        title="Accounts"
        description="Choose where your posts should land."
      />
      <div className="max-w-3xl divide-y border-y">
        {(["Instagram", "Facebook", "X"] as Platform[]).map((platform) => {
          const connected = isConnected(platform);
          const handle = getHandle(platform);
          return (
            <div key={platform} className="flex flex-wrap items-center justify-between gap-4 py-5">
              <div className="flex items-center gap-4">
                <span className="flex h-11 w-11 items-center justify-center border bg-card">
                  {platform === "Instagram" ? (
                    <Instagram className="h-5 w-5" />
                  ) : (
                    <span className="text-lg font-bold">{platform === "Facebook" ? "f" : "𝕏"}</span>
                  )}
                </span>
                <div>
                  <p className="text-sm font-semibold">{platform}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {connected ? `Connected · @${handle || "connected"}` : "Not connected yet"}
                  </p>
                </div>
              </div>
              <Button
                variant={connected ? "outline" : "default"}
                size="sm"
                onClick={() => {
                  if (connected) {
                    handleDisconnect(platform);
                  } else {
                    handleConnectClick(platform);
                  }
                }}
              >
                {connected ? "Disconnect" : "Connect"}
              </Button>
            </div>
          );
        })}
      </div>
      <p className="mt-5 max-w-3xl border-l-2 border-primary/50 py-1 pl-4 text-xs leading-5 text-muted-foreground">
        {isInstagramActive
          ? `Instagram Business/Creator account connected and active via Meta Graph API.`
          : "Connect your Instagram Professional (Business or Creator) account to enable direct publishing from PostPilot."}
      </p>

      {/* Connect Account Modal */}
      <Dialog open={connectModalOpen} onOpenChange={setConnectModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">Connect {selectedPlatform}</DialogTitle>
            <DialogDescription>
              Authorize your {selectedPlatform} professional account to publish and schedule posts.
            </DialogDescription>
          </DialogHeader>

          <div className="my-2 space-y-4">
            {/* Account Type Requirement Warning */}
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-left text-xs leading-5 text-amber-950 dark:text-amber-200">
              <p className="font-semibold flex items-center gap-1.5 text-foreground">
                <span className="text-amber-600 font-bold">⚠️</span> Professional Account Required (Business / Creator)
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Meta Graph API and Zernio only support Instagram <strong>Business</strong> or <strong>Creator</strong> accounts. Personal accounts cannot publish via API.
              </p>
              <p className="mt-1 text-[10px] text-muted-foreground italic">
                Free switch in 10s: Instagram App → Settings → Account type & tools → Switch to Professional Account.
              </p>
            </div>

            {/* Automated OAuth Button */}
            <div>
              <p className="mb-2 text-xs font-semibold text-foreground">Option 1: Automated OAuth Flow (Recommended)</p>
              <p className="mb-3 text-xs text-muted-foreground">
                Opens the secure Instagram login screen where you enter your Instagram username and password. You will only connect your own verified account.
              </p>
              <Button
                type="button"
                className="h-12 w-full gap-2 text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
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
            <Button variant="outline" onClick={() => setConnectModalOpen(false)}>
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
  onBusinessNameChange,
  isMeetSoni,
}: {
  businessName: string;
  onBusinessNameChange: (name: string) => void;
  isMeetSoni: boolean;
}) {
  const [business, setBusiness] = useState(businessName);
  const [timezone, setTimezone] = useState("Asia/Kolkata");
  const [tone, setTone] = useState("Friendly");
  const [hashtags, setHashtags] = useState(
    isMeetSoni
      ? "#AveroInnovations, #DigitalProducts, #Tech"
      : "#Community, #Growth, #Social"
  );

  const handleSave = () => {
    onBusinessNameChange(business);
    toast.success("Settings saved");
  };

  return <><ScreenTitle eyebrow="MAKE IT YOURS" title="Settings" description="A few useful defaults to make your next post easier." action={<Button onClick={handleSave} className="gap-2"><Check className="h-4 w-4" /> Save settings</Button>} /><div className="max-w-2xl divide-y border-y"><section className="py-6"><h2 className="font-display text-2xl">Business details</h2><div className="mt-4 grid gap-4 sm:grid-cols-2"><LabeledInput label="Business name" value={business} onChange={setBusiness} /><label className="text-xs font-medium">Timezone<select className="mt-2 flex h-9 w-full border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" value={timezone} onChange={(event) => setTimezone(event.target.value)}><option value="Asia/Kolkata">India (IST)</option><option value="Europe/Stockholm">Stockholm (CEST)</option><option value="America/New_York">New York (EDT)</option><option value="Europe/London">London (BST)</option></select></label></div></section><section className="py-6"><h2 className="font-display text-2xl">Caption preferences</h2><p className="mt-1 text-xs text-muted-foreground">Pick the tone that sounds most like your business.</p><div className="mt-4 flex flex-wrap gap-2">{["Friendly", "Premium", "Playful", "Direct"].map((item) => <Button key={item} variant={tone === item ? "secondary" : "outline"} size="sm" className={tone === item ? "border-primary/30 text-primary" : "font-normal"} onClick={() => setTone(item)} aria-pressed={tone === item}>{item}</Button>)}</div><label className="mt-5 block text-xs font-medium">Default hashtags<Textarea className="mt-2 min-h-20 text-sm font-normal" value={hashtags} onChange={(event) => setHashtags(event.target.value)} /></label></section></div></>;
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
      await signIn.social({
        provider: "google",
        callbackURL: "/",
      });
    } catch (err: any) {
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