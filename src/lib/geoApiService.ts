/**
 * PostPilot — Third-Party Live Geo Location & Hashtag API Service
 *
 * Integrates open, high-speed third-party geolocation APIs:
 * 1. OpenStreetMap Nominatim: Global live autocomplete, venue & city geocoding
 * 2. Zippopotam.us: Instant postal / ZIP code lookup (US, India, UK, etc.)
 * 3. CountriesNow API: Live dynamic state-to-city expansion with offline fallback
 *
 * All requests feature in-memory caching, debouncing-friendly signatures,
 * timeout guards, and automated fallback to curated built-in datasets.
 */

import { formatHashtag, getGeoCities, type GeoCity } from "./geoHashtags";

export interface GeoLocationItem {
  id: string;
  label: string; // e.g. "Rajpath Club, Bodakdev, Ahmedabad, Gujarat, India"
  shortLabel: string; // e.g. "Rajpath Club, Ahmedabad"
  name: string;
  city: string;
  state: string;
  stateCode?: string;
  country: string;
  countryCode: string;
  postalCode?: string;
  hashtags: string[];
}

// In-memory cache to prevent redundant network calls and avoid rate limits
const searchCache = new Map<string, { data: GeoLocationItem[]; timestamp: number }>();
const stateCitiesCache = new Map<string, { data: GeoCity[]; timestamp: number }>();
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Normalizes query string for cache key
 */
function getCacheKey(prefix: string, ...args: string[]): string {
  return `${prefix}:${args.map((a) => a.trim().toLowerCase()).join(":")}`;
}

/**
 * Generates rich, high-converting social media hashtags from a resolved location
 */
export function generateLiveLocationHashtags(item: {
  name?: string;
  city?: string;
  state?: string;
  stateCode?: string;
  country?: string;
  countryCode?: string;
  postalCode?: string;
}): string[] {
  const tags = new Set<string>();

  const city = item.city?.trim();
  const state = item.state?.trim();
  const stateCode = item.stateCode?.trim().toUpperCase();
  const country = item.country?.trim();
  const postalCode = item.postalCode?.trim();
  const name = item.name?.trim();

  // Venue / Specific place tag (if distinct from city)
  if (name && city && name.toLowerCase() !== city.toLowerCase()) {
    const venueTag = formatHashtag(name);
    if (venueTag && venueTag.length > 2) tags.add(venueTag);
  }

  // City & City+State tags
  if (city) {
    const cityTag = formatHashtag(city);
    if (cityTag) {
      tags.add(cityTag);
      tags.add(formatHashtag(`${city}City`));
      tags.add(formatHashtag(`${city}Life`));
      tags.add(formatHashtag(`${city}Business`));
      tags.add(formatHashtag(`ShopLocal${city}`));
    }

    if (stateCode) {
      tags.add(formatHashtag(`${city.replace(/[^a-zA-Z0-9]/g, "")}${stateCode}`));
    }
  }

  // State tags
  if (state) {
    tags.add(formatHashtag(state));
    tags.add(formatHashtag(`${state}Business`));
  }
  if (stateCode) {
    tags.add(formatHashtag(stateCode));
  }

  // Postal / ZIP code tag
  if (postalCode) {
    tags.add(formatHashtag(postalCode));
  }

  // Country tags
  if (country) {
    tags.add(formatHashtag(country));
    tags.add(formatHashtag(`${country}Business`));
  }
  if (item.countryCode) {
    const cc = item.countryCode.toUpperCase();
    if (cc === "US") {
      tags.add("#USA");
      tags.add("#UnitedStates");
      tags.add("#USABusiness");
    } else if (cc === "IN") {
      tags.add("#India");
      tags.add("#MadeInIndia");
    } else if (cc === "GB" || cc === "UK") {
      tags.add("#UK");
      tags.add("#UnitedKingdom");
    } else if (cc === "AE") {
      tags.add("#UAE");
      tags.add("#Dubai");
    } else if (cc === "CA") {
      tags.add("#Canada");
    } else if (cc === "AU") {
      tags.add("#Australia");
    }
  }

  return Array.from(tags).filter(Boolean);
}

/**
 * 1. Zippopotam.us: Instant Postal/ZIP code lookup
 */
export async function lookupPostalCodeLive(
  postalCode: string,
  countryCode: string = "us"
): Promise<GeoLocationItem | null> {
  const cleanCode = postalCode.trim();
  const cc = (countryCode || "us").toLowerCase();
  const cacheKey = getCacheKey("zip", cc, cleanCode);

  const cached = searchCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data[0] || null;
  }

  try {
    const res = await fetch(`https://api.zippopotam.us/${cc}/${cleanCode}`, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(3500),
    });

    if (!res.ok) return null;
    const json = (await res.json()) as {
      country?: string;
      "country abbreviation"?: string;
      "post code"?: string;
      places?: Array<{
        "place name"?: string;
        state?: string;
        "state abbreviation"?: string;
      }>;
    };

    const place = json.places?.[0];
    if (!place || !place["place name"]) return null;

    const city = place["place name"];
    const state = place.state || "";
    const stateCode = place["state abbreviation"] || "";
    const country = json.country || "";
    const resolvedCC = json["country abbreviation"] || cc.toUpperCase();

    const shortLabel = stateCode ? `${city}, ${stateCode}` : `${city}, ${country}`;
    const label = `${city}, ${state || stateCode}, ${cleanCode}, ${country}`;

    const hashtags = generateLiveLocationHashtags({
      name: city,
      city,
      state,
      stateCode,
      country,
      countryCode: resolvedCC,
      postalCode: cleanCode,
    });

    const item: GeoLocationItem = {
      id: `zip-${resolvedCC}-${cleanCode}`,
      label,
      shortLabel,
      name: city,
      city,
      state,
      stateCode,
      country,
      countryCode: resolvedCC,
      postalCode: cleanCode,
      hashtags,
    };

    searchCache.set(cacheKey, { data: [item], timestamp: Date.now() });
    return item;
  } catch {
    return null;
  }
}

