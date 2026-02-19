/**
 * Matching algorithm — computes compatibility scores between items.
 * Pure functions extracted from state.tsx for testability and modularity.
 */
import type { Item, MatchCandidate, MatchTier } from "../types";
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

// ── Main matching function ──

export function computeMatchesForUser(userId: string, items: Item[]): MatchCandidate[] {
  const myItems = items.filter(
    (item) => item.ownerId === userId && item.isActive && item.status === "active",
  );
  const otherItems = items.filter(
    (item) => item.ownerId !== userId && item.isActive && item.status === "active",
  );

  const candidates: MatchCandidate[] = [];

  for (const offered of myItems) {
    for (const requested of otherItems) {
      // Hard filters
      const wantRequested = wishlistMatchesCategory(offered.wishlist, requested.category);
      const theyWantOffered = wishlistMatchesCategory(requested.wishlist, offered.category);
      const eitherFlexBroad = offered.flexibility === "broad" || requested.flexibility === "broad";

      if (!wantRequested && !theyWantOffered && !eitherFlexBroad) continue;

      // Soft signals (cumulative scoring)
      let score = 0;
      const reasons: string[] = [];

      // 1. Category / wishlist match (max 30)
      if (wantRequested && theyWantOffered) {
        score += 30;
        reasons.push("Categorii reciproc compatibile");
      } else if (wantRequested) {
        score += 20;
        reasons.push(`Wishlist-ul tau indica „${requested.category}"`);
      } else if (theyWantOffered) {
        score += 20;
        reasons.push(`Partenerul cauta „${offered.category}"`);
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
      } else if (valDiff >= 2) {
        reasons.push("Diferenta mare de valoare perceputa");
      }

      // 5. Location match (max 10)
      const locA = normalizeMatchText(offered.location);
      const locB = normalizeMatchText(requested.location);
      if (locA && locA === locB) {
        score += 10;
        reasons.push("Aceeasi locatie — logistica simpla");
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
      });
    }
  }

  return candidates.sort((a, b) => b.compatibilityScore - a.compatibilityScore);
}
