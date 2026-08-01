import { describe, expect, it } from "vitest";

import { normalizeServiceWizardCreatePayload } from "@/lib/wizard/serviceWizardNormalize";
import { INITIAL_SERVICE_FORM } from "@/lib/wizard/serviceWizardStore";

describe("normalizeServiceWizardCreatePayload", () => {
  it("builds items + services_listings without legacy JSON columns", () => {
    const payload = normalizeServiceWizardCreatePayload({
      ...INITIAL_SERVICE_FORM,
      service_category_l1: "Tech & Engineering",
      service_category_l2: "Web Dev",
      service_title: "  Next.js mentoring  ",
      service_modality: "Remote",
      service_full_description:
        "A focused mentoring service with enough concrete detail to satisfy the service publication contract.",
      experience_level: "Expert",
      provider_type: "Individual",
      certifications: ["Licensed", "Professional Certificate"],
      portfolio_urls: ["https://example.com/work"],
      portfolio_images: ["https://example.com/work.png"],
      availability_days: ["Mon", "Wed"],
      availability_time_of_day: ["Evening"],
      service_duration: ["1h"],
      swap_for_type: ["service", "object"],
      swap_wants_description: "A design review in return",
      perceived_value_tier: "medium",
      confirm_authorized: true,
      confirm_accurate: true,
      confirm_terms: true,
      timezone: "UTC",
    });

    expect(payload.domain).toBe("service");
    expect(payload.item).toMatchObject({
      title: "Next.js mentoring",
      category_l1: "Tech & Engineering",
      swap_open_to: ["service", "object"],
    });
    expect(payload.item).not.toHaveProperty("owner_id");
    expect(payload.item).not.toHaveProperty("wizard_type");
    expect(payload.item).not.toHaveProperty("service_data");

    expect(payload.listing).toMatchObject({
      category_l1: "Tech & Engineering",
      category_l2: "Web Dev",
      service_name: "Next.js mentoring",
      delivery_mode: "remote",
      available_days: ["monday", "wednesday"],
      available_from_time: "17:00",
      available_until_time: "21:00",
      estimated_hours: 1,
      timezone: "UTC",
    });

    // Claims remain private until a verification workflow approves a public badge.
    expect(payload.listing).toMatchObject({
      is_licensed: false,
      is_certified: false,
      certifications: [],
    });
    expect(payload.private.transfer_data).toMatchObject({
      certification_claims: ["Licensed", "Professional Certificate"],
      provider_type: "Individual",
    });
  });

  it("rejects invalid portfolio URLs before any database write", () => {
    expect(() =>
      normalizeServiceWizardCreatePayload({
        ...INITIAL_SERVICE_FORM,
        service_category_l1: "Tech & Engineering",
        service_title: "Repair consultation",
        service_modality: "Remote",
        service_full_description:
          "A practical repair consultation with enough descriptive detail for the canonical service listing.",
        experience_level: "Expert",
        provider_type: "Individual",
        availability_days: ["Mon"],
        portfolio_urls: ["javascript:alert(1)"],
        swap_for_type: ["object"],
        swap_wants_description: "Repair tools",
        perceived_value_tier: "small",
        confirm_authorized: true,
        confirm_accurate: true,
        confirm_terms: true,
        timezone: "UTC",
      }),
    ).toThrow(/valid HTTP URLs/i);
  });
});
