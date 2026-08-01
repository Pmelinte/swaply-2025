import { describe, expect, it } from "vitest";

import { hydrateDomainOwnerEditorForm } from "@/lib/listings/domainListingOwner";
import { normalizePropertyWizardCreatePayload } from "@/lib/listings/domainListingPayload";
import { normalizeEventWizardCreatePayload } from "@/lib/wizard/eventWizardNormalize";
import { INITIAL_EVENT_FORM } from "@/lib/wizard/eventWizardStore";
import { normalizeServiceWizardCreatePayload } from "@/lib/wizard/serviceWizardNormalize";
import { INITIAL_SERVICE_FORM } from "@/lib/wizard/serviceWizardStore";
import { INITIAL_FORM } from "@/lib/wizard/propertyWizardStore";

function futureDate(days: number): string {
  return new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10);
}

describe("V1-05.3 owner editor hydration", () => {
  it("round-trips a property editor snapshot without persisting Wi-Fi credentials", () => {
    const stored = {
      ...INITIAL_FORM,
      property_type: "Apartment",
      property_category: "Residential",
      country: "RO",
      region: "Bucharest",
      city: "Bucharest",
      address_line1: "Private address 10",
      lat: "44.426767",
      lon: "26.102538",
      location_type: ["Urban"],
      total_area_sqm: "80",
      furnishing_level: "Fully Furnished",
      exchange_type: "Simultaneous",
      minimum_stay_days: "3",
      maximum_stay_days: "14",
      desired_exchange_description: "A comparable temporary property exchange",
      swap_geo_preference: "International",
      wifi_password: "must-never-return",
      confirm_vacation_only: true,
      confirm_accurate_info: true,
      confirm_terms: true,
      schema_version: "1.0",
      source: "property_wizard",
    };

    const hydrated = hydrateDomainOwnerEditorForm({
      domain: "property",
      listingRow: {},
      privateRow: { editor_payload: stored },
    });

    expect(hydrated).toMatchObject({
      property_type: "Apartment",
      city: "Bucharest",
      confirm_vacation_only: true,
      confirm_accurate_info: true,
      confirm_terms: true,
      wifi_password: "",
    });
    expect(hydrated).not.toHaveProperty("schema_version");
    expect(hydrated).not.toHaveProperty("source");

    const payload = normalizePropertyWizardCreatePayload(hydrated);
    expect(payload.domain).toBe("property");
    expect(JSON.stringify(payload.private)).not.toContain("must-never-return");
    expect(payload.private.exact_location).toMatchObject({
      address: "Private address 10",
      lat: 44.426767,
      lon: 26.102538,
    });
  });

  it("round-trips a service editor snapshot through the canonical normalizer", () => {
    const stored = {
      ...INITIAL_SERVICE_FORM,
      service_category_l1: "Tech & Engineering",
      service_category_l2: "Web Dev",
      service_title: "Next.js mentoring",
      service_modality: "Remote",
      service_full_description:
        "A detailed mentoring service with enough information to satisfy the canonical service contract.",
      experience_level: "Expert",
      provider_type: "Individual",
      availability_days: ["Mon", "Wed"],
      availability_time_of_day: ["Evening"],
      service_duration: ["1h"],
      swap_for_type: ["service", "object"],
      swap_wants_description: "A design review or a useful object in exchange",
      perceived_value_tier: "medium",
      confirm_authorized: true,
      confirm_accurate: true,
      confirm_terms: true,
      schema_version: "1.0",
      source: "service_wizard",
    };

    const hydrated = hydrateDomainOwnerEditorForm({
      domain: "service",
      listingRow: {},
      privateRow: { editor_payload: stored },
    });
    const payload = normalizeServiceWizardCreatePayload({
      ...hydrated,
      timezone: "UTC",
    });

    expect(payload.domain).toBe("service");
    expect(payload.item).toMatchObject({
      title: "Next.js mentoring",
      swap_open_to: ["service", "object"],
    });
    expect(payload.listing).toMatchObject({
      service_name: "Next.js mentoring",
      delivery_mode: "remote",
      available_days: ["monday", "wednesday"],
      timezone: "UTC",
    });
  });

  it("round-trips event transfer data while keeping private references out of the public row", () => {
    const stored = {
      ...INITIAL_EVENT_FORM,
      event_title: "Transferable match ticket",
      event_type_l1: "Tickets & Access",
      event_type_l2: "Sports Event Tickets",
      start_date: futureDate(30),
      end_date: futureDate(30),
      timezone: "UTC",
      event_description:
        "A transferable event ticket with confirmed issuer rules and a safe transfer deadline.",
      country: "RO",
      city: "Bucharest",
      location_type: "Indoor",
      booking_reference: "PRIVATE-BOOKING-123",
      venue_sector: "North stand",
      venue_row: "R12",
      seat_number: "18",
      capacity_total: 2,
      capacity_available: 1,
      seats_available: 1,
      is_transferable: true,
      id_required: true,
      booking_deadline_date: futureDate(10),
      swap_for_type: ["object"],
      swap_wants_description: "A useful object in exchange",
      perceived_value_tier: "medium",
      confirm_authorized: true,
      confirm_accurate: true,
      confirm_terms: true,
      schema_version: "1.0",
      source: "event_wizard",
    };

    const hydrated = hydrateDomainOwnerEditorForm({
      domain: "event",
      listingRow: {},
      privateRow: { editor_payload: stored },
    });
    const payload = normalizeEventWizardCreatePayload(hydrated);

    expect(payload.domain).toBe("event");
    expect(payload.listing).toMatchObject({
      event_group: "Tickets & Access",
      event_category: "Sports Event Tickets",
      is_transferable: true,
      transfer_rule_confirmed: true,
      venue_section: "North stand",
    });
    expect(payload.listing).not.toHaveProperty("booking_reference");
    expect(payload.listing).not.toHaveProperty("venue_row");
    expect(payload.listing).not.toHaveProperty("venue_seat");
    expect(payload.private.transfer_data).toMatchObject({
      booking_reference: "PRIVATE-BOOKING-123",
      venue_row: "R12",
      seat_number: "18",
      id_required: true,
    });
  });

  it("reconstructs the required core of a legacy service row", () => {
    const hydrated = hydrateDomainOwnerEditorForm({
      domain: "service",
      listingRow: {
        category_l1: "Creative & Design",
        category_l2: "Photography",
        service_name: "Portrait photography",
        delivery_mode: "onsite",
        scope_description:
          "A complete portrait photography session with editing and final image delivery included.",
        skill_level: "expert",
        available_days: ["saturday"],
        swap_open_to: ["object"],
        swap_wants_description: "Camera equipment",
        swap_wants_value_tier: "medium",
        items: {
          title: "Portrait photography",
          item_type: "service",
          perceived_value_tier: "medium",
          swap_geo_preference: "local",
        },
      },
    });

    expect(hydrated).toMatchObject({
      service_category_l1: "Creative & Design",
      service_title: "Portrait photography",
      service_modality: "On-site",
      availability_days: ["Sat"],
      swap_for_type: ["object"],
      confirm_authorized: true,
      confirm_accurate: true,
      confirm_terms: true,
    });
  });
});
