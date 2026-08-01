import { submitDomainListing } from "@/lib/listings/domainListingSubmit";
import type { ServiceFormData } from "./serviceWizardStore";

const SERVICE_PUBLISH_REQUEST_KEY = "swaply_service_publish_request";

export async function submitServiceWizard(
  form: ServiceFormData,
): Promise<{ id: string }[]> {
  return submitDomainListing({
    domain: "service",
    endpoint: "/api/items/services",
    storageKey: SERVICE_PUBLISH_REQUEST_KEY,
    form,
  });
}
