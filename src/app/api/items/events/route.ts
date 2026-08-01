import { NextResponse } from "next/server";

import { filterEventListings } from "@/lib/events/eventListings";
import { createDomainListingResponse } from "@/lib/listings/domainListingCreateRoute";
import { normalizeEventWizardCreatePayload } from "@/lib/listings/domainListingPayload";
import { getServerSupabase } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await getServerSupabase();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }

  const { data, error } = await supabase
    .from("events_listings")
    .select("*, items(title, image_url, images, description)")
    .eq("status", "active")
    .order("start_date", { ascending: true, nullsFirst: false })
    .limit(500);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ events: filterEventListings(data ?? [], { sort: "soonest" }) });
}

export async function POST(request: Request) {
  return createDomainListingResponse({
    request,
    domain: "event",
    normalize: normalizeEventWizardCreatePayload,
  });
}
