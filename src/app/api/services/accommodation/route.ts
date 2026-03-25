import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/service";

/**
 * GET /api/services/accommodation?country=XX
 *
 * Returns accommodation services for a country: regional first, then global.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const country = (searchParams.get("country") || "US").toUpperCase();

  const supabase = getServiceSupabase();
  if (!supabase) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  const { data } = await supabase
    .from("services_by_country")
    .select("name, website_url, logo_url, country_code, sort_order")
    .eq("service_type", "accommodation")
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
      isRegional: (s.sort_order ?? 0) >= 10,
    }));

  return NextResponse.json({ services });
}
