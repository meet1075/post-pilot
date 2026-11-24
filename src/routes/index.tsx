import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Activity,
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
  Edit3,
  ExternalLink,
  Eye,
  Hash,
  Instagram,
  Layers,
  LayoutGrid,
  LayoutTemplate,
  Image as ImageIcon,
  Link2,
  List,
  LoaderCircle,
  LogOut,
  Maximize2,
  MapPin,
  Menu,
  Monitor,
  MoreHorizontal,
  Palette,
  PenTool,
  Plus,
  Search,
  Send,
  Settings2,
  ShieldCheck,
  Sparkles,
  Upload,
  Video,
  X,
  Zap,
  ZoomIn,
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
  logUserActivity,
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
import { LogsViewerModal } from "@/components/LogsViewerModal";
import { DiyaLogo } from "@/components/DiyaLogo";
import {
  SocialPlatformIcon,
  AccountSelectItem,
  PlatformAccountCard,
  SocialFeedPreview,
  type SocialFeedPlatform,
  normalizePlatform,
} from "@/components/social";
import {
  getActiveBusinessId,
  saveActiveBusinessId,
  getCachedBusinesses,
  saveCachedBusinesses,
  getCachedWorkspace,
  saveCachedWorkspace,
} from "@/lib/workspaceCache";
import { DIYA_LOGO_URL } from "@/lib/branding";
import { TemplatesView } from "@/components/TemplatesView";
import { TEMPLATES, getTemplateById, type TemplateItem } from "@/lib/templates";
import { getGeoCountries, getGeoStates, getGeoCities, getGeoAreas, generateLocationHashtags } from "@/lib/geoHashtags";
import { searchLocationsLive, fetchLiveCitiesByState, type GeoLocationItem } from "@/lib/geoApiService";

