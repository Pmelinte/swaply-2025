import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/service";

/**
 * GET /api/services/couriers?country=XX[&country2=YY]
 *
 * Returns couriers for the given country code(s):
 * 1. Domestic couriers for country=XX
 * 2. If country2 is provided (cross-border swap), domestic couriers for both
 * 3. International couriers (global) always included
 * 4. Sorted: domestic first, then international
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const country = searchParams.get("country")?.toUpperCase();
  const country2 = searchParams.get("country2")?.toUpperCase();

  const supabase = getServiceSupabase();
  if (!supabase) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  // Build list of country codes to query domestic couriers for
  const countryCodes = new Set<string>();
  if (country) countryCodes.add(country);
  if (country2) countryCodes.add(country2);

  // Fetch domestic couriers for requested countries
  let domesticCouriers: CourierRow[] = [];
  if (countryCodes.size > 0) {
    const { data } = await supabase
      .from("services_by_country")
      .select("name, website_url, logo_url, country_code, sort_order")
      .eq("service_type", "courier_domestic")
      .in("country_code", [...countryCodes])
      .eq("is_active", true)
      .order("sort_order", { ascending: true });
    domesticCouriers = (data ?? []) as CourierRow[];
  }

  // Fetch international couriers (pick from first country or any)
  const intlCountry = country || [...countryCodes][0] || "US";
  const { data: intlData } = await supabase
    .from("services_by_country")
    .select("name, website_url, logo_url, country_code, sort_order")
    .eq("service_type", "courier_international")
    .eq("country_code", intlCountry)
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  const internationalCouriers = (intlData ?? []) as CourierRow[];

  // Deduplicate by name (domestic takes priority over international)
  const seen = new Set<string>();
  const result: CourierResult[] = [];

  for (const c of domesticCouriers) {
    if (!seen.has(c.name)) {
      seen.add(c.name);
      result.push({
        name: c.name,
        websiteUrl: c.website_url,
        logoUrl: c.logo_url,
        countryCode: c.country_code,
        type: "domestic",
      });
    }
  }

  for (const c of internationalCouriers) {
    if (!seen.has(c.name)) {
      seen.add(c.name);
      result.push({
        name: c.name,
        websiteUrl: c.website_url,
        logoUrl: c.logo_url,
        countryCode: null,
        type: "international",
      });
    }
  }

  return NextResponse.json({ couriers: result });
}

interface CourierRow {
  name: string;
  website_url: string;
  logo_url: string | null;
  country_code: string;
  sort_order: number;
}

interface CourierResult {
  name: string;
  websiteUrl: string;
  logoUrl: string | null;
  countryCode: string | null;
  type: "domestic" | "international";
}
