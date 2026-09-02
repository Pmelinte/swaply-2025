import type { ExploreFilters, CatalogFilter, ProfileFilter } from "@/components/drawer/variants/DrawerExplore";

const asCsv = (arr: string[]) => arr.join(",");
const asArray = (v: string | null): string[] =>
  v ? v.split(",").map((s) => s.trim()).filter(Boolean) : [];
const asNumber = (v: string | null, fallback: number): number => {
  if (v === null) return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};
const asBoolNull = (v: string | null): boolean | null =>
  v === "1" ? true : null;
const asUserType = (v: string | null): "individual" | "business" | "both" => {
  if (v === "individual" || v === "business" || v === "both") return v;
  return "both";
};

export function filtersToSearchParams(filters: ExploreFilters): URLSearchParams {
  const sp = new URLSearchParams();
  const { wantsFilters: w, offersFilters: o, profileFilters: p } = filters;

  // ── wants ──
  if (w.selectedCategories.length) sp.set("wCats", asCsv(w.selectedCategories));
  if (w.distance !== 500) sp.set("wDist", String(w.distance));
  if (w.geography.length) sp.set("wGeo", asCsv(w.geography));
  if (w.fulfilment.length) sp.set("wFul", asCsv(w.fulfilment));
  // objects
  if (w.objects.categoryL1.length) sp.set("wObjCat", asCsv(w.objects.categoryL1));
  if (w.objects.condition.length) sp.set("wObjCond", asCsv(w.objects.condition));
  if (w.objects.perceivedValueTier.length) sp.set("wObjPvt", asCsv(w.objects.perceivedValueTier));
  if (w.objects.ageYearsMax) sp.set("wObjAge", String(w.objects.ageYearsMax));
  if (w.objects.originalPackaging) sp.set("wObjPkg", "1");
  if (w.objects.swapOpenTo.length) sp.set("wObjSot", asCsv(w.objects.swapOpenTo));
  if (w.objects.swapValueMatch) sp.set("wObjVm", w.objects.swapValueMatch);
  if (w.objects.swapFlexibility) sp.set("wObjFlex", w.objects.swapFlexibility);
  if (w.objects.swapChainAllowed) sp.set("wObjChain", "1");
  if (w.objects.swapPartialAllowed) sp.set("wObjPart", "1");
  if (w.objects.crossCategorySwap) sp.set("wObjCross", "1");
  // properties
  if (w.properties.propertyType.length) sp.set("wPropType", asCsv(w.properties.propertyType));
  if (w.properties.propertyCategory.length) sp.set("wPropCat", asCsv(w.properties.propertyCategory));
  if (w.properties.bedroomsMin) sp.set("wPropBed", String(w.properties.bedroomsMin));
  if (w.properties.bathroomsMin) sp.set("wPropBath", String(w.properties.bathroomsMin));
  if (w.properties.areaMin) sp.set("wPropAreaMin", String(w.properties.areaMin));
  if (w.properties.areaMax) sp.set("wPropAreaMax", String(w.properties.areaMax));
  if (w.properties.furnishingLevel.length) sp.set("wPropFurn", asCsv(w.properties.furnishingLevel));
  if (w.properties.exchangeType.length) sp.set("wPropEx", asCsv(w.properties.exchangeType));
  if (w.properties.hasPool) sp.set("wPropPool", "1");
  if (w.properties.hasGarage) sp.set("wPropGarage", "1");
  if (w.properties.hasElevator) sp.set("wPropElev", "1");
  if (w.properties.country) sp.set("wPropCountry", w.properties.country);
  // services
  if (w.services.categoryL1.length) sp.set("wSvcCat", asCsv(w.services.categoryL1));
  if (w.services.categoryL2.length) sp.set("wSvcCat2", asCsv(w.services.categoryL2));
  if (w.services.modality.length) sp.set("wSvcMod", asCsv(w.services.modality));
  if (w.services.experienceLevel.length) sp.set("wSvcExp", asCsv(w.services.experienceLevel));
  if (w.services.swapFor.length) sp.set("wSvcFor", asCsv(w.services.swapFor));
  if (w.services.valueMatch) sp.set("wSvcVm", w.services.valueMatch);
  if (w.services.geoPreference) sp.set("wSvcGeo", w.services.geoPreference);
  // events
  if (w.events.eventTypeL1.length) sp.set("wEvtType", asCsv(w.events.eventTypeL1));
  if (w.events.eventTypeL2.length) sp.set("wEvtType2", asCsv(w.events.eventTypeL2));
  if (w.events.isOnline) sp.set("wEvtOnline", "1");
  if (w.events.startDateFrom) sp.set("wEvtFrom", w.events.startDateFrom);
  if (w.events.startDateTo) sp.set("wEvtTo", w.events.startDateTo);
  if (w.events.country) sp.set("wEvtCountry", w.events.country);
  if (w.events.swapFor.length) sp.set("wEvtFor", asCsv(w.events.swapFor));
  if (w.events.valueMatch) sp.set("wEvtVm", w.events.valueMatch);

  // ── offers ──
  if (o.selectedCategories.length) sp.set("oCats", asCsv(o.selectedCategories));
  if (o.distance !== 500) sp.set("oDist", String(o.distance));
  if (o.geography.length) sp.set("oGeo", asCsv(o.geography));
  if (o.fulfilment.length) sp.set("oFul", asCsv(o.fulfilment));
  if (o.objects.categoryL1.length) sp.set("oObjCat", asCsv(o.objects.categoryL1));
  if (o.objects.condition.length) sp.set("oObjCond", asCsv(o.objects.condition));
  if (o.objects.perceivedValueTier.length) sp.set("oObjPvt", asCsv(o.objects.perceivedValueTier));
  if (o.objects.ageYearsMax) sp.set("oObjAge", String(o.objects.ageYearsMax));
  if (o.objects.originalPackaging) sp.set("oObjPkg", "1");
  if (o.objects.swapOpenTo.length) sp.set("oObjSot", asCsv(o.objects.swapOpenTo));
  if (o.objects.swapValueMatch) sp.set("oObjVm", o.objects.swapValueMatch);
  if (o.objects.swapFlexibility) sp.set("oObjFlex", o.objects.swapFlexibility);
  if (o.objects.swapChainAllowed) sp.set("oObjChain", "1");
  if (o.objects.swapPartialAllowed) sp.set("oObjPart", "1");
  if (o.objects.crossCategorySwap) sp.set("oObjCross", "1");
  if (o.properties.propertyType.length) sp.set("oPropType", asCsv(o.properties.propertyType));
  if (o.properties.propertyCategory.length) sp.set("oPropCat", asCsv(o.properties.propertyCategory));
  if (o.properties.bedroomsMin) sp.set("oPropBed", String(o.properties.bedroomsMin));
  if (o.properties.bathroomsMin) sp.set("oPropBath", String(o.properties.bathroomsMin));
  if (o.properties.areaMin) sp.set("oPropAreaMin", String(o.properties.areaMin));
  if (o.properties.areaMax) sp.set("oPropAreaMax", String(o.properties.areaMax));
  if (o.properties.furnishingLevel.length) sp.set("oPropFurn", asCsv(o.properties.furnishingLevel));
  if (o.properties.exchangeType.length) sp.set("oPropEx", asCsv(o.properties.exchangeType));
  if (o.properties.hasPool) sp.set("oPropPool", "1");
  if (o.properties.hasGarage) sp.set("oPropGarage", "1");
  if (o.properties.hasElevator) sp.set("oPropElev", "1");
  if (o.properties.country) sp.set("oPropCountry", o.properties.country);
  if (o.services.categoryL1.length) sp.set("oSvcCat", asCsv(o.services.categoryL1));
  if (o.services.categoryL2.length) sp.set("oSvcCat2", asCsv(o.services.categoryL2));
  if (o.services.modality.length) sp.set("oSvcMod", asCsv(o.services.modality));
  if (o.services.experienceLevel.length) sp.set("oSvcExp", asCsv(o.services.experienceLevel));
  if (o.services.swapFor.length) sp.set("oSvcFor", asCsv(o.services.swapFor));
  if (o.services.valueMatch) sp.set("oSvcVm", o.services.valueMatch);
  if (o.services.geoPreference) sp.set("oSvcGeo", o.services.geoPreference);
  if (o.events.eventTypeL1.length) sp.set("oEvtType", asCsv(o.events.eventTypeL1));
  if (o.events.eventTypeL2.length) sp.set("oEvtType2", asCsv(o.events.eventTypeL2));
  if (o.events.isOnline) sp.set("oEvtOnline", "1");
  if (o.events.startDateFrom) sp.set("oEvtFrom", o.events.startDateFrom);
  if (o.events.startDateTo) sp.set("oEvtTo", o.events.startDateTo);
  if (o.events.country) sp.set("oEvtCountry", o.events.country);
  if (o.events.swapFor.length) sp.set("oEvtFor", asCsv(o.events.swapFor));
  if (o.events.valueMatch) sp.set("oEvtVm", o.events.valueMatch);

  // ── profile ──
  if (p.distance !== 50) sp.set("dist", String(p.distance));
  if (p.userType !== "both") sp.set("userType", p.userType);
  if (p.verifiedOnly) sp.set("verified", "1");
  if (p.minRating > 0) sp.set("rating", String(p.minRating));
  if (p.languages.length) sp.set("langs", asCsv(p.languages));
  if (p.badgeTier.length) sp.set("badge", asCsv(p.badgeTier));

  return sp;
}

