import React, { useState } from "react";
import {
  Sparkles,
  Zap,
  Palette,
  CalendarDays,
  Instagram,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  Send,
  LoaderCircle,
  Copy,
  ChevronDown,
  Layers,
  Clock3,
  ExternalLink,
  Star,
  Check,
  Eye,
  Sliders,
  Share2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const SUPABASE_STORAGE_URL = "https://dihikyljbrbidqgelwac.supabase.co/storage/v1/object/public/post-pilot";
const PIZZA_IMG_URL = `${SUPABASE_STORAGE_URL}/showcase/pizza_offer_showcase.jpg`;
const CAFE_IMG_URL = `${SUPABASE_STORAGE_URL}/showcase/cafe_offer_showcase.jpg`;

export function GoogleIcon({ className = "h-4 w-4" }: { className?: string }) {
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

interface LandingPageProps {
  onSignIn: () => void;
  googleLoading?: boolean;
  isAuthenticated?: boolean;
  onGoToWorkspace?: () => void;
}

type TabKey = "create" | "captions" | "brandkit" | "calendar" | "accounts";

export function LandingPage({
  onSignIn,
  googleLoading = false,
  isAuthenticated = false,
  onGoToWorkspace,
}: LandingPageProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("create");
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [copiedCaption, setCopiedCaption] = useState(false);

  const handlePrimaryAction = isAuthenticated ? (onGoToWorkspace || onSignIn) : onSignIn;

  const tabsConfig: {
    id: TabKey;
    label: string;
    icon: React.ReactNode;
    tagline: string;
    description: string;
  }[] = [
    {
      id: "create",
      label: "AI Poster Studio",
      icon: <Sparkles className="h-4 w-4" />,
      tagline: "Turn rough thoughts into 4 tailored high-res poster layouts in 2 seconds",
      description:
        "Our creative engine extracts your promotion details, dates, and prices in real time, drafting catchy headlines and pairing them with photorealistic visual backdrops tailored to your brand.",
    },
    {
      id: "captions",
      label: "Smart Copywriter",
      icon: <Layers className="h-4 w-4" />,
      tagline: "Conversion-optimized captions, hooks, and curated hashtag sets",
      description:
        "Select your vibe—Punchy, Storytelling, or Promo. Get ready-to-paste Instagram captions engineered for comments, saves, and foot traffic.",
    },
    {
      id: "brandkit",
      label: "Brand Kit",
      icon: <Palette className="h-4 w-4" />,
      tagline: "Lock in your brand typography, logo, and signature color palette",
      description:
        "Set your brand aesthetic once. Every AI poster automatically honors your brand rules, custom fonts, and hex colors with zero manual styling.",
    },
    {
      id: "calendar",
      label: "Content Calendar",
      icon: <CalendarDays className="h-4 w-4" />,
      tagline: "Visual timeline to plan, preview, and queue your weekly social calendar",
      description:
        "View upcoming posts by day, time, and platform. Preview how your Instagram grid will look, adjust schedules, or publish immediately with 1 click.",
    },
    {
      id: "accounts",
      label: "Meta & Instagram Connect",
      icon: <Instagram className="h-4 w-4" />,
      tagline: "Direct Meta Graph API integration with zero third-party data leaks",
      description:
        "Connect your verified Instagram Business or Creator account in 1 click. Publish directly to feed and stories without opening your phone.",
    },
  ];

  const handleCopyDemoCaption = () => {
    navigator.clipboard?.writeText(
      "Make Friday night effortless. Two woodfired pizzas, handcrafted dough, and drinks on the table for $24. Tag your pizza partner 🍕👇 #LuigisPizza #WeekendVibes #WoodfiredPizza"
    );
    setCopiedCaption(true);
    setTimeout(() => setCopiedCaption(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#090A0E] text-zinc-100 font-sans antialiased selection:bg-primary/25 selection:text-primary">
      {/* 1. Header / Navigation */}
      <header className="sticky top-0 z-50 border-b border-white/[0.08] bg-[#090A0E]/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-primary via-orange-500 to-rose-500 text-white shadow-md shadow-primary/25">
              <Send className="h-4 w-4" />
            </span>
            <span className="font-display text-2xl font-bold tracking-tight text-white">postpilot</span>
          </div>

          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-zinc-400">
            <a href="#showcase" className="transition hover:text-white">
              Product Tour
            </a>
            <a href="#features" className="transition hover:text-white">
              Features
            </a>
            <a href="#how-it-works" className="transition hover:text-white">
              How it Works
            </a>
            <a href="#faq" className="transition hover:text-white">
              FAQ
            </a>
          </nav>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Button
                onClick={handlePrimaryAction}
                className="h-10 gap-2 rounded-xl bg-gradient-to-r from-primary via-orange-500 to-rose-500 px-4 text-xs sm:text-sm font-semibold text-white shadow-md shadow-primary/25 hover:shadow-primary/40 transition-all"
              >
                <span>Open Workspace</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={onSignIn}
                disabled={googleLoading}
                className="h-10 gap-2.5 rounded-xl border border-white/10 bg-white/10 px-4 text-xs sm:text-sm font-medium text-white shadow-sm hover:bg-white/15 transition-all"
              >
                {googleLoading ? (
                  <LoaderCircle className="h-4 w-4 animate-spin text-white" />
                ) : (
                  <GoogleIcon className="h-4 w-4" />
                )}
                <span>Continue with Google</span>
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="relative overflow-hidden pt-14 pb-20 sm:pt-24 sm:pb-32">
        {/* Soft background ambient glows */}
        <div className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-[550px] w-[900px] -translate-x-1/2 rounded-full bg-gradient-to-b from-primary/15 via-orange-500/10 to-transparent blur-3xl" />
        
        <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-4 py-1.5 text-xs font-semibold text-zinc-300 shadow-sm backdrop-blur-md">
            <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
            <span>AI Social Studio for Local Businesses & Creators</span>
            <span className="text-primary font-bold">New</span>
          </div>

          <h1 className="mt-7 font-display text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-white leading-[1.08]">
            Turn Your Weekly Offers Into <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-primary via-orange-400 to-rose-400 bg-clip-text text-transparent italic">
              Irresistible Instagram Posts
            </span> <br className="hidden sm:inline" />
            in 60 Seconds.
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base sm:text-lg text-zinc-400 leading-relaxed">
            Stop struggling with Canva or waiting days for designers. PostPilot combines lightning-fast AI copywriting,
            photorealistic visual creation, your custom brand kit, and 1-click Instagram publishing.
          </p>

          <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-4">
            {isAuthenticated ? (
              <Button
                onClick={handlePrimaryAction}
                className="h-13 w-full sm:w-auto min-w-[240px] gap-3 rounded-xl bg-gradient-to-r from-primary via-orange-500 to-rose-500 text-white text-base font-semibold shadow-lg shadow-primary/30 hover:shadow-primary/45 transition-all duration-200"
              >
                <span>Go to Your Workspace</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={onSignIn}
                disabled={googleLoading}
                className="h-13 w-full sm:w-auto min-w-[240px] gap-3 rounded-xl bg-gradient-to-r from-primary via-orange-500 to-rose-500 text-white text-base font-semibold shadow-lg shadow-primary/30 hover:shadow-primary/45 transition-all duration-200"
              >
                {googleLoading ? (
                  <LoaderCircle className="h-5 w-5 animate-spin text-white" />
                ) : (
                  <GoogleIcon className="h-5 w-5" />
                )}
                <span>Start Free with Google</span>
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            )}
            <a
              href="#showcase"
              className="inline-flex h-13 w-full sm:w-auto items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] px-6 text-sm font-semibold text-zinc-200 shadow-sm hover:bg-white/10 hover:text-white transition-colors"
            >
              Explore Live Tabs Tour
            </a>
          </div>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-y-2 gap-x-6 text-xs text-zinc-400">
            <span className="flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" /> No credit card required
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Official Meta Graph API
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" /> 1-Click Fast Setup
            </span>
          </div>

          {/* Social Proof metrics */}
          <div className="mt-14 grid grid-cols-2 gap-4 border-y border-white/[0.08] py-8 sm:grid-cols-4">
            <div>
              <p className="font-display text-3xl font-bold text-white">60s</p>
              <p className="mt-1 text-xs text-zinc-400">Idea to Live Instagram Post</p>
            </div>
            <div>
              <p className="font-display text-3xl font-bold text-white">4,800+</p>
              <p className="mt-1 text-xs text-zinc-400">Posters Generated</p>
            </div>
            <div>
              <p className="font-display text-3xl font-bold text-white">100%</p>
              <p className="mt-1 text-xs text-zinc-400">On-Brand Fonts & Colors</p>
            </div>
            <div>
              <p className="font-display text-3xl font-bold text-white">4.9 / 5</p>
              <p className="mt-1 text-xs text-zinc-400">Creator & Owner Rating</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Interactive "See Inside PostPilot" Tab Showcase */}
      <section id="showcase" className="scroll-mt-20 py-16 sm:py-24 bg-[#0D0F14]/80 border-t border-white/[0.08]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <span className="text-xs font-bold uppercase tracking-wider text-primary">
              EXPLORE OUR PRODUCT TABS
            </span>
            <h2 className="mt-2 font-display text-3xl sm:text-5xl font-bold text-white">
              See How PostPilot Works Inside
            </h2>
            <p className="mt-3 text-base text-zinc-400">
              Click through our workspace tabs below to see live previews of the exact tools you get.
              From AI poster generation to brand kits and scheduling.
            </p>
          </div>

          {/* Tab Selector Buttons */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
            {tabsConfig.map((tab) => {
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-semibold transition-all duration-150 ${
                    isSelected
                      ? "bg-gradient-to-r from-primary via-orange-500 to-rose-500 text-white shadow-lg shadow-primary/25 scale-[1.02]"
                      : "bg-[#14161F] text-zinc-400 hover:text-white hover:bg-[#1A1D29] border border-white/[0.08]"
                  }`}
                >
                  <span className={isSelected ? "text-white" : "text-primary"}>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab Headline & description banner */}
          {(() => {
            const currentTab = tabsConfig.find((t) => t.id === activeTab)!;
            return (
              <div className="mx-auto mt-6 max-w-2xl text-center">
                <p className="font-display text-xl sm:text-2xl font-semibold text-white">
                  {currentTab.tagline}
                </p>
                <p className="mt-1 text-sm text-zinc-400 leading-relaxed">
                  {currentTab.description}
                </p>
              </div>
            );
          })()}

          {/* High-Fidelity App Window Showcase */}
          <div className="mt-8 rounded-3xl border border-white/10 bg-[#0C0E14] p-2 sm:p-4 shadow-2xl shadow-black/80">
            {/* macOS Browser Header */}
            <div className="mb-3 flex items-center justify-between border-b border-white/10 pb-3 px-2">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-[#FF5F56]" />
                <span className="h-3 w-3 rounded-full bg-[#FFBD2E]" />
                <span className="h-3 w-3 rounded-full bg-[#27C93F]" />
                <span className="ml-3 hidden sm:inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-1 text-[11px] font-mono text-white/70">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  https://postpilot.app/workspace/{activeTab}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="rounded-md bg-white/10 px-2.5 py-0.5 text-[11px] font-medium text-white/80">
                  Active Tab: <strong className="text-white capitalize">{activeTab}</strong>
                </span>
              </div>
            </div>

            {/* Inner Workspace Screen Container */}
            <div className="min-h-[520px] rounded-2xl bg-[#11131C] p-4 sm:p-6 text-zinc-100 border border-white/[0.06]">
              {/* TAB 1: AI POSTER STUDIO (CREATE) */}
              {activeTab === "create" && (
                <div className="grid gap-6 lg:grid-cols-[1.1fr_1.3fr]">
                  {/* Left Controls */}
                  <div className="flex flex-col justify-between space-y-4 rounded-2xl border border-white/[0.08] bg-[#161824] p-5 shadow-lg">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-primary">
                          Step 1 • AI Studio
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 border border-primary/25 px-2.5 py-0.5 text-[10px] font-bold text-primary">
                          <Zap className="h-3 w-3" /> Real-time Creative Engine
                        </span>
                      </div>
                      <h3 className="mt-2 font-display text-xl font-bold text-white">
                        Describe Your Promotion
                      </h3>
                      <p className="mt-1 text-xs text-zinc-400">
                        Type plain English. Our studio extracts your offer, dates, price, and crafts 4 visual layouts.
                      </p>

                      <div className="mt-4 space-y-3">
                        <div>
                          <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                            What are you offering?
                          </label>
                          <div className="mt-1.5 rounded-xl border border-white/[0.08] bg-[#0E1017] p-3 text-xs text-zinc-200">
                            Two woodfired pizzas for $24 this Friday evening. Dine-in only at Luigi's Pizzeria.
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                              Tone of Voice
                            </label>
                            <div className="mt-1.5 rounded-xl border border-white/[0.08] bg-[#0E1017] p-2.5 text-xs text-zinc-200 font-medium">
                              🍕 Warm & Welcoming
                            </div>
                          </div>
                          <div>
                            <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                              Extracted Price
                            </label>
                            <div className="mt-1.5 rounded-xl border border-white/[0.08] bg-[#0E1017] p-2.5 text-xs font-bold text-primary">
                              $24 (Dine-in)
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                            AI Headlines Generated Automatically
                          </label>
                          <div className="mt-1.5 space-y-1.5">
                            {[
                              "Two pizzas. One good plan.",
                              "Pizza night, sorted.",
                              "The Friday favourite, shared fresh.",
                              "Hot oven, cold drinks, $24 for two.",
                            ].map((headline, i) => (
                              <div
                                key={headline}
                                className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-medium cursor-pointer transition ${
                                  i === 0
                                    ? "bg-primary/15 border border-primary/40 text-primary font-semibold shadow-xs"
                                    : "bg-[#0E1017] border border-white/[0.06] text-zinc-300 hover:border-white/20"
                                }`}
                              >
                                <span>"{headline}"</span>
                                {i === 0 && <Check className="h-3.5 w-3.5 text-primary" />}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between">
                      <span className="text-[11px] text-zinc-400">Generated in 1.4 seconds</span>
                      <Button
                        size="sm"
                        onClick={onSignIn}
                        className="h-9 gap-1.5 rounded-xl bg-gradient-to-r from-primary via-orange-500 to-rose-500 hover:shadow-md hover:shadow-primary/25 text-white text-xs font-medium"
                      >
                        <Sparkles className="h-3 w-3" />
                        <span>Generate Variations</span>
                      </Button>
                    </div>
                  </div>

                  {/* Right Live Canvas Preview */}
                  <div className="flex flex-col items-center justify-center rounded-2xl border border-white/[0.08] bg-gradient-to-b from-[#161824] to-[#0E1017] p-5 shadow-lg">
                    <div className="mb-3 flex w-full max-w-xs items-center justify-between text-xs font-semibold text-zinc-400">
                      <span>Live 4:5 Instagram Feed Poster</span>
                      <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] text-emerald-400 font-bold">
                        1080 × 1350 px
                      </span>
                    </div>

                    {/* Commercial Advertising Poster Showcase */}
                    <div className="group relative aspect-[4/5] w-full max-w-[280px] rounded-2xl overflow-hidden shadow-2xl border border-white/10 transition-all duration-300 hover:scale-[1.02] hover:shadow-3xl">
                      <img
                        src={PIZZA_IMG_URL}
                        alt="Artisanal commercial pizza offer poster generated by PostPilot AI"
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />

                      {/* Top floating badges */}
                      <div className="absolute top-3 inset-x-3 flex items-center justify-between">
                        <span className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-primary to-orange-500 text-white px-2.5 py-1 text-[10px] font-bold shadow-md">
                          <Sparkles className="h-3 w-3" />
                          <span>SPECIAL OFFER</span>
                        </span>
                        <span className="rounded-full bg-black/60 backdrop-blur-md text-white/90 px-2 py-0.5 text-[9px] font-mono border border-white/10">
                          1080 × 1350
                        </span>
                      </div>

                      {/* Bottom Offer Callout Box */}
                      <div className="absolute bottom-3 inset-x-3 rounded-xl bg-black/85 backdrop-blur-md p-3 text-white border border-white/15 flex items-center justify-between shadow-lg">
                        <div>
                          <p className="text-[9px] font-bold uppercase text-amber-400 tracking-wider">Generated by PostPilot AI</p>
                          <p className="font-display text-sm font-bold truncate">Woodfired Pizzeria • Special Offer</p>
                          <p className="text-[10px] text-white/70">Buy 1 Get 1 50% Off Second Pizza</p>
                        </div>
                        <span className="rounded-lg bg-gradient-to-r from-primary to-orange-500 px-2.5 py-1 text-xs font-bold text-white shadow-md">
                          $24
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={onSignIn}
                        className="h-9 rounded-xl gap-1.5 text-xs border-white/10 bg-white/[0.05] text-zinc-200 hover:bg-white/10"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>Preview Story (9:16)</span>
                      </Button>
                      <Button
                        size="sm"
                        onClick={onSignIn}
                        className="h-9 rounded-xl gap-1.5 text-xs bg-white text-zinc-900 hover:bg-zinc-100 font-medium"
                      >
                        <span>Send to Captions</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: SMART COPYWRITER (CAPTIONS) */}
              {activeTab === "captions" && (
                <div className="grid gap-6 lg:grid-cols-[1.1fr_1.3fr]">
                  <div className="space-y-4 rounded-2xl border border-white/[0.08] bg-[#161824] p-5 shadow-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-primary">
                        Step 2 • Smart Captions
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400">
                        98% Engagement Score
                      </span>
                    </div>

                    <h3 className="font-display text-xl font-bold text-white">
                      Captions Engineered for Comments & Saves
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Choose your angle. PostPilot generates hooks that stop the scroll, clear calls to action, and localized tags.
                    </p>

                    <div className="flex gap-2">
                      <span className="rounded-xl bg-gradient-to-r from-primary via-orange-500 to-rose-500 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs">
                        Punchy Hook
                      </span>
                      <span className="rounded-xl border border-white/[0.08] bg-[#0E1017] px-3.5 py-1.5 text-xs font-medium text-zinc-400">
                        Storytelling
                      </span>
                      <span className="rounded-xl border border-white/[0.08] bg-[#0E1017] px-3.5 py-1.5 text-xs font-medium text-zinc-400">
                        Urgent Promo
                      </span>
                    </div>

                    <div className="relative rounded-2xl border border-white/[0.08] bg-[#0E1017] p-4 text-xs leading-relaxed text-zinc-200">
                      <p className="font-semibold text-white">
                        Make Friday night effortless. 🍕
                      </p>
                      <p className="mt-2 text-zinc-300">
                        Two woodfired pizzas, handcrafted dough fermented for 48 hours, and cold drinks on the table for just $24.
                      </p>
                      <p className="mt-2 text-zinc-300">
                        Dine-in only at Luigi's Pizzeria. Tables fill up quickly by 6 PM—tap the link in our bio to reserve or stop by early!
                      </p>
                      <p className="mt-3 text-primary font-mono text-[11px]">
                        #LuigisPizza #PizzaNight #FridayVibes #WoodfiredPizza #NeighborhoodFavorites
                      </p>

                      <button
                        onClick={handleCopyDemoCaption}
                        className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/10 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-white/15 transition-colors"
                      >
                        {copiedCaption ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                        <span>{copiedCaption ? "Copied to clipboard!" : "Copy Caption"}</span>
                      </button>
                    </div>

                    <div className="flex items-center justify-between text-xs text-zinc-400">
                      <span>Character count: 284 / 2200</span>
                      <span className="font-semibold text-emerald-400">Optimal length for Instagram</span>
                    </div>
                  </div>

                  {/* Right: Instagram Feed Post Preview */}
                  <div className="flex flex-col items-center justify-center rounded-2xl border border-white/[0.08] bg-[#161824] p-5 shadow-lg">
                    <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#0E1017] shadow-xl overflow-hidden">
                      {/* Post Header */}
                      <div className="flex items-center justify-between border-b border-white/[0.08] p-3">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-primary to-orange-500 text-white flex items-center justify-center text-xs font-bold">
                            L
                          </div>
                          <div>
                            <p className="text-xs font-bold text-white">luigispizzeria</p>
                            <p className="text-[10px] text-zinc-400">San Francisco, California</p>
                          </div>
                        </div>
                        <Instagram className="h-4 w-4 text-rose-400" />
                      </div>

                      {/* Poster Mockup Image */}
                      <div className="relative aspect-square overflow-hidden bg-black">
                        <img
                          src={PIZZA_IMG_URL}
                          alt="Instagram feed pizza commercial post"
                          className="h-full w-full object-cover"
                        />
                        <div className="absolute top-2 right-2 rounded-full bg-black/60 backdrop-blur-md px-2 py-0.5 text-[9px] text-white font-medium border border-white/10">
                          1/2
                        </div>
                      </div>

                      {/* Post Footer & Caption Preview */}
                      <div className="p-3 text-xs">
                        <p className="font-bold text-white">248 likes</p>
                        <p className="mt-1 text-zinc-300">
                          <strong className="text-white">luigispizzeria</strong> Make Friday night effortless. Two woodfired pizzas and drinks for $24... <span className="text-zinc-500">more</span>
                        </p>
                        <p className="mt-1 text-[10px] text-zinc-500 uppercase">14 MINUTES AGO</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: BRAND KIT CUSTOMIZER */}
              {activeTab === "brandkit" && (
                <div className="grid gap-6 lg:grid-cols-[1.1fr_1.3fr]">
                  <div className="space-y-4 rounded-2xl border border-white/[0.08] bg-[#161824] p-5 shadow-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-primary">
                        Tab 3 • Brand Identity
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 text-[10px] font-bold text-amber-400">
                        Zero Manual Re-styling
                      </span>
                    </div>

                    <h3 className="font-display text-xl font-bold text-white">
                      Your Colors, Logo & Fonts Locked In
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Set your brand once. Every generated graphic and caption automatically aligns with your aesthetic.
                    </p>

                    <div className="space-y-3 pt-1">
                      <div>
                        <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                          Business Name & Handle
                        </label>
                        <div className="mt-1.5 grid grid-cols-2 gap-2">
                          <div className="rounded-xl border border-white/[0.08] bg-[#0E1017] p-2.5 text-xs font-medium text-white">
                            Luigi's Pizzeria
                          </div>
                          <div className="rounded-xl border border-white/[0.08] bg-[#0E1017] p-2.5 text-xs font-mono text-zinc-400">
                            @luigispizza
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                          Brand Color Palette
                        </label>
                        <div className="mt-2 flex items-center gap-2.5">
                          {[
                            { name: "Terracotta", hex: "#C84B31" },
                            { name: "Warm Cream", hex: "#FAF8F5" },
                            { name: "Olive", hex: "#4A5844" },
                            { name: "Charcoal", hex: "#1E1E1E" },
                            { name: "Mustard", hex: "#D4A338" },
                          ].map((c) => (
                            <div key={c.hex} className="flex flex-col items-center gap-1">
                              <span
                                className="h-8 w-8 rounded-full border border-white/20 shadow-xs"
                                style={{ backgroundColor: c.hex }}
                              />
                              <span className="text-[9px] font-mono text-zinc-400">{c.hex}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                          Typography Pairing
                        </label>
                        <div className="mt-1.5 flex items-center justify-between rounded-xl border border-white/[0.08] bg-[#0E1017] p-3">
                          <div>
                            <p className="font-display text-sm font-bold text-white">Fraunces (Display Headings)</p>
                            <p className="font-sans text-xs text-zinc-400">DM Sans (Body & Footers)</p>
                          </div>
                          <span className="text-[11px] font-bold text-primary">Default</span>
                        </div>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      onClick={onSignIn}
                      className="w-full h-10 rounded-xl bg-white text-zinc-900 font-medium hover:bg-zinc-100 text-xs shadow-md"
                    >
                      <span>Update Brand Kit</span>
                    </Button>
                  </div>

                  {/* Right: Live Style Card Preview */}
                  <div className="flex flex-col justify-center rounded-2xl border border-white/[0.08] bg-gradient-to-br from-[#161824] to-[#0E1017] p-6 shadow-lg">
                    <p className="text-xs font-bold uppercase tracking-wider text-primary">
                      Automatic Theme Variations
                    </p>
                    <p className="mt-1 text-xs text-zinc-400">
                      Every time you create a post, PostPilot generates it across your brand palette:
                    </p>

                    <div className="mt-4 grid grid-cols-3 gap-3">
                      {/* Theme Tomato with real pizza commercial */}
                      <div className="group relative aspect-[4/5] rounded-xl overflow-hidden shadow-sm border border-white/10">
                        <img src={PIZZA_IMG_URL} alt="Tomato theme" className="h-full w-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-transparent to-black/20" />
                        <div className="absolute bottom-2 inset-x-2 text-white text-center">
                          <p className="font-display text-[11px] font-bold leading-tight">Pizza Night Special</p>
                          <span className="text-[9px] font-bold text-amber-300">$24</span>
                        </div>
                      </div>
                      {/* Theme Cream with cafe brunch */}
                      <div className="group relative aspect-[4/5] rounded-xl overflow-hidden shadow-sm border border-white/10">
                        <img src={CAFE_IMG_URL} alt="Cream theme" className="h-full w-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/10" />
                        <div className="absolute bottom-2 inset-x-2 text-white text-center">
                          <p className="font-display text-[11px] font-bold leading-tight">Weekend Brunch</p>
                          <span className="text-[9px] font-bold text-amber-300">$18</span>
                        </div>
                      </div>
                      {/* Theme Olive */}
                      <div className="group relative aspect-[4/5] rounded-xl overflow-hidden shadow-sm border border-white/10">
                        <img src={PIZZA_IMG_URL} alt="Olive theme" className="h-full w-full object-cover filter contrast-110" />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#4A5844]/95 via-transparent to-black/20" />
                        <div className="absolute bottom-2 inset-x-2 text-white text-center">
                          <p className="font-display text-[11px] font-bold leading-tight">Artisan Crust</p>
                          <span className="text-[9px] font-bold text-amber-200">Dine-In</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: CONTENT CALENDAR */}
              {activeTab === "calendar" && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/[0.08] pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-primary">
                          Tab 4 • Content Calendar
                        </span>
                        <span className="rounded-full bg-sky-500/15 border border-sky-500/30 px-2 py-0.5 text-[10px] font-bold text-sky-400">
                          Auto-Sync
                        </span>
                      </div>
                      <h3 className="font-display text-xl font-bold text-white">
                        October 2026 Social Schedule
                      </h3>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="rounded-xl bg-gradient-to-r from-primary via-orange-500 to-rose-500 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs">
                        Week View
                      </span>
                      <span className="rounded-xl border border-white/[0.08] bg-[#0E1017] px-3.5 py-1.5 text-xs font-medium text-zinc-400">
                        Month View
                      </span>
                      <Button
                        size="sm"
                        onClick={onSignIn}
                        className="h-9 gap-1.5 rounded-xl bg-white text-zinc-900 font-medium hover:bg-zinc-100 text-xs shadow-md"
                      >
                        <CalendarDays className="h-3.5 w-3.5" />
                        <span>Schedule Post</span>
                      </Button>
                    </div>
                  </div>

                  {/* Scheduled Queue Cards */}
                  <div className="grid gap-3 sm:grid-cols-3">
                    {/* Post 1 */}
                    <div className="rounded-2xl border border-white/[0.08] bg-[#161824] p-4 shadow-lg">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-white">Wed, Oct 14 • 12:00 PM</span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400">
                          <Check className="h-3 w-3" /> Posted
                        </span>
                      </div>
                      <div className="mt-3 flex items-center gap-3">
                        <img src={CAFE_IMG_URL} alt="Weekend Brunch" className="h-14 w-12 rounded-xl object-cover shadow-sm border border-white/10" />
                        <div>
                          <p className="text-xs font-bold text-white">Margherita & Brunch</p>
                          <p className="text-[11px] text-zinc-400">Instagram Feed & Story</p>
                          <p className="text-[10px] text-emerald-400 font-medium">314 engagements</p>
                        </div>
                      </div>
                    </div>

                    {/* Post 2 */}
                    <div className="rounded-2xl border border-white/[0.08] bg-[#161824] p-4 shadow-lg">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-white">Fri, Oct 16 • 5:30 PM</span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400">
                          <Check className="h-3 w-3" /> Posted
                        </span>
                      </div>
                      <div className="mt-3 flex items-center gap-3">
                        <img src={PIZZA_IMG_URL} alt="Pizza night" className="h-14 w-12 rounded-xl object-cover shadow-sm border border-white/10" />
                        <div>
                          <p className="text-xs font-bold text-white">Pizza night, sorted.</p>
                          <p className="text-[11px] text-zinc-400">Instagram Feed</p>
                          <p className="text-[10px] text-emerald-400 font-medium">489 engagements</p>
                        </div>
                      </div>
                    </div>

                    {/* Post 3: Scheduled Next */}
                    <div className="rounded-2xl border-2 border-primary/40 bg-primary/10 p-4 shadow-lg">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-primary">Sat, Oct 18 • 4:00 PM</span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/15 border border-sky-500/30 px-2.5 py-0.5 text-[10px] font-bold text-sky-400">
                          <Clock3 className="h-3 w-3" /> Scheduled
                        </span>
                      </div>
                      <div className="mt-3 flex items-center gap-3">
                        <img src={PIZZA_IMG_URL} alt="Two pizzas offer" className="h-14 w-12 rounded-xl object-cover shadow-sm border border-white/10" />
                        <div>
                          <p className="text-xs font-bold text-white">Two pizzas for $24</p>
                          <p className="text-[11px] text-zinc-300">Queued for Meta Feed</p>
                          <span className="text-[10px] text-primary font-bold">In 16 hours</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: META & INSTAGRAM CONNECT */}
              {activeTab === "accounts" && (
                <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
                  <div className="space-y-4 rounded-2xl border border-white/[0.08] bg-[#161824] p-5 shadow-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-primary">
                        Tab 5 • Connected Channels
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400">
                        <ShieldCheck className="h-3.5 w-3.5" /> Meta Verified
                      </span>
                    </div>

                    <h3 className="font-display text-xl font-bold text-white">
                      Official Meta OAuth 2.0 Integration
                    </h3>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Publishing through PostPilot connects to your verified Meta Business / Creator account.
                      Zero sketchy bots. 100% compliant with Instagram Terms of Service.
                    </p>

                    {/* Connected Account Card */}
                    <div className="rounded-2xl border border-white/[0.08] bg-[#0E1017] p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-11 w-11 rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 p-0.5">
                            <div className="h-full w-full rounded-full bg-[#161824] flex items-center justify-center font-bold text-white">
                              L
                            </div>
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <p className="text-sm font-bold text-white">@luigispizzeria</p>
                              <CheckCircle2 className="h-4 w-4 text-primary" />
                            </div>
                            <p className="text-xs text-zinc-400">Instagram Business Account • 14.8k followers</p>
                          </div>
                        </div>
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 text-xs font-bold text-emerald-400">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> Active
                        </span>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3 border-t border-white/[0.08] pt-3 text-xs">
                        <div>
                          <p className="text-zinc-400">Auto-Publish to Feed:</p>
                          <p className="font-bold text-emerald-400">Enabled</p>
                        </div>
                        <div>
                          <p className="text-zinc-400">Story Sync:</p>
                          <p className="font-bold text-emerald-400">Enabled</p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-3.5 text-xs text-amber-200 leading-relaxed">
                      💡 <strong>Creator / Business Note:</strong> Meta Graph API requires an Instagram Professional account linked to a Facebook Page to allow direct publishing.
                    </div>
                  </div>

                  {/* Right Security & Reliability box */}
                  <div className="flex flex-col justify-between rounded-2xl border border-white/[0.08] bg-[#161824] p-5 shadow-lg">
                    <div>
                      <h4 className="font-display text-lg font-bold text-white">
                        Why We Use Official Meta Graph API
                      </h4>
                      <ul className="mt-3 space-y-3 text-xs text-zinc-300">
                        <li className="flex items-start gap-2.5">
                          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                          <span><strong className="text-white">Zero Shadowban Risk:</strong> We never scrape or emulate devices. Everything goes through Meta's approved endpoints.</span>
                        </li>
                        <li className="flex items-start gap-2.5">
                          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                          <span><strong className="text-white">Full Resolution Images:</strong> Posters are delivered at crisp 1080×1350 feed resolution without compression blur.</span>
                        </li>
                        <li className="flex items-start gap-2.5">
                          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                          <span><strong className="text-white">Instant 1-Click Disconnect:</strong> You retain complete control of your account permissions at all times.</span>
                        </li>
                      </ul>
                    </div>

                    <Button
                      size="sm"
                      onClick={onSignIn}
                      className="mt-6 h-10 gap-2 rounded-xl bg-gradient-to-r from-primary via-orange-500 to-rose-500 text-white hover:shadow-md hover:shadow-primary/30 text-xs font-semibold"
                    >
                      <Instagram className="h-4 w-4" />
                      <span>Connect Your Instagram Account</span>
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 4. "How PostPilot Works" (3 Simple Steps) */}
      <section id="how-it-works" className="scroll-mt-20 py-20 sm:py-28 bg-[#090A0E]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <span className="text-xs font-bold uppercase tracking-wider text-primary">
              EFFORTLESS WORKFLOW
            </span>
            <h2 className="mt-2 font-display text-3xl sm:text-5xl font-bold text-white">
              From Raw Idea to Published Post in 3 Steps
            </h2>
            <p className="mt-3 text-base text-zinc-400">
              No Photoshop tutorials, no caption writer's block, no switching between 5 apps.
            </p>
          </div>

          <div className="mt-14 grid gap-8 md:grid-cols-3">
            {/* Step 1 */}
            <div className="relative rounded-2xl border border-white/[0.08] bg-[#12141D] p-7 shadow-xl shadow-black/40 transition-all hover:border-white/20">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-primary via-orange-500 to-rose-500 text-base font-bold text-white shadow-md shadow-primary/25">
                1
              </span>
              <h3 className="mt-5 font-display text-xl font-bold text-white">
                Enter Your Promotion
              </h3>
              <p className="mt-2 text-sm text-zinc-400 leading-relaxed">
                Describe your weekly special, seasonal event, new menu item, or flash sale in plain words.
                Include any dates or prices if applicable.
              </p>
            </div>

            {/* Step 2 */}
            <div className="relative rounded-2xl border border-white/[0.08] bg-[#12141D] p-7 shadow-xl shadow-black/40 transition-all hover:border-white/20">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-primary via-orange-500 to-rose-500 text-base font-bold text-white shadow-md shadow-primary/25">
                2
              </span>
              <h3 className="mt-5 font-display text-xl font-bold text-white">
                AI Crafts Posters & Captions
              </h3>
              <p className="mt-2 text-sm text-zinc-400 leading-relaxed">
                Our automated studio analyzes your promotion, crafts 4 high-converting headline variations, and
                generates matching photorealistic artwork strictly formatted in your brand colors and typography.
              </p>
            </div>

            {/* Step 3 */}
            <div className="relative rounded-2xl border border-white/[0.08] bg-[#12141D] p-7 shadow-xl shadow-black/40 transition-all hover:border-white/20">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-primary via-orange-500 to-rose-500 text-base font-bold text-white shadow-md shadow-primary/25">
                3
              </span>
              <h3 className="mt-5 font-display text-xl font-bold text-white">
                1-Click Publish or Queue
              </h3>
              <p className="mt-2 text-sm text-zinc-400 leading-relaxed">
                Send directly to your Instagram Business feed, add to your story, or queue it up
                in the content calendar for peak evening engagement.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Key Features Grid */}
      <section id="features" className="scroll-mt-20 py-20 sm:py-28 bg-[#0D0F14]/90 border-t border-white/[0.08]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <span className="text-xs font-bold uppercase tracking-wider text-primary">
              BUILT FOR GROWTH
            </span>
            <h2 className="mt-2 font-display text-3xl sm:text-5xl font-bold text-white">
              Everything You Need to Dominate Local Social Media
            </h2>
            <p className="mt-3 text-base text-zinc-400">
              Say goodbye to generic AI templates that look fake. PostPilot creates designs that feel custom-crafted.
            </p>
          </div>

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: <Zap className="h-5 w-5 text-primary" />,
                title: "Instant Multi-Variation Creation",
                desc: "Transforms your raw offer into 4 tailored headline options and complete conversion captions in under 2 seconds. Zero waiting.",
              },
              {
                icon: <Palette className="h-5 w-5 text-primary" />,
                title: "Locked Brand Kits",
                desc: "Never post off-brand again. Your colors, typography, and logo auto-apply to every graphic.",
              },
              {
                icon: <Instagram className="h-5 w-5 text-primary" />,
                title: "Direct Meta Publishing",
                desc: "Verified Meta Graph API connection for safe, reliable publishing without phone notifications.",
              },
              {
                icon: <CalendarDays className="h-5 w-5 text-primary" />,
                title: "Content Calendar & Queues",
                desc: "Map your weekly promotions in advance. Edit captions and times whenever plans shift.",
              },
              {
                icon: <Sparkles className="h-5 w-5 text-primary" />,
                title: "Photorealistic Backgrounds",
                desc: "Generates commercial-grade food, retail, and lifestyle visual backdrops styled specifically for your business niche.",
              },
              {
                icon: <ShieldCheck className="h-5 w-5 text-primary" />,
                title: "Google 1-Click Sign-In",
                desc: "Fast, passwordless Google authentication. Secure sessions with zero friction.",
              },
            ].map((f) => (
              <div key={f.title} className="rounded-2xl border border-white/[0.08] bg-[#141622] p-6 shadow-xl shadow-black/40 transition-all hover:border-white/20">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
                  {f.icon}
                </div>
                <h3 className="mt-4 font-display text-lg font-bold text-white">{f.title}</h3>
                <p className="mt-2 text-sm text-zinc-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. FAQ Section */}
      <section id="faq" className="scroll-mt-20 py-20 sm:py-28 bg-[#090A0E]">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <span className="text-xs font-bold uppercase tracking-wider text-primary">
              FREQUENTLY ASKED QUESTIONS
            </span>
            <h2 className="mt-2 font-display text-3xl sm:text-4xl font-bold text-white">
              Got Questions? We've Got Answers.
            </h2>
          </div>

          <div className="mt-10 divide-y divide-white/[0.08] border-y border-white/[0.08]">
            {[
              {
                q: "Do I need any graphic design experience?",
                a: "None at all. PostPilot is built specifically for restaurant owners, café managers, boutique founders, and busy creators who want studio-quality social posts without spending hours in design software.",
              },
              {
                q: "Can I connect a personal Instagram account?",
                a: "Meta Graph API guidelines require an Instagram Professional (Business or Creator) account linked to a Facebook Page for automated publishing. Switching your Instagram account to Professional is completely free in the Instagram mobile app under Settings > Account Type.",
              },
              {
                q: "Can I edit the headlines, prices, and captions before posting?",
                a: "Yes! Every single headline, price badge, date string, and caption text is 100% editable. You can adjust the copy on the fly or hit 'Regenerate' to get fresh options.",
              },
              {
                q: "Can I download high-res PNG posters to post manually?",
                a: "Absolutely. In the AI Poster Studio, you can download the 1080×1350 high-res PNG canvas at any time for printing flyers, posting to WhatsApp status, or sharing anywhere.",
              },
              {
                q: "How does Google Sign-In work?",
                a: "We use 1-click Google OAuth. There are no passwords to remember. Your workspace, brand kits, and scheduled posts are linked securely to your Google profile.",
              },
            ].map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div key={faq.q} className="py-4">
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="flex w-full items-center justify-between text-left text-base font-semibold text-white transition hover:text-primary"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`h-5 w-5 text-zinc-500 transition-transform duration-200 ${
                        isOpen ? "rotate-180 text-primary" : ""
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <p className="mt-3 text-sm text-zinc-400 leading-relaxed pr-6">
                      {faq.a}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 7. Bottom CTA Banner */}
      <section className="py-20 sm:py-24 bg-gradient-to-b from-[#141622] via-[#0F1118] to-[#090A0E] border-t border-white/[0.08] text-white">
        <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.06] border border-white/10 px-3.5 py-1 text-xs font-semibold text-white/90">
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            <span>Ready in under 60 seconds</span>
          </span>

          <h2 className="mt-5 font-display text-3xl sm:text-5xl font-bold tracking-tight text-white leading-tight">
            Put Your Social Media Marketing <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-primary via-orange-400 to-rose-400 bg-clip-text text-transparent italic">
              on Autopilot Today.
            </span>
          </h2>

          <p className="mx-auto mt-4 max-w-xl text-base text-zinc-400">
            Join local restaurants, coffee shops, and modern brands who turn their daily specials into paying customers with PostPilot.
          </p>

          <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-4">
            {isAuthenticated ? (
              <Button
                onClick={handlePrimaryAction}
                className="h-13 w-full sm:w-auto min-w-[260px] gap-3 rounded-xl bg-gradient-to-r from-primary via-orange-500 to-rose-500 text-white text-base font-semibold shadow-lg shadow-primary/30 hover:shadow-primary/45 transition-all"
              >
                <span>Open Your Workspace</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={onSignIn}
                disabled={googleLoading}
                className="h-13 w-full sm:w-auto min-w-[260px] gap-3 rounded-xl bg-gradient-to-r from-primary via-orange-500 to-rose-500 text-white text-base font-semibold shadow-lg shadow-primary/30 hover:shadow-primary/45 transition-all"
              >
                {googleLoading ? (
                  <LoaderCircle className="h-5 w-5 animate-spin text-white" />
                ) : (
                  <GoogleIcon className="h-5 w-5" />
                )}
                <span>Continue with Google</span>
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>

          <p className="mt-4 text-xs text-zinc-500">
            Instant 1-click access. No credit card required.
          </p>
        </div>
      </section>

      {/* 8. Attractive & Rich Footer */}
      <footer className="border-t border-white/[0.08] bg-[#07080B] text-white pt-16 pb-12 text-xs">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
            {/* Brand & Mission column */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-primary via-orange-500 to-rose-500 text-white shadow-md shadow-primary/25">
                  <Send className="h-4 w-4" />
                </span>
                <span className="font-display text-2xl font-bold tracking-tight text-white">postpilot</span>
              </div>
              <p className="max-w-sm text-sm leading-relaxed text-zinc-400">
                The neighborhood places and modern creators people love deserve to be seen. Make room for the real work that makes your business special.
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-[11px] font-medium text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Meta Graph API Operational
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.05] border border-white/10 px-3 py-1 text-[11px] font-medium text-zinc-300">
                  <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                  Verified Meta Partner
                </span>
              </div>
            </div>

            {/* Column 2: Product & Tabs */}
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">Product Tour</p>
              <ul className="mt-4 space-y-2.5 text-sm text-zinc-400">
                <li>
                  <a href="#showcase" className="hover:text-primary transition-colors flex items-center gap-1.5">
                    <span>AI Poster Studio</span>
                  </a>
                </li>
                <li>
                  <a href="#showcase" className="hover:text-primary transition-colors flex items-center gap-1.5">
                    <span>Smart Copywriter</span>
                  </a>
                </li>
                <li>
                  <a href="#showcase" className="hover:text-primary transition-colors flex items-center gap-1.5">
                    <span>Brand Kit Customizer</span>
                  </a>
                </li>
                <li>
                  <a href="#showcase" className="hover:text-primary transition-colors flex items-center gap-1.5">
                    <span>Content Calendar</span>
                  </a>
                </li>
                <li>
                  <a href="#showcase" className="hover:text-primary transition-colors flex items-center gap-1.5">
                    <span>Meta & Instagram Connect</span>
                  </a>
                </li>
              </ul>
            </div>

            {/* Column 3: Use Cases */}
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">Who It's For</p>
              <ul className="mt-4 space-y-2.5 text-sm text-zinc-400">
                <li>Restaurants & Pizzerias</li>
                <li>Coffee Shops & Bakeries</li>
                <li>Boutiques & Retail Stores</li>
                <li>Local Fitness & Wellness</li>
                <li>Digital Creators & Freelancers</li>
              </ul>
            </div>

            {/* Column 4: Quick Action & Security */}
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                {isAuthenticated ? "Your Workspace" : "Get Started"}
              </p>
              <p className="mt-4 text-xs text-zinc-400 leading-relaxed">
                {isAuthenticated
                  ? "You are signed in. Access your active posters, brand kit, and content schedule."
                  : "Connect your account and create your first Instagram post in 60 seconds."}
              </p>
              {isAuthenticated ? (
                <Button
                  onClick={handlePrimaryAction}
                  className="mt-4 h-10 w-full gap-2 rounded-xl bg-gradient-to-r from-primary via-orange-500 to-rose-500 text-white text-xs font-semibold shadow-md shadow-primary/25 hover:shadow-primary/40 transition-all"
                >
                  <span>Go to Workspace</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              ) : (
                <Button
                  onClick={onSignIn}
                  disabled={googleLoading}
                  className="mt-4 h-10 w-full gap-2 rounded-xl bg-gradient-to-r from-primary via-orange-500 to-rose-500 text-white text-xs font-semibold shadow-md shadow-primary/25 hover:shadow-primary/40 transition-all"
                >
                  {googleLoading ? (
                    <LoaderCircle className="h-4 w-4 animate-spin text-white" />
                  ) : (
                    <GoogleIcon className="h-4 w-4" />
                  )}
                  <span>Continue with Google</span>
                </Button>
              )}
              <p className="mt-2 text-[10px] text-zinc-500 text-center">
                {isAuthenticated ? "Active Session" : "Fast & secure. Zero password needed."}
              </p>
            </div>
          </div>

          {/* Sub-footer divider & links */}
          <div className="mt-14 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-zinc-500">
            <p>
              © {new Date().getFullYear()} PostPilot Inc. Built for the people behind the places you love.
            </p>
            <div className="flex flex-wrap items-center gap-6">
              <a href="#features" className="hover:text-white transition">Features</a>
              <a href="#how-it-works" className="hover:text-white transition">How it Works</a>
              <a href="#faq" className="hover:text-white transition">FAQ</a>
              <span>•</span>
              <span>Official Meta Graph API Compliant</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
