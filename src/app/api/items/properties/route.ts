import { createDomainListingResponse } from "@/lib/listings/domainListingCreateRoute";
import { normalizePropertyWizardCreatePayload } from "@/lib/listings/domainListingPayload";

export async function POST(request: Request) {
  return createDomainListingResponse({
    request,
    domain: "property",
    normalize: normalizePropertyWizardCreatePayload,
  });
}
