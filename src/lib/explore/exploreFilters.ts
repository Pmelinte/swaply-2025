import type { ExploreFilters } from "@/components/explore/ExploreFilterDrawer";

const asCsv = (arr: string[]) => arr.join(",");

const asArray = (v: string | null): string[] =>
  v ? v.split(",").map((s) => s.trim()).filter(Boolean) : [];

const asNumber = (v: string | null, fallback: number): number => {
  if (v === null) return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const asUserType = (v: string | null): "individual" | "business" | "both" => {
  if (v === "individual" || v === "business" || v === "both") return v;
  return "both";
};

/**
 * Serializes filter state into a URLSearchParams object.
 * Empty/default values are omitted to keep URLs short and shareable.
 */
export function filtersToSearchParams(filters: ExploreFilters): URLSearchParams {
  const sp = new URLSearchParams();
  const { wantsFilters: w, offersFilters: o, profileFilters: p } = filters;

  if (w.categories.length) sp.set("wants", asCsv(w.categories));
  if (w.subcategories.length) sp.set("wantsSub", asCsv(w.subcategories));
  if (w.condition) sp.set("wantsCond", w.condition);
  if (w.exchangeType) sp.set("wantsEx", w.exchangeType);
  if (w.distance !== 500) sp.set("wantsDist", String(w.distance));

  if (o.categories.length) sp.set("offers", asCsv(o.categories));
  if (o.subcategories.length) sp.set("offersSub", asCsv(o.subcategories));
  if (o.condition) sp.set("offersCond", o.condition);
  if (o.exchangeType) sp.set("offersEx", o.exchangeType);
  if (o.distance !== 500) sp.set("offersDist", String(o.distance));

  if (p.distance !== 50) sp.set("dist", String(p.distance));
  if (p.userType !== "both") sp.set("userType", p.userType);
  if (p.verifiedOnly) sp.set("verified", "1");
  if (p.minRating > 0) sp.set("rating", String(p.minRating));

  return sp;
}

/**
 * Parses URLSearchParams back into ExploreFilters. Missing keys fall back to
 * the drawer's defaults so a bare /explore URL hydrates an empty state.
 */
export function searchParamsToFilters(sp: URLSearchParams): ExploreFilters {
  return {
    wantsFilters: {
      categories: asArray(sp.get("wants")),
      subcategories: asArray(sp.get("wantsSub")),
      distance: asNumber(sp.get("wantsDist"), 500),
      condition: sp.get("wantsCond"),
      exchangeType: sp.get("wantsEx"),
    },
    offersFilters: {
      categories: asArray(sp.get("offers")),
      subcategories: asArray(sp.get("offersSub")),
      distance: asNumber(sp.get("offersDist"), 500),
      condition: sp.get("offersCond"),
      exchangeType: sp.get("offersEx"),
    },
    profileFilters: {
      distance: asNumber(sp.get("dist"), 50),
      userType: asUserType(sp.get("userType")),
      verifiedOnly: sp.get("verified") === "1",
      minRating: asNumber(sp.get("rating"), 0),
    },
  };
}