type Page = "Home" | "Create" | "Templates" | "Scheduled" | "Posted" | "Brand kit" | "Accounts" | "Settings";

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
      { title: "dIyA — AI Digital Marketing | Social posts, made simple" },
      {
        name: "description",
        content:
          "Turn ideas into published social media posts in seconds. AI poster design, automated copywriting, custom brand kits, and direct social media scheduling for growing businesses.",
      },
      {
        name: "keywords",
        content:
          "dIyA, AI digital marketing, social media manager, AI poster generator, Instagram scheduler, Facebook scheduler, content calendar, brand kit design, automated social media",
      },
      { name: "robots", content: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" },
      { name: "theme-color", content: "#00E5FF" },
      { name: "application-name", content: "dIyA" },
      { name: "apple-mobile-web-app-title", content: "dIyA" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "default" },

      // Open Graph (Facebook, LinkedIn, WhatsApp)
      { property: "og:site_name", content: "dIyA" },
      { property: "og:type", content: "website" },
      { property: "og:title", content: "dIyA — AI Digital Marketing" },
      {
        property: "og:description",
        content:
          "AI-driven poster generation, smart caption copywriting, and 1-click publishing tailored for modern brands.",
      },
      { property: "og:url", content: "http://localhost:8080/" },
      { property: "og:image", content: DIYA_LOGO_URL },
      { property: "og:image:secure_url", content: DIYA_LOGO_URL },
      { property: "og:image:type", content: "image/png" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:image:alt", content: "dIyA AI Digital Marketing Platform" },
      { property: "og:locale", content: "en_US" },

      // Twitter Cards
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:site", content: "@dIyA" },
      { name: "twitter:creator", content: "@dIyA" },
      { name: "twitter:title", content: "dIyA — AI Digital Marketing" },
      {
        name: "twitter:description",
        content:
          "Turn ideas into published social media posts in seconds with AI poster generation and seamless social media scheduling.",
      },
      { name: "twitter:image", content: DIYA_LOGO_URL },
      { name: "twitter:image:alt", content: "dIyA AI Digital Marketing Platform" },
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
          name: "dIyA",
          url: "http://localhost:8080/",
          description: "AI-powered social media post generator, brand kit styling, and scheduled publishing for businesses.",
          applicationCategory: "BusinessApplication",
          operatingSystem: "All modern web browsers",
          image: DIYA_LOGO_URL,
          screenshot: DIYA_LOGO_URL,
          featureList: [
            "AI-powered poster generator and layout designer",
            "Context-aware social caption suggestions",
            "Brand kit color palette and typography integration",
            "Multi-platform scheduling calendar",
            "Direct Instagram & Facebook publishing via Zernio",
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
  { name: "Templates", icon: LayoutTemplate },
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
  website?: string | undefined;
  email?: string | undefined;
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
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateItem | null>(null);
  // Multi-business workspace state with instant cache hydration
  const initialActiveBizId = getActiveBusinessId();
  const initialCachedWs = getCachedWorkspace(initialActiveBizId);

  const [businesses, setBusinesses] = useState<BusinessSummaryItem[]>(() => getCachedBusinesses());
  const [activeBusinessId, setActiveBusinessId] = useState<string>(() => initialActiveBizId);

  const [posts, setPosts] = useState<SocialPost[]>(() => {
    if (initialCachedWs?.posts && Array.isArray(initialCachedWs.posts)) {
      return initialCachedWs.posts;
    }
    return [];
  });
  const [loadingPosts, setLoadingPosts] = useState<boolean>(() => {
    return !(initialCachedWs?.posts && initialCachedWs.posts.length > 0);
  });
  const [selectedPostForDetail, setSelectedPostForDetail] = useState<SocialPost | null>(null);
  const [businessMenuOpen, setBusinessMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);

  const activeUser = session?.user ?? clientUser ?? (loaderData?.initialUser as any);
  const isMeetSoni = activeUser?.email === "meetsoni1075@gmail.com";

  const [billingInfo, setBillingInfo] = useState<{ isFreeTier: boolean; notice: string; totalAccounts: number }>(() => {
    if (initialCachedWs?.billingInfo) {
      return initialCachedWs.billingInfo;
    }
    return {
      isFreeTier: true,
      notice: "Free Tier: 2 connected accounts included.",
      totalAccounts: 0,
    };
  });

  // Modal dialog states
  const [addBusinessModalOpen, setAddBusinessModalOpen] = useState(false);
  const [logsModalOpen, setLogsModalOpen] = useState(false);
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

  // Persistent brand kit state scoped to active workspace
  const [brandKit, setBrandKit] = useState<BrandKitData>(() => {
    if (initialCachedWs?.brandKit?.businessName) {
      return initialCachedWs.brandKit;
    }
    const cachedBizList = getCachedBusinesses();
    const currentBiz = cachedBizList.find((b) => b.id === initialActiveBizId);
    if (currentBiz) {
      return {
        businessId: currentBiz.id,
        businessName: currentBiz.name,
        tagline: currentBiz.tagline || "",
        location: (currentBiz as any).location || "Ahmedabad",
        phone: (currentBiz as any).phone || "6355206575",
        email: (currentBiz as any).email || "averoinnovations@gmail.com",
        website: (currentBiz as any).website || "https://averoinnovations.com/",
        colors: currentBiz.brand_colors && currentBiz.brand_colors.length > 0 ? currentBiz.brand_colors : ["#00A896", "#028090", "#05668D", "#02C39A"],
        font: (currentBiz as any).font || "Work Sans",
        logoUrl: currentBiz.logo_url || "https://dihikyljbrbidqgelwac.supabase.co/storage/v1/object/public/post-pilot/logos/7d7831d4-8c66-407b-acbc-a2060d66ff00/1792316942214-avero_logo_transparent.png",
        logoName: "Brand Mark",
      };
    }
    return {
      businessName: isMeetSoni ? "Avero Innovations" : "My Workspace",
      tagline: "Ideas today. Tomorrow together.",
      location: "Ahmedabad",
      phone: "6355206575",
      email: "averoinnovations@gmail.com",
      website: "https://averoinnovations.com/",
      colors: ["#00A896", "#028090", "#05668D", "#02C39A"],
      font: "Work Sans",
      logoUrl: "https://dihikyljbrbidqgelwac.supabase.co/storage/v1/object/public/post-pilot/logos/7d7831d4-8c66-407b-acbc-a2060d66ff00/1792316942214-avero_logo_transparent.png",
      logoName: "Brand Mark",
    };
  });

  const businessName = brandKit.businessName;
  const setBusinessName = (name: string) => {
    setBrandKit((prev) => {
      const updated = { ...prev, businessName: name };
      if (activeBusinessId) {
        saveCachedWorkspace(activeBusinessId, { brandKit: updated });
      }
      return updated;
    });
  };

  // Connected accounts for active business with instant cache hydration
  const [connectedAccounts, setConnectedAccounts] = useState<Array<{
    id?: string;
    platform: string;
    handle: string;
    status?: string;
    externalAccountId?: string;
  }>>(() => {
    if (initialCachedWs?.connectedAccounts) {
      return initialCachedWs.connectedAccounts;
    }
    return [];
  });

  // Track latest request to discard in-flight race conditions when rapidly switching workspaces
  const latestRequestRef = useRef<number>(0);

  // Load and refresh workspace data concurrently with Promise.all
  const refreshWorkspace = async (targetId?: string) => {
    const requestId = ++latestRequestRef.current;
    try {
      const chosenId = targetId || activeBusinessId || getActiveBusinessId() || "";

      // Initiate business list query
      const bizPromise = listUserBusinesses();

      let targetBizId = chosenId;
      if (!targetBizId) {
        const bizRes = await bizPromise;
        if (bizRes && "data" in bizRes && bizRes.data?.businesses?.[0]?.id) {
          targetBizId = bizRes.data.activeBusinessId || bizRes.data.businesses[0].id;
        }
      }

      if (!targetBizId) {
        const bizRes = await bizPromise;
        if (bizRes && "data" in bizRes && bizRes.data?.businesses) {
          setBusinesses(bizRes.data.businesses);
          saveCachedBusinesses(bizRes.data.businesses);
        }
        return;
      }

      // Execute all workspace requests in PARALLEL with resilient error boundary
      const [bizResResult, bResResult, accResResult, postsResResult] = await Promise.allSettled([
        bizPromise,
        getBusiness({ data: { businessId: targetBizId } }),
        getAccounts({ data: { businessId: targetBizId } }),
        getPosts({ data: { businessId: targetBizId } }),
      ]);

      const bizRes = bizResResult.status === "fulfilled" ? bizResResult.value : null;
      const bRes = bResResult.status === "fulfilled" ? bResResult.value : null;
      const accRes = accResResult.status === "fulfilled" ? accResResult.value : null;
      const postsRes = postsResResult.status === "fulfilled" ? postsResResult.value : null;

      // Discard stale in-flight response if user switched workspace during fetch
      if (requestId !== latestRequestRef.current) {
        return;
      }

      // 1. Update businesses list & cache
      if (bizRes && "data" in bizRes && bizRes.data?.businesses) {
        const list = bizRes.data.businesses;
        setBusinesses(list);
        saveCachedBusinesses(list);
      }

      // 2. Persist active business ID
      setActiveBusinessId(targetBizId);
      saveActiveBusinessId(targetBizId);

      // 3. Process BrandKit
      let newBrandKit = brandKit;
      if (bRes?.success && bRes.business) {
        const b = bRes.business;
        newBrandKit = {
          businessId: b.id,
          businessName: b.name,
          tagline: b.tagline || "",
          location: b.location || "",
          phone: b.phone || "",
          website: (b as any).website || "",
          email: (b as any).email || "",
          colors: Array.isArray(b.brand_colors) && b.brand_colors.length > 0 ? b.brand_colors : ["Tomato", "Olive"],
          font: (b as any).font || "Work Sans",
          tone: b.tone || "Friendly",
          timezone: b.timezone || "Asia/Kolkata",
          defaultHashtags: b.default_hashtags || "",
          logoUrl: b.logo_url || undefined,
        };
        setBrandKit(newBrandKit);
      }

      // 4. Process Connected Accounts
      let newAccounts = connectedAccounts;
      let newBilling = billingInfo;
      if (accRes && "data" in accRes && accRes.data) {
        const accs = accRes.data.accounts;
        if (Array.isArray(accs)) {
          newAccounts = accs
            .filter((a: any) => a.status === "connected")
            .map((a: any) => ({
              id: a.id,
              platform: normalizePlatform(a.platform),
              handle: a.username || a.platform_handle || "Connected",
              status: a.status,
              externalAccountId: a.external_account_id,
            }));
          setConnectedAccounts(newAccounts);
        }
        if (accRes.data.billing) {
          newBilling = {
            isFreeTier: accRes.data.billing.isFreeTier,
            notice: accRes.data.billing.notice,
            totalAccounts: (accRes.data.billing as any).totalAccounts ?? (accRes.data.totalConnectedAccounts ?? 0),
          };
          setBillingInfo(newBilling);
        }
      }

      // 5. Process Posts
      let newPosts = posts;
      if (postsRes) {
        const rawPosts = (postsRes as any).data?.posts || (postsRes as any).posts;
        if (Array.isArray(rawPosts)) {
          newPosts = rawPosts.map((p: any) => {
            let dateStr = "";
            const rawDate = p.date || p.published_at || p.created_at;
            if (rawDate) {
              dateStr = typeof rawDate === "string" ? rawDate.slice(0, 10) : new Date(rawDate).toISOString().slice(0, 10);
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
          setPosts(newPosts);
        }
      }

      setLoadingPosts(false);

      // Persist complete workspace cache for targetBizId
      saveCachedWorkspace(targetBizId, {
        businessId: targetBizId,
        brandKit: newBrandKit,
        connectedAccounts: newAccounts,
        posts: newPosts,
        billingInfo: newBilling,
      });
    } catch (err) {
      console.error("[refreshWorkspace Error]", err);
      setLoadingPosts(false);
    }
  };

  // Revalidate on mount and whenever activeUser changes
  useEffect(() => {
    refreshWorkspace();
  }, [activeUser?.id, activeUser?.email]);

  // Instant optimistic workspace switching (0ms delay)
  const handleSwitchBusiness = async (bizId: string) => {
    setBusinessMenuOpen(false);
    if (bizId === activeBusinessId) return;

    const target = businesses.find((b) => b.id === bizId);
    if (!target) return;

    logUserActivity({
      action: "workspace.switched",
      businessId: bizId,
      resourceType: "WORKSPACE",
      metadata: {
        toWorkspace: target.name,
        fromWorkspace: businessName,
      },
    });

    // 1. INSTANT OPTIMISTIC SWITCH: update ID & active markers immediately
    setActiveBusinessId(bizId);
    saveActiveBusinessId(bizId);

    // 2. Check if we have this workspace's data cached
    const cachedWs = getCachedWorkspace(bizId);
    if (cachedWs) {
      if (cachedWs.brandKit?.businessName) setBrandKit(cachedWs.brandKit);
      if (cachedWs.connectedAccounts) setConnectedAccounts(cachedWs.connectedAccounts);
      if (cachedWs.posts) setPosts(cachedWs.posts);
      if (cachedWs.billingInfo) setBillingInfo(cachedWs.billingInfo);
      setLoadingPosts(false);
    } else {
      // Optimistically display the target business name and clear out the old workspace data
      setBrandKit((prev) => ({
        ...prev,
        businessId: target.id,
        businessName: target.name,
      }));
      setConnectedAccounts([]);
      setPosts([]);
      setLoadingPosts(true);
    }

    // 3. BACKGROUND REVALIDATION (non-blocking SWR sync)
    await refreshWorkspace(bizId);
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

  // Distinct active connected platforms
  const activeConnectedAccounts = connectedAccounts.filter(
    (a) => !a.status || a.status === "connected"
  );
  const activePlatforms = Array.from(
    new Set(activeConnectedAccounts.map((a) => normalizePlatform(a.platform)))
  );
  const totalConnectedCount = activePlatforms.length;
  const isAnySocialConnected = totalConnectedCount > 0;

  let socialConnectionLabel = "No social media connected";
  if (totalConnectedCount >= 2) {
    socialConnectionLabel = `${totalConnectedCount} social media apps connected`;
  } else if (totalConnectedCount === 1) {
    socialConnectionLabel = `${activePlatforms[0]} connected`;
  }

  const userName = activeUser?.name || (isMeetSoni ? "Meet Soni" : "User");
  const userEmail = activeUser?.email || (isMeetSoni ? "meetsoni1075@gmail.com" : "");
  const userAvatar = activeUser?.image;
  const userInitial = (activeUser?.name || activeUser?.email || "U").charAt(0).toUpperCase();
  const businessInitial = (businessName || "M").charAt(0).toUpperCase();

  const navigate = (nextPage: Page) => {
    setPage(nextPage);
    setMobileNavOpen(false);
    setBusinessMenuOpen(false);
    logUserActivity({
      action: `navigation.view_${nextPage.toLowerCase().replace(/\s+/g, "_")}`,
      businessId: activeBusinessId,
      resourceType: "PAGE",
      metadata: { page: nextPage, businessName },
    });
  };

  // If session is still verifying, show clean splash screen to avoid login screen flash
  if ((isSessionPending && !activeUser) || (!activeUser && !clientChecked)) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3 animate-pulse">
          <DiyaLogo
            markClassName="h-16 sm:h-20"
            textClassName="text-xs sm:text-sm tracking-[0.28em]"
          />
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
          <div className="flex h-full items-center justify-between md:justify-center px-4 sm:px-6 md:w-[260px] md:border-r md:border-white/[0.08] md:px-4">
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
              className="group flex items-center justify-center text-center focus-visible:outline-none"
              onClick={() => navigate("Home")}
              aria-label="dIyA home"
            >
              <DiyaLogo
                align="center"
                markClassName="h-7 sm:h-8"
                textClassName="text-[9px] sm:text-[10px] tracking-[0.24em]"
              />
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
            <span className={`h-2 w-2 rounded-full ${isAnySocialConnected ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" : "bg-muted-foreground/60"}`} />
            <span className="font-medium text-[11px]">{socialConnectionLabel}</span>
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
                      ? "bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-400 text-white ring-2 ring-cyan-400/40 shadow-cyan-500/30"
                      : "bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-400 text-white shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:brightness-110 active:scale-[0.98]"
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
                    { name: "Templates" as Page, icon: LayoutTemplate },
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
                    { name: "Accounts" as Page, icon: Link2, dot: isAnySocialConnected },
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
                  <button
                    onClick={() => {
                      setLogsModalOpen(true);
                      logUserActivity({
                        action: "audit_logs.viewed",
                        businessId: activeBusinessId,
                        resourceType: "SYSTEM",
                        metadata: { section: "Activity & Logs", businessName },
                      });
                    }}
                    className="group relative flex h-10 w-full items-center gap-3 rounded-xl px-3.5 text-sm transition-all duration-150 text-muted-foreground hover:bg-secondary/60 hover:text-foreground font-medium"
                  >
                    <Activity className="h-4 w-4 transition-colors text-cyan-400 group-hover:text-cyan-300" />
                    <span>Activity & Logs</span>
                    <span className="ml-auto flex h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(6,182,212,0.8)]" />
                  </button>
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
                connectedAccounts={connectedAccounts}
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
                scheduledCount={posts.filter((p) => p.status === "Scheduled").length}
                selectedTemplate={selectedTemplate}
                onClearTemplate={() => setSelectedTemplate(null)}
                onSwitchBusiness={handleSwitchBusiness}
                onOpenAddBusiness={() => setAddBusinessModalOpen(true)}
                onPublished={(post) => {
                  const safeDate = post.date instanceof Date
                    ? post.date.toISOString().slice(0, 10)
                    : (post.date ? String(post.date).slice(0, 10) : "");
                  const cleanPost = {
                    ...post,
                    date: safeDate,
                  };
                  setPosts((current) => {
                    const filtered = current.filter((p) => p.id !== cleanPost.id);
                    const updated = [cleanPost, ...filtered];
                    try {
                      localStorage.setItem("postpilot_cached_posts", JSON.stringify(updated));
                    } catch {}
                    if (activeBusinessId) {
                      const cachedWs = getCachedWorkspace(activeBusinessId);
                      if (cachedWs) {
                        saveCachedWorkspace(activeBusinessId, {
                          ...cachedWs,
                          posts: updated,
                        });
                      }
                    }
                    return updated;
                  });
                }}
                onCancel={() => navigate("Home")}
                onNavigate={navigate}
              />
            )}
            {page === "Templates" && (
              <TemplatesView
                businessName={businessName}
                onSelectTemplate={(tpl) => {
                  setSelectedTemplate(tpl);
                  navigate("Create");
                }}
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
                    saveCachedWorkspace(activeBusinessId, { brandKit: updated });
                    setBusinesses((prev) => {
                      const next = prev.map((b) =>
                        b.id === activeBusinessId
                          ? {
                              ...b,
                              name: updated.businessName,
                              tagline: updated.tagline,
                              location: updated.location,
                              phone: updated.phone,
                              website: updated.website,
                              email: updated.email,
                              brand_colors: updated.colors,
                              logo_url: updated.logoUrl,
                            }
                          : b
                      );
                      saveCachedBusinesses(next as any);
                      return next;
                    });
                    try {
                      await updateBusiness({
                        data: {
                          business_id: activeBusinessId,
                          name: updated.businessName,
                          tagline: updated.tagline,
                          location: updated.location,
                          phone: updated.phone,
                          website: updated.website,
                          email: updated.email,
                          brand_colors: updated.colors,
                          logo_url: updated.logoUrl || null,
                          tone: (updated.tone as any) || "Friendly",
                          timezone: updated.timezone || "Asia/Kolkata",
                          default_hashtags: updated.defaultHashtags || null,
                        },
                      });
                      await updateBrandKit({
                        data: {
                          business_id: activeBusinessId,
                          colors: updated.colors,
                          font: updated.font,
                          caption_tone: updated.tone,
                          default_hashtags: updated.defaultHashtags,
                          logo_public_url: updated.logoUrl,
                          website: updated.website,
                          email: updated.email,
                          phone: updated.phone,
                          location: updated.location,
                        },
                      });
                    } catch (err: any) {
                      console.error("Failed to update business in database", err);
                    }
                  }
                  toast.success("Brand kit saved & applied across dIyA");
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
            <LogsViewerModal
              isOpen={logsModalOpen}
              onClose={() => setLogsModalOpen(false)}
              businessId={activeBusinessId}
              businessName={businessName}
            />

            {/* Add Business Modal Dialog */}
            <Dialog open={addBusinessModalOpen} onOpenChange={setAddBusinessModalOpen}>
              <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="font-display text-2xl flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Plus className="h-4 w-4" />
                    </span>
                    Add New Business Workspace
                  </DialogTitle>
                  <DialogDescription>
                    Create a separate workspace with its own brand identity, tone, and social media channels (Instagram, Facebook).
                  </DialogDescription>
                </DialogHeader>

                {/* Helpful guidance banner */}
                <div className="rounded-xl border border-white/[0.08] bg-secondary/30 p-3 text-xs text-muted-foreground flex items-center gap-2.5">
                  <span className="text-base shrink-0">💡</span>
                  <span>
                    This creates a <strong>new brand workspace</strong>. To connect social media accounts to your current workspace (<strong className="text-foreground">{businessName}</strong>), go to <strong className="text-foreground">Preferences → Accounts</strong>.
                  </span>
                </div>

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

            {/* Prompt to Connect Social Accounts Modal Dialog */}
            <Dialog open={connectPromptOpen} onOpenChange={setConnectPromptOpen}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="font-display text-2xl flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Sparkles className="h-4 w-4" />
                    </span>
                    Connect Social Channels
                  </DialogTitle>
                  <DialogDescription>
                    Link social accounts for <strong>{connectPromptBiz?.name}</strong> to enable one-click publishing and scheduling.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-3 py-2 text-xs">
                  <div className="rounded-lg border bg-secondary/50 p-3 leading-relaxed text-muted-foreground">
                    <p className="font-medium text-foreground mb-1">Separate Accounts per Workspace</p>
                    Each workspace has its own independent social connections. You can connect multiple Instagram and Facebook handles to each workspace.
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <Button
                      variant="outline"
                      className="gap-2 h-11 rounded-xl border-white/10 hover:border-pink-500/40 hover:bg-pink-500/5 text-xs font-semibold justify-center"
                      onClick={() => {
                        if (connectPromptBiz) {
                          setConnectPromptOpen(false);
                          startOAuthForBiz(connectPromptBiz.id, "Instagram");
                        }
                      }}
                    >
                      <SocialPlatformIcon platform="Instagram" size="xs" />
                      Connect Instagram
                    </Button>
                    <Button
                      variant="outline"
                      className="gap-2 h-11 rounded-xl border-white/10 hover:border-blue-500/40 hover:bg-blue-500/5 text-xs font-semibold justify-center"
                      onClick={() => {
                        if (connectPromptBiz) {
                          setConnectPromptOpen(false);
                          startOAuthForBiz(connectPromptBiz.id, "Facebook");
                        }
                      }}
                    >
                      <SocialPlatformIcon platform="Facebook" size="xs" />
                      Connect Facebook
                    </Button>
                  </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                  <Button variant="ghost" className="w-full text-xs text-muted-foreground" onClick={() => setConnectPromptOpen(false)}>
                    I'll do this later from Accounts tab
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
  connectedAccounts = [],
  onSelectPost,
}: {
  posts: SocialPost[];
  loadingPosts?: boolean;
  onNavigate: (page: Page) => void;
  userName?: string | undefined;
  businessName: string;
  instagramAccount?: { id?: string; platform: string; handle: string } | undefined;
  connectedAccounts?: Array<{ id?: string; platform: string; handle: string; status?: string; externalAccountId?: string }> | undefined;
  onSelectPost?: ((post: SocialPost) => void) | undefined;
}) {
  const latestPosts = posts.slice(0, 3);
  const totalPostedCount = posts.filter((post) => post.status === "Posted").length;
  const scheduledCount = posts.filter((post) => post.status === "Scheduled").length;

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const postedThisMonthCount = useMemo(() => {
    return posts.filter((post) => {
      if (post.status !== "Posted") return false;
      if (!post.date) return false;
      const dateStr = post.date instanceof Date ? post.date.toISOString().slice(0, 10) : String(post.date);
      const match = dateStr.match(/^(\d{4})-(\d{2})/);
      if (match && match[1] && match[2]) {
        const postYear = parseInt(match[1], 10);
        const postMonth = parseInt(match[2], 10) - 1;
        return postYear === currentYear && postMonth === currentMonth;
      }
      const d = new Date(dateStr);
      return !isNaN(d.getTime()) && d.getFullYear() === currentYear && d.getMonth() === currentMonth;
    }).length;
  }, [posts, currentYear, currentMonth]);
  const greetingName = userName ? userName.split(" ")[0] : "there";
  const todayLabel = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }).toUpperCase();

  const igAccounts = useMemo(() => {
    const fromList = (connectedAccounts || []).filter(
      (a) => a.platform.toLowerCase() === "instagram"
    );
    if (fromList.length === 0 && instagramAccount) {
      return [instagramAccount];
    }
    return fromList;
  }, [connectedAccounts, instagramAccount]);

  const fbAccounts = useMemo(() => {
    return (connectedAccounts || []).filter(
      (a) => a.platform.toLowerCase() === "facebook"
    );
  }, [connectedAccounts]);

  const totalConnected = igAccounts.length + fbAccounts.length;

  return (
    <>
      <ScreenTitle
        eyebrow={todayLabel}
        title={`Welcome back, ${greetingName}.`}
        description="Create, schedule, and publish attractive social posts with ease."
        action={
          <Button onClick={() => onNavigate("Create")} className="h-11 px-6 rounded-xl font-semibold gap-2 bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-400 hover:brightness-110 text-white shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all">
            <Plus className="h-4 w-4 stroke-[2.5]" /> Create a post
          </Button>
        }
      />

      {/* 3 Metric Overview Cards */}
      <section className="mb-8 grid gap-4 sm:grid-cols-3" aria-label="Posting overview">
        {/* Card 1: Posts this month */}
        <div className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-card/70 p-5 shadow-lg backdrop-blur-xl transition-all duration-300 hover:border-primary/40 hover:bg-card hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-0.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Posts This Month</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 group-hover:scale-110 transition-transform">
              <Send className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-display text-4xl font-bold tracking-tight text-foreground group-hover:text-primary transition-colors">
              {postedThisMonthCount}
            </span>
            <span className="text-xs text-muted-foreground">published</span>
          </div>
          <div className="mt-3 flex items-center gap-2 border-t border-white/[0.06] pt-3 text-xs text-muted-foreground">
            <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span>
              {postedThisMonthCount > 0
                ? `${postedThisMonthCount} ${postedThisMonthCount === 1 ? "post" : "posts"} live on feeds this month`
                : "Ready to publish your first this month"}
            </span>
          </div>
        </div>

        {/* Card 2: In the calendar */}
        <div className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-card/70 p-5 shadow-lg backdrop-blur-xl transition-all duration-300 hover:border-indigo-500/40 hover:bg-card hover:shadow-2xl hover:shadow-indigo-500/5 hover:-translate-y-0.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">In The Calendar</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 group-hover:scale-110 transition-transform">
              <CalendarDays className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-display text-4xl font-bold tracking-tight text-foreground group-hover:text-indigo-400 transition-colors">
              {scheduledCount}
            </span>
            <span className="text-xs text-muted-foreground">queued</span>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-white/[0.06] pt-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Clock3 className="h-3 w-3 text-indigo-400" />
              <span>{scheduledCount > 0 ? `${scheduledCount} upcoming drops` : "No scheduled drops queued"}</span>
            </span>
            {scheduledCount > 0 && (
              <button onClick={() => onNavigate("Scheduled")} className="font-semibold text-primary hover:underline text-[11px]">
                View →
              </button>
            )}
          </div>
        </div>

        {/* Card 3: Connected Channels (Both Instagram & Facebook) */}
        <div className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-card/70 p-5 shadow-lg backdrop-blur-xl transition-all duration-300 hover:border-blue-500/40 hover:bg-card hover:shadow-2xl hover:shadow-blue-500/5 hover:-translate-y-0.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Connected Channels</span>
              {totalConnected > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  {totalConnected} Active
                </span>
              )}
            </div>
            <div className="flex items-center -space-x-1.5">
              {igAccounts.length > 0 && (
                <SocialPlatformIcon platform="Instagram" variant="badge" size="sm" className="ring-2 ring-card" />
              )}
              {fbAccounts.length > 0 && (
                <SocialPlatformIcon platform="Facebook" variant="badge" size="sm" className="ring-2 ring-card" />
              )}
              {totalConnected === 0 && (
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary/80 border border-white/10 text-muted-foreground">
                  <Link2 className="h-4 w-4" />
                </div>
              )}
            </div>
          </div>

          {totalConnected > 0 ? (
            <div className="mt-3 space-y-1.5">
              {igAccounts.map((ig, i) => (
                <div
                  key={ig.id || `ig-${i}`}
                  className="flex items-center justify-between gap-2 rounded-xl border border-pink-500/20 bg-pink-500/[0.08] px-3 py-1.5 backdrop-blur-sm"
                >
                  <span className="flex items-center gap-2 text-xs font-semibold text-foreground min-w-0">
                    <SocialPlatformIcon platform="Instagram" size="xs" />
                    <span className="truncate">@{ig.handle}</span>
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-400 shrink-0">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Active
                  </span>
                </div>
              ))}
              {fbAccounts.map((fb, i) => (
                <div
                  key={fb.id || `fb-${i}`}
                  className="flex items-center justify-between gap-2 rounded-xl border border-blue-500/20 bg-blue-500/[0.08] px-3 py-1.5 backdrop-blur-sm"
                >
                  <span className="flex items-center gap-2 text-xs font-semibold text-foreground min-w-0">
                    <SocialPlatformIcon platform="Facebook" size="xs" />
                    <span className="truncate">@{fb.handle}</span>
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-400 shrink-0">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Active
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-3">
              <p className="font-display text-2xl font-semibold text-muted-foreground">None linked</p>
              <div className="mt-3 border-t border-white/[0.06] pt-3">
                <button
                  onClick={() => onNavigate("Accounts")}
                  className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
                >
                  Connect in Accounts →
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Hero Showcase: A FRESH IDEA with Quick Prompts & Multi-Platform Badges */}
      <section className="relative mb-10 overflow-hidden rounded-3xl border border-white/[0.1] bg-gradient-to-br from-card/95 via-card/80 to-secondary/30 p-6 sm:p-8 md:p-10 shadow-2xl backdrop-blur-2xl">
        <div className="absolute -right-16 -top-16 h-72 w-72 rounded-full bg-gradient-to-br from-purple-600/20 to-cyan-500/15 blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 h-72 w-72 rounded-full bg-gradient-to-tr from-blue-600/15 to-violet-500/15 blur-3xl pointer-events-none" />

        <div className="grid items-center gap-6 md:grid-cols-[1fr_auto] relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-cyan-500/10 border border-cyan-500/25 text-cyan-400 shadow-sm mb-3">
              <Sparkles className="h-3.5 w-3.5 animate-pulse text-cyan-400" /> AI Social Media Studio
            </div>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-[40px] font-bold tracking-tight leading-[1.15] text-foreground">
              What would you like to share{" "}
              <span className="bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-300 bg-clip-text text-transparent">
                today?
              </span>
            </h2>
            <p className="mt-3 max-w-2xl text-sm sm:text-base leading-relaxed text-muted-foreground">
              Describe your idea, promo, or announcement. dIyA creates pixel-perfect brand posters and high-converting captions in seconds.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col gap-3 self-center shrink-0">
            <Button
              className="h-12 px-7 rounded-2xl font-bold gap-2.5 bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-400 hover:brightness-110 text-white shadow-xl shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
              onClick={() => onNavigate("Create")}
            >
              <Plus className="h-4 w-4 stroke-[3]" /> Start a new post <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>

        {/* Footer with both Instagram & Facebook channels */}
        <div className="mt-7 flex flex-wrap items-center justify-between gap-4 border-t border-white/[0.08] pt-5 text-xs">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <span className="text-muted-foreground font-medium">Publishing to:</span>
            {igAccounts.map((ig, i) => (
              <span
                key={ig.id || `ig-${i}`}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/[0.1] border border-pink-500/20 text-pink-200 text-xs font-semibold backdrop-blur-sm"
              >
                <SocialPlatformIcon platform="Instagram" size="xs" />
                <span>@{ig.handle}</span>
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </span>
            ))}
            {fbAccounts.map((fb, i) => (
              <span
                key={fb.id || `fb-${i}`}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/[0.1] border border-blue-500/20 text-blue-200 text-xs font-semibold backdrop-blur-sm"
              >
                <SocialPlatformIcon platform="Facebook" size="xs" />
                <span>@{fb.handle}</span>
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </span>
            ))}
            {totalConnected === 0 && (
              <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                No accounts connected yet
              </span>
            )}
          </div>
          <div className="flex items-center gap-4">
            {totalConnected > 0 && (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                {totalConnected === 1 ? "1 channel synced" : `${totalConnected} channels synced`}
              </span>
            )}
            <button
              onClick={() => onNavigate("Accounts")}
              className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors inline-flex items-center gap-1"
            >
              Manage channels →
            </button>
          </div>
        </div>
      </section>

      {/* Recent Posts Section */}
      <section>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h2 className="font-display text-2xl font-bold text-foreground">Recent Posts</h2>
            {posts.length > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/[0.06] border border-white/10 text-muted-foreground">
                {posts.length} {posts.length === 1 ? "post" : "posts"}
              </span>
            )}
          </div>
          {posts.length > 0 && (
            <Button
              variant="ghost"
              className="gap-1.5 text-xs text-primary font-semibold hover:text-primary hover:bg-primary/10 rounded-xl"
              onClick={() => onNavigate("Scheduled")}
            >
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
        <span className="font-medium text-foreground/80">{totalPostedCount} posts published</span>
        <span>•</span>
        <span>{scheduledCount} queued</span>
        <span>•</span>
        <span>dIyA AI Social Media Engine</span>
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

function formatPostDate(dateStr?: string | Date, timeStr?: string): string {
  if (!dateStr) return "Recently";
  try {
    const raw = dateStr instanceof Date ? dateStr.toISOString() : String(dateStr);
    const parts = raw.slice(0, 10).split("-").map(Number);
    const y = parts[0] || 2026;
    const m = (parts[1] || 1) - 1;
    const d = parts[2] || 1;
    const formatted = new Date(y, m, d).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    return timeStr ? `${formatted} · ${String(timeStr).slice(0, 5)}` : formatted;
  } catch {
    return String(dateStr);
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
  const isFb = post.platform === "Facebook";

  return (
    <article
      onClick={() => onSelectPost?.(post)}
      className="group cursor-pointer overflow-hidden rounded-2xl border border-white/[0.08] bg-card/70 p-4 shadow-sm backdrop-blur-sm transition-all duration-300 hover:border-primary/40 hover:bg-card hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-0.5"
    >
      <div className="grid grid-cols-[100px_1fr] gap-4">
        <div className="w-[100px] shrink-0">
          {post.imageUrl ? (
            <div className="aspect-[4/5] w-full overflow-hidden rounded-xl border border-white/[0.08] bg-muted shadow-sm relative">
              <img
                src={post.imageUrl}
                alt={post.headline}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute top-1.5 left-1.5">
                <span className="flex h-5 w-5 items-center justify-center rounded-md bg-black/70 backdrop-blur-md text-white shadow-sm border border-white/15">
                  <SocialPlatformIcon platform={post.platform} size="xs" />
                </span>
              </div>
            </div>
          ) : (
            <div className="aspect-[4/5] w-full overflow-hidden rounded-xl border border-white/[0.08]">
              <Poster
                theme={post.theme}
                eyebrow={businessName?.toUpperCase() ?? "DIYA"}
                headline={post.headline}
                price={post.price}
                footer="FRESH DAILY"
              />
            </div>
          )}
        </div>
        <div className="flex min-w-0 flex-col py-0.5">
          <div className="flex items-center justify-between gap-2">
            <StatusBadge status={post.status} />
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/[0.06]"
              aria-label={`View details for ${post.headline}`}
              onClick={(e) => {
                e.stopPropagation();
                onSelectPost?.(post);
              }}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
          <h3 className="mt-2.5 line-clamp-2 text-sm font-semibold leading-5 text-foreground group-hover:text-primary transition-colors">
            {post.headline}
          </h3>
          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground/90 whitespace-pre-line">
            {cleanCaptionDisplay(post.caption)}
          </p>
          <div className="mt-auto flex items-center justify-between pt-3 text-[11px] text-muted-foreground border-t border-white/[0.04]">
            <span className="flex items-center gap-1.5 font-medium">
              {isFb ? (
                <span className="flex h-3.5 w-3.5 items-center justify-center rounded-sm bg-[#1877F2] text-[9px] font-black text-white leading-none">f</span>
              ) : (
                <Instagram className="h-3.5 w-3.5 text-pink-400" />
              )}
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

const ASPECT_RATIOS = [
  { ratio: "1:1", label: "1:1", name: "Square", boxW: "w-7", boxH: "h-7", bestFor: "1:1 is best for Instagram and Facebook square posts." },
  { ratio: "4:5", label: "4:5", name: "Portrait", boxW: "w-6", boxH: "h-8", bestFor: "4:5 is best for Instagram and Facebook portrait posts." },
  { ratio: "9:16", label: "9:16", name: "Story", boxW: "w-5", boxH: "h-9", bestFor: "9:16 is best for Instagram Stories, Reels, and mobile full-screen." },
];

function CreateFlow({
  brandKit,
  businessName,
  activeBusinessId,
  businesses = [],
  connectedAccounts = [],
  scheduledCount = 0,
  selectedTemplate,
  onClearTemplate,
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
  scheduledCount?: number;
  selectedTemplate?: TemplateItem | null;
  onClearTemplate?: () => void;
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

  const [prompt, setPrompt] = useState(() => selectedTemplate?.defaultPrompt || "");
  const [style, setStyle] = useState(() => selectedTemplate?.style || "Bold");
  const [model, setModel] = useState("Google Nano Banana Lite");
  const [shape, setShape] = useState<string>(() => selectedTemplate?.aspectRatio || "4:5");
  const format = shape === "1:1" ? "Square" : shape === "9:16" ? "Story" : "Portrait 4:5";
  const [size, setSize] = useState("1K");
  const [wordsOnImage, setWordsOnImage] = useState(() => selectedTemplate?.wordsOnImage || "");
  const [templateId, setTemplateId] = useState<string | null>(() => selectedTemplate?.id || null);
  const [referenceImageUrl, setReferenceImageUrl] = useState<string>(() => selectedTemplate?.referenceImageUrl || "");
  const [referenceFileName, setReferenceFileName] = useState<string>("");
  const [urlInputVal, setUrlInputVal] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [expandedSection, setExpandedSection] = useState<"model" | "reference" | "video" | "shape" | "size" | "words" | "brand" | null>("shape");

  // Keep synced if a new template was selected from Templates page
  useEffect(() => {
    if (selectedTemplate) {
      setTemplateId(selectedTemplate.id);
      if (selectedTemplate.defaultPrompt) setPrompt(selectedTemplate.defaultPrompt);
      if (selectedTemplate.style) setStyle(selectedTemplate.style);
      if (selectedTemplate.aspectRatio) setShape(selectedTemplate.aspectRatio);
      if (selectedTemplate.wordsOnImage) setWordsOnImage(selectedTemplate.wordsOnImage);
      if (selectedTemplate.referenceImageUrl) setReferenceImageUrl(selectedTemplate.referenceImageUrl);
    }
  }, [selectedTemplate]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image size exceeds 10MB limit");
      return;
    }
    setReferenceFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setReferenceImageUrl(result);
        toast.success(`Reference photo "${file.name}" added`);
      }
    };
    reader.readAsDataURL(file);
  };
  const [tickedBrandDetails, setTickedBrandDetails] = useState({
    logo: Boolean(brandKit.logoUrl),
    colors: false,
    phone: Boolean(brandKit.phone),
    location: false,
    website: false,
    email: Boolean(brandKit.email),
  });
  const [useBrand, setUseBrand] = useState(true);

  // Synchronize ticked brand details whenever brandKit changes
  useEffect(() => {
    setTickedBrandDetails((prev) => ({
      ...prev,
      logo: prev.logo || Boolean(brandKit.logoUrl),
      phone: prev.phone || Boolean(brandKit.phone),
      email: prev.email || Boolean(brandKit.email),
      website: prev.website || Boolean(brandKit.website),
      location: prev.location || Boolean(brandKit.location),
    }));
  }, [brandKit.logoUrl, brandKit.phone, brandKit.email, brandKit.website, brandKit.location]);

  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<PosterOption[]>(initialOptions);
  const [selected, setSelected] = useState(0);
  const [headline, setHeadline] = useState("");
  const [price, setPrice] = useState("");
  const [dateText, setDateText] = useState("");
  const [caption, setCaption] = useState("");
  const [postLocation, setPostLocation] = useState(brandKit.location || "");
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
  const [scheduledDate, setScheduledDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, "0")}-${String(tomorrow.getDate()).padStart(2, "0")}`;
  });
  const [scheduledTime, setScheduledTime] = useState("12:00");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(3);

  // 3-second automatic redirect to home workspace after successful publish
  useEffect(() => {
    if (!success) return;
    setRedirectCountdown(3);
    const interval = setInterval(() => {
      setRedirectCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onCancel();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [success, onCancel]);

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
    const parsed = generatePostersSchema.safeParse({
      prompt,
      style,
      format,
      words_on_image: wordsOnImage,
      size,
      reference_image_url: referenceImageUrl || null,
      template_id: templateId || null,
      ticked_details: tickedBrandDetails,
      brand_details: {
        business_name: brandKit.businessName,
        tagline: brandKit.tagline,
        phone: brandKit.phone,
        email: brandKit.email,
        website: brandKit.website,
        location: brandKit.location,
        logo_url: brandKit.logoUrl,
        colors: brandKit.colors,
      },
    });
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
        selectedAccountId,
        wordsOnImage,
        tickedBrandDetails,
        size,
        referenceImageUrl || undefined,
        templateId || undefined
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
        selectedAccountId,
        wordsOnImage,
        tickedBrandDetails,
        size,
        referenceImageUrl || undefined,
        templateId || undefined
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
      if (scheduledCount >= 10) {
        toast.error("Schedule limit reached: You can have a maximum of 10 active scheduled posts at a time. Please wait for an existing scheduled post to publish or delete one to schedule more.");
        return;
      }
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
    const todayIso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const timeIso = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
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
          format,
          contactInfo: {
            phone: tickedBrandDetails.phone ? brandKit.phone : undefined,
            email: tickedBrandDetails.email ? brandKit.email : undefined,
            website: tickedBrandDetails.website ? brandKit.website : undefined,
            location: tickedBrandDetails.location ? brandKit.location : undefined,
          },
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
      location: postLocation || undefined,
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
    return (
      <div className="mx-auto max-w-xl py-16 text-center sm:py-24 animate-in fade-in duration-300">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
          <Check className="h-8 w-8 stroke-[3]" />
        </span>
        <p className="mt-6 text-[11px] font-bold uppercase tracking-widest text-primary">POST COMPLETED</p>
        <h1 className="mt-2 font-display text-4xl font-semibold text-foreground">
          {timing === "now" ? "Your post is out there!" : "It's in the calendar!"}
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">
          {timing === "now"
            ? "Your post has been published across your connected channels."
            : `Your post is lined up for ${new Date(`${scheduledDate}T${scheduledTime}`).toLocaleString("en-US", { weekday: "long", month: "long", day: "numeric", hour: "numeric", minute: "2-digit" })}.`}
        </p>

        {/* 3-Second Automatic Countdown Card */}
        <div className="mt-6 mx-auto max-w-xs rounded-xl border border-white/10 bg-secondary/50 p-3.5 shadow-sm">
          <p className="text-xs font-medium text-foreground flex items-center justify-center gap-1.5">
            <Clock3 className="h-3.5 w-3.5 text-primary" />
            Moving to home workspace in <strong className="text-primary font-bold text-sm">{redirectCountdown}s</strong>...
          </p>
          <div className="mt-2.5 h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-1000 ease-linear rounded-full"
              style={{ width: `${(redirectCountdown / 3) * 100}%` }}
            />
          </div>
        </div>

        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Button onClick={onCancel} className="font-semibold shadow-md">
            Go to workspace now <ArrowRight className="h-4 w-4 ml-1.5" />
          </Button>
          <Button variant="outline" onClick={() => onNavigate(timing === "now" ? "Posted" : "Scheduled")}>
            {timing === "now" ? "View posted history" : "Open your calendar"}
          </Button>
        </div>
      </div>
    );
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
          const stepNumber = index + 1;
          const isCurrent = step === stepNumber;
          const isPassed = step > stepNumber;
          // Once user has generated posters and is in Step 2 or 3, prevent clicking back to Step 1 (Describe)
          const isClickable = step === 1 ? isCurrent : (stepNumber > 1 && stepNumber <= step);
          return (
            <button
              key={label}
              disabled={!isClickable}
              onClick={() => isClickable && setStep(stepNumber as 1 | 2 | 3)}
              className={`flex items-center justify-center gap-2.5 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all ${
                isCurrent
                  ? "bg-primary text-white shadow-md shadow-primary/25"
                  : isClickable
                  ? "text-primary hover:bg-primary/10"
                  : "text-muted-foreground cursor-not-allowed opacity-50"
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
          <div className="mb-6 rounded-2xl border border-white/[0.08] bg-card/60 backdrop-blur-xl p-4 sm:p-5 shadow-lg shadow-black/20">
            <div className="flex items-center justify-between mb-3 border-b border-white/[0.06] pb-2.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Send className="h-3.5 w-3.5 text-primary" />
                POST TARGET & CHANNELS
              </span>
              <span className="text-xs text-muted-foreground">
                Current Workspace: <strong className="text-foreground font-semibold">{businessName}</strong>
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {/* Workspace selection */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-muted-foreground">Target Workspace</label>
                  {onOpenAddBusiness && (
                    <button
                      type="button"
                      onClick={onOpenAddBusiness}
                      className="text-[11px] text-primary font-semibold hover:underline flex items-center gap-1"
                      title="Create a new business workspace"
                    >
                      <Plus className="h-3 w-3 stroke-[2.5]" /> New Workspace
                    </button>
                  )}
                </div>
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
                <p className="mt-1 text-[10px] text-muted-foreground">Select which brand workspace to post from</p>
              </div>

              {/* Account Multi-Selection */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-muted-foreground">
                    Post to Accounts {connectedAccounts.length > 0 && `(${selectedAccountIds.length}/${connectedAccounts.length} selected)`}
                  </label>
                  <div className="flex items-center gap-2">
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
                    {onNavigate && (
                      <button
                        type="button"
                        onClick={() => onNavigate("Accounts")}
                        className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-1"
                        title="Connect more social accounts to this workspace"
                      >
                        <Plus className="h-3 w-3 stroke-[2.5]" /> Connect Account
                      </button>
                    )}
                  </div>
                </div>
                {connectedAccounts.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {connectedAccounts.map((acc) => {
                      const accKey = acc.id || acc.handle;
                      const isSelected = selectedAccountIds.includes(accKey);
                      return (
                        <AccountSelectItem
                          key={accKey}
                          account={acc}
                          isSelected={isSelected}
                          layout="pill"
                          onToggle={() => {
                            setSelectedAccountIds((prev) =>
                              prev.includes(accKey)
                                ? prev.filter((id) => id !== accKey)
                                : [...prev, accKey]
                            );
                          }}
                        />
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
          {/* Expandable Generation Options (Reference UI) */}
          <div className="mt-6 rounded-2xl border border-white/[0.08] bg-card/60 divide-y divide-white/[0.06] overflow-hidden backdrop-blur-md shadow-lg">
            {/* ROW 1: REFERENCE PHOTOS */}
            <div>
              <button
                type="button"
                onClick={() => setExpandedSection(expandedSection === "reference" ? null : "reference")}
                className="w-full flex items-center justify-between p-4 sm:p-4.5 hover:bg-white/[0.02] transition-colors text-left"
              >
                <div className="flex items-center gap-3.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-500/10 text-pink-400 border border-pink-500/20 shadow-xs">
                    <ImageIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-foreground">Reference photos</span>
                    <p className="text-[11px] text-muted-foreground">Upload style reference to guide AI composition & lighting</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    {referenceImageUrl ? "1 photo added" : "None"}
                  </span>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${expandedSection === "reference" ? "rotate-180" : ""}`} />
                </div>
              </button>
              {expandedSection === "reference" && (
                <div className="px-4 pb-5 pt-1 border-t border-white/[0.04] bg-white/[0.01] space-y-3.5">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />

                  {referenceImageUrl ? (
                    <div className="flex flex-col sm:flex-row items-center gap-4 rounded-xl border border-white/[0.08] bg-card/60 p-3">
                      <div className="relative h-28 w-24 rounded-lg overflow-hidden border border-white/10 shrink-0 bg-black/40">
                        <img
                          src={referenceImageUrl}
                          alt="Reference"
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="flex-1 space-y-1.5 text-center sm:text-left">
                        <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs font-semibold text-foreground">
                          <Check className="h-4 w-4 text-emerald-400" />
                          <span>Active Reference Image</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground truncate max-w-xs">
                          {referenceFileName || "Selected reference layout/photo"}
                        </p>
                        <p className="text-[10px] text-muted-foreground/80">
                          The AI will emulate the visual hierarchy, lighting, and layout of this image.
                        </p>
                        <div className="flex items-center justify-center sm:justify-start gap-2 pt-1">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs border-white/[0.1] gap-1"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            <Upload className="h-3 w-3" /> Change photo
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 gap-1"
                            onClick={() => {
                              setReferenceImageUrl("");
                              setReferenceFileName("");
                            }}
                          >
                            <X className="h-3 w-3" /> Remove
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* Dropzone */}
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="cursor-pointer flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-white/[0.15] hover:border-primary/50 bg-secondary/30 hover:bg-secondary/50 p-6 text-center transition-all group"
                      >
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-2 group-hover:scale-110 transition-transform">
                          <Upload className="h-5 w-5" />
                        </div>
                        <span className="text-xs font-semibold text-foreground">
                          Click to upload reference photo
                        </span>
                        <span className="text-[11px] text-muted-foreground mt-0.5">
                          PNG, JPG, WebP up to 10MB
                        </span>
                      </div>

                      {/* URL input option */}
                      <div className="flex gap-2">
                        <Input
                          placeholder="Or paste reference image URL (https://...)"
                          value={urlInputVal}
                          onChange={(e) => setUrlInputVal(e.target.value)}
                          className="h-9 text-xs bg-secondary/40 border-white/[0.08]"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-9 text-xs border-white/[0.1] shrink-0"
                          onClick={() => {
                            if (urlInputVal.trim().startsWith("http")) {
                              setReferenceImageUrl(urlInputVal.trim());
                              setReferenceFileName("External URL");
                              setUrlInputVal("");
                              toast.success("Reference photo URL applied");
                            } else {
                              toast.error("Please enter a valid HTTP/HTTPS image URL");
                            }
                          }}
                        >
                          Apply URL
                        </Button>
                      </div>

                      {/* Presets */}
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
                          Or try sample reference styles:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {[
                            { name: "SaaS Tech Mockup", url: "/showcase/tech_software_showcase.jpg" },
                            { name: "Artisanal Café", url: "/showcase/cafe_offer_showcase.jpg" },
                            { name: "Cricket Championship", url: "/showcase/cricket_direction_1.jpg" },
                            { name: "Festive Red Retail", url: "/showcase/pizza_offer_showcase.jpg" },
                          ].map((preset) => (
                            <button
                              key={preset.name}
                              type="button"
                              onClick={() => {
                                setReferenceImageUrl(preset.url);
                                setReferenceFileName(preset.name);
                                toast.success(`Applied reference style: ${preset.name}`);
                              }}
                              className="rounded-lg border border-white/[0.08] bg-card/60 px-2.5 py-1 text-[11px] text-muted-foreground hover:bg-primary/10 hover:border-primary/30 hover:text-primary transition-colors flex items-center gap-1"
                            >
                              <Sparkles className="h-2.5 w-2.5" />
                              {preset.name}
                            </button>
                          ))}
                        </div>
                      </div>

                      <p className="text-[11px] text-muted-foreground/80 leading-relaxed">
                        The reference photo guides the AI on composition balance, lighting mood, color palette, and layout aesthetic.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ROW: SHAPE & SIZE (3 Core Sizes: 1:1, 4:5, 9:16) */}
            <div>
              <button
                type="button"
                onClick={() => setExpandedSection(expandedSection === "shape" ? null : "shape")}
                className="w-full flex items-center justify-between p-4 sm:p-4.5 hover:bg-white/[0.02] transition-colors text-left"
              >
                <div className="flex items-center gap-3.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20 shadow-xs">
                    <LayoutGrid className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-foreground">Shape</span>
                    <p className="text-[11px] text-muted-foreground">Select canvas aspect ratio (1:1, 4:5, 9:16)</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    {shape} · {ASPECT_RATIOS.find((r) => r.ratio === shape)?.name || "Portrait"}
                  </span>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${expandedSection === "shape" ? "rotate-180" : ""}`} />
                </div>
              </button>
              {expandedSection === "shape" && (
                <div className="px-4 pb-5 pt-1 border-t border-white/[0.04] bg-white/[0.01]">
                  <div className="grid grid-cols-3 gap-3">
                    {ASPECT_RATIOS.map((item) => {
                      const isSelected = shape === item.ratio;
                      return (
                        <button
                          key={item.ratio}
                          type="button"
                          onClick={() => setShape(item.ratio)}
                          className={`flex flex-col items-center justify-between p-3 rounded-2xl border transition-all text-center ${
                            isSelected
                              ? "border-[#FF5722] bg-[#FF5722]/10 ring-1 ring-[#FF5722]/40 text-[#FF5722] shadow-sm"
                              : "border-white/[0.08] bg-card/40 text-muted-foreground hover:border-white/20 hover:text-foreground hover:bg-card"
                          }`}
                        >
                          <div className="flex h-12 w-full items-center justify-center mb-1.5">
                            <div
                              className={`${item.boxW} ${item.boxH} rounded-[3px] border-2 transition-all ${
                                isSelected
                                  ? "border-[#FF5722] bg-[#FF5722]/20"
                                  : "border-muted-foreground/35 bg-muted/20"
                              }`}
                            />
                          </div>
                          <span className={`text-xs font-bold ${isSelected ? "text-[#FF5722]" : "text-foreground/90"}`}>
                            {item.label} · {item.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <p className="mt-3.5 text-xs text-muted-foreground/90">
                    {ASPECT_RATIOS.find((r) => r.ratio === shape)?.bestFor || "Recommended canvas aspect ratio."}
                  </p>
                </div>
              )}
            </div>

            {/* ROW 2: SIZE */}
            <div>
              <button
                type="button"
                onClick={() => setExpandedSection(expandedSection === "size" ? null : "size")}
                className="w-full flex items-center justify-between p-4 sm:p-4.5 hover:bg-white/[0.02] transition-colors text-left"
              >
                <div className="flex items-center gap-3.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20 shadow-xs">
                    <Monitor className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-foreground">Size</span>
                    <p className="text-[11px] text-muted-foreground">Output resolution and dimensions</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground">{size || "1K"}</span>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${expandedSection === "size" ? "rotate-180" : ""}`} />
                </div>
              </button>
              {expandedSection === "size" && (
                <div className="px-4 pb-5 pt-1 border-t border-white/[0.04] bg-white/[0.01] space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {["1K", "2K", "Standard (1024x1280)", "HD (1080x1350)"].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setSize(s)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                          size === s
                            ? "border-primary bg-primary text-white shadow-xs"
                            : "border-white/[0.08] bg-card text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                      Custom size / resolution text option
                    </label>
                    <Input
                      value={size}
                      onChange={(e) => setSize(e.target.value)}
                      placeholder="e.g. 1K or 1024x1280"
                      className="h-9 text-xs bg-secondary/40 border-white/[0.08]"
                    />
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      Standard 1K generates crisp web-ready images; 2K provides ultra-high resolution printing detail.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* ROW 3: WORDS ON THE IMAGE */}
            <div>
              <button
                type="button"
                onClick={() => setExpandedSection(expandedSection === "words" ? null : "words")}
                className="w-full flex items-center justify-between p-4 sm:p-4.5 hover:bg-white/[0.02] transition-colors text-left"
              >
                <div className="flex items-center gap-3.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-xs">
                    <PenTool className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-foreground">Words on the image</span>
                    <p className="text-[11px] text-muted-foreground">Custom headline and text to print</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    {wordsOnImage.trim() ? "Custom text" : "None"}
                  </span>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${expandedSection === "words" ? "rotate-180" : ""}`} />
                </div>
              </button>
              {expandedSection === "words" && (
                <div className="px-4 pb-5 pt-1 border-t border-white/[0.04] bg-white/[0.01] space-y-2">
                  <Textarea
                    value={wordsOnImage}
                    onChange={(e) => setWordsOnImage(e.target.value)}
                    placeholder="The words to print, exactly as you want them&#10;e.g. Avero.innovations is now Aurelian International&#10;Continuing our commitment to software innovation.&#10;⚡ Discover our software solutions."
                    className="min-h-[100px] text-sm resize-y rounded-xl border-white/[0.08] bg-secondary/50 placeholder:text-muted-foreground/50"
                  />
                  <p className="text-xs text-muted-foreground">
                    Printed exactly as you type, one line per line. Leave it empty and AI adds one short line.
                  </p>
                </div>
              )}
            </div>

            {/* ROW 4: BRAND KIT */}
            <div>
              <button
                type="button"
                onClick={() => setExpandedSection(expandedSection === "brand" ? null : "brand")}
                className="w-full flex items-center justify-between p-4 sm:p-4.5 hover:bg-white/[0.02] transition-colors text-left"
              >
                <div className="flex items-center gap-3.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20 shadow-xs">
                    <Palette className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-foreground">Brand kit</span>
                    <p className="text-[11px] text-muted-foreground">Choose which brand details to include</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground">{useBrand ? "On" : "Off"}</span>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${expandedSection === "brand" ? "rotate-180" : ""}`} />
                </div>
              </button>
              {expandedSection === "brand" && (
                <div className="px-4 pb-5 pt-1 border-t border-white/[0.04] bg-white/[0.01] space-y-4">
                  <div className="flex items-center justify-between py-1">
                    <div>
                      <span className="text-xs font-semibold text-foreground block">Enable Brand Kit details</span>
                      <span className="text-[11px] text-muted-foreground">Automatically inject selected business items</span>
                    </div>
                    <Switch checked={useBrand} onCheckedChange={setUseBrand} />
                  </div>

                  {useBrand && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      {/* Logo */}
                      <label className="flex items-start gap-3 p-3 rounded-xl border border-white/[0.06] bg-card/40 hover:bg-card/70 cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          checked={tickedBrandDetails.logo}
                          onChange={(e) => setTickedBrandDetails((p) => ({ ...p, logo: e.target.checked }))}
                          className="mt-0.5 rounded border-white/20 text-primary focus:ring-primary/25 h-4 w-4 accent-primary"
                        />
                        <div className="min-w-0">
                          <span className="text-xs font-semibold text-foreground block">Logo</span>
                          {brandKit.logoUrl ? (
                            <div className="mt-1 flex items-center gap-2">
                              <img src={brandKit.logoUrl} alt="Logo" className="h-6 w-6 rounded-md object-contain bg-white p-0.5" />
                              <span className="text-[11px] text-muted-foreground truncate">{brandKit.logoName || "Brand Mark"}</span>
                            </div>
                          ) : (
                            <span className="text-[11px] text-muted-foreground">Not in your brand kit</span>
                          )}
                        </div>
                      </label>

                      {/* Colours */}
                      <label className="flex items-start gap-3 p-3 rounded-xl border border-white/[0.06] bg-card/40 hover:bg-card/70 cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          checked={tickedBrandDetails.colors}
                          onChange={(e) => setTickedBrandDetails((p) => ({ ...p, colors: e.target.checked }))}
                          className="mt-0.5 rounded border-white/20 text-primary focus:ring-primary/25 h-4 w-4 accent-primary"
                        />
                        <div className="min-w-0">
                          <span className="text-xs font-semibold text-foreground block">Colours</span>
                          {brandKit.colors && brandKit.colors.length > 0 ? (
                            <div className="mt-1 flex items-center gap-1.5">
                              {brandKit.colors.slice(0, 3).map((c) => (
                                <span key={c} className="h-3.5 w-3.5 rounded-full border border-white/20" style={{ backgroundColor: c.toLowerCase() === "tomato" ? "#B91C1C" : c.toLowerCase() === "olive" ? "#365314" : c.toLowerCase() === "mustard" ? "#78350F" : "#028090" }} />
                              ))}
                              <span className="text-[11px] text-muted-foreground ml-1">{brandKit.colors.join(", ")}</span>
                            </div>
                          ) : (
                            <span className="text-[11px] text-muted-foreground">Not in your brand kit</span>
                          )}
                        </div>
                      </label>

                      {/* Phone */}
                      <label className="flex items-start gap-3 p-3 rounded-xl border border-white/[0.06] bg-card/40 hover:bg-card/70 cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          checked={tickedBrandDetails.phone}
                          onChange={(e) => setTickedBrandDetails((p) => ({ ...p, phone: e.target.checked }))}
                          className="mt-0.5 rounded border-white/20 text-primary focus:ring-primary/25 h-4 w-4 accent-primary"
                        />
                        <div className="min-w-0">
                          <span className="text-xs font-semibold text-foreground block">Phone</span>
                          <span className="text-[11px] text-muted-foreground truncate block">
                            {brandKit.phone || "Not in your brand kit"}
                          </span>
                        </div>
                      </label>

                      {/* Location */}
                      <label className="flex items-start gap-3 p-3 rounded-xl border border-white/[0.06] bg-card/40 hover:bg-card/70 cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          checked={tickedBrandDetails.location}
                          onChange={(e) => setTickedBrandDetails((p) => ({ ...p, location: e.target.checked }))}
                          className="mt-0.5 rounded border-white/20 text-primary focus:ring-primary/25 h-4 w-4 accent-primary"
                        />
                        <div className="min-w-0">
                          <span className="text-xs font-semibold text-foreground block">Location</span>
                          <span className="text-[11px] text-muted-foreground truncate block">
                            {brandKit.location || "Not in your brand kit"}
                          </span>
                        </div>
                      </label>

                      {/* Website */}
                      <label className="flex items-start gap-3 p-3 rounded-xl border border-white/[0.06] bg-card/40 hover:bg-card/70 cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          checked={tickedBrandDetails.website}
                          onChange={(e) => setTickedBrandDetails((p) => ({ ...p, website: e.target.checked }))}
                          className="mt-0.5 rounded border-white/20 text-primary focus:ring-primary/25 h-4 w-4 accent-primary"
                        />
                        <div className="min-w-0">
                          <span className="text-xs font-semibold text-foreground block">Website</span>
                          <span className="text-[11px] text-muted-foreground truncate block">
                            {brandKit.website || "Not in your brand kit"}
                          </span>
                        </div>
                      </label>

                      {/* Email */}
                      <label className="flex items-start gap-3 p-3 rounded-xl border border-white/[0.06] bg-card/40 hover:bg-card/70 cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          checked={tickedBrandDetails.email}
                          onChange={(e) => setTickedBrandDetails((p) => ({ ...p, email: e.target.checked }))}
                          className="mt-0.5 rounded border-white/20 text-primary focus:ring-primary/25 h-4 w-4 accent-primary"
                        />
                        <div className="min-w-0">
                          <span className="text-xs font-semibold text-foreground block">Email</span>
                          <span className="text-[11px] text-muted-foreground truncate block">
                            {brandKit.email || "Not in your brand kit"}
                          </span>
                        </div>
                      </label>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-white/[0.04]">
                    <span>Ticked details are added to the image.</span>
                    <button
                      type="button"
                      onClick={() => onNavigate("Brand kit")}
                      className="text-primary font-semibold hover:underline"
                    >
                      Edit brand kit
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-7 flex flex-col items-center justify-center gap-2 border-t border-white/[0.08] pt-5">
            <Button
              className="h-12 w-full max-w-md rounded-2xl font-bold gap-2.5 shadow-xl shadow-primary/25 hover:shadow-primary/40 bg-gradient-to-r from-primary to-primary/85 text-white text-sm"
              onClick={startGeneration}
            >
              <Sparkles className="h-4 w-4" />
              Generate
              <span className="ml-1 rounded-lg bg-black/30 px-2 py-0.5 text-xs font-semibold text-white/90">
                3 credits
              </span>
            </Button>
            <span className="text-xs text-muted-foreground">
              Charged only if it works • about 30 seconds
            </span>
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
        location={postLocation}
        brandKitLocation={brandKit.location}
        onLocationChange={setPostLocation}
        suggestions={suggestions}
        suggesting={suggesting}
        ownCaption={ownCaption}
        platforms={platforms}
        timing={timing}
        scheduledDate={scheduledDate}
        scheduledTime={scheduledTime}
        scheduledCount={scheduledCount}
        onCaption={setCaption}
        onToggleOwnCaption={setOwnCaption}
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
  const [enlargeImage, setEnlargeImage] = useState<{ url: string; title: string; format?: string } | null>(null);
  const [lightboxTab, setLightboxTab] = useState<"poster" | "instagram" | "facebook">("poster");
  const [feedPreviewMode, setFeedPreviewMode] = useState<"poster" | "instagram" | "facebook">("poster");
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
        format: (currentOpt.format || format) as any,
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
                <div className="relative">
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
                  />
                  {item.imageUrl && (
                    <button
                      type="button"
                      className="absolute bottom-2 right-2 z-30 h-7 w-7 rounded-lg bg-black/80 hover:bg-black text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md border border-white/20"
                      title="Click to view full size"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEnlargeImage({
                          url: item.imageUrl!,
                          title: item.headline || `Direction ${index + 1}`,
                          format: item.format || format,
                        });
                      }}
                    >
                      <ZoomIn className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <div className="mt-2.5 flex items-center justify-between">
                  <span className="block text-[11px] text-muted-foreground font-semibold">Direction {index + 1}</span>
                  {selected === index && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-primary">
                      <Sparkles className="h-3 w-3" /> Selected
                    </span>
                  )}
                </div>
                {item.prize_text && (
                  <div className="mt-1 flex items-center gap-1 text-[10px] font-semibold text-amber-400">
                    <span>{item.prize_text}</span>
                  </div>
                )}
                {item.time_text && (
                  <div className="mt-0.5 flex items-center gap-1 text-[10px] text-muted-foreground">
                    <span>⏰ {item.time_text}</span>
                  </div>
                )}
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
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">YOUR PICK</p>
            <div className="flex items-center gap-1.5">
              {option.imageUrl && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-[11px] gap-1 rounded-lg text-primary border-primary/30 hover:bg-primary/10 font-semibold"
                    onClick={() => {
                      setLightboxTab("instagram");
                      setEnlargeImage({
                        url: option.imageUrl!,
                        title: headline || option.headline || "Your Pick",
                        format: option.format || format,
                      });
                    }}
                  >
                    <Eye className="h-3.5 w-3.5 text-pink-400" />
                    <span>Feed Preview</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-[11px] gap-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/60 font-medium"
                    onClick={() => {
                      setLightboxTab("poster");
                      setEnlargeImage({
                        url: option.imageUrl!,
                        title: headline || option.headline || "Your Pick",
                        format: option.format || format,
                      });
                    }}
                  >
                    <ZoomIn className="h-3.5 w-3.5" /> Enlarge
                  </Button>
                </>
              )}
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-[11px] gap-1 rounded-lg text-primary border-primary/30 hover:bg-primary/10 font-semibold"
                onClick={focusAiEdit}
              >
                <Sparkles className="h-3 w-3" /> Edit with AI
              </Button>
            </div>
          </div>

          {/* Quick Preview Toggle (Poster | Instagram | Facebook) */}
          {option.imageUrl && (
            <div className="mb-3 flex items-center justify-center gap-1 rounded-xl border border-white/[0.08] bg-card/60 p-1 text-xs">
              <button
                type="button"
                onClick={() => setFeedPreviewMode("poster")}
                className={`flex-1 rounded-lg py-1 px-2 text-[11px] font-semibold transition-all ${
                  feedPreviewMode === "poster"
                    ? "bg-secondary text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Poster
              </button>
              <button
                type="button"
                onClick={() => setFeedPreviewMode("instagram")}
                className={`flex-1 rounded-lg py-1 px-2 text-[11px] font-semibold flex items-center justify-center gap-1 transition-all ${
                  feedPreviewMode === "instagram"
                    ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Instagram className="h-3 w-3" /> Instagram
              </button>
              <button
                type="button"
                onClick={() => setFeedPreviewMode("facebook")}
                className={`flex-1 rounded-lg py-1 px-2 text-[11px] font-semibold flex items-center justify-center gap-1 transition-all ${
                  feedPreviewMode === "facebook"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <span className="font-bold text-[10px]">f</span> Facebook
              </button>
            </div>
          )}

          <div
            className={`mx-auto max-w-[320px] rounded-2xl border border-white/[0.08] bg-card/75 p-3.5 shadow-2xl backdrop-blur-xl relative group ${
              option.imageUrl ? "cursor-zoom-in" : ""
            }`}
            onClick={() => {
              if (option.imageUrl) {
                setLightboxTab(feedPreviewMode);
                setEnlargeImage({
                  url: option.imageUrl,
                  title: headline || option.headline || "Your Pick",
                  format: option.format || format,
                });
              }
            }}
          >
            {feedPreviewMode === "poster" ? (
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
              />
            ) : (
              <SocialFeedPreview
                platform={feedPreviewMode === "instagram" ? "Instagram" : "Facebook"}
                imageUrl={option.imageUrl || ""}
                businessName={businessName}
                headline={headline}
                caption={option.footer}
                logoUrl={logoUrl}
                format={option.format || format}
                showPlatformToggle={false}
              />
            )}

            {option.imageUrl && (
              <div className="absolute top-5 right-5 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="flex items-center gap-1 rounded-lg bg-black/85 px-2.5 py-1 text-[10px] font-semibold text-white shadow-xl border border-white/20 backdrop-blur-xs">
                  <ZoomIn className="h-3 w-3 text-primary" /> Click to enlarge
                </span>
              </div>
            )}

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
            <Button
              variant="outline"
              className="flex-1 h-11 rounded-xl font-medium gap-1.5 border-white/[0.1] hover:bg-white/[0.05]"
              onClick={onRegenerate}
              disabled={loading}
              title="Generate new poster variations"
            >
              <Sparkles className="h-4 w-4 text-primary" />
              Try new ideas
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

      {/* Full-Screen Image Lightbox Modal with Feed Preview Option */}
      <Dialog open={Boolean(enlargeImage)} onOpenChange={(open) => !open && setEnlargeImage(null)}>
        <DialogContent className="sm:max-w-3xl p-3 sm:p-5 bg-card/95 backdrop-blur-2xl border-white/10 rounded-3xl overflow-hidden shadow-2xl">
          <DialogHeader className="flex flex-row items-center justify-between pb-3 border-b border-white/5">
            <div>
              <DialogTitle className="font-display text-lg text-foreground truncate max-w-lg">
                {enlargeImage?.title || "Poster Preview"}
              </DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {lightboxTab === "poster"
                  ? `Full-resolution view · ${enlargeImage?.format || "High Definition"}`
                  : lightboxTab === "instagram"
                  ? "Live Instagram Feed Mockup Preview"
                  : "Live Facebook Feed Mockup Preview"}
              </p>
            </div>
            {/* View Selector Tabs */}
            <div className="flex items-center gap-1 rounded-xl border border-white/[0.08] bg-black/40 p-1">
              <button
                type="button"
                onClick={() => setLightboxTab("poster")}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                  lightboxTab === "poster"
                    ? "bg-secondary text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Poster
              </button>
              <button
                type="button"
                onClick={() => setLightboxTab("instagram")}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold flex items-center gap-1 transition-all ${
                  lightboxTab === "instagram"
                    ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Instagram className="h-3 w-3" /> Instagram
              </button>
              <button
                type="button"
                onClick={() => setLightboxTab("facebook")}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold flex items-center gap-1 transition-all ${
                  lightboxTab === "facebook"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <span className="font-bold text-[10px]">f</span> Facebook
              </button>
            </div>
          </DialogHeader>

          <div className="relative flex items-center justify-center rounded-2xl overflow-y-auto bg-black/50 border border-white/5 max-h-[75vh] p-4 mt-2">
            {enlargeImage?.url && (
              lightboxTab === "poster" ? (
                <img
                  src={enlargeImage.url}
                  alt={enlargeImage.title || "Full size poster"}
                  className="max-h-[70vh] w-auto max-w-full object-contain rounded-xl shadow-2xl"
                />
              ) : (
                <SocialFeedPreview
                  platform={lightboxTab === "instagram" ? "Instagram" : "Facebook"}
                  imageUrl={enlargeImage.url}
                  businessName={businessName}
                  headline={enlargeImage.title}
                  caption={option.footer}
                  logoUrl={logoUrl}
                  format={option.format || format}
                  showPlatformToggle={false}
                />
              )
            )}
          </div>
          <div className="flex items-center justify-between gap-3 pt-3 border-t border-white/5 mt-1">
            <span className="text-[11px] text-muted-foreground">
              Click anywhere outside or press Esc to close
            </span>
            {enlargeImage?.url && (
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs gap-1.5 rounded-xl border-white/10 hover:bg-secondary/60"
                onClick={() => {
                  const a = document.createElement("a");
                  a.href = enlargeImage.url;
                  a.target = "_blank";
                  a.rel = "noopener noreferrer";
                  a.download = "poster-full-size.png";
                  a.click();
                }}
              >
                <ArrowDownToLine className="h-3.5 w-3.5" /> Download original
              </Button>
            )}
          </div>
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
  location: postLocation = "",
  brandKitLocation = "",
  onLocationChange,
  suggestions,
  suggesting,
  ownCaption,
  platforms,
  timing,
  scheduledDate,
  scheduledTime,
  scheduledCount = 0,
  onCaption,
  onToggleOwnCaption,
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
  location?: string | undefined;
  brandKitLocation?: string | undefined;
  onLocationChange?: ((value: string) => void) | undefined;
  suggestions: string[];
  suggesting: boolean;
  ownCaption: boolean;
  platforms: Platform[];
  timing: "now" | "schedule";
  scheduledDate: string;
  scheduledTime: string;
  scheduledCount?: number;
  onCaption: (value: string) => void;
  onToggleOwnCaption?: (value: boolean) => void;
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
  const [previewZoomOpen, setPreviewZoomOpen] = useState(false);
  const [publishPreviewMode, setPublishPreviewMode] = useState<"poster" | "instagram" | "facebook">("instagram");
  const [zoomLightboxTab, setZoomLightboxTab] = useState<"poster" | "instagram" | "facebook">("instagram");

  const quickHashtags = useMemo(() => {
    const bizClean = businessName.replace(/[^a-zA-Z0-9]/g, "");
    const tags = [
      bizClean ? `#${bizClean}` : "#BrandStory",
      "#TrendingNow",
      "#SpecialOffer",
      "#NewDrop",
      "#Exclusive",
      "#SocialMedia",
    ];
    return tags;
  }, [businessName]);

  const insertHashtag = (tag: string) => {
    const formatted = tag.startsWith("#") ? tag : `#${tag}`;
    if (!caption.includes(formatted)) {
      onCaption(caption ? `${caption.trim()} ${formatted}` : formatted);
    }
  };

  // Dynamic Geo Hashtag & Location Engine
  const geoCountries = useMemo(() => getGeoCountries(), []);

  const [geoCountry, setGeoCountry] = useState(() => {
    const locLower = (postLocation || brandKitLocation || "").toLowerCase();
    if (locLower.includes("us") || locLower.includes("york") || locLower.includes("america") || locLower.includes("california")) return "usa";
    if (locLower.includes("uk") || locLower.includes("london") || locLower.includes("england")) return "uk";
    if (locLower.includes("dubai") || locLower.includes("uae") || locLower.includes("abu dhabi")) return "uae";
    if (locLower.includes("canada") || locLower.includes("toronto")) return "canada";
    if (locLower.includes("australia") || locLower.includes("sydney")) return "australia";
    return "india";
  });

  const availableStates = useMemo(() => getGeoStates(geoCountry), [geoCountry]);
  const [geoState, setGeoState] = useState<string>("all");
  const [citySearchFilter, setCitySearchFilter] = useState<string>("");

  // Live Cities via CountriesNow third-party API
  const [liveCities, setLiveCities] = useState<GeoCity[] | null>(null);
  const [loadingLiveCities, setLoadingLiveCities] = useState<boolean>(false);

  // Live Global Geocoding & Autocomplete via OpenStreetMap Nominatim & Zippopotam
  const [liveLocationSearchResults, setLiveLocationSearchResults] = useState<GeoLocationItem[]>([]);
  const [isSearchingLive, setIsSearchingLive] = useState<boolean>(false);

  // Fetch live cities from CountriesNow when a specific state is chosen
  useEffect(() => {
    if (geoState === "all") {
      setLiveCities(null);
      return;
    }
    const currentCountryObj = geoCountries.find((c) => c.id === geoCountry);
    const countryName = currentCountryObj?.name || geoCountry;
    const currentStateObj = availableStates.find((s) => s.code === geoState || s.id === geoState);
    const stateName = currentStateObj?.name || geoState;

    let active = true;
    setLoadingLiveCities(true);
    fetchLiveCitiesByState(countryName, stateName)
      .then((cities) => {
        if (active && cities && cities.length > 0) {
          setLiveCities(cities);
        }
      })
      .catch(() => {
        // Handled silently by fallback
      })
      .finally(() => {
        if (active) setLoadingLiveCities(false);
      });

    return () => {
      active = false;
    };
  }, [geoCountry, geoState, geoCountries, availableStates]);

  // Live location search debounce effect (OpenStreetMap Nominatim & Zippopotam)
  useEffect(() => {
    const query = citySearchFilter.trim();
    if (query.length < 2) {
      setLiveLocationSearchResults([]);
      setIsSearchingLive(false);
      return;
    }

    const currentCountryObj = geoCountries.find((c) => c.id === geoCountry);
    const timer = setTimeout(() => {
      setIsSearchingLive(true);
      searchLocationsLive(query, { countryCode: currentCountryObj?.code })
        .then((items) => {
          setLiveLocationSearchResults(items);
        })
        .catch(() => {
          setLiveLocationSearchResults([]);
        })
        .finally(() => {
          setIsSearchingLive(false);
        });
    }, 350);

    return () => clearTimeout(timer);
  }, [citySearchFilter, geoCountry, geoCountries]);

  const availableCities = useMemo(() => {
    let cities = liveCities || getGeoCities(geoCountry, geoState === "all" ? undefined : geoState);
    if (citySearchFilter.trim()) {
      const q = citySearchFilter.trim().toLowerCase();
      cities = cities.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.stateOrRegion && c.stateOrRegion.toLowerCase().includes(q)) ||
          (c.stateCode && c.stateCode.toLowerCase().includes(q)) ||
          c.areas.some((a) => a.name.toLowerCase().includes(q) || a.postalCode.includes(q))
      );
    }
    return cities;
  }, [geoCountry, geoState, citySearchFilter, liveCities]);

  const [geoCity, setGeoCity] = useState(() => {
    const locLower = (postLocation || brandKitLocation || "").toLowerCase();
    if (locLower.includes("mumbai")) return "mumbai";
    if (locLower.includes("bangalore") || locLower.includes("bengaluru")) return "bengaluru";
    if (locLower.includes("delhi")) return "delhi";
    if (locLower.includes("pune")) return "pune";
    if (locLower.includes("hyderabad")) return "hyderabad";
    if (locLower.includes("york") || locLower.includes("nyc")) return "new-york";
    if (locLower.includes("los angeles") || locLower.includes("la")) return "los-angeles";
    if (locLower.includes("francisco") || locLower.includes("sf")) return "san-francisco";
    return availableCities[0]?.id || "ahmedabad";
  });

  // Keep city valid when country changes
  useEffect(() => {
    if (availableCities.length > 0 && !availableCities.some((c) => c.id === geoCity)) {
      setGeoCity(availableCities[0]?.id || "");
    }
  }, [availableCities, geoCity]);

  const availableAreas = useMemo(() => getGeoAreas(geoCountry, geoCity), [geoCountry, geoCity]);
  const [geoArea, setGeoArea] = useState("");

  const selectedAreaObj = useMemo(() => {
    return availableAreas.find((a) => a.id === geoArea);
  }, [availableAreas, geoArea]);

  const selectedCityObj = useMemo(() => {
    return availableCities.find((c) => c.id === geoCity);
  }, [availableCities, geoCity]);

  const suggestedGeoHashtags = useMemo(() => {
    return generateLocationHashtags({
      countryId: geoCountry,
      stateCode: geoState !== "all" ? geoState : undefined,
      cityId: geoCity,
      areaId: geoArea || undefined,
      customLocation: postLocation,
    });
  }, [geoCountry, geoState, geoCity, geoArea, postLocation]);

  const [selectedGeoTags, setSelectedGeoTags] = useState<string[]>([]);

  useEffect(() => {
    if (suggestedGeoHashtags.length > 0) {
      setSelectedGeoTags(suggestedGeoHashtags.slice(0, 6));
    } else {
      setSelectedGeoTags([]);
    }
  }, [suggestedGeoHashtags]);

  const isAllGeoSelected = selectedGeoTags.length > 0 && selectedGeoTags.length === suggestedGeoHashtags.length;

  const handleToggleSelectAllHashtags = () => {
    if (isAllGeoSelected) {
      setSelectedGeoTags([]);
    } else {
      setSelectedGeoTags([...suggestedGeoHashtags]);
    }
  };

  const handleToggleGeoTag = (tag: string) => {
    setSelectedGeoTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleAddSelectedToCaption = () => {
    if (selectedGeoTags.length === 0) return;
    let nextCaption = caption ? caption.trim() : "";
    for (const tag of selectedGeoTags) {
      if (!nextCaption.toLowerCase().includes(tag.toLowerCase())) {
        nextCaption = nextCaption ? `${nextCaption} ${tag}` : tag;
      }
    }
    onCaption(nextCaption);
  };

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(250px,0.85fr)_minmax(380px,1.15fr)]">
      <section className="lg:sticky lg:top-24 lg:self-start">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">LIVE FEED PREVIEW</p>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-[11px] gap-1 rounded-lg text-primary hover:bg-primary/10 font-semibold"
            onClick={() => setPreviewZoomOpen(true)}
          >
            <Maximize2 className="h-3 w-3" /> Full size
          </Button>
        </div>

        {/* View Mode Toggle */}
        <div className="mb-3.5 flex items-center justify-center gap-1 rounded-xl border border-white/[0.08] bg-card/60 p-1 text-xs">
          <button
            type="button"
            onClick={() => setPublishPreviewMode("instagram")}
            className={`flex-1 rounded-lg py-1 px-2 text-[11px] font-semibold flex items-center justify-center gap-1 transition-all ${
              publishPreviewMode === "instagram"
                ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Instagram className="h-3 w-3" /> Instagram
          </button>
          <button
            type="button"
            onClick={() => setPublishPreviewMode("facebook")}
            className={`flex-1 rounded-lg py-1 px-2 text-[11px] font-semibold flex items-center justify-center gap-1 transition-all ${
              publishPreviewMode === "facebook"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span className="font-bold text-[10px]">f</span> Facebook
          </button>
          <button
            type="button"
            onClick={() => setPublishPreviewMode("poster")}
            className={`flex-1 rounded-lg py-1 px-2 text-[11px] font-semibold transition-all ${
              publishPreviewMode === "poster"
                ? "bg-secondary text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Poster
          </button>
        </div>

        <div className="mx-auto max-w-[340px]">
          {publishPreviewMode === "poster" ? (
            <div className="rounded-2xl border border-white/[0.08] bg-card/85 p-4 shadow-2xl backdrop-blur-xl">
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

              <div
                className={`relative rounded-xl overflow-hidden border border-white/10 ${
                  option?.imageUrl ? "cursor-zoom-in group" : ""
                }`}
                onClick={() => {
                  if (option?.imageUrl) setPreviewZoomOpen(true);
                }}
              >
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
              </div>

              <p className="mt-3.5 line-clamp-3 text-xs leading-5 text-foreground/90">
                <span className="font-semibold text-foreground">{displayHandle} </span>
                {caption || "Your caption will show up here."}
              </p>
            </div>
          ) : (
            <div
              className="cursor-pointer"
              onClick={() => {
                if (option?.imageUrl) {
                  setZoomLightboxTab(publishPreviewMode);
                  setPreviewZoomOpen(true);
                }
              }}
            >
              <SocialFeedPreview
                platform={publishPreviewMode === "instagram" ? "Instagram" : "Facebook"}
                imageUrl={option?.imageUrl || ""}
                businessName={businessName}
                handle={displayHandle}
                location={postLocation}
                headline={headline}
                caption={caption}
                logoUrl={logoUrl}
                format={option?.format}
                showPlatformToggle={false}
              />
            </div>
          )}
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
            onClick={() => {
              if (onToggleOwnCaption) onToggleOwnCaption(true);
            }}
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
            onClick={() => {
              if (onToggleOwnCaption) onToggleOwnCaption(false);
              onSuggest();
            }}
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
              placeholder="A good caption that shares what's new and engages your followers… You can type hashtags directly using #hashtags"
              value={caption}
              onChange={(event) => onCaption(event.target.value)}
            />
            <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] text-muted-foreground font-semibold flex items-center gap-1">
                  <Hash className="h-3 w-3 text-primary" /> Click to add tag:
                </span>
                {quickHashtags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => insertHashtag(tag)}
                    className="px-2 py-0.5 rounded-md text-[11px] bg-secondary/70 hover:bg-primary/20 hover:text-primary text-muted-foreground border border-white/5 transition-colors"
                  >
                    {tag}
                  </button>
                ))}
              </div>
              <div className="text-right text-[11px] font-mono text-muted-foreground">{caption.length} / 2,200</div>
            </div>
          </>
        ) : (
          <div className="mt-4 space-y-3">
            {suggesting ? (
              <div className="flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-secondary/30 p-6 text-sm text-muted-foreground">
                <LoaderCircle className="h-5 w-5 animate-spin text-primary" /> Finding the right words…
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  {suggestions.map((item, index) => {
                    const isSelected = caption === item || (caption && item.startsWith(caption.slice(0, 30)));
                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => onChooseSuggestion(item)}
                        className={`w-full rounded-xl border p-3.5 text-left text-xs leading-5 transition-all ${
                          isSelected
                            ? "border-primary bg-primary/10 shadow-xs ring-1 ring-primary/40 font-medium text-foreground"
                            : "border-white/[0.08] bg-secondary/30 hover:border-primary/40 text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="block text-[10px] font-bold uppercase tracking-wider text-primary">Option {index + 1}</span>
                          {isSelected && (
                            <span className="text-[10px] font-bold text-primary flex items-center gap-1">
                              <Check className="h-3 w-3" /> Selected
                            </span>
                          )}
                        </div>
                        {item}
                      </button>
                    );
                  })}
                </div>

                {/* Direct Editing of the Selected Suggested Caption */}
                {caption && (
                  <div className="mt-3 rounded-2xl border border-primary/25 bg-secondary/40 p-4 space-y-2.5 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                        <Edit3 className="h-3.5 w-3.5" />
                        <span>Edit your chosen caption:</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-[11px] text-muted-foreground hover:text-foreground"
                        onClick={() => {
                          if (onToggleOwnCaption) onToggleOwnCaption(true);
                        }}
                      >
                        Switch to full manual editor →
                      </Button>
                    </div>
                    <Textarea
                      className="min-h-24 resize-y text-xs leading-5 rounded-xl border-white/10 bg-background/80 p-3 focus:bg-background"
                      value={caption}
                      maxLength={2200}
                      onChange={(e) => onCaption(e.target.value)}
                      placeholder="Make minor adjustments, add custom words or hashtags..."
                    />
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[11px] text-muted-foreground font-semibold flex items-center gap-1">
                          <Hash className="h-3 w-3 text-primary" /> Add tag:
                        </span>
                        {quickHashtags.map((tag) => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => insertHashtag(tag)}
                            className="px-2 py-0.5 rounded-md text-[11px] bg-secondary/70 hover:bg-primary/20 hover:text-primary text-muted-foreground border border-white/5 transition-colors"
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                      <div className="text-[10px] font-mono text-muted-foreground">{caption.length} / 2,200</div>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-1">
                  <Button variant="ghost" size="sm" className="h-8 px-2 text-xs text-primary font-semibold hover:bg-primary/10" onClick={onSuggest}>
                    <Sparkles className="h-3.5 w-3.5 mr-1" /> Regenerate suggestions
                  </Button>
                  <Button
                    type="button"
                    variant="link"
                    className="h-8 text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => {
                      if (onToggleOwnCaption) onToggleOwnCaption(true);
                    }}
                  >
                    Want full manual control? Write your own →
                  </Button>
                </div>
              </>
            )}
          </div>
        )}

        {/* ─── Location Tagging & Dynamic Regional Hashtags ─── */}
        <div className="mt-6 rounded-2xl border border-white/[0.08] bg-card/60 p-4 sm:p-5 shadow-lg backdrop-blur-md">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.06] pb-3 mb-4">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/15 text-primary">
                <MapPin className="h-4 w-4" />
              </span>
              <div>
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                  Location Tag & Regional Hashtags
                </h3>
                <p className="text-[11px] text-muted-foreground">
                  Tag a place on Instagram/Facebook & generate local area hashtags
                </p>
              </div>
            </div>
            {postLocation && (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary border border-primary/20">
                <MapPin className="h-3 w-3" /> Tagged: {postLocation}
              </span>
            )}
          </div>

          {/* Location Input */}
          <div className="space-y-1.5 mb-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-muted-foreground">
                Post Location Tag
              </label>
              {postLocation && (
                <button
                  type="button"
                  onClick={() => onLocationChange?.("")}
                  className="text-[11px] text-rose-400 hover:underline"
                >
                  Clear location
                </button>
              )}
            </div>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={postLocation}
                onChange={(e) => onLocationChange?.(e.target.value)}
                placeholder="e.g. Rajpath Club Ground, Ahmedabad or Midtown, New York"
                className="h-10 pl-9 pr-24 rounded-xl bg-secondary/50 border-white/10 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-primary/50"
              />
              {brandKitLocation && postLocation !== brandKitLocation && (
                <button
                  type="button"
                  onClick={() => onLocationChange?.(brandKitLocation)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 transition-colors"
                  title={`Use brand location: ${brandKitLocation}`}
                >
                  Use {brandKitLocation}
                </button>
              )}
            </div>
          </div>

          {/* Dynamic Geo Hashtags Selector */}
          <div className="rounded-xl border border-white/[0.06] bg-secondary/30 p-3 sm:p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Hash className="h-3.5 w-3.5 text-primary" /> Dynamic Location Hashtags
              </span>
              <span className="text-[10px] text-muted-foreground">Country → City → Area / ZIP</span>
            </div>

            {/* Quick Search & Filter bar for any city / zip */}
            <div className="relative mb-3">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  value={citySearchFilter}
                  onChange={(e) => setCitySearchFilter(e.target.value)}
                  placeholder="Filter by city, state name, or ZIP code (e.g. Houston, Austin, Dallas, 77002, 90210)..."
                  className="h-8 pl-8 pr-8 rounded-lg bg-background/80 border-white/[0.08] text-xs text-foreground placeholder:text-muted-foreground/60"
                />
                {isSearchingLive && (
                  <LoaderCircle className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 animate-spin text-primary" />
                )}
              </div>

              {/* Live Location Results Autocomplete Panel via OpenStreetMap Nominatim & Zippopotam */}
              {liveLocationSearchResults.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1.5 rounded-xl border border-primary/30 bg-card/95 p-2 shadow-2xl backdrop-blur-xl space-y-1 z-30">
                  <div className="flex items-center justify-between px-2 py-1 text-[10px] font-semibold text-primary">
                    <span className="flex items-center gap-1">
                      <Sparkles className="h-3 w-3" /> Live Geocoding Results (OpenStreetMap & Zippopotam)
                    </span>
                    <button
                      type="button"
                      onClick={() => setLiveLocationSearchResults([])}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
                    {liveLocationSearchResults.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-secondary/50 hover:bg-primary/15 hover:border-primary/30 border border-white/5 transition-all text-xs cursor-pointer group"
                        onClick={() => {
                          onLocationChange?.(item.shortLabel || item.name);
                          if (item.hashtags && item.hashtags.length > 0) {
                            setSelectedGeoTags((prev) => Array.from(new Set([...item.hashtags.slice(0, 8), ...prev])));
                          }
                          if (item.countryCode) {
                            const matched = geoCountries.find((c) => c.code.toLowerCase() === item.countryCode.toLowerCase());
                            if (matched) setGeoCountry(matched.id);
                          }
                          setLiveLocationSearchResults([]);
                        }}
                      >
                        <div className="min-w-0 pr-2">
                          <p className="font-semibold text-foreground group-hover:text-primary flex items-center gap-1 truncate">
                            <MapPin className="h-3 w-3 text-primary shrink-0" />
                            {item.shortLabel || item.name}
                          </p>
                          <p className="text-[10px] text-muted-foreground truncate">{item.label}</p>
                        </div>
                        <button
                          type="button"
                          className="shrink-0 px-2 py-1 rounded-md text-[10px] font-bold bg-primary text-white group-hover:bg-primary/90 shadow-xs"
                        >
                          Select & Tag
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
              {/* Country */}
              <div>
                <label className="block text-[11px] font-medium text-muted-foreground mb-1">Country</label>
                <select
                  value={geoCountry}
                  onChange={(e) => {
                    const nextCountry = e.target.value;
                    setGeoCountry(nextCountry);
                    setGeoState("all");
                    setCitySearchFilter("");
                    const cities = getGeoCities(nextCountry);
                    const defaultCity = cities[0]?.id || "";
                    setGeoCity(defaultCity);
                    const areas = getGeoAreas(nextCountry, defaultCity);
                    setGeoArea(areas[0]?.id || "");
                  }}
                  className="flex h-9 w-full rounded-lg border border-white/[0.08] bg-background px-2.5 text-xs font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                >
                  {geoCountries.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.flag} {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* State / Region */}
              <div>
                <label className="block text-[11px] font-medium text-muted-foreground mb-1">
                  State / Region {availableStates.length > 0 && `(${availableStates.length})`}
                </label>
                <select
                  value={geoState}
                  onChange={(e) => {
                    const nextState = e.target.value;
                    setGeoState(nextState);
                    const cities = getGeoCities(geoCountry, nextState === "all" ? undefined : nextState);
                    if (cities[0]) {
                      setGeoCity(cities[0].id);
                      const areas = getGeoAreas(geoCountry, cities[0].id);
                      setGeoArea(areas[0]?.id || "");
                    }
                  }}
                  className="flex h-9 w-full rounded-lg border border-white/[0.08] bg-background px-2.5 text-xs font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                >
                  <option value="all">All States & Regions</option>
                  {availableStates.map((st) => (
                    <option key={st.code} value={st.code}>
                      {st.name} ({st.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* City */}
              <div>
                <label className="block text-[11px] font-medium text-muted-foreground mb-1">
                  City {availableCities.length > 0 && `(${availableCities.length}${liveCities ? " · Live API" : ""})`}
                  {loadingLiveCities && <LoaderCircle className="inline h-3 w-3 animate-spin text-primary ml-1" />}
                </label>
                <select
                  value={geoCity}
                  onChange={(e) => {
                    const nextCity = e.target.value;
                    setGeoCity(nextCity);
                    const areas = getGeoAreas(geoCountry, nextCity);
                    setGeoArea(areas[0]?.id || "");
                  }}
                  className="flex h-9 w-full rounded-lg border border-white/[0.08] bg-background px-2.5 text-xs font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                >
                  {availableCities.map((city) => (
                    <option key={city.id} value={city.id}>
                      {city.name} {city.stateCode ? `(${city.stateCode})` : city.stateOrRegion ? `(${city.stateOrRegion})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Area & Postal/ZIP Code */}
              <div>
                <label className="block text-[11px] font-medium text-muted-foreground mb-1">
                  Area / Postal ZIP Code
                </label>
                <select
                  value={geoArea}
                  onChange={(e) => setGeoArea(e.target.value)}
                  className="flex h-9 w-full rounded-lg border border-white/[0.08] bg-background px-2.5 text-xs font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                >
                  <option value="">All areas & city-wide</option>
                  {availableAreas.map((area) => (
                    <option key={area.id} value={area.id}>
                      {area.postalCode ? `${area.postalCode} — ` : ""}{area.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quick action to set chosen area as location tag */}
            {selectedAreaObj && (
              <div className="mt-2.5 flex items-center justify-between text-[11px] pt-1">
                <span className="text-muted-foreground">
                  Area: <strong>{selectedAreaObj.name}</strong> ({selectedAreaObj.postalCode})
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const loc = `${selectedAreaObj.name}, ${selectedCityObj?.name || ""}`.replace(/^,\s*|,\s*$/g, "");
                    onLocationChange?.(loc);
                  }}
                  className="text-primary font-semibold hover:underline flex items-center gap-1"
                >
                  <MapPin className="h-3 w-3" /> Set as post location
                </button>
              </div>
            )}

            {/* Suggested Hashtags List with Multi-Select */}
            <div className="mt-3.5 border-t border-white/[0.06] pt-3">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <span className="text-[11px] font-semibold text-muted-foreground">
                  Suggested Hashtags ({suggestedGeoHashtags.length} available)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleToggleSelectAllHashtags}
                    className="text-[11px] font-semibold text-primary hover:underline"
                  >
                    {isAllGeoSelected ? "Deselect all" : "Select all"}
                  </button>
                  <button
                    type="button"
                    onClick={handleAddSelectedToCaption}
                    disabled={selectedGeoTags.length === 0}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-primary text-white hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed shadow-xs transition-all flex items-center gap-1"
                  >
                    <Plus className="h-3 w-3" /> Add ({selectedGeoTags.length}) to caption
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
                {suggestedGeoHashtags.map((tag) => {
                  const isChecked = selectedGeoTags.includes(tag);
                  const isAlreadyInCaption = caption.toLowerCase().includes(tag.toLowerCase());
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleToggleGeoTag(tag)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                        isAlreadyInCaption
                          ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                          : isChecked
                          ? "bg-primary/20 text-primary border border-primary/40 font-semibold"
                          : "bg-secondary/60 hover:bg-secondary text-muted-foreground hover:text-foreground border border-white/5"
                      }`}
                    >
                      <span>{tag}</span>
                      {isAlreadyInCaption ? (
                        <Check className="h-3 w-3 text-emerald-400 stroke-[3]" />
                      ) : isChecked ? (
                        <Check className="h-3 w-3 text-primary stroke-[3]" />
                      ) : (
                        <Plus className="h-3 w-3 opacity-60" />
                      )}
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-[10px] text-muted-foreground">
                Tip: Click any hashtag to toggle selection, or green checkmark means it's already in your active caption.
              </p>
            </div>
          </div>
        </div>

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
                return (
                  <AccountSelectItem
                    key={accKey}
                    account={acc}
                    isSelected={isSelected}
                    layout="card"
                    onToggle={() => {
                      if (!onUpdateSelectedAccountIds) return;
                      const next = isSelected
                        ? selectedAccountIds.filter((id) => id !== accKey)
                        : [...selectedAccountIds, accKey];
                      onUpdateSelectedAccountIds(next);
                    }}
                  />
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
                    <SocialPlatformIcon platform={platform} size="md" />
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
              <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                scheduledCount >= 10
                  ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                  : "bg-white/10 text-white/90"
              }`}>
                {scheduledCount}/10
              </span>
            </Button>
          </div>
          {timing === "schedule" && (
            <div className="mt-4 space-y-3">
              {scheduledCount >= 10 && (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
                  <p className="font-semibold text-amber-400">Schedule limit reached ({scheduledCount}/10 active posts)</p>
                  <p className="mt-0.5 text-muted-foreground">
                    You can have a maximum of 10 active scheduled posts in your calendar queue. Please wait for an existing post to publish or delete one from your calendar to schedule more.
                  </p>
                </div>
              )}
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-xs font-semibold text-muted-foreground flex flex-col gap-1.5">
                  <span className="flex items-center gap-1.5">
                    <CalendarDays className="h-3.5 w-3.5 text-primary" />
                    <span>Select Date</span>
                  </span>
                  <Input
                    className="h-11 text-foreground rounded-xl bg-secondary/50 border-white/10 [color-scheme:dark] cursor-pointer px-3 text-sm focus:border-primary/50 transition-all font-medium"
                    type="date"
                    min={(() => {
                      const d = new Date();
                      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
                    })()}
                    value={scheduledDate}
                    onClick={(e) => e.currentTarget.showPicker?.()}
                    onChange={(event) => onDate(event.target.value)}
                  />
                </label>
                <label className="text-xs font-semibold text-muted-foreground flex flex-col gap-1.5">
                  <span className="flex items-center gap-1.5">
                    <Clock3 className="h-3.5 w-3.5 text-primary" />
                    <span>Select Time</span>
                  </span>
                  <Input
                    className="h-11 text-foreground rounded-xl bg-secondary/50 border-white/10 [color-scheme:dark] cursor-pointer px-3 text-sm focus:border-primary/50 transition-all font-medium"
                    type="time"
                    value={scheduledTime}
                    onClick={(e) => e.currentTarget.showPicker?.()}
                    onChange={(event) => onTime(event.target.value)}
                  />
                </label>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-[11px] text-muted-foreground font-medium">Quick Pick:</span>
                <button
                  type="button"
                  onClick={() => {
                    const tmrw = new Date();
                    tmrw.setDate(tmrw.getDate() + 1);
                    onDate(`${tmrw.getFullYear()}-${String(tmrw.getMonth() + 1).padStart(2, "0")}-${String(tmrw.getDate()).padStart(2, "0")}`);
                    onTime("10:00");
                  }}
                  className="px-2.5 py-1 rounded-lg text-xs bg-secondary/60 hover:bg-secondary text-muted-foreground hover:text-foreground border border-white/5 transition-all"
                >
                  Tomorrow 10:00 AM
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const tmrw = new Date();
                    tmrw.setDate(tmrw.getDate() + 1);
                    onDate(`${tmrw.getFullYear()}-${String(tmrw.getMonth() + 1).padStart(2, "0")}-${String(tmrw.getDate()).padStart(2, "0")}`);
                    onTime("18:00");
                  }}
                  className="px-2.5 py-1 rounded-lg text-xs bg-secondary/60 hover:bg-secondary text-muted-foreground hover:text-foreground border border-white/5 transition-all"
                >
                  Tomorrow 6:00 PM
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const sat = new Date();
                    const day = sat.getDay();
                    const diff = (6 - day + 7) % 7 || 7;
                    sat.setDate(sat.getDate() + diff);
                    onDate(`${sat.getFullYear()}-${String(sat.getMonth() + 1).padStart(2, "0")}-${String(sat.getDate()).padStart(2, "0")}`);
                    onTime("12:00");
                  }}
                  className="px-2.5 py-1 rounded-lg text-xs bg-secondary/60 hover:bg-secondary text-muted-foreground hover:text-foreground border border-white/5 transition-all"
                >
                  This Weekend (Sat 12 PM)
                </button>
              </div>

              <p className="text-xs text-muted-foreground/80">Times shown in your local timezone.</p>
            </div>
          )}
        </div>
        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.08] pt-6">
          <Button variant="outline" className="h-11 px-5 rounded-xl font-medium" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" /> Back to poster
          </Button>
          <Button
            className="h-11 px-7 rounded-xl font-semibold gap-2 shadow-lg shadow-primary/25 hover:shadow-primary/40"
            disabled={
              (connectedAccounts.length > 0 && selectedAccountIds.length === 0) ||
              (timing === "schedule" && scheduledCount >= 10)
            }
            onClick={onSubmit}
          >
            {timing === "now"
              ? "Post now"
              : scheduledCount >= 10
              ? "Schedule limit reached"
              : "Schedule post"}<ArrowRight className="h-4 w-4 stroke-[2.5]" />
          </Button>
        </div>
      </section>

      {/* Preview Full Size Modal in Publish Step with Feed Preview Tabs */}
      <Dialog open={previewZoomOpen} onOpenChange={setPreviewZoomOpen}>
        <DialogContent className="sm:max-w-3xl p-3 sm:p-5 bg-card/95 backdrop-blur-2xl border-white/10 rounded-3xl overflow-hidden shadow-2xl">
          <DialogHeader className="flex flex-row items-center justify-between pb-3 border-b border-white/5">
            <div>
              <DialogTitle className="font-display text-lg text-foreground truncate max-w-lg">
                {headline || "Full Poster Preview"}
              </DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {zoomLightboxTab === "poster"
                  ? "Full-resolution view of your chosen flyer"
                  : zoomLightboxTab === "instagram"
                  ? "Live Instagram Feed Mockup with your caption"
                  : "Live Facebook Feed Mockup with your caption"}
              </p>
            </div>
            {/* View Selector Tabs */}
            <div className="flex items-center gap-1 rounded-xl border border-white/[0.08] bg-black/40 p-1">
              <button
                type="button"
                onClick={() => setZoomLightboxTab("poster")}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                  zoomLightboxTab === "poster"
                    ? "bg-secondary text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Poster
              </button>
              <button
                type="button"
                onClick={() => setZoomLightboxTab("instagram")}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold flex items-center gap-1 transition-all ${
                  zoomLightboxTab === "instagram"
                    ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Instagram className="h-3 w-3" /> Instagram
              </button>
              <button
                type="button"
                onClick={() => setZoomLightboxTab("facebook")}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold flex items-center gap-1 transition-all ${
                  zoomLightboxTab === "facebook"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <span className="font-bold text-[10px]">f</span> Facebook
              </button>
            </div>
          </DialogHeader>

          <div className="relative flex items-center justify-center rounded-2xl overflow-y-auto bg-black/50 border border-white/5 max-h-[75vh] p-4 mt-2">
            {option?.imageUrl && (
              zoomLightboxTab === "poster" ? (
                <img
                  src={option.imageUrl}
                  alt="Full size poster"
                  className="max-h-[70vh] w-auto max-w-full object-contain rounded-xl shadow-2xl"
                />
              ) : (
                <SocialFeedPreview
                  platform={zoomLightboxTab === "instagram" ? "Instagram" : "Facebook"}
                  imageUrl={option.imageUrl}
                  businessName={businessName}
                  handle={displayHandle}
                  location={postLocation}
                  headline={headline}
                  caption={caption}
                  logoUrl={logoUrl}
                  format={option?.format}
                  showPlatformToggle={false}
                />
              )
            )}
          </div>
          <div className="flex items-center justify-between gap-3 pt-3 border-t border-white/5 mt-1">
            <span className="text-[11px] text-muted-foreground">
              Click anywhere outside or press Esc to close
            </span>
            {option?.imageUrl && (
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs gap-1.5 rounded-xl border-white/10 hover:bg-secondary/60"
                onClick={() => {
                  const a = document.createElement("a");
                  a.href = option.imageUrl!;
                  a.target = "_blank";
                  a.rel = "noopener noreferrer";
                  a.download = "poster-full-size.png";
                  a.click();
                }}
              >
                <ArrowDownToLine className="h-3.5 w-3.5" /> Download original
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
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
  const [month, setMonth] = useState(() => new Date());
  const scheduled = posts.filter((post) => post.status === "Scheduled").sort((a, b) => {
    const aDate = a.date instanceof Date ? a.date.toISOString().slice(0, 10) : String(a.date || "");
    const bDate = b.date instanceof Date ? b.date.toISOString().slice(0, 10) : String(b.date || "");
    return `${aDate} ${a.time || ""}`.localeCompare(`${bDate} ${b.time || ""}`);
  });
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
            const matches = scheduled.filter((post) => {
              const dStr = post.date instanceof Date ? post.date.toISOString().slice(0, 10) : String(post.date || "");
              return (
                Number(dStr.slice(-2)) === day &&
                Number(dStr.slice(5, 7)) === month.getMonth() + 1 &&
                Number(dStr.slice(0, 4)) === month.getFullYear()
              );
            });
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
                <SocialPlatformIcon platform={post.platform} size="xs" />
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
  const [tagline, setTagline] = useState(data.tagline || "");
  const [location, setLocation] = useState(data.location || "");
  const [phone, setPhone] = useState(data.phone || "");
  const [website, setWebsite] = useState(data.website || "");
  const [email, setEmail] = useState(data.email || "");
  const [colors, setColors] = useState<string[]>(data.colors && data.colors.length > 0 ? data.colors : ["#00A896", "#028090", "#05668D", "#02C39A"]);
  const [font, setFont] = useState(data.font || "Work Sans");
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
    setWebsite(data.website || "");
    setEmail(data.email || "");
    setColors(data.colors && data.colors.length > 0 ? data.colors : ["#00A896", "#028090", "#05668D", "#02C39A"]);
    setFont(data.font || "Work Sans");
    setLogoName(data.logoName || "");
    setLogoUrl(data.logoUrl || "");
    setTone(data.tone || "Friendly");
    setTimezone(data.timezone || "Asia/Kolkata");
    setDefaultHashtags(data.defaultHashtags || "");
  }, [data.businessId, data.businessName, data.logoUrl, data.phone, data.website, data.email, data.location, data.font, data.colors]);

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
      website: website.trim(),
      email: email.trim(),
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
              <LabeledInput label="Website" value={website} onChange={setWebsite} />
              <LabeledInput label="Email" value={email} onChange={setEmail} />
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

      <div className="max-w-3xl space-y-4">
        {/* Instagram Professional Section */}
        <PlatformAccountCard
          platform="Instagram"
          title="Instagram Professional"
          description={`Direct image and carousel posting via Meta Graph API for ${businessName}.`}
          businessName={businessName}
          accounts={instagramAccounts}
          onConnectClick={() => {
            setSelectedPlatform("Instagram");
            setConnectModalOpen(true);
          }}
          onDisconnectClick={(accId) => handleDisconnect(accId, "Instagram")}
          onReconnectClick={() => onConnect?.(activeBusinessId || "", "Instagram")}
        />

        {/* Facebook Page Section */}
        <PlatformAccountCard
          platform="Facebook"
          title="Facebook Page"
          description={`Direct post and photo publishing to Facebook Pages via Meta Graph API for ${businessName}.`}
          businessName={businessName}
          accounts={connectedAccounts.filter((a) => a.platform.toLowerCase() === "facebook")}
          onConnectClick={() => {
            setSelectedPlatform("Facebook");
            setConnectModalOpen(true);
          }}
          onDisconnectClick={(accId) => handleDisconnect(accId, "Facebook")}
          onReconnectClick={() => onConnect?.(activeBusinessId || "", "Facebook")}
        />
      </div>

      <p className="mt-6 max-w-3xl border-l-2 border-primary/50 py-1 pl-4 text-xs leading-relaxed text-muted-foreground">
        {connectedAccounts.length > 0
          ? `${connectedAccounts.length} social account${connectedAccounts.length === 1 ? "" : "s"} active for ${businessName}. You can link multiple Instagram and Facebook accounts to this workspace, and pick which ones to target on each post.`
          : `Connect your Instagram Professional or Facebook Page accounts for ${businessName} to enable automated publishing.`}
      </p>

      {/* Connect Account Modal */}
      <Dialog open={connectModalOpen} onOpenChange={setConnectModalOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl border-white/10 bg-card/95 backdrop-blur-2xl">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl flex items-center gap-2">
              <SocialPlatformIcon platform={selectedPlatform} size="sm" variant="badge" />
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
                  <>Meta Graph API requires an Instagram <strong>Business</strong> or <strong>Creator</strong> profile. Personal accounts are not supported by Meta's API.</>
                )}
                {selectedPlatform === "Facebook" && (
                  <>Connect a <strong>Facebook Page</strong> that you manage. Meta Graph API allows automated publishing to Facebook Pages. You can connect multiple Facebook Pages to this workspace and manage them independently.</>
                )}
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold text-foreground">Official OAuth Authorization</p>
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