/**
 * 2. OpenStreetMap Nominatim: Live Global Autocomplete & Geocoding
 */
export async function searchLocationsLive(
  query: string,
  options?: { countryCode?: string | undefined } | undefined
): Promise<GeoLocationItem[]> {
  const q = query.trim();
  if (!q || q.length < 2) return [];

  const cc = options?.countryCode?.toLowerCase();
  const cacheKey = getCacheKey("nominatim", cc || "global", q);

  const cached = searchCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  // Check if query is a pure postal code (5 digit US or 6 digit India)
  if (/^\d{5}$/.test(q)) {
    const zipResult = await lookupPostalCodeLive(q, cc || "us");
    if (zipResult) return [zipResult];
  } else if (/^\d{6}$/.test(q)) {
    const zipResult = await lookupPostalCodeLive(q, cc || "in");
    if (zipResult) return [zipResult];
  }

  try {
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("q", q);
    url.searchParams.set("format", "json");
    url.searchParams.set("addressdetails", "1");
    url.searchParams.set("limit", "6");
    if (cc && cc.length === 2) {
      url.searchParams.set("countrycodes", cc);
    }

    const res = await fetch(url.toString(), {
      headers: {
        "User-Agent": "PostPilot-App/1.0 (contact@postpilot.local)",
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(4000),
    });

    if (!res.ok) return [];

    const json = (await res.json()) as Array<{
      place_id?: number | string;
      name?: string;
      display_name?: string;
      address?: {
        city?: string;
        town?: string;
        village?: string;
        suburb?: string;
        county?: string;
        state?: string;
        country?: string;
        country_code?: string;
        postcode?: string;
        leisure?: string;
        amenity?: string;
        road?: string;
      };
    }>;

    if (!Array.isArray(json) || json.length === 0) return [];

    const items: GeoLocationItem[] = json.map((entry, index) => {
      const addr = entry.address || {};
      const cityName = addr.city || addr.town || addr.village || addr.suburb || addr.county || entry.name || "";
      const stateName = addr.state || "";
      const countryName = addr.country || "";
      const countryCode = (addr.country_code || "").toUpperCase();
      const postalCode = addr.postcode || "";
      const placeName = entry.name || cityName;

      const shortLabel = [placeName, cityName !== placeName ? cityName : null, stateName]
        .filter(Boolean)
        .join(", ");

      const hashtags = generateLiveLocationHashtags({
        name: placeName,
        city: cityName,
        state: stateName,
        country: countryName,
        countryCode,
        postalCode,
      });

      return {
        id: String(entry.place_id || `loc-${index}-${q}`),
        label: entry.display_name || shortLabel,
        shortLabel,
        name: placeName,
        city: cityName,
        state: stateName,
        country: countryName,
        countryCode,
        postalCode,
        hashtags,
      };
    });

    searchCache.set(cacheKey, { data: items, timestamp: Date.now() });
    return items;
  } catch {
    return [];
  }
}

/**
 * 3. CountriesNow API: Live Cities for State with Offline Fallback
 */
export async function fetchLiveCitiesByState(
  countryName: string,
  stateName: string
): Promise<GeoCity[]> {
  const cName = countryName.trim();
  const sName = stateName.trim();
  if (!cName || !sName || sName.toLowerCase() === "all") {
    return getGeoCities(cName);
  }

  const cacheKey = getCacheKey("state_cities", cName, sName);
  const cached = stateCitiesCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  try {
    const url = `https://countriesnow.space/api/v0.1/countries/state/cities/q?country=${encodeURIComponent(
      cName
    )}&state=${encodeURIComponent(sName)}`;

    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(3500),
    });

    if (res.ok) {
      const json = (await res.json()) as {
        error?: boolean;
        data?: string[];
      };

      if (!json.error && Array.isArray(json.data) && json.data.length > 0) {
        const cities: GeoCity[] = json.data.map((cityName) => {
          const id = cityName.toLowerCase().replace(/[^a-z0-9]/g, "-");
          const tag = formatHashtag(cityName);
          return {
            id,
            name: cityName,
            stateOrRegion: sName,
            hashtags: tag
              ? [tag, formatHashtag(`${cityName}City`), formatHashtag(`${cityName}Business`)]
              : [],
            areas: [],
          };
        });

        stateCitiesCache.set(cacheKey, { data: cities, timestamp: Date.now() });
        return cities;
      }
    }
  } catch {
    // Graceful fallback on network timeout or rate limit
  }

  // Fallback to built-in curated cities
  return getGeoCities(cName, sName);
}

