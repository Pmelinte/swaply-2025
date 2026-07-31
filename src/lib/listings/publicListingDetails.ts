export type JsonRecord = Record<string, unknown>;

type ItemRelation = {
  id?: string | null;
  title?: string | null;
  description?: string | null;
  image_url?: string | null;
  images?: unknown;
  swap_wants_description?: string | null;
  perceived_value_tier?: string | null;
  status?: string | null;
  is_active?: boolean | null;
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}

function asRecord(value: unknown): JsonRecord | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonRecord)
    : null;
}

function relationOne(value: unknown): ItemRelation | null {
  if (Array.isArray(value)) {
    return (asRecord(value[0]) as ItemRelation | null) ?? null;
  }
  return (asRecord(value) as ItemRelation | null) ?? null;
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function asBoolean(value: unknown): boolean | null {
  return typeof value === "boolean" ? value : null;
}

export function listingStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((entry) => {
      if (typeof entry === "string") return entry.trim();
      const record = asRecord(entry);
      if (!record) return "";
      return (
        asString(record.name) ??
        asString(record.title) ??
        asString(record.label) ??
        asString(record.url) ??
        ""
      );
    })
    .filter((entry): entry is string => entry.length > 0);
}

export function normalizeListingImages(...sources: unknown[]): string[] {
  const images: string[] = [];

  const add = (value: unknown) => {
    if (typeof value === "string" && value.trim().length > 0) {
      images.push(value.trim());
      return;
    }

    if (Array.isArray(value)) {
      for (const entry of value) add(entry);
      return;
    }

    const record = asRecord(value);
    if (!record) return;
    add(record.url);
    add(record.secure_url);
    add(record.src);
  };

  for (const source of sources) add(source);
  return [...new Set(images)];
}

function locationLabel(...parts: unknown[]): string {
  return parts.map(asString).filter(Boolean).join(", ");
}

function itemFromRow(row: JsonRecord): ItemRelation {
  return relationOne(row.items) ?? {};
}

function requiredId(value: unknown, field: string): string {
  const id = asString(value);
  if (!id) throw new Error(`Missing ${field}`);
  return id;
}

export const PUBLIC_PROPERTY_DETAIL_SELECT = [
  "id",
  "item_id",
  "owner_id",
  "status",
  "property_type",
  "property_subtype",
  "listing_purpose",
  "country_code",
  "region",
  "city",
  "location_type",
  "year_built",
  "building_condition",
  "bedrooms",
  "bathrooms",
  "sleeps_max",
  "surface_total_sqm",
  "has_pool",
  "has_hot_tub",
  "has_sauna",
  "has_gym",
  "has_tennis_court",
  "has_bbq",
  "has_fireplace",
  "parking_spots",
  "has_ev_charger",
  "internet_type",
  "internet_speed_mbps",
  "wheelchair_accessible",
  "elevator",
  "pets_allowed",
  "exchange_type",
  "min_stay_days",
  "max_stay_days",
  "preferred_seasons",
  "advance_notice_days",
  "check_in_time",
  "check_out_time",
  "flexible_dates",
  "available_from",
  "available_until",
  "smoking_allowed",
  "parties_allowed",
  "children_allowed",
  "additional_rules",
  "unique_features",
  "security_deposit_eur",
  "escrow_required",
  "photos",
  "cover_photo_url",
  "average_rating",
  "review_count",
  "property_verified",
  "items!inner(id,title,description,image_url,images,swap_wants_description,perceived_value_tier,status,is_active)",
].join(",");

export const PUBLIC_SERVICE_DETAIL_SELECT = [
  "id",
  "item_id",
  "owner_id",
  "status",
  "category_l1",
  "category_l2",
  "category_l3",
  "service_name",
  "service_name_local",
  "delivery_mode",
  "service_area_type",
  "service_area_countries",
  "service_area_cities",
  "service_area_radius_km",
  "travel_included",
  "experience_years",
  "skill_level",
  "is_licensed",
  "is_insured",
  "is_certified",
  "certifications",
  "portfolio_url",
  "portfolio_items",
  "available_days",
  "available_from_time",
  "available_until_time",
  "available_date_from",
  "available_date_until",
  "lead_time_days",
  "max_concurrent_jobs",
  "estimated_hours",
  "estimated_days",
  "scope_description",
  "deliverables",
  "milestones",
  "swap_open_to",
  "swap_wants_description",
  "swap_wants_type",
  "swap_wants_value_tier",
  "partial_swap_allowed",
  "partial_topup_eur",
  "escrow_accepted",
  "service_languages",
  "cover_image_url",
  "gallery",
  "average_rating",
  "review_count",
  "items!inner(id,title,description,image_url,images,swap_wants_description,perceived_value_tier,status,is_active)",
].join(",");

