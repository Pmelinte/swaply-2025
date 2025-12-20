import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: false, error: "not_authenticated" }, { status: 401 });
  }

  const { data: wishlist } = await supabase
    .from("wishlist")
    .select("*")
    .eq("user_id", user.id);

  const { data: profile } = await supabase
    .from("profiles")
    .select("location")
    .eq("user_id", user.id)
    .maybeSingle();

  const { data: items, error } = await supabase
    .from("items")
    .select("id,title,category,subcategory,condition,location_city,location_country,approximate_value,currency,images,user_id")
    .eq("is_active", true)
    .neq("user_id", user.id)
    .limit(200);

  if (error) {
    return NextResponse.json({ ok: false, error: "db_error" }, { status: 500 });
  }

  const locationHint = (profile?.location ?? "").toLowerCase();

  const scored = (items ?? []).map((item: any) => {
    let bestScore = 0;
    let bestWish = null as any;

    for (const entry of wishlist ?? []) {
      let score = 0;
      if (entry.category && item.category === entry.category) score += 0.4;
      if (entry.subcategory && item.subcategory === entry.subcategory) score += 0.3;
      if (entry.condition && item.condition === entry.condition) score += 0.1;

      const itemLocation = `${item.location_city ?? ""} ${item.location_country ?? ""}`.toLowerCase();
      if (locationHint && itemLocation && itemLocation.includes(locationHint)) {
        score += 0.1;
      } else if (itemLocation) {
        score += 0.05;
      }

      if (typeof item.approximate_value === "number") {
        const min = entry.price_min ?? null;
        const max = entry.price_max ?? null;
        if (min !== null && max !== null && item.approximate_value >= min && item.approximate_value <= max) {
          score += 0.1;
        }
      }

      const popularity = 0.1; // placeholder
      score += popularity;

      if (score > bestScore) {
        bestScore = score;
        bestWish = entry;
      }
    }

    return {
      item,
      score: Number(bestScore.toFixed(2)),
      wishlistId: bestWish?.id ?? null,
    };
  });

  scored.sort((a, b) => b.score - a.score);

  return NextResponse.json({ ok: true, matches: scored.slice(0, 50) });
}
