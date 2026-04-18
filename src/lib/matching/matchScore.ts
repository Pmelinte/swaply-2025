/**
 * Weighted 9-factor match scoring with semantic similarity (pgvector).
 *
 * Each factor contributes a weighted portion to the final 0-100 score.
 * The semantic factor comes from pgvector cosine similarity (0-1).
 */

import type { Item, UserProfile } from "../types";
import { haversineDistance } from "../state/matching";

// ── Factor weights (must sum to 1.0) ──

export const FACTOR_WEIGHTS = {
  semantic:    0.25,  // pgvector cosine similarity
  category:    0.20,  // same category match
  location:    0.15,  // GPS distance score
  value:       0.15,  // perceived value proximity
  userRating:  0.10,  // user trust/reputation score
  response:    0.05,  // user response rate
  photos:      0.05,  // listing photo completeness
  description: 0.03,  // description quality
  activity:    0.02,  // recent activity signal
} as const;

export type ScoreFactorKey = keyof typeof FACTOR_WEIGHTS;

export interface ScoreFactorResult {
  key: ScoreFactorKey;
  raw: number;       // 0-1 normalized
  weighted: number;  // raw * weight
  label: string;     // human-readable explanation
}

export interface WeightedScoreResult {
  /** Final score 0-100 */
  total: number;
  /** Individual factor breakdowns */
  factors: ScoreFactorResult[];
  /** Tooltip-friendly summary lines */
  tooltipLines: string[];
}

// ── Individual factor calculators ──

/**
 * Semantic similarity from pgvector (0-1 cosine similarity).
 * If not available (no embeddings), falls back to 0.5 (neutral).
 */
function semanticFactor(semanticScore: number | undefined): ScoreFactorResult {
  const raw = typeof semanticScore === "number" ? Math.max(0, Math.min(1, semanticScore)) : 0.5;
  return {
    key: "semantic",
    raw,
    weighted: raw * FACTOR_WEIGHTS.semantic,
    label: raw >= 0.8 ? "Similaritate semantică puternică"
         : raw >= 0.6 ? "Similaritate semantică bună"
         : raw >= 0.4 ? "Similaritate semantică moderată"
         : "Similaritate semantică scăzută",
  };
}

/**
 * Category match: 1.0 if same category, 0.3 otherwise.
 */
function categoryFactor(itemA: Item, itemB: Item): ScoreFactorResult {
  const same = itemA.category === itemB.category;
  const raw = same ? 1.0 : 0.3;
  return {
    key: "category",
    raw,
    weighted: raw * FACTOR_WEIGHTS.category,
    label: same ? "Aceeași categorie" : "Categorii diferite",
  };
}

/**
 * Location/distance score based on GPS coordinates.
 * 0-5km → 1.0, 5-15km → 0.8, 15-50km → 0.5, 50-100km → 0.3, 100+km → 0.1
 */
function locationFactor(
  userA: UserProfile | null,
  userB: UserProfile | null,
): ScoreFactorResult {
  const coordsA = userA?.location?.coordinates;
  const coordsB = userB?.location?.coordinates;

  if (!coordsA || !coordsB) {
    return {
      key: "location",
      raw: 0.3,
      weighted: 0.3 * FACTOR_WEIGHTS.location,
      label: "Locație necunoscută",
    };
  }

  const dist = haversineDistance(coordsA.lat, coordsA.lng, coordsB.lat, coordsB.lng);
  let raw: number;
  let label: string;

  if (dist <= 5) {
    raw = 1.0;
    label = `${Math.round(dist)} km distanță`;
  } else if (dist <= 15) {
    raw = 0.8;
    label = `${Math.round(dist)} km distanță`;
  } else if (dist <= 50) {
    raw = 0.5;
    label = `${Math.round(dist)} km distanță`;
  } else if (dist <= 100) {
    raw = 0.3;
    label = `${Math.round(dist)} km distanță`;
  } else {
    raw = 0.1;
    label = `${Math.round(dist)} km distanță`;
  }

  return { key: "location", raw, weighted: raw * FACTOR_WEIGHTS.location, label };
}

/**
 * Value proximity: how close are perceived values.
 */
function valueFactor(itemA: Item, itemB: Item): ScoreFactorResult {
  const valOrder: Record<string, number> = { small: 1, medium: 2, large: 3, sentimental: 2 };
  const valA = valOrder[itemA.perceivedValue ?? "medium"] ?? 2;
  const valB = valOrder[itemB.perceivedValue ?? "medium"] ?? 2;
  const diff = Math.abs(valA - valB);

  const raw = diff === 0 ? 1.0 : diff === 1 ? 0.6 : 0.2;
  return {
    key: "value",
    raw,
    weighted: raw * FACTOR_WEIGHTS.value,
    label: diff === 0 ? "Valori similare" : diff === 1 ? "Valori apropiate" : "Diferență mare de valoare",
  };
}

