import type { SupabaseClient } from "@supabase/supabase-js";

export interface ExploreQueryOptions {
  type?: string;
  category_l1?: string;
  category_l2?: string;
  condition?: string | null;
  exchangeType?: string | null;
  limit?: number;
}

export function buildExploreQuery(supabase: SupabaseClient, o: ExploreQueryOptions) {
  // .select() is required before .eq() — from() alone returns PostgrestQueryBuilder
  // which does not expose filter methods
  let query = supabase
    .from("items")
    .select("*")
    .eq("status", "active")
    .eq("is_active", true);

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
  if (o.exchangeType && o.exchangeType !== "any") {
    query = query.eq("exchange_type", o.exchangeType);
  }
  if (o.limit) {
    query = query.limit(o.limit);
  }

  return query;
}