export const PUBLIC_EVENT_DETAIL_SELECT = [
  "id",
  "item_id",
  "owner_id",
  "status",
  "event_group",
  "event_category",
  "event_subcategory",
  "start_date",
  "end_date",
  "start_time",
  "end_time",
  "timezone",
  "duration_days",
  "is_recurring",
  "recurrence_pattern",
  "season",
  "location_type",
  "country_code",
  "region",
  "city",
  "venue_name",
  "is_route_based",
  "route_type",
  "route_origin_city",
  "route_origin_country",
  "route_destination_city",
  "route_destination_country",
  "route_total_km",
  "capacity_total",
  "capacity_available",
  "min_participants",
  "max_participants",
  "age_min",
  "age_max",
  "suitable_for",
  "transport_mode",
  "transport_carrier",
  "transport_class",
  "departure_datetime",
  "arrival_datetime",
  "is_transferable",
  "baggage_included",
  "sport_type",
  "sport_competition",
  "sport_stage",
  "sport_season",
  "venue_section",
  "venue_block",
  "venue_row",
  "face_value_eur",
  "has_hospitality",
  "hospitality_details",
  "accommodation_type",
  "accommodation_stars",
  "accommodation_board",
  "accommodation_room_type",
  "check_in_date",
  "check_out_date",
  "nights_count",
  "includes_transport",
  "includes_accommodation",
  "includes_meals",
  "includes_equipment",
  "includes_guide",
  "extras",
  "swap_open_to",
  "swap_wants_description",
  "swap_wants_type",
  "swap_wants_value_tier",
  "partial_swap_allowed",
  "partial_topup_eur",
  "escrow_accepted",
  "exchange_value_description",
  "exchange_points",
  "cover_image_url",
  "gallery",
  "average_rating",
  "review_count",
  "expires_at",
  "items!inner(id,title,description,image_url,images,swap_wants_description,perceived_value_tier,status,is_active)",
].join(",");

export type PublicPropertyDetail = {
  id: string;
  itemId: string;
  title: string;
  description: string;
  images: string[];
  location: string;
  propertyType: string | null;
  propertySubtype: string | null;
  listingPurpose: string | null;
  locationType: string | null;
  yearBuilt: number | null;
  buildingCondition: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  sleepsMax: number | null;
  surfaceTotalSqm: number | null;
  hasPool: boolean | null;
  hasHotTub: boolean | null;
  hasSauna: boolean | null;
  hasGym: boolean | null;
  hasTennisCourt: boolean | null;
  hasBbq: boolean | null;
  hasFireplace: boolean | null;
  parkingSpots: number | null;
  hasEvCharger: boolean | null;
  internetType: string | null;
  internetSpeedMbps: number | null;
  wheelchairAccessible: boolean | null;
  elevator: boolean | null;
  petsAllowed: boolean | null;
  exchangeType: string | null;
  minStayDays: number | null;
  maxStayDays: number | null;
  preferredSeasons: string[];
  advanceNoticeDays: number | null;
  checkInTime: string | null;
  checkOutTime: string | null;
  flexibleDates: boolean | null;
  availableFrom: string | null;
  availableUntil: string | null;
  smokingAllowed: boolean | null;
  partiesAllowed: boolean | null;
  childrenAllowed: boolean | null;
  additionalRules: string | null;
  uniqueFeatures: string | null;
  securityDepositEur: number | null;
  escrowRequired: boolean | null;
  averageRating: number | null;
  reviewCount: number | null;
  propertyVerified: boolean | null;
  swapWantsDescription: string | null;
  perceivedValueTier: string | null;
};

