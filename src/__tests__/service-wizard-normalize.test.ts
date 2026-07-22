import { describe, expect, it } from "vitest";
import { INITIAL_SERVICE_FORM } from "@/lib/wizard/serviceWizardStore";
import { normalizeServiceWizardItemInsert } from "@/lib/wizard/serviceWizardNormalize";

describe("normalizeServiceWizardItemInsert", () => {
  it("binds service owner server-side and preserves availability/value/portfolio fields", () => {
    const insert = normalizeServiceWizardItemInsert({
      ...INITIAL_SERVICE_FORM,
      service_category_l1: "Tech & Engineering",
      service_title: "  Next.js mentoring  ",
      service_modality: "Remote",
      service_full_description: "A focused mentoring service with enough detail to pass the service wizard description requirement.",
      experience_level: "Senior",
      provider_type: "Individual",
      certifications: ["AWS Certified"],
      portfolio_urls: ["https://example.com/work"],
      portfolio_images: ["https://example.com/work.png"],
      availability_days: ["Monday"],
      availability_time_of_day: ["Evening"],
      service_duration: ["60 minutes"],
      swap_for_type: ["service"],
      swap_wants_description: "Design review in return",
      perceived_value_tier: "medium",
    }, "authenticated-user-id");

    expect(insert.owner_id).toBe("authenticated-user-id");
    expect(insert.category).toBe("service");
    expect(insert.wizard_type).toBe("service");
    expect(insert.title).toBe("Next.js mentoring");
    expect(insert.service_data).toMatchObject({
      availability_days: ["Monday"],
      availability_time_of_day: ["Evening"],
      service_duration: ["60 minutes"],
      certifications: ["AWS Certified"],
      portfolio_urls: ["https://example.com/work"],
      portfolio_images: ["https://example.com/work.png"],
    });
    expect(insert.perceived_value_tier).toBe("medium");
  });

  it("uses nulls for optional arrays so empty portfolio/certifications stay hidden", () => {
    const insert = normalizeServiceWizardItemInsert({
      ...INITIAL_SERVICE_FORM,
      service_title: "Repair consultation",
      service_full_description: "A practical repair consultation with enough descriptive detail for the service listing.",
    }, "user-1");

    expect(insert.service_data.certifications).toBeNull();
    expect(insert.service_data.portfolio_urls).toBeNull();
    expect(insert.service_data.portfolio_images).toBeNull();
    expect(insert.swap_open_to).toBeNull();
  });
});
