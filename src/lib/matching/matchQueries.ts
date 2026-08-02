import type { SupabaseClient } from "@supabase/supabase-js";

import {
  normalizeMatchingDomain,
  normalizeMatchingDomainList,
  type MatchingDomain,
} from "@/lib/matching/domainCompatibility";

export type MatchingDomainProfile = Record<string, unknown> & {
  domain: MatchingDomain;
};

export type MatchingItemRow = Record<string, unknown> & {
  id: string;
  owner_id: string;
  title: string;
  description?: string | null;
  category?: string | null;
  category_l1?: string | null;
  category_l2?: string | null;
  category_l3?: string | null;
  subcategory?: string | null;
  subcategory_slug?: string | null;
  condition?: string | null;
  item_type?: string | null;
  perceived_value_tier?: string | null;
  swap_open_to?: MatchingDomain[] | null;
  swap_wants_type?: MatchingDomain[] | null;
  swap_wants_category_l1?: string | null;
  swap_wants_description?: string | null;
  swap_wants_value_tier?: string | null;
  cross_category_swap?: boolean;
  images?: string[];
  image_url?: string | null;
  photos?: string[];
  estimated_value?: number | null;
  approximate_value?: number | null;
  location?: string | null;
  location_city?: string | null;
  location_country?: string | null;
  created_at?: string | null;
  is_active?: boolean;
  status?: string | null;
  domain_profile?: MatchingDomainProfile | null;
};

export type MatchingProfileRow = Record<string, unknown> & {
  user_id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  trust_score: number | null;
  location: { city?: string; country?: string; lat?: number; lon?: number } | null;
  last_active_at: string | null;
};

const ITEM_COLUMNS = [
  "id",
  "owner_id",
  "title",
  "description",
  "category",
  "category_l1",
  "category_l2",
  "category_l3",
  "subcategory",
  "subcategory_slug",
  "condition",
  "item_type",
  "perceived_value_tier",
  "swap_open_to",
  "swap_wants_type",
  "swap_wants_category_l1",
  "swap_wants_description",
  "swap_wants_value_tier",
  "cross_category_swap",
  "images",
  "image_url",
  "estimated_value",
  "approximate_value",
  "location",
  "location_city",
  "location_country",
  "created_at",
  "is_active",
  "status",
  "domain_profile",
].join(", ");

const PROFILE_COLUMNS =
  "user_id, username, display_name, avatar_url, trust_score, location, last_active_at";

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}

function numberValue(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function stringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((entry): entry is string => typeof entry === "string")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function domainProfile(
  value: unknown,
  domain: MatchingDomain,
): MatchingDomainProfile {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { domain };
  }

  return {
    ...(value as Record<string, unknown>),
    domain,
  };
}

export function normalizeMatchingItem(
  row: Record<string, unknown>,
): MatchingItemRow | null {
  const domain = normalizeMatchingDomain(row.item_type);
  const id = text(row.id);
  const ownerId = text(row.owner_id);
  const title = text(row.title);
  if (!domain || !id || !ownerId || !title) return null;

  const images = stringArray(row.images);
  const imageUrl = text(row.image_url);
  const photos = images.length > 0 ? images : imageUrl ? [imageUrl] : [];

  return {
    ...row,
    id,
    owner_id: ownerId,
    title,
    description: text(row.description),
    category: text(row.category),
    category_l1: text(row.category_l1),
    category_l2: text(row.category_l2),
    category_l3: text(row.category_l3),
    subcategory: text(row.subcategory),
    subcategory_slug: text(row.subcategory_slug),
    condition: text(row.condition),
    item_type: domain,
    perceived_value_tier: text(row.perceived_value_tier),
    swap_open_to: normalizeMatchingDomainList(row.swap_open_to),
    swap_wants_type: normalizeMatchingDomainList(row.swap_wants_type),
    swap_wants_category_l1: text(row.swap_wants_category_l1),
    swap_wants_description: text(row.swap_wants_description),
    swap_wants_value_tier: text(row.swap_wants_value_tier),
    cross_category_swap: row.cross_category_swap === true,
    images,
    image_url: imageUrl,
    photos,
    estimated_value: numberValue(row.estimated_value),
    approximate_value: numberValue(row.approximate_value),
    location: text(row.location),
    location_city: text(row.location_city),
    location_country: text(row.location_country),
    created_at: text(row.created_at),
    is_active: row.is_active === true,
    status: text(row.status),
    domain_profile: domainProfile(row.domain_profile, domain),
  };
}

function normalizeRows(rows: Record<string, unknown>[]): MatchingItemRow[] {
  return rows
    .map(normalizeMatchingItem)
    .filter((row): row is MatchingItemRow => row !== null);
}

export async function fetchItemById(
  supabase: SupabaseClient,
  itemId: string,
): Promise<MatchingItemRow | null> {
  const { data, error } = await supabase
    .from("matching_items_v1")
    .select(ITEM_COLUMNS)
    .eq("id", itemId)
    .eq("is_active", true)
    .eq("status", "active")
    .maybeSingle();

  if (error || !data) {
    if (error) console.error("fetchItemById failed", error);
    return null;
  }

  return normalizeMatchingItem(
    data as unknown as Record<string, unknown>,
  );
}

export async function fetchCandidateItems(
  supabase: SupabaseClient,
  userId: string,
  limit = 100,
): Promise<MatchingItemRow[]> {
  const { data, error } = await supabase
    .from("matching_items_v1")
    .select(ITEM_COLUMNS)
    .neq("owner_id", userId)
    .eq("is_active", true)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) {
    if (error) console.error("fetchCandidateItems failed", error);
    return [];
  }

  return normalizeRows(
    data as unknown as Record<string, unknown>[],
  );
}

export async function fetchOwnActiveItems(
  supabase: SupabaseClient,
  userId: string,
  limit = 100,
): Promise<MatchingItemRow[]> {
  const { data, error } = await supabase
    .from("matching_items_v1")
    .select(ITEM_COLUMNS)
    .eq("owner_id", userId)
    .eq("is_active", true)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) {
    if (error) console.error("fetchOwnActiveItems failed", error);
    return [];
  }

  return normalizeRows(
    data as unknown as Record<string, unknown>[],
  );
}

export async function fetchProfilesByIds(
  supabase: SupabaseClient,
  userIds: string[],
): Promise<Map<string, MatchingProfileRow>> {
  const map = new Map<string, MatchingProfileRow>();
  if (userIds.length === 0) return map;

  const { data, error } = await supabase
    .from("public_profiles")
    .select(PROFILE_COLUMNS)
    .in("user_id", userIds);

  if (error || !data) return map;
  for (const row of data as MatchingProfileRow[]) {
    map.set(row.user_id, row);
  }
  return map;
}

export async function fetchProfileById(
  supabase: SupabaseClient,
  userId: string,
): Promise<MatchingProfileRow | null> {
  const { data, error } = await supabase
    .from("public_profiles")
    .select(PROFILE_COLUMNS)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) return null;
  return data as MatchingProfileRow | null;
}
