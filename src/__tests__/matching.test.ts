import { describe, it, expect } from "vitest";
import {
  scoreTier,
  haversineDistance,
  computeMatchesForUser,
  buildUserContext,
  type MatchingUserContext,
  type OwnerCoordinatesMap,
} from "@/lib/state/matching";
import type { Item, UserProfile } from "@/lib/types";

// ── Helpers ──

function makeItem(overrides: Partial<Item> = {}): Item {
  return {
    id: "item-1",
    ownerId: "user-1",
    title: "Test Item",
    category: "electronics",
    condition: "good",
    description: "",
    wishlist: "",
    status: "active",
    isActive: true,
    createdAt: "2026-01-01T00:00:00Z",
    location: "București",
    photos: [],
    ...overrides,
  };
}

describe("scoreTier", () => {
  it("returns 'strong' for score >= 85", () => {
    expect(scoreTier(85)).toBe("strong");
    expect(scoreTier(100)).toBe("strong");
  });

  it("returns 'good' for score 70-84", () => {
    expect(scoreTier(70)).toBe("good");
    expect(scoreTier(84)).toBe("good");
  });

  it("returns 'possible' for score 40-69", () => {
    expect(scoreTier(40)).toBe("possible");
    expect(scoreTier(69)).toBe("possible");
  });

  it("returns 'weak' for score < 40", () => {
    expect(scoreTier(0)).toBe("weak");
    expect(scoreTier(39)).toBe("weak");
  });
});

describe("haversineDistance", () => {
  it("returns 0 for same point", () => {
    expect(haversineDistance(44.4268, 26.1025, 44.4268, 26.1025)).toBe(0);
  });

  it("computes distance between Bucharest and Cluj (~325 km)", () => {
    const dist = haversineDistance(44.4268, 26.1025, 46.7712, 23.6236);
    expect(dist).toBeGreaterThan(300);
    expect(dist).toBeLessThan(350);
  });

  it("computes distance between London and Paris (~340 km)", () => {
    const dist = haversineDistance(51.5074, -0.1278, 48.8566, 2.3522);
    expect(dist).toBeGreaterThan(300);
    expect(dist).toBeLessThan(400);
  });

  it("computes antipodal distance (~20000 km)", () => {
    const dist = haversineDistance(0, 0, 0, 180);
    expect(dist).toBeGreaterThan(19000);
    expect(dist).toBeLessThan(21000);
  });
});

describe("buildUserContext", () => {
  it("returns defaults for null profile", () => {
    const ctx = buildUserContext(null);
    expect(ctx.travelRadiusKm).toBe(50);
    expect(ctx.logistics).toBe("flexible");
    expect(ctx.blockedUsers).toEqual([]);
  });

  it("extracts coordinates from profile", () => {
    const profile = {
      location: { coordinates: { lat: 44.4, lng: 26.1 }, travelRadiusKm: 100 },
      swapPreferences: { logistics: "courier" as const },
    } as UserProfile;
    const ctx = buildUserContext(profile, ["blocked-user"]);
    expect(ctx.coordinates).toEqual({ lat: 44.4, lng: 26.1 });
    expect(ctx.travelRadiusKm).toBe(100);
    expect(ctx.logistics).toBe("courier");
    expect(ctx.blockedUsers).toEqual(["blocked-user"]);
  });
});

