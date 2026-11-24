import { describe, it, expect } from "vitest";
import {
  getGeoCountries,
  getGeoStates,
  getGeoCities,
  getGeoAreas,
  getGeoPincodes,
  generateLocationHashtags,
  formatHashtag,
} from "./geoHashtags";

describe("geoHashtags Engine (3 Primary Countries: USA, Canada, India)", () => {
  it("retrieves the 3 primary supported countries: USA, Canada, and India only", () => {
    const countries = getGeoCountries();
    expect(countries.length).toBe(3);
    const countryIds = countries.map((c) => c.id);
    expect(countryIds).toContain("usa");
    expect(countryIds).toContain("canada");
    expect(countryIds).toContain("india");
  });

  it("retrieves all 50 US states + DC (51 total) for the United States", () => {
    const states = getGeoStates("usa");
    expect(states.length).toBe(51);
    const codes = states.map((s) => s.code);
    expect(codes).toContain("NY");
    expect(codes).toContain("CA");
    expect(codes).toContain("TX");
    expect(codes).toContain("FL");
    expect(codes).toContain("IL");
    expect(codes).toContain("WA");
    expect(codes).toContain("GA");
    expect(codes).toContain("DC");
    expect(codes).toContain("WY");
  });

  it("retrieves all 10 provinces + 3 territories (13 total) for Canada", () => {
    const states = getGeoStates("canada");
    expect(states.length).toBe(13);
    const codes = states.map((s) => s.code);
    expect(codes).toContain("ON");
    expect(codes).toContain("QC");
    expect(codes).toContain("BC");
    expect(codes).toContain("AB");
    expect(codes).toContain("MB");
    expect(codes).toContain("SK");
    expect(codes).toContain("NS");
    expect(codes).toContain("NB");
    expect(codes).toContain("NL");
    expect(codes).toContain("PE");
    expect(codes).toContain("NT");
    expect(codes).toContain("NU");
    expect(codes).toContain("YT");
  });

  it("retrieves all 28 states + 8 Union Territories (36 total) for India", () => {
    const states = getGeoStates("india");
    expect(states.length).toBe(36);
    const codes = states.map((s) => s.code);
    // Major states
    expect(codes).toContain("GJ"); // Gujarat
    expect(codes).toContain("MH"); // Maharashtra
    expect(codes).toContain("KA"); // Karnataka
    expect(codes).toContain("TN"); // Tamil Nadu
    expect(codes).toContain("TS"); // Telangana
    expect(codes).toContain("UP"); // Uttar Pradesh
    expect(codes).toContain("RJ"); // Rajasthan
    expect(codes).toContain("WB"); // West Bengal
    expect(codes).toContain("KL"); // Kerala
    expect(codes).toContain("PB"); // Punjab
    // Union Territories
    expect(codes).toContain("DL"); // Delhi
    expect(codes).toContain("CH"); // Chandigarh
    expect(codes).toContain("JK"); // Jammu and Kashmir
    expect(codes).toContain("LA"); // Ladakh
    expect(codes).toContain("PY"); // Puducherry
    expect(codes).toContain("AN"); // Andaman and Nicobar
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

    const caCities = getGeoCities("canada");
    expect(caCities.length).toBeGreaterThan(5);
    const caCityNames = caCities.map((c) => c.name);
    expect(caCityNames).toContain("Toronto");
    expect(caCityNames).toContain("Vancouver");
    expect(caCityNames).toContain("Montreal");
    expect(caCityNames).toContain("Calgary");

    const indiaCities = getGeoCities("INDIA");
    expect(indiaCities.length).toBeGreaterThan(15);
    const inCityNames = indiaCities.map((c) => c.name);
    expect(inCityNames).toContain("Ahmedabad");
    expect(inCityNames).toContain("Surat");
    expect(inCityNames).toContain("Mumbai");
    expect(inCityNames).toContain("Bengaluru");
    expect(inCityNames).toContain("Delhi");

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

    const gujaratCities = getGeoCities("india", "GJ");
    expect(gujaratCities.length).toBeGreaterThanOrEqual(4);
    const gjCityNames = gujaratCities.map((c) => c.name);
    expect(gjCityNames).toContain("Ahmedabad");
    expect(gjCityNames).toContain("Surat");
    expect(gjCityNames).toContain("Vadodara");
    expect(gjCityNames).toContain("Rajkot");

    const ontarioCities = getGeoCities("canada", "ON");
    expect(ontarioCities.length).toBeGreaterThanOrEqual(3);
    const onCityNames = ontarioCities.map((c) => c.name);
    expect(onCityNames).toContain("Toronto");
    expect(onCityNames).toContain("Ottawa");
    expect(onCityNames).toContain("Mississauga");
  });

  it("retrieves clean pincodes (only postal code values) via getGeoPincodes", () => {
    // City-specific pincodes
    const ahmedabadPincodes = getGeoPincodes("india", "ahmedabad");
    expect(ahmedabadPincodes.length).toBeGreaterThan(0);
    const pinValues = ahmedabadPincodes.map((p) => p.postalCode);
    expect(pinValues).toContain("380059");
    expect(pinValues).toContain("380054");
    expect(pinValues).toContain("380015");
    expect(pinValues).toContain("380009");
    // Verify each item's name is only the pincode itself
    ahmedabadPincodes.forEach((p) => {
      expect(p.name).toBe(p.postalCode);
    });

    // US city pincodes (ZIP codes)
    const nyPincodes = getGeoPincodes("usa", "new-york");
    expect(nyPincodes.length).toBeGreaterThan(0);
    const nyZips = nyPincodes.map((p) => p.postalCode);
    expect(nyZips).toContain("10001");
    expect(nyZips).toContain("11201");
    expect(nyZips).toContain("10012");

    // Canada city pincodes
    const torontoPincodes = getGeoPincodes("canada", "toronto");
    expect(torontoPincodes.length).toBeGreaterThan(0);
    const torontoCodes = torontoPincodes.map((p) => p.postalCode);
    expect(torontoCodes).toContain("M5V");
    expect(torontoCodes).toContain("M5R");
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

  it("generates multi-tiered hashtags for USA -> New York -> 10001", () => {
    const tags = generateLocationHashtags({
      countryId: "usa",
      cityId: "new-york",
      areaId: "10001",
    });

    expect(tags).toContain("#USA");
    expect(tags).toContain("#NewYork");
    expect(tags).toContain("#NewYorkCity");
    expect(tags).toContain("#10001");
    // Verify all returned tags start with #
    tags.forEach((t) => expect(t.startsWith("#")).toBe(true));
  });

  it("generates multi-tiered hashtags for India -> Ahmedabad -> 380059", () => {
    const tags = generateLocationHashtags({
      countryId: "india",
      cityId: "ahmedabad",
      areaId: "380059",
    });

    expect(tags).toContain("#India");
    expect(tags).toContain("#Ahmedabad");
    expect(tags).toContain("#Amdavad");
    expect(tags).toContain("#380059");
  });

  it("generates multi-tiered hashtags for Canada -> Toronto -> M5V", () => {
    const tags = generateLocationHashtags({
      countryId: "canada",
      cityId: "toronto",
      areaId: "M5V",
    });

    expect(tags).toContain("#Canada");
    expect(tags).toContain("#Toronto");
    expect(tags).toContain("#M5V");
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

    const countryOnly = generateLocationHashtags({ countryId: "usa" });
    expect(countryOnly).toContain("#USA");
    expect(countryOnly).toContain("#UnitedStates");

    const cityOnly = generateLocationHashtags({ countryId: "india", cityId: "mumbai" });
    expect(cityOnly).toContain("#Mumbai");
    expect(cityOnly).toContain("#India");
  });
});
