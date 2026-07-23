/* eslint-disable @typescript-eslint/no-explicit-any */
import { scoreItemPair } from "@/lib/matching-engine";
import type { Item } from "@/lib/types";

export type ScoreBreakdown = {
  categoryMatch: number;
  valueMatch: number;
  typeMatch: number;
  geoScore: number;
  trustScore: number;
  activityScore: number;
  availabilityScore: number;
  total: number;
};

function toText(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim().length > 0 ? value : fallback;
}

function toBoolean(value: unknown, fallback = true): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function toPhotos(value: unknown): string[] | null {
  return Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === "string") : null;
}

function toCondition(value: unknown): Item["condition"] {
  if (value === "new" || value === "good" || value === "used" || value === "used_good") return value;
  return "good";
}

function toPerceivedValue(value: unknown): Item["perceivedValue"] {
  if (value === "small" || value === "medium" || value === "large" || value === "sentimental") return value;
  if (value === "special") return "sentimental";
  return "medium";
}

function rowToItem(row: any): Item {
  return {
    id: toText(row?.id, "unknown"),
    ownerId: toText(row?.owner_id, "unknown-owner"),
    title: toText(row?.title, "Untitled object"),
    category: toText(row?.category, "other"),
    condition: toCondition(row?.condition),
    description: toText(row?.description, ""),
    wishlist: toText(row?.swap_wants_category_l1, ""),
    status: row?.status === "active" ? "active" : "paused",
    isActive: toBoolean(row?.is_active, true),
    createdAt: toText(row?.created_at, new Date().toISOString()),
    location: toText(row?.location_city, toText(row?.address_city, "")),
    photos: toPhotos(row?.photos),
    listingType: row?.item_type === "property" || row?.item_type === "service" ? row.item_type : "object",
    perceivedValue: toPerceivedValue(row?.perceived_value_tier),
    subcategorySlug: toText(row?.subcategory, ""),
    acceptsBundle: Array.isArray(row?.swap_open_to) && row.swap_open_to.length > 1,
  };
}

function profileGeoScore(myProfile: any, theirProfile: any): number {
  const myLat = myProfile?.address_lat ?? myProfile?.location?.lat;
  const myLon = myProfile?.address_lon ?? myProfile?.location?.lon;
  const theirLat = theirProfile?.address_lat ?? theirProfile?.location?.lat;
  const theirLon = theirProfile?.address_lon ?? theirProfile?.location?.lon;

  if (!myLat || !myLon || !theirLat || !theirLon) return 50;

  const R = 6371;
  const dLat = ((theirLat - myLat) * Math.PI) / 180;
  const dLon = ((theirLon - myLon) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((myLat * Math.PI) / 180) *
      Math.cos((theirLat * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  const distKm = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  if (distKm < 50) return 100;
  if (distKm < 300) return 80;
  if (distKm < 1000) return 60;
  return 30;
}

function profileTrustScore(theirProfile: any): number {
  return Math.min(100, Math.max(0, theirProfile?.trust_score ?? 0));
}

function profileActivityScore(theirProfile: any): number {
  const lastActive = theirProfile?.last_active_at;
  if (!lastActive) return 0;
  const daysSince = (Date.now() - new Date(lastActive).getTime()) / 86_400_000;
  return Math.round(Math.max(0, Math.min(100, 100 - daysSince * 5)));
}

function getPropertyData(row: any): Record<string, unknown> {
  return row?.property_data && typeof row.property_data === "object" ? row.property_data : {};
}

function toDate(value: unknown): Date | null {
  if (typeof value !== "string" || !value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function availabilityScore(myItem: any, theirItem: any): number {
  if (myItem?.item_type !== "property" || theirItem?.item_type !== "property") return 100;
  const mine = getPropertyData(myItem);
  const theirs = getPropertyData(theirItem);
  const myStart = toDate(mine.available_start_date);
  const myEnd = toDate(mine.available_end_date);
  const theirStart = toDate(theirs.available_start_date);
  const theirEnd = toDate(theirs.available_end_date);

  if (!myStart && !myEnd && !theirStart && !theirEnd) return 60;
  if (!myStart || !myEnd || !theirStart || !theirEnd) return 70;

  return myStart <= theirEnd && theirStart <= myEnd ? 100 : 20;
}

function factorScore(candidate: ReturnType<typeof scoreItemPair>, key: string): number {
  const factor = candidate.weightedScore?.factors.find((entry) => entry.key === key);
  return factor?.raw ?? 0;
}

export function calculateMatchScore(
  myItem: any,
  theirItem: any,
  myProfile: any,
  theirProfile: any,
): ScoreBreakdown {
  const engineCandidate = scoreItemPair(toItemWithProfile(myItem, myProfile), toItemWithProfile(theirItem, theirProfile));
  const geoScore = profileGeoScore(myProfile, theirProfile);
  const trustScore = profileTrustScore(theirProfile);
  const activityScore = profileActivityScore(theirProfile);
  const propertyAvailabilityScore = availabilityScore(myItem, theirItem);

  const objectScore = Math.round(
    engineCandidate.compatibilityScore * 0.85 + propertyAvailabilityScore * 0.15,
  );
  const userScore = Math.round(geoScore * 0.45 + trustScore * 0.35 + activityScore * 0.2);
  const total = Math.round(objectScore * 0.75 + userScore * 0.25);

  return {
    categoryMatch: factorScore(engineCandidate, "category"),
    valueMatch: factorScore(engineCandidate, "value"),
    typeMatch: factorScore(engineCandidate, "wishlist"),
    geoScore,
    trustScore,
    activityScore,
    availabilityScore: propertyAvailabilityScore,
    total,
  };
}

function toItemWithProfile(row: any, profile: any): Item {
  const item = rowToItem(row);
  return {
    ...item,
    location: item.location || toText(profile?.location?.city, ""),
  };
}
