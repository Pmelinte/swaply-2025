import { Country } from "country-state-city";
import { z } from "zod";

import type { EventFormData } from "@/lib/wizard/eventWizardStore";
import type { PropertyFormData } from "@/lib/wizard/propertyWizardStore";
import type { ServiceFormData } from "@/lib/wizard/serviceWizardStore";

export const DOMAIN_LISTING_CREATE_SCHEMA_VERSION = "1.0" as const;
export type DomainListingType = "property" | "service" | "event";

export type DomainListingCreatePayload = {
  schema_version: typeof DOMAIN_LISTING_CREATE_SCHEMA_VERSION;
  domain: DomainListingType;
  item: Record<string, unknown>;
  listing: Record<string, unknown>;
  private: {
    editor_payload: Record<string, unknown>;
    exact_location: Record<string, unknown>;
    transfer_data: Record<string, unknown>;
  };
};

export class DomainListingPayloadError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "DomainListingPayloadError";
    this.code = code;
  }
}

type WithTimeZone = { timezone?: string };

const propertyCreateSchema = z
  .object({
    property_type: z.string().trim().min(1, "Property type is required."),
    property_category: z.string().trim().min(1, "Property category is required."),
    country: z.string().trim().min(1, "Country is required."),
    city: z.string().trim().min(1, "City is required."),
    total_area_sqm: z.string().trim().min(1, "Total area is required."),
    furnishing_level: z.string().trim().min(1, "Furnishing level is required."),
    exchange_type: z.string().trim().min(1, "Exchange type is required."),
    desired_exchange_description: z
      .string()
      .trim()
      .min(1, "Exchange preference is required."),
    confirm_vacation_only: z.literal(true),
    confirm_accurate_info: z.literal(true),
    confirm_terms: z.literal(true),
    timezone: z.string().optional(),
  })
  .passthrough();

const serviceCreateSchema = z
  .object({
    service_category_l1: z.string().trim().min(1, "Service category is required."),
    service_title: z.string().trim().min(1, "Service title is required."),
    service_modality: z.string().trim().min(1, "Service modality is required."),
    service_full_description: z
      .string()
      .trim()
      .min(50, "Service description must contain at least 50 characters."),
    experience_level: z.string().trim().min(1, "Experience level is required."),
    provider_type: z.string().trim().min(1, "Provider type is required."),
    availability_days: z.array(z.string()).min(1, "Availability is required."),
    swap_for_type: z.array(z.string()).min(1, "At least one swap domain is required."),
    swap_wants_description: z.string().trim().min(1, "Exchange preference is required."),
    perceived_value_tier: z.string().trim().min(1, "Value tier is required."),
    confirm_authorized: z.literal(true),
    confirm_accurate: z.literal(true),
    confirm_terms: z.literal(true),
    timezone: z.string().optional(),
  })
  .passthrough();

const eventCreateSchema = z
  .object({
    event_title: z.string().trim().min(3, "Event title is required."),
    event_type_l1: z.string().trim().min(1, "Event type is required."),
    start_date: z.string().trim().min(1, "Event start date is required."),
    event_description: z
      .string()
      .trim()
      .min(20, "Event description must contain at least 20 characters."),
    capacity_total: z.number().int().min(1, "Event capacity must be positive."),
    capacity_available: z.number().int().min(0),
    swap_for_type: z.array(z.string()).min(1, "At least one swap domain is required."),
    swap_wants_description: z.string().trim().min(1, "Exchange preference is required."),
    perceived_value_tier: z.string().trim().min(1, "Value tier is required."),
    confirm_authorized: z.literal(true),
    confirm_accurate: z.literal(true),
    confirm_terms: z.literal(true),
    timezone: z.string().optional(),
  })
  .passthrough();

function parseSchema<T>(schema: z.ZodType<T>, input: unknown): T {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    throw new DomainListingPayloadError(
      "INVALID_LISTING_FORM",
      parsed.error.issues[0]?.message ?? "Listing form is incomplete.",
    );
  }
  return parsed.data;
}

function optionalString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function optionalNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function optionalInteger(value: unknown): number | null {
  const parsed = optionalNumber(value);
  return parsed === null ? null : Math.trunc(parsed);
}

function compactRecord(input: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(input).filter(([, value]) => value !== null && value !== undefined && value !== ""),
  );
}

function uniqueStrings(values: unknown[]): string[] {
  return [...new Set(values.filter((value): value is string => typeof value === "string" && value.length > 0))];
}

function lower(value: unknown): string {
  return optionalString(value)?.toLowerCase() ?? "";
}

function normalizeCountryCode(value: unknown): string | null {
  const input = optionalString(value);
  if (!input) return null;
  if (/^[A-Za-z]{2}$/.test(input)) return input.toUpperCase();

  const normalized = input.toLocaleLowerCase("en");
  const country = Country.getAllCountries().find(
    (candidate) =>
      candidate.name.toLocaleLowerCase("en") === normalized ||
      candidate.isoCode.toLocaleLowerCase("en") === normalized,
  );
  if (!country) {
    throw new DomainListingPayloadError(
      "INVALID_COUNTRY",
      "Country must be a recognized country name or ISO code.",
    );
  }
  return country.isoCode.toUpperCase();
}

