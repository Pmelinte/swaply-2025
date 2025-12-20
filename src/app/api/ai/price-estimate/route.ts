import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

const BASE_PRICES: Record<string, number> = {
  electronics: 250,
  furniture: 150,
  fashion: 40,
  books: 15,
  sports: 80,
  toys: 35,
  home: 60,
  other: 50,
};

function normalizeCategory(category?: string): string {
  if (!category) return "other";
  const key = category.toLowerCase();
  return BASE_PRICES[key] ? key : "other";
}

function conditionMultiplier(condition?: string): number {
  switch ((condition ?? "").toLowerCase()) {
    case "new":
      return 1.2;
    case "like_new":
    case "very_good":
      return 1.1;
    case "good":
      return 1.0;
    case "fair":
      return 0.8;
    case "poor":
      return 0.6;
    default:
      return 0.9;
  }
}

export async function POST(req: NextRequest) {
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: false, error: "not_authenticated" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const category = normalizeCategory(body?.category);
  const multiplier = conditionMultiplier(body?.condition);
  const base = BASE_PRICES[category] ?? BASE_PRICES.other;

  const eur = Math.round(base * multiplier);
  const ron = Math.round(eur * 5);

  return NextResponse.json({
    ok: true,
    priceEstimateEur: eur,
    priceEstimateRon: ron,
    category,
  });
}