export function mapPublicPropertyDetail(row: JsonRecord): PublicPropertyDetail {
  const item = itemFromRow(row);
  const propertyType = asString(row.property_type);
  const location = locationLabel(row.city, row.region, row.country_code);

  return {
    id: requiredId(row.id, "property id"),
    itemId: requiredId(row.item_id ?? item.id, "property item id"),
    title:
      asString(item.title) ??
      [propertyType, location].filter(Boolean).join(" in ") ??
      "Property listing",
    description: asString(item.description) ?? asString(row.unique_features) ?? "",
    images: normalizeListingImages(
      row.cover_photo_url,
      row.photos,
      item.image_url,
      item.images,
    ),
    location,
    propertyType,
    propertySubtype: asString(row.property_subtype),
    listingPurpose: asString(row.listing_purpose),
    locationType: asString(row.location_type),
    yearBuilt: asNumber(row.year_built),
    buildingCondition: asString(row.building_condition),
    bedrooms: asNumber(row.bedrooms),
    bathrooms: asNumber(row.bathrooms),
    sleepsMax: asNumber(row.sleeps_max),
    surfaceTotalSqm: asNumber(row.surface_total_sqm),
    hasPool: asBoolean(row.has_pool),
    hasHotTub: asBoolean(row.has_hot_tub),
    hasSauna: asBoolean(row.has_sauna),
    hasGym: asBoolean(row.has_gym),
    hasTennisCourt: asBoolean(row.has_tennis_court),
    hasBbq: asBoolean(row.has_bbq),
    hasFireplace: asBoolean(row.has_fireplace),
    parkingSpots: asNumber(row.parking_spots),
    hasEvCharger: asBoolean(row.has_ev_charger),
    internetType: asString(row.internet_type),
    internetSpeedMbps: asNumber(row.internet_speed_mbps),
    wheelchairAccessible: asBoolean(row.wheelchair_accessible),
    elevator: asBoolean(row.elevator),
    petsAllowed: asBoolean(row.pets_allowed),
    exchangeType: asString(row.exchange_type),
    minStayDays: asNumber(row.min_stay_days),
    maxStayDays: asNumber(row.max_stay_days),
    preferredSeasons: listingStringArray(row.preferred_seasons),
    advanceNoticeDays: asNumber(row.advance_notice_days),
    checkInTime: asString(row.check_in_time),
    checkOutTime: asString(row.check_out_time),
    flexibleDates: asBoolean(row.flexible_dates),
    availableFrom: asString(row.available_from),
    availableUntil: asString(row.available_until),
    smokingAllowed: asBoolean(row.smoking_allowed),
    partiesAllowed: asBoolean(row.parties_allowed),
    childrenAllowed: asBoolean(row.children_allowed),
    additionalRules: asString(row.additional_rules),
    uniqueFeatures: asString(row.unique_features),
    securityDepositEur: asNumber(row.security_deposit_eur),
    escrowRequired: asBoolean(row.escrow_required),
    averageRating: asNumber(row.average_rating),
    reviewCount: asNumber(row.review_count),
    propertyVerified: asBoolean(row.property_verified),
    swapWantsDescription:
      asString(item.swap_wants_description) ??
      asString(row.swap_wants_description),
    perceivedValueTier: asString(item.perceived_value_tier),
  };
}

export type PublicServiceDetail = {
  id: string;
  itemId: string;
  title: string;
  description: string;
  images: string[];
  categoryL1: string | null;
  categoryL2: string | null;
  categoryL3: string | null;
  serviceName: string | null;
  serviceNameLocal: string | null;
  deliveryMode: string | null;
  serviceAreaType: string | null;
  serviceAreaCountries: string[];
  serviceAreaCities: string[];
  serviceAreaRadiusKm: number | null;
  travelIncluded: boolean | null;
  experienceYears: number | null;
  skillLevel: string | null;
  isLicensed: boolean | null;
  isInsured: boolean | null;
  isCertified: boolean | null;
  certifications: string[];
  portfolioUrl: string | null;
  availableDays: string[];
  availableFromTime: string | null;
  availableUntilTime: string | null;
  availableDateFrom: string | null;
  availableDateUntil: string | null;
  leadTimeDays: number | null;
  maxConcurrentJobs: number | null;
  estimatedHours: number | null;
  estimatedDays: number | null;
  scopeDescription: string | null;
  deliverables: string[];
  swapOpenTo: string[];
  swapWantsDescription: string | null;
  swapWantsType: string[];
  swapWantsValueTier: string | null;
  partialSwapAllowed: boolean | null;
  partialTopupEur: number | null;
  escrowAccepted: boolean | null;
  serviceLanguages: string[];
  averageRating: number | null;
  reviewCount: number | null;
};

