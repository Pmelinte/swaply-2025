/**
 * Matching algorithm — computes compatibility scores between items.
 * Pure functions extracted from state.tsx for testability and modularity.
 *
 * v2: Enhanced with distance calculation, logistics matching, deal-breakers,
 *     and structured match explanations ("De ce ți-l arăt?").
 */
import type { Item, MatchCandidate, MatchTier, UserProfile } from "../types";
import { getAllKeywords, areSiblingCategories } from "../categories";

// ── Category keyword map for wishlist matching ──

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  "Electronică": [
    "electronica", "electronic", "tech", "laptop", "pc", "calculator",
    "monitor", "tastatura", "keyboard", "casti", "headphones", "telefon",
    "phone", "tablet", "console", "gaming", "ssd",
  ],
  "Sport & Outdoor": [
    "sport", "outdoor", "bicicleta", "bike", "scooter", "camping",
    "cort", "tent", "hiking", "rucsac", "backpack", "yoga",
    "fitness", "running", "pantofi", "shoes",
  ],
  "Hobby & Jocuri": [
    "hobby", "joc", "jocuri", "boardgame", "board game", "puzzle",
    "lego", "sah", "chess", "chitara", "guitar", "pictura",
    "painting", "drone", "telescope",
  ],
  "Cărți & Media": [
    "carti", "carte", "books", "book", "manga", "comics",
    "vinyl", "dvd", "media", "colectie", "collection",
  ],
  "Casă & Grădină": [
    "casa", "home", "gradina", "garden", "unelte", "tools",
    "bucatarie", "kitchen", "lampa", "lamp", "aspirator",
    "vacuum", "planta", "plant", "decor",
  ],
  "Modă & Accesorii": [
    "moda", "fashion", "accesorii", "accessories", "rucsac",
    "backpack", "ceas", "watch", "geaca", "jacket", "ochelari",
    "sunglasses", "geanta", "bag", "piele", "leather",
  ],
};

function normalizeMatchText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function wishlistMatchesCategory(wishlist: string, category: string) {
  const normalizedWishlist = normalizeMatchText(wishlist);
  const normalizedCategory = normalizeMatchText(category);
  if (!normalizedWishlist.trim()) return false;
  if (normalizedWishlist.includes(normalizedCategory)) return true;

  const taxonomyKeywords = getAllKeywords(category);
  if (taxonomyKeywords.length > 0) {
    return taxonomyKeywords.some((kw) => normalizedWishlist.includes(normalizeMatchText(kw)));
  }

  const keywords = CATEGORY_KEYWORDS[category] ?? [];
  return keywords.some((keyword) => normalizedWishlist.includes(normalizeMatchText(keyword)));
}

// ── Intent compatibility matrix ──

const INTENT_COMPAT: Record<string, Record<string, number>> = {
  explore:         { explore: 5, open: 8, committed: 2, high_commitment: 0 },
  open:            { explore: 8, open: 10, committed: 8, high_commitment: 4 },
  committed:       { explore: 2, open: 8, committed: 12, high_commitment: 10 },
  high_commitment: { explore: 0, open: 4, committed: 10, high_commitment: 15 },
};

// ── Score tier thresholds ──

export function scoreTier(score: number): MatchTier {
  if (score >= 85) return "strong";
  if (score >= 70) return "good";
  if (score >= 40) return "possible";
  return "weak";
}

// ── Haversine distance (km) ──

