/**
 * Flight tickets affiliate integration for Swaply.
 * Generates affiliate links and searches for flights to swap destinations.
 *
 * Providers:
 *   - Kiwi.com (Tequila API): Full API search + affiliate booking
 *   - Skyscanner: Affiliate redirect links
 *   - Google Flights: Deep links (no commission, user convenience)
 *
 * Revenue model:
 *   - Kiwi.com: CPA (cost per acquisition) ~€3-8 per booking
 *   - Skyscanner: CPC (cost per click) ~€0.15-0.40
 *
 * Env vars:
 *   KIWI_API_KEY       (Tequila API key)
 *   KIWI_AFFILIATE_ID
 *   SKYSCANNER_AFFILIATE_ID
 */

// ── Types ──

export type FlightProvider = "kiwi" | "skyscanner" | "google_flights";

export interface FlightSearchParams {
  originCity: string;
  destinationCity: string;
  departDate: string;       // YYYY-MM-DD
  returnDate?: string;      // YYYY-MM-DD (omit for one-way)
  adults: number;
  children?: number;
  cabinClass?: "economy" | "business" | "first";
  currency?: string;        // defaults to EUR
}

export interface FlightResult {
  provider: FlightProvider;
  airline: string;
  departTime: string;
  arriveTime: string;
  duration: string;         // "2h 30m"
  stops: number;
  price: number;
  currency: string;
  bookingUrl: string;
  returnFlight?: {
    departTime: string;
    arriveTime: string;
    duration: string;
    stops: number;
  };
}

export interface FlightSearchResponse {
  results: FlightResult[];
  cheapest?: FlightResult;
  fastest?: FlightResult;
  affiliateLinks: FlightAffiliateLink[];
  error?: string;
}

export interface FlightAffiliateLink {
  provider: FlightProvider;
  name: string;
  searchUrl: string;
  icon: string;
}

// ── Config ──

export function isKiwiConfigured(): boolean {
  return !!process.env.KIWI_API_KEY;
}

// ── Kiwi.com (Tequila) API ──

async function searchKiwiFlights(params: FlightSearchParams): Promise<FlightResult[]> {
  const apiKey = process.env.KIWI_API_KEY;
  if (!apiKey) return [];

  const affiliateId = process.env.KIWI_AFFILIATE_ID ?? "swaply";
  const currency = params.currency ?? "EUR";

  const queryParts = [
    `fly_from=${encodeURIComponent(params.originCity)}`,
    `fly_to=${encodeURIComponent(params.destinationCity)}`,
    `date_from=${formatKiwiDate(params.departDate)}`,
    `date_to=${formatKiwiDate(params.departDate)}`,
    `adults=${params.adults}`,
    `children=${params.children ?? 0}`,
    `curr=${currency}`,
    `locale=en`,
    `partner=${affiliateId}`,
    `limit=10`,
    `sort=price`,
    params.cabinClass === "business" ? "selected_cabins=C" : "selected_cabins=M",
  ];

  if (params.returnDate) {
    queryParts.push(`return_from=${formatKiwiDate(params.returnDate)}`);
    queryParts.push(`return_to=${formatKiwiDate(params.returnDate)}`);
    queryParts.push("flight_type=round");
  } else {
    queryParts.push("flight_type=oneway");
  }

  const res = await fetch(`https://api.tequila.kiwi.com/v2/search?${queryParts.join("&")}`, {
    headers: { apikey: apiKey },
  });

  if (!res.ok) return [];

  const data = await res.json() as {
    data?: Array<{
      airlines?: string[];
      dTime?: number;
      aTime?: number;
      fly_duration?: string;
      route?: Array<unknown>;
      price?: number;
      deep_link?: string;
      return_duration?: string;
    }>;
  };

  return (data.data ?? []).map((flight) => {
    const routes = flight.route ?? [];
    const outboundStops = Math.max(0, Math.ceil(routes.length / 2) - 1);

    return {
      provider: "kiwi" as FlightProvider,
      airline: (flight.airlines ?? ["Unknown"])[0],
      departTime: flight.dTime ? new Date(flight.dTime * 1000).toISOString() : "",
      arriveTime: flight.aTime ? new Date(flight.aTime * 1000).toISOString() : "",
      duration: flight.fly_duration ?? "",
      stops: outboundStops,
      price: flight.price ?? 0,
      currency,
      bookingUrl: flight.deep_link ?? "",
      returnFlight: params.returnDate ? {
        departTime: "",
        arriveTime: "",
        duration: flight.return_duration ?? "",
        stops: 0,
      } : undefined,
    };
  });
}