function normalizeTimeZone(value: unknown): string {
  const timeZone = optionalString(value) ?? "UTC";
  try {
    new Intl.DateTimeFormat("en", { timeZone }).format(new Date());
    return timeZone;
  } catch {
    throw new DomainListingPayloadError("INVALID_TIMEZONE", "Timezone is not supported.");
  }
}

function normalizeValueTier(value: unknown): string | null {
  const tier = lower(value).replace(/[^a-z]+/g, "_");
  if (["small", "medium", "large", "special"].includes(tier)) return tier;
  return null;
}

function normalizeGeoPreference(value: unknown): string {
  const preference = lower(value);
  if (preference.includes("local")) return "local";
  if (preference.includes("international") || preference.includes("remote")) return "international";
  if (preference.includes("vacation")) return "vacation";
  return "regional";
}

function normalizeSwapDomains(values: unknown): DomainListingType[] | (DomainListingType | "object")[] {
  if (!Array.isArray(values)) return [];
  const output: (DomainListingType | "object")[] = [];
  for (const value of values) {
    const domain = lower(value);
    if (domain === "anything") {
      output.push("object", "property", "service", "event");
    } else if (["object", "property", "service", "event"].includes(domain)) {
      output.push(domain as DomainListingType | "object");
    }
  }
  return uniqueStrings(output) as (DomainListingType | "object")[];
}

function approximateCoordinate(value: unknown, min: number, max: number): number | null {
  const number = optionalNumber(value);
  if (number === null) return null;
  if (number < min || number > max) {
    throw new DomainListingPayloadError("INVALID_COORDINATES", "Coordinates are outside the valid range.");
  }
  return Math.round(number * 100) / 100;
}

function exactCoordinate(value: unknown, min: number, max: number): number | null {
  const number = optionalNumber(value);
  if (number === null) return null;
  if (number < min || number > max) {
    throw new DomainListingPayloadError("INVALID_COORDINATES", "Coordinates are outside the valid range.");
  }
  return number;
}

function validateDateRange(startValue: unknown, endValue: unknown, label: string): void {
  const start = optionalString(startValue);
  const end = optionalString(endValue);
  if (!start || !end) return;
  if (new Date(`${start}T00:00:00.000Z`).getTime() > new Date(`${end}T00:00:00.000Z`).getTime()) {
    throw new DomainListingPayloadError("INVALID_DATE_RANGE", `${label} range is invalid.`);
  }
}

function safeHttpUrls(values: unknown): string[] {
  if (!Array.isArray(values)) return [];
  return uniqueStrings(
    values.map((value) => {
      const input = optionalString(value);
      if (!input) return "";
      try {
        const url = new URL(input);
        if (!['http:', 'https:'].includes(url.protocol)) throw new Error("Unsupported protocol");
        return url.toString();
      } catch {
        throw new DomainListingPayloadError("INVALID_URL", "Portfolio and media links must be valid HTTP URLs.");
      }
    }),
  );
}

function browserEditorPayload(
  input: Record<string, unknown>,
  omittedKeys: string[],
): Record<string, unknown> {
  const omitted = new Set(omittedKeys);
  return Object.fromEntries(
    Object.entries(input).filter(
      ([key, value]) => !omitted.has(key) && value !== undefined && key !== "wifi_password",
    ),
  );
}

function propertyType(value: unknown): string {
  const map: Record<string, string> = {
    house: "house",
    apartment: "apartment",
    villa: "villa",
    cabin: "cabin",
    farm: "farmhouse",
    farmhouse: "farmhouse",
    cottage: "house",
    townhouse: "house",
    studio: "studio",
    room: "other",
    "mobile home": "other",
    other: "other",
  };
  return map[lower(value)] ?? "other";
}

function propertyLocationType(values: unknown): string | null {
  if (!Array.isArray(values)) return null;
  const normalized = values.map(lower);
  if (normalized.includes("urban")) return "urban";
  if (normalized.includes("suburban")) return "suburban";
  if (normalized.includes("isolated")) return "isolated";
  if (normalized.length > 0) return "rural";
  return null;
}

function propertyExchangeType(value: unknown): string {
  const normalized = lower(value);
  if (normalized.includes("non") && normalized.includes("simultaneous")) return "non_simultaneous";
  if (normalized.includes("point")) return "points";
  if (normalized.includes("private room")) return "private_room";
  if (normalized.includes("work")) return "work_exchange";
  return "simultaneous";
}

function propertySwapDomains(value: unknown): (DomainListingType | "object")[] {
  const normalized = lower(value);
  if (normalized.includes("object")) return ["object"];
  if (normalized.includes("service")) return ["service"];
  if (normalized.includes("flexible") || normalized.includes("point")) {
    return ["object", "property", "service", "event"];
  }
  return ["property"];
}

