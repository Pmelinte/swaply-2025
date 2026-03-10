import { describe, it, expect } from "vitest";
import { generateDemoData, demoStats } from "@/lib/demo-generator";

describe("generateDemoData", () => {
  it("generates the requested number of items", () => {
    const data = generateDemoData(100, 1);
    expect(data.items.length).toBe(100);
  });

  it("generates users (~1 per 5 items, min 100)", () => {
    const data = generateDemoData(100, 1);
    expect(data.users.length).toBe(100); // min 100
  });

  it("generates users proportional to items for large counts", () => {
    const data = generateDemoData(1000, 1);
    expect(data.users.length).toBe(200); // 1000 / 5
  });

  it("generates matches (~1 per 3 items)", () => {
    const data = generateDemoData(300, 1);
    // matchCount = floor(300 / 3) = 100, minus failed same-owner attempts
    expect(data.matches.length).toBeGreaterThan(50);
    expect(data.matches.length).toBeLessThanOrEqual(100);
  });

  it("is reproducible with same seed", () => {
    const a = generateDemoData(50, 42);
    const b = generateDemoData(50, 42);
    expect(a.items[0].title).toBe(b.items[0].title);
    expect(a.users[0].displayName).toBe(b.users[0].displayName);
  });

  it("produces different data with different seeds", () => {
    const a = generateDemoData(50, 1);
    const b = generateDemoData(50, 99);
    // Not guaranteed different for tiny sets, but very likely
    const titlesA = a.items.map((i) => i.title).join(",");
    const titlesB = b.items.map((i) => i.title).join(",");
    expect(titlesA).not.toBe(titlesB);
  });

  it("items have all required fields", () => {
    const data = generateDemoData(50, 1);
    for (const item of data.items) {
      expect(item.id).toBeTruthy();
      expect(item.ownerId).toBeTruthy();
      expect(item.title).toBeTruthy();
      expect(item.category).toBeTruthy();
      expect(["new", "good", "used"]).toContain(item.condition);
      expect(item.description).toBeTruthy();
      expect(item.wishlist).toBeTruthy();
      expect(["active", "paused", "reserved", "traded", "archived"]).toContain(item.status);
      expect(item.isDemo).toBe(true);
      expect(item.createdAt).toBeTruthy();
      expect(item.photos.length).toBeGreaterThan(0);
    }
  });

  it("users have all required fields", () => {
    const data = generateDemoData(50, 1);
    for (const user of data.users) {
      expect(user.id).toBeTruthy();
      expect(user.email).toContain("@swaply.demo");
      expect(user.displayName).toBeTruthy();
      expect(["free", "premium", "platinum"]).toContain(user.badge);
      expect(user.location).toBeDefined();
      expect(user.languages.length).toBeGreaterThan(0);
      expect(user.languages).toContain("ro");
    }
  });

  it("matches have different owners for offered/requested items", () => {
    const data = generateDemoData(200, 1);
    for (const match of data.matches) {
      expect(match.itemOffered.ownerId).not.toBe(match.itemRequested.ownerId);
    }
  });

  it("match scores are in valid range", () => {
    const data = generateDemoData(200, 1);
    for (const match of data.matches) {
      expect(match.compatibilityScore).toBeGreaterThanOrEqual(15);
      expect(match.compatibilityScore).toBeLessThanOrEqual(98);
    }
  });

  it("match tiers correspond to scores", () => {
    const data = generateDemoData(200, 1);
    for (const match of data.matches) {
      const s = match.compatibilityScore;
      if (s >= 85) expect(match.tier).toBe("strong");
      else if (s >= 70) expect(match.tier).toBe("good");
      else if (s >= 40) expect(match.tier).toBe("possible");
      else expect(match.tier).toBe("weak");
    }
  });

  it("has ~70% objects, ~15% property, ~15% service", () => {
    const data = generateDemoData(1000, 42);
    const objects = data.items.filter((i) => (i.listingType ?? "object") === "object").length;
    const properties = data.items.filter((i) => i.listingType === "property").length;
    const services = data.items.filter((i) => i.listingType === "service").length;
    // Allow ±10% tolerance
    expect(objects).toBeGreaterThan(500);
    expect(objects).toBeLessThan(850);
    expect(properties).toBeGreaterThan(50);
    expect(services).toBeGreaterThan(50);
  });

  it("property items have houseProfile", () => {
    const data = generateDemoData(500, 1);
    const properties = data.items.filter((i) => i.listingType === "property");
    for (const item of properties) {
      expect(item.houseProfile).toBeDefined();
      expect(item.houseProfile!.bedrooms).toBeGreaterThan(0);
      expect(item.houseProfile!.amenities.length).toBeGreaterThan(0);
    }
  });

  it("service items have serviceProfile", () => {
    const data = generateDemoData(500, 1);
    const services = data.items.filter((i) => i.listingType === "service");
    for (const item of services) {
      expect(item.serviceProfile).toBeDefined();
      expect(item.serviceProfile!.skillName).toBeTruthy();
    }
  });
});

describe("demoStats", () => {
  it("computes correct totals", () => {
    const data = generateDemoData(100, 1);
    const stats = demoStats(data);
    expect(stats.totalItems).toBe(100);
    expect(stats.totalUsers).toBe(data.users.length);
    expect(stats.totalMatches).toBe(data.matches.length);
  });

  it("listing type counts add up", () => {
    const data = generateDemoData(200, 1);
    const stats = demoStats(data);
    expect(stats.objectCount + stats.propertyCount + stats.serviceCount).toBe(200);
  });

  it("average match score is reasonable", () => {
    const data = generateDemoData(300, 1);
    const stats = demoStats(data);
    expect(stats.avgMatchScore).toBeGreaterThan(20);
    expect(stats.avgMatchScore).toBeLessThan(90);
  });

  it("has unique cities", () => {
    const data = generateDemoData(200, 1);
    const stats = demoStats(data);
    expect(stats.uniqueCities).toBeGreaterThan(5);
  });
});
