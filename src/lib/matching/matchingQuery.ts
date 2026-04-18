/**
 * Supabase query helpers for the Matching page.
 * Fetches candidate items from other users that could match the active slots.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Item } from "../types";

export interface MatchingQueryParams {
  slotItems: Item[];
  userId: string;
  limit?: number;
  categoryFilter?: string | null;
  conditionFilter?: string | null;
  maxDistanceKm?: number;
}

/**
 * Fetches active items from other users, filtered by relevance to slot categories.
 * Full scoring is done client-side via calculateMatchScore.
 */
export async function fetchMatchingCandidates(
  supabase: SupabaseClient,
  params: MatchingQueryParams,
): Promise<Item[]> {
  const { slotItems, userId, limit = 50, categoryFilter, conditionFilter } = params;

  const slotCategories = slotItems
    .map((i) => i.category)
    .filter(Boolean);

  let query = supabase
    .from("items")
    .select("*")
    .neq("owner_id", userId)
    .eq("status", "active")
    .eq("is_active", true)
    .limit(limit);

  // Prefer items whose category overlaps with what slots seek
  if (categoryFilter) {
    query = query.eq("category", categoryFilter);
  } else if (slotCategories.length > 0) {
    query = query.in("category", slotCategories);
  }

  if (conditionFilter) {
    query = query.eq("condition", conditionFilter);
  }

  query = query.order("created_at", { ascending: false });

  const { data, error } = await query;
  if (error || !data) return [];

  return data.map(rowToItem);
}

/**
 * Fetches AI-suggested candidates: broader criteria, no category restriction.
 */
export async function fetchAICandidates(
  supabase: SupabaseClient,
  userId: string,
  limit = 10,
): Promise<Item[]> {
  const { data, error } = await supabase
    .from("items")
    .select("*")
    .neq("owner_id", userId)
    .eq("status", "active")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return data.map(rowToItem);
}

function rowToItem(row: Record<string, unknown>): Item {
  return {
    id: row.id as string,
    ownerId: (row.owner_id ?? row.ownerId) as string,
    title: row.title as string,
    category: row.category as string,
    condition: row.condition as Item["condition"],
    description: (row.description as string) ?? "",
    wishlist: (row.wishlist as string) ?? "",
    status: (row.status as Item["status"]) ?? "active",
    isActive: (row.is_active ?? row.isActive ?? true) as boolean,
    createdAt: (row.created_at ?? row.createdAt ?? "") as string,
    location: (row.location as string) ?? "",
    photos: (row.photos as string[]) ?? [],
    aiSuggestedTags: (row.ai_suggested_tags ?? row.aiSuggestedTags ?? []) as string[],
    userFinalTags: (row.user_final_tags ?? row.userFinalTags ?? []) as string[],
    intent: row.intent as Item["intent"],
    flexibility: row.flexibility as Item["flexibility"],
    perceivedValue: row.perceived_value as Item["perceivedValue"],
    acceptsBundle: (row.accepts_bundle ?? row.acceptsBundle ?? false) as boolean,
    isBoosted: (row.is_boosted ?? row.isBoosted ?? false) as boolean,
  };
}
