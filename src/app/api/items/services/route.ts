import { createDomainListingResponse } from "@/lib/listings/domainListingCreateRoute";
import { normalizeServiceWizardCreatePayload } from "@/lib/listings/domainListingPayload";

export async function POST(request: Request) {
  return createDomainListingResponse({
    request,
    domain: "service",
    normalize: normalizeServiceWizardCreatePayload,
  });
}
