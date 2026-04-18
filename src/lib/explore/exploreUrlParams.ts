import {
  DEFAULT_FILTER_STATE,
  type ExploreFilterState,
  type ExploreTab,
  type Flexibility,
  type ItemKind,
  type ItemKindOrAny,
  type ValueTier,
  type Intent,
  type Context,
} from "./exploreFilterTypes";

const ITEM_KINDS: ItemKind[] = ["object", "property", "service", "event"];
const KINDS_WITH_ANY: ItemKindOrAny[] = [...ITEM_KINDS, "any"];
const VALUE_TIERS: ValueTier[] = ["Small", "Medium", "Large", "Special"];
const FLEX: Flexibility[] = ["Strict", "Moderate", "Wide"];

function asCsv(arr: string[]): string | null {
  return arr.length > 0 ? arr.join(",") : null;
}

function fromCsv(value: string | null): string[] {
  return value ? value.split(",").filter(Boolean) : [];
}

function asInt(value: string | null): number | null {
  if (!value) return null;
  const n = parseInt(value, 10);
  return Number.isFinite(n) ? n : null;
}

function asBool(value: string | null): boolean {
  return value === "1" || value === "true";
}

export function encodeFiltersToParams(state: ExploreFilterState): URLSearchParams {
  const params = new URLSearchParams();
  if (state.tab !== "offer") params.set("tab", state.tab);

  // Offer
  const o = state.offer;
  if (o.type) params.set("offer_type", o.type);
  if (o.category_l1) params.set("offer_cat", o.category_l1);
  if (o.category_l2) params.set("offer_subcat", o.category_l2);
  if (o.condition) params.set("offer_condition", o.condition);
  if (o.value_tier) params.set("offer_value", o.value_tier);
  if (o.city) params.set("offer_city", o.city);
  if (o.radius_km && o.radius_km !== 50) params.set("offer_radius", String(o.radius_km));
  if (o.property_type) params.set("offer_prop_type", o.property_type);
  const proxCsv = asCsv(o.proximity);
  if (proxCsv) params.set("offer_prox", proxCsv);
  if (o.bedrooms !== null) params.set("offer_bed", String(o.bedrooms));
  if (o.bathrooms !== null) params.set("offer_bath", String(o.bathrooms));
  if (o.area_min !== null) params.set("offer_area_min", String(o.area_min));
  if (o.area_max !== null) params.set("offer_area_max", String(o.area_max));
  const amenCsv = asCsv(o.amenities);
  if (amenCsv) params.set("offer_amenities", amenCsv);
  if (o.available_from) params.set("offer_from", o.available_from);
  if (o.available_to) params.set("offer_to", o.available_to);
  if (o.service_modality) params.set("offer_modality", o.service_modality);
  const daysCsv = asCsv(o.service_days);
  if (daysCsv) params.set("offer_days", daysCsv);
  const certCsv = asCsv(o.certifications);
  if (certCsv) params.set("offer_cert", certCsv);
  if (o.event_online) params.set("offer_online", "1");
  if (o.capacity_bucket) params.set("offer_cap", o.capacity_bucket);
  const incCsv = asCsv(o.includes);
  if (incCsv) params.set("offer_inc", incCsv);

  // Want
  const w = state.want;
  if (w.type) params.set("want_type", w.type);
  if (w.query) params.set("want_q", w.query);
  if (w.value_tier) params.set("want_value", w.value_tier);
  if (w.flexibility) params.set("want_flex", w.flexibility);
  if (w.chain_swap) params.set("chain_swap", "1");
  if (w.partial_swap) params.set("partial_swap", "1");

  // Profile
  const p = state.profile;
  if (p.id_verified) params.set("user_idver", "1");
  if (p.email_verified) params.set("user_emver", "1");
  if (p.has_completed_swap) params.set("user_hascompleted", "1");
  if (p.min_rating !== null) params.set("user_rating", String(p.min_rating));
  if (p.response_time) params.set("user_response", p.response_time);
  const intentCsv = asCsv(p.intents);
  if (intentCsv) params.set("user_intent", intentCsv);
  const ctxCsv = asCsv(p.contexts);
  if (ctxCsv) params.set("user_context", ctxCsv);
  const langCsv = asCsv(p.languages);
  if (langCsv) params.set("user_lang", langCsv);
  if (p.affinity) params.set("user_aff", p.affinity);
  if (p.city) params.set("user_city", p.city);
  if (p.radius_km && p.radius_km !== 50) params.set("user_radius", String(p.radius_km));

  if (state.sort !== "match_score") params.set("sort", state.sort);

  return params;
}