function firstMapped(
  value: unknown,
  allowed: Record<string, string>,
): string | null {
  const values = Array.isArray(value) ? value : [value];
  for (const entry of values) {
    const mapped = allowed[lower(entry)];
    if (mapped) return mapped;
  }
  return null;
}

function propertyAdditionalRules(form: PropertyFormData): string | null {
  const rules = uniqueStrings([
    optionalString(form.special_house_rules) ?? "",
    optionalString(form.cctv_disclosure) ? `CCTV: ${form.cctv_disclosure.trim()}` : "",
    optionalString(form.local_wildlife_note) ? `Local wildlife: ${form.local_wildlife_note.trim()}` : "",
    optionalString(form.quiet_hours) ? `Quiet hours: ${form.quiet_hours.trim()}` : "",
    form.housekeeping_included
      ? `Housekeeping: ${optionalString(form.housekeeping_frequency) ?? "included"}`
      : "",
  ]);
  return rules.length > 0 ? rules.join("\n") : null;
}

function quietHours(value: unknown): { start: string | null; end: string | null } {
  const input = optionalString(value);
  if (!input) return { start: null, end: null };
  const times = input.match(/(?:[01]\d|2[0-3]):[0-5]\d/g) ?? [];
  return { start: times[0] ?? null, end: times[1] ?? null };
}

