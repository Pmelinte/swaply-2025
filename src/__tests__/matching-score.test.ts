import { describe, expect, it } from "vitest";

import { calculateMatchScore } from "@/lib/matching/matchScore";
import type {
  MatchingItemRow,
  MatchingProfileRow,
} from "@/lib/matching/matchQueries";

const profile: MatchingProfileRow = {
  user_id: "profile-user",
  username: null,
  display_name: null,
  avatar_url: null,
  trust_score: 80,
  location: { city: "Paris" },
  last_active_at: new Date().toISOString(),
};

const baseProperty: MatchingItemRow = {
  id: "property-a",
  owner_id: "user-a",
  title: "Flat in Paris",
  description: "A temporary apartment exchange in Paris.",
  category: "Residential",
  item_type: "property",
  perceived_value_tier: "medium",
  swap_open_to: ["property"],
  swap_wants_type: ["property"],
  swap_wants_description: "A comparable temporary property exchange",
  photos: [],
  status: "active",
  is_active: true,
  created_at: new Date().toISOString(),
  domain_profile: {
    domain: "property",
    property_type: "apartment",
    city: "Paris",
    available_from: "2026-08-01",
    available_until: "2026-08-15",
    min_stay_days: 2,
    max_stay_days: 14,
  },
};

describe("calculateMatchScore", () => {
  it("includes an explainable availability score for overlapping property periods", () => {
    const score = calculateMatchScore(
      baseProperty,
      {
        ...baseProperty,
        id: "property-b",
        owner_id: "user-b",
        domain_profile: {
          ...baseProperty.domain_profile,
          domain: "property",
          available_from: "2026-08-10",
          available_until: "2026-08-20",
        },
      },
      profile,
      profile,
    );

    expect(score.availabilityScore).toBe(100);
    expect(score.total).toBeGreaterThan(0);
  });

  it("penalizes non-overlapping property availability", () => {
    const score = calculateMatchScore(
      baseProperty,
      {
        ...baseProperty,
        id: "property-b",
        owner_id: "user-b",
        domain_profile: {
          ...baseProperty.domain_profile,
          domain: "property",
          available_from: "2026-09-01",
          available_until: "2026-09-10",
        },
      },
      profile,
      profile,
    );

    expect(score.availabilityScore).toBe(20);
  });
});
