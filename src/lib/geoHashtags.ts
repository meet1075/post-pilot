/**
 * PostPilot — Geo & Location-Based Dynamic Hashtag Engine
 *
 * Provides hierarchical location selection (Country -> State -> City -> Pincode)
 * for the 3 primary markets: United States, Canada, and India.
 * Operates 100% locally with zero external API dependencies.
 */

export interface GeoArea {
  id: string;
  name: string;
  postalCode: string;
  hashtags: string[];
}

export interface GeoCity {
  id: string;
  name: string;
  stateOrRegion?: string;
  stateCode?: string;
  hashtags: string[];
  areas: GeoArea[];
}

export interface GeoState {
  id: string;
  name: string;
  code: string;
}

export interface GeoCountry {
  id: string;
  name: string;
  code: string;
  flag: string;
  hashtags: string[];
  states: GeoState[];
  cities: GeoCity[];
}

export const GEO_DATA: GeoCountry[] = [
  // =========================================================================
  // 1. UNITED STATES (50 States + DC)
  // =========================================================================
  {
    id: "usa",
    name: "United States",
    code: "US",
    flag: "🇺🇸",
    hashtags: ["#USA", "#UnitedStates", "#America", "#USABusiness", "#SupportLocalUSA", "#ShopLocalUSA"],
    states: [
      { id: "al", name: "Alabama", code: "AL" },
      { id: "ak", name: "Alaska", code: "AK" },
      { id: "az", name: "Arizona", code: "AZ" },
      { id: "ar", name: "Arkansas", code: "AR" },
      { id: "ca", name: "California", code: "CA" },
      { id: "co", name: "Colorado", code: "CO" },
      { id: "ct", name: "Connecticut", code: "CT" },
      { id: "de", name: "Delaware", code: "DE" },
      { id: "dc", name: "District of Columbia", code: "DC" },
      { id: "fl", name: "Florida", code: "FL" },
      { id: "ga", name: "Georgia", code: "GA" },
      { id: "hi", name: "Hawaii", code: "HI" },
      { id: "id", name: "Idaho", code: "ID" },
      { id: "il", name: "Illinois", code: "IL" },
      { id: "in", name: "Indiana", code: "IN" },
      { id: "ia", name: "Iowa", code: "IA" },
      { id: "ks", name: "Kansas", code: "KS" },
      { id: "ky", name: "Kentucky", code: "KY" },
      { id: "la", name: "Louisiana", code: "LA" },
      { id: "me", name: "Maine", code: "ME" },
      { id: "md", name: "Maryland", code: "MD" },
      { id: "ma", name: "Massachusetts", code: "MA" },
      { id: "mi", name: "Michigan", code: "MI" },
      { id: "mn", name: "Minnesota", code: "MN" },
      { id: "ms", name: "Mississippi", code: "MS" },
      { id: "mo", name: "Missouri", code: "MO" },
      { id: "mt", name: "Montana", code: "MT" },
      { id: "ne", name: "Nebraska", code: "NE" },
      { id: "nv", name: "Nevada", code: "NV" },
      { id: "nh", name: "New Hampshire", code: "NH" },
      { id: "nj", name: "New Jersey", code: "NJ" },
      { id: "nm", name: "New Mexico", code: "NM" },
      { id: "ny", name: "New York", code: "NY" },
      { id: "nc", name: "North Carolina", code: "NC" },
      { id: "nd", name: "North Dakota", code: "ND" },
      { id: "oh", name: "Ohio", code: "OH" },
      { id: "ok", name: "Oklahoma", code: "OK" },
      { id: "or", name: "Oregon", code: "OR" },
      { id: "pa", name: "Pennsylvania", code: "PA" },
      { id: "ri", name: "Rhode Island", code: "RI" },
      { id: "sc", name: "South Carolina", code: "SC" },
      { id: "sd", name: "South Dakota", code: "SD" },
      { id: "tn", name: "Tennessee", code: "TN" },
      { id: "tx", name: "Texas", code: "TX" },
      { id: "ut", name: "Utah", code: "UT" },
      { id: "vt", name: "Vermont", code: "VT" },
      { id: "va", name: "Virginia", code: "VA" },
      { id: "wa", name: "Washington", code: "WA" },
      { id: "wv", name: "West Virginia", code: "WV" },
      { id: "wi", name: "Wisconsin", code: "WI" },
      { id: "wy", name: "Wyoming", code: "WY" },
    ],
    cities: [
      // California
      {
        id: "los-angeles",
        name: "Los Angeles",
        stateOrRegion: "California",
        stateCode: "CA",
        hashtags: ["#LosAngeles", "#LA", "#DTLA", "#Hollywood", "#Socal", "#LALife", "#LosAngelesFood", "#California"],
        areas: [
          { id: "la-90001", name: "Florence / South LA", postalCode: "90001", hashtags: ["#SouthLA", "#90001"] },
          { id: "la-90012", name: "Downtown LA / Chinatown", postalCode: "90012", hashtags: ["#DTLA", "#DowntownLA", "#90012"] },
          { id: "la-90028", name: "Hollywood / Sunset Blvd", postalCode: "90028", hashtags: ["#Hollywood", "#SunsetStrip", "#90028"] },
          { id: "la-90210", name: "Beverly Hills", postalCode: "90210", hashtags: ["#BeverlyHills", "#RodeoDrive", "#90210"] },
          { id: "la-90401", name: "Santa Monica", postalCode: "90401", hashtags: ["#SantaMonica", "#OceanAve", "#90401"] },
        ],
      },
      {
        id: "san-francisco",
        name: "San Francisco",
        stateOrRegion: "California",
        stateCode: "CA",
        hashtags: ["#SanFrancisco", "#SF", "#BayArea", "#SiliconValley", "#SFBay", "#NorCal"],
        areas: [
          { id: "sf-94102", name: "Civic Center / Hayes Valley", postalCode: "94102", hashtags: ["#HayesValley", "#CivicCenterSF", "#94102"] },
          { id: "sf-94103", name: "SoMa / Mission Bay", postalCode: "94103", hashtags: ["#SoMa", "#SoMaSF", "#SiliconValley", "#94103"] },
          { id: "sf-94110", name: "Mission District", postalCode: "94110", hashtags: ["#MissionDistrict", "#ValenciaSt", "#94110"] },
          { id: "sf-94107", name: "Potrero Hill", postalCode: "94107", hashtags: ["#PotreroHill", "#DesignDistrict", "#94107"] },
        ],
      },
      {
        id: "san-diego",
        name: "San Diego",
        stateOrRegion: "California",
        stateCode: "CA",
        hashtags: ["#SanDiego", "#SD", "#AmericaFinestCity", "#Gaslamp", "#SoCal"],
        areas: [
          { id: "sd-92101", name: "Downtown / Gaslamp Quarter", postalCode: "92101", hashtags: ["#GaslampQuarter", "#DowntownSD", "#92101"] },
          { id: "sd-92037", name: "La Jolla", postalCode: "92037", hashtags: ["#LaJolla", "#LaJollaCove", "#92037"] },
        ],
      },
      {
        id: "san-jose",
        name: "San Jose",
        stateOrRegion: "California",
        stateCode: "CA",
        hashtags: ["#SanJose", "#SiliconValley", "#BayArea", "#SJ", "#SanJoseCA"],
        areas: [
          { id: "sj-95113", name: "Downtown San Jose", postalCode: "95113", hashtags: ["#DowntownSJ", "#SiliconValley", "#95113"] },
          { id: "sj-95128", name: "Santana Row", postalCode: "95128", hashtags: ["#SantanaRow", "#95128"] },
        ],
      },
      {
        id: "sacramento",
        name: "Sacramento",
        stateOrRegion: "California",
        stateCode: "CA",
        hashtags: ["#Sacramento", "#SacramentoProud", "#NorCal", "#SacState"],
        areas: [
          { id: "sac-95814", name: "Downtown Sacramento", postalCode: "95814", hashtags: ["#DowntownSac", "#CapitolPark", "#95814"] },
        ],
      },

      // New York
      {
        id: "new-york",
        name: "New York City",
        stateOrRegion: "New York",
        stateCode: "NY",
        hashtags: ["#NYC", "#NewYorkCity", "#NewYork", "#Manhattan", "#Brooklyn", "#Queens", "#NYCLife", "#NYCEats"],
        areas: [
          { id: "nyc-10001", name: "Midtown & Chelsea", postalCode: "10001", hashtags: ["#MidtownNYC", "#ChelseaNYC", "#HudsonYards", "#10001"] },
          { id: "nyc-10012", name: "SoHo & Greenwich Village", postalCode: "10012", hashtags: ["#SoHoNYC", "#GreenwichVillage", "#10012"] },
          { id: "nyc-10021", name: "Upper East Side", postalCode: "10021", hashtags: ["#UpperEastSide", "#CentralPark", "#10021"] },
          { id: "nyc-10024", name: "Upper West Side", postalCode: "10024", hashtags: ["#UpperWestSide", "#10024"] },
          { id: "nyc-10005", name: "Financial District", postalCode: "10005", hashtags: ["#FiDi", "#WallStreet", "#10005"] },
          { id: "nyc-11201", name: "DUMBO & Brooklyn Heights", postalCode: "11201", hashtags: ["#Brooklyn", "#DUMBO", "#11201"] },
          { id: "nyc-11211", name: "Williamsburg", postalCode: "11211", hashtags: ["#Williamsburg", "#11211"] },
          { id: "nyc-11101", name: "Long Island City", postalCode: "11101", hashtags: ["#LIC", "#QueensNYC", "#11101"] },
        ],
      },
      {
        id: "buffalo",
        name: "Buffalo",
        stateOrRegion: "New York",
        stateCode: "NY",
        hashtags: ["#Buffalo", "#BuffaloNY", "#UpstateNY", "#716"],
        areas: [
          { id: "buf-14201", name: "Downtown Buffalo", postalCode: "14201", hashtags: ["#DowntownBuffalo", "#Canalside", "#14201"] },
        ],
      },
      {
        id: "albany",
        name: "Albany",
        stateOrRegion: "New York",
        stateCode: "NY",
        hashtags: ["#Albany", "#AlbanyNY", "#CapitalRegion", "#UpstateNY"],
        areas: [
          { id: "alb-12207", name: "Downtown Albany", postalCode: "12207", hashtags: ["#DowntownAlbany", "#EmpireStatePlaza", "#12207"] },
        ],
      },

      // Texas
      {
        id: "houston",
        name: "Houston",
        stateOrRegion: "Texas",
        stateCode: "TX",
        hashtags: ["#Houston", "#HTX", "#HoustonTexas", "#SpaceCity", "#Texas", "#HoustonEats"],
        areas: [
          { id: "hou-77002", name: "Downtown Houston", postalCode: "77002", hashtags: ["#DowntownHouston", "#TheaterDistrict", "#77002"] },
          { id: "hou-77006", name: "Montrose", postalCode: "77006", hashtags: ["#MontroseHTX", "#MuseumDistrict", "#77006"] },
          { id: "hou-77056", name: "Galleria / Uptown", postalCode: "77056", hashtags: ["#GalleriaHouston", "#UptownHTX", "#77056"] },
        ],
      },
      {
        id: "dallas",
        name: "Dallas",
        stateOrRegion: "Texas",
        stateCode: "TX",
        hashtags: ["#Dallas", "#DTX", "#DallasTexas", "#DFW", "#BigD", "#Texas"],
        areas: [
          { id: "dal-75201", name: "Downtown Dallas", postalCode: "75201", hashtags: ["#DowntownDallas", "#ArtsDistrict", "#75201"] },
          { id: "dal-75204", name: "Uptown Dallas", postalCode: "75204", hashtags: ["#UptownDallas", "#KlydeWarrenPark", "#75204"] },
        ],
      },
      {
        id: "austin",
        name: "Austin",
        stateOrRegion: "Texas",
        stateCode: "TX",
        hashtags: ["#Austin", "#ATX", "#AustinTexas", "#KeepAustinWeird", "#SiliconHills", "#Texas"],
        areas: [
          { id: "atx-78701", name: "Downtown Austin", postalCode: "78701", hashtags: ["#DowntownAustin", "#CongressAve", "#78701"] },
          { id: "atx-78704", name: "South Congress (SoCo)", postalCode: "78704", hashtags: ["#SouthCongress", "#SoCoATX", "#78704"] },
        ],
      },
      {
        id: "san-antonio",
        name: "San Antonio",
        stateOrRegion: "Texas",
        stateCode: "TX",
        hashtags: ["#SanAntonio", "#SATX", "#RiverWalk", "#AlamoCity", "#Texas"],
        areas: [
          { id: "sa-78205", name: "Downtown & River Walk", postalCode: "78205", hashtags: ["#RiverWalk", "#TheAlamo", "#78205"] },
        ],
      },

      // Florida
      {
        id: "miami",
        name: "Miami",
        stateOrRegion: "Florida",
        stateCode: "FL",
        hashtags: ["#Miami", "#MiamiBeach", "#SouthBeach", "#Brickell", "#MagicCity", "#Florida"],
        areas: [
          { id: "mia-33131", name: "Brickell / Downtown", postalCode: "33131", hashtags: ["#Brickell", "#DowntownMiami", "#33131"] },
          { id: "mia-33139", name: "South Beach / Ocean Drive", postalCode: "33139", hashtags: ["#SouthBeach", "#SoBe", "#33139"] },
          { id: "mia-33127", name: "Wynwood Art District", postalCode: "33127", hashtags: ["#Wynwood", "#WynwoodWalls", "#33127"] },
        ],
      },
      {
        id: "orlando",
        name: "Orlando",
        stateOrRegion: "Florida",
        stateCode: "FL",
        hashtags: ["#Orlando", "#TheCityBeautiful", "#OrlandoFlorida", "#CentralFlorida"],
        areas: [
          { id: "orl-32801", name: "Downtown Orlando", postalCode: "32801", hashtags: ["#DowntownOrlando", "#LakeEola", "#32801"] },
        ],
      },
      {
        id: "tampa",
        name: "Tampa",
        stateOrRegion: "Florida",
        stateCode: "FL",
        hashtags: ["#Tampa", "#TampaBay", "#YborCity", "#ChampaBay"],
        areas: [
          { id: "tam-33602", name: "Downtown & Riverwalk", postalCode: "33602", hashtags: ["#DowntownTampa", "#TampaRiverwalk", "#33602"] },
        ],
      },

      // Illinois
      {
        id: "chicago",
        name: "Chicago",
        stateOrRegion: "Illinois",
        stateCode: "IL",
        hashtags: ["#Chicago", "#WindyCity", "#ChiTown", "#TheLoop", "#ChicagoEats", "#Illinois"],
        areas: [
          { id: "chi-60601", name: "The Loop / Millennium Park", postalCode: "60601", hashtags: ["#TheLoop", "#MillenniumPark", "#60601"] },
          { id: "chi-60611", name: "Magnificent Mile", postalCode: "60611", hashtags: ["#MagMile", "#MichiganAve", "#60611"] },
          { id: "chi-60607", name: "West Loop / Fulton Market", postalCode: "60607", hashtags: ["#WestLoop", "#FultonMarket", "#60607"] },
        ],
      },

      // Washington
      {
        id: "seattle",
        name: "Seattle",
        stateOrRegion: "Washington",
        stateCode: "WA",
        hashtags: ["#Seattle", "#EmeraldCity", "#PNW", "#PacificNorthwest", "#SpaceNeedle", "#Washington"],
        areas: [
          { id: "sea-98101", name: "Downtown & Pike Place", postalCode: "98101", hashtags: ["#PikePlaceMarket", "#DowntownSeattle", "#98101"] },
          { id: "sea-98109", name: "South Lake Union (Tech)", postalCode: "98109", hashtags: ["#SouthLakeUnion", "#SLU", "#AmazonHQ", "#98109"] },
        ],
      },

      // Georgia
      {
        id: "atlanta",
        name: "Atlanta",
        stateOrRegion: "Georgia",
        stateCode: "GA",
        hashtags: ["#Atlanta", "#ATL", "#AtlantaGeorgia", "#MidtownATL", "#Buckhead", "#Georgia"],
        areas: [
          { id: "atl-30303", name: "Downtown Atlanta", postalCode: "30303", hashtags: ["#DowntownATL", "#CentennialPark", "#30303"] },
          { id: "atl-30309", name: "Midtown Atlanta", postalCode: "30309", hashtags: ["#MidtownATL", "#PeachtreeSt", "#30309"] },
          { id: "atl-30305", name: "Buckhead", postalCode: "30305", hashtags: ["#Buckhead", "#BuckheadAtlanta", "#30305"] },
        ],
      },

      // Massachusetts
      {
        id: "boston",
        name: "Boston",
        stateOrRegion: "Massachusetts",
        stateCode: "MA",
        hashtags: ["#Boston", "#Beantown", "#BostonMA", "#BackBay", "#NewEngland"],
        areas: [
          { id: "bos-02116", name: "Back Bay & Copley", postalCode: "02116", hashtags: ["#BackBay", "#NewburyStreet", "#02116"] },
          { id: "bos-02109", name: "Downtown / Financial District", postalCode: "02109", hashtags: ["#DowntownBoston", "#FaneuilHall", "#02109"] },
        ],
      },

      // Colorado
      {
        id: "denver",
        name: "Denver",
        stateOrRegion: "Colorado",
        stateCode: "CO",
        hashtags: ["#Denver", "#MileHighCity", "#DenverColorado", "#LoDo", "#Colorado"],
        areas: [
          { id: "den-80202", name: "LoDo & Union Station", postalCode: "80202", hashtags: ["#LoDo", "#DenverUnionStation", "#80202"] },
          { id: "den-80206", name: "Cherry Creek", postalCode: "80206", hashtags: ["#CherryCreek", "#80206"] },
        ],
      },

      // Arizona
      {
        id: "phoenix",
        name: "Phoenix",
        stateOrRegion: "Arizona",
        stateCode: "AZ",
        hashtags: ["#Phoenix", "#PHX", "#ValleyOfTheSun", "#Arizona"],
        areas: [
          { id: "phx-85004", name: "Downtown Phoenix", postalCode: "85004", hashtags: ["#DowntownPHX", "#RooseveltRow", "#85004"] },
          { id: "phx-85251", name: "Scottsdale", postalCode: "85251", hashtags: ["#OldTownScottsdale", "#ScottsdaleAZ", "#85251"] },
        ],
      },

      // Nevada
      {
        id: "las-vegas",
        name: "Las Vegas",
        stateOrRegion: "Nevada",
        stateCode: "NV",
        hashtags: ["#LasVegas", "#Vegas", "#TheStrip", "#VegasStrip", "#Nevada"],
        areas: [
          { id: "lv-89109", name: "The Las Vegas Strip", postalCode: "89109", hashtags: ["#VegasStrip", "#Bellagio", "#89109"] },
          { id: "lv-89101", name: "Downtown / Fremont St", postalCode: "89101", hashtags: ["#DowntownVegas", "#FremontStreet", "#89101"] },
        ],
      },

      // Pennsylvania
      {
        id: "philadelphia",
        name: "Philadelphia",
        stateOrRegion: "Pennsylvania",
        stateCode: "PA",
        hashtags: ["#Philadelphia", "#Philly", "#CenterCity", "#PhillyEats", "#Pennsylvania"],
        areas: [
          { id: "phl-19102", name: "Center City", postalCode: "19102", hashtags: ["#CenterCityPhilly", "#Rittenhouse", "#19102"] },
        ],
      },
      {
        id: "pittsburgh",
        name: "Pittsburgh",
        stateOrRegion: "Pennsylvania",
        stateCode: "PA",
        hashtags: ["#Pittsburgh", "#SteelCity", "#PittsburghPA", "#Yinz"],
        areas: [
          { id: "pit-15222", name: "Downtown Pittsburgh", postalCode: "15222", hashtags: ["#DowntownPittsburgh", "#CulturalDistrict", "#15222"] },
        ],
      },

      // Michigan
      {
        id: "detroit",
        name: "Detroit",
        stateOrRegion: "Michigan",
        stateCode: "MI",
        hashtags: ["#Detroit", "#MotorCity", "#DetroitMichigan", "#MidtownDetroit"],
        areas: [
          { id: "det-48226", name: "Downtown Detroit", postalCode: "48226", hashtags: ["#DowntownDetroit", "#CampusMartius", "#48226"] },
        ],
      },

      // Tennessee
      {
        id: "nashville",
        name: "Nashville",
        stateOrRegion: "Tennessee",
        stateCode: "TN",
        hashtags: ["#Nashville", "#MusicCity", "#NashvilleTN", "#BroadwayNashville"],
        areas: [
          { id: "nas-37203", name: "Downtown & Gulch", postalCode: "37203", hashtags: ["#TheGulch", "#DowntownNashville", "#37203"] },
        ],
      },

      // District of Columbia
      {
        id: "washington-dc",
        name: "Washington D.C.",
        stateOrRegion: "District of Columbia",
        stateCode: "DC",
        hashtags: ["#WashingtonDC", "#DC", "#CapitolHill", "#Georgetown", "#DCLife"],
        areas: [
          { id: "dc-20001", name: "Downtown & Shaw", postalCode: "20001", hashtags: ["#DCDowntown", "#ShawDC", "#20001"] },
          { id: "dc-20007", name: "Georgetown", postalCode: "20007", hashtags: ["#GeorgetownDC", "#MStreet", "#20007"] },
        ],
      },

      // Other US State Major Hubs (Ensuring every state has local coverage)
      { id: "birmingham", name: "Birmingham", stateOrRegion: "Alabama", stateCode: "AL", hashtags: ["#BirminghamAL", "#Bham"], areas: [{ id: "bhm-35203", name: "Downtown Birmingham", postalCode: "35203", hashtags: ["#35203"] }] },
      { id: "anchorage", name: "Anchorage", stateOrRegion: "Alaska", stateCode: "AK", hashtags: ["#Anchorage", "#Alaska"], areas: [{ id: "anc-99501", name: "Downtown Anchorage", postalCode: "99501", hashtags: ["#99501"] }] },
      { id: "little-rock", name: "Little Rock", stateOrRegion: "Arkansas", stateCode: "AR", hashtags: ["#LittleRock", "#Arkansas"], areas: [{ id: "lr-72201", name: "Downtown Little Rock", postalCode: "72201", hashtags: ["#72201"] }] },
      { id: "hartford", name: "Hartford", stateOrRegion: "Connecticut", stateCode: "CT", hashtags: ["#HartfordCT", "#Connecticut"], areas: [{ id: "har-06103", name: "Downtown Hartford", postalCode: "06103", hashtags: ["#06103"] }] },
      { id: "wilmington", name: "Wilmington", stateOrRegion: "Delaware", stateCode: "DE", hashtags: ["#WilmingtonDE", "#Delaware"], areas: [{ id: "wil-19801", name: "Downtown Wilmington", postalCode: "19801", hashtags: ["#19801"] }] },
      { id: "honolulu", name: "Honolulu", stateOrRegion: "Hawaii", stateCode: "HI", hashtags: ["#Honolulu", "#Waikiki", "#Hawaii"], areas: [{ id: "hnl-96815", name: "Waikiki", postalCode: "96815", hashtags: ["#96815"] }] },
      { id: "boise", name: "Boise", stateOrRegion: "Idaho", stateCode: "ID", hashtags: ["#Boise", "#BoiseIdaho"], areas: [{ id: "boi-83702", name: "Downtown Boise", postalCode: "83702", hashtags: ["#83702"] }] },
      { id: "indianapolis", name: "Indianapolis", stateOrRegion: "Indiana", stateCode: "IN", hashtags: ["#Indy", "#Indianapolis"], areas: [{ id: "ind-46204", name: "Downtown Indy", postalCode: "46204", hashtags: ["#46204"] }] },
      { id: "des-moines", name: "Des Moines", stateOrRegion: "Iowa", stateCode: "IA", hashtags: ["#DesMoines", "#Iowa"], areas: [{ id: "dsm-50309", name: "Downtown Des Moines", postalCode: "50309", hashtags: ["#50309"] }] },
      { id: "wichita", name: "Wichita", stateOrRegion: "Kansas", stateCode: "KS", hashtags: ["#Wichita", "#Kansas"], areas: [{ id: "ict-67202", name: "Downtown Wichita", postalCode: "67202", hashtags: ["#67202"] }] },
      { id: "louisville", name: "Louisville", stateOrRegion: "Kentucky", stateCode: "KY", hashtags: ["#Louisville", "#Kentucky"], areas: [{ id: "lou-40202", name: "Downtown Louisville", postalCode: "40202", hashtags: ["#40202"] }] },
      { id: "new-orleans", name: "New Orleans", stateOrRegion: "Louisiana", stateCode: "LA", hashtags: ["#NewOrleans", "#NOLA"], areas: [{ id: "msy-70112", name: "French Quarter", postalCode: "70112", hashtags: ["#70112"] }] },
      { id: "portland-me", name: "Portland", stateOrRegion: "Maine", stateCode: "ME", hashtags: ["#PortlandMaine", "#Maine"], areas: [{ id: "pwm-04101", name: "Old Port", postalCode: "04101", hashtags: ["#04101"] }] },
      { id: "baltimore", name: "Baltimore", stateOrRegion: "Maryland", stateCode: "MD", hashtags: ["#Baltimore", "#InnerHarbor"], areas: [{ id: "bwi-21201", name: "Downtown Baltimore", postalCode: "21201", hashtags: ["#21201"] }] },
      { id: "minneapolis", name: "Minneapolis", stateOrRegion: "Minnesota", stateCode: "MN", hashtags: ["#Minneapolis", "#TwinCities"], areas: [{ id: "msp-55401", name: "North Loop", postalCode: "55401", hashtags: ["#55401"] }] },
      { id: "jackson-ms", name: "Jackson", stateOrRegion: "Mississippi", stateCode: "MS", hashtags: ["#JacksonMS", "#Mississippi"], areas: [{ id: "jan-39201", name: "Downtown Jackson", postalCode: "39201", hashtags: ["#39201"] }] },
      { id: "kansas-city", name: "Kansas City", stateOrRegion: "Missouri", stateCode: "MO", hashtags: ["#KansasCity", "#KCMO"], areas: [{ id: "kc-64105", name: "Downtown KC", postalCode: "64105", hashtags: ["#64105"] }] },
      { id: "billings", name: "Billings", stateOrRegion: "Montana", stateCode: "MT", hashtags: ["#Billings", "#Montana"], areas: [{ id: "bil-59101", name: "Downtown Billings", postalCode: "59101", hashtags: ["#59101"] }] },
      { id: "omaha", name: "Omaha", stateOrRegion: "Nebraska", stateCode: "NE", hashtags: ["#Omaha", "#Nebraska"], areas: [{ id: "oma-68102", name: "Old Market", postalCode: "68102", hashtags: ["#68102"] }] },
      { id: "manchester-nh", name: "Manchester", stateOrRegion: "New Hampshire", stateCode: "NH", hashtags: ["#ManchesterNH", "#NewHampshire"], areas: [{ id: "mht-03101", name: "Downtown Manchester", postalCode: "03101", hashtags: ["#03101"] }] },
      { id: "newark", name: "Newark", stateOrRegion: "New Jersey", stateCode: "NJ", hashtags: ["#NewarkNJ", "#NewJersey"], areas: [{ id: "ewr-07102", name: "Downtown Newark", postalCode: "07102", hashtags: ["#07102"] }] },
      { id: "albuquerque", name: "Albuquerque", stateOrRegion: "New Mexico", stateCode: "NM", hashtags: ["#Albuquerque", "#ABQ"], areas: [{ id: "abq-87102", name: "Downtown Albuquerque", postalCode: "87102", hashtags: ["#87102"] }] },
      { id: "charlotte", name: "Charlotte", stateOrRegion: "North Carolina", stateCode: "NC", hashtags: ["#Charlotte", "#QueenCity"], areas: [{ id: "clt-28202", name: "Uptown Charlotte", postalCode: "28202", hashtags: ["#28202"] }] },
      { id: "fargo", name: "Fargo", stateOrRegion: "North Dakota", stateCode: "ND", hashtags: ["#Fargo", "#NorthDakota"], areas: [{ id: "far-58102", name: "Downtown Fargo", postalCode: "58102", hashtags: ["#58102"] }] },
      { id: "columbus", name: "Columbus", stateOrRegion: "Ohio", stateCode: "OH", hashtags: ["#ColumbusOhio", "#ShortNorth"], areas: [{ id: "cmh-43215", name: "Short North", postalCode: "43215", hashtags: ["#43215"] }] },
      { id: "oklahoma-city", name: "Oklahoma City", stateOrRegion: "Oklahoma", stateCode: "OK", hashtags: ["#OKC", "#OklahomaCity"], areas: [{ id: "okc-73102", name: "Downtown OKC", postalCode: "73102", hashtags: ["#73102"] }] },
      { id: "portland-or", name: "Portland", stateOrRegion: "Oregon", stateCode: "OR", hashtags: ["#Portland", "#PDX"], areas: [{ id: "pdx-97201", name: "Downtown Portland", postalCode: "97201", hashtags: ["#97201"] }] },
      { id: "providence", name: "Providence", stateOrRegion: "Rhode Island", stateCode: "RI", hashtags: ["#ProvidenceRI", "#RhodeIsland"], areas: [{ id: "pvd-02903", name: "Downtown Providence", postalCode: "02903", hashtags: ["#02903"] }] },
      { id: "charleston", name: "Charleston", stateOrRegion: "South Carolina", stateCode: "SC", hashtags: ["#CharlestonSC", "#HolyCity"], areas: [{ id: "chs-29401", name: "Historic District", postalCode: "29401", hashtags: ["#29401"] }] },
      { id: "sioux-falls", name: "Sioux Falls", stateOrRegion: "South Dakota", stateCode: "SD", hashtags: ["#SiouxFalls", "#SouthDakota"], areas: [{ id: "fsd-57104", name: "Downtown Sioux Falls", postalCode: "57104", hashtags: ["#57104"] }] },
      { id: "salt-lake-city", name: "Salt Lake City", stateOrRegion: "Utah", stateCode: "UT", hashtags: ["#SaltLakeCity", "#SLC"], areas: [{ id: "slc-84101", name: "Downtown SLC", postalCode: "84101", hashtags: ["#84101"] }] },
      { id: "burlington", name: "Burlington", stateOrRegion: "Vermont", stateCode: "VT", hashtags: ["#BurlingtonVT", "#Vermont"], areas: [{ id: "btv-05401", name: "Church Street", postalCode: "05401", hashtags: ["#05401"] }] },
      { id: "richmond", name: "Richmond", stateOrRegion: "Virginia", stateCode: "VA", hashtags: ["#RichmondVA", "#RVA"], areas: [{ id: "ric-23219", name: "Downtown Richmond", postalCode: "23219", hashtags: ["#23219"] }] },
      { id: "charleston-wv", name: "Charleston", stateOrRegion: "West Virginia", stateCode: "WV", hashtags: ["#CharlestonWV", "#WestVirginia"], areas: [{ id: "crw-25301", name: "Downtown Charleston", postalCode: "25301", hashtags: ["#25301"] }] },
      { id: "milwaukee", name: "Milwaukee", stateOrRegion: "Wisconsin", stateCode: "WI", hashtags: ["#Milwaukee", "#MKE"], areas: [{ id: "mke-53202", name: "Downtown Milwaukee", postalCode: "53202", hashtags: ["#53202"] }] },
      { id: "cheyenne", name: "Cheyenne", stateOrRegion: "Wyoming", stateCode: "WY", hashtags: ["#CheyenneWY", "#Wyoming"], areas: [{ id: "cys-82001", name: "Downtown Cheyenne", postalCode: "82001", hashtags: ["#82001"] }] },
    ],
  },

  // =========================================================================
  // 2. CANADA (10 Provinces + 3 Territories)
  // =========================================================================
  {
    id: "canada",
    name: "Canada",
    code: "CA",
    flag: "🇨🇦",
    hashtags: ["#Canada", "#CanadianBusiness", "#ShopLocalCanada", "#MadeInCanada", "#ExploreCanada", "#SupportLocalCanada"],
    states: [
      { id: "on", name: "Ontario", code: "ON" },
      { id: "qc", name: "Quebec", code: "QC" },
      { id: "bc", name: "British Columbia", code: "BC" },
      { id: "ab", name: "Alberta", code: "AB" },
      { id: "mb", name: "Manitoba", code: "MB" },
      { id: "sk", name: "Saskatchewan", code: "SK" },
      { id: "ns", name: "Nova Scotia", code: "NS" },
      { id: "nb", name: "New Brunswick", code: "NB" },
      { id: "nl", name: "Newfoundland and Labrador", code: "NL" },
      { id: "pe", name: "Prince Edward Island", code: "PE" },
      { id: "nt", name: "Northwest Territories", code: "NT" },
      { id: "nu", name: "Nunavut", code: "NU" },
      { id: "yt", name: "Yukon", code: "YT" },
    ],
    cities: [
      // Ontario
      {
        id: "toronto",
        name: "Toronto",
        stateOrRegion: "Ontario",
        stateCode: "ON",
        hashtags: ["#Toronto", "#The6ix", "#TorontoLife", "#DowntownToronto", "#GTA", "#TorontoEats", "#Ontario"],
        areas: [
          { id: "tor-m5v", name: "Downtown & Entertainment District", postalCode: "M5V", hashtags: ["#DowntownToronto", "#KingWest", "#EntertainmentDistrict", "#M5V"] },
          { id: "tor-m5r", name: "Yorkville & Bloor", postalCode: "M5R", hashtags: ["#Yorkville", "#BloorYorkville", "#M5R"] },
          { id: "tor-m5h", name: "Financial District", postalCode: "M5H", hashtags: ["#BayStreet", "#FinancialDistrict", "#M5H"] },
          { id: "tor-m4y", name: "Church & Wellesley", postalCode: "M4Y", hashtags: ["#ChurchWellesley", "#M4Y"] },
        ],
      },
      {
        id: "ottawa",
        name: "Ottawa",
        stateOrRegion: "Ontario",
        stateCode: "ON",
        hashtags: ["#Ottawa", "#MyOttawa", "#ByWardMarket", "#OttawaLife", "#Ontario"],
        areas: [
          { id: "ott-k1p", name: "Parliament Hill / Downtown", postalCode: "K1P", hashtags: ["#ByWardMarket", "#ParliamentHill", "#K1P"] },
          { id: "ott-k2p", name: "The Glebe / Centretown", postalCode: "K2P", hashtags: ["#TheGlebe", "#BankStreet", "#K2P"] },
        ],
      },
      {
        id: "mississauga",
        name: "Mississauga",
        stateOrRegion: "Ontario",
        stateCode: "ON",
        hashtags: ["#Mississauga", "#SquareOne", "#PortCredit", "#GTA"],
        areas: [
          { id: "mis-l5b", name: "City Centre / Square One", postalCode: "L5B", hashtags: ["#SquareOne", "#MississaugaCityCentre", "#L5B"] },
          { id: "mis-l5g", name: "Port Credit", postalCode: "L5G", hashtags: ["#PortCredit", "#L5G"] },
        ],
      },
      {
        id: "brampton",
        name: "Brampton",
        stateOrRegion: "Ontario",
        stateCode: "ON",
        hashtags: ["#Brampton", "#FlowerCity", "#BramptonLife", "#PeelRegion"],
        areas: [
          { id: "brm-l6y", name: "Downtown Brampton", postalCode: "L6Y", hashtags: ["#DowntownBrampton", "#L6Y"] },
        ],
      },

      // British Columbia
      {
        id: "vancouver",
        name: "Vancouver",
        stateOrRegion: "British Columbia",
        stateCode: "BC",
        hashtags: ["#Vancouver", "#YVR", "#VancouverBC", "#Gastown", "#Yaletown", "#BritishColumbia"],
        areas: [
          { id: "van-v6b", name: "Yaletown & Downtown", postalCode: "V6B", hashtags: ["#Yaletown", "#DowntownVancouver", "#Gastown", "#V6B"] },
          { id: "van-v6z", name: "West End / English Bay", postalCode: "V6Z", hashtags: ["#EnglishBay", "#DavieVillage", "#V6Z"] },
          { id: "van-v5k", name: "East Van / Commercial Drive", postalCode: "V5K", hashtags: ["#EastVan", "#CommercialDrive", "#V5K"] },
        ],
      },
      {
        id: "victoria",
        name: "Victoria",
        stateOrRegion: "British Columbia",
        stateCode: "BC",
        hashtags: ["#VictoriaBC", "#InnerHarbour", "#VancouverIsland"],
        areas: [
          { id: "vic-v8w", name: "Downtown & Inner Harbour", postalCode: "V8W", hashtags: ["#InnerHarbour", "#DowntownVictoria", "#V8W"] },
        ],
      },
      {
        id: "surrey",
        name: "Surrey",
        stateOrRegion: "British Columbia",
        stateCode: "BC",
        hashtags: ["#SurreyBC", "#CityOfSurrey", "#MetroVancouver"],
        areas: [
          { id: "sur-v3t", name: "Whalley / City Centre", postalCode: "V3T", hashtags: ["#SurreyCityCentre", "#V3T"] },
        ],
      },

      // Quebec
      {
        id: "montreal",
        name: "Montreal",
        stateOrRegion: "Quebec",
        stateCode: "QC",
        hashtags: ["#Montreal", "#MTL", "#VieuxMontreal", "#PlateauMontRoyal", "#Quebec"],
        areas: [
          { id: "mtl-h2y", name: "Old Montreal & Downtown", postalCode: "H2Y", hashtags: ["#OldMontreal", "#VieuxMontreal", "#H2Y"] },
          { id: "mtl-h2w", name: "Plateau-Mont-Royal", postalCode: "H2W", hashtags: ["#LePlateau", "#SaintLaurent", "#H2W"] },
          { id: "mtl-h3b", name: "Downtown / Sainte-Catherine", postalCode: "H3B", hashtags: ["#CentreVilleMTL", "#H3B"] },
        ],
      },
      {
        id: "quebec-city",
        name: "Quebec City",
        stateOrRegion: "Quebec",
        stateCode: "QC",
        hashtags: ["#QuebecCity", "#VieuxQuebec", "#ChateauFrontenac"],
        areas: [
          { id: "qc-g1r", name: "Old Quebec / Haute-Ville", postalCode: "G1R", hashtags: ["#VieuxQuebec", "#G1R"] },
        ],
      },

      // Alberta
      {
        id: "calgary",
        name: "Calgary",
        stateOrRegion: "Alberta",
        stateCode: "AB",
        hashtags: ["#Calgary", "#YYC", "#CalgaryLife", "#Beltline", "#Alberta"],
        areas: [
          { id: "cal-t2p", name: "Downtown & Beltline", postalCode: "T2P", hashtags: ["#DowntownCalgary", "#BeltlineYYC", "#T2P"] },
          { id: "cal-t2n", name: "Kensington", postalCode: "T2N", hashtags: ["#KensingtonYYC", "#T2N"] },
        ],
      },
      {
        id: "edmonton",
        name: "Edmonton",
        stateOrRegion: "Alberta",
        stateCode: "AB",
        hashtags: ["#Edmonton", "#YEG", "#WhyteAve", "#Alberta"],
        areas: [
          { id: "edm-t5j", name: "Downtown Edmonton", postalCode: "T5J", hashtags: ["#DowntownYEG", "#IceDistrict", "#T5J"] },
          { id: "edm-t6e", name: "Old Strathcona / Whyte Ave", postalCode: "T6E", hashtags: ["#WhyteAve", "#OldStrathcona", "#T6E"] },
        ],
      },

      // Manitoba
      {
        id: "winnipeg",
        name: "Winnipeg",
        stateOrRegion: "Manitoba",
        stateCode: "MB",
        hashtags: ["#Winnipeg", "#YWG", "#TheForks", "#Manitoba"],
        areas: [
          { id: "wpg-r3c", name: "Downtown & The Forks", postalCode: "R3C", hashtags: ["#TheForks", "#DowntownWinnipeg", "#R3C"] },
          { id: "wpg-r3l", name: "Osborne Village", postalCode: "R3L", hashtags: ["#OsborneVillage", "#R3L"] },
        ],
      },

      // Saskatchewan
      {
        id: "saskatoon",
        name: "Saskatoon",
        stateOrRegion: "Saskatchewan",
        stateCode: "SK",
        hashtags: ["#Saskatoon", "#YXE", "#BridgeCity", "#Saskatchewan"],
        areas: [
          { id: "sas-s7k", name: "Downtown Saskatoon", postalCode: "S7K", hashtags: ["#DowntownSaskatoon", "#S7K"] },
        ],
      },
      {
        id: "regina",
        name: "Regina",
        stateOrRegion: "Saskatchewan",
        stateCode: "SK",
        hashtags: ["#Regina", "#YQR", "#QueenCity", "#Saskatchewan"],
        areas: [
          { id: "reg-s4p", name: "Downtown Regina", postalCode: "S4P", hashtags: ["#DowntownRegina", "#S4P"] },
        ],
      },

      // Nova Scotia
      {
        id: "halifax",
        name: "Halifax",
        stateOrRegion: "Nova Scotia",
        stateCode: "NS",
        hashtags: ["#Halifax", "#YHZ", "#HalifaxWaterfront", "#NovaScotia"],
        areas: [
          { id: "hfx-b3h", name: "Downtown & South End", postalCode: "B3H", hashtags: ["#DowntownHalifax", "#B3H"] },
        ],
      },

      // New Brunswick
      {
        id: "moncton",
        name: "Moncton",
        stateOrRegion: "New Brunswick",
        stateCode: "NB",
        hashtags: ["#Moncton", "#NewBrunswick"],
        areas: [
          { id: "mon-e1c", name: "Downtown Moncton", postalCode: "E1C", hashtags: ["#E1C"] },
        ],
      },
      {
        id: "saint-john",
        name: "Saint John",
        stateOrRegion: "New Brunswick",
        stateCode: "NB",
        hashtags: ["#SaintJohn", "#UptownSJ"],
        areas: [
          { id: "stj-e2l", name: "Uptown Saint John", postalCode: "E2L", hashtags: ["#E2L"] },
        ],
      },

      // Newfoundland and Labrador
      {
        id: "st-johns",
        name: "St. John's",
        stateOrRegion: "Newfoundland and Labrador",
        stateCode: "NL",
        hashtags: ["#StJohns", "#Newfoundland", "#WaterStreet"],
        areas: [
          { id: "stj-a1c", name: "Downtown St. John's", postalCode: "A1C", hashtags: ["#GeorgeStreet", "#A1C"] },
        ],
      },

      // Prince Edward Island
      {
        id: "charlottetown",
        name: "Charlottetown",
        stateOrRegion: "Prince Edward Island",
        stateCode: "PE",
        hashtags: ["#Charlottetown", "#PEI"],
        areas: [
          { id: "cht-c1a", name: "Historic Downtown", postalCode: "C1A", hashtags: ["#C1A"] },
        ],
      },

      // Territories
      {
        id: "yellowknife",
        name: "Yellowknife",
        stateOrRegion: "Northwest Territories",
        stateCode: "NT",
        hashtags: ["#Yellowknife", "#NWT", "#SpectacularNWT"],
        areas: [{ id: "yel-x1a", name: "Old Town & Downtown", postalCode: "X1A", hashtags: ["#X1A"] }],
      },
      {
        id: "iqaluit",
        name: "Iqaluit",
        stateOrRegion: "Nunavut",
        stateCode: "NU",
        hashtags: ["#Iqaluit", "#Nunavut"],
        areas: [{ id: "iqa-x0a", name: "Iqaluit Town", postalCode: "X0A", hashtags: ["#X0A"] }],
      },
      {
        id: "whitehorse",
        name: "Whitehorse",
        stateOrRegion: "Yukon",
        stateCode: "YT",
        hashtags: ["#Whitehorse", "#Yukon"],
        areas: [{ id: "whi-y1a", name: "Downtown Whitehorse", postalCode: "Y1A", hashtags: ["#Y1A"] }],
      },
    ],
  },

  // =========================================================================
  // 3. INDIA (All 28 States + 8 Union Territories)
  // =========================================================================
  {
    id: "india",
    name: "India",
    code: "IN",
    flag: "🇮🇳",
    hashtags: ["#India", "#IncredibleIndia", "#MadeInIndia", "#IndianBusiness", "#VocalForLocal", "#ShopLocalIndia"],
    states: [
      // 28 States
      { id: "ap", name: "Andhra Pradesh", code: "AP" },
      { id: "ar", name: "Arunachal Pradesh", code: "AR" },
      { id: "as", name: "Assam", code: "AS" },
      { id: "br", name: "Bihar", code: "BR" },
      { id: "cg", name: "Chhattisgarh", code: "CG" },
      { id: "ga", name: "Goa", code: "GA" },
      { id: "gj", name: "Gujarat", code: "GJ" },
      { id: "hr", name: "Haryana", code: "HR" },
      { id: "hp", name: "Himachal Pradesh", code: "HP" },
      { id: "jh", name: "Jharkhand", code: "JH" },
      { id: "ka", name: "Karnataka", code: "KA" },
      { id: "kl", name: "Kerala", code: "KL" },
      { id: "mp", name: "Madhya Pradesh", code: "MP" },
      { id: "mh", name: "Maharashtra", code: "MH" },
      { id: "mn", name: "Manipur", code: "MN" },
      { id: "ml", name: "Meghalaya", code: "ML" },
      { id: "mz", name: "Mizoram", code: "MZ" },
      { id: "nl", name: "Nagaland", code: "NL" },
      { id: "od", name: "Odisha", code: "OD" },
      { id: "pb", name: "Punjab", code: "PB" },
      { id: "rj", name: "Rajasthan", code: "RJ" },
      { id: "sk", name: "Sikkim", code: "SK" },
      { id: "tn", name: "Tamil Nadu", code: "TN" },
      { id: "ts", name: "Telangana", code: "TS" },
      { id: "tr", name: "Tripura", code: "TR" },
      { id: "up", name: "Uttar Pradesh", code: "UP" },
      { id: "uk", name: "Uttarakhand", code: "UK" },
      { id: "wb", name: "West Bengal", code: "WB" },

      // 8 Union Territories
      { id: "an", name: "Andaman and Nicobar Islands", code: "AN" },
      { id: "ch", name: "Chandigarh", code: "CH" },
      { id: "dn", name: "Dadra & Nagar Haveli and Daman & Diu", code: "DN" },
      { id: "dl", name: "Delhi NCR", code: "DL" },
      { id: "jk", name: "Jammu and Kashmir", code: "JK" },
      { id: "la", name: "Ladakh", code: "LA" },
      { id: "ld", name: "Lakshadweep", code: "LD" },
      { id: "py", name: "Puducherry", code: "PY" },
    ],
    cities: [
      // Gujarat
      {
        id: "ahmedabad",
        name: "Ahmedabad",
        stateOrRegion: "Gujarat",
        stateCode: "GJ",
        hashtags: ["#Ahmedabad", "#Amdavad", "#AhmedabadCity", "#AhmedabadDiaries", "#Amdavadi", "#Gujarat", "#AmdavadBuzz"],
        areas: [
          { id: "ahm-380001", name: "Lal Darwaja / Old City", postalCode: "380001", hashtags: ["#OldCityAhmedabad", "#LalDarwaja", "#380001"] },
          { id: "ahm-380009", name: "Navrangpura / CG Road", postalCode: "380009", hashtags: ["#CGRoad", "#Navrangpura", "#380009"] },
          { id: "ahm-380015", name: "Vastrapur / IIM Road", postalCode: "380015", hashtags: ["#Vastrapur", "#IIMA", "#VastrapurLake", "#380015"] },
          { id: "ahm-380054", name: "Bodakdev & Satellite", postalCode: "380054", hashtags: ["#Bodakdev", "#SatelliteAhmedabad", "#380054"] },
          { id: "ahm-380059", name: "Rajpath Club / SG Highway / Sola", postalCode: "380059", hashtags: ["#RajpathClub", "#SGHwy", "#SolaAhmedabad", "#380059"] },
          { id: "ahm-380058", name: "Bopal / South Bopal", postalCode: "380058", hashtags: ["#Bopal", "#SouthBopal", "#380058"] },
          { id: "ahm-380051", name: "Prahlad Nagar", postalCode: "380051", hashtags: ["#PrahladNagar", "#SGHighway", "#380051"] },
          { id: "ahm-382481", name: "Science City", postalCode: "382481", hashtags: ["#ScienceCity", "#382481"] },
        ],
      },
      {
        id: "surat",
        name: "Surat",
        stateOrRegion: "Gujarat",
        stateCode: "GJ",
        hashtags: ["#Surat", "#Surti", "#SuratCity", "#DiamondCity", "#TextileCity", "#Gujarat"],
        areas: [
          { id: "sur-395001", name: "Ring Road / Textile Market", postalCode: "395001", hashtags: ["#SuratTextiles", "#RingRoadSurat", "#395001"] },
          { id: "sur-395007", name: "Vesu & VIP Road", postalCode: "395007", hashtags: ["#Vesu", "#VIPRoadSurat", "#395007"] },
          { id: "sur-395009", name: "Adajan & Pal", postalCode: "395009", hashtags: ["#Adajan", "#PalSurat", "#395009"] },
          { id: "sur-395003", name: "Varachha (Diamond Hub)", postalCode: "395003", hashtags: ["#Varachha", "#DiamondMarket", "#395003"] },
        ],
      },
      {
        id: "vadodara",
        name: "Vadodara",
        stateOrRegion: "Gujarat",
        stateCode: "GJ",
        hashtags: ["#Vadodara", "#Baroda", "#CulturalCapital", "#SayajiNagari", "#Gujarat"],
        areas: [
          { id: "vad-390001", name: "Mandvi / Old Baroda", postalCode: "390001", hashtags: ["#Mandvi", "#OldBaroda", "#390001"] },
          { id: "vad-390007", name: "Alkapuri", postalCode: "390007", hashtags: ["#Alkapuri", "#VadodaraCentre", "#390007"] },
          { id: "vad-390020", name: "Vasna & Bhayli", postalCode: "390020", hashtags: ["#Bhayli", "#VasnaRoad", "#390020"] },
        ],
      },
      {
        id: "rajkot",
        name: "Rajkot",
        stateOrRegion: "Gujarat",
        stateCode: "GJ",
        hashtags: ["#Rajkot", "#RangiluRajkot", "#Saurashtra", "#Gujarat"],
        areas: [
          { id: "raj-360001", name: "Dhebar Road / Old Rajkot", postalCode: "360001", hashtags: ["#360001"] },
          { id: "raj-360005", name: "Kalawad Road & 150ft Ring Road", postalCode: "360005", hashtags: ["#KalawadRoad", "#360005"] },
        ],
      },
      {
        id: "gandhinagar",
        name: "Gandhinagar",
        stateOrRegion: "Gujarat",
        stateCode: "GJ",
        hashtags: ["#Gandhinagar", "#GIFTcity", "#GujaratCapital"],
        areas: [
          { id: "gan-382010", name: "Sector 10 & 11", postalCode: "382010", hashtags: ["#Sector11", "#382010"] },
          { id: "gan-382355", name: "GIFT City", postalCode: "382355", hashtags: ["#GIFTCity", "#382355"] },
        ],
      },

      // Maharashtra
      {
        id: "mumbai",
        name: "Mumbai",
        stateOrRegion: "Maharashtra",
        stateCode: "MH",
        hashtags: ["#Mumbai", "#Bombay", "#AamchiMumbai", "#MumbaiDiaries", "#Bandra", "#MarineDrive", "#Maharashtra"],
        areas: [
          { id: "mum-400001", name: "Fort / Nariman Point / Colaba", postalCode: "400001", hashtags: ["#Colaba", "#FortMumbai", "#MarineDrive", "#400001"] },
          { id: "mum-400050", name: "Bandra West", postalCode: "400050", hashtags: ["#Bandra", "#BandraWest", "#HillRoad", "#400050"] },
          { id: "mum-400051", name: "Bandra Kurla Complex (BKC)", postalCode: "400051", hashtags: ["#BKC", "#BandraKurlaComplex", "#FinanceHub", "#400051"] },
          { id: "mum-400053", name: "Andheri West & Lokhandwala", postalCode: "400053", hashtags: ["#AndheriWest", "#Lokhandwala", "#400053"] },
          { id: "mum-400076", name: "Powai & Hiranandani", postalCode: "400076", hashtags: ["#Powai", "#HiranandaniPowai", "#400076"] },
          { id: "mum-400049", name: "Juhu", postalCode: "400049", hashtags: ["#Juhu", "#JuhuBeach", "#400049"] },
          { id: "mum-400013", name: "Lower Parel", postalCode: "400013", hashtags: ["#LowerParel", "#PhoenixMills", "#400013"] },
        ],
      },
      {
        id: "pune",
        name: "Pune",
        stateOrRegion: "Maharashtra",
        stateCode: "MH",
        hashtags: ["#Pune", "#Puneri", "#PuneCity", "#PuneDiaries", "#KoregaonPark", "#Maharashtra"],
        areas: [
          { id: "pun-411001", name: "Camp & Station Area", postalCode: "411001", hashtags: ["#PuneCamp", "#MGroadPune", "#411001"] },
          { id: "pun-411004", name: "Deccan Gymkhana & FC Road", postalCode: "411004", hashtags: ["#FCRoad", "#DeccanPune", "#411004"] },
          { id: "pun-411006", name: "Koregaon Park & Kalyani Nagar", postalCode: "411006", hashtags: ["#KoregaonPark", "#KalyaniNagar", "#411006"] },
          { id: "pun-411057", name: "Hinjawadi IT Park", postalCode: "411057", hashtags: ["#Hinjawadi", "#PuneTech", "#411057"] },
          { id: "pun-411014", name: "Viman Nagar", postalCode: "411014", hashtags: ["#VimanNagar", "#PhoenixMarketcity", "#411014"] },
        ],
      },
      {
        id: "nagpur",
        name: "Nagpur",
        stateOrRegion: "Maharashtra",
        stateCode: "MH",
        hashtags: ["#Nagpur", "#OrangeCity", "#Vidarbha"],
        areas: [
          { id: "nag-440001", name: "Civil Lines & Sitabuldi", postalCode: "440001", hashtags: ["#Sitabuldi", "#440001"] },
        ],
      },
      {
        id: "thane",
        name: "Thane",
        stateOrRegion: "Maharashtra",
        stateCode: "MH",
        hashtags: ["#Thane", "#ThaneCity", "#GhodbunderRoad"],
        areas: [
          { id: "tha-400601", name: "Thane West / Panchpakhadi", postalCode: "400601", hashtags: ["#ThaneWest", "#400601"] },
        ],
      },

      // Karnataka
      {
        id: "bengaluru",
        name: "Bengaluru",
        stateOrRegion: "Karnataka",
        stateCode: "KA",
        hashtags: ["#Bengaluru", "#Bangalore", "#NammaBengaluru", "#SiliconValleyOfIndia", "#Indiranagar", "#Koramangala", "#Karnataka"],
        areas: [
          { id: "blr-560001", name: "MG Road & Brigade Road", postalCode: "560001", hashtags: ["#MGRoad", "#BrigadeRoad", "#CubbonPark", "#560001"] },
          { id: "blr-560034", name: "Koramangala", postalCode: "560034", hashtags: ["#Koramangala", "#BangaloreStartups", "#560034"] },
          { id: "blr-560038", name: "Indiranagar / 100ft Road", postalCode: "560038", hashtags: ["#Indiranagar", "#100ftRoad", "#560038"] },
          { id: "blr-560066", name: "Whitefield (Tech Corridor)", postalCode: "560066", hashtags: ["#Whitefield", "#ITPB", "#BangaloreTech", "#560066"] },
          { id: "blr-560102", name: "HSR Layout", postalCode: "560102", hashtags: ["#HSRLayout", "#StartupsHSR", "#560102"] },
          { id: "blr-560100", name: "Electronic City", postalCode: "560100", hashtags: ["#ElectronicCity", "#ECity", "#560100"] },
        ],
      },
      {
        id: "mysuru",
        name: "Mysuru",
        stateOrRegion: "Karnataka",
        stateCode: "KA",
        hashtags: ["#Mysuru", "#Mysore", "#HeritageCity", "#MysorePalace"],
        areas: [
          { id: "mys-570001", name: "Palace Area & Devaraja Market", postalCode: "570001", hashtags: ["#MysorePalace", "#570001"] },
        ],
      },

      // Delhi NCR
      {
        id: "delhi",
        name: "Delhi",
        stateOrRegion: "Delhi NCR",
        stateCode: "DL",
        hashtags: ["#Delhi", "#NewDelhi", "#Dilli", "#DelhiNCR", "#ConnaughtPlace", "#DilliHaiDilWalonKi"],
        areas: [
          { id: "del-110001", name: "Connaught Place (CP)", postalCode: "110001", hashtags: ["#ConnaughtPlace", "#CPDelhi", "#CentralDelhi", "#110001"] },
          { id: "del-110016", name: "Hauz Khas & Green Park", postalCode: "110016", hashtags: ["#HauzKhas", "#HKV", "#SouthDelhi", "#110016"] },
          { id: "del-110024", name: "Lajpat Nagar & Defence Colony", postalCode: "110024", hashtags: ["#LajpatNagar", "#DefenceColony", "#110024"] },
          { id: "del-110092", name: "Laxmi Nagar & East Delhi", postalCode: "110092", hashtags: ["#EastDelhi", "#110092"] },
        ],
      },
      {
        id: "noida",
        name: "Noida",
        stateOrRegion: "Uttar Pradesh",
        stateCode: "UP",
        hashtags: ["#Noida", "#NoidaSector18", "#DelhiNCR", "#NoidaCity"],
        areas: [
          { id: "noi-201301", name: "Sector 18 & Atta Market", postalCode: "201301", hashtags: ["#Sector18Noida", "#201301"] },
          { id: "noi-201304", name: "Sector 137 / Express Highway", postalCode: "201304", hashtags: ["#NoidaExpressway", "#201304"] },
        ],
      },
      {
        id: "gurugram",
        name: "Gurugram",
        stateOrRegion: "Haryana",
        stateCode: "HR",
        hashtags: ["#Gurugram", "#Gurgaon", "#CyberHub", "#GolfCourseRoad", "#MillenniumCity"],
        areas: [
          { id: "ggn-122002", name: "Cyber City & DLF Phase 2", postalCode: "122002", hashtags: ["#CyberHub", "#CyberCity", "#DLFPhase2", "#122002"] },
          { id: "ggn-122018", name: "Golf Course Road", postalCode: "122018", hashtags: ["#GolfCourseRoad", "#GurgaonTech", "#122018"] },
        ],
      },

      // Telangana
      {
        id: "hyderabad",
        name: "Hyderabad",
        stateOrRegion: "Telangana",
        stateCode: "TS",
        hashtags: ["#Hyderabad", "#HyderabadDiaries", "#HITECcity", "#BanjaraHills", "#JubileeHills", "#Telangana"],
        areas: [
          { id: "hyd-500001", name: "Abids & Charminar Old City", postalCode: "500001", hashtags: ["#Charminar", "#OldCityHyderabad", "#500001"] },
          { id: "hyd-500034", name: "Banjara Hills & Jubilee Hills", postalCode: "500034", hashtags: ["#BanjaraHills", "#JubileeHills", "#500034"] },
          { id: "hyd-500081", name: "HITEC City / Madhapur", postalCode: "500081", hashtags: ["#HITECCity", "#Madhapur", "#HyderabadStartups", "#500081"] },
          { id: "hyd-500032", name: "Gachibowli", postalCode: "500032", hashtags: ["#Gachibowli", "#FinancialDistrictHyd", "#500032"] },
        ],
      },

      // Tamil Nadu
      {
        id: "chennai",
        name: "Chennai",
        stateOrRegion: "Tamil Nadu",
        stateCode: "TN",
        hashtags: ["#Chennai", "#Madras", "#NammaChennai", "#TNagar", "#MarinaBeach", "#TamilNadu"],
        areas: [
          { id: "che-600001", name: "Parrys & George Town", postalCode: "600001", hashtags: ["#ParrysCorner", "#GeorgeTownChennai", "#600001"] },
          { id: "che-600017", name: "T Nagar (Shopping Hub)", postalCode: "600017", hashtags: ["#TNagar", "#PondyBazaar", "#600017"] },
          { id: "che-600096", name: "OMR (IT Corridor)", postalCode: "600096", hashtags: ["#OMR", "#ChennaiIT", "#600096"] },
        ],
      },
      {
        id: "coimbatore",
        name: "Coimbatore",
        stateOrRegion: "Tamil Nadu",
        stateCode: "TN",
        hashtags: ["#Coimbatore", "#Kovai", "#ManchesterOfSouthIndia"],
        areas: [
          { id: "cbe-641001", name: "Town Hall & Gandhipuram", postalCode: "641001", hashtags: ["#Gandhipuram", "#641001"] },
          { id: "cbe-641002", name: "RS Puram", postalCode: "641002", hashtags: ["#RSPuram", "#641002"] },
        ],
      },

      // West Bengal
      {
        id: "kolkata",
        name: "Kolkata",
        stateOrRegion: "West Bengal",
        stateCode: "WB",
        hashtags: ["#Kolkata", "#Calcutta", "#CityOfJoy", "#ParkStreet", "#HowrahBridge", "#WestBengal"],
        areas: [
          { id: "kol-700016", name: "Park Street & Camac Street", postalCode: "700016", hashtags: ["#ParkStreet", "#CamacStreet", "#700016"] },
          { id: "kol-700091", name: "Salt Lake (Sector V IT Hub)", postalCode: "700091", hashtags: ["#SectorV", "#SaltLakeKolkata", "#700091"] },
        ],
      },

      // Rajasthan
      {
        id: "jaipur",
        name: "Jaipur",
        stateOrRegion: "Rajasthan",
        stateCode: "RJ",
        hashtags: ["#Jaipur", "#PinkCity", "#JaipurDiaries", "#HawaMahal", "#Rajasthan"],
        areas: [
          { id: "jai-302001", name: "Johari Bazar / Walled City", postalCode: "302001", hashtags: ["#PinkCity", "#HawaMahal", "#302001"] },
          { id: "jai-302015", name: "C-Scheme & MI Road", postalCode: "302015", hashtags: ["#CScheme", "#MIRoadJaipur", "#302015"] },
          { id: "jai-302020", name: "Malviya Nagar & Mansarovar", postalCode: "302020", hashtags: ["#MalviyaNagar", "#302020"] },
        ],
      },
      {
        id: "jodhpur",
        name: "Jodhpur",
        stateOrRegion: "Rajasthan",
        stateCode: "RJ",
        hashtags: ["#Jodhpur", "#BlueCity", "#MehrangarhFort"],
        areas: [
          { id: "jod-342001", name: "Clock Tower & Old City", postalCode: "342001", hashtags: ["#342001"] },
        ],
      },

      // Uttar Pradesh
      {
        id: "lucknow",
        name: "Lucknow",
        stateOrRegion: "Uttar Pradesh",
        stateCode: "UP",
        hashtags: ["#Lucknow", "#CityOfNawabs", "#Hazratganj", "#UttarPradesh"],
        areas: [
          { id: "lko-226001", name: "Hazratganj", postalCode: "226001", hashtags: ["#Hazratganj", "#226001"] },
          { id: "lko-226010", name: "Gomti Nagar", postalCode: "226010", hashtags: ["#GomtiNagar", "#226010"] },
        ],
      },
      {
        id: "kanpur",
        name: "Kanpur",
        stateOrRegion: "Uttar Pradesh",
        stateCode: "UP",
        hashtags: ["#Kanpur", "#IndustrialCapitalOfUP"],
        areas: [
          { id: "kan-208001", name: "Civil Lines Kanpur", postalCode: "208001", hashtags: ["#208001"] },
        ],
      },
      {
        id: "varanasi",
        name: "Varanasi",
        stateOrRegion: "Uttar Pradesh",
        stateCode: "UP",
        hashtags: ["#Varanasi", "#Kashi", "#Banaras", "#GhatsOfVaranasi"],
        areas: [
          { id: "var-221001", name: "Dashashwamedh Ghat", postalCode: "221001", hashtags: ["#Kashi", "#221001"] },
        ],
      },

      // Madhya Pradesh
      {
        id: "indore",
        name: "Indore",
        stateOrRegion: "Madhya Pradesh",
        stateCode: "MP",
        hashtags: ["#Indore", "#Indori", "#CleanestCity", "#SarafaBazaar", "#MadhyaPradesh"],
        areas: [
          { id: "ind-452001", name: "Rajwada & Sarafa Bazaar", postalCode: "452001", hashtags: ["#Sarafa", "#Rajwada", "#452001"] },
          { id: "ind-452010", name: "Vijay Nagar", postalCode: "452010", hashtags: ["#VijayNagarIndore", "#452010"] },
        ],
      },
      {
        id: "bhopal",
        name: "Bhopal",
        stateOrRegion: "Madhya Pradesh",
        stateCode: "MP",
        hashtags: ["#Bhopal", "#CityOfLakes", "#MPCapital"],
        areas: [
          { id: "bho-462001", name: "Old Bhopal & Upper Lake", postalCode: "462001", hashtags: ["#462001"] },
          { id: "bho-462016", name: "MP Nagar", postalCode: "462016", hashtags: ["#MPNagar", "#462016"] },
        ],
      },

      // Kerala
      {
        id: "kochi",
        name: "Kochi",
        stateOrRegion: "Kerala",
        stateCode: "KL",
        hashtags: ["#Kochi", "#Cochin", "#FortKochi", "#MarineDriveKochi", "#Kerala"],
        areas: [
          { id: "koc-682001", name: "Fort Kochi & Mattancherry", postalCode: "682001", hashtags: ["#FortKochi", "#682001"] },
          { id: "koc-682016", name: "MG Road & Marine Drive", postalCode: "682016", hashtags: ["#MarineDriveKochi", "#682016"] },
        ],
      },
      {
        id: "thiruvananthapuram",
        name: "Thiruvananthapuram",
        stateOrRegion: "Kerala",
        stateCode: "KL",
        hashtags: ["#Trivandrum", "#Thiruvananthapuram", "#Technopark"],
        areas: [
          { id: "trv-695001", name: "Palayam & Statue", postalCode: "695001", hashtags: ["#695001"] },
          { id: "trv-695581", name: "Technopark / Kazhakkoottam", postalCode: "695581", hashtags: ["#Technopark", "#695581"] },
        ],
      },

      // Punjab
      {
        id: "ludhiana",
        name: "Ludhiana",
        stateOrRegion: "Punjab",
        stateCode: "PB",
        hashtags: ["#Ludhiana", "#PunjabBusiness"],
        areas: [
          { id: "lud-141001", name: "Civil Lines & Chaura Bazar", postalCode: "141001", hashtags: ["#141001"] },
        ],
      },
      {
        id: "amritsar",
        name: "Amritsar",
        stateOrRegion: "Punjab",
        stateCode: "PB",
        hashtags: ["#Amritsar", "#GoldenTemple", "#Punjab"],
        areas: [
          { id: "amr-143001", name: "Golden Temple Complex", postalCode: "143001", hashtags: ["#GoldenTemple", "#143001"] },
        ],
      },

      // Goa
      {
        id: "goa",
        name: "Goa",
        stateOrRegion: "Goa",
        stateCode: "GA",
        hashtags: ["#Goa", "#GoaDiaries", "#Panjim", "#NorthGoa", "#SouthGoa"],
        areas: [
          { id: "goa-403001", name: "Panaji / Fontainhas", postalCode: "403001", hashtags: ["#Panaji", "#Fontainhas", "#403001"] },
          { id: "goa-403516", name: "Calangute & Baga", postalCode: "403516", hashtags: ["#Calangute", "#BagaBeach", "#403516"] },
          { id: "goa-403601", name: "Margao (South Goa)", postalCode: "403601", hashtags: ["#Margao", "#403601"] },
        ],
      },

      // Andhra Pradesh
      {
        id: "visakhapatnam",
        name: "Visakhapatnam",
        stateOrRegion: "Andhra Pradesh",
        stateCode: "AP",
        hashtags: ["#Visakhapatnam", "#Vizag", "#RKBeach", "#AndhraPradesh"],
        areas: [
          { id: "viz-530001", name: "RK Beach & Jagadamba", postalCode: "530001", hashtags: ["#RKBeach", "#530001"] },
        ],
      },
      {
        id: "vijayawada",
        name: "Vijayawada",
        stateOrRegion: "Andhra Pradesh",
        stateCode: "AP",
        hashtags: ["#Vijayawada", "#Amaravati", "#AndhraPradesh"],
        areas: [
          { id: "vij-520001", name: "Besant Road & Governorpet", postalCode: "520001", hashtags: ["#520001"] },
        ],
      },

      // Assam
      {
        id: "guwahati",
        name: "Guwahati",
        stateOrRegion: "Assam",
        stateCode: "AS",
        hashtags: ["#Guwahati", "#Assam", "#NortheastIndia"],
        areas: [
          { id: "guw-781001", name: "Paltan Bazaar & Pan Bazaar", postalCode: "781001", hashtags: ["#781001"] },
        ],
      },

      // Bihar
      {
        id: "patna",
        name: "Patna",
        stateOrRegion: "Bihar",
        stateCode: "BR",
        hashtags: ["#Patna", "#Bihar", "#PatnaDiaries"],
        areas: [
          { id: "pat-800001", name: "Frazer Road & Dak Bungalow", postalCode: "800001", hashtags: ["#800001"] },
        ],
      },

      // Chhattisgarh
      {
        id: "raipur",
        name: "Raipur",
        stateOrRegion: "Chhattisgarh",
        stateCode: "CG",
        hashtags: ["#Raipur", "#Chhattisgarh"],
        areas: [
          { id: "rai-492001", name: "Jaistambh Chowk & Pandri", postalCode: "492001", hashtags: ["#492001"] },
        ],
      },

      // Himachal Pradesh
      {
        id: "shimla",
        name: "Shimla",
        stateOrRegion: "Himachal Pradesh",
        stateCode: "HP",
        hashtags: ["#Shimla", "#MallRoadShimla", "#Himachal"],
        areas: [
          { id: "shm-171001", name: "The Mall & Ridge", postalCode: "171001", hashtags: ["#TheRidgeShimla", "#171001"] },
        ],
      },

      // Jharkhand
      {
        id: "ranchi",
        name: "Ranchi",
        stateOrRegion: "Jharkhand",
        stateCode: "JH",
        hashtags: ["#Ranchi", "#Jharkhand"],
        areas: [
          { id: "ran-834001", name: "Main Road Ranchi", postalCode: "834001", hashtags: ["#834001"] },
        ],
      },

      // Odisha
      {
        id: "bhubaneswar",
        name: "Bhubaneswar",
        stateOrRegion: "Odisha",
        stateCode: "OD",
        hashtags: ["#Bhubaneswar", "#TempleCity", "#Odisha"],
        areas: [
          { id: "bhu-751001", name: "Saheed Nagar & Master Canteen", postalCode: "751001", hashtags: ["#751001"] },
        ],
      },

      // Uttarakhand
      {
        id: "dehradun",
        name: "Dehradun",
        stateOrRegion: "Uttarakhand",
        stateCode: "UK",
        hashtags: ["#Dehradun", "#Doon", "#Uttarakhand"],
        areas: [
          { id: "ddn-248001", name: "Clock Tower & Rajpur Road", postalCode: "248001", hashtags: ["#248001"] },
        ],
      },

      // Union Territories
      {
        id: "chandigarh",
        name: "Chandigarh",
        stateOrRegion: "Chandigarh",
        stateCode: "CH",
        hashtags: ["#Chandigarh", "#TheCityBeautiful", "#SukhnaLake", "#Sector17"],
        areas: [
          { id: "chd-160017", name: "Sector 17 (Plaza)", postalCode: "160017", hashtags: ["#Sector17Chandigarh", "#160017"] },
          { id: "chd-160036", name: "Sector 35", postalCode: "160036", hashtags: ["#160036"] },
        ],
      },
      {
        id: "srinagar",
        name: "Srinagar",
        stateOrRegion: "Jammu and Kashmir",
        stateCode: "JK",
        hashtags: ["#Srinagar", "#DalLake", "#Kashmir"],
        areas: [
          { id: "sri-190001", name: "Lal Chowk & Dal Lake", postalCode: "190001", hashtags: ["#190001"] },
        ],
      },
      {
        id: "puducherry",
        name: "Puducherry",
        stateOrRegion: "Puducherry",
        stateCode: "PY",
        hashtags: ["#Puducherry", "#Pondicherry", "#WhiteTown"],
        areas: [
          { id: "pdy-605001", name: "White Town / Promenade Beach", postalCode: "605001", hashtags: ["#WhiteTownPondy", "#605001"] },
        ],
      },
      {
        id: "itanagar",
        name: "Itanagar",
        stateOrRegion: "Arunachal Pradesh",
        stateCode: "AR",
        hashtags: ["#Itanagar", "#ArunachalPradesh"],
        areas: [{ id: "ita-791111", name: "Ganga Market", postalCode: "791111", hashtags: ["#791111"] }],
      },
      {
        id: "imphal",
        name: "Imphal",
        stateOrRegion: "Manipur",
        stateCode: "MN",
        hashtags: ["#Imphal", "#Manipur"],
        areas: [{ id: "imp-795001", name: "Khwairamband Bazaar", postalCode: "795001", hashtags: ["#795001"] }],
      },
      {
        id: "shillong",
        name: "Shillong",
        stateOrRegion: "Meghalaya",
        stateCode: "ML",
        hashtags: ["#Shillong", "#Meghalaya", "#ScotlandOfTheEast"],
        areas: [{ id: "shl-793001", name: "Police Bazar", postalCode: "793001", hashtags: ["#793001"] }],
      },
      {
        id: "aizawl",
        name: "Aizawl",
        stateOrRegion: "Mizoram",
        stateCode: "MZ",
        hashtags: ["#Aizawl", "#Mizoram"],
        areas: [{ id: "aiz-796001", name: "Bara Bazar", postalCode: "796001", hashtags: ["#796001"] }],
      },
      {
        id: "kohima",
        name: "Kohima",
        stateOrRegion: "Nagaland",
        stateCode: "NL",
        hashtags: ["#Kohima", "#Nagaland"],
        areas: [{ id: "koh-797001", name: "Main Town Kohima", postalCode: "797001", hashtags: ["#797001"] }],
      },
      {
        id: "gangtok",
        name: "Gangtok",
        stateOrRegion: "Sikkim",
        stateCode: "SK",
        hashtags: ["#Gangtok", "#Sikkim", "#MGMarg"],
        areas: [{ id: "gan-737101", name: "MG Marg", postalCode: "737101", hashtags: ["#737101"] }],
      },
      {
        id: "agartala",
        name: "Agartala",
        stateOrRegion: "Tripura",
        stateCode: "TR",
        hashtags: ["#Agartala", "#Tripura"],
        areas: [{ id: "aga-799001", name: "Ujjayanta Palace Area", postalCode: "799001", hashtags: ["#799001"] }],
      },
      {
        id: "port-blair",
        name: "Port Blair",
        stateOrRegion: "Andaman and Nicobar Islands",
        stateCode: "AN",
        hashtags: ["#PortBlair", "#Andaman"],
        areas: [{ id: "ptb-744101", name: "Aberdeen Bazaar", postalCode: "744101", hashtags: ["#744101"] }],
      },
      {
        id: "daman",
        name: "Daman",
        stateOrRegion: "Dadra & Nagar Haveli and Daman & Diu",
        stateCode: "DN",
        hashtags: ["#Daman", "#Diu"],
        areas: [{ id: "dam-396210", name: "Nani Daman", postalCode: "396210", hashtags: ["#396210"] }],
      },
      {
        id: "leh",
        name: "Leh",
        stateOrRegion: "Ladakh",
        stateCode: "LA",
        hashtags: ["#LehLadakh", "#Ladakh"],
        areas: [{ id: "leh-194101", name: "Main Bazaar Leh", postalCode: "194101", hashtags: ["#194101"] }],
      },
      {
        id: "kavaratti",
        name: "Kavaratti",
        stateOrRegion: "Lakshadweep",
        stateCode: "LD",
        hashtags: ["#Kavaratti", "#Lakshadweep"],
        areas: [{ id: "kav-682555", name: "Kavaratti Island", postalCode: "682555", hashtags: ["#682555"] }],
      },
    ],
  },
];

