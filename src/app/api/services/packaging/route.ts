import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/service";

/**
 * Packaging recommendations per item category.
 * Maps category keywords to packaging advice.
 */
const CATEGORY_RECOMMENDATIONS: Record<string, { messageKey: string; keywords: string[] }> = {
  electronics: {
    messageKey: "packagingElectronics",
    keywords: ["electronics", "tech", "computer", "phone", "tablet", "laptop", "camera", "gaming"],
  },
  books: {
    messageKey: "packagingBooks",
    keywords: ["books", "book", "magazine", "comic", "manga"],
  },
  fashion: {
    messageKey: "packagingFashion",
    keywords: ["fashion", "clothing", "clothes", "shoes", "accessories", "bag", "watch"],
  },
  art: {
    messageKey: "packagingArt",
    keywords: ["art", "painting", "poster", "print", "frame", "sculpture"],
  },
  sports: {
    messageKey: "packagingSports",
    keywords: ["sports", "sport", "fitness", "outdoor", "bicycle", "bike"],
  },
  music: {
    messageKey: "packagingMusic",
    keywords: ["music", "instrument", "guitar", "piano", "vinyl", "record"],
  },
};

function detectCategory(category?: string): string | null {
  if (!category) return null;
  const lower = category.toLowerCase();
  for (const [key, config] of Object.entries(CATEGORY_RECOMMENDATIONS)) {
    if (config.keywords.some((kw) => lower.includes(kw))) return key;
  }
  return null;
}

/**
 * GET /api/services/packaging?country=XX&category=electronics
 *
 * Returns packaging suppliers for a country + category-specific recommendation.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const country = (searchParams.get("country") || "US").toUpperCase();
  const category = searchParams.get("category") || undefined;

  const supabase = getServiceSupabase();
  if (!supabase) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  const { data } = await supabase
    .from("services_by_country")
    .select("name, website_url, logo_url, country_code, sort_order")
    .eq("service_type", "packaging")
    .eq("country_code", country)
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  const seen = new Set<string>();
  const services = (data ?? [])
    .filter((s) => {
      if (seen.has(s.name)) return false;
      seen.add(s.name);
      return true;
    })
    .map((s) => ({
      name: s.name,
      websiteUrl: s.website_url,
      logoUrl: s.logo_url,
      isLocal: (s.sort_order ?? 0) >= 10,
    }));

  // Category-specific recommendation
  const detectedCategory = detectCategory(category);
  const recommendation = detectedCategory
    ? CATEGORY_RECOMMENDATIONS[detectedCategory].messageKey
    : null;

  return NextResponse.json({ services, recommendation, detectedCategory });
}