export function mapPublicServiceDetail(row: JsonRecord): PublicServiceDetail {
  const item = itemFromRow(row);
  const serviceName = asString(row.service_name);

  return {
    id: requiredId(row.id, "service id"),
    itemId: requiredId(row.item_id ?? item.id, "service item id"),
    title: asString(item.title) ?? serviceName ?? "Service listing",
    description:
      asString(item.description) ?? asString(row.scope_description) ?? "",
    images: normalizeListingImages(
      row.cover_image_url,
      row.gallery,
      row.portfolio_items,
      item.image_url,
      item.images,
    ),
    categoryL1: asString(row.category_l1),
    categoryL2: asString(row.category_l2),
    categoryL3: asString(row.category_l3),
    serviceName,
    serviceNameLocal: asString(row.service_name_local),
    deliveryMode: asString(row.delivery_mode),
    serviceAreaType: asString(row.service_area_type),
    serviceAreaCountries: listingStringArray(row.service_area_countries),
    serviceAreaCities: listingStringArray(row.service_area_cities),
    serviceAreaRadiusKm: asNumber(row.service_area_radius_km),
    travelIncluded: asBoolean(row.travel_included),
    experienceYears: asNumber(row.experience_years),
    skillLevel: asString(row.skill_level),
    isLicensed: asBoolean(row.is_licensed),
    isInsured: asBoolean(row.is_insured),
    isCertified: asBoolean(row.is_certified),
    certifications: listingStringArray(row.certifications),
    portfolioUrl: asString(row.portfolio_url),
    availableDays: listingStringArray(row.available_days),
    availableFromTime: asString(row.available_from_time),
    availableUntilTime: asString(row.available_until_time),
    availableDateFrom: asString(row.available_date_from),
    availableDateUntil: asString(row.available_date_until),
    leadTimeDays: asNumber(row.lead_time_days),
    maxConcurrentJobs: asNumber(row.max_concurrent_jobs),
    estimatedHours: asNumber(row.estimated_hours),
    estimatedDays: asNumber(row.estimated_days),
    scopeDescription: asString(row.scope_description),
    deliverables: listingStringArray(row.deliverables),
    swapOpenTo: listingStringArray(row.swap_open_to),
    swapWantsDescription:
      asString(row.swap_wants_description) ??
      asString(item.swap_wants_description),
    swapWantsType: listingStringArray(row.swap_wants_type),
    swapWantsValueTier:
      asString(row.swap_wants_value_tier) ??
      asString(item.perceived_value_tier),
    partialSwapAllowed: asBoolean(row.partial_swap_allowed),
    partialTopupEur: asNumber(row.partial_topup_eur),
    escrowAccepted: asBoolean(row.escrow_accepted),
    serviceLanguages: listingStringArray(row.service_languages),
    averageRating: asNumber(row.average_rating),
    reviewCount: asNumber(row.review_count),
  };
}

export type PublicEventDetail = {
  id: string;
  itemId: string;
  title: string;
  description: string;
  images: string[];
  eventGroup: string | null;
  eventCategory: string | null;
  eventSubcategory: string | null;
  startDate: string | null;
  endDate: string | null;
  startTime: string | null;
  endTime: string | null;
  timezone: string | null;
  durationDays: number | null;
  isRecurring: boolean | null;
  recurrencePattern: string | null;
  season: string | null;
  locationType: string | null;
  location: string;
  route: string;
  routeTotalKm: number | null;
  capacityTotal: number | null;
  capacityAvailable: number | null;
  minParticipants: number | null;
  maxParticipants: number | null;
  ageMin: number | null;
  ageMax: number | null;
  suitableFor: string[];
  transportMode: string | null;
  transportCarrier: string | null;
  transportClass: string | null;
  departureDatetime: string | null;
  arrivalDatetime: string | null;
  isTransferable: boolean | null;
  sportType: string | null;
  sportCompetition: string | null;
  sportStage: string | null;
  sportSeason: string | null;
  venueSection: string | null;
  venueBlock: string | null;
  venueRow: string | null;
  faceValueEur: number | null;
  hasHospitality: boolean | null;
  hospitalityDetails: string | null;
  accommodationType: string | null;
  accommodationStars: number | null;
  accommodationBoard: string | null;
  accommodationRoomType: string | null;
  checkInDate: string | null;
  checkOutDate: string | null;
  nightsCount: number | null;
  includesTransport: boolean | null;
  includesAccommodation: boolean | null;
  includesMeals: boolean | null;
  includesEquipment: boolean | null;
  includesGuide: boolean | null;
  extras: string[];
  swapOpenTo: string[];
  swapWantsDescription: string | null;
  swapWantsType: string[];
  swapWantsValueTier: string | null;
  partialSwapAllowed: boolean | null;
  partialTopupEur: number | null;
  escrowAccepted: boolean | null;
  exchangeValueDescription: string | null;
  exchangePoints: number | null;
  averageRating: number | null;
  reviewCount: number | null;
  expiresAt: string | null;
};

