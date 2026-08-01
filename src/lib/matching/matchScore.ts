import { scoreItemPair } from "@/lib/matching-engine";
import type {
  HouseProfile,
  Item,
  ListingType,
  PropertyType,
  ServiceCategory,
  ServiceDelivery,
  ServiceProfile,
  SkillLevel,
} from "@/lib/types";
import type {
  MatchingDomainProfile,
  MatchingItemRow,
  MatchingProfileRow,
} from "@/lib/matching/matchQueries";

export type ScoreBreakdown = {
  categoryMatch: number;
  valueMatch: number;
  typeMatch: number;
  geoScore: number;
  trustScore: number;
  activityScore: number;
  availabilityScore: number;
  total: number;
};

function toText(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : fallback;
}

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function toBoolean(value: unknown, fallback = false): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function toStrings(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((entry): entry is string => typeof entry === "string")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function toListingType(value: unknown): ListingType {
  if (
    value === "object" ||
    value === "property" ||
    value === "service" ||
    value === "event"
  ) {
    return value;
  }
  return "object";
}

function profileFor(
  row: MatchingItemRow,
  domain: ListingType,
): MatchingDomainProfile {
  if (
    row.domain_profile &&
    typeof row.domain_profile === "object" &&
    !Array.isArray(row.domain_profile)
  ) {
    return row.domain_profile;
  }
  return { domain };
}

function toCondition(value: unknown): Item["condition"] {
  if (
    value === "new" ||
    value === "good" ||
    value === "used" ||
    value === "used_good"
  ) {
    return value;
  }
  return "good";
}

function toPerceivedValue(value: unknown): Item["perceivedValue"] {
  if (
    value === "small" ||
    value === "medium" ||
    value === "large" ||
    value === "sentimental"
  ) {
    return value;
  }
  if (value === "special") return "sentimental";
  return "medium";
}

function toPropertyType(value: unknown): PropertyType {
  const normalized = toText(value).toLowerCase();
  if (
    normalized === "apartment" ||
    normalized === "house" ||
    normalized === "villa" ||
    normalized === "cabin" ||
    normalized === "studio" ||
    normalized === "room"
  ) {
    return normalized;
  }
  return "house";
}

function toServiceCategory(value: unknown): ServiceCategory {
  const normalized = toText(value).toLowerCase();
  if (
    normalized.includes("design") ||
    normalized.includes("creative") ||
    normalized.includes("photo") ||
    normalized.includes("music")
  ) {
    return "creative";
  }
  if (
    normalized.includes("tech") ||
    normalized.includes("engineer") ||
    normalized.includes("software") ||
    normalized.includes("repair")
  ) {
    return "technical";
  }
  if (
    normalized.includes("education") ||
    normalized.includes("teach") ||
    normalized.includes("language") ||
    normalized.includes("training")
  ) {
    return "education";
  }
  if (
    normalized.includes("fitness") ||
    normalized.includes("physical") ||
    normalized.includes("sport") ||
    normalized.includes("wellness")
  ) {
    return "physical";
  }
  return "professional";
}

function toSkillLevel(value: unknown): SkillLevel {
  const normalized = toText(value).toLowerCase();
  if (normalized === "beginner") return "beginner";
  if (normalized === "intermediate") return "intermediate";
  return "expert";
}

function toServiceDelivery(value: unknown): ServiceDelivery {
  const normalized = toText(value).toLowerCase();
  if (normalized === "remote") return "remote";
  if (
    normalized === "onsite" ||
    normalized === "on-site" ||
    normalized === "in_person"
  ) {
    return "in_person";
  }
  return "hybrid";
}

function domainLocation(
  row: MatchingItemRow,
  profile: MatchingProfileRow | null | undefined,
): string {
  const domain = profileFor(row, toListingType(row.item_type));
  return (
    toText(domain.city) ||
    toText(row.location_city) ||
    toText(row.location) ||
    toText(profile?.location?.city)
  );
}

function propertyProfile(row: MatchingItemRow): HouseProfile | undefined {
  if (toListingType(row.item_type) !== "property") return undefined;
  const profile = profileFor(row, "property");
  const availableFrom = toText(profile.available_from);
  const availableUntil = toText(profile.available_until);

  return {
    propertyType: toPropertyType(profile.property_type),
    bedrooms: Math.max(0, Math.trunc(toNumber(profile.bedrooms))),
    bathrooms: Math.max(0, Math.trunc(toNumber(profile.bathrooms))),
    maxGuests: Math.max(1, Math.trunc(toNumber(profile.sleeps_max, 1))),
    squareMeters: Math.max(0, toNumber(profile.surface_total_sqm)),
    amenities: [],
    rules: [],
    description: row.description ?? "",
    neighborhood: toText(profile.city),
    nearbyAttractions: "",
    transport: "",
    photos: row.photos ?? [],
    availableDates:
      availableFrom && availableUntil
        ? [{ from: availableFrom, to: availableUntil }]
        : [],
    minStayDays: Math.max(
      1,
      Math.trunc(toNumber(profile.min_stay_days, 1)),
    ),
    maxStayDays: Math.max(
      1,
      Math.trunc(toNumber(profile.max_stay_days, 30)),
    ),
    swapMode:
      toText(profile.exchange_type) === "non_simultaneous"
        ? "non_simultaneous"
        : "simultaneous",
    verified: false,
    insuranceReminder: false,
  };
}

function serviceProfile(row: MatchingItemRow): ServiceProfile | undefined {
  if (toListingType(row.item_type) !== "service") return undefined;
  const profile = profileFor(row, "service");
  const estimatedHours = Math.max(
    1,
    Math.trunc(toNumber(profile.estimated_hours, 1)),
  );
  const estimatedValue = row.estimated_value ?? row.approximate_value ?? 0;

  return {
    category: toServiceCategory(profile.category_l1 ?? row.category_l1),
    skillName: toText(profile.service_name, row.title),
    skillLevel: toSkillLevel(profile.skill_level),
    description: row.description ?? "",
    portfolio: [],
    hoursPerWeek: estimatedHours,
    delivery: toServiceDelivery(profile.delivery_mode),
    hourlyEquivalent:
      estimatedValue > 0 ? Math.max(1, estimatedValue / estimatedHours) : 0,
  };
}

function eventExperience(row: MatchingItemRow): Item["experienceData"] {
  if (toListingType(row.item_type) !== "event") return undefined;
  const profile = profileFor(row, "event");
  const isTicket = profile.is_ticket === true;

  return {
    eventDate: toText(profile.start_date) || undefined,
    transferable: isTicket
      ? toBoolean(profile.is_transferable)
      : undefined,
    ticketCount: isTicket
      ? Math.max(
          0,
          Math.trunc(
            toNumber(
              profile.capacity_available,
              toNumber(profile.capacity_total),
            ),
          ),
        )
      : undefined,
  };
}

function rowToItem(
  row: MatchingItemRow,
  profile: MatchingProfileRow | null | undefined,
): Item {
  const listingType = toListingType(row.item_type);
  const openTo = toStrings(row.swap_open_to);
  const wantsType = toStrings(row.swap_wants_type);
  const wantedDomains = [...openTo, ...wantsType].join(" ");
  const wishlist = [
    wantedDomains,
    row.swap_wants_category_l1 ?? "",
    row.swap_wants_description ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  return {
    id: row.id,
    ownerId: row.owner_id,
    title: row.title,
    category: row.category_l1 ?? row.category ?? listingType,
    condition: toCondition(row.condition),
    description: row.description ?? "",
    wishlist,
    status: row.status === "active" ? "active" : "paused",
    isActive: row.is_active !== false,
    createdAt: row.created_at ?? new Date().toISOString(),
    location: domainLocation(row, profile),
    photos: row.photos ?? [],
    listingType,
    perceivedValue: toPerceivedValue(row.perceived_value_tier),
    subcategorySlug: row.subcategory_slug ?? row.subcategory ?? "",
    acceptsBundle: row.cross_category_swap === true || openTo.length > 1,
    houseProfile: propertyProfile(row),
    serviceProfile: serviceProfile(row),
    experienceData: eventExperience(row),
  };
}

function profileGeoScore(
  myProfile: MatchingProfileRow | null | undefined,
  theirProfile: MatchingProfileRow | null | undefined,
): number {
  const myLat = myProfile?.location?.lat;
  const myLon = myProfile?.location?.lon;
  const theirLat = theirProfile?.location?.lat;
  const theirLon = theirProfile?.location?.lon;

  if (
    typeof myLat !== "number" ||
    typeof myLon !== "number" ||
    typeof theirLat !== "number" ||
    typeof theirLon !== "number"
  ) {
    const myCity = toText(myProfile?.location?.city).toLowerCase();
    const theirCity = toText(theirProfile?.location?.city).toLowerCase();
    if (myCity && theirCity && myCity === theirCity) return 90;
    return 50;
  }

  const earthRadiusKm = 6371;
  const dLat = ((theirLat - myLat) * Math.PI) / 180;
  const dLon = ((theirLon - myLon) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((myLat * Math.PI) / 180) *
      Math.cos((theirLat * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  const distanceKm =
    earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  if (distanceKm < 50) return 100;
  if (distanceKm < 300) return 80;
  if (distanceKm < 1000) return 60;
  return 30;
}

function profileTrustScore(
  theirProfile: MatchingProfileRow | null | undefined,
): number {
  return Math.min(
    100,
    Math.max(0, toNumber(theirProfile?.trust_score)),
  );
}

function profileActivityScore(
  theirProfile: MatchingProfileRow | null | undefined,
): number {
  const lastActive = theirProfile?.last_active_at;
  if (!lastActive) return 0;
  const timestamp = new Date(lastActive).getTime();
  if (!Number.isFinite(timestamp)) return 0;
  const daysSince = (Date.now() - timestamp) / 86_400_000;
  return Math.round(Math.max(0, Math.min(100, 100 - daysSince * 5)));
}

function factorScore(
  candidate: ReturnType<typeof scoreItemPair>,
  key: string,
): number {
  const factor = candidate.weightedScore?.factors.find(
    (entry) => entry.key === key,
  );
  return factor?.raw ?? 0;
}

export function calculateMatchScore(
  myItem: MatchingItemRow,
  theirItem: MatchingItemRow,
  myProfile: MatchingProfileRow | null | undefined,
  theirProfile: MatchingProfileRow | null | undefined,
): ScoreBreakdown {
  const engineCandidate = scoreItemPair(
    rowToItem(theirItem, theirProfile),
    rowToItem(myItem, myProfile),
  );
  const geoScore = profileGeoScore(myProfile, theirProfile);
  const trustScore = profileTrustScore(theirProfile);
  const activityScore = profileActivityScore(theirProfile);
  const engineScore = Math.min(100, engineCandidate.compatibilityScore);
  const userScore = Math.round(
    geoScore * 0.45 + trustScore * 0.35 + activityScore * 0.2,
  );
  const total = Math.min(
    100,
    Math.round(engineScore * 0.8 + userScore * 0.2),
  );

  return {
    categoryMatch: factorScore(engineCandidate, "category"),
    valueMatch: factorScore(engineCandidate, "value"),
    typeMatch: factorScore(engineCandidate, "domain"),
    geoScore,
    trustScore,
    activityScore,
    availabilityScore: factorScore(engineCandidate, "availability"),
    total,
  };
}
