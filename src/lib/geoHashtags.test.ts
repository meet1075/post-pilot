import { describe, it, expect } from "vitest";
import {
  getGeoCountries,
  getGeoStates,
  getGeoCities,
  getGeoAreas,
  generateLocationHashtags,
  formatHashtag,
} from "./geoHashtags";

describe("geoHashtags Engine", () => {
  it("retrieves supported countries including India, USA, UK, UAE, Canada, Australia", () => {
    const countries = getGeoCountries();
    expect(countries.length).toBeGreaterThanOrEqual(6);
    const countryIds = countries.map((c) => c.id);
    expect(countryIds).toContain("india");
    expect(countryIds).toContain("usa");
    expect(countryIds).toContain("uk");
    expect(countryIds).toContain("uae");
    expect(countryIds).toContain("canada");
    expect(countryIds).toContain("australia");
  });

  it("retrieves all 50 US states + DC for the United States", () => {
    const states = getGeoStates("usa");
    expect(states.length).toBeGreaterThanOrEqual(50);
    const codes = states.map((s) => s.code);
    expect(codes).toContain("NY");
    expect(codes).toContain("CA");
    expect(codes).toContain("TX");
    expect(codes).toContain("FL");
    expect(codes).toContain("IL");
    expect(codes).toContain("WA");
    expect(codes).toContain("GA");
  });

  it("retrieves cities by country ID or name (case-insensitive)", () => {
    const usCities = getGeoCities("usa");
    expect(usCities.length).toBeGreaterThan(15);
    const cityNames = usCities.map((c) => c.name);
    expect(cityNames).toContain("New York City");
    expect(cityNames).toContain("Los Angeles");
    expect(cityNames).toContain("Houston");
    expect(cityNames).toContain("Dallas");
    expect(cityNames).toContain("Miami");

    const indiaCities = getGeoCities("INDIA");
    expect(indiaCities.length).toBeGreaterThan(10);
    const inCityNames = indiaCities.map((c) => c.name);
    expect(inCityNames).toContain("Ahmedabad");
    expect(inCityNames).toContain("Surat");
    expect(inCityNames).toContain("Mumbai");
    expect(inCityNames).toContain("Bengaluru");

    expect(getGeoCities("unknown-country")).toEqual([]);
    expect(getGeoCities("")).toEqual([]);
  });

  it("filters cities by state code or state name", () => {
    const texasCities = getGeoCities("usa", "TX");
    expect(texasCities.length).toBeGreaterThanOrEqual(4);
    const txCityNames = texasCities.map((c) => c.name);
    expect(txCityNames).toContain("Houston");
    expect(txCityNames).toContain("Dallas");
    expect(txCityNames).toContain("Austin");

    const caCities = getGeoCities("usa", "California");
    expect(caCities.length).toBeGreaterThanOrEqual(4);
    const caCityNames = caCities.map((c) => c.name);
    expect(caCityNames).toContain("Los Angeles");
    expect(caCityNames).toContain("San Francisco");
    expect(caCityNames).toContain("San Diego");
  });

  it("retrieves areas with postal codes by country and city", () => {
    const ahmedabadAreas = getGeoAreas("india", "ahmedabad");
    expect(ahmedabadAreas.length).toBeGreaterThan(0);
    const postalCodes = ahmedabadAreas.map((a) => a.postalCode);
    expect(postalCodes).toContain("380059");
    expect(postalCodes).toContain("380054");

    const nycAreas = getGeoAreas("usa", "new-york");
    expect(nycAreas.length).toBeGreaterThan(0);
    const nycZips = nycAreas.map((a) => a.postalCode);
    expect(nycZips).toContain("10001");
    expect(nycZips).toContain("11201");

    expect(getGeoAreas("usa", "unknown-city")).toEqual([]);
    expect(getGeoAreas("", "")).toEqual([]);
  });

  it("formats hashtags cleanly and strips disallowed characters", () => {
    expect(formatHashtag("New York")).toBe("#NewYork");
    expect(formatHashtag("#Midtown-NYC!")).toBe("#MidtownNYC");
    expect(formatHashtag("380059")).toBe("#380059");
    expect(formatHashtag("")).toBe("");
  });

  it("generates multi-tiered hashtags for USA -> New York -> Midtown Chelsea", () => {
    const tags = generateLocationHashtags({
      countryId: "usa",
      cityId: "new-york",
      areaId: "midtown-chelsea",
    });

    expect(tags).toContain("#USA");
    expect(tags).toContain("#NewYork");
    expect(tags).toContain("#NewYorkCity");
    expect(tags).toContain("#MidtownNYC");
    expect(tags).toContain("#ChelseaNYC");
    expect(tags).toContain("#10001");
    // Verify all returned tags start with #
    tags.forEach((t) => expect(t.startsWith("#")).toBe(true));
  });

  it("generates multi-tiered hashtags for India -> Ahmedabad -> Rajpath Club Ground", () => {
    const tags = generateLocationHashtags({
      countryId: "india",
      cityId: "ahmedabad",
      areaId: "rajpath-sola",
    });

    expect(tags).toContain("#India");
    expect(tags).toContain("#Ahmedabad");
    expect(tags).toContain("#Amdavad");
    expect(tags).toContain("#RajpathClub");
    expect(tags).toContain("#SGHwy");
    expect(tags).toContain("#380059");
  });

  it("merges custom location input into suggested hashtags without duplicate tags", () => {
    const tags = generateLocationHashtags({
      countryId: "india",
      cityId: "ahmedabad",
      customLocation: "Rajpath Club Ground, Ahmedabad",
    });

    expect(tags).toContain("#RajpathClubGround");
    expect(tags).toContain("#Ahmedabad");
    expect(tags).toContain("#India");
    // Check no duplicate #Ahmedabad
    const ahmedabadOccurrences = tags.filter((t) => t.toLowerCase() === "#ahmedabad");
    expect(ahmedabadOccurrences.length).toBe(1);
  });

  it("gracefully handles missing or partial parameters without throwing errors", () => {
    expect(() => generateLocationHashtags({})).not.toThrow();
    expect(generateLocationHashtags({})).toEqual([]);

    const countryOnly = generateLocationHashtags({ countryId: "uk" });
    expect(countryOnly).toContain("#UK");
    expect(countryOnly).toContain("#UnitedKingdom");

    const cityOnly = generateLocationHashtags({ countryId: "uae", cityId: "dubai" });
    expect(cityOnly).toContain("#Dubai");
    expect(cityOnly).toContain("#UAE");
  });
});
