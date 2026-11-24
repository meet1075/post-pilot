# Diya AI (PostPilot) — Comprehensive Project Documentation

> **Diya AI (PostPilot)** is an enterprise-grade AI marketing agency and social media automation SaaS. It empowers businesses, marketing agencies, and content creators to generate single-shot, pixel-perfect promotional posters and flyers, craft audience-targeted captions and localized hashtags, and immediately publish or schedule content across multiple social platforms (Instagram, Facebook, LinkedIn, X/Twitter, TikTok, Pinterest, YouTube) using a unified workspace.

---

## Table of Contents
1. [Executive Overview & Architecture](#1-executive-overview--architecture)
2. [High-Level System Architecture](#2-high-level-system-architecture)
3. [Repository & Directory Structure](#3-repository--directory-structure)
4. [Complete Feature Catalog](#4-complete-feature-catalog)
   - [4.1 AI Single-Shot Poster & Flyer Studio](#41-ai-single-shot-poster--flyer-studio)
   - [4.2 AI Caption & Hook Generator](#42-ai-caption--hook-generator)
   - [4.3 Geocoding & Localized Hashtags Engine](#43-geocoding--localized-hashtags-engine)
   - [4.4 Multi-Workspace & Business Management](#44-multi-workspace--business-management)
   - [4.5 Brand Kit Studio & Asset Management](#45-brand-kit-studio--asset-management)
   - [4.6 Social Media Publishing & Multi-Channel Scheduling](#46-social-media-publishing--multi-channel-scheduling)
   - [4.7 Post History, Rescheduling & Calendar Actions](#47-post-history-rescheduling--calendar-actions)
   - [4.8 Social Feed Previews (Instagram & Facebook Mockups)](#48-social-feed-previews-instagram--facebook-mockups)
   - [4.9 Curated Templates & Industry Presets Library](#49-curated-templates--industry-presets-library)
   - [4.10 Cloudflare R2 Media Storage Layer](#410-cloudflare-r2-media-storage-layer)
   - [4.11 Authentication & User Session Management](#411-authentication--user-session-management)
   - [4.12 Observability, Telemetry & Audit Logs](#412-observability-telemetry--audit-logs)
   - [4.13 Offline-First & Mock Fallback Resilience](#413-offline-first--mock-fallback-resilience)
5. [Component Catalog & UI Hierarchy](#5-component-catalog--ui-hierarchy)
   - [5.1 Main App & Views (`src/components/`)](#51-main-app--views-srccomponents)
   - [5.2 Social Components (`src/components/social/`)](#52-social-components-srccomponentssocial)
   - [5.3 UI Primitives (`src/components/ui/`)](#53-ui-primitives-srccomponentsui)
6. [Backend Server Functions Reference (`src/api/`)](#6-backend-server-functions-reference-srcapi)
7. [Database Models & Prisma Schema](#7-database-models--prisma-schema)
8. [External Integrations & Services](#8-external-integrations--services)
9. [Testing, Quality Assurance & Verification](#9-testing-quality-assurance--verification)
10. [Deployment & Environment Configuration](#10-deployment--environment-configuration)

---

## 1. Executive Overview & Architecture

### Core Tech Stack
| Layer | Technologies |
|---|---|
| **Frontend Framework** | React 19, TanStack Start (SSR + Vite 6 + Nitro) |
| **Routing** | TanStack Router (`src/routes/`) with file-based routing |
| **Styling & Design System** | Tailwind CSS v3, Radix UI primitives, Lucide Icons, Sonner |
| **Database & ORM** | Neon Serverless PostgreSQL, Prisma ORM 6.x (`@prisma/adapter-neon`) |
| **Authentication** | Better Auth with Google OAuth 2.0 & Session JWTs |
| **Object Storage** | Cloudflare R2 (S3-compatible API via `@aws-sdk/client-s3`), zero egress fees |
| **AI Generation Engine** | OpenAI API (DALL-E 3, GPT-4o vision repair, GPT-4o caption writer) |
| **Social Publishing API** | Zernio API (multi-platform token handling, scheduling, Webhooks) |
| **Geocoding & Location** | OpenStreetMap Nominatim API, Overpass API, and client-side geo-taxonomy |
| **Testing Suite** | Vitest with JSDOM, React Testing Library, and unit mock harnesses |

---

## 2. High-Level System Architecture

```mermaid
flowchart TD
    User["End User / Marketer"] -->|Browser HTTPS| TanStack["TanStack Start SSR (React 19 + Vite + Nitro)"]

    subgraph ClientApp["Client-Side Application (SPA / Hydrated SSR)"]
        IndexRoute["Index Route (src/routes/index.tsx)"]
        LandingRoute["Landing Page (src/routes/landing.tsx)"]
        SubViews["Views: Home | Create | Templates | Scheduled | Posted | Brand Kit | Accounts | Settings"]
        SocialPreviews["Social Previews (Instagram Grid/Feed, Facebook)"]
        WorkspaceCache["Local Storage Workspace Cache (src/lib/workspaceCache.ts)"]
    end

    subgraph ServerFn["TanStack Start Server Functions (src/api/)"]
        PostersFn["posters.ts (DALL-E 3 / Sharp / Vision Repair)"]
        CaptionsFn["captions.ts (GPT-4o Caption & Hashtag Engine)"]
        PublishFn["publish.ts (Zernio Publish / Schedule / Cancel)"]
        BrandKitFn["brand-kit.ts (Brand Kit CRUD & R2 Uploads)"]
        BusinessesFn["businesses.ts (Multi-Business Workspaces)"]
        AccountsFn["accounts.ts (Zernio OAuth & Account Links)"]
        AuthFn["auth.ts (Better Auth Session / OAuth)"]
        LogsFn["logs.ts (Telemetry & Audit Records)"]
    end

    subgraph ExternalServices["External Cloud & AI Services"]
        OpenAI["OpenAI API (DALL-E 3, GPT-4o)"]
        Zernio["Zernio API (Instagram, Facebook, LinkedIn, X, TikTok, etc.)"]
        CloudflareR2["Cloudflare R2 Object Storage (Global CDN)"]
        NeonDB["Neon Serverless Postgres (Prisma ORM)"]
        OSM["OpenStreetMap Nominatim / Overpass (Geocoding)"]
    end

    TanStack --> ClientApp
    IndexRoute --> ServerFn
    PostersFn --> OpenAI
    PostersFn --> CloudflareR2
    CaptionsFn --> OpenAI
    PublishFn --> Zernio
    BrandKitFn --> CloudflareR2
    BrandKitFn --> NeonDB
    BusinessesFn --> NeonDB
    AccountsFn --> Zernio
    AccountsFn --> NeonDB
    AuthFn --> NeonDB
```

---

## 3. Repository & Directory Structure

```
pixel-perfect-pixels/
├── prisma/
│   └── schema.prisma             # Primary Prisma ORM database models and relations
├── public/
│   ├── diya_logo.svg             # Source vector mark for Diya AI brand logo
│   ├── favicon.svg               # Square 1:1 responsive SVG favicon (centered viewport)
│   ├── favicon.png               # High-res PNG favicon
│   └── mock/                     # Curated offline/demo assets
├── scripts/
│   ├── deploy-migrate.mjs        # Production migration runner executed on build
│   ├── test-poster.ts            # CLI harness to test DALL-E poster generation
│   ├── test-captions.ts          # CLI harness to test caption generation
│   └── test-flyer.ts             # CLI harness to test flyer generation
├── src/
│   ├── api/                      # TanStack Start backend server functions ('use server')
│   │   ├── accounts.ts           # Social platform account connection & Zernio linking
│   │   ├── auth.ts               # User authentication session and Google OAuth
│   │   ├── brand-kit.ts          # Brand kit retrieval, saving, and logo R2 uploads
│   │   ├── businesses.ts         # Multi-workspace creation, switching, and settings
│   │   ├── captions.ts           # AI caption hooks, tone adjustments, and hashtags
│   │   ├── logs.ts               # Audit logs and API telemetry query endpoints
│   │   ├── posters.ts            # Poster generation, aspect ratio formats, text repair
│   │   ├── posts.ts              # Post history listing, cancellation, rescheduling
│   │   └── publish.ts           # Direct social media posting and scheduled jobs
│   ├── components/               # React UI views, layouts, and feature components
│   │   ├── DiyaLogo.tsx          # Responsive brand logo component (SVG mark + text)
│   │   ├── LandingPage.tsx       # Public landing page with hero, features, and login
│   │   ├── LogsViewerModal.tsx   # Live modal for inspecting API telemetry and audit logs
│   │   ├── TemplatesView.tsx     # Curated promotional templates browsing interface
│   │   ├── social/               # Social platform specialized components
│   │   │   ├── account-select-item.tsx   # Dropdown item for channel selection
│   │   │   ├── platform-account-card.tsx # Account connection card in Accounts view
│   │   │   ├── SocialFeedPreview.tsx     # Realistic Instagram & Facebook feed mockups
│   │   │   └── social-platform-icon.tsx  # Platform brand icons (IG, FB, LinkedIn, X, etc.)
│   │   └── ui/                   # Modular Radix UI primitives styled with Tailwind CSS
│   ├── hooks/
│   │   └── use-mobile.tsx        # Responsive viewport detection hook
│   ├── lib/                      # Core business logic, storage, database, and utilities
│   │   ├── apiResponse.ts        # Standardized API response formatting helpers
│   │   ├── auditLogger.ts        # Structured audit trail recording into PostgreSQL
│   │   ├── auth-client.ts        # Better Auth client-side SDK integration
│   │   ├── auth-server.ts        # Better Auth server configuration and secret handling
│   │   ├── branding.ts           # Color palettes, typography defaults, and branding helpers
│   │   ├── db.ts                 # Direct database connection pooler and DDL migrations
│   │   ├── error-capture.ts      # Global client-side and server-side error trapping
│   │   ├── geoApiService.ts      # OpenStreetMap Nominatim and Overpass geocoding client
│   │   ├── geoHashtags.ts        # Location taxonomy and hierarchical hashtag builder
│   │   ├── logger.ts             # Structured server logger and telemetry recording
│   │   ├── mockApi.ts            # Offline fallback dataset and mock server functions
│   │   ├── posterCanvas.ts       # HTML5 Canvas / Sharp text and badge compositing
│   │   ├── prisma.ts             # Instantiated PrismaClient with Neon serverless adapter
│   │   ├── rateLimit.ts          # Token bucket and sliding-window rate limiting engine
│   │   ├── storage.ts            # Cloudflare R2 S3 client, pre-signed URLs, and uploaders
│   │   ├── templates.ts          # Hardcoded template metadata, prompts, and previews
│   │   ├── utils.ts              # Tailwind CSS class merging (`cn`) utility
│   │   ├── validators.ts         # Zod schemas for input validation
│   │   └── workspaceCache.ts     # Client localStorage persistence for instant business switching
│   ├── routes/                   # TanStack Router route definitions
│   │   ├── __root.tsx            # Root layout with HTML shell, meta tags, and theme providers
│   │   ├── index.tsx             # Primary workspace dashboard containing all core views
│   │   ├── landing.tsx           # Route for `/landing`
│   │   └── auth/
│   │       └── zernio-callback.tsx # OAuth return redirect handler for social accounts
│   ├── router.tsx                # TanStack Router router instantiation
│   └── styles.css                # Global Tailwind CSS definitions and custom variables
├── package.json                  # Dependencies, scripts, and package overrides
├── tsconfig.json                 # TypeScript compiler options
└── vite.config.ts                # Vite 6 configuration with TanStack Start plugin
```

---

## 4. Complete Feature Catalog

### 4.1 AI Single-Shot Poster & Flyer Studio
- **What it does**: Allows users to generate high-converting, publication-ready promotional graphics and flyers with a single prompt. Unlike generic image generators, Diya AI embeds legible text, brand marks, contact badges, and promotion details directly into the artwork.
- **Aspect Ratio Formats**:
  - `4:5 Portrait` (1080×1350): Ideal for Instagram feed posts and LinkedIn carousels.
  - `1:1 Square` (1080×1080): Universal standard for Facebook, Instagram, and Twitter.
  - `9:16 Story / Reel` (1080×1920): Built for Instagram Stories, TikTok, and YouTube Shorts.
- **Visual Styles**:
  - `Modern Minimal`, `Bold & Vibrant`, `Luxury & Elegant`, `Festive & Celebratory`, `Dark Neon Studio`, and `Retro / Vintage`.
- **Badge & Brand Integration**:
  - Users can toggle brand badges to be included on the flyer: `Logo`, `Brand Colors`, `Phone Number`, `Location / City`, `Website URL`, and `Email Address`.
- **Targeted Text Edits & Visual Repair**:
  - If AI-generated text has typos or needs adjustments, users can trigger text repair (`repairPosterServerFn`) or composited canvas text replacement (`src/lib/posterCanvas.ts`).
- **Where it lives**:
  - Frontend: `Create` view in `src/routes/index.tsx`.
  - Backend: [src/api/posters.ts](file:///home/meet/pixel-perfect-pixels/src/api/posters.ts).
  - Canvas Engine: [src/lib/posterCanvas.ts](file:///home/meet/pixel-perfect-pixels/src/lib/posterCanvas.ts).

### 4.2 AI Caption & Hook Generator
- **What it does**: Automatically crafts engaging, conversion-focused social captions tailored to the poster's visual theme and marketing objective.
- **Customization Controls**:
  - **Tone**: `Friendly`, `Professional`, `Excited / High Energy`, `Urgent (FOMO)`, `Minimalist`, `Storytelling`.
  - **Emoji Density**: `None`, `Subtle (1-2)`, `Expressive (3-5)`, `Maximum / Playful`.
  - **Call to Action (CTA)**: Customizable closing directive (e.g., "Link in bio", "Comment below", "DM to claim discount").
  - **Hook Selector**: Generates 3 unique opening hooks (curiosity hook, question hook, stat/pain-point hook) so users can pick the highest-converting opener.
- **Where it lives**:
  - Frontend: `Create` step 3 in `src/routes/index.tsx`.
  - Backend: [src/api/captions.ts](file:///home/meet/pixel-perfect-pixels/src/api/captions.ts).

### 4.3 Geocoding & Localized Hashtags Engine
- **What it does**: Solves local discovery by allowing users to select Country, State, City, and Pincode through fast, local, searchable dropdowns and automatically generating high-engagement local hashtags for social media publishing.
- **Local-Only 3-Country Architecture**:
  - **3 Primary Markets**: United States (🇺🇸), Canada (🇨🇦), and India (🇮🇳).
  - **All States & Provinces**:
    - **United States**: All 50 states + Washington D.C. (51 total).
    - **Canada**: All 10 provinces + 3 territories (13 total).
    - **India**: All 28 states + 8 Union Territories (36 total).
  - **All Cities per State**: Comprehensive directory of cities across all states and provinces.
  - **Pincodes Only**: Displays clean, authentic postal/PIN codes (e.g. `380059`, `10001`, `M5V`) without verbose area clutter.
  - **In-Dropdown Search**: Interactive `SearchableSelect` component allows typing to filter Country, State, City, and Pincode directly within each dropdown.
  - **100% Local Execution**: Operates purely in-memory with zero network latency or external API downtime.
- **Where it lives**:
  - Frontend: `Create` view in [src/routes/index.tsx](file:///home/meet/pixel-perfect-pixels/src/routes/index.tsx).
  - Component: [src/components/SearchableSelect.tsx](file:///home/meet/pixel-perfect-pixels/src/components/SearchableSelect.tsx).
  - Taxonomy & Engine: [src/lib/geoHashtags.ts](file:///home/meet/pixel-perfect-pixels/src/lib/geoHashtags.ts).
  - Frontend: Location picker in `src/routes/index.tsx`.
  - Geocoding Service: [src/lib/geoApiService.ts](file:///home/meet/pixel-perfect-pixels/src/lib/geoApiService.ts).
  - Hashtag Taxonomy: [src/lib/geoHashtags.ts](file:///home/meet/pixel-perfect-pixels/src/lib/geoHashtags.ts).

### 4.4 Multi-Workspace & Business Management
- **What it does**: Enables marketing agencies and multi-brand owners to manage distinct businesses from a single dashboard. Each business has its own isolated brand kit, social accounts, post history, and analytics.
- **Instant Switching & Zero-Flicker Cache**:
  - Uses `src/lib/workspaceCache.ts` to persist businesses and active workspace IDs in `localStorage`.
  - When switching brands, the workspace updates instantly without layout shifts or reloading delays.
- **Where it lives**:
  - Frontend: Business Switcher header dropdown and `AddBusinessModal` in `src/routes/index.tsx`.
  - Backend: [src/api/businesses.ts](file:///home/meet/pixel-perfect-pixels/src/api/businesses.ts).
  - Cache Utility: [src/lib/workspaceCache.ts](file:///home/meet/pixel-perfect-pixels/src/lib/workspaceCache.ts).

### 4.5 Brand Kit Studio & Asset Management
- **What it does**: Stores and applies brand identity parameters across all creative generation tools.
- **Capabilities**:
  - **Brand Logo Upload**: Direct upload to Cloudflare R2 bucket (`branding/`) with support for SVG, PNG, WebP, and JPG.
  - **Color Palette Builder**: Primary, secondary, and accent color pickers with hex input and preset palettes (`Tomato`, `Neon Cyan`, `Emerald`, `Deep Velvet`, etc.).
  - **Typography**: Brand font selection applied to promotional text (`Fraunces`, `Inter`, `Playfair Display`, `Outfit`, `Montserrat`).
  - **Contact & Business Metadata**: Default address, phone, email, website, and default hashtags automatically pre-filled in post creation.
- **Where it lives**:
  - Frontend: `Brand kit` view in `src/routes/index.tsx`.
  - Backend: [src/api/brand-kit.ts](file:///home/meet/pixel-perfect-pixels/src/api/brand-kit.ts).
  - Storage Utility: [src/lib/storage.ts](file:///home/meet/pixel-perfect-pixels/src/lib/storage.ts).

### 4.6 Social Media Publishing & Multi-Channel Scheduling
- **What it does**: Connects to the Zernio social publishing API to publish posts immediately or schedule drops for a future date and time across supported platforms.
- **Supported Channels**:
  - **Instagram**: Feed posts, single-image posts, captions, location tags.
  - **Facebook**: Page posts, status updates, high-res image uploads.
  - **LinkedIn**: Company page and personal profile visual updates.
  - **X (Twitter)**: Tweet cards with attached image media.
  - **TikTok, Pinterest, YouTube**: Channel connectors ready for expanded media types.
- **Multi-Account Limit Enforcement**:
  - Checks business billing tier to enforce account limits (e.g., Free tier allows 1 connected channel per platform; Pro tier allows unlimited channels).
- **Where it lives**:
  - Frontend: Publishing screen in `src/routes/index.tsx` and `Accounts` tab.
  - Backend: [src/api/publish.ts](file:///home/meet/pixel-perfect-pixels/src/api/publish.ts) and [src/api/accounts.ts](file:///home/meet/pixel-perfect-pixels/src/api/accounts.ts).

### 4.7 Post History, Rescheduling & Calendar Actions
- **What it does**: Provides complete lifecycle control over scheduled and published posts.
- **Key Actions**:
  - **Scheduled View**: Displays upcoming scheduled posts with badges, platform icons, target publication date/time, and thumbnail previews.
  - **Reschedule Modal**: Opens a date and time picker to change delivery schedules. Designed specifically with high-contrast white calendar picker icons for dark-mode legibility.
  - **Cancellation**: One-click cancellation that unschedules the job in Zernio and updates the database record to `cancelled`.
  - **Posted View**: Searchable, filterable archive of all published content with direct links to live social posts.
- **Where it lives**:
  - Frontend: `Scheduled` and `Posted` views in `src/routes/index.tsx`.
  - Backend: [src/api/posts.ts](file:///home/meet/pixel-perfect-pixels/src/api/posts.ts).

### 4.8 Social Feed Previews (Instagram & Facebook Mockups)
- **What it does**: Gives users realistic, pixel-accurate previews of how their poster and caption will appear inside native mobile social media feeds before posting.
- **Preview Modes**:
  - **Instagram 3×3 Grid**: Visualizes how the post fits into the business's existing profile aesthetic.
  - **Instagram Feed Post**: Header with profile picture, verified badge, location geotag, 4:5 image container, engagement action bar (heart, comment, share, bookmark), and caption with "more" fold.
  - **Facebook Feed Post**: Page name, timestamp, privacy globe icon, post text, and full-width image card.
- **Where it lives**:
  - Component: [src/components/social/SocialFeedPreview.tsx](file:///home/meet/pixel-perfect-pixels/src/components/social/SocialFeedPreview.tsx).

### 4.9 Curated Templates & Industry Presets Library
- **What it does**: Accelerates design by providing battle-tested marketing templates grouped by business niche.
- **Categories**:
  - `Restaurants & Cafes`: Weekend brunch specials, chef recommendations, new menu drops.
  - `Retail & E-Commerce`: Flash sales, Black Friday discounts, new arrival showcases.
  - `Tech & SaaS`: Feature releases, product milestones, webinar announcements.
  - `Fitness & Wellness`: Gym memberships, personal training packages, health tips.
  - `Real Estate & Luxury`: Open house showcases, VIP property tours, architectural spotlights.
- **1-Click Auto-Fill**: Clicking "Use Template" populates the prompt, style, aspect ratio, and suggested badges into the `Create` view.
- **Where it lives**:
  - Component: [src/components/TemplatesView.tsx](file:///home/meet/pixel-perfect-pixels/src/components/TemplatesView.tsx).
  - Presets Data: [src/lib/templates.ts](file:///home/meet/pixel-perfect-pixels/src/lib/templates.ts).

### 4.10 Cloudflare R2 Media Storage Layer
- **What it does**: Handles all binary media storage (generated posters, uploaded logos, brand assets) using Cloudflare R2 object storage.
- **Zero Egress Architecture**:
  - Utilizes AWS S3 compatible SDK (`@aws-sdk/client-s3`) pointing to Cloudflare R2 endpoints.
  - Assets are served globally via edge CDN domain (`https://pub-f951b9a0f9b3407c901fb638d50404db.r2.dev`) with zero egress bandwidth charges.
  - Automatic key structuring: `branding/{businessId}/{filename}`, `posters/{businessId}/{uuid}.png`.
- **Where it lives**:
  - Storage Utility: [src/lib/storage.ts](file:///home/meet/pixel-perfect-pixels/src/lib/storage.ts).

### 4.11 Authentication & User Session Management
- **What it does**: Provides secure user authentication and session persistence using Better Auth.
- **Features**:
  - **Google OAuth 2.0**: 1-click sign-in with Google profile sync.
  - **Session Management**: Cookie-based HMAC signed JWT sessions with server-side validation (`getServerSession`).
  - **Route Protection**: Unauthenticated users visiting `/` are shown the public landing page with sign-in prompts; authenticated users are directed to their active business workspace.
- **Where it lives**:
  - Server Auth: [src/lib/auth-server.ts](file:///home/meet/pixel-perfect-pixels/src/lib/auth-server.ts).
  - Client Auth: [src/lib/auth-client.ts](file:///home/meet/pixel-perfect-pixels/src/lib/auth-client.ts).
  - Auth Server Functions: [src/api/auth.ts](file:///home/meet/pixel-perfect-pixels/src/api/auth.ts).

### 4.12 Observability, Telemetry & Audit Logs
- **What it does**: Tracks all server API calls, latency, errors, and security-relevant mutations for full operational transparency.
- **Tables**:
  - `ApiLog`: Records service, endpoint, HTTP status, execution duration in milliseconds, and error stack traces.
  - `AuditLog`: Records user ID, business ID, action (e.g. `POST_CREATED`, `BRAND_KIT_UPDATED`), IP address, and user agent.
- **Logs Viewer Modal**:
  - Built-in UI modal accessible from Settings and navigation to inspect recent API requests, filter by error status, and review audit logs in real time.
- **Where it lives**:
  - Modal: [src/components/LogsViewerModal.tsx](file:///home/meet/pixel-perfect-pixels/src/components/LogsViewerModal.tsx).
  - Logger Engine: [src/lib/logger.ts](file:///home/meet/pixel-perfect-pixels/src/lib/logger.ts) and [src/lib/auditLogger.ts](file:///home/meet/pixel-perfect-pixels/src/lib/auditLogger.ts).
  - API Endpoint: [src/api/logs.ts](file:///home/meet/pixel-perfect-pixels/src/api/logs.ts).

### 4.13 Offline-First & Mock Fallback Resilience
- **What it does**: PostPilot is designed so that local development, testing, and UI demonstrations can operate seamlessly even when external third-party API credentials (OpenAI, Zernio, Cloudflare R2, or Neon) are unavailable or experiencing downtime.
- **Mechanics**:
  - Server functions check environment variable availability and catch external network errors, gracefully returning deterministic mock records from `src/lib/mockApi.ts`.
  - Ensures the user interface remains fully interactive and responsive at all times.
- **Where it lives**:
  - Mock Library: [src/lib/mockApi.ts](file:///home/meet/pixel-perfect-pixels/src/lib/mockApi.ts).

---

## 5. Component Catalog & UI Hierarchy

### 5.1 Main App & Views (`src/components/`)

| Component | Path | Description & Props |
|---|---|---|
| `DiyaLogo` | `src/components/DiyaLogo.tsx` | Brand header logo rendering the vector flame mark (`/diya_logo.svg`) and high-contrast glowing text "AI DIGITAL MARKETING". Props: `className`, `iconOnly?: boolean`. |
| `LandingPage` | `src/components/LandingPage.tsx` | Complete public landing page shown to unauthenticated visitors. Features hero banner, animated poster showcase, feature breakdown, social proof, and Google login CTA. |
| `LogsViewerModal` | `src/components/LogsViewerModal.tsx` | Slide-out or centered dialog displaying recent `ApiLog` and `AuditLog` records with status filters (All vs. Errors only). Props: `open: boolean`, `onOpenChange: (open: boolean) => void`. |
| `TemplatesView` | `src/components/TemplatesView.tsx` | Grid catalog of industry marketing flyer templates with category filters and 1-click template selection. Props: `onSelectTemplate: (template: TemplateItem) => void`. |

### 5.2 Social Components (`src/components/social/`)

| Component | Path | Description & Props |
|---|---|---|
| `SocialFeedPreview` | `src/components/social/SocialFeedPreview.tsx` | Interactive social feed preview with tabs for Instagram Grid, Instagram Feed Post, and Facebook Feed Post. Props: `platform: "instagram" \| "facebook"`, `imageUrl: string`, `caption: string`, `businessName: string`, `location?: string`, `avatarUrl?: string`. |
| `AccountSelectItem` | `src/components/social/account-select-item.tsx` | Custom dropdown item displaying social channel platform icon, username handle, and active status pill. |
| `PlatformAccountCard`| `src/components/social/platform-account-card.tsx`| Card used in the Accounts view to display connected account status, account name, follower metrics, and Connect/Disconnect action buttons. |
| `SocialPlatformIcon` | `src/components/social/social-platform-icon.tsx` | SVG icon renderer for social platforms (`instagram`, `facebook`, `linkedin`, `twitter`, `tiktok`, `pinterest`, `youtube`). Props: `platform: string`, `className?: string`. |

### 5.3 UI Primitives (`src/components/ui/`)
Built with Radix UI and Tailwind CSS for accessibility (WAI-ARIA) and smooth theme integration:
- `accordion.tsx`: Expandable collapsible disclosure sections.
- `alert-dialog.tsx` & `alert.tsx`: Confirmation prompts for destructive actions (e.g. deleting a business or cancelling a post).
- `aspect-ratio.tsx`: Responsive image containers preserving 4:5, 1:1, or 9:16 aspect ratios.
- `avatar.tsx`: User and business profile picture rendering with fallback initials.
- `badge.tsx`: Status tags (`Scheduled`, `Posted`, `Draft`, `Active`).
- `button.tsx`: Styled button variants (`default`, `secondary`, `destructive`, `outline`, `ghost`, `link`) with glowing gradient styles.
- `calendar.tsx`: Date picker component with custom dark-mode styling and high-contrast icon visibility.
- `card.tsx`: Card shell, header, title, and content wrappers.
- `carousel.tsx`: Embla carousel integration for scrolling poster options.
- `dialog.tsx` & `drawer.tsx`: Accessible modal dialogs and slide-out mobile drawers.
- `dropdown-menu.tsx`: Context and action menus for workspace switching and post options.
- `input.tsx` & `textarea.tsx`: Form inputs with focus rings and error states.
- `popover.tsx`: Floating overlays for color pickers and date pickers.
- `progress.tsx`: Animated progress bar for AI poster generation steps.
- `select.tsx`: Native-styled select dropdowns.
- `sheet.tsx`: Mobile slide-in navigation sidebar.
- `sonner.tsx`: Floating toast notification system for feedback (e.g. "Post scheduled successfully").
- `tabs.tsx`: Tabbed navigation interfaces (e.g. Feed vs. Grid preview).
- `tooltip.tsx`: Informational hover tooltips.

---

## 6. Backend Server Functions Reference (`src/api/`)

All backend functions are built using TanStack Start's `createServerFn` with type-safe arguments and responses:

### `posters.ts`
- `generatePosterOptionsServerFn`:
  - Input: `{ prompt: string; businessId?: string; count?: number; stylePreset?: string; format?: "4:5" | "1:1" | "9:16"; badges?: BadgeConfig }`
  - Action: Constructs prompt with brand kit colors, font, and contact details. Calls OpenAI DALL-E 3 / GPT-image model. Uploads generated images to Cloudflare R2 and persists records in `poster_generations`.
  - Output: `{ success: true, options: PosterOption[] }`
- `repairPosterServerFn`:
  - Input: `{ generationId: string; imageUrl: string; instruction: string }`
  - Action: Sends image and user repair instruction to OpenAI GPT-4o vision to adjust text rendering or fix visual artifacts.
  - Output: `{ success: true, repairedImageUrl: string }`

### `captions.ts`
- `generateCaptionsServerFn`:
  - Input: `{ prompt: string; tone: string; emojiDensity: string; cta: string; businessId?: string; location?: string }`
  - Action: Invokes OpenAI GPT-4o to produce 3 caption hooks, formatted body text, call-to-action variants, and localized hashtags based on location.
  - Output: `{ success: true, suggestions: CaptionSuggestion[] }`

### `publish.ts`
- `publishPostServerFn`:
  - Input: `{ businessId: string; platforms: string[]; caption: string; imageUrl: string; scheduledFor?: string; location?: string }`
  - Action: Validates account limits, dispatches direct publish or scheduled payload to Zernio API, creates `Post` record in database.
  - Output: `{ success: true, post: PostRecord }`

### `posts.ts`
- `getPostsServerFn`: Fetches recent published and scheduled posts for the active business.
- `reschedulePostServerFn`:
  - Input: `{ postId: string; newScheduledDate: string }`
  - Action: Updates Zernio scheduled job date/time and updates local database `scheduledFor` field.
- `cancelScheduledPostServerFn`:
  - Input: `{ postId: string }`
  - Action: Deletes scheduled drop from Zernio queue and updates status to `cancelled`.

### `businesses.ts`
- `getBusinessesServerFn`: Returns all active business workspaces belonging to the authenticated user.
- `createBusinessServerFn`: Creates a new business workspace, initializes default brand kit, and links owner.
- `updateBusinessServerFn`: Updates business name, tagline, timezone, or business type.

### `brand-kit.ts`
- `getBrandKitServerFn`: Retrieves brand colors, fonts, logo URL, and contact toggles for a business.
- `updateBrandKitServerFn`: Saves updated brand kit settings.
- `uploadLogoServerFn`: Accepts base64 logo data, uploads directly to Cloudflare R2 bucket, and returns public CDN URL.

### `accounts.ts`
- `getConnectedAccountsServerFn`: Queries Zernio API for connected social channels and active profiles.
- `disconnectAccountServerFn`: Revokes platform token and deletes connected account record.
- `getZernioConnectUrlServerFn`: Generates OAuth authorization URL for connecting Instagram, Facebook, LinkedIn, etc.

### `logs.ts`
- `getApiLogsServerFn`: Queries `api_log` and `audit_log` tables with pagination and error filters.

---

## 7. Database Models & Prisma Schema

The application uses PostgreSQL (hosted on Neon) managed via Prisma ORM (`prisma/schema.prisma`):

| Model | Table | Description |
|---|---|---|
| `User` | `users` | Primary user profile storing email, verification state, and login timestamps. |
| `Business` | `businesses` | Multi-tenant workspace representing a company or brand. Holds business name, location, timezone, and relations to brand kit and posts. |
| `BrandKit` | `brand_kits` | Visual identity configuration (brand colors array, typography font, logo R2 key, public URL, contact phone/email/website). |
| `SocialAccount` | `social_accounts` | Connected social channel linked via Zernio (platform, account handle, account ID, access token, avatar URL). |
| `Post` | `posts` | Published or scheduled social post (image URL, caption, scheduled timestamp, status: `draft` \| `scheduled` \| `published` \| `failed` \| `cancelled`, Zernio job ID). |
| `PosterGeneration` | `poster_generations` | Audit trail of AI image generation prompts, parameters, and generated R2 image URLs. |
| `CaptionSuggestion` | `caption_suggestions` | AI-generated caption options, hooks, and selected text. |
| `AuditLog` | `audit_log` | Security audit trail recording user actions (`action`, `resourceType`, `metadata`, `ipAddress`, `userAgent`). |
| `ApiLog` | `api_log` | Observability log recording service endpoints, HTTP status codes, latency in ms, and error messages. |
| `BetterUser` | `user` | Better Auth user identity table. |
| `BetterSession` | `session` | Active Better Auth user sessions with token and expiration. |
| `BetterAccount` | `account` | Better Auth OAuth provider accounts (e.g. Google OAuth tokens). |

---

## 8. External Integrations & Services

### 8.1 OpenAI API
- **DALL-E 3 & GPT-Image**: Generates commercial-grade advertising posters in 1080×1350, 1080×1080, and 1080×1920 formats.
- **GPT-4o Vision**: Inspects generated posters for spelling errors, visual flaws, or text clashing, allowing automated repair.
- **GPT-4o Text**: Crafts high-converting caption hooks, persuasive marketing copy, and hashtag packages.

### 8.2 Zernio Social API
- **Unified Social Middleware**: Provides single-API multi-platform OAuth connection, scheduling engine, and immediate publishing across Instagram, Facebook, LinkedIn, X, TikTok, Pinterest, and YouTube.
- **Webhooks & Status**: Tracks publishing status and errors from social networks.

### 8.3 Cloudflare R2 Object Storage
- **S3 API Compatibility**: All asset uploads use standard S3 client operations with R2 endpoint configuration.
- **Public Edge CDN**: Assets are served through high-speed edge CDN with no egress fees.

### 8.4 OpenStreetMap Nominatim & Overpass
- **Live Geocoding**: Real-time address and city searching used to generate localized hashtags for Instagram and Facebook discovery.

---

## 9. Testing, Quality Assurance & Verification

### Strict Industry-Standard Testing Rule
As mandated by project rules, any new feature, update, or logic modification includes dedicated Vitest tests.

### Test Suite Execution
```bash
# Run the complete test suite once
npm run test

# Run tests in interactive watch mode
npm run test:watch
```

### Existing Automated Test Suites
- `src/api/accounts.test.ts`: Verifies social account linking, disconnection, and profile listing.
- `src/api/brand-kit.test.ts`: Validates brand kit updates, color parsing, and R2 logo uploads.
- `src/api/businesses.test.ts`: Tests multi-business creation, workspace switching, and deletion.
- `src/api/captions.test.ts`: Verifies caption generation, hook variants, and emoji density logic.
- `src/api/posters.test.ts`: Tests single-shot poster prompt construction and repair functions.
- `src/api/posts.test.ts`: Validates post retrieval, rescheduling date formatting, and cancellation.
- `src/api/publish.test.ts`: Tests immediate publishing and scheduling payloads to Zernio.
- `src/components/social/SocialFeedPreview.test.tsx`: Component tests for Instagram and Facebook feed mockups.
- `src/components/TemplatesView.test.tsx`: Tests template category filtering and selection events.
- `src/lib/geoApiService.test.ts`: Tests Nominatim location geocoding and fallback handling.
- `src/lib/geoHashtags.test.ts`: Tests location taxonomy and hierarchical hashtag generation.
- `src/lib/mockApi.test.ts`: Validates mock data integrity and offline fallbacks.
- `src/lib/storage.test.ts`: Tests Cloudflare R2 URL generation and key sanitization.
- `src/lib/templates.test.ts`: Verifies template registry data structures and prompt validity.
- `src/lib/validators.test.ts`: Validates Zod input schemas for forms and server functions.
- `src/test/app-routing.test.tsx`: Verifies route rendering and unauthenticated vs. authenticated states.

---

## 10. Deployment & Environment Configuration

### Required Environment Variables (`.env`)
```ini
# Database (Neon Serverless Postgres)
DATABASE_URL="postgresql://user:pass@ep-cool-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require"

# Better Auth & Security
BETTER_AUTH_SECRET="your-64-byte-hex-secret"
BETTER_AUTH_URL="https://your-domain.com"
GOOGLE_CLIENT_ID="your-google-oauth-client-id"
GOOGLE_CLIENT_SECRET="your-google-oauth-client-secret"

# Cloudflare R2 Object Storage
R2_ACCOUNT_ID="your-cloudflare-account-id"
R2_ACCESS_KEY_ID="your-r2-access-key-id"
R2_SECRET_ACCESS_KEY="your-r2-secret-access-key"
R2_BUCKET_NAME="post-pilot"
R2_PUBLIC_URL="https://pub-f951b9a0f9b3407c901fb638d50404db.r2.dev"

# OpenAI API
OPENAI_API_KEY="sk-proj-..."

# Zernio Social Publishing API
ZERNIO_API_KEY="your-zernio-api-key"
ZERNIO_API_BASE="https://api.zernio.com/v1"
```

### Build & Migration Workflow
```bash
# Automated database migration and asset bundling
npm run build

# Start preview server
npm run preview
```

The build command automatically runs `scripts/deploy-migrate.mjs` to synchronize database schemas on Neon before compiling the Vite/Nitro SSR production bundle.

