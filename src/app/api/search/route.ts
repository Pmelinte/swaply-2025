import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase as createServiceClient } from "@/lib/supabase/service";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const query = url.searchParams.get("q") ?? "";
  const category = url.searchParams.get("category") || null;
  const condition = url.searchParams.get("condition") || null;
  const location = url.searchParams.get("location") || null;
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "50", 10), 100);
  const offset = parseInt(url.searchParams.get("offset") ?? "0", 10);

  const supabase = createServiceClient();
  if (!supabase) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  const { data, error } = await supabase.rpc("search_items", {
    query,
    category_filter: category,
    condition_filter: condition,
    location_filter: location,
    max_results: limit,
    offset_val: offset,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ results: data ?? [], total: (data ?? []).length });
}
