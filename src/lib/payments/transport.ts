/**
 * Transport affiliate integration for Swaply.
 * Deep-link to ride-hailing services for meetup transport.
 *
 * Revenue: Affiliate commission per ride (5-8% Bolt, CPA $3-5 Uber).
 *
 * Env vars (optional):
 *   BOLT_PARTNER_ID
 *   UBER_AFFILIATE_TOKEN
 */

// ── Types ──

export type TransportProvider = "bolt" | "uber" | "waze";

export interface TransportLink {
  provider: TransportProvider;
  name: string;
  deepLink: string;
  webLink: string;
  icon: string;
  available: boolean;
}

// ── Deep Link Generators ──

function boltDeepLink(destLat: number, destLng: number, destName: string): string {
  const partnerId = process.env.BOLT_PARTNER_ID ?? "";
  const affiliate = partnerId ? `&aff_id=${partnerId}` : "";
  return `https://m.bolt.eu/action/requestRide?destination_lat=${destLat}&destination_lng=${destLng}&destination_name=${encodeURIComponent(destName)}${affiliate}`;
}

function uberDeepLink(destLat: number, destLng: number, destName: string): string {
  const affiliateToken = process.env.UBER_AFFILIATE_TOKEN ?? "";
  const clientId = affiliateToken ? `&client_id=${affiliateToken}` : "";
  return `https://m.uber.com/ul/?action=setPickup&dropoff[latitude]=${destLat}&dropoff[longitude]=${destLng}&dropoff[nickname]=${encodeURIComponent(destName)}${clientId}`;
}

function wazeLink(destLat: number, destLng: number): string {
  return `https://waze.com/ul?ll=${destLat},${destLng}&navigate=yes`;
}

// ── Public API ──

export function getTransportLinks(
  destLat: number,
  destLng: number,
  destName: string,
): TransportLink[] {
  return [
    {
      provider: "bolt",
      name: "Bolt",
      deepLink: boltDeepLink(destLat, destLng, destName),
      webLink: boltDeepLink(destLat, destLng, destName),
      icon: "🚗",
      available: true,
    },
    {
      provider: "uber",
      name: "Uber",
      deepLink: uberDeepLink(destLat, destLng, destName),
      webLink: uberDeepLink(destLat, destLng, destName),
      icon: "🚕",
      available: true,
    },
    {
      provider: "waze",
      name: "Waze (navigare)",
      deepLink: wazeLink(destLat, destLng),
      webLink: wazeLink(destLat, destLng),
      icon: "🗺️",
      available: true,
    },
  ];
}

/** Check if transport affiliate is configured (has partner IDs). */
export function hasTransportAffiliate(): boolean {
  return !!(process.env.BOLT_PARTNER_ID || process.env.UBER_AFFILIATE_TOKEN);
}
