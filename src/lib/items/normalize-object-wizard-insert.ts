type JsonRecord = Record<string, unknown>;

type CanonicalItemCondition = "new" | "good" | "used" | "used_good";
type ItemConditionV2 =
  | "new"
  | "like_new"
  | "very_good"
  | "good"
  | "used"
  | "for_repair"
  | "special";
type ItemStatus = "active" | "paused" | "reserved" | "traded" | "archived";
type ItemValueTier = "small" | "medium" | "large" | "special";
type ItemGeoPreference = "local" | "regional" | "international" | "vacation";
type SwapAssetType = "object" | "property" | "service" | "event";

const LEGACY_WIZARD_ONLY_FIELDS = [
  "age_years",
  "condition_details",
  "original_packaging",
  "photos",
  "swap_chain_allowed",
  "swap_flexibility",
  "swap_value_match",
] as const;

const CONDITION_MAP: Record<string, CanonicalItemCondition> = {
  New: "new",
  "Like New": "used_good",
  "Very Good": "used_good",
  Good: "good",
  Used: "used",
  "For Repair": "used",
  "Special / Collection": "used_good",
  new: "new",
  good: "good",
  used: "used",
  used_good: "used_good",
};

const CONDITION_V2_MAP: Record<string, ItemConditionV2> = {
  New: "new",
  "Like New": "like_new",
  "Very Good": "very_good",
  Good: "good",
  Used: "used",
  "For Repair": "for_repair",
  "Special / Collection": "special",
  new: "new",
  like_new: "like_new",
  very_good: "very_good",
  good: "good",
  used: "used",
  for_repair: "for_repair",
  special: "special",
};

const OPEN_TO_MAP: Record<string, SwapAssetType[]> = {
  "Objects only": ["object"],
  "Objects + Services": ["object", "service"],
  "Objects + Events": ["object", "event"],
  "Objects + Accommodation": ["object", "property"],
  Anything: ["object", "property", "service", "event"],
};

const ITEM_STATUSES = new Set<ItemStatus>([
  "active",
  "paused",
  "reserved",
  "traded",
  "archived",
]);
const VALUE_TIERS = new Set<ItemValueTier>(["small", "medium", "large", "special"]);
const GEO_PREFERENCES = new Set<ItemGeoPreference>([
  "local",
  "regional",
  "international",
  "vacation",
]);
const SWAP_ASSET_TYPES = new Set<SwapAssetType>([
  "object",
  "property",
  "service",
  "event",
]);

function isJsonRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringValue(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function stringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map(stringValue).filter(Boolean);
}

function nullableInteger(value: unknown): number | null {
  if (typeof value === "number" && Number.isInteger(value) && value >= 0) return value;
  if (typeof value !== "string" || value.trim() === "") return null;

  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : null;
}

