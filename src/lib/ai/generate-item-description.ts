// src/lib/ai/generate-item-description.ts

import type { CategoryTreeNode } from "@/types/category";

export type GenerateItemDescriptionInput = {
  title?: string | null;
  primaryLabel?: string | null;
  category?: CategoryTreeNode | null;
  subcategory?: CategoryTreeNode | null;
  tags?: string[] | null;
  condition?: string | null; // ex: "new" | "good" | "used" etc. (optional)
  locale?: string | null; // "ro" | "en" etc. (MVP focus: ro/en)
};

/**
 * Small helpers
 */
function clean(s: string): string {
  return s.trim().replace(/\s+/g, " ");
}

function cap(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function joinTags(tags: string[], max = 5): string {
  const t = (tags ?? []).map(clean).filter(Boolean);
  if (t.length === 0) return "";
  return t.slice(0, max).join(", ");
}

function normalizeLocale(locale: string | null | undefined): "ro" | "en" {
  const l = (locale ?? "ro").toLowerCase();
  return l.startsWith("ro") ? "ro" : "en";
}

function normalizeCondition(condition: string | null | undefined, locale: "ro" | "en"): string | null {
  if (!condition) return null;

  const c = condition.toLowerCase();

  // Very small normalization
  const mapRo: Record<string, string> = {
    new: "nou",
    like_new: "ca nou",
    excellent: "excelentă",
    very_good: "foarte bună",
    good: "bună",
    fair: "acceptabilă",
    used: "folosit",
  };

  const mapEn: Record<string, string> = {
    new: "new",
    like_new: "like new",
    excellent: "excellent",
    very_good: "very good",
    good: "good",
    fair: "fair",
    used: "used",
  };

  return locale === "ro" ? (mapRo[c] ?? c) : (mapEn[c] ?? c);
}

/**
 * Generate a short, neutral description (2–3 sentences).
 * No marketing, no lies, no assumptions beyond what we know.
 */
export function generateItemDescription(input: GenerateItemDescriptionInput): string {
  const locale = normalizeLocale(input.locale);
  const title = clean(input.title ?? "");
  const cat = clean(input.category?.name ?? "");
  const sub = clean(input.subcategory?.name ?? "");
  const tags = (input.tags ?? []).map((t) => clean(t)).filter(Boolean);

  const condition = normalizeCondition(input.condition, locale);

  // Pick a "what is it" phrase
  const what =
    title ||
    sub ||
    cat ||
    clean(input.primaryLabel ?? "") ||
    (locale === "ro" ? "Obiect" : "Item");

  if (locale === "ro") {
    const parts: string[] = [];

    // Sentence 1: what + category
    if (sub && cat) {
      parts.push(`${cap(what)} (${sub}, categoria ${cat}).`);
    } else if (sub) {
      parts.push(`${cap(what)} (${sub}).`);
    } else if (cat) {
      parts.push(`${cap(what)} (categoria ${cat}).`);
    } else {
      parts.push(`${cap(what)}.`);
    }

    // Sentence 2: condition (if any)
    if (condition) {
      // "Stare: bună." / "Stare: ca nou."
      parts.push(`Stare: ${condition}.`);
    }

    // Sentence 3: tags (if any)
    const tagLine = joinTags(tags, 5);
    if (tagLine) {
      parts.push(`Etichete: ${tagLine}.`);
    }

    // Keep it short: max 3 sentences
    return parts.slice(0, 3).join(" ");
  }

  // EN
  {
    const parts: string[] = [];

    if (sub && cat) {
      parts.push(`${cap(what)} (${sub}, under ${cat}).`);
    } else if (sub) {
      parts.push(`${cap(what)} (${sub}).`);
    } else if (cat) {
      parts.push(`${cap(what)} (category: ${cat}).`);
    } else {
      parts.push(`${cap(what)}.`);
    }

    if (condition) {
      parts.push(`Condition: ${condition}.`);
    }

    const tagLine = joinTags(tags, 5);
    if (tagLine) {
      parts.push(`Tags: ${tagLine}.`);
    }

    return parts.slice(0, 3).join(" ");
  }
}