export function normalizePropertyWizardCreatePayload(input: unknown): DomainListingCreatePayload {
  const parsed = parseSchema(propertyCreateSchema, input) as PropertyFormData & WithTimeZone;
  validateDateRange(parsed.available_start_date, parsed.available_end_date, "Property availability");

  const minStay = optionalInteger(parsed.minimum_stay_days) ?? 1;
  const maxStay = optionalInteger(parsed.maximum_stay_days) ?? Math.max(minStay, 30);
  if (minStay < 1 || maxStay < minStay) {
    throw new DomainListingPayloadError("INVALID_STAY_LIMITS", "Property stay limits are invalid.");
  }

  const countryCode = normalizeCountryCode(parsed.country);
  const timeZone = normalizeTimeZone(parsed.timezone);
  const publicLat = approximateCoordinate(parsed.lat, -90, 90);
  const publicLon = approximateCoordinate(parsed.lon, -180, 180);
  const exactLat = exactCoordinate(parsed.lat, -90, 90);
  const exactLon = exactCoordinate(parsed.lon, -180, 180);
  const quiet = quietHours(parsed.quiet_hours);
  const swapDomains = propertySwapDomains(parsed.exchange_type);
  const title = `${parsed.property_type.trim()} in ${parsed.city.trim()}`;
  const location = [parsed.city.trim(), countryCode].filter(Boolean).join(", ");
  const accessibility = parsed.accessibility_features.map(lower);

  const material = firstMapped(parsed.construction_material, {
    brick: "brick",
    concrete: "concrete",
    wood: "wood",
    stone: "stone",
    mixed: "mixed",
    other: "other",
  });
  const heating = firstMapped(parsed.heating_type, {
    central: "central",
    gas: "gas",
    electric: "electric",
    "heat pump": "heat_pump",
    geothermal: "geothermal",
    wood: "wood",
    solar: "solar",
    none: "none",
    other: "other",
  });
  const cooling = firstMapped(parsed.cooling_type, {
    ac: "ac",
    "air conditioning": "ac",
    fans: "fans",
    geothermal: "geothermal",
    natural: "natural",
    none: "none",
  });
  const electricity = firstMapped(parsed.electricity_source, {
    grid: "grid",
    solar: "solar",
    wind: "wind",
    generator: "generator",
    mixed: "mixed",
  });
  const furnished = firstMapped(parsed.furnishing_level, {
    unfurnished: "unfurnished",
    partial: "partially",
    partially: "partially",
    furnished: "fully",
    "fully furnished": "fully",
    fully: "fully",
    luxury: "luxury",
  }) ?? "fully";
  const buildingCondition = firstMapped(parsed.building_condition, {
    excellent: "excellent",
    good: "good",
    fair: "fair",
    "needs work": "needs_work",
    "needs renovation": "needs_work",
  });

  const totalRooms =
    parsed.bedrooms + parsed.living_rooms + parsed.kitchen_count + parsed.office_rooms;

  return {
    schema_version: DOMAIN_LISTING_CREATE_SCHEMA_VERSION,
    domain: "property",
    item: compactRecord({
      title,
      description: parsed.desired_exchange_description.trim(),
      category_l1: parsed.property_category.trim(),
      category_l2: optionalString(parsed.property_subtype),
      category_path: [parsed.property_category, parsed.property_type, parsed.property_subtype]
        .map(optionalString)
        .filter(Boolean)
        .join("/"),
      swap_geo_preference: normalizeGeoPreference(parsed.swap_geo_preference),
      swap_open_to: swapDomains,
      swap_wants_type: swapDomains,
      swap_wants_description: parsed.desired_exchange_description.trim(),
      chain_swap_allowed: parsed.chain_swap_allowed,
      cross_category_swap: parsed.cross_category_swap,
      swap_partial_allowed: parsed.swap_partial_allowed,
      swap_partial_topup_eur: optionalNumber(parsed.swap_partial_topup_eur),
      escrow_accepted: parsed.escrow_accepted,
      escrow_required: parsed.escrow_required,
      location,
      location_city: parsed.city.trim(),
      location_country: countryCode,
      images: [],
    }),
    listing: compactRecord({
      property_type: propertyType(parsed.property_type),
      property_subtype: optionalString(parsed.property_subtype),
      listing_purpose: "vacation_swap",
      country_code: countryCode,
      region: optionalString(parsed.region),
      city: parsed.city.trim(),
      address_approximate: [parsed.city.trim(), optionalString(parsed.region)]
        .filter(Boolean)
        .join(", "),
      lat: publicLat,
      lon: publicLon,
      location_type: propertyLocationType(parsed.location_type),
      proximity_sea_km: optionalNumber(parsed.proximity_sea_km),
      proximity_mountain_km: optionalNumber(parsed.proximity_mountain_km),
      proximity_forest_km: optionalNumber(parsed.proximity_forest_km),
      proximity_city_center_km: optionalNumber(parsed.distance_to_center_km),
      year_built: optionalInteger(parsed.year_built),
      year_renovated: optionalInteger(parsed.last_renovated),
      floors_total: parsed.floor_count,
      floor_unit: parsed.property_floor,
      building_condition: buildingCondition,
      construction_material: material,
      bedrooms: parsed.bedrooms,
      bathrooms: parsed.bathrooms,
      toilets: parsed.toilets_extra,
      living_rooms: parsed.living_rooms,
      kitchens: parsed.kitchen_count,
      offices: parsed.office_rooms,
      storage_rooms: parsed.storage_rooms,
      total_rooms: totalRooms,
      sleeps_max: parsed.number_of_guests_allowed,
      surface_total_sqm: optionalNumber(parsed.total_area_sqm),
      surface_living_sqm: optionalNumber(parsed.living_area_sqm),
      surface_garden_sqm: optionalNumber(parsed.garden_area_sqm),
      surface_terrace_sqm: optionalNumber(parsed.terrace_area_sqm),
      has_pool: parsed.has_swimming_pool,
      pool_type: parsed.has_swimming_pool
        ? firstMapped(parsed.pool_type, {
            indoor: "indoor",
            outdoor: "outdoor",
            infinity: "infinity",
            natural: "natural",
          }) ?? "outdoor"
        : "none",
      has_hot_tub: parsed.has_hot_tub,
      has_sauna: parsed.has_sauna,
      has_gym: parsed.has_gym,
      has_tennis_court: parsed.has_tennis_court,
      has_bbq: parsed.has_bbq_area,
      has_fireplace: parsed.outdoor_fireplace,
      parking_spots: parsed.parking_spaces,
      parking_type:
        parsed.parking_spaces < 1
          ? "none"
          : lower(parsed.garage_type) !== "none"
            ? "garage"
            : "private",
      has_ev_charger: parsed.ev_charging,
      heating_type: heating,
      cooling_type: cooling,
      water_source: firstMapped(parsed.water_source, {
        municipal: "municipal",
        well: "well",
        spring: "spring",
        rainwater: "rainwater",
        mixed: "mixed",
      }),
      hot_water_type: firstMapped(parsed.hot_water_system, {
        boiler: "boiler",
        solar: "solar",
        "heat pump": "heat_pump",
        instant: "instant",
        none: "none",
      }),
      electricity_source: electricity,
      has_solar_panels: parsed.solar_panels,
      solar_kwp: optionalNumber(parsed.solar_capacity_kw),
      internet_type: firstMapped(parsed.internet_type, {
        fiber: "fiber",
        cable: "cable",
        dsl: "dsl",
        satellite: "satellite",
        mobile: "mobile",
        none: "none",
      }),
      internet_speed_mbps: optionalInteger(parsed.internet_speed_mbps),
      has_smart_home: parsed.smart_home_features,
      smart_home_features:
        parsed.smart_home_features && optionalString(parsed.smart_home_details)
          ? [parsed.smart_home_details.trim()]
          : [],
      kitchen_appliances: parsed.kitchen_appliances,
      bed_types: parsed.bed_types,
      linens_provided: parsed.linen_provided,
      towels_provided: parsed.towels_provided,
      baby_cot_available: parsed.infants_allowed,
      furnished_level: furnished,
      wheelchair_accessible: accessibility.includes("wheelchair accessible"),
      elevator: parsed.has_elevator || accessibility.includes("elevator"),
      accessible_bathroom: accessibility.includes("adapted shower"),
      step_free_entrance:
        accessibility.includes("ground floor") || accessibility.includes("ramp"),
      wide_doorways: accessibility.includes("wide doorways"),
      pets_allowed: parsed.pets_allowed,
      pets_allowed_types: parsed.pets_allowed ? parsed.pets_types : [],
      exchange_type: propertyExchangeType(parsed.exchange_type),
      min_stay_days: minStay,
      max_stay_days: maxStay,
      preferred_seasons: parsed.preferred_seasons.map((season) => lower(season).replace("all year", "year_round")),
      advance_notice_days: optionalInteger(parsed.advance_booking_days) ?? 14,
      check_in_time: parsed.check_in_time,
      check_out_time: parsed.check_out_time,
      flexible_dates: parsed.flexible_dates,
      available_from: optionalString(parsed.available_start_date),
      available_until: optionalString(parsed.available_end_date),
      smoking_allowed: lower(parsed.smoking_allowed).includes("anywhere"),
      parties_allowed: parsed.parties_allowed,
      quiet_hours_start: quiet.start,
      quiet_hours_end: quiet.end,
      max_guests: parsed.guests_limit,
      children_allowed: parsed.children_allowed,
      min_guest_age: optionalInteger(parsed.min_child_age),
      additional_rules: propertyAdditionalRules(parsed),
      is_eco_certified: parsed.eco_certifications.length > 0,
      eco_certifications: parsed.eco_certifications,
      unique_features: optionalString(parsed.renovation_details),
      security_deposit_eur: optionalNumber(parsed.security_deposit_eur) ?? 0,
      escrow_required: parsed.escrow_required,
      timezone: timeZone,
    }),
    private: {
      editor_payload: browserEditorPayload(parsed as unknown as Record<string, unknown>, [
        "address_line1",
        "lat",
        "lon",
        "wifi_password",
        "confirm_vacation_only",
        "confirm_accurate_info",
        "confirm_terms",
      ]),
      exact_location: compactRecord({
        address: optionalString(parsed.address_line1),
        lat: exactLat,
        lon: exactLon,
      }),
      transfer_data: {},
    },
  };
}

