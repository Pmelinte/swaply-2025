import { describe, expect, it, vi } from "vitest";
import { createMapItem } from "@/lib/state/mappers";

vi.mock("nanoid", () => ({ nanoid: () => "mock-id" }));

describe("canonical object wants mapping", () => {
  const mapItem = createMapItem({ current: null });

  it("prefers swap_wants_description over legacy values", () => {
    const item = mapItem({
      title: "Camera",
      swap_wants_description: "A compact laptop",
      wishlist: "A bicycle",
      ai_metadata: { wishlist: "A tablet" },
    });

    expect(item.wishlist).toBe("A compact laptop");
  });

  it("falls back to ai_metadata wishlist for older rows", () => {
    const item = mapItem({
      title: "Camera",
      ai_metadata: { wishlist: "A tablet" },
      wishlist: "A bicycle",
    });

    expect(item.wishlist).toBe("A tablet");
  });

  it("keeps the legacy wishlist as the final compatibility fallback", () => {
    const item = mapItem({
      title: "Camera",
      wishlist: "A bicycle",
    });

    expect(item.wishlist).toBe("A bicycle");
  });

  it("returns an empty wants value when no source is present", () => {
    const item = mapItem({ title: "Camera" });

    expect(item.wishlist).toBe("");
  });
});
