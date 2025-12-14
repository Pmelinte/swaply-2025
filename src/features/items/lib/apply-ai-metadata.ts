// src/features/items/lib/apply-ai-metadata.ts

import type { ItemAiMetadata, ItemFormData } from "../types";
import {
  mapAiLabelsToCategory,
  type AiNormalizedResult,
  type AiNormalizedLabel,
} from "@/lib/categories/ai-label-mapper";

/**
 * Primește valorile curente din formular + metadatele AI
 * și întoarce un "patch" (doar câmpurile care merită actualizate).
 *
 * Nu face setState aici — e un helper pur, testabil.
 */
export function computeItemFormPatchFromAi(
  current: ItemFormData,
  meta: ItemAiMetadata,
): Partial<ItemFormData> {
  const aiResult: AiNormalizedResult = buildAiResultFromMeta(meta);
  const mapping = mapAiLabelsToCategory(aiResult);

  const nextTitle = meta.suggestedTitle ?? current.title;

  const nextCategory =
    mapping.categorySlug || meta.suggestedCategory || current.category || "";

  const nextSubcategory =
    mapping.subcategorySlug ||
    meta.suggestedSubcategory ||
    current.subcategory ||
    "";

  const nextTags = meta.suggestedTags ?? current.tags;

  return {
    aiMetadata: meta,
    title: nextTitle,
    category: nextCategory,
    subcategory: nextSubcategory,
    tags: nextTags,
  };
}

function buildAiResultFromMeta(meta: ItemAiMetadata): AiNormalizedResult {
  const labels: AiNormalizedLabel[] = [];

  if (meta.primaryLabel) {
    labels.push({
      label: meta.primaryLabel,
      confidence: meta.confidence ?? null,
    });
  }

  if (Array.isArray(meta.suggestedTags)) {
    for (const tag of meta.suggestedTags) {
      if (typeof tag === "string" && tag.trim().length > 0) {
        labels.push({
          label: tag.trim(),
          confidence: null,
        });
      }
    }
  }

  return {
    mainLabel: meta.primaryLabel ?? null,
    labels,
    locale: "ro",
    raw: meta,
  };
}