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
  address_lat: number | null;
  address_lon: number | null;
  address_city: string | null;
  last_active_at: string | null;
};

const ITEM_COLUMNS =
  "id, owner_id, title, description, category, item_type, perceived_value_tier, swap_wants_category_l1, swap_open_to, photos, estimated_value, created_at, is_active, status";

const PROFILE_COLUMNS =
  "user_id, username, display_name, avatar_url, trust_score, address_lat, address_lon, address_city, last_active_at";

export async function fetchItemById(
  supabase: SupabaseClient,
  itemId: string,
): Promise<MatchingItemRow | null> {
  const { data, error } = await supabase
    .from("items")
    .select(ITEM_COLUMNS)
    .eq("id", itemId)
    .maybeSingle();
  if (error) return null;
  return data as MatchingItemRow | null;
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
  return data as MatchingItemRow[];
}

export async function fetchProfilesByIds(
  supabase: SupabaseClient,
  userIds: string[],
): Promise<Map<string, MatchingProfileRow>> {
  const map = new Map<string, MatchingProfileRow>();
  if (userIds.length === 0) return map;
  const { data, error } = await supabase
    .from("profiles")
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
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) return null;
  return data as MatchingProfileRow | null;
}
