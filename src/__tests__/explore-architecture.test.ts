import { describe, expect, it } from "vitest";
import type { Item, WantedRequest } from "@/lib/types";
import {
  approximateLocation,
  filterDomainItems,
  getItemDomain,
  getItemFulfilment,
  getItemReach,
  inferDemandDomain,
  itemFallbackDemand,
  normalizeDemandRequests,
} from "@/lib/explore/exploreArchitecture";

function item(overrides: Partial<Item> = {}): Item {
  return {
    id: "item-1",
    ownerId: "owner-1",
    title: "Camera",
    category: "Electronics",
    condition: "good",
    description: "Available locally",
    wishlist: "A design service",
    status: "active",
    isActive: true,
    createdAt: "2026-09-02T00:00:00.000Z",
    location: "Strada Exactă 10, București, Romania",
    listingType: "object",
    ...overrides,
  };
}

describe("Explore architecture", () => {
  it("keeps all four domains distinct", () => {
    expect(getItemDomain(item())).toBe("objects");
    expect(getItemDomain(item({ listingType: "property" }))).toBe("properties");
    expect(getItemDomain(item({ listingType: "service" }))).toBe("services");
    expect(getItemDomain(item({ listingType: "event" }))).toBe("events");
  });

  it("separates geography from fulfilment", () => {
    const onlineService = item({
      listingType: "service",
      serviceProfile: {
        category: "creative",
        skillName: "Design",
        skillLevel: "expert",
        description: "Remote design",
        portfolio: [],
        hoursPerWeek: 4,
        delivery: "remote",
        hourlyEquivalent: 50,
      },
    });
    expect(getItemReach(onlineService)).toEqual(expect.arrayContaining(["online", "world"]));
    expect(getItemFulfilment(onlineService)).toEqual(["digital"]);

    const stay = item({ listingType: "property" });
    expect(getItemReach(stay)).toEqual(expect.arrayContaining(["travel", "world"]));
    expect(getItemFulfilment(stay)).toEqual(["in_person"]);
  });

  it("never forwards an exact multi-part location from fallback demand", () => {
    expect(approximateLocation("Strada Exactă 10, București, Romania")).toBe("București, Romania");
    expect(itemFallbackDemand([item()])[0]?.city).toBe("București, Romania");
  });

  it("filters the same active domain data used by the discovery views", () => {
    const rows = [
      item({ id: "object", title: "Camera" }),
      item({ id: "service", title: "Photo editing", listingType: "service" }),
      item({ id: "paused", title: "Camera bag", status: "paused" }),
    ];
    expect(filterDomainItems(rows, "objects", "camera").map((row) => row.id)).toEqual(["object"]);
    expect(filterDomainItems(rows, "services", "photo").map((row) => row.id)).toEqual(["service"]);
  });

  it("normalizes wanted requests into domain demand signals", () => {
    const request: WantedRequest = {
      id: "wanted-1",
      userId: "user-1",
      title: "Two tickets for a concert",
      category: "Events",
      city: "Venue Street 1, Paris, France",
      status: "active",
      expiresAt: "2026-10-01T00:00:00.000Z",
      createdAt: "2026-09-02T00:00:00.000Z",
    };
    expect(inferDemandDomain(request)).toBe("events");
    expect(normalizeDemandRequests([request])[0]).toMatchObject({ domain: "events", city: "Paris, France" });
  });
});
