import type { Item, MatchCandidate, MatchTier } from "@/lib/types";

export interface MatchingWeights {
  category: number;
  wishlist: number;
  location: number;
  condition: number;
  intent: number;
  flexibility: number;
  media: number;
  value: number;
  freshness: number;
  availability: number;
  transferability: number;
  domain: number;
}

export interface MatchingOptions {
  weights?: Partial<MatchingWeights>;
  now?: Date;
  maxCandidates?: number;
}

export interface MatchingFactor {
  key: keyof MatchingWeights;
  raw: number;
  weighted: number;
  label: string;
}

const DEFAULT_WEIGHTS: MatchingWeights = {
  category: 0.2,
  wishlist: 0.2,
  location: 0.12,
  condition: 0.1,
  intent: 0.1,
  flexibility: 0.08,
  media: 0.08,
  value: 0.04,
  freshness: 0.05,
  availability: 0.08,
  transferability: 0.05,
  domain: 0.07,
};

const CONDITION_SCORE: Record<Item["condition"], number> = {
  new: 1,
  good: 0.85,
  used_good: 0.75,
  used: 0.55,
};

function normalize(value: string | undefined | null): string {
  return (value ?? "").trim().toLowerCase();
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function containsToken(haystack: string, needle: string): boolean {
  if (!haystack || !needle) return false;
  return haystack.includes(needle) || needle.includes(haystack);
}

function scoreCategory(offered: Item, requested: Item): number {
  const offeredCategory = normalize(offered.category);
  const requestedCategory = normalize(requested.category);
  const offeredSubcategory = normalize(offered.subcategorySlug);
  const requestedSubcategory = normalize(requested.subcategorySlug);

  if (offeredCategory && offeredCategory === requestedCategory) return 1;
  if (offeredSubcategory && requestedSubcategory && offeredSubcategory === requestedSubcategory) return 0.9;
  if (containsToken(offeredCategory, requestedCategory)) return 0.65;
  return 0.25;
}

function scoreWishlist(offered: Item, requested: Item): number {
  const offeredText = [offered.title, offered.description, offered.category, offered.subcategorySlug]
    .map(normalize)
    .join(" ");
  const requestedWishlist = normalize(requested.wishlist);
  const requestedTitle = normalize(requested.title);

  if (requestedWishlist && containsToken(offeredText, requestedWishlist)) return 1;
  if (requestedTitle && containsToken(offeredText, requestedTitle)) return 0.75;
  if (requestedWishlist.length > 0) return 0.35;
  return 0.5;
}

function scoreLocation(offered: Item, requested: Item): number {
  const offeredLocation = normalize(offered.location);
  const requestedLocation = normalize(requested.location);

  if (!offeredLocation || !requestedLocation) return 0.5;
  if (offeredLocation === requestedLocation) return 1;
  if (containsToken(offeredLocation, requestedLocation)) return 0.75;
  return 0.45;
}

function scoreIntent(offered: Item, requested: Item): number {
  if (offered.intent === "high_commitment" || requested.intent === "high_commitment") return 1;
  if (offered.intent === "committed" || requested.intent === "committed") return 0.85;
  if (offered.intent === "open" || requested.intent === "open") return 0.7;
  return 0.55;
}

function scoreFlexibility(offered: Item, requested: Item): number {
  if (offered.acceptsBundle || requested.acceptsBundle) return 1;
  if (offered.flexibility === "broad" || requested.flexibility === "broad") return 0.9;
  if (offered.flexibility === "moderate" || requested.flexibility === "moderate") return 0.75;
  if (offered.flexibility === "strict" && requested.flexibility === "strict") return 0.45;
  return 0.6;
}

function scoreMedia(item: Item): number {
  const photoCount = item.photos?.length ?? 0;
  if (photoCount >= 3) return 1;
  if (photoCount >= 1) return 0.75;
  return 0.35;
}

function scoreValue(offered: Item, requested: Item): number {
  if (offered.perceivedValue && requested.perceivedValue && offered.perceivedValue === requested.perceivedValue) return 1;
  if (offered.perceivedValue === "sentimental" || requested.perceivedValue === "sentimental") return 0.7;
  return 0.6;
}

function getItemDomain(item: Item): string {
  if (item.listingType) return normalize(item.listingType);
  if (item.experienceData) return "event";
  if (item.serviceProfile) return "service";
  if (item.houseProfile) return "property";
  return "object";
}

function scoreDomain(offered: Item, requested: Item): number {
  const offeredDomain = getItemDomain(offered);
  const requestedDomain = getItemDomain(requested);
  if (offeredDomain === requestedDomain) return 1;
  const allowed = normalize(requested.wishlist);
  if (allowed && allowed.includes(offeredDomain)) return 0.85;
  return 0.7;
}

function scoreAvailability(offered: Item, requested: Item): number {
  const offeredService = offered.serviceProfile;
  const requestedService = requested.serviceProfile;
  if (offeredService || requestedService) {
    if (offeredService?.delivery === requestedService?.delivery) return 1;
    if (
      offeredService?.delivery === "hybrid" ||
      requestedService?.delivery === "hybrid"
    ) return 0.9;
    return 0.65;
  }

  const offeredEventDate = offered.experienceData?.eventDate;
  const requestedEventDate = requested.experienceData?.eventDate;
  if (offeredEventDate || requestedEventDate) {
    if (!offeredEventDate || !requestedEventDate) return 0.65;
    const diffDays =
      Math.abs(Date.parse(offeredEventDate) - Date.parse(requestedEventDate)) /
      86_400_000;
    if (!Number.isFinite(diffDays)) return 0.55;
    if (diffDays <= 1) return 1;
    if (diffDays <= 14) return 0.85;
    return 0.55;
  }

  return 0.7;
}

function scoreTransferability(offered: Item, requested: Item): number {
  const offeredTransferable = offered.experienceData?.transferable;
  const requestedTransferable = requested.experienceData?.transferable;
  if (offeredTransferable === false || requestedTransferable === false) return 0.25;
  if (offeredTransferable === true || requestedTransferable === true) return 1;
  return 0.7;
}

function scoreFreshness(item: Item, now: Date): number {
  const createdAt = Date.parse(item.createdAt);
  if (Number.isNaN(createdAt)) return 0.5;
  const ageDays = Math.max(0, (now.getTime() - createdAt) / 86_400_000);
  if (ageDays <= 7) return 1;
  if (ageDays <= 30) return 0.85;
  if (ageDays <= 90) return 0.65;
  return 0.45;
}

function tierFromScore(score: number): MatchTier {
  if (score >= 85) return "strong";
  if (score >= 70) return "good";
  if (score >= 50) return "possible";
  return "weak";
}

function buildFactor(
  key: keyof MatchingWeights,
  raw: number,
  weights: MatchingWeights,
  label: string,
): MatchingFactor {
  return {
    key,
    raw: Math.round(clampScore(raw) * 100),
    weighted: Math.round(clampScore(raw) * weights[key] * 100),
    label,
  };
}

function buildReasons(factors: MatchingFactor[]): string[] {
  return factors
    .filter((factor) => factor.raw >= 70)
    .sort((a, b) => b.weighted - a.weighted)
    .slice(0, 4)
    .map((factor) => factor.label);
}

function buildMissing(factors: MatchingFactor[]): string[] {
  return factors
    .filter((factor) => factor.raw < 50)
    .sort((a, b) => a.raw - b.raw)
    .slice(0, 4)
    .map((factor) => factor.label);
}

export function scoreItemPair(
  offered: Item,
  requested: Item,
  options: MatchingOptions = {},
): MatchCandidate {
  const weights = { ...DEFAULT_WEIGHTS, ...options.weights };
  const now = options.now ?? new Date();

  const factors = [
    buildFactor("category", scoreCategory(offered, requested), weights, "Category fit"),
    buildFactor("wishlist", scoreWishlist(offered, requested), weights, "Wishlist fit"),
    buildFactor("location", scoreLocation(offered, requested), weights, "Location compatibility"),
    buildFactor("condition", CONDITION_SCORE[offered.condition] ?? 0.5, weights, "Condition quality"),
    buildFactor("intent", scoreIntent(offered, requested), weights, "Swap intent"),
    buildFactor("flexibility", scoreFlexibility(offered, requested), weights, "Flexibility"),
    buildFactor("media", scoreMedia(offered), weights, "Media completeness"),
    buildFactor("value", scoreValue(offered, requested), weights, "Perceived value"),
    buildFactor("freshness", scoreFreshness(offered, now), weights, "Listing freshness"),
    buildFactor("availability", scoreAvailability(offered, requested), weights, "Availability fit"),
    buildFactor("transferability", scoreTransferability(offered, requested), weights, "Transferability"),
    buildFactor("domain", scoreDomain(offered, requested), weights, "Domain compatibility"),
  ];

  const total = Math.round(factors.reduce((sum, factor) => sum + factor.weighted, 0));
  const reasons = buildReasons(factors);
  const missing = buildMissing(factors);
  const tier = tierFromScore(total);

  return {
    id: `${offered.id}__${requested.id}`,
    itemOffered: offered,
    itemRequested: requested,
    compatibilityScore: total,
    tier,
    reasons,
    reason: reasons[0] ?? "Potential swap candidate",
    matchExplanation: {
      score: total,
      positives: reasons,
      negatives: missing,
      missing,
      alternatives: missing.map((label) => ({
        type: label.includes("Media") ? "add_photos" : "accept_flexible",
        labelKey: label,
        scoreBoost: 5,
      })),
    },
    weightedScore: {
      total,
      factors,
      tooltipLines: factors.map((factor) => `${factor.label}: ${factor.raw}%`),
    },
  };
}

export function generateMatchCandidates(
  sourceItems: Item[],
  candidateItems: Item[],
  options: MatchingOptions = {},
): MatchCandidate[] {
  const maxCandidates = options.maxCandidates ?? 50;

  return sourceItems
    .flatMap((source) =>
      candidateItems
        .filter((candidate) => candidate.ownerId !== source.ownerId)
        .filter((candidate) => candidate.isActive && candidate.status === "active")
        .map((candidate) => scoreItemPair(candidate, source, options)),
    )
    .sort((a, b) => b.compatibilityScore - a.compatibilityScore)
    .slice(0, maxCandidates);
}

export const MATCHING_ENGINE_FACTORS = [
  { key: "category", label: "Category fit", weight: DEFAULT_WEIGHTS.category },
  { key: "wishlist", label: "Wishlist fit", weight: DEFAULT_WEIGHTS.wishlist },
  { key: "location", label: "Location compatibility", weight: DEFAULT_WEIGHTS.location },
  { key: "condition", label: "Condition quality", weight: DEFAULT_WEIGHTS.condition },
  { key: "intent", label: "Swap intent", weight: DEFAULT_WEIGHTS.intent },
  { key: "flexibility", label: "Flexibility", weight: DEFAULT_WEIGHTS.flexibility },
  { key: "media", label: "Media completeness", weight: DEFAULT_WEIGHTS.media },
  { key: "value", label: "Perceived value", weight: DEFAULT_WEIGHTS.value },
  { key: "freshness", label: "Listing freshness", weight: DEFAULT_WEIGHTS.freshness },
  { key: "availability", label: "Availability fit", weight: DEFAULT_WEIGHTS.availability },
  { key: "transferability", label: "Transferability", weight: DEFAULT_WEIGHTS.transferability },
  { key: "domain", label: "Domain compatibility", weight: DEFAULT_WEIGHTS.domain },
] as const;