function parseCatalog(sp: URLSearchParams, prefix: "w" | "o"): CatalogFilter {
  const p = prefix;
  return {
    selectedCategories: asArray(sp.get(`${p}Cats`)),
    distance: asNumber(sp.get(`${p}Dist`), 500),
    geography: asArray(sp.get(`${p}Geo`)),
    fulfilment: asArray(sp.get(`${p}Ful`)),
    objects: {
      categoryL1: asArray(sp.get(`${p}ObjCat`)),
      condition: asArray(sp.get(`${p}ObjCond`)),
      perceivedValueTier: asArray(sp.get(`${p}ObjPvt`)),
      ageYearsMax: asNumber(sp.get(`${p}ObjAge`), 0),
      originalPackaging: asBoolNull(sp.get(`${p}ObjPkg`)),
      swapOpenTo: asArray(sp.get(`${p}ObjSot`)),
      swapValueMatch: sp.get(`${p}ObjVm`),
      swapFlexibility: sp.get(`${p}ObjFlex`),
      swapChainAllowed: asBoolNull(sp.get(`${p}ObjChain`)),
      swapPartialAllowed: asBoolNull(sp.get(`${p}ObjPart`)),
      crossCategorySwap: asBoolNull(sp.get(`${p}ObjCross`)),
    },
    properties: {
      propertyType: asArray(sp.get(`${p}PropType`)),
      propertyCategory: asArray(sp.get(`${p}PropCat`)),
      bedroomsMin: asNumber(sp.get(`${p}PropBed`), 0),
      bathroomsMin: asNumber(sp.get(`${p}PropBath`), 0),
      areaMin: asNumber(sp.get(`${p}PropAreaMin`), 0),
      areaMax: asNumber(sp.get(`${p}PropAreaMax`), 0),
      furnishingLevel: asArray(sp.get(`${p}PropFurn`)),
      exchangeType: asArray(sp.get(`${p}PropEx`)),
      hasPool: asBoolNull(sp.get(`${p}PropPool`)),
      hasGarage: asBoolNull(sp.get(`${p}PropGarage`)),
      hasElevator: asBoolNull(sp.get(`${p}PropElev`)),
      country: sp.get(`${p}PropCountry`) ?? "",
    },
    services: {
      categoryL1: asArray(sp.get(`${p}SvcCat`)),
      categoryL2: asArray(sp.get(`${p}SvcCat2`)),
      modality: asArray(sp.get(`${p}SvcMod`)),
      experienceLevel: asArray(sp.get(`${p}SvcExp`)),
      swapFor: asArray(sp.get(`${p}SvcFor`)),
      valueMatch: sp.get(`${p}SvcVm`),
      geoPreference: sp.get(`${p}SvcGeo`),
    },
    events: {
      eventTypeL1: asArray(sp.get(`${p}EvtType`)),
      eventTypeL2: asArray(sp.get(`${p}EvtType2`)),
      isOnline: asBoolNull(sp.get(`${p}EvtOnline`)),
      startDateFrom: sp.get(`${p}EvtFrom`) ?? "",
      startDateTo: sp.get(`${p}EvtTo`) ?? "",
      country: sp.get(`${p}EvtCountry`) ?? "",
      swapFor: asArray(sp.get(`${p}EvtFor`)),
      valueMatch: sp.get(`${p}EvtVm`),
    },
  };
}

export function searchParamsToFilters(sp: URLSearchParams): ExploreFilters {
  const profileFilters: ProfileFilter = {
    distance: asNumber(sp.get("dist"), 50),
    userType: asUserType(sp.get("userType")),
    verifiedOnly: sp.get("verified") === "1",
    minRating: asNumber(sp.get("rating"), 0),
    languages: asArray(sp.get("langs")),
    badgeTier: asArray(sp.get("badge")),
  };

  return {
    wantsFilters: parseCatalog(sp, "w"),
    offersFilters: parseCatalog(sp, "o"),
    profileFilters,
  };
}