function serviceDeliveryMode(value: unknown): string {
  const normalized = lower(value);
  if (normalized.includes("remote")) return "remote";
  if (normalized.includes("site")) return "onsite";
  return "both";
}

function serviceSkillLevel(value: unknown): string {
  const normalized = lower(value);
  if (normalized.includes("beginner")) return "beginner";
  if (normalized.includes("intermediate")) return "intermediate";
  if (normalized.includes("advanced") || normalized.includes("senior")) return "advanced";
  if (normalized.includes("master") || normalized.includes("veteran") || normalized.includes("10+")) return "master";
  return "expert";
}

function serviceDays(values: string[]): string[] {
  const map: Record<string, string> = {
    mon: "monday",
    monday: "monday",
    tue: "tuesday",
    tuesday: "tuesday",
    wed: "wednesday",
    wednesday: "wednesday",
    thu: "thursday",
    thursday: "thursday",
    fri: "friday",
    friday: "friday",
    sat: "saturday",
    saturday: "saturday",
    sun: "sunday",
    sunday: "sunday",
  };
  if (values.some((value) => lower(value) === "any")) {
    return ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
  }
  return uniqueStrings(values.map((value) => map[lower(value)] ?? ""));
}

function serviceAvailabilityWindow(values: string[]): { from: string; until: string } {
  const windows: Record<string, [string, string]> = {
    morning: ["08:00", "12:00"],
    midday: ["11:00", "15:00"],
    afternoon: ["13:00", "18:00"],
    evening: ["17:00", "21:00"],
    flexible: ["09:00", "18:00"],
  };
  const selected = values.map((value) => windows[lower(value)]).filter(Boolean);
  if (selected.length === 0) return { from: "09:00", until: "18:00" };
  return {
    from: selected.map(([from]) => from).sort()[0],
    until: selected.map(([, until]) => until).sort().at(-1) ?? "18:00",
  };
}

function serviceDuration(values: string[]): { hours: number | null; days: number | null } {
  const normalized = values.map(lower);
  if (normalized.some((value) => value.includes("multi"))) return { hours: null, days: 2 };
  if (normalized.some((value) => value.includes("full"))) return { hours: 8, days: null };
  if (normalized.some((value) => value.includes("half"))) return { hours: 4, days: null };
  if (normalized.some((value) => value.includes("1h") || value.includes("60"))) return { hours: 1, days: null };
  return { hours: null, days: null };
}

function languageCodes(values: string[]): string[] {
  const map: Record<string, string> = {
    english: "en",
    romanian: "ro",
    spanish: "es",
    french: "fr",
    german: "de",
    italian: "it",
    russian: "ru",
    ukrainian: "uk",
    polish: "pl",
    turkish: "tr",
    arabic: "ar",
    chinese: "zh",
  };
  return uniqueStrings(values.map((value) => map[lower(value)] ?? lower(value)));
}

