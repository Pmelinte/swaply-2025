import { NextResponse } from "next/server";
import {
  eventOwnerEditPatch,
  itemLifecyclePatch,
  isItemLifecycleStatus,
} from "@/lib/items/item-lifecycle";
import {
  PUBLIC_EVENT_DETAIL_SELECT,
  isUuid,
  mapPublicEventDetail,
  type JsonRecord,
} from "@/lib/listings/publicListingDetails";
import { getServerSupabase } from "@/lib/supabase/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!isUuid(id)) {
    return NextResponse.json({ error: "Invalid event id" }, { status: 400 });
  }

  const supabase = await getServerSupabase();
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase not configured" },
      { status: 503 },
    );
  }

  const [{ data: auth }, { data, error }] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from("events_listings")
      .select(PUBLIC_EVENT_DETAIL_SELECT)
      .or(`id.eq.${id},item_id.eq.${id}`)
      .eq("status", "active")
      .eq("items.status", "active")
      .eq("items.is_active", true)
      .limit(1)
      .maybeSingle(),
  ]);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const row = data as unknown as JsonRecord;
  return NextResponse.json({
    event: mapPublicEventDetail(row),
    isOwner: auth.user?.id === row.owner_id,
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await getServerSupabase();
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase not configured" },
      { status: 503 },
    );
  }

  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    title?: unknown;
    description?: unknown;
    eventData?: Record<string, unknown> | null;
    swapWantsDescription?: unknown;
    perceivedValueTier?: unknown;
    status?: unknown;
  } | null;

  let patch: Record<string, unknown>;
  if (typeof body?.status === "string") {
    if (!isItemLifecycleStatus(body.status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    patch = itemLifecyclePatch(body.status);
  } else {
    if (typeof body?.title !== "string" || body.title.trim().length < 3) {
      return NextResponse.json(
        { error: "Event title is required" },
        { status: 400 },
      );
    }
    if (
      typeof body.description !== "string" ||
      body.description.trim().length < 20
    ) {
      return NextResponse.json(
        { error: "Event description must be at least 20 characters" },
        { status: 400 },
      );
    }
    patch = eventOwnerEditPatch({
      title: body.title,
      description: body.description,
      eventData: body.eventData,
      swapWantsDescription:
        typeof body.swapWantsDescription === "string"
          ? body.swapWantsDescription
          : null,
      perceivedValueTier:
        typeof body.perceivedValueTier === "string"
          ? body.perceivedValueTier
          : null,
    });
  }

  const { id } = await params;
  const { data, error } = await supabase
    .from("items")
    .update(patch)
    .eq("id", id)
    .eq("owner_id", auth.user.id)
    .or("category.eq.event,item_type.eq.event")
    .select(
      "id,title,description,status,is_active,event_data,swap_wants_description,perceived_value_tier,updated_at",
    )
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }
  return NextResponse.json({ event: data });
}
