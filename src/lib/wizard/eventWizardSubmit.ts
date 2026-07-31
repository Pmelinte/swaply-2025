import { submitDomainListing } from "@/lib/listings/domainListingSubmit";
import type { EventFormData } from "./eventWizardStore";

const EVENT_PUBLISH_REQUEST_KEY = "swaply_event_publish_request";

export async function submitEventWizard(
  form: EventFormData,
): Promise<{ id: string }[]> {
  return submitDomainListing({
    domain: "event",
    endpoint: "/api/items/events",
    storageKey: EVENT_PUBLISH_REQUEST_KEY,
    form,
  });
}