export function normalizeServiceWizardCreatePayload(input: unknown): DomainListingCreatePayload {
  const parsed = parseSchema(serviceCreateSchema, input) as ServiceFormData & WithTimeZone;
  validateDateRange(parsed.available_from_date, parsed.available_until_date, "Service availability");

  const timeZone = normalizeTimeZone(parsed.timezone);
  const swapDomains = normalizeSwapDomains(parsed.swap_for_type);
  const portfolioUrls = safeHttpUrls(parsed.portfolio_urls);
  const portfolioImages = safeHttpUrls(parsed.portfolio_images);
  const availability = serviceAvailabilityWindow(parsed.availability_time_of_day);
  const duration = serviceDuration(parsed.service_duration);
  const deliveryMode = serviceDeliveryMode(parsed.service_modality);
  const geoPreference = normalizeGeoPreference(parsed.swap_geo_preference);
  const serviceAreaType =
    deliveryMode === "remote"
      ? "international"
      : geoPreference === "local"
        ? "local"
        : geoPreference === "international"
          ? "international"
          : "regional";

  return {
    schema_version: DOMAIN_LISTING_CREATE_SCHEMA_VERSION,
    domain: "service",
    item: compactRecord({
      title: parsed.service_title.trim(),
      description: parsed.service_full_description.trim(),
      category_l1: parsed.service_category_l1.trim(),
      category_l2: optionalString(parsed.service_category_l2),
      category_l3: optionalString(parsed.service_category_l3),
      category_path: [
        parsed.service_category_l1,
        parsed.service_category_l2,
        parsed.service_category_l3,
      ]
        .map(optionalString)
        .filter(Boolean)
        .join("/"),
      perceived_value_tier: normalizeValueTier(parsed.perceived_value_tier),
      swap_geo_preference: geoPreference,
      swap_open_to: swapDomains,
      swap_wants_type: swapDomains,
      swap_wants_description: parsed.swap_wants_description.trim(),
      swap_wants_value_tier: normalizeValueTier(parsed.perceived_value_tier),
      chain_swap_allowed: parsed.chain_swap_allowed,
      cross_category_swap: parsed.cross_category_swap,
      swap_partial_allowed: parsed.swap_partial_allowed,
      swap_partial_topup_eur: optionalNumber(parsed.swap_partial_topup_eur),
      escrow_accepted: parsed.escrow_accepted,
      images: portfolioImages,
      image_url: portfolioImages[0] ?? null,
    }),
    listing: compactRecord({
      category_l1: parsed.service_category_l1.trim(),
      category_l2: optionalString(parsed.service_category_l2),
      category_l3: optionalString(parsed.service_category_l3),
      service_name: parsed.service_title.trim(),
      service_name_local: optionalString(parsed.service_short_description),
      delivery_mode: deliveryMode,
      service_area_type: serviceAreaType,
      service_area_radius_km:
        deliveryMode === "remote" ? null : Math.max(0, Math.trunc(parsed.swap_geo_radius_km)),
      travel_included: false,
      experience_years: Math.max(0, Math.trunc(parsed.experience_years)),
      skill_level: serviceSkillLevel(parsed.experience_level),
      is_licensed: false,
      is_insured: false,
      is_certified: false,
      certifications: [],
      portfolio_url: portfolioUrls[0] ?? null,
      portfolio_items: [
        ...portfolioUrls.map((url) => ({ type: "url", url })),
        ...portfolioImages.map((url) => ({ type: "image", url })),
      ],
      available_days: serviceDays(parsed.availability_days),
      available_from_time: availability.from,
      available_until_time: availability.until,
      available_date_from: optionalString(parsed.available_from_date),
      available_date_until: optionalString(parsed.available_until_date),
      lead_time_days: Math.max(0, Math.trunc(parsed.advance_notice_days)),
      max_concurrent_jobs: 1,
      estimated_hours: duration.hours,
      estimated_days: duration.days,
      scope_description: parsed.service_full_description.trim(),
      deliverables: optionalString(parsed.service_short_description)
        ? [parsed.service_short_description.trim()]
        : [],
      swap_open_to: swapDomains,
      swap_wants_description: parsed.swap_wants_description.trim(),
      swap_wants_type: swapDomains,
      swap_wants_value_tier: normalizeValueTier(parsed.perceived_value_tier),
      partial_swap_allowed: parsed.swap_partial_allowed,
      partial_topup_eur: optionalNumber(parsed.swap_partial_topup_eur),
      escrow_accepted: parsed.escrow_accepted,
      service_languages: languageCodes(parsed.languages_service),
      gallery: portfolioImages,
      timezone: timeZone,
    }),
    private: {
      editor_payload: browserEditorPayload(parsed as unknown as Record<string, unknown>, [
        "confirm_authorized",
        "confirm_accurate",
        "confirm_terms",
      ]),
      exact_location: {},
      transfer_data: compactRecord({
        certification_claims: parsed.certifications,
        provider_type: parsed.provider_type,
      }),
    },
  };
}

function eventLocationType(isOnline: boolean, value: unknown): string {
  if (isOnline) return "online";
  if (lower(value).includes("hybrid")) return "hybrid";
  return "physical";
}

