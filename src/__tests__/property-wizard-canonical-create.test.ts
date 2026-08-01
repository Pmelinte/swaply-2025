import { describe, expect, it } from "vitest";

import { normalizePropertyWizardCreatePayload } from "@/lib/listings/domainListingPayload";
import { INITIAL_FORM } from "@/lib/wizard/propertyWizardStore";

describe("normalizePropertyWizardCreatePayload", () => {
  it("separates approximate public location from exact owner-only location", () => {
    const payload = normalizePropertyWizardCreatePayload({
      ...INITIAL_FORM,
      property_type: "Apartment",
      property_category: "Residential",
      country: "RO",
      region: "Bucharest",
      city: "Bucharest",
      address_line1: "Private street 12",
      lat: "44.426767",
      lon: "26.102538",
      location_type: ["Urban"],
      total_area_sqm: "82",
      furnishing_level: "Fully Furnished",
      exchange_type: "Simultaneous",
      desired_exchange_description: "A comparable property for a one-week exchange",
      minimum_stay_days: "3",
      maximum_stay_days: "14",
      swap_geo_preference: "International",
      wifi_password: "must-never-be-stored",
      confirm_vacation_only: true,
      confirm_accurate_info: true,
      confirm_terms: true,
      timezone: "Europe/Bucharest",
    });

    expect(payload.domain).toBe("property");
    expect(payload.item).toMatchObject({
      title: "Apartment in Bucharest",
      location_city: "Bucharest",
      location_country: "RO",
    });
    expect(payload.item).not.toHaveProperty("owner_id");
    expect(payload.item).not.toHaveProperty("property_data");
    expect(payload.listing).toMatchObject({
      property_type: "apartment",
      listing_purpose: "vacation_swap",
      city: "Bucharest",
      lat: 44.43,
      lon: 26.1,
      timezone: "Europe/Bucharest",
    });
    expect(payload.listing).not.toHaveProperty("address_line1");
    expect(payload.private.exact_location).toEqual({
      address: "Private street 12",
      lat: 44.426767,
      lon: 26.102538,
    });
    expect(JSON.stringify(payload.private)).not.toContain("must-never-be-stored");
    expect(JSON.stringify(payload.private)).not.toContain("wifi_password");
  });

  it("rejects inverted availability and stay limits", () => {
    expect(() =>
      normalizePropertyWizardCreatePayload({
        ...INITIAL_FORM,
        property_type: "House",
        property_category: "Residential",
        country: "RO",
        city: "Tulcea",
        total_area_sqm: "120",
        furnishing_level: "Fully Furnished",
        exchange_type: "Simultaneous",
        desired_exchange_description: "A similar home exchange",
        available_start_date: "2027-06-10",
        available_end_date: "2027-06-01",
        minimum_stay_days: "10",
        maximum_stay_days: "3",
        confirm_vacation_only: true,
        confirm_accurate_info: true,
        confirm_terms: true,
        timezone: "Europe/Bucharest",
      }),
    ).toThrow(/availability range is invalid/i);
  });
});
