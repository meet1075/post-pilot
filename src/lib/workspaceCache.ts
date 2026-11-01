import type { SocialPost } from "./mockApi";
import type { BusinessSummaryItem } from "@/api/businesses";

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

export interface CachedConnectedAccount {
  id?: string;
  platform: string;
  handle: string;
  status?: string;
  externalAccountId?: string;
}

export interface WorkspaceCacheData {
  businessId: string;
  brandKit: BrandKitData;
  connectedAccounts: CachedConnectedAccount[];
  posts: SocialPost[];
  billingInfo?: { isFreeTier: boolean; notice: string; totalAccounts: number };
  cachedAt?: number;
}

const ACTIVE_BIZ_KEY = "postpilot_active_business_id";
const BUSINESSES_CACHE_KEY = "postpilot_cached_businesses";
const WS_CACHE_PREFIX = "postpilot_ws_cache_";

export function getActiveBusinessId(): string {
  if (typeof window === "undefined") return "";
  try {
    return localStorage.getItem(ACTIVE_BIZ_KEY) || "";
  } catch {
    return "";
  }
}

export function saveActiveBusinessId(bizId: string): void {
  if (typeof window === "undefined" || !bizId) return;
  try {
    localStorage.setItem(ACTIVE_BIZ_KEY, bizId);
    document.cookie = `postpilot_active_business=${encodeURIComponent(bizId)}; path=/; max-age=31536000; SameSite=Lax`;
  } catch {}
}

export function getCachedBusinesses(): BusinessSummaryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(BUSINESSES_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return [];
}

export function saveCachedBusinesses(list: BusinessSummaryItem[]): void {
  if (typeof window === "undefined" || !Array.isArray(list)) return;
  try {
    localStorage.setItem(BUSINESSES_CACHE_KEY, JSON.stringify(list));
  } catch {}
}

export function getCachedWorkspace(bizId?: string | null): WorkspaceCacheData | null {
  if (typeof window === "undefined" || !bizId) return null;
  try {
    const raw = localStorage.getItem(`${WS_CACHE_PREFIX}${bizId}`);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {}
  return null;
}

export function saveCachedWorkspace(bizId: string, data: Partial<WorkspaceCacheData>): void {
  if (typeof window === "undefined" || !bizId) return;
  try {
    const existing = getCachedWorkspace(bizId);
    const billing = data.billingInfo || existing?.billingInfo;
    const updated: WorkspaceCacheData = {
      businessId: bizId,
      brandKit: data.brandKit || existing?.brandKit || ({} as any),
      connectedAccounts: data.connectedAccounts ?? existing?.connectedAccounts ?? [],
      posts: data.posts ?? existing?.posts ?? [],
      cachedAt: Date.now(),
      ...(billing ? { billingInfo: billing } : {}),
    };
    localStorage.setItem(`${WS_CACHE_PREFIX}${bizId}`, JSON.stringify(updated));
  } catch {}
}