export function decodeParamsToFilters(search: URLSearchParams): ExploreFilterState {
  const tab = search.get("tab") as ExploreTab | null;
  const state: ExploreFilterState = {
    ...DEFAULT_FILTER_STATE,
    tab: tab === "want" || tab === "profile" ? tab : "offer",
    offer: { ...DEFAULT_FILTER_STATE.offer },
    want: { ...DEFAULT_FILTER_STATE.want },
    profile: { ...DEFAULT_FILTER_STATE.profile },
  };

  // Offer
  const ot = search.get("offer_type");
  if (ot && (ITEM_KINDS as string[]).includes(ot)) state.offer.type = ot as ItemKind;
  state.offer.category_l1 = search.get("offer_cat");
  state.offer.category_l2 = search.get("offer_subcat");
  state.offer.condition = search.get("offer_condition");
  const ov = search.get("offer_value");
  if (ov && (VALUE_TIERS as string[]).includes(ov)) state.offer.value_tier = ov as ValueTier;
  state.offer.city = search.get("offer_city") ?? "";
  state.offer.radius_km = asInt(search.get("offer_radius")) ?? 50;
  state.offer.property_type = search.get("offer_prop_type");
  state.offer.proximity = fromCsv(search.get("offer_prox"));
  state.offer.bedrooms = asInt(search.get("offer_bed"));
  state.offer.bathrooms = asInt(search.get("offer_bath"));
  state.offer.area_min = asInt(search.get("offer_area_min"));
  state.offer.area_max = asInt(search.get("offer_area_max"));
  state.offer.amenities = fromCsv(search.get("offer_amenities"));
  state.offer.available_from = search.get("offer_from") ?? "";
  state.offer.available_to = search.get("offer_to") ?? "";
  state.offer.service_modality = search.get("offer_modality");
  state.offer.service_days = fromCsv(search.get("offer_days"));
  state.offer.certifications = fromCsv(search.get("offer_cert"));
  state.offer.event_online = asBool(search.get("offer_online"));
  state.offer.capacity_bucket = search.get("offer_cap");
  state.offer.includes = fromCsv(search.get("offer_inc"));

  // Want
  const wt = search.get("want_type");
  if (wt && (KINDS_WITH_ANY as string[]).includes(wt)) state.want.type = wt as ItemKindOrAny;
  state.want.query = search.get("want_q") ?? "";
  const wv = search.get("want_value");
  if (wv && (VALUE_TIERS as string[]).includes(wv)) state.want.value_tier = wv as ValueTier;
  const wf = search.get("want_flex");
  if (wf && (FLEX as string[]).includes(wf)) state.want.flexibility = wf as Flexibility;
  state.want.chain_swap = asBool(search.get("chain_swap"));
  state.want.partial_swap = asBool(search.get("partial_swap"));

  // Profile
  state.profile.id_verified = asBool(search.get("user_idver"));
  state.profile.email_verified = asBool(search.get("user_emver"));
  state.profile.has_completed_swap = asBool(search.get("user_hascompleted"));
  state.profile.min_rating = asInt(search.get("user_rating"));
  state.profile.response_time = search.get("user_response");
  state.profile.intents = fromCsv(search.get("user_intent")) as Intent[];
  state.profile.contexts = fromCsv(search.get("user_context")) as Context[];
  state.profile.languages = fromCsv(search.get("user_lang"));
  state.profile.affinity = search.get("user_aff") ?? "";
  state.profile.city = search.get("user_city") ?? "";
  state.profile.radius_km = asInt(search.get("user_radius")) ?? 50;

  const sort = search.get("sort");
  if (sort === "newest" || sort === "value_asc" || sort === "value_desc") {
    state.sort = sort;
  }

  return state;
}

export function isEmptyFilterState(state: ExploreFilterState): boolean {
  const o = state.offer;
  const w = state.want;
  const p = state.profile;
  return (
    !o.type && !o.category_l1 && !o.category_l2 && !o.condition && !o.value_tier
    && !o.city && o.proximity.length === 0 && o.bedrooms === null && o.bathrooms === null
    && o.area_min === null && o.area_max === null && o.amenities.length === 0
    && !o.available_from && !o.available_to && !o.service_modality
    && o.service_days.length === 0 && o.certifications.length === 0
    && !o.event_online && !o.capacity_bucket && o.includes.length === 0
    && !w.type && !w.query && !w.value_tier && !w.flexibility
    && !w.chain_swap && !w.partial_swap
    && !p.id_verified && !p.email_verified && !p.has_completed_swap
    && p.min_rating === null && !p.response_time
    && p.intents.length === 0 && p.contexts.length === 0 && p.languages.length === 0
    && !p.affinity && !p.city
  );
}