function eventTransportMode(value: unknown): string | null {
  return firstMapped(value, {
    air: "air",
    rail: "rail",
    "ferry/cruise": "maritime",
    ferry: "maritime",
    cruise: "maritime",
    bus: "bus",
    "taxi/rideshare": "taxi_rideshare",
    carpooling: "carpooling",
    micro: "micro_mobility",
  });
}

function eventRouteType(value: unknown): string | null {
  return firstMapped(value, {
    "one way": "one_way",
    one_way: "one_way",
    "round trip": "round_trip",
    round_trip: "round_trip",
    "multi stop": "multi_stop",
    multi_stop: "multi_stop",
    circuit: "circuit",
  });
}

function eventSeason(values: string[]): string | null {
  const first = values[0];
  if (!first) return null;
  const normalized = lower(first).replace("all year", "year_round");
  return ["spring", "summer", "autumn", "winter", "year_round"].includes(normalized)
    ? normalized
    : null;
}

function dateAtEndOfUtcDay(value: string): string {
  return `${value}T23:59:59.000Z`;
}

function eventDurationDays(start: string, end: string | null): number {
  const startTime = new Date(`${start}T00:00:00.000Z`).getTime();
  const endTime = new Date(`${end ?? start}T00:00:00.000Z`).getTime();
  return Math.max(1, Math.floor((endTime - startTime) / 86_400_000) + 1);
}

function isTicketEvent(form: EventFormData): boolean {
  return lower(form.event_type_l1).includes("ticket") || lower(form.event_type_l2).includes("ticket");
}

