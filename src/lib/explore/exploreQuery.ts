import type { SupabaseClient } from "@supabase/supabase-js";
import type { ExploreFilterState } from "./exploreFilterTypes";

// NOTE: swap_open_to is TEXT (comma-separated), not an array.
// We use ILIKE '%type%' for fuzzy matching rather than array containment.

type ItemsQuery = ReturnType<SupabaseClient["from"]>;

export function applyExploreFilters(
  baseQuery: ItemsQuery,
  state: ExploreFilterState,
): ItemsQuery {
  let query = baseQuery;
  const o = state.offer;
  const w = state.want;
  const p = state.profile;

  // ── Offer-axis (filter on items own offerings) ──
  if (o.type) {
    query = query.eq("item_type", o.type);
  }
  if (o.category_l1) {
    query = query.eq("category_l1", o.category_l1);
  }
  if (o.category_l2) {
    query = query.eq("category_l2", o.category_l2);
  }
  if (o.condition) {
    query = query.eq("condition", o.condition);
  }
  if (o.value_tier) {
    query = query.eq("perceived_value_tier", o.value_tier);
  }
  if (o.city) {
    query = query.ilike("location", `%${o.city}%`);
  }
  // Property type
  if (o.property_type) {
    query = query.eq("property_data->>property_type", o.property_type);
  }
  if (o.bedrooms !== null) {
    query = query.gte("property_data->>bedrooms", o.bedrooms);
  }
  if (o.bathrooms !== null) {
    query = query.gte("property_data->>bathrooms", o.bathrooms);
  }
  if (o.area_min !== null) {
    query = query.gte("property_data->>total_area_sqm", o.area_min);
  }
  if (o.area_max !== null) {
    query = query.lte("property_data->>total_area_sqm", o.area_max);
  }
  // Service modality
  if (o.service_modality) {
    query = query.eq("service_data->>service_modality", o.service_modality);
  }
  // Event online flag
  if (o.type === "event" && o.event_online) {
    query = query.eq("event_data->>is_online", true);
  }

  // ── Want-axis (filter on what listings want in return) ──
  if (w.type === "any") {
    query = query.eq("cross_category_swap", true);
  } else if (w.type) {
    // swap_open_to is TEXT comma-separated; use ILIKE
    query = query.ilike("swap_open_to", `%${w.type}%`);
  }
  if (w.query.trim()) {
    query = query.ilike("swap_wants_description", `%${w.query.trim()}%`);
  }
  if (w.flexibility) {
    query = query.eq("swap_flexibility", w.flexibility);
  }
  if (w.chain_swap) {
    query = query.eq("swap_chain_allowed", true);
  }
  if (w.partial_swap) {
    query = query.eq("swap_partial_allowed", true);
  }

  // ── Profile-axis (filter on owner's profile) ──
  if (p.id_verified) {
    query = query.eq("profiles.id_verified", true);
  }
  if (p.email_verified) {
    query = query.eq("profiles.email_verified", true);
  }
  if (p.min_rating !== null) {
    query = query.gte("profiles.response_rate", p.min_rating * 20);
  }
  if (p.languages.length > 0) {
    query = query.overlaps("profiles.languages", p.languages);
  }
  if (p.city) {
    query = query.ilike("profiles.location->>city", `%${p.city}%`);
  }

  // Sort
  switch (state.sort) {
    case "newest":
      query = query.order("created_at", { ascending: false });
      break;
    case "value_asc":
      query = query.order("perceived_value_tier", { ascending: true });
      break;
    case "value_desc":
      query = query.order("perceived_value_tier", { ascending: false });
      break;
    default:
      // match_score — fall back to newest until scoring is wired up
      query = query.order("created_at", { ascending: false });
  }

  return query;
}

export async function countExploreResults(
  supabase: SupabaseClient,
  state: ExploreFilterState,
): Promise<number> {
  const base = supabase
    .from("items")
    .select("id, profiles:owner_id(id, id_verified, email_verified, response_rate, languages, location)", {
      count: "exact",
      head: true,
    })
    .eq("status", "active");

  const query = applyExploreFilters(base, state);
  const { count, error } = await query;
  if (error) {
    console.error("[explore] count error:", error);
    return 0;
  }
  return count ?? 0;
}