/**
 * Get all supported countries (United States, Canada, India).
 */
export function getGeoCountries(): GeoCountry[] {
  return GEO_DATA;
}

/**
 * Get states for a specific country
 */
export function getGeoStates(countryIdOrName: string): GeoState[] {
  if (!countryIdOrName) return [];
  const normalized = countryIdOrName.trim().toLowerCase();
  const country = GEO_DATA.find(
    (c) =>
      c.id.toLowerCase() === normalized ||
      c.name.toLowerCase() === normalized ||
      c.code.toLowerCase() === normalized
  );
  return country?.states || [];
}

/**
 * Get cities for a specific country, optionally filtered by state/region
 */
export function getGeoCities(countryIdOrName: string, stateFilter?: string): GeoCity[] {
  if (!countryIdOrName) return [];
  const normalized = countryIdOrName.trim().toLowerCase();
  const country = GEO_DATA.find(
    (c) =>
      c.id.toLowerCase() === normalized ||
      c.name.toLowerCase() === normalized ||
      c.code.toLowerCase() === normalized
  );
  if (!country) return [];

  let cities = country.cities;
  if (stateFilter && stateFilter.trim() && stateFilter.trim().toLowerCase() !== "all") {
    const sNorm = stateFilter.trim().toLowerCase();
    cities = cities.filter(
      (c) =>
        (c.stateCode && c.stateCode.toLowerCase() === sNorm) ||
        (c.stateOrRegion && c.stateOrRegion.toLowerCase() === sNorm) ||
        (c.stateOrRegion && c.stateOrRegion.toLowerCase().includes(sNorm)) ||
        (c.stateOrRegion && sNorm.includes(c.stateOrRegion.toLowerCase()))
    );
  }

  return cities;
}