export function mapPublicEventDetail(row: JsonRecord): PublicEventDetail {
  const item = itemFromRow(row);
  const eventGroup = asString(row.event_group);
  const eventCategory = asString(row.event_category);
  const locationType = asString(row.location_type);
  const location =
    locationType === "online"
      ? "Online"
      : locationLabel(row.venue_name, row.city, row.region, row.country_code);
  const route = [
    locationLabel(row.route_origin_city, row.route_origin_country),
    locationLabel(row.route_destination_city, row.route_destination_country),
  ]
    .filter(Boolean)
    .join(" → ");

  return {
    id: requiredId(row.id, "event id"),
    itemId: requiredId(row.item_id ?? item.id, "event item id"),
    title:
      asString(item.title) ??
      eventCategory ??
      eventGroup ??
      "Event listing",
    description: asString(item.description) ?? "",
    images: normalizeListingImages(
      row.cover_image_url,
      row.gallery,
      item.image_url,
      item.images,
    ),
    eventGroup,
    eventCategory,
    eventSubcategory: asString(row.event_subcategory),
    startDate: asString(row.start_date),
    endDate: asString(row.end_date),
    startTime: asString(row.start_time),
    endTime: asString(row.end_time),
    timezone: asString(row.timezone),
    durationDays: asNumber(row.duration_days),
    isRecurring: asBoolean(row.is_recurring),
    recurrencePattern: asString(row.recurrence_pattern),
    season: asString(row.season),
    locationType,
    location,
    route,
    routeTotalKm: asNumber(row.route_total_km),
    capacityTotal: asNumber(row.capacity_total),
    capacityAvailable: asNumber(row.capacity_available),
    minParticipants: asNumber(row.min_participants),
    maxParticipants: asNumber(row.max_participants),
    ageMin: asNumber(row.age_min),
    ageMax: asNumber(row.age_max),
    suitableFor: listingStringArray(row.suitable_for),
    transportMode: asString(row.transport_mode),
    transportCarrier: asString(row.transport_carrier),
    transportClass: asString(row.transport_class),
    departureDatetime: asString(row.departure_datetime),
    arrivalDatetime: asString(row.arrival_datetime),
    isTransferable: asBoolean(row.is_transferable),
    sportType: asString(row.sport_type),
    sportCompetition: asString(row.sport_competition),
    sportStage: asString(row.sport_stage),
    sportSeason: asString(row.sport_season),
    venueSection: asString(row.venue_section),
    venueBlock: asString(row.venue_block),
    venueRow: asString(row.venue_row),
    faceValueEur: asNumber(row.face_value_eur),
    hasHospitality: asBoolean(row.has_hospitality),
    hospitalityDetails: asString(row.hospitality_details),
    accommodationType: asString(row.accommodation_type),
    accommodationStars: asNumber(row.accommodation_stars),
    accommodationBoard: asString(row.accommodation_board),
    accommodationRoomType: asString(row.accommodation_room_type),
    checkInDate: asString(row.check_in_date),
    checkOutDate: asString(row.check_out_date),
    nightsCount: asNumber(row.nights_count),
    includesTransport: asBoolean(row.includes_transport),
    includesAccommodation: asBoolean(row.includes_accommodation),
    includesMeals: asBoolean(row.includes_meals),
    includesEquipment: asBoolean(row.includes_equipment),
    includesGuide: asBoolean(row.includes_guide),
    extras: listingStringArray(row.extras),
    swapOpenTo: listingStringArray(row.swap_open_to),
    swapWantsDescription:
      asString(row.swap_wants_description) ??
      asString(item.swap_wants_description),
    swapWantsType: listingStringArray(row.swap_wants_type),
    swapWantsValueTier:
      asString(row.swap_wants_value_tier) ??
      asString(item.perceived_value_tier),
    partialSwapAllowed: asBoolean(row.partial_swap_allowed),
    partialTopupEur: asNumber(row.partial_topup_eur),
    escrowAccepted: asBoolean(row.escrow_accepted),
    exchangeValueDescription: asString(row.exchange_value_description),
    exchangePoints: asNumber(row.exchange_points),
    averageRating: asNumber(row.average_rating),
    reviewCount: asNumber(row.review_count),
    expiresAt: asString(row.expires_at),
  };
}
