import { submitDomainListing } from "@/lib/listings/domainListingSubmit";
import type { PropertyFormData } from "./propertyWizardStore";

const PROPERTY_PUBLISH_REQUEST_KEY = "swaply_property_publish_request";

export async function submitPropertyWizard(
  form: PropertyFormData,
): Promise<{ id: string }[]> {
  return submitDomainListing({
    domain: "property",
    endpoint: "/api/items/properties",
    storageKey: PROPERTY_PUBLISH_REQUEST_KEY,
    form,
  });
}
