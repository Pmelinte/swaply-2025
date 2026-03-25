import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/service";

/**
 * GET /api/subcategories?category=electronics
 *
 * Returns subcategories for a given category slug.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");

  if (!category) {
    return NextResponse.json({ error: "Missing category parameter" }, { status: 400 });
  }

  const supabase = getServiceSupabase();
  if (!supabase) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  const { data, error } = await supabase
    .from("subcategories")
    .select("slug, name_ro, name_en, icon, sort_order, requires_disclaimer, disclaimer_key, extra_fields")
    .eq("category_slug", category)
    .order("sort_order", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ subcategories: data ?? [] });
}
