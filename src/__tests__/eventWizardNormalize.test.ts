import { describe, expect, it } from "vitest";

import { normalizeEventWizardCreatePayload } from "@/lib/wizard/eventWizardNormalize";
import { INITIAL_EVENT_FORM } from "@/lib/wizard/eventWizardStore";

function futureDate(days: number): string {
  return new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10);
}

describe("normalizeEventWizardCreatePayload", () => {
  it("keeps booking references and exact seats out of the public event row", () => {
    const payload = normalizeEventWizardCreatePayload({
      ...INITIAL_EVENT_FORM,
      event_title: "Jazz night ticket",
      event_type_l1: "Tickets & Access",
      event_type_l2: "Sports Event Tickets",
      start_date: futureDate(30),
      end_date: futureDate(30),
      booking_deadline_date: futureDate(10),
      timezone: "UTC",
      event_description: "A transferable event access swap with clear issuer rules and a safe deadline.",
      country: "RO",
      city: "Bucharest",
      location_type: "Indoor",
      capacity_total: 2,
      capacity_available: 1,
      is_transferable: true,
      booking_reference: "PRIVATE-BOOKING-123",
      venue_sector: "North stand",
      venue_row: "R12",
      seat_number: "18",
      id_required: true,
      swap_for_type: ["service"],
      swap_wants_description: "Photography service",
      perceived_value_tier: "medium",
      confirm_authorized: true,
      confirm_accurate: true,
      confirm_terms: true,
    });

    expect(payload.domain).toBe("event");
    expect(payload.item).not.toHaveProperty("owner_id");
    expect(payload.item).not.toHaveProperty("event_data");
    expect(payload.listing).toMatchObject({
      event_group: "Tickets & Access",
      event_category: "Sports Event Tickets",
      is_transferable: true,
      transfer_rule_source: "user_attestation",
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

  it("refuses non-transferable tickets", () => {
    expect(() =>
      normalizeEventWizardCreatePayload({
        ...INITIAL_EVENT_FORM,
        event_title: "Non-transferable ticket",
        event_type_l1: "Tickets & Access",
        event_type_l2: "Theater",
        start_date: futureDate(30),
        booking_deadline_date: futureDate(10),
        timezone: "UTC",
        event_description: "A ticket that issuer rules explicitly mark as non-transferable.",
        capacity_total: 1,
        capacity_available: 1,
        is_transferable: false,
        swap_for_type: ["object"],
        swap_wants_description: "An object in exchange",
        perceived_value_tier: "small",
        confirm_authorized: true,
        confirm_accurate: true,
        confirm_terms: true,
      }),
    ).toThrow(/non-transferable ticket/i);
  });

  it("requires a transfer deadline before the event", () => {
    expect(() =>
      normalizeEventWizardCreatePayload({
        ...INITIAL_EVENT_FORM,
        event_title: "Ticket with invalid deadline",
        event_type_l1: "Tickets & Access",
        event_type_l2: "Theater",
        start_date: futureDate(20),
        booking_deadline_date: futureDate(20),
        timezone: "UTC",
        event_description: "A transferable ticket whose proposed deadline is not before the event.",
        capacity_total: 1,
        capacity_available: 1,
        is_transferable: true,
        swap_for_type: ["object"],
        swap_wants_description: "An object in exchange",
        perceived_value_tier: "small",
        confirm_authorized: true,
        confirm_accurate: true,
        confirm_terms: true,
      }),
    ).toThrow(/valid deadline before the event/i);
  });
});
