import { NextResponse } from "next/server";
import {
  PUBLIC_PROPERTY_DETAIL_SELECT,
  isUuid,
  mapPublicPropertyDetail,
  type JsonRecord,
} from "@/lib/listings/publicListingDetails";
import { getServerSupabase } from "@/lib/supabase/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!isUuid(id)) {
    return NextResponse.json({ error: "Invalid property id" }, { status: 400 });
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
      .from("properties")
      .select(PUBLIC_PROPERTY_DETAIL_SELECT)
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
    return NextResponse.json({ error: "Property not found" }, { status: 404 });
  }

  const row = data as unknown as JsonRecord;
  const property = mapPublicPropertyDetail(row);

  return NextResponse.json({
    property,
    isOwner: auth.user?.id === row.owner_id,
  });
}
