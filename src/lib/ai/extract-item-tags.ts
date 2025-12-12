// src/lib/ai/extract-item-tags.ts

export type AiLabel = {
  label: string;
  confidence?: number | null; // score/probability if available
};

export type ExtractItemTagsInput = {
  primaryLabel?: string | null;
  labels?: AiLabel[] | null; // top labels from AI
  locale?: string | null; // "ro" | "en" etc. (MVP)
  maxTags?: number; // default 6
};

/**
 * Normalize string:
 * - lowercase
 * - strip diacritics
 * - keep letters/numbers/spaces/hyphen
 * - collapse spaces
 */
function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function uniqKeepOrder(arr: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const x of arr) {
    if (!x) continue;
    if (seen.has(x)) continue;
    seen.add(x);
    out.push(x);
  }
  return out;
}

/**
 * Stopwords / junk tags (MVP)
 */
const STOP = new Set([
  "object",
  "item",
  "thing",
  "product",
  "goods",
  "misc",
  "other",
  "background",
  "indoor",
  "outdoor",
  "no person",
  "nobody",
  "person",
  "people",
  "man",
  "woman",
  "human",
  "photo",
  "image",
  "picture",
  "snapshot",
  "illustration",
  "art",
  "design",
  "pattern",
  "text",
  "label",
  "logo",
]);

/**
 * Tiny RO hints: not full translation, just nicer tags for common labels.
 */
const RO_HINTS: Record<string, string> = {
  bicycle: "bicicleta",
  bike: "bicicleta",
  laptop: "laptop",
  notebook: "laptop",
  phone: "telefon",
  smartphone: "telefon",
  sofa: "canapea",
  couch: "canapea",
  chair: "scaun",
  table: "masa",
  television: "televizor",
  tv: "televizor",
  headphones: "casti",
  headset: "casti",
  camera: "camera",
  shoes: "incaltaminte",
  sneaker: "incaltaminte",
  sneakers: "incaltaminte",
};

function toLocaleTag(raw: string, locale: string): string {
  const n = normalize(raw);
  if (!n) return "";
  if (locale.startsWith("ro")) return RO_HINTS[n] ?? n;
  return n;
}

/**
 * Split label into tokens (for labels like "digital camera", "sports car", etc.)
 * Keep tokens that are meaningful.
 */
function tokensFromLabel(label: string): string[] {
  const n = normalize(label);
  if (!n) return [];
  // Keep full phrase too, but prioritize tokens
  const tokens = n.split(" ").filter(Boolean);
  const out: string[] = [];

  // include full phrase if short
  if (n.length <= 24 && tokens.length <= 3) out.push(n);

  for (const t of tokens) {
    if (t.length < 3) continue;
    out.push(t);
  }

  return out;
}

export function extractItemTags(input: ExtractItemTagsInput): string[] {
  const locale = (input.locale ?? "ro").toLowerCase();
  const maxTags = Math.max(1, Math.min(input.maxTags ?? 6, 12));

  const rawCandidates: string[] = [];

  if (input.primaryLabel) {
    rawCandidates.push(input.primaryLabel);
  }

  for (const l of input.labels ?? []) {
    if (!l?.label) continue;
    rawCandidates.push(l.label);
  }

  // Turn into token candidates
  let candidates: string[] = [];
  for (const c of rawCandidates) {
    candidates.push(...tokensFromLabel(c));
  }

  // Localize lightly + clean
  candidates = candidates.map((c) => toLocaleTag(c, locale));

  // Remove junk / stopwords
  candidates = candidates.filter((c) => c && !STOP.has(c));

  // De-dup
  candidates = uniqKeepOrder(candidates);

  // Prefer primary-ish terms: keep earlier ones first (already ordered)
  // Cap to maxTags
  return candidates.slice(0, maxTags);
}