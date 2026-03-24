import { getServerSupabase } from "@/lib/supabase/server";

/**
 * Detect user's country from request headers.
 * Priority: cookie → Vercel header → Cloudflare header → Accept-Language → default
 */
export async function detectUserCountry(request?: Request): Promise<string> {
  // 1. Cookie saved previously
  const cookieHeader = request?.headers.get("cookie") || "";
  const match = cookieHeader.match(/user_country=([A-Z]{2})/);
  if (match) return match[1];

  // 2. Vercel geo header (most accurate in production)
  const vercelCountry = request?.headers.get("x-vercel-ip-country");
  if (vercelCountry && vercelCountry !== "XX") return vercelCountry;

  // 3. Cloudflare geo header
  const cfCountry = request?.headers.get("cf-ipcountry");
  if (cfCountry && cfCountry !== "XX") return cfCountry;

  // 4. Accept-Language fallback
  const acceptLang = request?.headers.get("accept-language");
  if (acceptLang) {
    const country = mapLangToCountry(acceptLang);
    if (country) return country;
  }

  // 5. Neutral default
  return "US";
}

/** Map Accept-Language primary tag to likely country code */
function mapLangToCountry(acceptLang: string): string | null {
  const primary = acceptLang.split(",")[0]?.trim().split(";")[0]?.toLowerCase();
  if (!primary) return null;

  const map: Record<string, string> = {
    ro: "RO", de: "DE", fr: "FR", es: "ES", it: "IT", pt: "PT",
    nl: "NL", pl: "PL", hu: "HU", cs: "CZ", sk: "SK", hr: "HR",
    bg: "BG", el: "GR", uk: "UA", ru: "RU", tr: "TR", ar: "SA",
    zh: "CN", ja: "JP", ko: "KR", hi: "IN", bn: "BD", id: "ID",
    ms: "MY", th: "TH", vi: "VN", sw: "KE", fi: "FI", sv: "SE",
    da: "DK", no: "NO", et: "EE", lt: "LT", sl: "SI", mt: "MT",
    mn: "MN", en: "US", lv: "LV", ga: "IE", sr: "RS", fil: "PH",
    fa: "IR", yi: "US",
  };

  // Check exact match first (e.g., "ro")
  const lang = primary.split("-")[0];
  if (map[lang]) return map[lang];

  // Check region subtag (e.g., "en-GB" → "GB")
  const parts = primary.split("-");
  if (parts.length > 1) {
    const region = parts[1].toUpperCase();
    if (region.length === 2) return region;
  }

  return null;
}

/** Get services for a country and service type from DB */
export async function getServicesForCountry(
  countryCode: string,
  serviceType: string
) {
  const supabase = await getServerSupabase();
  return supabase
    ?.from("services_by_country")
    .select("*")
    .eq("country_code", countryCode)
    .eq("service_type", serviceType)
    .eq("is_active", true)
    .order("is_featured", { ascending: false })
    .order("sort_order");
}

/** Get featured cities for a country */
export async function getFeaturedCities(countryCode: string) {
  const supabase = await getServerSupabase();
  return supabase
    ?.from("cities")
    .select("*")
    .eq("country_code", countryCode)
    .eq("is_featured", true)
    .order("name_local");
}

/** Get country info */
export async function getCountryInfo(countryCode: string) {
  const supabase = await getServerSupabase();
  return supabase
    ?.from("countries")
    .select("*")
    .eq("code", countryCode)
    .eq("is_active", true)
    .single();
}

/** Get all active countries */
export async function getActiveCountries() {
  const supabase = await getServerSupabase();
  return supabase
    ?.from("countries")
    .select("*")
    .eq("is_active", true)
    .order("name_en");
}
