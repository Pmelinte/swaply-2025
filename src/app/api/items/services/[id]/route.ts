import { NextResponse } from "next/server";
import { serviceOwnerEditPatch } from "@/lib/items/item-lifecycle";
import {
  PUBLIC_SERVICE_DETAIL_SELECT,
  isUuid,
  mapPublicServiceDetail,
  type JsonRecord,
} from "@/lib/listings/publicListingDetails";
import { getServerSupabase } from "@/lib/supabase/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!isUuid(id)) {
    return NextResponse.json({ error: "Invalid service id" }, { status: 400 });
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
      .from("services_listings")
      .select(PUBLIC_SERVICE_DETAIL_SELECT)
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
    return NextResponse.json({ error: "Service not found" }, { status: 404 });
  }

  const row = data as unknown as JsonRecord;
  return NextResponse.json({
    service: mapPublicServiceDetail(row),
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
    serviceData?: Record<string, unknown> | null;
    swapWantsDescription?: unknown;
    perceivedValueTier?: unknown;
  } | null;

  if (typeof body?.title !== "string" || body.title.trim().length < 3) {
    return NextResponse.json(
      { error: "Service title is required" },
      { status: 400 },
    );
  }
  if (
    typeof body.description !== "string" ||
    body.description.trim().length < 50
  ) {
    return NextResponse.json(
      { error: "Service description must be at least 50 characters" },
      { status: 400 },
    );
  }

  const { id } = await params;
  const { data, error } = await supabase
    .from("items")
    .update(
      serviceOwnerEditPatch({
        title: body.title,
        description: body.description,
        serviceData: body.serviceData,
        swapWantsDescription:
          typeof body.swapWantsDescription === "string"
            ? body.swapWantsDescription
            : null,
        perceivedValueTier:
          typeof body.perceivedValueTier === "string"
            ? body.perceivedValueTier
            : null,
      }),
    )
    .eq("id", id)
    .eq("owner_id", auth.user.id)
    .or("category.eq.service,item_type.eq.service")
    .select(
      "id,title,description,status,is_active,service_data,swap_wants_description,perceived_value_tier,updated_at",
    )
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Service not found" }, { status: 404 });
  }
  return NextResponse.json({ service: data });
}