function formatKiwiDate(isoDate: string): string {
  const [y, m, d] = isoDate.split("-");
  return `${d}/${m}/${y}`;
}

// ── Affiliate Deep Links ──

function skyscannerUrl(params: FlightSearchParams): string {
  const affiliateId = process.env.SKYSCANNER_AFFILIATE_ID ?? "";
  const ref = affiliateId ? `&associateId=${affiliateId}` : "";
  const origin = encodeURIComponent(params.originCity);
  const dest = encodeURIComponent(params.destinationCity);
  const depart = params.departDate.replace(/-/g, "").slice(2); // YYMMDD
  const ret = params.returnDate?.replace(/-/g, "").slice(2) ?? "";
  const retPart = ret ? `/${ret}` : "";

  return `https://www.skyscanner.net/transport/flights/${origin}/${dest}/${depart}${retPart}/?adults=${params.adults}&cabinclass=${params.cabinClass ?? "economy"}${ref}`;
}

function googleFlightsUrl(params: FlightSearchParams): string {
  const origin = encodeURIComponent(params.originCity);
  const dest = encodeURIComponent(params.destinationCity);
  return `https://www.google.com/travel/flights?q=flights+from+${origin}+to+${dest}+on+${params.departDate}${params.returnDate ? `+returning+${params.returnDate}` : ""}&curr=${params.currency ?? "EUR"}`;
}

// ── Public API ──

export function getFlightAffiliateLinks(params: FlightSearchParams): FlightAffiliateLink[] {
  return [
    {
      provider: "kiwi",
      name: "Kiwi.com",
      searchUrl: `https://www.kiwi.com/en/search/results/${encodeURIComponent(params.originCity)}/${encodeURIComponent(params.destinationCity)}/${params.departDate}${params.returnDate ? `/${params.returnDate}` : ""}?adults=${params.adults}`,
      icon: "✈️",
    },
    {
      provider: "skyscanner",
      name: "Skyscanner",
      searchUrl: skyscannerUrl(params),
      icon: "🔍",
    },
    {
      provider: "google_flights",
      name: "Google Flights",
      searchUrl: googleFlightsUrl(params),
      icon: "🌐",
    },
  ];
}

export async function searchFlights(params: FlightSearchParams): Promise<FlightSearchResponse> {
  const affiliateLinks = getFlightAffiliateLinks(params);

  // Try Kiwi API for real results
  const results = await searchKiwiFlights(params);

  const sorted = [...results].sort((a, b) => a.price - b.price);
  const fastest = [...results].sort((a, b) => a.stops - b.stops || a.duration.localeCompare(b.duration));

  return {
    results,
    cheapest: sorted[0],
    fastest: fastest[0],
    affiliateLinks,
  };
}

/**
 * Quick flight price estimate (without full API call).
 * Returns approximate price range based on distance heuristics.
 */
export function estimateFlightPrice(
  originCountry: string,
  destCountry: string,
): { minEur: number; maxEur: number; label: string } {
  if (originCountry === destCountry) {
    return { minEur: 20, maxEur: 80, label: "Domestic flight" };
  }

  const europeanCountries = new Set([
    "RO", "DE", "FR", "ES", "IT", "NL", "BE", "AT", "CH", "PL",
    "CZ", "SK", "HU", "BG", "HR", "SI", "PT", "GR", "SE", "DK",
    "FI", "NO", "IE", "GB", "LT", "LV", "EE",
  ]);

  if (europeanCountries.has(originCountry) && europeanCountries.has(destCountry)) {
    return { minEur: 30, maxEur: 200, label: "European flight" };
  }

  return { minEur: 200, maxEur: 800, label: "International flight" };
}
