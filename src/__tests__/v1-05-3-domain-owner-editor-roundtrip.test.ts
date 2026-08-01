import { describe, expect, it } from "vitest";

import { hydrateDomainOwnerEditorForm } from "@/lib/listings/domainListingOwner";
import { normalizePropertyWizardCreatePayload } from "@/lib/listings/domainListingPayload";
import { normalizeEventWizardCreatePayload } from "@/lib/wizard/eventWizardNormalize";
import { normalizeServiceWizardCreatePayload } from "@/lib/wizard/serviceWizardNormalize";

function futureDate(days: number): string {
  return new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10);
}

describe("V1-05.3 owner editor hydration", () => {
  it("reconstructs a canonical property form without exposing Wi-Fi credentials", () => {
    const hydrated = hydrateDomainOwnerEditorForm({
      domain: "property",
      listingRow: {
        property_type: "apartment",
        property_subtype: "city_flat",
        country_code: "RO",
        region: "Bucharest",
        city: "Bucharest",
        location_type: "urban",
        lat: 44.43,
        lon: 26.1,
        surface_total_sqm: 80,
        furnished_level: "fully",
        exchange_type: "simultaneous",
        min_stay_days: 3,
        max_stay_days: 14,
        available_from: futureDate(20),
        available_until: futureDate(60),
        check_in_time: "15:00:00",
        check_out_time: "11:00:00",
        items: {
          title: "Apartment in Bucharest",
          description:
            "A furnished temporary property exchange in central Bucharest.",
          category_l1: "Residential",
          swap_wants_description:
            "A comparable temporary property exchange for one week",
          swap_geo_preference: "international",
          perceived_value_tier: "large",
          item_type: "property",
        },
      },
      privateRow: {
        editor_payload: {
          schema_version: "1.0",
          source: "property_wizard",
        },
        exact_location: {
          address: "Private address 10",
          lat: 44.426767,
          lon: 26.102538,
        },
      },
    });

    expect(hydrated).toMatchObject({
      property_type: "Apartment",
      property_category: "Residential",
      country: "RO",
      city: "Bucharest",
      total_area_sqm: "80",
      furnishing_level: "Fully Furnished",
      exchange_type: "Simultaneous",
      minimum_stay_days: "3",
      maximum_stay_days: "14",
      address_line1: "Private address 10",
      confirm_vacation_only: true,
      confirm_accurate_info: true,
      confirm_terms: true,
      wifi_password: "",
    });

    const payload = normalizePropertyWizardCreatePayload(hydrated);
    expect(payload.domain).toBe("property");
    expect(payload.item).toMatchObject({
      title: "Apartment in Bucharest",
      location_city: "Bucharest",
      location_country: "RO",
    });
    expect(payload.private.exact_location).toEqual({
      address: "Private address 10",
      lat: 44.426767,
      lon: 26.102538,
    });
    expect(JSON.stringify(payload.private)).not.toContain("wifi_password");
  });

  it("reconstructs a canonical service form through the current normalizer", () => {
    const hydrated = hydrateDomainOwnerEditorForm({
      domain: "service",
      listingRow: {
        category_l1: "Tech & Engineering",
        category_l2: "Web Dev",
        service_name: "Next.js mentoring",
        delivery_mode: "remote",
        scope_description:
          "A detailed mentoring service with architecture review, implementation guidance and documented next steps.",
        skill_level: "expert",
        experience_years: 8,
        available_days: ["monday", "wednesday"],
        available_from_time: "17:00:00",
        available_until_time: "21:00:00",
        estimated_hours: 1,
        service_languages: ["English", "Romanian"],
        swap_open_to: ["service", "object"],
        swap_wants_description:
          "A design review or a useful object in exchange",
        swap_wants_value_tier: "medium",
        service_area_radius_km: 50,
        items: {
          title: "Next.js mentoring",
          description:
            "A detailed mentoring service with architecture review and implementation guidance.",
          item_type: "service",
          perceived_value_tier: "medium",
          swap_geo_preference: "remote",
          swap_open_to: ["service", "object"],
        },
      },
      privateRow: {
        editor_payload: {
          schema_version: "1.0",
          source: "service_wizard",
        },
        transfer_data: {
          provider_type: "Individual",
          certification_claims: ["Professional Certificate"],
        },
      },
    });

    expect(hydrated).toMatchObject({
      service_category_l1: "Tech & Engineering",
      service_category_l2: "Web Dev",
      service_title: "Next.js mentoring",
      service_modality: "Remote",
      availability_days: ["Mon", "Wed"],
      availability_time_of_day: ["Evening"],
      service_duration: ["1h"],
      swap_for_type: ["service", "object"],
      perceived_value_tier: "medium",
      confirm_authorized: true,
      confirm_accurate: true,
      confirm_terms: true,
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
    expect(payload.listing).toMatchObject({
      is_licensed: false,
      is_certified: false,
      certifications: [],
    });
  });

  it("reconstructs event transfer data while keeping references private", () => {
    const hydrated = hydrateDomainOwnerEditorForm({
      domain: "event",
      listingRow: {
        event_group: "Tickets & Access",
        event_category: "Sports Event Tickets",
        start_date: futureDate(30),
        end_date: futureDate(30),
        start_time: "19:00:00",
        end_time: "22:00:00",
        timezone: "UTC",
        country_code: "RO",
        city: "Bucharest",
        venue_name: "National Arena",
        venue_section: "North stand",
        location_type: "indoor",
        capacity_total: 2,
        capacity_available: 1,
        is_transferable: true,
        transfer_deadline_at: `${futureDate(10)}T12:00:00Z`,
        swap_open_to: ["object"],
        swap_wants_description: "A useful object in exchange",
        swap_wants_value_tier: "medium",
        items: {
          title: "Transferable match ticket",
          description:
            "A transferable event ticket with confirmed issuer rules and a safe transfer deadline.",
          item_type: "event",
          perceived_value_tier: "medium",
          swap_geo_preference: "regional",
          swap_open_to: ["object"],
        },
      },
      privateRow: {
        editor_payload: {
          schema_version: "1.0",
          source: "event_wizard",
        },
        transfer_data: {
          booking_reference: "PRIVATE-BOOKING-123",
          venue_row: "R12",
          seat_number: "18",
          id_required: true,
        },
      },
    });

    expect(hydrated).toMatchObject({
      event_title: "Transferable match ticket",
      event_type_l1: "Tickets & Access",
      event_type_l2: "Sports Event Tickets",
      booking_reference: "PRIVATE-BOOKING-123",
      venue_sector: "North stand",
      venue_row: "R12",
      seat_number: "18",
      capacity_total: 2,
      capacity_available: 1,
      is_transferable: true,
      booking_deadline_date: futureDate(10),
      swap_for_type: ["object"],
      perceived_value_tier: "medium",
      confirm_authorized: true,
      confirm_accurate: true,
      confirm_terms: true,
    });

    const payload = normalizeEventWizardCreatePayload(hydrated);
    expect(payload.domain).toBe("event");
    expect(payload.listing).toMatchObject({
      event_group: "Tickets & Access",
      event_category: "Sports Event Tickets",
      is_transferable: true,
      transfer_rule_confirmed: true,
      venue_section: "North stand",
      timezone: "UTC",
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

  it("ignores bounded metadata and reconstructs from canonical rows", () => {
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
      privateRow: {
        editor_payload: {
          schema_version: "1.0",
          source: "service_wizard",
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
    expect(hydrated).not.toHaveProperty("schema_version");
    expect(hydrated).not.toHaveProperty("source");
  });
});
