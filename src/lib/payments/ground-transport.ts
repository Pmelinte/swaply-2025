/**
 * Ground transport integration for Swaply.
 * Bus and railway ticket affiliate links & API for traveling to swap locations.
 *
 * Providers:
 *   - FlixBus/FlixTrain: European bus & train network (affiliate program)
 *   - CFR Călători: Romanian national railway
 *   - Omio (GoEuro): Multi-modal European transport search
 *   - BlaBlaCar: Carpooling (affiliate)
 *   - Rome2rio: Multi-modal route planning
 *
 * Revenue model:
 *   - FlixBus: 3-5% CPA per booking
 *   - Omio: €1-3 CPA
 *   - BlaBlaCar: €0.50-1 CPA
 *
 * Env vars:
 *   FLIXBUS_AFFILIATE_ID
 *   OMIO_AFFILIATE_ID
 *   BLABLACAR_AFFILIATE_ID
 */

// ── Types ──

export type GroundTransportProvider = "flixbus" | "cfr" | "omio" | "blablacar" | "rome2rio";
export type GroundTransportMode = "bus" | "train" | "carpool" | "multi";

export interface GroundTransportSearchParams {
  originCity: string;
  destinationCity: string;
  departDate: string;       // YYYY-MM-DD
  returnDate?: string;
  passengers?: number;
  mode?: GroundTransportMode;
  /** ISO 3166-1 alpha-2 country code (e.g. "RO", "DE"). Used to include country-specific providers. */
  countryCode?: string;
}

export interface GroundTransportLink {
  provider: GroundTransportProvider;
  name: string;
  mode: GroundTransportMode;
  searchUrl: string;
  icon: string;
  priceHint?: string;
}

export interface GroundTransportEstimate {
  mode: GroundTransportMode;
  provider: GroundTransportProvider;
  priceRange: { min: number; max: number; currency: string };
  durationRange: { minHours: number; maxHours: number };
  frequency: string;    // e.g. "Multiple daily"
}

// ── Config ──

export function isGroundTransportConfigured(): boolean {
  return !!(
    process.env.FLIXBUS_AFFILIATE_ID ||
    process.env.OMIO_AFFILIATE_ID ||
    process.env.BLABLACAR_AFFILIATE_ID
  );
}

// ── Link Generators ──

function flixbusUrl(params: GroundTransportSearchParams): string {
  const affiliateId = process.env.FLIXBUS_AFFILIATE_ID ?? "";
  const ref = affiliateId ? `&_sp=${affiliateId}` : "";
  const origin = encodeURIComponent(params.originCity);
  const dest = encodeURIComponent(params.destinationCity);

  return `https://shop.flixbus.com/search?departureCity=${origin}&arrivalCity=${dest}&route=${origin}-${dest}&rideDate=${params.departDate}&adult=${params.passengers ?? 1}${params.returnDate ? `&backRideDate=${params.returnDate}` : ""}${ref}`;
}

function cfrUrl(params: GroundTransportSearchParams): string {
  const origin = encodeURIComponent(params.originCity);
  const dest = encodeURIComponent(params.destinationCity);
  const [y, m, d] = params.departDate.split("-");

  return `https://mersultrenurilor.infofer.ro/ro-RO/Rpieces/${origin}/${dest}/${d}.${m}.${y}/0/0`;
}

function omioUrl(params: GroundTransportSearchParams): string {
  const affiliateId = process.env.OMIO_AFFILIATE_ID ?? "";
  const ref = affiliateId ? `?utm_source=${affiliateId}` : "";
  const origin = encodeURIComponent(params.originCity);
  const dest = encodeURIComponent(params.destinationCity);

  return `https://www.omio.com/search-frontend/results/${origin}/${dest}/${params.departDate}/${params.returnDate ?? ""}${ref}`;
}

function blablacarUrl(params: GroundTransportSearchParams): string {
  const affiliateId = process.env.BLABLACAR_AFFILIATE_ID ?? "";
  const ref = affiliateId ? `&utm_source=${affiliateId}` : "";
  const origin = encodeURIComponent(params.originCity);
  const dest = encodeURIComponent(params.destinationCity);

  return `https://www.blablacar.com/search?fn=${origin}&tn=${dest}&db=${params.departDate}&seats=${params.passengers ?? 1}${ref}`;
}

function rome2rioUrl(params: GroundTransportSearchParams): string {
  const origin = encodeURIComponent(params.originCity);
  const dest = encodeURIComponent(params.destinationCity);

  return `https://www.rome2rio.com/s/${origin}/${dest}`;
}

// ── Public API ──

export function getGroundTransportLinks(params: GroundTransportSearchParams): GroundTransportLink[] {
  const links: GroundTransportLink[] = [];
  const country = params.countryCode?.toUpperCase();

  if (!params.mode || params.mode === "bus") {
    links.push({
      provider: "flixbus",
      name: "FlixBus",
      mode: "bus",
      searchUrl: flixbusUrl(params),
      icon: "🚌",
      priceHint: "from €5",
    });
  }

  // CFR Călători is Romania-only
  if (country === "RO" && (!params.mode || params.mode === "train")) {
    links.push({
      provider: "cfr",
      name: "CFR Călători",
      mode: "train",
      searchUrl: cfrUrl(params),
      icon: "🚂",
      priceHint: "from 30 RON",
    });
  }

  if (!params.mode || params.mode === "carpool") {
    links.push({
      provider: "blablacar",
      name: "BlaBlaCar",
      mode: "carpool",
      searchUrl: blablacarUrl(params),
      icon: "🚘",
      priceHint: "from €3",
    });
  }

  // Always include multi-modal search
  links.push({
    provider: "omio",
    name: "Omio",
    mode: "multi",
    searchUrl: omioUrl(params),
    icon: "🔀",
    priceHint: "Compare all options",
  });

  links.push({
    provider: "rome2rio",
    name: "Rome2rio",
    mode: "multi",
    searchUrl: rome2rioUrl(params),
    icon: "🗺️",
    priceHint: "All possible routes",
  });

  return links;
}

/**
 * Estimate ground transport options between two cities.
 * When countryCode is "RO", includes CFR train estimates with RON pricing.
 */
export function estimateGroundTransport(
  originCity: string,
  destCity: string,
  countryCode?: string,
): GroundTransportEstimate[] {
  const estimates: GroundTransportEstimate[] = [];

  // Include CFR train estimates only for Romania
  if (countryCode?.toUpperCase() === "RO") {
    const majorRoCities = new Set(["București", "Cluj-Napoca", "Timișoara", "Iași", "Constanța", "Brașov", "Sibiu", "Oradea", "Craiova"]);
    const isMajorRoute = majorRoCities.has(originCity) && majorRoCities.has(destCity);

    estimates.push({
      mode: "train",
      provider: "cfr",
      priceRange: { min: 30, max: 120, currency: "RON" },
      durationRange: { minHours: isMajorRoute ? 3 : 5, maxHours: isMajorRoute ? 6 : 12 },
      frequency: isMajorRoute ? "4-8 trains/day" : "1-3 trains/day",
    });
  }

  estimates.push(
    {
      mode: "bus",
      provider: "flixbus",
      priceRange: { min: 5, max: 25, currency: "EUR" },
      durationRange: { minHours: 4, maxHours: 14 },
      frequency: "Multiple daily",
    },
    {
      mode: "carpool",
      provider: "blablacar",
      priceRange: { min: 3, max: 15, currency: "EUR" },
      durationRange: { minHours: 3, maxHours: 8 },
      frequency: "Variable",
    },
  );

  return estimates;
}