function slugValue(value: unknown): string {
  return stringValue(value)
    .toLowerCase()
    .replace(/\s*\/\s*/g, "_")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function isLegacyObjectWizardRow(row: JsonRecord): boolean {
  return (
    stringValue(row.category_l1).length > 0 &&
    LEGACY_WIZARD_ONLY_FIELDS.some((field) =>
      Object.prototype.hasOwnProperty.call(row, field),
    )
  );
}

function normalizeCondition(value: unknown): CanonicalItemCondition {
  const label = stringValue(value);
  return CONDITION_MAP[label] ?? "good";
}

function normalizeConditionV2(value: unknown): ItemConditionV2 {
  const label = stringValue(value);
  return CONDITION_V2_MAP[label] ?? "good";
}

function normalizeValueTier(value: unknown): ItemValueTier | null {
  const normalized = slugValue(value) as ItemValueTier;
  return VALUE_TIERS.has(normalized) ? normalized : null;
}

function normalizeGeoPreference(value: unknown): ItemGeoPreference | null {
  const normalized = slugValue(value) as ItemGeoPreference;
  return GEO_PREFERENCES.has(normalized) ? normalized : null;
}

function normalizeStatus(value: unknown): ItemStatus {
  const requested = slugValue(value);
  if (requested === "draft") return "paused";

  const status = requested as ItemStatus;
  return ITEM_STATUSES.has(status) ? status : "active";
}

function normalizeSwapOpenTo(value: unknown): SwapAssetType[] {
  const values = Array.isArray(value) ? value : [value];
  const normalized = values.flatMap((entry) => {
    const label = stringValue(entry);
    if (!label) return [];

    const mapped = OPEN_TO_MAP[label];
    if (mapped) return mapped;

    const canonical = slugValue(label) as SwapAssetType;
    return SWAP_ASSET_TYPES.has(canonical) ? [canonical] : [];
  });

  return [...new Set(normalized.length > 0 ? normalized : ["object"] as SwapAssetType[])];
}

function normalizeFlexibility(value: unknown): string | null {
  const normalized = slugValue(value);
  if (!normalized) return null;
  return normalized === "wide" ? "broad" : normalized;
}

/**
 * Converts the legacy five-step object wizard payload to the canonical production
 * `items` schema. Canonical item writes are returned untouched.
 */
export function normalizeObjectWizardItemInsert(row: unknown): unknown {
  if (!isJsonRecord(row) || !isLegacyObjectWizardRow(row)) return row;

  const {
    age_years: ageYears,
    condition_details: conditionDetails,
    original_packaging: originalPackaging,
    photos: legacyPhotos,
    swap_chain_allowed: legacyChainAllowed,
    swap_flexibility: legacySwapFlexibility,
    swap_value_match: legacySwapValueMatch,
    ...canonicalFields
  } = row;

  const categoryL1 = stringValue(row.category_l1);
  const categoryL2 = stringValue(row.category_l2);
  const categoryL3 = stringValue(row.category_l3);
  const categoryPath = [categoryL1, categoryL2, categoryL3].filter(Boolean).join(" > ");
  const requestedStatus = slugValue(row.status) || "active";
  const status = normalizeStatus(row.status);
  const explicitImages = stringArray(row.images);
  const images = explicitImages.length > 0 ? explicitImages : stringArray(legacyPhotos);
  const aiMetadata = isJsonRecord(row.ai_metadata) ? row.ai_metadata : {};
  const previousWizardMetadata = isJsonRecord(aiMetadata.object_wizard)
    ? aiMetadata.object_wizard
    : {};
  const swapWantsDescription = stringValue(row.swap_wants_description);
  const explicitIsActive =
    typeof row.is_active === "boolean" ? row.is_active : undefined;
  const statusIsPublic = status === "active" || status === "reserved";

  return {
    ...canonicalFields,
    category: stringValue(row.category) || categoryL1 || "General",
    subcategory: stringValue(row.subcategory) || categoryL2 || null,
    category_path: stringValue(row.category_path) || categoryPath || null,
    condition: normalizeCondition(row.condition),
    condition_v2: normalizeConditionV2(row.condition),
    perceived_value_tier: normalizeValueTier(row.perceived_value_tier),
    images,
    image_url: stringValue(row.image_url) || images[0] || null,
    swap_open_to: normalizeSwapOpenTo(row.swap_open_to),
    chain_swap_allowed:
      typeof row.chain_swap_allowed === "boolean"
        ? row.chain_swap_allowed
        : legacyChainAllowed === true,
    swap_geo_preference: normalizeGeoPreference(row.swap_geo_preference),
    status,
    is_active:
      requestedStatus === "draft"
        ? false
        : (explicitIsActive ?? statusIsPublic),
    ai_metadata: {
      ...aiMetadata,
      ...(swapWantsDescription && !stringValue(aiMetadata.wishlist)
        ? { wishlist: swapWantsDescription }
        : {}),
      object_wizard: {
        ...previousWizardMetadata,
        schema_version: 1,
        requested_status: requestedStatus,
        condition_label: stringValue(row.condition) || null,
        condition_details: stringValue(conditionDetails) || null,
        age_years: nullableInteger(ageYears),
        original_packaging: originalPackaging === true,
        swap_value_match: slugValue(legacySwapValueMatch) || null,
        swap_flexibility: normalizeFlexibility(legacySwapFlexibility),
      },
    },
  };
}
