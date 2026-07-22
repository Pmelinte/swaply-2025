import { describe, expect, it } from "vitest";
import { INITIAL_EVENT_FORM } from "@/lib/wizard/eventWizardStore";
import { normalizeEventWizardItemInsert } from "@/lib/wizard/eventWizardNormalize";

describe("normalizeEventWizardItemInsert", () => {
  it("binds event ownership server-side caller value and preserves event rules/package fields", () => {
    const insert = normalizeEventWizardItemInsert({
      ...INITIAL_EVENT_FORM,
      event_title: "Jazz night ticket",
      event_type_l1: "Tickets & Access",
      event_type_l2: "Theater",
      start_date: "2026-09-01",
      event_description: "A transferable event access swap with clear issuer rules.",
      capacity_total: 2,
      capacity_available: 1,
      is_transferable: false,
      booking_deadline_date: "2026-08-20",
      id_required: true,
      includes_transport: true,
      includes_accommodation: true,
      swap_for_type: ["service"],
      swap_wants_description: "Photography service",
      perceived_value_tier: "medium",
      confirm_authorized: true,
      confirm_accurate: true,
      confirm_terms: true,
    }, "server-user-id");

    expect(insert.owner_id).toBe("server-user-id");
    expect(insert.category).toBe("event");
    expect(insert.item_type).toBe("event");
    expect(insert.status).toBe("active");
    expect(insert.event_data).toMatchObject({
      is_transferable: false,
      booking_deadline_date: "2026-08-20",
      id_required: true,
      includes_transport: true,
      includes_accommodation: true,
    });
  });
});
