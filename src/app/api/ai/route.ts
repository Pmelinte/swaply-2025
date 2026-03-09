import { NextResponse } from "next/server";
import { CATEGORIES_TAXONOMY, CATEGORY_NAMES } from "@/lib/categories";
import { rateLimit } from "@/lib/rate-limit";
import { aiClassifySchema, validateBody } from "@/lib/validation";
import { requestLogger } from "@/lib/logger";
import { getFeatureFlag } from "@/lib/feature-flags";

const CATEGORIES = CATEGORY_NAMES;

const TAG_CANDIDATES = [
  "tech", "gaming", "audio", "video", "laptop", "phone", "tablet", "monitor",
  "sport", "outdoor", "camping", "hiking", "fitness", "bike", "running",
  "lego", "puzzle", "boardgame", "music", "guitar", "art", "drone",
  "books", "manga", "vinyl", "dvd", "cooking", "education",
  "garden", "tools", "home", "kitchen", "lamp", "decor", "furniture",
  "fashion", "leather", "watch", "sunglasses", "bag", "shoes", "accessories",
  "vintage", "handmade", "eco", "portable", "wireless", "retro",
];

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { allowed } = rateLimit(ip, { limit: 30, windowMs: 60_000 });
  if (!allowed) {
    return NextResponse.json({ status: "error", message: "Prea multe cereri." }, { status: 429 });
  }

  const log = requestLogger(request);
  const body = await request.json().catch(() => ({}));
  const { data: validated, error: validationError } = validateBody(body, aiClassifySchema);
  if (validationError) {
    log.warn("Validation failed", { error: validationError });
    return NextResponse.json({ status: "error", message: validationError }, { status: 400 });
  }
  const { title, description, action, prompt, category, condition } = validated!;

  // AI Description Generator
  if (prompt === "generate_description" && title) {
    const desc = generateDescription(title, category, condition);
    return NextResponse.json({ status: "ok", description: desc });
  }

  const text = [title, description].filter(Boolean).join(". ");
  if (!text) {
    return NextResponse.json({ status: "error", message: "Titlu sau descriere lipsa" });
  }

  const hfKey = process.env.HUGGINGFACE_API_KEY || process.env.HUGGINGFACE_API_TOKEN;
  const hfEnabled = await getFeatureFlag("ai_matching");

  // Fallback: keyword-based matching when HF is not available
  if (!hfKey || !hfEnabled) {
    return NextResponse.json({
      status: "fallback",
      category: keywordCategory(text),
      tags: keywordTags(text),
    });
  }

  const effectiveAction = action || "both";

  try {
    const results: { category?: string; tags?: string[] } = {};

    // Category classification via zero-shot
    if (effectiveAction === "classify" || effectiveAction === "both") {
      const catRes = await fetch(
        "https://api-inference.huggingface.co/models/facebook/bart-large-mnli",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${hfKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            inputs: text,
            parameters: { candidate_labels: CATEGORIES },
          }),
        },
      );
      if (catRes.ok) {
        const catData = await catRes.json();
        results.category = catData.labels?.[0] ?? keywordCategory(text);
      } else {
        results.category = keywordCategory(text);
      }
    }

    // Tag suggestion via zero-shot on tag candidates
    if (effectiveAction === "tags" || effectiveAction === "both") {
      const tagRes = await fetch(
        "https://api-inference.huggingface.co/models/facebook/bart-large-mnli",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${hfKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            inputs: text,
            parameters: {
              candidate_labels: TAG_CANDIDATES,
              multi_label: true,
            },
          }),
        },
      );
      if (tagRes.ok) {
        const tagData = await tagRes.json();
        // Take top 5 tags with score > 0.15
        const labels: string[] = tagData.labels ?? [];
        const scores: number[] = tagData.scores ?? [];
        results.tags = labels
          .filter((_, i) => scores[i] > 0.15)
          .slice(0, 5);
        if (results.tags.length === 0) {
          results.tags = keywordTags(text);
        }
      } else {
        results.tags = keywordTags(text);
      }
    }

    return NextResponse.json({ status: "ok", ...results });
  } catch {
    return NextResponse.json({
      status: "fallback",
      category: keywordCategory(text),
      tags: keywordTags(text),
    });
  }
}

/** Keyword-based category matching using taxonomy — checks subcategories first for precision */
function keywordCategory(text: string): string {
  const t = text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  // First try subcategories (more specific)
  const subcats = CATEGORIES_TAXONOMY.filter((c) => c.level === 1);
  for (const sub of subcats) {
    if (sub.keywords.some((kw) => t.includes(kw))) {
      return sub.name;
    }
  }

  // Then try top-level categories
  const topCats = CATEGORIES_TAXONOMY.filter((c) => c.level === 0);
  for (const cat of topCats) {
    if (cat.keywords.some((kw) => t.includes(kw))) {
      return cat.name;
    }
  }

  return "Hobby & Jocuri"; // default fallback
}

/** Simple keyword-based tag extraction */
function keywordTags(text: string): string[] {
  const t = text.toLowerCase();
  return TAG_CANDIDATES.filter((tag) => t.includes(tag)).slice(0, 5);
}

/** Generate a swap-friendly description from title + metadata */
function generateDescription(title: string, category?: string, condition?: string): string {
  const condDesc = condition === "new" ? "nou, nefolosit" :
    condition === "used" ? "folosit, în stare bună" :
    condition === "good" ? "stare foarte bună" : "stare bună";

  const lines = [
    `${title} — ${condDesc}.`,
    category ? `Categorie: ${category}.` : "",
    "Disponibil pentru schimb cu obiecte similare sau conform listei de dorințe.",
    "Fotografiile reflectă starea actuală a obiectului.",
    "Deschis la propuneri — nu ezita să mă contactezi!",
  ].filter(Boolean);

  return lines.join(" ");
}
