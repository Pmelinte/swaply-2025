import { NextResponse } from "next/server";
import { filterEventListings } from "@/lib/events/eventListings";
import { getServerSupabase } from "@/lib/supabase/server";
import type { EventFormData } from "@/lib/wizard/eventWizardStore";
import { normalizeEventWizardItemInsert } from "@/lib/wizard/eventWizardNormalize";
import { eventStep1Schema, eventStep2Schema, eventStep3Schema, eventStep4Schema, eventStep5Schema } from "@/lib/wizard/eventWizardSchema";

function validateEventForm(form: EventFormData) {
  eventStep1Schema.parse(form);
  eventStep2Schema.parse(form);
  eventStep3Schema.parse(form);
  eventStep4Schema.parse(form);
  eventStep5Schema.parse(form);
}

export async function GET() {
  const supabase = await getServerSupabase();
  if (!supabase) return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });

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
  const supabase = await getServerSupabase();
  if (!supabase) return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });

  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as { form?: EventFormData } | null;
  if (!body?.form) return NextResponse.json({ error: "Missing event form" }, { status: 400 });

  try { validateEventForm(body.form); } catch {
    return NextResponse.json({ error: "Event form is incomplete" }, { status: 400 });
  }

  const insert = normalizeEventWizardItemInsert(body.form, auth.user.id);
  const { data, error } = await supabase.from("items").insert(insert).select("id");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ items: data ?? [] }, { status: 201 });
}