export function haversineDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number,
): number {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// ── User profile lookup for matching context ──

export interface MatchingUserContext {
  coordinates?: { lat: number; lng: number };
  travelRadiusKm: number;
  logistics: "in_person" | "courier" | "flexible";
  blockedUsers: string[];
}

export function buildUserContext(
  profile: UserProfile | null,
  blockedUsers: string[] = [],
): MatchingUserContext {
  return {
    coordinates: profile?.location?.coordinates,
    travelRadiusKm: profile?.location?.travelRadiusKm ?? 50,
    logistics: profile?.swapPreferences?.logistics ?? "flexible",
    blockedUsers,
  };
}

// ── Item owner coordinates map (populated externally) ──

export type OwnerCoordinatesMap = Map<string, { lat: number; lng: number }>;

// ── Match explanation ──

export interface MatchReason {
  icon: string;
  label: string;
  detail: string;
}

// ── Main matching function (enhanced) ──

export function computeMatchesForUser(
  userId: string,
  items: Item[],
  userContext?: MatchingUserContext,
  ownerCoords?: OwnerCoordinatesMap,
): MatchCandidate[] {
  const myItems = items.filter(
    (item) => item.ownerId === userId && item.isActive && item.status === "active",
  );
  const blocked = new Set(userContext?.blockedUsers ?? []);
  const otherItems = items.filter(
    (item) =>
      item.ownerId !== userId &&
      item.isActive &&
      item.status === "active" &&
      !blocked.has(item.ownerId),
  );

  const candidates: MatchCandidate[] = [];

  // Pre-compute wishlist category sets for O(1) lookup
  const myWishlistCats = new Map<string, Set<string>>();
  for (const offered of myItems) {
    const cats = new Set<string>();
    for (const cat of Object.keys(CATEGORY_KEYWORDS)) {
      if (wishlistMatchesCategory(offered.wishlist, cat)) cats.add(cat);
    }
    myWishlistCats.set(offered.id, cats);
  }

  // Pre-filter: bucket other items by category for faster lookup
  const otherByCategory = new Map<string, Item[]>();
  for (const item of otherItems) {
    const list = otherByCategory.get(item.category) ?? [];
    list.push(item);
    otherByCategory.set(item.category, list);
  }

  for (const offered of myItems) {
    for (const requested of otherItems) {
      // Hard filters
      const wantRequested = myWishlistCats.get(offered.id)?.has(requested.category) ??
        wishlistMatchesCategory(offered.wishlist, requested.category);
      const theyWantOffered = wishlistMatchesCategory(requested.wishlist, offered.category);
      const eitherFlexBroad = offered.flexibility === "broad" || requested.flexibility === "broad";

      if (!wantRequested && !theyWantOffered && !eitherFlexBroad) continue;

      // Early distance rejection: skip items beyond 3x travel radius when coords available
      const maxRadius = userContext?.travelRadiusKm ?? 50;
      const myCoordsFast = userContext?.coordinates;
      const theirCoordsFast = ownerCoords?.get(requested.ownerId);
      if (myCoordsFast && theirCoordsFast) {
        const quickDist = haversineDistance(
          myCoordsFast.lat, myCoordsFast.lng,
          theirCoordsFast.lat, theirCoordsFast.lng,
        );
        if (quickDist > maxRadius * 3) continue;
      }

      // Soft signals (cumulative scoring)
      let score = 0;
      const reasons: string[] = [];
      const explanations: MatchReason[] = [];

      // 1. Category / wishlist match (max 30)
      if (wantRequested && theyWantOffered) {
        score += 30;
        reasons.push("Categorii reciproc compatibile");
        explanations.push({
          icon: "🎯",
          label: "Match reciproc",
          detail: `Ambii căutați ce oferă celălalt (${offered.category} ↔ ${requested.category})`,
        });
      } else if (wantRequested) {
        score += 20;
        reasons.push(`Wishlist-ul tau indica „${requested.category}"`);
        explanations.push({
          icon: "🔍",
          label: "Cauți asta",
          detail: `Wishlist-ul tău include „${requested.category}"`,
        });
      } else if (theyWantOffered) {
        score += 20;
        reasons.push(`Partenerul cauta „${offered.category}"`);
        explanations.push({
          icon: "🤝",
          label: "Te caută",
          detail: `Partenerul caută „${offered.category}" pe care o ai`,
        });
      } else if (eitherFlexBroad) {
        score += 8;
        reasons.push("Flexibilitate larga permite explorare");
      }

      // 2. Intent compatibility (max 15)
      const myIntent = offered.intent ?? "open";
      const theirIntent = requested.intent ?? "open";
      const intentScore = INTENT_COMPAT[myIntent]?.[theirIntent] ?? 5;
      score += intentScore;
      if (intentScore >= 10) {
        reasons.push("Intentii de schimb compatibile");
      } else if (intentScore <= 2) {
        reasons.push("Asteptari diferite de angajament");
      }

      // 3. Flexibility bonus (max 10)
      const flexMap = { strict: 0, moderate: 4, broad: 10 } as const;
      const flexA = flexMap[offered.flexibility ?? "moderate"] ?? 4;
      const flexB = flexMap[requested.flexibility ?? "moderate"] ?? 4;
      const flexBonus = Math.round((flexA + flexB) / 2);
      score += flexBonus;
      if (flexBonus >= 7) {
        reasons.push("Ambele parti sunt flexibile");
      }

      // 4. Perceived value proximity (max 15)
      const valOrder = { small: 1, medium: 2, large: 3, sentimental: 2 } as const;
      const valA = valOrder[offered.perceivedValue ?? "medium"] ?? 2;
      const valB = valOrder[requested.perceivedValue ?? "medium"] ?? 2;
      const valDiff = Math.abs(valA - valB);
      const valBonus = valDiff === 0 ? 15 : valDiff === 1 ? 8 : 2;
      score += valBonus;
      if (valDiff === 0) {
        reasons.push("Valoare perceputa apropiata");
        explanations.push({
          icon: "⚖️",
          label: "Valoare similară",
          detail: "Obiectele au valoare percepută apropiată",
        });
      } else if (valDiff >= 2) {
        reasons.push("Diferenta mare de valoare perceputa");
      }

      // 5. Location / Distance (max 15 — upgraded from 10)
      let distanceKm: number | undefined;
      const locA = normalizeMatchText(offered.location);
      const locB = normalizeMatchText(requested.location);

      // Try GPS distance first
      const myCoords = userContext?.coordinates;
      const theirCoords = ownerCoords?.get(requested.ownerId);

      if (myCoords && theirCoords) {
        distanceKm = Math.round(haversineDistance(
          myCoords.lat, myCoords.lng,
          theirCoords.lat, theirCoords.lng,
        ));
        const maxRadius = userContext?.travelRadiusKm ?? 50;

        if (distanceKm <= 5) {
          score += 15;
          reasons.push(`La ${distanceKm} km — foarte aproape`);
          explanations.push({
            icon: "📍",
            label: `${distanceKm} km distanță`,
            detail: "Foarte aproape — întâlnire ușoară",
          });
        } else if (distanceKm <= 15) {
          score += 12;
          reasons.push(`La ${distanceKm} km — aproape`);
          explanations.push({
            icon: "📍",
            label: `${distanceKm} km distanță`,
            detail: "Suficient de aproape pentru întâlnire personală",
          });
        } else if (distanceKm <= maxRadius) {
          score += 8;
          reasons.push(`La ${distanceKm} km — în raza ta de ${maxRadius} km`);
          explanations.push({
            icon: "📍",
            label: `${distanceKm} km distanță`,
            detail: `În raza ta de ${maxRadius} km`,
          });
        } else if (distanceKm <= maxRadius * 2) {
          score += 3;
          reasons.push(`La ${distanceKm} km — depășește raza cu puțin`);
        }
        // Beyond 2x radius: no distance bonus
      } else if (locA && locA === locB) {
        // Fallback: exact city name match
        score += 12;
        reasons.push("Aceeasi locatie — logistica simpla");
        explanations.push({
          icon: "📍",
          label: "Același oraș",
          detail: "Logistica simplificată — același oraș",
        });
      }

      // 6. Bundle compatibility (max 5)
      if (offered.acceptsBundle && requested.acceptsBundle) {
        score += 5;
        reasons.push("Ambii accepta pachet de obiecte");
      }

      // 6b. Subcategory proximity bonus (max 5)
      if (areSiblingCategories(offered.category, requested.category)) {
        score += 5;
        reasons.push("Subcategorii inrudite");
      }

      // 7. Tags overlap (max 10)
      const tagsA = new Set([...(offered.userFinalTags ?? []), ...(offered.aiSuggestedTags ?? [])]);
      const tagsB = new Set([...(requested.userFinalTags ?? []), ...(requested.aiSuggestedTags ?? [])]);
      let tagOverlap = 0;
      for (const t of tagsA) if (tagsB.has(t)) tagOverlap++;
      const tagBonus = Math.min(10, tagOverlap * 3);
      score += tagBonus;
      if (tagOverlap >= 2) {
        reasons.push(`${tagOverlap} taguri comune`);
      }

      // 8. Sentimental / recipient matters (max 5)
      if (offered.perceivedValue === "sentimental" || requested.perceivedValue === "sentimental") {
        if (offered.recipientMatters || requested.recipientMatters) {
          score += 5;
          reasons.push("Schimb cu valoare sentimentala — destinatarul conteaza");
        }
      }

      // Cap at 100
      score = Math.min(100, score);
      const tier = scoreTier(score);

      candidates.push({
        id: `match_${offered.id}_${requested.id}`,
        itemOffered: offered,
        itemRequested: requested,
        compatibilityScore: score,
        tier,
        reasons,
        reason: reasons.slice(0, 3).join(". ") + ".",
        manualFallbackReason: "Analiza calculata local (scor cumulativ).",
        // Enhanced fields
        distanceKm,
        explanations: explanations.length > 0 ? explanations : undefined,
      });
    }
  }

  return candidates.sort((a, b) => b.compatibilityScore - a.compatibilityScore);
}
