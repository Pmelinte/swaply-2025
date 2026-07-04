import { describe, expect, it } from "vitest";
import { generateMatchCandidates, scoreItemPair } from "@/lib/matching-engine";
import type { Item } from "@/lib/types";

function makeItem(overrides: Partial<Item>): Item {
  return {
    id: "item-1",
    ownerId: "user-1",
    title: "Mountain bike",
    category: "sports",
    condition: "good",
    description: "A reliable mountain bike",
    wishlist: "camera",
    status: "active",
    isActive: true,
    createdAt: "2026-07-01T00:00:00.000Z",
    location: "Tulcea",
    photos: ["photo-1.jpg"],
    ...overrides,
  };
}

describe("matching engine", () => {
  it("scores compatible items higher than unrelated items", () => {
    const requested = makeItem({
      id: "requested",
      ownerId: "user-a",
      title: "Camera wanted",
      wishlist: "camera",
      category: "electronics",
      location: "Tulcea",
    });

    const compatible = makeItem({
      id: "compatible",
      ownerId: "user-b",
      title: "Camera kit",
      category: "electronics",
      description: "Camera with lens",
      location: "Tulcea",
      condition: "new",
      photos: ["1.jpg", "2.jpg", "3.jpg"],
    });

    const unrelated = makeItem({
      id: "unrelated",
      ownerId: "user-c",
      title: "Old chair",
      category: "furniture",
      description: "Wood chair",
      location: "Constanta",
      condition: "used",
      photos: [],
    });

    const high = scoreItemPair(compatible, requested, { now: new Date("2026-07-05T00:00:00.000Z") });
    const low = scoreItemPair(unrelated, requested, { now: new Date("2026-07-05T00:00:00.000Z") });

    expect(high.compatibilityScore).toBeGreaterThan(low.compatibilityScore);
    expect(high.reasons.length).toBeGreaterThan(0);
    expect(high.weightedScore?.factors.length).toBeGreaterThan(0);
  });

  it("does not match a user with their own items", () => {
    const source = makeItem({ id: "source", ownerId: "same-user" });
    const ownCandidate = makeItem({ id: "own", ownerId: "same-user" });

    const candidates = generateMatchCandidates([source], [ownCandidate]);

    expect(candidates).toHaveLength(0);
  });
});