/**
 * Get areas and postal codes for a specific city within a country
 */
export function getGeoAreas(countryIdOrName: string, cityIdOrName: string): GeoArea[] {
  if (!countryIdOrName || !cityIdOrName) return [];
  const cities = getGeoCities(countryIdOrName);
  const normalizedCity = cityIdOrName.trim().toLowerCase();
  const city = cities.find(
    (c) => c.id.toLowerCase() === normalizedCity || c.name.toLowerCase() === normalizedCity
  );
  return city ? city.areas : [];
}

/**
 * Get distinct pincodes / postal codes for a selected country, city, or state.
 * Returns only the pincodes as clean items without verbose descriptions.
 */
export function getGeoPincodes(
  countryIdOrName: string,
  cityIdOrName?: string,
  stateFilter?: string
): { id: string; postalCode: string; name: string; hashtags: string[] }[] {
  if (!countryIdOrName) return [];

  if (cityIdOrName && cityIdOrName.trim() && cityIdOrName.trim().toLowerCase() !== "all") {
    const areas = getGeoAreas(countryIdOrName, cityIdOrName);
    return areas.map((a) => ({
      id: a.postalCode || a.id,
      postalCode: a.postalCode,
      name: a.postalCode,
      hashtags: a.hashtags,
    }));
  }

  // If no city selected, collect all pincodes under the state or country
  const cities = getGeoCities(countryIdOrName, stateFilter);
  const seenPincodes = new Set<string>();
  const results: { id: string; postalCode: string; name: string; hashtags: string[] }[] = [];

  for (const city of cities) {
    for (const a of city.areas) {
      if (a.postalCode && !seenPincodes.has(a.postalCode)) {
        seenPincodes.add(a.postalCode);
        results.push({
          id: a.postalCode,
          postalCode: a.postalCode,
          name: a.postalCode,
          hashtags: a.hashtags,
        });
      }
    }
  }

  return results.sort((a, b) => a.postalCode.localeCompare(b.postalCode));
}

