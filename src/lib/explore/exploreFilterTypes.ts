export type ItemKind = "object" | "property" | "service" | "event";
export type ItemKindOrAny = ItemKind | "any";

export type ValueTier = "Small" | "Medium" | "Large" | "Special";
export type Flexibility = "Strict" | "Moderate" | "Wide";
export type ExploreTab = "offer" | "want" | "profile";

export type Intent = "explore" | "open" | "clear" | "serious";
export type Context = "permanent" | "vacation" | "temporary" | "urgent";

export interface OfferFilters {
  type: ItemKind | null;
  // Object-specific
  category_l1: string | null;
  category_l2: string | null;
  condition: string | null;
  value_tier: ValueTier | null;
  city: string;
  radius_km: number;
  // Property
  property_type: string | null;
  proximity: string[];
  bedrooms: number | null;
  bathrooms: number | null;
  area_min: number | null;
  area_max: number | null;
  amenities: string[];
  available_from: string;
  available_to: string;
  // Service
  service_modality: string | null;
  service_days: string[];
  certifications: string[];
  // Event
  event_online: boolean;
  capacity_bucket: string | null;
  includes: string[];
}

export interface WantFilters {
  type: ItemKindOrAny | null;
  query: string;
  value_tier: ValueTier | null;
  flexibility: Flexibility | null;
  chain_swap: boolean;
  partial_swap: boolean;
}

export interface ProfileFilters {
  id_verified: boolean;
  email_verified: boolean;
  has_completed_swap: boolean;
  min_rating: number | null;
  response_time: string | null;
  intents: Intent[];
  contexts: Context[];
  languages: string[];
  affinity: string;
  city: string;
  radius_km: number;
}

export interface ExploreFilterState {
  tab: ExploreTab;
  offer: OfferFilters;
  want: WantFilters;
  profile: ProfileFilters;
  sort: "match_score" | "newest" | "value_asc" | "value_desc";
}

export const DEFAULT_OFFER_FILTERS: OfferFilters = {
  type: null,
  category_l1: null,
  category_l2: null,
  condition: null,
  value_tier: null,
  city: "",
  radius_km: 50,
  property_type: null,
  proximity: [],
  bedrooms: null,
  bathrooms: null,
  area_min: null,
  area_max: null,
  amenities: [],
  available_from: "",
  available_to: "",
  service_modality: null,
  service_days: [],
  certifications: [],
  event_online: false,
  capacity_bucket: null,
  includes: [],
};

export const DEFAULT_WANT_FILTERS: WantFilters = {
  type: null,
  query: "",
  value_tier: null,
  flexibility: null,
  chain_swap: false,
  partial_swap: false,
};

export const DEFAULT_PROFILE_FILTERS: ProfileFilters = {
  id_verified: false,
  email_verified: false,
  has_completed_swap: false,
  min_rating: null,
  response_time: null,
  intents: [],
  contexts: [],
  languages: [],
  affinity: "",
  city: "",
  radius_km: 50,
};

export const DEFAULT_FILTER_STATE: ExploreFilterState = {
  tab: "offer",
  offer: DEFAULT_OFFER_FILTERS,
  want: DEFAULT_WANT_FILTERS,
  profile: DEFAULT_PROFILE_FILTERS,
  sort: "match_score",
};
