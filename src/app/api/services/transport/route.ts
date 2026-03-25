import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/service";

/**
 * GET /api/services/transport?country=XX&partnerCountry=YY
 *
 * Returns transport services: national for both countries + global.
 * Sorted: national first (sort_order >= 10), then global.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const country = searchParams.get("country")?.toUpperCase();
  const partnerCountry = searchParams.get("partnerCountry")?.toUpperCase();

  const supabase = getServiceSupabase();
  if (!supabase) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  const countryCodes = new Set<string>();
  if (country) countryCodes.add(country);
  if (partnerCountry) countryCodes.add(partnerCountry);

  const queryCountry = country || "US";
  const { data } = await supabase
    .from("services_by_country")
    .select("name, website_url, logo_url, country_code, sort_order")
    .eq("service_type", "transport")
    .eq("is_active", true)
    .in("country_code", countryCodes.size > 0 ? [...countryCodes] : [queryCountry])
    .order("sort_order", { ascending: true });

  const services = (data ?? []).map((s) => ({
    name: s.name,
    websiteUrl: s.website_url,
    logoUrl: s.logo_url,
    countryCode: s.country_code,
    isNational: (s.sort_order ?? 0) >= 10,
  }));

  // Deduplicate by name (keep first occurrence)
  const seen = new Set<string>();
  const unique = services.filter((s) => {
    if (seen.has(s.name)) return false;
    seen.add(s.name);
    return true;
  });

  return NextResponse.json({ services: unique });
}