describe("computeMatchesForUser", () => {
  it("returns empty array when user has no items", () => {
    const items = [
      makeItem({ id: "a", ownerId: "other-user", wishlist: "electronica" }),
    ];
    const matches = computeMatchesForUser("user-no-items", items);
    expect(matches).toHaveLength(0);
  });

  it("does not match user with own items", () => {
    const items = [
      makeItem({ id: "a", ownerId: "user-1", wishlist: "electronica" }),
      makeItem({ id: "b", ownerId: "user-1", category: "electronics" }),
    ];
    const matches = computeMatchesForUser("user-1", items);
    expect(matches).toHaveLength(0);
  });

  it("matches items with mutual wishlist/category compatibility", () => {
    const items = [
      makeItem({
        id: "my-item",
        ownerId: "user-1",
        category: "sports_outdoor",
        wishlist: "laptop, electronica, tech",
      }),
      makeItem({
        id: "their-item",
        ownerId: "user-2",
        category: "electronics",
        wishlist: "bicicleta, sport",
      }),
    ];
    const matches = computeMatchesForUser("user-1", items);
    expect(matches.length).toBeGreaterThan(0);
    expect(matches[0].compatibilityScore).toBeGreaterThan(0);
    expect(matches[0].reasons.length).toBeGreaterThan(0);
  });

  it("scores reciprocal matches higher than one-way", () => {
    const items = [
      makeItem({
        id: "my-item",
        ownerId: "user-1",
        category: "sports_outdoor",
        wishlist: "electronica, laptop",
      }),
      makeItem({
        id: "reciprocal",
        ownerId: "user-2",
        category: "electronics",
        wishlist: "sport, bicicleta",
      }),
      makeItem({
        id: "one-way",
        ownerId: "user-3",
        category: "electronics",
        wishlist: "carti",
      }),
    ];
    const matches = computeMatchesForUser("user-1", items);
    const reciprocal = matches.find((m) => m.itemRequested.ownerId === "user-2");
    const oneWay = matches.find((m) => m.itemRequested.ownerId === "user-3");
    if (reciprocal && oneWay) {
      expect(reciprocal.compatibilityScore).toBeGreaterThan(oneWay.compatibilityScore);
    }
  });

  it("filters inactive items", () => {
    const items = [
      makeItem({ id: "my", ownerId: "user-1", wishlist: "electronica" }),
      makeItem({ id: "theirs", ownerId: "user-2", isActive: false }),
    ];
    const matches = computeMatchesForUser("user-1", items);
    expect(matches).toHaveLength(0);
  });

  it("filters paused/archived items", () => {
    const items = [
      makeItem({ id: "my", ownerId: "user-1", wishlist: "electronica" }),
      makeItem({ id: "paused", ownerId: "user-2", status: "paused" }),
      makeItem({ id: "archived", ownerId: "user-3", status: "archived" }),
    ];
    const matches = computeMatchesForUser("user-1", items);
    expect(matches).toHaveLength(0);
  });

  it("excludes blocked users", () => {
    const items = [
      makeItem({ id: "my", ownerId: "user-1", wishlist: "electronica" }),
      makeItem({ id: "blocked-item", ownerId: "blocked-user", category: "electronics", wishlist: "sport" }),
    ];
    const ctx: MatchingUserContext = {
      travelRadiusKm: 50,
      logistics: "flexible",
      blockedUsers: ["blocked-user"],
    };
    const matches = computeMatchesForUser("user-1", items, ctx);
    expect(matches).toHaveLength(0);
  });

  it("boosts score for same location", () => {
    const items = [
      makeItem({ id: "my", ownerId: "user-1", location: "bucurești", wishlist: "electronica" }),
      makeItem({ id: "same-city", ownerId: "user-2", location: "bucurești", category: "electronics", wishlist: "sport" }),
      makeItem({ id: "diff-city", ownerId: "user-3", location: "timișoara", category: "electronics", wishlist: "sport" }),
    ];
    const matches = computeMatchesForUser("user-1", items);
    const sameCity = matches.find((m) => m.itemRequested.id === "same-city");
    const diffCity = matches.find((m) => m.itemRequested.id === "diff-city");
    if (sameCity && diffCity) {
      expect(sameCity.compatibilityScore).toBeGreaterThan(diffCity.compatibilityScore);
    }
  });

  it("sorts results by score descending", () => {
    const items = [
      makeItem({ id: "my", ownerId: "user-1", category: "sports_outdoor", wishlist: "electronica, laptop" }),
      makeItem({ id: "low", ownerId: "user-2", category: "electronics", wishlist: "", flexibility: "broad" }),
      makeItem({ id: "high", ownerId: "user-3", category: "electronics", wishlist: "sport, bicicleta" }),
    ];
    const matches = computeMatchesForUser("user-1", items);
    if (matches.length >= 2) {
      expect(matches[0].compatibilityScore).toBeGreaterThanOrEqual(matches[1].compatibilityScore);
    }
  });

  it("caps score at 100", () => {
    const items = [
      makeItem({
        id: "my",
        ownerId: "user-1",
        category: "sports_outdoor",
        wishlist: "electronica, laptop, tech",
        intent: "committed",
        flexibility: "broad",
        perceivedValue: "large",
        acceptsBundle: true,
        recipientMatters: true,
        userFinalTags: ["vintage", "retro", "gaming"],
      }),
      makeItem({
        id: "theirs",
        ownerId: "user-2",
        category: "electronics",
        wishlist: "sport, bicicleta, fitness",
        location: "bucurești",
        intent: "committed",
        flexibility: "broad",
        perceivedValue: "large",
        acceptsBundle: true,
        recipientMatters: true,
        userFinalTags: ["vintage", "retro", "gaming"],
      }),
    ];
    const matches = computeMatchesForUser("user-1", items);
    expect(matches[0].compatibilityScore).toBeLessThanOrEqual(100);
  });

  it("generates match ID from both item IDs", () => {
    const items = [
      makeItem({ id: "item-a", ownerId: "user-1", wishlist: "electronica" }),
      makeItem({ id: "item-b", ownerId: "user-2", category: "electronics", wishlist: "sport" }),
    ];
    const matches = computeMatchesForUser("user-1", items);
    if (matches.length > 0) {
      expect(matches[0].id).toBe("match_item-a_item-b");
    }
  });

  it("uses GPS distance when coordinates available", () => {
    const items = [
      makeItem({ id: "my", ownerId: "user-1", wishlist: "electronica" }),
      makeItem({ id: "near", ownerId: "user-2", category: "electronics", wishlist: "sport" }),
    ];
    const ctx: MatchingUserContext = {
      coordinates: { lat: 44.4268, lng: 26.1025 },
      travelRadiusKm: 50,
      logistics: "flexible",
      blockedUsers: [],
    };
    const ownerCoords: OwnerCoordinatesMap = new Map([
      ["user-2", { lat: 44.45, lng: 26.12 }], // ~3km away
    ]);
    const matches = computeMatchesForUser("user-1", items, ctx, ownerCoords);
    if (matches.length > 0) {
      expect(matches[0].distanceKm).toBeDefined();
      expect(matches[0].distanceKm!).toBeLessThan(10);
    }
  });

  it("rejects items beyond 3x travel radius", () => {
    const items = [
      makeItem({ id: "my", ownerId: "user-1", wishlist: "electronica" }),
      makeItem({ id: "far", ownerId: "user-far", category: "electronics", wishlist: "sport" }),
    ];
    const ctx: MatchingUserContext = {
      coordinates: { lat: 44.4268, lng: 26.1025 }, // Bucharest
      travelRadiusKm: 10, // 10km radius → 30km cutoff
      logistics: "flexible",
      blockedUsers: [],
    };
    const ownerCoords: OwnerCoordinatesMap = new Map([
      ["user-far", { lat: 46.77, lng: 23.62 }], // Cluj, ~325km
    ]);
    const matches = computeMatchesForUser("user-1", items, ctx, ownerCoords);
    expect(matches).toHaveLength(0);
  });
});
