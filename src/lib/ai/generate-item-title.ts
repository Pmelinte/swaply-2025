// src/lib/ai/generate-item-title.ts

import type { CategoryTreeNode } from "@/types/category";

export type GenerateItemTitleInput = {
  primaryLabel?: string | null;
  category?: CategoryTreeNode | null;
  subcategory?: CategoryTreeNode | null;
  locale?: string | null; // "ro" | "en" etc. (MVP: ro/en friendly)
};

/**
 * Capitalize first letter (simple, MVP)
 */
function capitalize(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Normalize label:
 * - trim
 * - collapse spaces
 * - remove weird punctuation at ends
 */
function cleanLabel(label: string): string {
  return label
    .trim()
    .replace(/\s+/g, " ")
    .replace(/^[\W_]+|[\W_]+$/g, "");
}

/**
 * Very small RO-ish dictionary to avoid ugly AI labels.
 * (MVP: not a translator, just a few common ones)
 */
const RO_HINTS: Record<string, string> = {
  bicycle: "Bicicletă",
  bike: "Bicicletă",
  laptop: "Laptop",
  notebook: "Laptop",
  phone: "Telefon",
  smartphone: "Telefon",
  sofa: "Canapea",
  couch: "Canapea",
  chair: "Scaun",
  table: "Masă",
  tv: "Televizor",
  television: "Televizor",
  headphones: "Căști",
  headset: "Căști",
  camera: "Cameră",
  "digital camera": "Cameră",
  shoes: "Încălțăminte",
  sneaker: "Încălțăminte",
  sneakers: "Încălțăminte",
};

function toRo(label: string): string {
  const key = label.toLowerCase();
  return RO_HINTS[key] ?? capitalize(label);
}

/**
 * Generate a short, UI-friendly title.
 * Rules (MVP):
 * - Prefer subcategory name if exists ("Telefoane")
 * - Else prefer mapped/cleaned AI label
 * - If locale is "ro", apply tiny hints map for common labels
 * - Add category name only if it adds meaning and doesn't duplicate
 */
export function generateItemTitle(input: GenerateItemTitleInput): string {
  const locale = (input.locale ?? "ro").toLowerCase();
  const catName = input.category?.name?.trim() || "";
  const subName = input.subcategory?.name?.trim() || "";

  const rawLabel = input.primaryLabel ? cleanLabel(input.primaryLabel) : "";
  const label =
    locale.startsWith("ro") && rawLabel ? toRo(rawLabel) : rawLabel ? capitalize(rawLabel) : "";

  // 1) Best: subcategory name (usually human-friendly)
  if (subName) {
    // Avoid "Telefoane (Electronice)" style spam. Keep it clean.
    return subName;
  }

  // 2) Next: label
  if (label) {
    // If category exists and is not redundant, you can append it.
    // Example: "Laptop" (category: "Electronice") => keep "Laptop"
    // Example: "Masă" (category: "Mobilă") => keep "Masă"
    // We'll only append when label is too generic.
    const generic = new Set(["obiect", "item", "thing", "product", "object"]);
    if (!generic.has(label.toLowerCase())) return label;
  }

  // 3) Fallback: category name
  if (catName) return catName;

  // 4) Last resort
  return locale.startsWith("ro") ? "Obiect" : "Item";
}