/**
 * User trust/reputation score (0-100 → 0-1).
 */
function userRatingFactor(userB: UserProfile | null): ScoreFactorResult {
  // Derive trust score from completion rate + reputation
  const repMap: Record<string, number> = { starter: 30, trusted: 70, ambassador: 95 };
  const repScore = repMap[userB?.stats?.reputation ?? "starter"] ?? 30;
  const completionRate = userB?.completionRate ?? 50;
  const raw = Math.min(1, ((repScore + completionRate) / 2) / 100);
  return {
    key: "userRating",
    raw,
    weighted: raw * FACTOR_WEIGHTS.userRating,
    label: raw >= 0.7 ? "Utilizator de încredere" : raw >= 0.4 ? "Utilizator activ" : "Utilizator nou",
  };
}

/**
 * Response rate (0-100% → 0-1).
 */
function responseFactor(userB: UserProfile | null): ScoreFactorResult {
  const raw = Math.min(1, (userB?.responseRate ?? 50) / 100);
  return {
    key: "response",
    raw,
    weighted: raw * FACTOR_WEIGHTS.response,
    label: raw >= 0.8 ? "Răspunde rapid" : raw >= 0.5 ? "Rata medie de răspuns" : "Răspuns lent",
  };
}

/**
 * Photo completeness: min(photos.length / 5, 1).
 */
function photosFactor(itemB: Item): ScoreFactorResult {
  const photoCount = itemB.photos?.length ?? 0;
  const raw = Math.min(1, photoCount / 5);
  return {
    key: "photos",
    raw,
    weighted: raw * FACTOR_WEIGHTS.photos,
    label: photoCount >= 5 ? "Fotografii complete" : photoCount >= 3 ? "Fotografii suficiente" : "Puține fotografii",
  };
}

/**
 * Description quality score based on length.
 */
function descriptionFactor(itemB: Item): ScoreFactorResult {
  const len = itemB.description?.length ?? 0;
  const raw = len >= 200 ? 1.0 : len >= 100 ? 0.7 : len >= 50 ? 0.4 : 0.1;
  return {
    key: "description",
    raw,
    weighted: raw * FACTOR_WEIGHTS.description,
    label: raw >= 0.7 ? "Descriere detaliată" : raw >= 0.4 ? "Descriere medie" : "Descriere scurtă",
  };
}

/**
 * Recent activity signal based on item creation date.
 */
function activityFactor(itemB: Item): ScoreFactorResult {
  if (!itemB.createdAt) {
    return { key: "activity", raw: 0.5, weighted: 0.5 * FACTOR_WEIGHTS.activity, label: "Activitate necunoscută" };
  }
  const daysSince = (Date.now() - new Date(itemB.createdAt).getTime()) / (1000 * 60 * 60 * 24);
  const raw = daysSince <= 7 ? 1.0 : daysSince <= 30 ? 0.7 : daysSince <= 90 ? 0.4 : 0.1;
  return {
    key: "activity",
    raw,
    weighted: raw * FACTOR_WEIGHTS.activity,
    label: daysSince <= 7 ? "Utilizator activ" : daysSince <= 30 ? "Activ recent" : "Activitate veche",
  };
}

// ── Main scoring function ──

/**
 * Calculate the weighted 9-factor match score.
 *
 * @param itemA        — my item (the item I'm offering)
 * @param itemB        — their item (the item I want)
 * @param userA        — my profile (nullable for guest/mock)
 * @param userB        — their profile (nullable for mock)
 * @param semanticScore — cosine similarity from pgvector (0-1), or undefined if not available
 */
export function calculateMatchScore(
  itemA: Item,
  itemB: Item,
  userA: UserProfile | null,
  userB: UserProfile | null,
  semanticScore?: number,
): WeightedScoreResult {
  const factors: ScoreFactorResult[] = [
    semanticFactor(semanticScore),
    categoryFactor(itemA, itemB),
    locationFactor(userA, userB),
    valueFactor(itemA, itemB),
    userRatingFactor(userB),
    responseFactor(userB),
    photosFactor(itemB),
    descriptionFactor(itemB),
    activityFactor(itemB),
  ];

  const total = Math.round(
    Math.min(100, factors.reduce((sum, f) => sum + f.weighted, 0) * 100),
  );

  // Build tooltip lines from the top contributing factors
  const tooltipLines = factors
    .filter((f) => f.raw >= 0.5)
    .sort((a, b) => b.weighted - a.weighted)
    .slice(0, 4)
    .map((f) => f.label);

  return { total, factors, tooltipLines };
}

/**
 * Score tier based on total score (consistent with existing tier system).
 */
export function weightedScoreTier(score: number): "weak" | "possible" | "good" | "strong" {
  if (score >= 85) return "strong";
  if (score >= 70) return "good";
  if (score >= 40) return "possible";
  return "weak";
}
