/**
 * Car rental affiliate integration for Swaply.
 * Generates affiliate links for users traveling to swap locations.
 *
 * Providers:
 *   - Rentalcars.com (Booking Holdings): 4-6% commission
 *   - DiscoverCars.com: 5-8% commission
 *   - AutoEurope: 3-5% commission
 *
 * Env vars:
 *   RENTALCARS_AFFILIATE_ID
 *   DISCOVERCARS_AFFILIATE_ID
 *   AUTOEUROPE_AFFILIATE_ID
 */

// ── Types ──

export type CarRentalProvider = "rentalcars" | "discovercars" | "autoeurope";

export interface CarRentalSearchParams {
  pickupCity: string;
  pickupDate: string;       // YYYY-MM-DD
  pickupTime?: string;      // HH:MM, default 10:00
  dropoffDate: string;      // YYYY-MM-DD
  dropoffTime?: string;     // HH:MM, default 10:00
  dropoffCity?: string;     // if different from pickup
  driverAge?: number;       // default 30
  currency?: string;        // default EUR
  latitude?: number;
  longitude?: number;
}

export interface CarRentalLink {
  provider: CarRentalProvider;
  name: string;
  searchUrl: string;
  icon: string;
  priceHint: string;
}

// ── Config ──

export function isCarRentalConfigured(): boolean {
  return !!(
    process.env.RENTALCARS_AFFILIATE_ID ||
    process.env.DISCOVERCARS_AFFILIATE_ID ||
    process.env.AUTOEUROPE_AFFILIATE_ID
  );
}

// ── Link Generators ──

function rentalcarsUrl(params: CarRentalSearchParams): string {
  const affiliateId = process.env.RENTALCARS_AFFILIATE_ID ?? "";
  const ref = affiliateId ? `&affiliateCode=${affiliateId}` : "";
  const pickup = encodeURIComponent(params.pickupCity);
  const dropoff = params.dropoffCity ? encodeURIComponent(params.dropoffCity) : pickup;

  return `https://www.rentalcars.com/search-results?location=${pickup}&dropLocation=${dropoff}&puDay=${params.pickupDate}&doDay=${params.dropoffDate}&puHour=${params.pickupTime ?? "10:00"}&doHour=${params.dropoffTime ?? "10:00"}&driversAge=${params.driverAge ?? 30}${ref}`;
}

function discovercarsUrl(params: CarRentalSearchParams): string {
  const affiliateId = process.env.DISCOVERCARS_AFFILIATE_ID ?? "";
  const ref = affiliateId ? `&a_aid=${affiliateId}` : "";
  const pickup = encodeURIComponent(params.pickupCity);

  return `https://www.discovercars.com/search?location=${pickup}&pick_date=${params.pickupDate}&drop_date=${params.dropoffDate}&pick_time=${params.pickupTime ?? "10:00"}&drop_time=${params.dropoffTime ?? "10:00"}${ref}`;
}

function autoeuropeUrl(params: CarRentalSearchParams): string {
  const affiliateId = process.env.AUTOEUROPE_AFFILIATE_ID ?? "";
  const ref = affiliateId ? `&aff=${affiliateId}` : "";
  const pickup = encodeURIComponent(params.pickupCity);

  return `https://www.autoeurope.eu/car-rental-search/?pickup=${pickup}&pickdate=${params.pickupDate}&dropdate=${params.dropoffDate}${ref}`;
}

// ── Public API ──

export function getCarRentalLinks(params: CarRentalSearchParams): CarRentalLink[] {
  const days = Math.max(1, Math.ceil(
    (new Date(params.dropoffDate).getTime() - new Date(params.pickupDate).getTime()) / 86400000,
  ));

  return [
    {
      provider: "rentalcars",
      name: "Rentalcars.com",
      searchUrl: rentalcarsUrl(params),
      icon: "🚗",
      priceHint: `de la ~€${Math.round(days * 15)}/total`,
    },
    {
      provider: "discovercars",
      name: "DiscoverCars",
      searchUrl: discovercarsUrl(params),
      icon: "🚙",
      priceHint: `de la ~€${Math.round(days * 12)}/total`,
    },
    {
      provider: "autoeurope",
      name: "AutoEurope",
      searchUrl: autoeuropeUrl(params),
      icon: "🏎️",
      priceHint: `de la ~€${Math.round(days * 18)}/total`,
    },
  ];
}

/**
 * Suggest car rental for a user traveling to a swap meetup location.
 */
export function suggestCarRental(
  city: string,
  arrivalDate: string,
  departureDate: string,
): CarRentalLink[] {
  return getCarRentalLinks({
    pickupCity: city,
    pickupDate: arrivalDate,
    dropoffDate: departureDate,
  });
}
