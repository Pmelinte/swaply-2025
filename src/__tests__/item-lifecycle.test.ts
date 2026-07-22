import { describe, expect, it } from "vitest";
import { isItemLifecycleStatus, itemEditPayload, itemLifecyclePatch, publicItemSelect } from "@/lib/items/item-lifecycle";
import type { Item } from "@/lib/types";

describe("item lifecycle helpers", () => {
  it("accepts only owner lifecycle statuses", () => {
    expect(isItemLifecycleStatus("active")).toBe(true);
    expect(isItemLifecycleStatus("paused")).toBe(true);
    expect(isItemLifecycleStatus("archived")).toBe(true);
    expect(isItemLifecycleStatus("traded")).toBe(false);
    expect(isItemLifecycleStatus("deleted")).toBe(false);
  });

  it("maps lifecycle status to active visibility without deletion", () => {
    expect(itemLifecyclePatch("active")).toMatchObject({ status: "active", is_active: true });
    expect(itemLifecyclePatch("paused")).toMatchObject({ status: "paused", is_active: false });
    expect(itemLifecyclePatch("archived")).toMatchObject({ status: "archived", is_active: false });
  });

  it("builds an owner-bound edit payload without accepting client owner changes", () => {
    const payload = itemEditPayload({
      id: "item-1",
      ownerId: "attacker",
      title: "Camera",
      category: "Electronics",
      condition: "good",
      description: "Mirrorless camera",
      status: "active",
      isActive: true,
      photos: ["https://example.com/a.jpg"],
      userFinalTags: ["photo"],
    } as Item, "owner-1");

    expect(payload.owner_id).toBe("owner-1");
    expect(payload.image_url).toBe("https://example.com/a.jpg");
    expect(payload.images).toEqual(["https://example.com/a.jpg"]);
  });

  it("keeps public detail selection limited", () => {
    expect(publicItemSelect()).toContain("title");
    expect(publicItemSelect()).not.toContain("email");
    expect(publicItemSelect()).not.toContain("phone");
  });
});
