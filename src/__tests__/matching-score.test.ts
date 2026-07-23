import { describe, expect, it } from "vitest";
import { calculateMatchScore } from "@/lib/matching/matchScore";

const profile = { trust_score: 80, location: { city: "Paris" }, last_active_at: new Date().toISOString() };
const baseProperty = {
  id: "property-a",
  owner_id: "user-a",
  title: "Flat in Paris",
  category: "property",
  item_type: "property",
  perceived_value_tier: "medium",
  status: "active",
  is_active: true,
  created_at: new Date().toISOString(),
  property_data: { city: "Paris", available_start_date: "2026-08-01", available_end_date: "2026-08-15" },
};

describe("calculateMatchScore", () => {
  it("includes an explainable availability score for overlapping property periods", () => {
    const score = calculateMatchScore(
      baseProperty,
      { ...baseProperty, id: "property-b", owner_id: "user-b", property_data: { available_start_date: "2026-08-10", available_end_date: "2026-08-20" } },
      profile,
      profile,
    );

    expect(score.availabilityScore).toBe(100);
    expect(score.total).toBeGreaterThan(0);
  });

  it("penalizes non-overlapping property availability", () => {
    const score = calculateMatchScore(
      baseProperty,
      { ...baseProperty, id: "property-b", owner_id: "user-b", property_data: { available_start_date: "2026-09-01", available_end_date: "2026-09-10" } },
      profile,
      profile,
    );

    expect(score.availabilityScore).toBe(20);
  });
});