/**
 * Clean & format single hashtag
 */
export function formatHashtag(tag: string): string {
  const cleaned = tag.replace(/[^a-zA-Z0-9_]/g, "");
  return cleaned ? `#${cleaned}` : "";
}

/**
 * Generate a comprehensive list of suggested hashtags based on selection
 */
export function generateLocationHashtags(params: {
  countryId?: string | undefined;
  stateCode?: string | undefined;
  cityId?: string | undefined;
  areaId?: string | undefined;
  customLocation?: string | undefined;
}): string[] {
  const result = new Set<string>();

  const { countryId, stateCode, cityId, areaId, customLocation } = params;

  // 1. Process custom location if present
  if (customLocation && customLocation.trim()) {
    const parts = customLocation
      .split(/[,•\-\|\/]+/)
      .map((p) => p.trim())
      .filter(Boolean);

    for (const part of parts) {
      const tag = formatHashtag(part);
      if (tag && tag.length > 2) result.add(tag);
    }
  }

  // 2. Lookup country
  const country = countryId
    ? GEO_DATA.find(
        (c) =>
          c.id.toLowerCase() === countryId.toLowerCase() ||
          c.name.toLowerCase() === countryId.toLowerCase() ||
          c.code.toLowerCase() === countryId.toLowerCase()
      )
    : undefined;

  // 3. Lookup city
  const city =
    country && cityId
      ? country.cities.find(
          (c) =>
            c.id.toLowerCase() === cityId.toLowerCase() ||
            c.name.toLowerCase() === cityId.toLowerCase()
        )
      : undefined;

  // 4. Lookup area / pincode
  if (city && areaId) {
    const area = city.areas.find(
      (a) =>
        a.id.toLowerCase() === areaId.toLowerCase() ||
        a.postalCode.toLowerCase() === areaId.toLowerCase() ||
        a.name.toLowerCase() === areaId.toLowerCase()
    );
    if (area) {
      for (const tag of area.hashtags) {
        const f = formatHashtag(tag);
        if (f) result.add(f);
      }
    } else if (/^[0-9a-zA-Z\s\-]+$/.test(areaId)) {
      result.add(formatHashtag(areaId));
    }
  } else if (areaId && /^[0-9a-zA-Z\s\-]+$/.test(areaId)) {
    result.add(formatHashtag(areaId));
  }

  // Layer 2: City & Region Tags
  if (city) {
    for (const tag of city.hashtags) {
      const f = formatHashtag(tag);
      if (f) result.add(f);
    }
    if (city.stateOrRegion) {
      const stateTag = formatHashtag(city.stateOrRegion);
      if (stateTag) result.add(stateTag);
    }
    if (city.stateCode) {
      const codeTag = formatHashtag(`${city.name.replace(/[^a-zA-Z0-9]/g, "")}${city.stateCode}`);
      if (codeTag) result.add(codeTag);
    }
  }

  // Layer 3: State tags if stateCode is provided
  if (country && stateCode && stateCode !== "all") {
    const st = country.states?.find(
      (s) =>
        s.code.toLowerCase() === stateCode.toLowerCase() ||
        s.id.toLowerCase() === stateCode.toLowerCase() ||
        s.name.toLowerCase() === stateCode.toLowerCase()
    );
    if (st) {
      result.add(formatHashtag(st.name));
      result.add(formatHashtag(st.code));
    }
  }

  // Layer 4: Country Tags
  if (country) {
    for (const tag of country.hashtags) {
      const f = formatHashtag(tag);
      if (f) result.add(f);
    }
  }

  return Array.from(result);
}
