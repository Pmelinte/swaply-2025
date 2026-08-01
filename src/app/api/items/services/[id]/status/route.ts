import { NextResponse } from "next/server";

import { setDomainListingStatusResponse } from "@/lib/listings/domainListingMutationRoute";
import { isUuid } from "@/lib/listings/publicListingDetails";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!isUuid(id)) {
    return NextResponse.json({ error: "Invalid service id" }, { status: 400 });
  }

  return setDomainListingStatusResponse({
    request,
    domain: "service",
    itemId: id,
  });
}
