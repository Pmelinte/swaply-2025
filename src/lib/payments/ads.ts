/**
 * Ad integration for Swaply.
 * Shows non-intrusive ads to Free tier users.
 * Premium/Platinum users see no ads.
 *
 * Supported providers:
 *   - Google AdSense (NEXT_PUBLIC_ADSENSE_ID)
 *   - Carbon Ads (NEXT_PUBLIC_CARBON_SERVE)
 *   - Direct sponsors (hardcoded or DB-driven)
 *
 * Revenue: CPM €1-5 depending on placement and audience.
 */

export interface AdPlacement {
  id: string;
  position: "banner_top" | "sidebar" | "inline_feed" | "footer";
  format: "leaderboard" | "rectangle" | "native";
}

export const AD_PLACEMENTS: AdPlacement[] = [
  { id: "objects_top", position: "banner_top", format: "leaderboard" },
  { id: "match_sidebar", position: "sidebar", format: "rectangle" },
  { id: "objects_feed", position: "inline_feed", format: "native" },
  { id: "info_footer", position: "footer", format: "leaderboard" },
];

export function isAdsEnabled(): boolean {
  return !!(process.env.NEXT_PUBLIC_ADSENSE_ID || process.env.NEXT_PUBLIC_CARBON_SERVE);
}

export function getAdsenseId(): string | null {
  return process.env.NEXT_PUBLIC_ADSENSE_ID ?? null;
}

export function getCarbonServe(): string | null {
  return process.env.NEXT_PUBLIC_CARBON_SERVE ?? null;
}

/** Direct sponsor banners (fallback when no ad network). */
export interface SponsorBanner {
  id: string;
  imageUrl: string;
  targetUrl: string;
  altText: string;
  sponsor: string;
  active: boolean;
}

export const SPONSOR_BANNERS: SponsorBanner[] = [
  {
    id: "eco_sponsor_1",
    imageUrl: "/sponsors/eco-friendly.webp",
    targetUrl: "https://example.com/eco-partner",
    altText: "Partener Eco-Friendly",
    sponsor: "EcoPartner",
    active: false,
  },
];

export function getActiveSponsor(): SponsorBanner | null {
  return SPONSOR_BANNERS.find((b) => b.active) ?? null;
}
