import { submitDomainListing } from "@/lib/listings/domainListingSubmit";
import type { PropertyFormData } from "./propertyWizardStore";

const PROPERTY_PUBLISH_REQUEST_KEY = "swaply_property_publish_request";

export async function submitPropertyWizard(
  form: PropertyFormData,
  _legacyUserId?: string,
): Promise<{ id: string }[]> {
  // Ownership is derived by the server from the authenticated session. The
  // optional legacy argument is intentionally ignored until the wizard caller
  // is simplified in a later UI-only cleanup.
  return submitDomainListing({
    domain: "property",
    endpoint: "/api/items/properties",
    storageKey: PROPERTY_PUBLISH_REQUEST_KEY,
    form,
  });
}
