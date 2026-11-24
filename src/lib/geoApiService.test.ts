import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  generateLiveLocationHashtags,
  lookupPostalCodeLive,
  searchLocationsLive,
  fetchLiveCitiesByState,
  type GeoLocationItem,
} from "./geoApiService";

describe("geoApiService — Live Third-Party Location & Geocoding Service", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("generateLiveLocationHashtags", () => {
    it("generates rich city, state, postal code and national tags", () => {
      const tags = generateLiveLocationHashtags({
        name: "Rajpath Club",
        city: "Ahmedabad",
        state: "Gujarat",
        stateCode: "GJ",
        country: "India",
        countryCode: "IN",
        postalCode: "380059",
      });

      expect(tags).toContain("#RajpathClub");
      expect(tags).toContain("#Ahmedabad");
      expect(tags).toContain("#AhmedabadCity");
      expect(tags).toContain("#AhmedabadBusiness");
      expect(tags).toContain("#Gujarat");
      expect(tags).toContain("#GujaratBusiness");
      expect(tags).toContain("#GJ");
      expect(tags).toContain("#380059");
      expect(tags).toContain("#India");
      expect(tags).toContain("#MadeInIndia");
    });

    it("generates US tags for Los Angeles, CA with 90210 ZIP", () => {
      const tags = generateLiveLocationHashtags({
        name: "Beverly Hills",
        city: "Beverly Hills",
        state: "California",
        stateCode: "CA",
        country: "United States",
        countryCode: "US",
        postalCode: "90210",
      });

      expect(tags).toContain("#BeverlyHills");
      expect(tags).toContain("#BeverlyHillsCity");
      expect(tags).toContain("#BeverlyHillsCA");
      expect(tags).toContain("#California");
      expect(tags).toContain("#CA");
      expect(tags).toContain("#90210");
      expect(tags).toContain("#USA");
      expect(tags).toContain("#UnitedStates");
      expect(tags).toContain("#USABusiness");
    });
  });

  describe("lookupPostalCodeLive (Zippopotam API)", () => {
    it("looks up US 90210 returning Beverly Hills, CA", async () => {
      const mockResponse = {
        country: "United States",
        "country abbreviation": "US",
        "post code": "90210",
        places: [
          {
            "place name": "Beverly Hills",
            state: "California",
            "state abbreviation": "CA",
          },
        ],
      };

      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
        new Response(JSON.stringify(mockResponse), { status: 200 })
      );

      const result = await lookupPostalCodeLive("90210", "us");
      expect(result).not.toBeNull();
      if (result) {
        expect(result.city).toBe("Beverly Hills");
        expect(result.state).toBe("California");
        expect(result.stateCode).toBe("CA");
        expect(result.countryCode).toBe("US");
        expect(result.hashtags).toContain("#BeverlyHills");
      }
    });

    it("returns null gracefully if postal code is not found", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
        new Response(JSON.stringify({}), { status: 404 })
      );

      const result = await lookupPostalCodeLive("00000", "us");
      expect(result).toBeNull();
    });
  });

  describe("searchLocationsLive (Nominatim API)", () => {
    it("searches and normalizes live location query", async () => {
      const mockNominatim = [
        {
          place_id: 12345,
          name: "Rajpath Club",
          display_name: "Rajpath Club, Bodakdev, Ahmedabad, Gujarat, 380059, India",
          address: {
            city: "Ahmedabad",
            state: "Gujarat",
            country: "India",
            country_code: "in",
            postcode: "380059",
          },
        },
      ];

      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
        new Response(JSON.stringify(mockNominatim), { status: 200 })
      );

      const results = await searchLocationsLive("Rajpath Club Ahmedabad");
      expect(results.length).toBe(1);
      const first = results[0];
      expect(first?.name).toBe("Rajpath Club");
      expect(first?.city).toBe("Ahmedabad");
      expect(first?.state).toBe("Gujarat");
      expect(first?.countryCode).toBe("IN");
      expect(first?.hashtags).toContain("#RajpathClub");
      expect(first?.hashtags).toContain("#Ahmedabad");
    });

    it("returns empty array when query is empty or less than 2 chars", async () => {
      const results = await searchLocationsLive(" ");
      expect(results).toEqual([]);
    });

    it("handles network failure gracefully without throwing", async () => {
      vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(new Error("Network timeout"));
      const results = await searchLocationsLive("Unknown Place");
      expect(results).toEqual([]);
    });
  });

  describe("fetchLiveCitiesByState (CountriesNow API with fallback)", () => {
    it("fetches live cities from CountriesNow API", async () => {
      const mockCities = {
        error: false,
        msg: "cities retrieved",
        data: ["Los Angeles", "San Francisco", "San Diego", "San Jose", "Sacramento"],
      };

      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
        new Response(JSON.stringify(mockCities), { status: 200 })
      );

      const cities = await fetchLiveCitiesByState("United States", "California");
      expect(cities.length).toBeGreaterThan(0);
      const names = cities.map((c) => c.name);
      expect(names).toContain("Los Angeles");
      expect(names).toContain("San Francisco");
    });

    it("falls back to built-in cities if CountriesNow fails or rate limits", async () => {
      vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(new Error("Rate limited"));

      const cities = await fetchLiveCitiesByState("United States", "TX");
      expect(cities.length).toBeGreaterThanOrEqual(1);
      const names = cities.map((c) => c.name);
      expect(names).toContain("Houston");
    });
  });
});