export function normalizeEventWizardCreatePayload(input: unknown): DomainListingCreatePayload {
  const parsed = parseSchema(eventCreateSchema, input) as EventFormData & WithTimeZone;
  validateDateRange(parsed.start_date, parsed.end_date, "Event");

  const startDate = parsed.start_date.trim();
  const endDate = optionalString(parsed.end_date);
  const today = new Date().toISOString().slice(0, 10);
  if (startDate < today) {
    throw new DomainListingPayloadError("PAST_EVENT", "Past events cannot be published.");
  }
  if (parsed.capacity_available > parsed.capacity_total) {
    throw new DomainListingPayloadError(
      "INVALID_EVENT_CAPACITY",
      "Available capacity cannot exceed total capacity.",
    );
  }

  const ticket = isTicketEvent(parsed);
  const deadline = optionalString(parsed.booking_deadline_date);
  if (ticket && !parsed.is_transferable) {
    throw new DomainListingPayloadError(
      "NON_TRANSFERABLE_EVENT",
      "A non-transferable ticket cannot be published for exchange.",
    );
  }
  if (ticket && (!deadline || deadline >= startDate || deadline < today)) {
    throw new DomainListingPayloadError(
      "INVALID_TRANSFER_DEADLINE",
      "Transferable tickets require a valid deadline before the event.",
    );
  }

  const countryCode = normalizeCountryCode(parsed.country);
  const timeZone = normalizeTimeZone(parsed.timezone);
  const publicLat = approximateCoordinate(parsed.lat, -90, 90);
  const publicLon = approximateCoordinate(parsed.lon, -180, 180);
  const exactLat = exactCoordinate(parsed.lat, -90, 90);
  const exactLon = exactCoordinate(parsed.lon, -180, 180);
  const swapDomains = normalizeSwapDomains(parsed.swap_for_type);
  const locationType = eventLocationType(parsed.is_online, parsed.location_type);
  const recurring = lower(parsed.recurrence) !== "one-time";
  const recurrencePattern = recurring
    ? lower(parsed.recurrence).includes("weekly")
      ? "weekly"
      : lower(parsed.recurrence).includes("monthly")
        ? "monthly"
        : "custom"
    : null;
  const routeWaypoints = optionalString(parsed.route_waypoints)
    ? parsed.route_waypoints
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean)
    : [];
  const suitableFor = uniqueStrings([
    "adults",
    parsed.kid_friendly ? "families" : "",
    parsed.pet_friendly ? "pets" : "",
  ]);
  const extras = uniqueStrings([
    optionalString(parsed.equipment_list) ? `Equipment: ${parsed.equipment_list.trim()}` : "",
    optionalString(parsed.dress_code) ? `Dress code: ${parsed.dress_code.trim()}` : "",
  ]);
  const location = parsed.is_online
    ? "Online"
    : [parsed.venue_name, parsed.city, countryCode].map(optionalString).filter(Boolean).join(", ");

  return {
    schema_version: DOMAIN_LISTING_CREATE_SCHEMA_VERSION,
    domain: "event",
    item: compactRecord({
      title: parsed.event_title.trim(),
      description: parsed.event_description.trim(),
      category_l1: parsed.event_type_l1.trim(),
      category_l2: optionalString(parsed.event_type_l2),
      category_path: [parsed.event_type_l1, parsed.event_type_l2]
        .map(optionalString)
        .filter(Boolean)
        .join("/"),
      perceived_value_tier: normalizeValueTier(parsed.perceived_value_tier),
      swap_geo_preference: normalizeGeoPreference(parsed.swap_geo_preference),
      swap_open_to: swapDomains,
      swap_wants_type: swapDomains,
      swap_wants_description: parsed.swap_wants_description.trim(),
      swap_wants_value_tier: normalizeValueTier(parsed.perceived_value_tier),
      chain_swap_allowed: parsed.chain_swap_allowed,
      cross_category_swap: parsed.cross_category_swap,
      swap_partial_allowed: parsed.swap_partial_allowed,
      swap_partial_topup_eur: optionalNumber(parsed.swap_partial_topup_eur),
      escrow_accepted: parsed.escrow_accepted,
      location,
      location_city: optionalString(parsed.city),
      location_country: countryCode,
      images: [],
    }),
    listing: compactRecord({
      event_group: parsed.event_type_l1.trim(),
      event_category: optionalString(parsed.event_type_l2) ?? parsed.event_type_l1.trim(),
      event_subcategory: null,
      start_date: startDate,
      end_date: endDate,
      start_time: optionalString(parsed.start_time),
      end_time: optionalString(parsed.end_time),
      timezone: timeZone,
      duration_days: eventDurationDays(startDate, endDate),
      is_recurring: recurring,
      recurrence_pattern: recurrencePattern,
      recurrence_details:
        recurring && recurrencePattern === "custom"
          ? { frequency: lower(parsed.recurrence) }
          : null,
      season: eventSeason(parsed.season),
      location_type: locationType,
      country_code: countryCode,
      region: optionalString(parsed.region),
      city: optionalString(parsed.city),
      venue_name: optionalString(parsed.venue_name),
      lat: publicLat,
      lon: publicLon,
      is_route_based:
        Boolean(optionalString(parsed.route_start_city)) || Boolean(optionalString(parsed.route_end_city)),
      route_type: eventRouteType(parsed.route_type),
      route_origin_city: optionalString(parsed.route_start_city),
      route_destination_city: optionalString(parsed.route_end_city),
      route_waypoints: routeWaypoints,
      route_gpx_url: safeHttpUrls(optionalString(parsed.route_gpx_url) ? [parsed.route_gpx_url] : [])[0] ?? null,
      route_total_km: optionalNumber(parsed.route_total_km),
      capacity_total: parsed.capacity_total,
      capacity_available: parsed.capacity_available,
      min_participants: Math.max(1, Math.trunc(parsed.group_size_min)),
      max_participants: Math.max(1, Math.trunc(parsed.group_size_max)),
      age_min: optionalInteger(parsed.age_min),
      suitable_for: suitableFor,
      transport_mode: eventTransportMode(parsed.transport_mode),
      transport_class: optionalString(parsed.seat_class),
      baggage_included: { included: parsed.baggage_included },
      is_transferable: ticket ? true : parsed.is_transferable,
      miles_points_type: optionalString(parsed.rail_pass_type),
      pass_days_remaining: Math.max(0, Math.trunc(parsed.rail_pass_days_remaining)),
      sport_type: optionalString(parsed.sport_type),
      sport_competition: optionalString(parsed.competition_name),
      venue_section: optionalString(parsed.venue_sector),
      face_value_eur: optionalNumber(parsed.face_value_eur),
      has_hospitality: parsed.hospitality_included,
      capacity_available_public: undefined,
      includes_transport: parsed.includes_transport,
      includes_accommodation: parsed.includes_accommodation,
      includes_meals: parsed.includes_meals,
      includes_equipment: parsed.includes_equipment,
      extras,
      swap_open_to: swapDomains,
      swap_wants_description: parsed.swap_wants_description.trim(),
      swap_wants_type: swapDomains,
      swap_wants_value_tier: normalizeValueTier(parsed.perceived_value_tier),
      partial_swap_allowed: parsed.swap_partial_allowed,
      partial_topup_eur: optionalNumber(parsed.swap_partial_topup_eur),
      escrow_accepted: parsed.escrow_accepted,
      exchange_points: optionalInteger(parsed.exchange_points),
      expires_at: dateAtEndOfUtcDay(endDate ?? startDate),
      transfer_deadline_at: deadline ? dateAtEndOfUtcDay(deadline) : null,
      transfer_rule_source: ticket ? "user_attestation" : null,
      transfer_rule_confirmed: ticket ? parsed.confirm_authorized : false,
    }),
    private: {
      editor_payload: browserEditorPayload(parsed as unknown as Record<string, unknown>, [
        "booking_reference",
        "venue_row",
        "seat_number",
        "lat",
        "lon",
        "confirm_authorized",
        "confirm_accurate",
        "confirm_terms",
      ]),
      exact_location: compactRecord({
        lat: exactLat,
        lon: exactLon,
      }),
      transfer_data: compactRecord({
        booking_reference: optionalString(parsed.booking_reference),
        venue_row: optionalString(parsed.venue_row),
        seat_number: optionalString(parsed.seat_number),
        id_required: parsed.id_required,
        rule_source: ticket ? "user_attestation" : null,
        authorized_attestation: parsed.confirm_authorized,
      }),
    },
  };
}
