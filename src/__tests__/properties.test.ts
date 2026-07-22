import { describe, expect, it } from "vitest";
import {
  getApproximateMapLabel,
  getPropertyLocation,
  propertyMatchesFilters,
  type PropertyRow,
} from "@/lib/properties";

const row: PropertyRow = {
  id: "p1",
  property_data: {
    city: "Cluj",
    region: "CJ",
    country: "RO",
    number_of_guests_allowed: 4,
    available_start_date: "2026-08-01",
    available_end_date: "2026-08-31",
    has_garden: true,
  },
};

describe("property helpers", () => {
  it("uses city and country without exact coordinates for public location", () => {
    expect(getPropertyLocation(row)).toBe("Cluj, RO");
    expect(getApproximateMapLabel(row)).toBe("Cluj · CJ · RO");
  });
  it("matches happy path property filters", () => {
    expect(
      propertyMatchesFilters(row, {
        location: "cluj",
        guests: 2,
        start: "2026-08-10",
        end: "2026-08-20",
        amenities: ["has_garden"],
      }),
    ).toBe(true);
  });
  it("denies unavailable, over-capacity, or missing-amenity filter combinations", () => {
    expect(propertyMatchesFilters(row, { guests: 5 })).toBe(false);
    expect(propertyMatchesFilters(row, { start: "2026-09-01" })).toBe(false);
    expect(propertyMatchesFilters(row, { amenities: ["has_sauna"] })).toBe(
      false,
    );
  });
});
