// src/lib/ai/map-ai-label-to-category.ts

import type { CategoryTreeNode } from "@/types/category";

/**
 * Rezultatul mapării AI → categorii Swaply
 */
export type AiCategoryMatch = {
  category: CategoryTreeNode;
  subcategory?: CategoryTreeNode;
};

/**
 * Normalizează eticheta AI (lowercase, fără diacritice, trim)
 */
function normalizeLabel(label: string): string {
  return label
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

/**
 * Heuristici simple (MVP):
 * - caută potrivire pe slug sau name (include)
 * - întâi subcategorii, apoi categorii
 */
export function mapAiLabelToCategory(
  primaryLabel: string,
  tree: CategoryTreeNode[],
): AiCategoryMatch | null {
  if (!primaryLabel || !tree?.length) return null;

  const needle = normalizeLabel(primaryLabel);

  // 1) Caută în subcategorii (cea mai specifică potrivire)
  for (const cat of tree) {
    for (const sub of cat.children ?? []) {
      const hay = `${normalizeLabel(sub.slug)} ${normalizeLabel(sub.name)}`;
      if (hay.includes(needle) || needle.includes(normalizeLabel(sub.slug))) {
        return { category: cat, subcategory: sub };
      }
    }
  }

  // 2) Caută în categorii
  for (const cat of tree) {
    const hay = `${normalizeLabel(cat.slug)} ${normalizeLabel(cat.name)}`;
    if (hay.includes(needle) || needle.includes(normalizeLabel(cat.slug))) {
      return { category: cat };
    }
  }

  // 3) Fallback: nimic găsit
  return null;
}