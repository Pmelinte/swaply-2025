import type { SupabaseClient } from "@supabase/supabase-js";

export type MatchingItemRow = Record<string, unknown> & {
  id: string;
  owner_id: string;
  title: string;
  category: string | null;
  item_type: string | null;
  perceived_value_tier: string | null;
  swap_wants_category_l1: string | null;
  swap_open_to: string[] | null;
  images: string[] | null;
  image_url: string | null;
  photos: string[] | null;
  estimated_value: number | null;
  created_at: string | null;
  is_active?: boolean;
  status?: string | null;
};

export type MatchingProfileRow = Record<string, unknown> & {
  user_id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  trust_score: number | null;
  location: { city?: string; country?: string } | null;
  last_active_at: string | null;
};

const ITEM_COLUMNS =
  "id, owner_id, title, description, category, item_type, perceived_value_tier, swap_open_to, images, image_url, estimated_value, swap_wants_category_l1, created_at, is_active, status";

const PROFILE_COLUMNS =
  "user_id, username, display_name, avatar_url, trust_score, location, last_active_at";

function normalizeMatchingItem(row: Record<string, unknown>): MatchingItemRow {
  const images = Array.isArray(row.images)
    ? row.images.filter((value): value is string => typeof value === "string" && value.length > 0)
    : [];
  const imageUrl = typeof row.image_url === "string" && row.image_url.length > 0 ? row.image_url : null;
  const photos = images.length > 0 ? images : imageUrl ? [imageUrl] : [];

  return {
    ...row,
    swap_wants_category_l1: typeof row.swap_wants_category_l1 === "string" ? row.swap_wants_category_l1 : null,
    images,
    image_url: imageUrl,
    photos,
  } as MatchingItemRow;
}

export async function fetchItemById(
  supabase: SupabaseClient,
  itemId: string,
): Promise<MatchingItemRow | null> {
  const { data, error } = await supabase
    .from("items")
    .select(ITEM_COLUMNS)
    .eq("id", itemId)
    .maybeSingle();
  if (error || !data) return null;
  return normalizeMatchingItem(data as Record<string, unknown>);
}

export async function fetchCandidateItems(
  supabase: SupabaseClient,
  userId: string,
  limit = 100,
): Promise<MatchingItemRow[]> {
  const { data, error } = await supabase
    .from("items")
    .select(ITEM_COLUMNS)
    .neq("owner_id", userId)
    .eq("is_active", true)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map(normalizeMatchingItem);
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
