import { describe, expect, it } from "vitest";
import { filterGlobalExploreItems, getApproximateLocation, toGlobalExploreItems } from "@/lib/explore/globalExplore";
import { searchParamsToFilters } from "@/lib/explore/exploreFilters";
import type { Item } from "@/lib/types";

const base = { ownerId: "owner-a", condition: "good", wishlist: "", status: "active", isActive: true, createdAt: "2026-07-23T00:00:00Z", location: "Street 1, Bucharest, Romania", description: "", category: "Electronics" } satisfies Partial<Item>;

function item(id: string, patch: Partial<Item>): Item {
  return { id, title: id, ...base, ...patch } as Item;
}

describe("global explore", () => {
  it("normalizes active cross-domain rows with safe approximate locations", () => {
    const rows = toGlobalExploreItems([
      item("object-1", { listingType: "object" }),
      item("property-1", { listingType: "property", category: "House" }),
      item("service-1", { listingType: "service", category: "Design" }),
      item("event-1", { experienceData: { eventDate: "2026-08-01" }, category: "Concert" }),
      item("paused-1", { status: "paused", isActive: false }),
    ]);

    expect(rows.map((row) => row.domain)).toEqual(["objects", "properties", "services", "events"]);
    expect(rows[0].approximateLocation).toBe("Bucharest, Romania");
    expect(getApproximateLocation(undefined)).toBe("Approximate area only");
  });

  it("filters by global query and contextual URL filters", () => {
    const rows = toGlobalExploreItems([
      item("camera-1", { title: "Camera", category: "Electronics" }),
      item("villa-1", { listingType: "property", title: "Villa", category: "House", location: "Cluj, Romania" }),
    ]);
    const sp = new URLSearchParams("q=&wPropCountry=Romania&oPropCountry=Romania");
    expect(filterGlobalExploreItems(rows, searchParamsToFilters(sp), "villa").map((row) => row.id)).toEqual(["villa-1"]);
  });
});
