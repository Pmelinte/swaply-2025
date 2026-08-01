import type { DomainListingType } from "@/lib/listings/domainListingPayload";
import {
  INITIAL_EVENT_FORM,
  type EventFormData,
} from "@/lib/wizard/eventWizardStore";
import {
  INITIAL_FORM,
  type PropertyFormData,
} from "@/lib/wizard/propertyWizardStore";
import {
  INITIAL_SERVICE_FORM,
  type ServiceFormData,
} from "@/lib/wizard/serviceWizardStore";

type JsonRecord = Record<string, unknown>;

export type DomainOwnerEditorForm =
  | PropertyFormData
  | ServiceFormData
  | EventFormData;

function asRecord(value: unknown): JsonRecord {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonRecord)
    : {};
}

function relationOne(value: unknown): JsonRecord {
  if (Array.isArray(value)) return asRecord(value[0]);
  return asRecord(value);
}

function text(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : fallback;
}

function numberValue(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function numberString(value: unknown): string {
  const parsed = numberValue(value, Number.NaN);
  return Number.isFinite(parsed) ? String(parsed) : "";
}

function booleanValue(value: unknown, fallback = false): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function strings(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((entry): entry is string => typeof entry === "string")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function dateOnly(value: unknown): string {
  const input = text(value);
  return input ? input.slice(0, 10) : "";
}

function timeOnly(value: unknown): string {
  const input = text(value);
  return input ? input.slice(0, 5) : "";
}

function titleCase(value: unknown): string {
  return text(value)
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function cleanEditorPayload(value: unknown): JsonRecord {
  const payload = asRecord(value);
  const {
    schema_version: _schemaVersion,
    source: _source,
    wifi_password: _wifi,
    ...form
  } = payload;
  return form;
}

function hasKeys(value: JsonRecord, keys: string[]): boolean {
  return keys.every((key) => key in value);
}

function itemRow(row: JsonRecord): JsonRecord {
  return relationOne(row.items);
}

function propertyTypeLabel(value: unknown): string {
  const normalized = text(value).toLowerCase();
  const map: Record<string, string> = {
    house: "House",
    apartment: "Apartment",
    villa: "Villa",
    cabin: "Cabin",
    farmhouse: "Farm",
    studio: "Studio",
    other: "Other",
  };
  const mapped = map[normalized] ?? titleCase(value);
  return mapped || "Other";
}

function furnishingLabel(value: unknown): string {
  const normalized = text(value).toLowerCase();
  if (normalized === "unfurnished") return "Unfurnished";
  if (normalized === "partially") return "Partially Furnished";
  if (normalized === "luxury") return "Luxury Furnished";
  return "Fully Furnished";
}

function propertyExchangeLabel(value: unknown): string {
  const normalized = text(value).toLowerCase();
  if (normalized === "non_simultaneous") return "Non-Simultaneous";
  if (normalized === "points") return "Points-Based";
  if (normalized === "work_exchange") return "Property ↔ Service";
  if (normalized === "private_room") return "Flexible";
  return "Simultaneous";
}

function propertyLocationLabels(value: unknown): string[] {
  const normalized = text(value).toLowerCase();
  return normalized ? [titleCase(normalized)] : [];
}

function propertyEditor(
  row: JsonRecord,
  privateRow: JsonRecord,
): PropertyFormData {
  const saved = cleanEditorPayload(privateRow.editor_payload);
  if (hasKeys(saved, ["property_type", "country", "city", "exchange_type"])) {
    return {
      ...INITIAL_FORM,
      ...(saved as Partial<PropertyFormData>),
      confirm_vacation_only: true,
      confirm_accurate_info: true,
      confirm_terms: true,
      wifi_password: "",
    };
  }

  const item = itemRow(row);
  const exact = asRecord(privateRow.exact_location);
  const accessibility = [
    booleanValue(row.wheelchair_accessible) && "Wheelchair Accessible",
    booleanValue(row.elevator) && "Elevator",
    booleanValue(row.wide_doorways) && "Wide Doorways",
    booleanValue(row.accessible_bathroom) && "Adapted Shower",
    booleanValue(row.step_free_entrance) && "Ground Floor",
  ].filter((entry): entry is string => Boolean(entry));

  return {
    ...INITIAL_FORM,
    property_type: propertyTypeLabel(row.property_type),
    property_subtype: text(row.property_subtype),
    property_category: text(item.category_l1, "Residential"),
    year_built: numberString(row.year_built),
    last_renovated: numberString(row.year_renovated),
    renovation_details: text(row.unique_features),
    country: text(row.country_code, text(item.location_country)),
    region: text(row.region),
    city: text(row.city, text(item.location_city)),
    address_line1: text(exact.address),
    lat: numberString(exact.lat ?? row.lat),
    lon: numberString(exact.lon ?? row.lon),
    location_type: propertyLocationLabels(row.location_type),
    proximity_sea_km: numberString(row.proximity_sea_km),
    proximity_mountain_km: numberString(row.proximity_mountain_km),
    proximity_forest_km: numberString(row.proximity_forest_km),
    distance_to_center_km: numberString(row.proximity_city_center_km),
    nearest_airport_code: text(row.nearest_airport_iata),
    total_buildings: 1,
    building_condition: titleCase(row.building_condition),
    construction_material: text(row.construction_material)
      ? [titleCase(row.construction_material)]
      : [],
    floor_count: numberValue(row.floors_total, 1),
    property_floor: numberValue(row.floor_unit),
    has_elevator: booleanValue(row.elevator),
    bedrooms: numberValue(row.bedrooms, 1),
    bathrooms: numberValue(row.bathrooms, 1),
    toilets_extra: numberValue(row.toilets),
    living_rooms: numberValue(row.living_rooms, 1),
    kitchen_count: numberValue(row.kitchens, 1),
    office_rooms: numberValue(row.offices),
    storage_rooms: numberValue(row.storage_rooms),
    total_area_sqm: numberString(row.surface_total_sqm),
    living_area_sqm: numberString(row.surface_living_sqm),
    garden_area_sqm: numberString(row.surface_garden_sqm),
    terrace_area_sqm: numberString(row.surface_terrace_sqm),
    pool_area_sqm: "",
    has_swimming_pool: booleanValue(row.has_pool),
    pool_type: titleCase(row.pool_type),
    has_hot_tub: booleanValue(row.has_hot_tub),
    has_sauna: booleanValue(row.has_sauna),
    has_gym: booleanValue(row.has_gym),
    has_tennis_court: booleanValue(row.has_tennis_court),
    has_playground: false,
    has_bbq_area: booleanValue(row.has_bbq),
    outdoor_fireplace: booleanValue(row.has_fireplace),
    outdoor_kitchen: false,
    has_garden: numberValue(row.surface_garden_sqm) > 0,
    parking_spaces: numberValue(row.parking_spots),
    garage_type:
      text(row.parking_type).toLowerCase() === "garage" ? "Enclosed" : "None",
    ev_charging: booleanValue(row.has_ev_charger),
    parking_distance_m: "",
    kitchen_appliances: strings(row.kitchen_appliances),
    bed_types: strings(row.bed_types),
    mattress_quality: "",
    linen_provided: booleanValue(row.linens_provided),
    towels_provided: booleanValue(row.towels_provided),
    extra_pillows: false,
    furnishing_level: furnishingLabel(row.furnished_level),
    heating_type: text(row.heating_type) ? [titleCase(row.heating_type)] : [],
    cooling_type: text(row.cooling_type) ? [titleCase(row.cooling_type)] : [],
    water_source: titleCase(row.water_source),
    hot_water_system: titleCase(row.hot_water_type),
    electricity_source: text(row.electricity_source)
      ? [titleCase(row.electricity_source)]
      : [],
    solar_panels: booleanValue(row.has_solar_panels),
    solar_capacity_kw: numberString(row.solar_kwp),
    internet_type: titleCase(row.internet_type),
    internet_speed_mbps: numberString(row.internet_speed_mbps),
    smart_home_features: booleanValue(row.has_smart_home),
    smart_home_details: strings(row.smart_home_features).join(", "),
    eco_certifications: strings(row.eco_certifications),
    backup_generator: false,
    septic_tank: false,
    exchange_type: propertyExchangeLabel(row.exchange_type),
    minimum_stay_days: numberString(row.min_stay_days) || "1",
    maximum_stay_days: numberString(row.max_stay_days) || "30",
    preferred_seasons: strings(row.preferred_seasons).map((value) =>
      titleCase(value),
    ),
    number_of_guests_allowed: numberValue(
      row.sleeps_max,
      numberValue(row.max_guests, 2),
    ),
    flexible_dates: booleanValue(row.flexible_dates, true),
    available_start_date: dateOnly(row.available_from),
    available_end_date: dateOnly(row.available_until),
    advance_booking_days: numberString(row.advance_notice_days),
    desired_exchange_description: text(
      item.swap_wants_description,
      text(item.description, "Open to a comparable property exchange"),
    ),
    escrow_accepted: booleanValue(item.escrow_accepted),
    escrow_required: booleanValue(
      row.escrow_required,
      booleanValue(item.escrow_required),
    ),
    security_deposit_eur: numberString(row.security_deposit_eur),
    swap_geo_preference: titleCase(item.swap_geo_preference) || "Regional",
    swap_partial_allowed: booleanValue(item.swap_partial_allowed),
    swap_partial_topup_eur: numberString(item.swap_partial_topup_eur),
    chain_swap_allowed: booleanValue(item.chain_swap_allowed),
    check_in_time: timeOnly(row.check_in_time) || "15:00",
    check_out_time: timeOnly(row.check_out_time) || "11:00",
    smoking_allowed: booleanValue(row.smoking_allowed)
      ? "Anywhere"
      : "Not Allowed",
    parties_allowed: booleanValue(row.parties_allowed),
    quiet_hours:
      timeOnly(row.quiet_hours_start) && timeOnly(row.quiet_hours_end)
        ? `${timeOnly(row.quiet_hours_start)}–${timeOnly(row.quiet_hours_end)}`
        : "",
    guests_limit: numberValue(row.max_guests, 4),
    children_allowed: booleanValue(row.children_allowed, true),
    min_child_age: numberString(row.min_guest_age),
    infants_allowed: booleanValue(row.baby_cot_available, true),
    pets_allowed: booleanValue(row.pets_allowed),
    pets_types: strings(row.pets_allowed_types),
    special_house_rules: text(row.additional_rules),
    accessibility_features: accessibility,
    confirm_vacation_only: true,
    confirm_accurate_info: true,
    confirm_terms: true,
    cross_category_swap: booleanValue(item.cross_category_swap),
    wifi_password: "",
  };
}

function serviceModality(value: unknown): string {
  const normalized = text(value).toLowerCase();
  if (normalized === "remote") return "Remote";
  if (normalized === "onsite") return "On-site";
  return "Both";
}

function serviceLevel(value: unknown): string {
  const normalized = text(value).toLowerCase();
  if (normalized === "beginner") return "Beginner";
  if (normalized === "intermediate") return "Intermediate";
  if (normalized === "master") return "10+ years";
  return "Expert";
}

function serviceDay(value: string): string {
  const map: Record<string, string> = {
    monday: "Mon",
    tuesday: "Tue",
    wednesday: "Wed",
    thursday: "Thu",
    friday: "Fri",
    saturday: "Sat",
    sunday: "Sun",
  };
  return map[value.toLowerCase()] ?? titleCase(value).slice(0, 3);
}

function serviceTimeOfDay(from: unknown, until: unknown): string[] {
  const start = timeOnly(from);
  const end = timeOnly(until);
  if (!start && !end) return ["Flexible"];
  const hour = Number((start || end).slice(0, 2));
  if (hour < 12) return ["Morning"];
  if (hour < 15) return ["Midday"];
  if (hour < 18) return ["Afternoon"];
  return ["Evening"];
}

function serviceDuration(row: JsonRecord): string[] {
  const hours = numberValue(row.estimated_hours);
  const days = numberValue(row.estimated_days);
  if (days > 1) return ["Multi-day"];
  if (days === 1 || hours >= 6) return ["Full day"];
  if (hours >= 3) return ["Half day"];
  return ["1h"];
}

function serviceEditor(
  row: JsonRecord,
  privateRow: JsonRecord,
): ServiceFormData {
  const saved = cleanEditorPayload(privateRow.editor_payload);
  if (
    hasKeys(saved, [
      "service_category_l1",
      "service_title",
      "service_modality",
    ])
  ) {
    return {
      ...INITIAL_SERVICE_FORM,
      ...(saved as Partial<ServiceFormData>),
      confirm_authorized: true,
      confirm_accurate: true,
      confirm_terms: true,
    };
  }

  const item = itemRow(row);
  const transfer = asRecord(privateRow.transfer_data);
  const portfolioItems = strings(row.portfolio_items);
  const certificationClaims = strings(transfer.certification_claims);

  return {
    ...INITIAL_SERVICE_FORM,
    service_category_l1: text(row.category_l1, text(item.category_l1)),
    service_category_l2: text(row.category_l2, text(item.category_l2)),
    service_category_l3: text(row.category_l3, text(item.category_l3)),
    service_title: text(row.service_name, text(item.title)),
    service_short_description: text(item.description).slice(0, 160),
    service_modality: serviceModality(row.delivery_mode),
    service_full_description: text(
      row.scope_description,
      text(item.description, "Service details are available from the owner."),
    ),
    experience_years: numberValue(row.experience_years),
    experience_level: serviceLevel(row.skill_level),
    certifications: certificationClaims,
    languages_service: strings(row.service_languages),
    portfolio_urls: text(row.portfolio_url) ? [text(row.portfolio_url)] : [],
    portfolio_images: portfolioItems,
    provider_type: text(transfer.provider_type, "Individual"),
    availability_days: strings(row.available_days).map(serviceDay),
    availability_time_of_day: serviceTimeOfDay(
      row.available_from_time,
      row.available_until_time,
    ),
    service_duration: serviceDuration(row),
    available_from_date: dateOnly(row.available_date_from),
    available_until_date: dateOnly(row.available_date_until),
    advance_notice_days: numberValue(row.lead_time_days, 1),
    urgent_available: numberValue(row.lead_time_days, 1) <= 1,
    recurring_possible: strings(row.milestones).length > 0,
    recurring_frequency: [],
    swap_for_type: strings(row.swap_open_to).length
      ? strings(row.swap_open_to)
      : strings(item.swap_open_to),
    swap_wants_description: text(
      row.swap_wants_description,
      text(item.swap_wants_description, "Open to a fair exchange"),
    ),
    perceived_value_tier: text(
      row.swap_wants_value_tier,
      text(item.perceived_value_tier, "medium"),
    ),
    escrow_accepted: booleanValue(
      row.escrow_accepted,
      booleanValue(item.escrow_accepted),
    ),
    swap_geo_preference: titleCase(item.swap_geo_preference) || "Regional",
    swap_geo_radius_km: numberValue(row.service_area_radius_km, 50),
    swap_partial_allowed: booleanValue(row.partial_swap_allowed),
    swap_partial_topup_eur: numberString(row.partial_topup_eur),
    confirm_authorized: true,
    confirm_accurate: true,
    confirm_terms: true,
    cross_category_swap: booleanValue(item.cross_category_swap),
    chain_swap_allowed: booleanValue(item.chain_swap_allowed),
  };
}

function eventLocationType(value: unknown, online: boolean): string {
  if (online) return "Online";
  return titleCase(value) || "Indoor";
}

function eventAgeRestriction(row: JsonRecord): string {
  const min = numberValue(row.age_min, Number.NaN);
  if (!Number.isFinite(min)) return "No restriction";
  if (min >= 18) return "18+";
  if (min >= 16) return "16+";
  return "Custom";
}

function eventEditor(row: JsonRecord, privateRow: JsonRecord): EventFormData {
  const saved = cleanEditorPayload(privateRow.editor_payload);
  if (hasKeys(saved, ["event_title", "event_type_l1", "start_date"])) {
    return {
      ...INITIAL_EVENT_FORM,
      ...(saved as Partial<EventFormData>),
      confirm_authorized: true,
      confirm_accurate: true,
      confirm_terms: true,
    };
  }

  const item = itemRow(row);
  const exact = asRecord(privateRow.exact_location);
  const transfer = asRecord(privateRow.transfer_data);
  const online = text(row.location_type).toLowerCase() === "online";
  const suitable = strings(row.suitable_for);

  return {
    ...INITIAL_EVENT_FORM,
    event_title: text(item.title, text(row.event_category, "Event")),
    event_type_l1: text(row.event_group),
    event_type_l2: text(row.event_category),
    is_online: online,
    start_date: dateOnly(row.start_date),
    start_time: timeOnly(row.start_time),
    end_date: dateOnly(row.end_date),
    end_time: timeOnly(row.end_time),
    timezone: text(row.timezone, "UTC"),
    season: text(row.season) ? [titleCase(row.season)] : [],
    recurrence: booleanValue(row.is_recurring)
      ? titleCase(row.recurrence_pattern) || "Weekly"
      : "One-time",
    event_description: text(
      item.description,
      "Event access and exchange details are provided by the owner.",
    ),
    language_of_event: [],
    country: text(row.country_code, text(item.location_country)),
    region: text(row.region),
    city: text(row.city, text(item.location_city)),
    venue_name: text(row.venue_name),
    lat: numberString(exact.lat ?? row.lat),
    lon: numberString(exact.lon ?? row.lon),
    location_type: eventLocationType(row.location_type, online),
    route_type: text(row.route_type),
    route_start_city: text(row.route_origin_city),
    route_end_city: text(row.route_destination_city),
    route_waypoints: strings(row.route_waypoints).join(", "),
    route_total_km: numberString(row.route_total_km),
    route_gpx_url: text(row.route_gpx_url),
    transport_mode: titleCase(row.transport_mode),
    booking_reference: text(transfer.booking_reference),
    departure_city: text(row.route_origin_city),
    arrival_city: text(row.route_destination_city),
    seat_class: text(row.transport_class),
    seats_available: numberValue(row.capacity_available, 1),
    face_value_eur: numberString(row.face_value_eur),
    is_transferable: booleanValue(row.is_transferable, true),
    baggage_included: Boolean(
      transfer.baggage_included ?? row.baggage_included,
    ),
    rail_pass_type: text(row.miles_points_type),
    rail_pass_days_remaining: numberValue(row.pass_days_remaining),
    sport_type: text(row.sport_type),
    competition_name: text(row.sport_competition),
    venue_sector: text(row.venue_section),
    venue_row: text(transfer.venue_row),
    seat_number: text(transfer.seat_number),
    hospitality_included: booleanValue(row.has_hospitality),
    capacity_total: numberValue(row.capacity_total, 1),
    capacity_available: numberValue(row.capacity_available, 1),
    group_size_min: numberValue(row.min_participants, 1),
    group_size_max: numberValue(row.max_participants, 10),
    age_restriction: eventAgeRestriction(row),
    age_min: numberString(row.age_min),
    kid_friendly:
      suitable.includes("children") || suitable.includes("families"),
    pet_friendly: suitable.includes("pets"),
    includes_accommodation: booleanValue(row.includes_accommodation),
    includes_transport: booleanValue(row.includes_transport),
    includes_meals: booleanValue(row.includes_meals),
    includes_equipment: booleanValue(row.includes_equipment),
    equipment_list: strings(row.extras).join(", "),
    dress_code: "",
    id_required: booleanValue(transfer.id_required),
    booking_deadline_date: dateOnly(row.transfer_deadline_at),
    advance_booking_months: numberValue(row.advance_booking_months),
    swap_for_type: strings(row.swap_open_to).length
      ? strings(row.swap_open_to)
      : strings(item.swap_open_to),
    swap_wants_description: text(
      row.swap_wants_description,
      text(item.swap_wants_description, "Open to a fair exchange"),
    ),
    perceived_value_tier: text(
      row.swap_wants_value_tier,
      text(item.perceived_value_tier, "medium"),
    ),
    escrow_accepted: booleanValue(
      row.escrow_accepted,
      booleanValue(item.escrow_accepted),
    ),
    swap_geo_preference: titleCase(item.swap_geo_preference) || "Regional",
    swap_partial_allowed: booleanValue(row.partial_swap_allowed),
    swap_partial_topup_eur: numberString(row.partial_topup_eur),
    exchange_points: numberString(row.exchange_points),
    confirm_authorized: true,
    confirm_accurate: true,
    confirm_terms: true,
    cross_category_swap: booleanValue(item.cross_category_swap),
    chain_swap_allowed: booleanValue(item.chain_swap_allowed),
  };
}

export function hydrateDomainOwnerEditorForm(options: {
  domain: DomainListingType;
  listingRow: unknown;
  privateRow?: unknown;
}): DomainOwnerEditorForm {
  const row = asRecord(options.listingRow);
  const privateRow = asRecord(options.privateRow);

  if (options.domain === "property") return propertyEditor(row, privateRow);
  if (options.domain === "service") return serviceEditor(row, privateRow);
  return eventEditor(row, privateRow);
}
