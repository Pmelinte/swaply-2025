import { NextResponse } from "next/server";

import { hydrateDomainOwnerEditorForm } from "@/lib/listings/domainListingOwner";
import { updateDomainListingResponse } from "@/lib/listings/domainListingMutationRoute";
import {
  PUBLIC_SERVICE_DETAIL_SELECT,
  isUuid,
  mapPublicServiceDetail,
  type JsonRecord,
} from "@/lib/listings/publicListingDetails";
import { normalizeServiceWizardCreatePayload } from "@/lib/wizard/serviceWizardNormalize";
import { getServerSupabase } from "@/lib/supabase/server";

function relationOne(value: unknown): JsonRecord {
  if (Array.isArray(value)) {
    const first = value[0];
    return first && typeof first === "object" ? (first as JsonRecord) : {};
  }
  return value && typeof value === "object" ? (value as JsonRecord) : {};
}

function ownerRevision(row: JsonRecord): number {
  const value = relationOne(row.items).owner_revision;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isInteger(parsed) && parsed >= 1 ? parsed : 1;
}

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

  const { data: auth } = await supabase.auth.getUser();
  if (auth.user) {
    const { data: ownerData, error: ownerError } = await supabase
      .from("services_listings")
      .select("*,items!inner(*)")
      .or(`id.eq.${id},item_id.eq.${id}`)
      .eq("owner_id", auth.user.id)
      .limit(1)
      .maybeSingle();

    if (ownerError) {
      return NextResponse.json({ error: ownerError.message }, { status: 500 });
    }

    if (ownerData) {
      const row = ownerData as unknown as JsonRecord;
      const itemId = String(row.item_id);
      const { data: privateData, error: privateError } = await supabase
        .from("domain_listing_private_data")
        .select("editor_payload,exact_location,transfer_data")
        .eq("item_id", itemId)
        .maybeSingle();

      if (privateError) {
        return NextResponse.json({ error: privateError.message }, { status: 500 });
      }

      return NextResponse.json({
        service: mapPublicServiceDetail(row),
        isOwner: true,
        status: typeof row.status === "string" ? row.status : "active",
        revision: ownerRevision(row),
        editorForm: hydrateDomainOwnerEditorForm({
          domain: "service",
          listingRow: row,
          privateRow: privateData,
        }),
      });
    }
  }

  const { data, error } = await supabase
    .from("services_listings")
    .select(PUBLIC_SERVICE_DETAIL_SELECT)
    .or(`id.eq.${id},item_id.eq.${id}`)
    .eq("status", "active")
    .eq("items.status", "active")
    .eq("items.is_active", true)
    .limit(1)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Service not found" }, { status: 404 });
  }

  return NextResponse.json({
    service: mapPublicServiceDetail(data as unknown as JsonRecord),
    isOwner: false,
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!isUuid(id)) {
    return NextResponse.json({ error: "Invalid service id" }, { status: 400 });
  }

  return updateDomainListingResponse({
    request,
    domain: "service",
    itemId: id,
    normalize: normalizeServiceWizardCreatePayload,
  });
}
