/**
 * PostPilot — Geo & Location-Based Dynamic Hashtag Engine
 *
 * Provides hierarchical location selection (Country -> State/Region -> City -> Area / Postal Code)
 * and generates high-converting, targeted local hashtags for social media publishing
 * (Instagram, Facebook, etc.).
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
  states?: GeoState[];
  cities: GeoCity[];
}

export const GEO_DATA: GeoCountry[] = [
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
      // New York
      {
        id: "new-york",
        name: "New York City",
        stateOrRegion: "New York",
        stateCode: "NY",
        hashtags: ["#NewYork", "#NewYorkCity", "#NYC", "#Manhattan", "#NYCLife", "#BigApple", "#ILoveNY", "#NYCGo"],
        areas: [
          { id: "midtown-chelsea", name: "Midtown & Chelsea", postalCode: "10001", hashtags: ["#MidtownNYC", "#ChelseaNYC", "#ManhattanNYC", "#HudsonYards", "#PennStation", "#10001", "#NYC"] },
          { id: "soho-greenwich", name: "SoHo & Greenwich Village", postalCode: "10012", hashtags: ["#SoHoNYC", "#GreenwichVillage", "#WestVillage", "#DowntownNYC", "#SoHoStyle", "#10012"] },
          { id: "dumbo-brooklyn", name: "DUMBO & Brooklyn Heights", postalCode: "11201", hashtags: ["#Brooklyn", "#DUMBO", "#BrooklynHeights", "#BrooklynBridge", "#DumboNYC", "#11201"] },
          { id: "upper-east-side", name: "Upper East Side", postalCode: "10021", hashtags: ["#UpperEastSide", "#UES", "#MadisonAvenue", "#CentralPark", "#UESNYC", "#10021"] },
          { id: "upper-west-side", name: "Upper West Side", postalCode: "10024", hashtags: ["#UpperWestSide", "#UWS", "#LincolnCenter", "#BroadwayNYC", "#10024"] },
          { id: "financial-district", name: "Financial District & Wall Street", postalCode: "10005", hashtags: ["#FiDi", "#WallStreet", "#OneWorldTrade", "#FinancialDistrict", "#DowntownManhattan", "#10005"] },
          { id: "williamsburg", name: "Williamsburg (Brooklyn)", postalCode: "11211", hashtags: ["#Williamsburg", "#BrooklynNYC", "#BedfordAve", "#WilliamsburgBrooklyn", "#11211"] },
          { id: "astoria-queens", name: "Astoria (Queens)", postalCode: "11102", hashtags: ["#Astoria", "#QueensNYC", "#AstoriaQueens", "#QueensEats", "#11102"] },
        ],
      },
      {
        id: "buffalo",
        name: "Buffalo",
        stateOrRegion: "New York",
        stateCode: "NY",
        hashtags: ["#Buffalo", "#BuffaloNY", "#UpstateNY", "#716", "#QueenCity"],
        areas: [
          { id: "downtown-buffalo", name: "Downtown & Elmwood Village", postalCode: "14202", hashtags: ["#DowntownBuffalo", "#ElmwoodVillage", "#14202"] },
        ],
      },
      {
        id: "albany",
        name: "Albany",
        stateOrRegion: "New York",
        stateCode: "NY",
        hashtags: ["#Albany", "#AlbanyNY", "#CapitalRegionNY", "#518"],
        areas: [
          { id: "downtown-albany", name: "Downtown Albany & Capitol", postalCode: "12207", hashtags: ["#DowntownAlbany", "#NYCapitol", "#12207"] },
        ],
      },
      // California
      {
        id: "los-angeles",
        name: "Los Angeles",
        stateOrRegion: "California",
        stateCode: "CA",
        hashtags: ["#LosAngeles", "#LA", "#LALife", "#CityOfAngels", "#SoCal", "#California"],
        areas: [
          { id: "hollywood", name: "Hollywood", postalCode: "90028", hashtags: ["#Hollywood", "#HollywoodBlvd", "#Tinseltown", "#LosAngelesEvents", "#90028"] },
          { id: "santa-monica", name: "Santa Monica", postalCode: "90401", hashtags: ["#SantaMonica", "#SantaMonicaPier", "#SiliconBeach", "#PacificOcean", "#90401"] },
          { id: "beverly-hills", name: "Beverly Hills", postalCode: "90210", hashtags: ["#BeverlyHills", "#RodeoDrive", "#LuxuryLA", "#BeverlyHills90210", "#90210"] },
          { id: "dtla", name: "Downtown Los Angeles (DTLA)", postalCode: "90015", hashtags: ["#DTLA", "#DowntownLA", "#CryptoArena", "#ArtDistrictLA", "#90015"] },
          { id: "venice-beach", name: "Venice Beach & Abbot Kinney", postalCode: "90291", hashtags: ["#VeniceBeach", "#AbbotKinney", "#VeniceVibes", "#90291"] },
        ],
      },
      {
        id: "san-francisco",
        name: "San Francisco",
        stateOrRegion: "California",
        stateCode: "CA",
        hashtags: ["#SanFrancisco", "#SF", "#BayArea", "#SFLife", "#NorCal", "#SiliconValley"],
        areas: [
          { id: "soma-tech", name: "SoMa / Tech District", postalCode: "94103", hashtags: ["#SoMa", "#SoMaSF", "#TechSF", "#SanFranciscoStartups", "#MosconeCenter", "#94103"] },
          { id: "mission-district", name: "Mission District", postalCode: "94110", hashtags: ["#MissionDistrict", "#ValenciaSt", "#DoloresPark", "#MissionSF", "#94110"] },
          { id: "financial-district-sf", name: "Financial District (FiDi)", postalCode: "94104", hashtags: ["#FiDiSF", "#MontgomerySt", "#Embarcadero", "#SanFranciscoBusiness", "#94104"] },
        ],
      },
      {
        id: "san-diego",
        name: "San Diego",
        stateOrRegion: "California",
        stateCode: "CA",
        hashtags: ["#SanDiego", "#SanDiegoLife", "#AmericaFinestCity", "#SDLife", "#GaslampQuarter"],
        areas: [
          { id: "gaslamp-sandiego", name: "Gaslamp Quarter & Downtown", postalCode: "92101", hashtags: ["#GaslampQuarter", "#DowntownSanDiego", "#92101"] },
          { id: "la-jolla", name: "La Jolla", postalCode: "92037", hashtags: ["#LaJolla", "#LaJollaCove", "#SanDiegoCoast", "#92037"] },
        ],
      },
      {
        id: "san-jose",
        name: "San Jose",
        stateOrRegion: "California",
        stateCode: "CA",
        hashtags: ["#SanJose", "#SiliconValley", "#SanJoseCA", "#TechHub", "#BayAreaTech"],
        areas: [
          { id: "downtown-sanjose", name: "Downtown San Jose & Santana Row", postalCode: "95113", hashtags: ["#DowntownSanJose", "#SantanaRow", "#95113"] },
        ],
      },
      {
        id: "sacramento",
        name: "Sacramento",
        stateOrRegion: "California",
        stateCode: "CA",
        hashtags: ["#Sacramento", "#SacramentoCA", "#SacCity", "#NorCalCapital"],
        areas: [
          { id: "midtown-sacramento", name: "Midtown & Downtown", postalCode: "95814", hashtags: ["#MidtownSac", "#DowntownSac", "#95814"] },
        ],
      },
      // Texas
      {
        id: "houston",
        name: "Houston",
        stateOrRegion: "Texas",
        stateCode: "TX",
        hashtags: ["#Houston", "#HoustonTX", "#HTown", "#SpaceCity", "#HoustonLife", "#Texas"],
        areas: [
          { id: "downtown-houston", name: "Downtown & Theater District", postalCode: "77002", hashtags: ["#DowntownHouston", "#HTownPride", "#77002"] },
          { id: "galleria-uptown", name: "The Galleria & Uptown", postalCode: "77056", hashtags: ["#HoustonGalleria", "#UptownHouston", "#77056"] },
          { id: "the-heights", name: "Houston Heights", postalCode: "77008", hashtags: ["#HoustonHeights", "#TheHeightsHTX", "#77008"] },
        ],
      },
      {
        id: "dallas",
        name: "Dallas",
        stateOrRegion: "Texas",
        stateCode: "TX",
        hashtags: ["#Dallas", "#DallasTX", "#DFW", "#DallasLife", "#BigD", "#NorthTexas"],
        areas: [
          { id: "downtown-dallas", name: "Downtown Dallas & Arts District", postalCode: "75201", hashtags: ["#DowntownDallas", "#DallasArtsDistrict", "#75201"] },
          { id: "uptown-dallas", name: "Uptown & Victory Park", postalCode: "75204", hashtags: ["#UptownDallas", "#VictoryPark", "#75204"] },
          { id: "deep-ellum", name: "Deep Ellum", postalCode: "75226", hashtags: ["#DeepEllum", "#DeepEllumDallas", "#75226"] },
        ],
      },
      {
        id: "austin",
        name: "Austin",
        stateOrRegion: "Texas",
        stateCode: "TX",
        hashtags: ["#Austin", "#AustinTX", "#ATX", "#KeepAustinWeird", "#SiliconHills", "#AustinLife"],
        areas: [
          { id: "downtown-austin", name: "Downtown Austin", postalCode: "78701", hashtags: ["#DowntownAustin", "#CongressAve", "#RaineyStreet", "#78701"] },
          { id: "south-congress", name: "South Congress (SoCo)", postalCode: "78704", hashtags: ["#SoCoAustin", "#SouthCongress", "#Zilker", "#78704"] },
          { id: "the-domain", name: "The Domain & North Austin", postalCode: "78758", hashtags: ["#TheDomain", "#DomainNorthside", "#NorthAustin", "#78758"] },
        ],
      },
      {
        id: "san-antonio",
        name: "San Antonio",
        stateOrRegion: "Texas",
        stateCode: "TX",
        hashtags: ["#SanAntonio", "#SanAntonioTX", "#SATX", "#RiverWalk", "#AlamoCity"],
        areas: [
          { id: "riverwalk-downtown", name: "Downtown & River Walk", postalCode: "78205", hashtags: ["#SanAntonioRiverWalk", "#TheAlamo", "#78205"] },
          { id: "pearl-district", name: "The Pearl District", postalCode: "78215", hashtags: ["#PearlDistrict", "#HistoricPearl", "#78215"] },
        ],
      },
      {
        id: "fort-worth",
        name: "Fort Worth",
        stateOrRegion: "Texas",
        stateCode: "TX",
        hashtags: ["#FortWorth", "#FortWorthTX", "#Cowtown", "#DFW", "#Stockyards"],
        areas: [
          { id: "sundance-square", name: "Sundance Square & Downtown", postalCode: "76102", hashtags: ["#SundanceSquare", "#DowntownFortWorth", "#76102"] },
        ],
      },
      // Florida
      {
        id: "miami",
        name: "Miami",
        stateOrRegion: "Florida",
        stateCode: "FL",
        hashtags: ["#Miami", "#MiamiLife", "#SouthFlorida", "#MagicCity", "#Florida", "#MiamiEvents"],
        areas: [
          { id: "south-beach", name: "South Beach & Ocean Drive", postalCode: "33139", hashtags: ["#SouthBeach", "#OceanDrive", "#MiamiBeach", "#SoBe", "#33139"] },
          { id: "brickell", name: "Brickell / Financial District", postalCode: "33131", hashtags: ["#Brickell", "#BrickellMiami", "#DowntownMiami", "#MiamiBusiness", "#33131"] },
          { id: "wynwood", name: "Wynwood Arts District", postalCode: "33127", hashtags: ["#Wynwood", "#WynwoodWalls", "#MiamiArt", "#WynwoodMiami", "#33127"] },
        ],
      },
      {
        id: "orlando",
        name: "Orlando",
        stateOrRegion: "Florida",
        stateCode: "FL",
        hashtags: ["#Orlando", "#OrlandoFL", "#TheCityBeautiful", "#CentralFlorida", "#OrlandoEvents"],
        areas: [
          { id: "downtown-orlando", name: "Downtown & Lake Eola", postalCode: "32801", hashtags: ["#DowntownOrlando", "#LakeEola", "#32801"] },
          { id: "international-drive", name: "International Drive & Theme Parks", postalCode: "32819", hashtags: ["#IDriveOrlando", "#UniversalOrlando", "#32819"] },
        ],
      },
      {
        id: "tampa",
        name: "Tampa",
        stateOrRegion: "Florida",
        stateCode: "FL",
        hashtags: ["#Tampa", "#TampaBay", "#TampaFL", "#ChampaBay", "#YborCity"],
        areas: [
          { id: "downtown-tampa", name: "Downtown & Riverwalk", postalCode: "33602", hashtags: ["#DowntownTampa", "#TampaRiverwalk", "#33602"] },
          { id: "ybor-city", name: "Ybor City Historic District", postalCode: "33605", hashtags: ["#YborCity", "#HistoricYbor", "#33605"] },
        ],
      },
      {
        id: "jacksonville",
        name: "Jacksonville",
        stateOrRegion: "Florida",
        stateCode: "FL",
        hashtags: ["#Jacksonville", "#JacksonvilleFL", "#JAX", "#Duval"],
        areas: [
          { id: "downtown-jax", name: "Downtown & San Marco", postalCode: "32202", hashtags: ["#DowntownJacksonville", "#SanMarcoJAX", "#32202"] },
        ],
      },
      // Illinois
      {
        id: "chicago",
        name: "Chicago",
        stateOrRegion: "Illinois",
        stateCode: "IL",
        hashtags: ["#Chicago", "#ChiTown", "#WindyCity", "#ChicagoLife", "#Illinois"],
        areas: [
          { id: "the-loop", name: "The Loop (Downtown)", postalCode: "60601", hashtags: ["#TheLoop", "#DowntownChicago", "#MillenniumPark", "#MichiganAve", "#60601"] },
          { id: "river-north", name: "River North & Mag Mile", postalCode: "60654", hashtags: ["#RiverNorth", "#MagnificentMile", "#ChicagoNightlife", "#MerchandiseMart", "#60654"] },
          { id: "wicker-park", name: "Wicker Park & Bucktown", postalCode: "60622", hashtags: ["#WickerPark", "#BucktownChicago", "#60622"] },
        ],
      },
      // Washington
      {
        id: "seattle",
        name: "Seattle",
        stateOrRegion: "Washington",
        stateCode: "WA",
        hashtags: ["#Seattle", "#SeattleWA", "#EmeraldCity", "#PacificNorthwest", "#PNW", "#SeattleLife"],
        areas: [
          { id: "downtown-seattle", name: "Downtown & Pike Place Market", postalCode: "98101", hashtags: ["#DowntownSeattle", "#PikePlaceMarket", "#98101"] },
          { id: "south-lake-union", name: "South Lake Union / Tech Hub", postalCode: "98109", hashtags: ["#SouthLakeUnion", "#AmazonSeattle", "#TechSeattle", "#98109"] },
          { id: "capitol-hill", name: "Capitol Hill", postalCode: "98122", hashtags: ["#CapitolHillSeattle", "#SeattleEats", "#98122"] },
        ],
      },
      // Georgia
      {
        id: "atlanta",
        name: "Atlanta",
        stateOrRegion: "Georgia",
        stateCode: "GA",
        hashtags: ["#Atlanta", "#AtlantaGA", "#ATL", "#ATLLife", "#TheA", "#Georgia"],
        areas: [
          { id: "midtown-atlanta", name: "Midtown & Piedmont Park", postalCode: "30309", hashtags: ["#MidtownAtlanta", "#PiedmontPark", "#30309"] },
          { id: "buckhead", name: "Buckhead", postalCode: "30305", hashtags: ["#BuckheadAtlanta", "#LuxuryATL", "#30305"] },
          { id: "downtown-atlanta", name: "Downtown & Centennial Park", postalCode: "30303", hashtags: ["#DowntownAtlanta", "#CentennialPark", "#30303"] },
        ],
      },
      // Massachusetts
      {
        id: "boston",
        name: "Boston",
        stateOrRegion: "Massachusetts",
        stateCode: "MA",
        hashtags: ["#Boston", "#BostonMA", "#Beantown", "#BostonLife", "#NewEngland"],
        areas: [
          { id: "back-bay", name: "Back Bay & Newbury Street", postalCode: "02116", hashtags: ["#BackBayBoston", "#NewburyStreet", "#02116"] },
          { id: "cambridge", name: "Cambridge / Harvard Square / MIT", postalCode: "02138", hashtags: ["#CambridgeMA", "#HarvardSquare", "#MIT", "#02138"] },
          { id: "seaport-boston", name: "Seaport District", postalCode: "02210", hashtags: ["#BostonSeaport", "#SeaportDistrict", "#02210"] },
        ],
      },
      // Colorado
      {
        id: "denver",
        name: "Denver",
        stateOrRegion: "Colorado",
        stateCode: "CO",
        hashtags: ["#Denver", "#DenverCO", "#MileHighCity", "#Colorado", "#DenverLife"],
        areas: [
          { id: "lodo-denver", name: "LoDo & Union Station", postalCode: "80202", hashtags: ["#LoDoDenver", "#UnionStationDenver", "#80202"] },
          { id: "rino-denver", name: "RiNo Arts District", postalCode: "80205", hashtags: ["#RiNoDenver", "#DenverArt", "#80205"] },
        ],
      },
      // Arizona
      {
        id: "phoenix",
        name: "Phoenix",
        stateOrRegion: "Arizona",
        stateCode: "AZ",
        hashtags: ["#Phoenix", "#PhoenixAZ", "#ValleyOfTheSun", "#Arizona", "#PHX"],
        areas: [
          { id: "downtown-phoenix", name: "Downtown Phoenix & Roosevelt Row", postalCode: "85004", hashtags: ["#DowntownPhoenix", "#RooseveltRow", "#85004"] },
          { id: "scottsdale", name: "Old Town Scottsdale", postalCode: "85251", hashtags: ["#Scottsdale", "#OldTownScottsdale", "#ScottsdaleAZ", "#85251"] },
        ],
      },
      // Nevada
      {
        id: "las-vegas",
        name: "Las Vegas",
        stateOrRegion: "Nevada",
        stateCode: "NV",
        hashtags: ["#LasVegas", "#Vegas", "#VegasLife", "#LasVegasStrip", "#Nevada"],
        areas: [
          { id: "the-strip", name: "The Strip & Bellagio", postalCode: "89109", hashtags: ["#LasVegasStrip", "#VegasStrip", "#89109"] },
          { id: "downtown-vegas", name: "Downtown & Fremont Street", postalCode: "89101", hashtags: ["#FremontStreet", "#DowntownVegas", "#89101"] },
        ],
      },
      // North Carolina
      {
        id: "charlotte",
        name: "Charlotte",
        stateOrRegion: "North Carolina",
        stateCode: "NC",
        hashtags: ["#Charlotte", "#CharlotteNC", "#QueenCityCLT", "#CLTLife", "#NorthCarolina"],
        areas: [
          { id: "uptown-charlotte", name: "Uptown & South End", postalCode: "28202", hashtags: ["#UptownCharlotte", "#SouthEndCLT", "#28202"] },
        ],
      },
      {
        id: "raleigh",
        name: "Raleigh",
        stateOrRegion: "North Carolina",
        stateCode: "NC",
        hashtags: ["#Raleigh", "#RaleighNC", "#ResearchTriangle", "#RaleighEats"],
        areas: [
          { id: "downtown-raleigh", name: "Downtown Raleigh", postalCode: "27601", hashtags: ["#DowntownRaleigh", "#FayettevilleSt", "#27601"] },
        ],
      },
      // Pennsylvania
      {
        id: "philadelphia",
        name: "Philadelphia",
        stateOrRegion: "Pennsylvania",
        stateCode: "PA",
        hashtags: ["#Philadelphia", "#Philly", "#PhillyGram", "#CityOfBrotherlyLove", "#Pennsylvania"],
        areas: [
          { id: "center-city", name: "Center City & Rittenhouse", postalCode: "19103", hashtags: ["#CenterCityPhilly", "#RittenhouseSquare", "#19103"] },
          { id: "old-city-philly", name: "Old City & Liberty Bell", postalCode: "19106", hashtags: ["#OldCityPhilly", "#LibertyBell", "#19106"] },
        ],
      },
      {
        id: "pittsburgh",
        name: "Pittsburgh",
        stateOrRegion: "Pennsylvania",
        stateCode: "PA",
        hashtags: ["#Pittsburgh", "#PittsburghPA", "#SteelCity", "#412"],
        areas: [
          { id: "downtown-pittsburgh", name: "Downtown & Strip District", postalCode: "15222", hashtags: ["#DowntownPittsburgh", "#StripDistrict", "#15222"] },
        ],
      },
      // Michigan
      {
        id: "detroit",
        name: "Detroit",
        stateOrRegion: "Michigan",
        stateCode: "MI",
        hashtags: ["#Detroit", "#DetroitMI", "#MotorCity", "#313", "#Michigan"],
        areas: [
          { id: "downtown-detroit", name: "Downtown & Midtown Detroit", postalCode: "48226", hashtags: ["#DowntownDetroit", "#MidtownDetroit", "#48226"] },
        ],
      },
      // Tennessee
      {
        id: "nashville",
        name: "Nashville",
        stateOrRegion: "Tennessee",
        stateCode: "TN",
        hashtags: ["#Nashville", "#NashvilleTN", "#MusicCity", "#NashvilleLife", "#Tennessee"],
        areas: [
          { id: "broadway-nashville", name: "Broadway & Downtown", postalCode: "37203", hashtags: ["#BroadwayNashville", "#HonkyTonkHighway", "#37203"] },
          { id: "the-gulch", name: "The Gulch", postalCode: "37203", hashtags: ["#TheGulchNashville", "#GulchLife", "#37203"] },
        ],
      },
      // District of Columbia
      {
        id: "washington-dc",
        name: "Washington D.C.",
        stateOrRegion: "District of Columbia",
        stateCode: "DC",
        hashtags: ["#WashingtonDC", "#DC", "#DCLife", "#NationalMall", "#CapitallCity"],
        areas: [
          { id: "georgetown", name: "Georgetown", postalCode: "20007", hashtags: ["#GeorgetownDC", "#MStreetDC", "#20007"] },
          { id: "dupont-circle", name: "Dupont Circle & Downtown", postalCode: "20036", hashtags: ["#DupontCircle", "#DCDowntown", "#20036"] },
        ],
      },
    ],
  },
  {
    id: "india",
    name: "India",
    code: "IN",
    flag: "🇮🇳",
    hashtags: ["#India", "#IncredibleIndia", "#MadeInIndia", "#IndianBusiness", "#VocalForLocal"],
    states: [
      { id: "gj", name: "Gujarat", code: "GJ" },
      { id: "mh", name: "Maharashtra", code: "MH" },
      { id: "ka", name: "Karnataka", code: "KA" },
      { id: "dl", name: "Delhi NCR", code: "DL" },
      { id: "ts", name: "Telangana", code: "TS" },
      { id: "tn", name: "Tamil Nadu", code: "TN" },
      { id: "wb", name: "West Bengal", code: "WB" },
      { id: "rj", name: "Rajasthan", code: "RJ" },
      { id: "up", name: "Uttar Pradesh", code: "UP" },
      { id: "mp", name: "Madhya Pradesh", code: "MP" },
      { id: "kl", name: "Kerala", code: "KL" },
      { id: "pb", name: "Punjab & Chandigarh", code: "PB" },
      { id: "ga", name: "Goa", code: "GA" },
    ],
    cities: [
      {
        id: "ahmedabad",
        name: "Ahmedabad",
        stateOrRegion: "Gujarat",
        stateCode: "GJ",
        hashtags: ["#Ahmedabad", "#Amdavad", "#AhmedabadCity", "#AhmedabadDiaries", "#Amdavadi", "#Gujarat", "#AmdavadBuzz"],
        areas: [
          { id: "rajpath-sola", name: "Rajpath Club / SG Highway / Sola", postalCode: "380059", hashtags: ["#RajpathClub", "#SGHwy", "#SGHigway", "#SolaAhmedabad", "#Bodakdev", "#AhmedabadLive", "#380059"] },
          { id: "bodakdev-satellite", name: "Bodakdev & Satellite", postalCode: "380054", hashtags: ["#Bodakdev", "#SatelliteAhmedabad", "#SGHwy", "#AhmedabadWest", "#380054"] },
          { id: "vastrapur-iim", name: "Vastrapur / IIM Road", postalCode: "380015", hashtags: ["#Vastrapur", "#IIMA", "#VastrapurLake", "#AhmedabadLife", "#380015"] },
          { id: "navrangpura-cgroada", name: "Navrangpura & CG Road", postalCode: "380009", hashtags: ["#Navrangpura", "#CGRoad", "#AshramRoad", "#AhmedabadFoodie", "#380009"] },
          { id: "bopal-southbopal", name: "Bopal & South Bopal", postalCode: "380058", hashtags: ["#Bopal", "#SouthBopal", "#SPRingRoad", "#AhmedabadBuzz", "#380058"] },
          { id: "prahladnagar", name: "Prahlad Nagar", postalCode: "380015", hashtags: ["#PrahladNagar", "#CorporateRoad", "#AhmedabadCafe", "#AhmedabadEvents", "#380015"] },
          { id: "manekchowk-oldcity", name: "Old City & Manek Chowk", postalCode: "380001", hashtags: ["#OldCityAhmedabad", "#ManekChowk", "#HeritageCity", "#UNESCOCity", "#380001"] },
          { id: "chandkheda-motera", name: "Motera & Chandkheda", postalCode: "380005", hashtags: ["#NarendraModiStadium", "#Motera", "#Chandkheda", "#CricketCity", "#380005"] },
        ],
      },
      {
        id: "surat",
        name: "Surat",
        stateOrRegion: "Gujarat",
        stateCode: "GJ",
        hashtags: ["#Surat", "#SuratCity", "#DiamondCity", "#TextileCity", "#Surati"],
        areas: [
          { id: "vesu-surat", name: "Vesu & VIP Road", postalCode: "395007", hashtags: ["#VesuSurat", "#VIPRoadSurat", "#SuratBusiness", "#395007"] },
          { id: "adajan", name: "Adajan & Pal", postalCode: "395009", hashtags: ["#Adajan", "#PalSurat", "#395009"] },
        ],
      },
      {
        id: "vadodara",
        name: "Vadodara (Baroda)",
        stateOrRegion: "Gujarat",
        stateCode: "GJ",
        hashtags: ["#Vadodara", "#Baroda", "#SanskariNagari", "#VadodaraCity"],
        areas: [
          { id: "alkapuri", name: "Alkapuri & RC Dutt Road", postalCode: "390007", hashtags: ["#Alkapuri", "#BarodaEats", "#390007"] },
        ],
      },
      {
        id: "mumbai",
        name: "Mumbai",
        stateOrRegion: "Maharashtra",
        stateCode: "MH",
        hashtags: ["#Mumbai", "#Bombay", "#MumbaiDiaries", "#AamchiMumbai", "#MumbaiCity", "#MumbaiLife"],
        areas: [
          { id: "bandra-west", name: "Bandra West / Pali Hill", postalCode: "400050", hashtags: ["#Bandra", "#BandraWest", "#PaliHill", "#CarterRoad", "#MumbaiFoodie", "#400050"] },
          { id: "bkc", name: "Bandra Kurla Complex (BKC)", postalCode: "400051", hashtags: ["#BKC", "#BandraKurlaComplex", "#MumbaiBusiness", "#BKCMumbai", "#400051"] },
          { id: "south-mumbai", name: "Colaba & Fort / South Mumbai", postalCode: "400001", hashtags: ["#Colaba", "#SouthMumbai", "#SoBo", "#GatewayOfIndia", "#MarineDrive", "#400001"] },
          { id: "andheri-west", name: "Andheri West & Lokhandwala", postalCode: "400053", hashtags: ["#AndheriWest", "#Lokhandwala", "#Andheri", "#MumbaiEvents", "#400053"] },
          { id: "juhu", name: "Juhu / Vile Parle", postalCode: "400049", hashtags: ["#Juhu", "#JuhuBeach", "#VileParle", "#MumbaiSuburbs", "#400049"] },
          { id: "powai", name: "Powai & Hiranandani", postalCode: "400076", hashtags: ["#Powai", "#HiranandaniPowai", "#PowaiLake", "#TechMumbai", "#400076"] },
        ],
      },
      {
        id: "pune",
        name: "Pune",
        stateOrRegion: "Maharashtra",
        stateCode: "MH",
        hashtags: ["#Pune", "#PuneCity", "#PuneDiaries", "#Puneri", "#PuneInstagrammers", "#OxfordOfTheEast"],
        areas: [
          { id: "koregaon-park", name: "Koregaon Park (KP)", postalCode: "411001", hashtags: ["#KoregaonPark", "#KPPune", "#PuneCafe", "#NorthMainRoad", "#411001"] },
          { id: "baner-balewadi", name: "Baner & Balewadi High Street", postalCode: "411045", hashtags: ["#Baner", "#BalewadiHighStreet", "#PuneEats", "#BanerPune", "#411045"] },
          { id: "hinjewadi", name: "Hinjewadi Infotech Park", postalCode: "411057", hashtags: ["#Hinjewadi", "#PuneTech", "#HinjawadiITPark", "#PuneStartups", "#411057"] },
        ],
      },
      {
        id: "bengaluru",
        name: "Bengaluru",
        stateOrRegion: "Karnataka",
        stateCode: "KA",
        hashtags: ["#Bengaluru", "#Bangalore", "#BangaloreDiaries", "#NammaBengaluru", "#BangaloreCity", "#SiliconValleyOfIndia"],
        areas: [
          { id: "koramangala", name: "Koramangala", postalCode: "560034", hashtags: ["#Koramangala", "#StartupsBangalore", "#BangaloreStartups", "#KoramangalaDiaries", "#560034"] },
          { id: "indiranagar", name: "Indiranagar / 100ft Road", postalCode: "560038", hashtags: ["#Indiranagar", "#100ftRoad", "#BangaloreNightlife", "#BangaloreCafe", "#560038"] },
          { id: "whitefield", name: "Whitefield & ITPL", postalCode: "560066", hashtags: ["#Whitefield", "#WhitefieldBangalore", "#ITPL", "#TechHub", "#560066"] },
          { id: "hsr-layout", name: "HSR Layout", postalCode: "560102", hashtags: ["#HSRLayout", "#HSRBangalore", "#StartupHub", "#BangaloreEats", "#560102"] },
          { id: "mg-road", name: "MG Road & Brigade Road / CBD", postalCode: "560001", hashtags: ["#MGRoad", "#BrigadeRoad", "#ChurchStreet", "#CentralBangalore", "#560001"] },
        ],
      },
      {
        id: "delhi",
        name: "Delhi NCR",
        stateOrRegion: "Delhi NCR",
        stateCode: "DL",
        hashtags: ["#Delhi", "#DelhiNCR", "#Dilli", "#DelhiDiaries", "#SoDelhi", "#DelhiGram"],
        areas: [
          { id: "connaught-place", name: "Connaught Place (CP)", postalCode: "110001", hashtags: ["#ConnaughtPlace", "#CPDelhi", "#CentralDelhi", "#DelhiCapital", "#110001"] },
          { id: "hauz-khas", name: "Hauz Khas Village / Green Park", postalCode: "110016", hashtags: ["#HauzKhas", "#HKV", "#SouthDelhi", "#GreenParkDelhi", "#110016"] },
          { id: "cyber-hub", name: "Cyber Hub & DLF Phase 2 (Gurugram)", postalCode: "122002", hashtags: ["#Gurgaon", "#Gurugram", "#CyberHub", "#DLFCyberCity", "#MillenniumCity", "#122002"] },
          { id: "noida-sector-18", name: "Sector 18 & Atta Market (Noida)", postalCode: "201301", hashtags: ["#Noida", "#Sector18Noida", "#NoidaGram", "#NoidaDiaries", "#201301"] },
        ],
      },
      {
        id: "hyderabad",
        name: "Hyderabad",
        stateOrRegion: "Telangana",
        stateCode: "TS",
        hashtags: ["#Hyderabad", "#HyderabadDiaries", "#HyderabadCity", "#Cyberabad", "#BiryaniCity"],
        areas: [
          { id: "hitec-city", name: "HITEC City & Madhapur", postalCode: "500081", hashtags: ["#HitecCITY", "#Madhapur", "#CyberTowers", "#HyderabadTech", "#500081"] },
          { id: "banjara-hills", name: "Banjara Hills & Jubilee Hills", postalCode: "500034", hashtags: ["#BanjaraHills", "#JubileeHills", "#RoadNo36", "#HyderabadLuxury", "#500034"] },
          { id: "gachibowli", name: "Gachibowli & Financial District", postalCode: "500032", hashtags: ["#Gachibowli", "#FinancialDistrictHyderabad", "#CyberabadLive", "#500032"] },
        ],
      },
      {
        id: "chennai",
        name: "Chennai",
        stateOrRegion: "Tamil Nadu",
        stateCode: "TN",
        hashtags: ["#Chennai", "#Madras", "#ChennaiDiaries", "#SingaraChennai"],
        areas: [
          { id: "t-nagar", name: "T. Nagar & Pondy Bazaar", postalCode: "600017", hashtags: ["#TNagar", "#PondyBazaar", "#ChennaiShopping", "#600017"] },
          { id: "omr-it-corridor", name: "OMR IT Corridor & Thoraipakkam", postalCode: "600096", hashtags: ["#OMRChennai", "#ChennaiIT", "#600096"] },
        ],
      },
      {
        id: "kolkata",
        name: "Kolkata",
        stateOrRegion: "West Bengal",
        stateCode: "WB",
        hashtags: ["#Kolkata", "#Calcutta", "#CityOfJoy", "#KolkataDiaries"],
        areas: [
          { id: "park-street", name: "Park Street & Camac Street", postalCode: "700016", hashtags: ["#ParkStreetKolkata", "#KolkataNightlife", "#700016"] },
          { id: "salt-lake-sector-v", name: "Salt Lake & Sector V", postalCode: "700091", hashtags: ["#SaltLakeKolkata", "#SectorVKolkata", "#700091"] },
        ],
      },
      {
        id: "jaipur",
        name: "Jaipur",
        stateOrRegion: "Rajasthan",
        stateCode: "RJ",
        hashtags: ["#Jaipur", "#PinkCity", "#JaipurDiaries", "#Rajasthan"],
        areas: [
          { id: "c-scheme", name: "C-Scheme & MI Road", postalCode: "302001", hashtags: ["#CSchemeJaipur", "#MIRoad", "#302001"] },
        ],
      },
      {
        id: "chandigarh",
        name: "Chandigarh",
        stateOrRegion: "Punjab & Chandigarh",
        stateCode: "PB",
        hashtags: ["#Chandigarh", "#TheCityBeautiful", "#Tricity", "#Mohali", "#Panchkula"],
        areas: [
          { id: "sector-17-chandigarh", name: "Sector 17 & Sector 35", postalCode: "160017", hashtags: ["#Sector17Chandigarh", "#ChandigarhEats", "#160017"] },
        ],
      },
      {
        id: "lucknow",
        name: "Lucknow",
        stateOrRegion: "Uttar Pradesh",
        stateCode: "UP",
        hashtags: ["#Lucknow", "#CityOfNawabs", "#LucknowDiaries", "#UttarPradesh"],
        areas: [
          { id: "hazratganj", name: "Hazratganj & Gomti Nagar", postalCode: "226001", hashtags: ["#Hazratganj", "#GomtiNagar", "#226001"] },
        ],
      },
      {
        id: "indore",
        name: "Indore",
        stateOrRegion: "Madhya Pradesh",
        stateCode: "MP",
        hashtags: ["#Indore", "#IndoreCity", "#CleanestCity", "#SarafaBazaar"],
        areas: [
          { id: "vijay-nagar-indore", name: "Vijay Nagar & Palasia", postalCode: "452010", hashtags: ["#VijayNagarIndore", "#IndoreFoodie", "#452010"] },
        ],
      },
      {
        id: "kochi",
        name: "Kochi",
        stateOrRegion: "Kerala",
        stateCode: "KL",
        hashtags: ["#Kochi", "#Cochin", "#GodsOwnCountry", "#Kerala"],
        areas: [
          { id: "marine-drive-kochi", name: "Marine Drive & Fort Kochi", postalCode: "682001", hashtags: ["#FortKochi", "#MarineDriveKochi", "#682001"] },
        ],
      },
      {
        id: "goa",
        name: "Goa",
        stateOrRegion: "Goa",
        stateCode: "GA",
        hashtags: ["#Goa", "#GoaDiaries", "#GoaLife", "#BeachVibes"],
        areas: [
          { id: "panaji-northgoa", name: "Panaji & Candolim", postalCode: "403001", hashtags: ["#Panaji", "#NorthGoa", "#Candolim", "#403001"] },
        ],
      },
    ],
  },
  {
    id: "uk",
    name: "United Kingdom",
    code: "GB",
    flag: "🇬🇧",
    hashtags: ["#UK", "#UnitedKingdom", "#GreatBritain", "#BritishBusiness", "#UKSmallBiz"],
    states: [
      { id: "england", name: "England", code: "ENG" },
      { id: "scotland", name: "Scotland", code: "SCT" },
      { id: "wales", name: "Wales", code: "WLS" },
      { id: "northern-ireland", name: "Northern Ireland", code: "NIR" },
    ],
    cities: [
      {
        id: "london",
        name: "London",
        stateOrRegion: "England",
        stateCode: "ENG",
        hashtags: ["#London", "#LondonLife", "#LondonCity", "#ThisIsLondon", "#VisitLondon", "#LondonEvents"],
        areas: [
          { id: "soho-westend", name: "Soho & West End", postalCode: "W1D", hashtags: ["#SohoLondon", "#WestEnd", "#OxfordStreet", "#CoventGarden", "#W1D"] },
          { id: "city-of-london", name: "City of London & Shoreditch", postalCode: "EC2M", hashtags: ["#CityOfLondon", "#Shoreditch", "#OldStreet", "#SiliconRoundabout", "#EC2M"] },
          { id: "canary-wharf", name: "Canary Wharf & Docklands", postalCode: "E14", hashtags: ["#CanaryWharf", "#LondonFinance", "#Docklands", "#E14"] },
        ],
      },
      {
        id: "manchester",
        name: "Manchester",
        stateOrRegion: "England",
        stateCode: "ENG",
        hashtags: ["#Manchester", "#MCR", "#ManchesterCity", "#NorthernQuarter", "#GreaterManchester"],
        areas: [
          { id: "northern-quarter", name: "Northern Quarter & Piccadilly", postalCode: "M1", hashtags: ["#NorthernQuarter", "#NQManchester", "#ManchesterCentre", "#M1"] },
          { id: "mediacityuk", name: "MediaCityUK / Salford", postalCode: "M50", hashtags: ["#MediaCityUK", "#SalfordQuays", "#BBCManchester", "#M50"] },
        ],
      },
      {
        id: "birmingham",
        name: "Birmingham",
        stateOrRegion: "England",
        stateCode: "ENG",
        hashtags: ["#Birmingham", "#Brum", "#WestMidlands", "#Bham"],
        areas: [
          { id: "digbeth", name: "Digbeth Creative Quarter", postalCode: "B9", hashtags: ["#Digbeth", "#CreativeQuarter", "#B9"] },
        ],
      },
      {
        id: "edinburgh",
        name: "Edinburgh",
        stateOrRegion: "Scotland",
        stateCode: "SCT",
        hashtags: ["#Edinburgh", "#VisitEdinburgh", "#Scotland", "#OldTownEdinburgh"],
        areas: [
          { id: "royal-mile", name: "Royal Mile & Princes Street", postalCode: "EH1", hashtags: ["#RoyalMile", "#EdinburghCastle", "#EH1"] },
        ],
      },
    ],
  },
  {
    id: "uae",
    name: "United Arab Emirates",
    code: "AE",
    flag: "🇦🇪",
    hashtags: ["#UAE", "#UnitedArabEmirates", "#MyUAE", "#UAEBusiness", "#InUAE"],
    states: [
      { id: "dubai-emirate", name: "Dubai", code: "DXB" },
      { id: "abu-dhabi-emirate", name: "Abu Dhabi", code: "AUH" },
      { id: "sharjah-emirate", name: "Sharjah", code: "SHJ" },
    ],
    cities: [
      {
        id: "dubai",
        name: "Dubai",
        stateOrRegion: "Dubai",
        stateCode: "DXB",
        hashtags: ["#Dubai", "#MyDubai", "#DubaiLife", "#VisitDubai", "#DubaiCity", "#UAE"],
        areas: [
          { id: "downtown-dubai", name: "Downtown Dubai & Burj Khalifa", postalCode: "Downtown", hashtags: ["#DowntownDubai", "#BurjKhalifa", "#DubaiMall", "#SheikhZayedRoad"] },
          { id: "dubai-marina", name: "Dubai Marina & JBR", postalCode: "Marina", hashtags: ["#DubaiMarina", "#JBR", "#TheWalkJBR", "#MarinaDubai"] },
          { id: "business-bay", name: "Business Bay & DIFC", postalCode: "DIFC", hashtags: ["#BusinessBay", "#DIFC", "#DubaiFinance", "#DubaiBusiness"] },
          { id: "palm-jumeirah", name: "Palm Jumeirah", postalCode: "Palm", hashtags: ["#PalmJumeirah", "#ThePalm", "#AtlantisDubai", "#DubaiLuxury"] },
        ],
      },
      {
        id: "abu-dhabi",
        name: "Abu Dhabi",
        stateOrRegion: "Abu Dhabi",
        stateCode: "AUH",
        hashtags: ["#AbuDhabi", "#InAbuDhabi", "#VisitAbuDhabi", "#AbuDhabiCity"],
        areas: [
          { id: "yas-island", name: "Yas Island", postalCode: "Yas", hashtags: ["#YasIsland", "#FerrariWorld", "#YasMarina", "#AbuDhabiEvents"] },
          { id: "saadiyat-island", name: "Saadiyat Cultural District", postalCode: "Saadiyat", hashtags: ["#SaadiyatIsland", "#LouvreAbuDhabi", "#CulturalDistrict"] },
        ],
      },
    ],
  },
  {
    id: "canada",
    name: "Canada",
    code: "CA",
    flag: "🇨🇦",
    hashtags: ["#Canada", "#CanadianBusiness", "#ShopLocalCanada", "#MadeInCanada", "#ExploreCanada"],
    states: [
      { id: "on", name: "Ontario", code: "ON" },
      { id: "bc", name: "British Columbia", code: "BC" },
      { id: "qc", name: "Quebec", code: "QC" },
      { id: "ab", name: "Alberta", code: "AB" },
    ],
    cities: [
      {
        id: "toronto",
        name: "Toronto",
        stateOrRegion: "Ontario",
        stateCode: "ON",
        hashtags: ["#Toronto", "#The6ix", "#TorontoLife", "#DowntownToronto", "#GTA", "#TorontoEats"],
        areas: [
          { id: "downtown-toronto", name: "Downtown & Entertainment District", postalCode: "M5V", hashtags: ["#DowntownToronto", "#KingWest", "#EntertainmentDistrict", "#CNTower", "#M5V"] },
          { id: "yorkville", name: "Yorkville & Bloor", postalCode: "M5R", hashtags: ["#Yorkville", "#BloorYorkville", "#TorontoLuxury", "#M5R"] },
        ],
      },
      {
        id: "vancouver",
        name: "Vancouver",
        stateOrRegion: "British Columbia",
        stateCode: "BC",
        hashtags: ["#Vancouver", "#YVR", "#VancouverLife", "#BeautifulBC", "#VancouverBC"],
        areas: [
          { id: "yaletown", name: "Yaletown & Downtown", postalCode: "V6B", hashtags: ["#Yaletown", "#DowntownVancouver", "#Gastown", "#V6B"] },
        ],
      },
      {
        id: "montreal",
        name: "Montreal",
        stateOrRegion: "Quebec",
        stateCode: "QC",
        hashtags: ["#Montreal", "#MTL", "#MontrealLife", "#ExploreMTL"],
        areas: [
          { id: "old-montreal", name: "Old Montreal & Downtown", postalCode: "H2Y", hashtags: ["#OldMontreal", "#VieuxMontreal", "#H2Y"] },
        ],
      },
      {
        id: "calgary",
        name: "Calgary",
        stateOrRegion: "Alberta",
        stateCode: "AB",
        hashtags: ["#Calgary", "#YYC", "#CalgaryLife", "#Alberta"],
        areas: [
          { id: "downtown-calgary", name: "Downtown & Beltline", postalCode: "T2P", hashtags: ["#DowntownCalgary", "#BeltlineYYC", "#T2P"] },
        ],
      },
    ],
  },
  {
    id: "australia",
    name: "Australia",
    code: "AU",
    flag: "🇦🇺",
    hashtags: ["#Australia", "#AussieBusiness", "#SeeAustralia", "#MadeInAustralia", "#SupportLocalAU"],
    states: [
      { id: "nsw", name: "New South Wales", code: "NSW" },
      { id: "vic", name: "Victoria", code: "VIC" },
      { id: "qld", name: "Queensland", code: "QLD" },
      { id: "wa", name: "Western Australia", code: "WA" },
    ],
    cities: [
      {
        id: "sydney",
        name: "Sydney",
        stateOrRegion: "New South Wales",
        stateCode: "NSW",
        hashtags: ["#Sydney", "#SydneyLife", "#SydneyAustralia", "#HarbourCity", "#SydneyEvents"],
        areas: [
          { id: "sydney-cbd", name: "Sydney CBD & Circular Quay", postalCode: "2000", hashtags: ["#SydneyCBD", "#CircularQuay", "#SydneyOperaHouse", "#TheRocks", "#2000"] },
          { id: "bondi-beach", name: "Bondi Beach", postalCode: "2026", hashtags: ["#BondiBeach", "#Bondi", "#SydneyBeaches", "#BondiToCoogee", "#2026"] },
        ],
      },
      {
        id: "melbourne",
        name: "Melbourne",
        stateOrRegion: "Victoria",
        stateCode: "VIC",
        hashtags: ["#Melbourne", "#MelbourneLife", "#MelbourneCity", "#MelbourneFoodie", "#Victoria"],
        areas: [
          { id: "melbourne-cbd", name: "Melbourne CBD", postalCode: "3000", hashtags: ["#MelbourneCBD", "#FlindersStreet", "#MelbourneLanes", "#3000"] },
          { id: "fitzroy", name: "Fitzroy & Brunswick", postalCode: "3065", hashtags: ["#Fitzroy", "#BrunswickMelbourne", "#3065"] },
        ],
      },
      {
        id: "brisbane",
        name: "Brisbane",
        stateOrRegion: "Queensland",
        stateCode: "QLD",
        hashtags: ["#Brisbane", "#BNE", "#BrisbaneCity", "#Queensland"],
        areas: [
          { id: "brisbane-cbd", name: "Brisbane CBD & South Bank", postalCode: "4000", hashtags: ["#BrisbaneCBD", "#SouthBankBNE", "#4000"] },
        ],
      },
    ],
  },
];

/**
 * Retrieve list of all supported countries
 */
export function getGeoCountries(): GeoCountry[] {
  return GEO_DATA;
}

/**
 * Get states or regions for a specific country by ID or name
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
  countryId?: string;
  stateCode?: string;
  cityId?: string;
  areaId?: string;
  customLocation?: string;
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
          c.name.toLowerCase() === countryId.toLowerCase()
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

  // 4. Lookup area
  const area =
    city && areaId
      ? city.areas.find(
          (a) =>
            a.id.toLowerCase() === areaId.toLowerCase() ||
            a.name.toLowerCase() === areaId.toLowerCase() ||
            a.postalCode.toLowerCase() === areaId.toLowerCase()
        )
      : undefined;

  // Layer 1: Specific Area & Postal Code Tags (Highest priority)
  if (area) {
    for (const tag of area.hashtags) {
      const f = formatHashtag(tag);
      if (f) result.add(f);
    }
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
    const st = country.states?.find((s) => s.code.toLowerCase() === stateCode.toLowerCase() || s.id.toLowerCase() === stateCode.toLowerCase());
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
