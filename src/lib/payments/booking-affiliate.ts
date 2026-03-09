/**
 * Booking.com & Airbnb affiliate integration for Swaply.
 * Generates affiliate links for house swap users who need accommodation
 * while their property is occupied or who want nearby alternatives.
 *
 * Revenue model:
 *   - Booking.com: 25-40% commission on bookings via Affiliate Partner Programme
 *   - Airbnb: ~2-3% referral via Associates Program
 *   - VRBO/HomeAway: 2% commission
 *
 * Env vars:
 *   BOOKING_AFFILIATE_ID
 *   AIRBNB_AFFILIATE_ID
 *   VRBO_AFFILIATE_ID
 */

// ── Types ──

export type AccommodationProvider = "booking" | "airbnb" | "vrbo";

export interface AccommodationSearchParams {
  city: string;
  countryCode?: string;
  checkIn: string;        // YYYY-MM-DD
  checkOut: string;       // YYYY-MM-DD
  guests: number;
  rooms?: number;
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
}

export interface AccommodationLink {
  provider: AccommodationProvider;
  name: string;
  searchUrl: string;
  icon: string;
  commissionInfo: string;
}

export interface NearbyAccommodation {
  provider: AccommodationProvider;
  title: string;
  url: string;
  priceRange?: string;
  rating?: number;
  distance?: string;
}

// ── Config ──

export function isBookingConfigured(): boolean {
  return !!process.env.BOOKING_AFFILIATE_ID;
}

export function isAirbnbConfigured(): boolean {
  return !!process.env.AIRBNB_AFFILIATE_ID;
}

// ── Booking.com Links ──

function bookingSearchUrl(params: AccommodationSearchParams): string {
  const affiliateId = process.env.BOOKING_AFFILIATE_ID ?? "";
  const aid = affiliateId ? `&aid=${affiliateId}` : "";

  const baseUrl = "https://www.booking.com/searchresults.html";
  const queryParts = [
    `ss=${encodeURIComponent(params.city)}`,
    `checkin=${params.checkIn}`,
    `checkout=${params.checkOut}`,
    `group_adults=${params.guests}`,
    `no_rooms=${params.rooms ?? 1}`,
    `selected_currency=EUR`,
    aid,
  ];

  if (params.latitude && params.longitude) {
    queryParts.push(`latitude=${params.latitude}`);
    queryParts.push(`longitude=${params.longitude}`);
  }

  return `${baseUrl}?${queryParts.join("&")}`;
}

// ── Airbnb Links ──

function airbnbSearchUrl(params: AccommodationSearchParams): string {
  const affiliateId = process.env.AIRBNB_AFFILIATE_ID ?? "";
  const ref = affiliateId ? `&ref=${affiliateId}` : "";

  const baseUrl = "https://www.airbnb.com/s";
  const location = encodeURIComponent(params.city);
  const queryParts = [
    `checkin=${params.checkIn}`,
    `checkout=${params.checkOut}`,
    `adults=${params.guests}`,
    `source=swaply`,
    ref,
  ];

  return `${baseUrl}/${location}/homes?${queryParts.join("&")}`;
}

// ── VRBO/HomeAway Links ──

function vrboSearchUrl(params: AccommodationSearchParams): string {
  const affiliateId = process.env.VRBO_AFFILIATE_ID ?? "";
  const ref = affiliateId ? `&partnerid=${affiliateId}` : "";

  return `https://www.vrbo.com/search?destination=${encodeURIComponent(params.city)}&startDate=${params.checkIn}&endDate=${params.checkOut}&adults=${params.guests}${ref}`;
}

// ── Public API ──

export function getAccommodationLinks(params: AccommodationSearchParams): AccommodationLink[] {
  return [
    {
      provider: "booking",
      name: "Booking.com",
      searchUrl: bookingSearchUrl(params),
      icon: "🏨",
      commissionInfo: "Cele mai bune prețuri garantate",
    },
    {
      provider: "airbnb",
      name: "Airbnb",
      searchUrl: airbnbSearchUrl(params),
      icon: "🏠",
      commissionInfo: "Case și apartamente unice",
    },
    {
      provider: "vrbo",
      name: "VRBO",
      searchUrl: vrboSearchUrl(params),
      icon: "🏡",
      commissionInfo: "Închirieri de vacanță",
    },
  ];
}

/**
 * Suggest accommodation near a swap meetup point or house swap location.
 * Used when a user needs temporary housing during a house swap.
 */
export function getSuggestedAccommodation(
  city: string,
  checkIn: string,
  checkOut: string,
  guests: number,
  lat?: number,
  lng?: number,
): AccommodationLink[] {
  return getAccommodationLinks({
    city,
    checkIn,
    checkOut,
    guests,
    latitude: lat,
    longitude: lng,
  });
}

/**
 * Generate a single provider deeplink (for embedding in swap confirmation emails).
 */
export function getProviderLink(
  provider: AccommodationProvider,
  params: AccommodationSearchParams,
): string {
  switch (provider) {
    case "booking":
      return bookingSearchUrl(params);
    case "airbnb":
      return airbnbSearchUrl(params);
    case "vrbo":
      return vrboSearchUrl(params);
  }
}
