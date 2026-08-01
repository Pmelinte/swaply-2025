import { NextResponse } from "next/server";

import { setDomainListingStatusResponse } from "@/lib/listings/domainListingMutationRoute";
import { isUuid } from "@/lib/listings/publicListingDetails";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!isUuid(id)) {
    return NextResponse.json({ error: "Invalid property id" }, { status: 400 });
  }

  return setDomainListingStatusResponse({
    request,
    domain: "property",
    itemId: id,
  });
}
