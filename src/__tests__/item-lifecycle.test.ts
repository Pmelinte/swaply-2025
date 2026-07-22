import { describe, expect, it } from "vitest";
import { isItemLifecycleStatus, itemEditPayload, itemLifecyclePatch, publicItemSelect, serviceOwnerEditPatch } from "@/lib/items/item-lifecycle";
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

  it("builds a service owner edit patch without owner fields", () => {
    const patch = serviceOwnerEditPatch({
      title: " Remote design review ",
      description: "A detailed remote design review for product teams with notes and next steps.",
      serviceData: { service_modality: "remote", availability_days: ["monday"] },
      swapWantsDescription: "Other service",
      perceivedValueTier: "medium",
    });

    expect(patch).toMatchObject({
      title: "Remote design review",
      category: "service",
      item_type: "service",
      wizard_type: "service",
      swap_wants_description: "Other service",
    });
    expect(patch).not.toHaveProperty("owner_id");
    expect(patch.service_data).toMatchObject({
      service_title: "Remote design review",
      service_modality: "remote",
    });
  });

  it("keeps public detail selection limited", () => {
    expect(publicItemSelect()).toContain("title");
    expect(publicItemSelect()).not.toContain("email");
    expect(publicItemSelect()).not.toContain("phone");
  });
});
