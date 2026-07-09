import { describe, expect, it } from "vitest";
import { getItemImageUrl, getItemImageUrls } from "@/lib/item-image-src";

describe("item image source normalizer", () => {
  it("keeps plain string image URLs", () => {
    expect(getItemImageUrl("https://res.cloudinary.com/demo/image.jpg")).toBe(
      "https://res.cloudinary.com/demo/image.jpg",
    );
  });

  it("extracts URLs from object-shaped image records", () => {
    expect(getItemImageUrl({ url: "https://example.com/url.jpg" })).toBe("https://example.com/url.jpg");
    expect(getItemImageUrl({ secure_url: "https://example.com/secure.jpg" })).toBe(
      "https://example.com/secure.jpg",
    );
    expect(getItemImageUrl({ src: "https://example.com/static.jpg" })).toBe(
      "https://example.com/static.jpg",
    );
  });

  it("drops malformed objects before they reach Next Image metadata", () => {
    expect(getItemImageUrl({ width: 1200, height: 630 })).toBeUndefined();
    expect(getItemImageUrl(null)).toBeUndefined();
    expect(getItemImageUrl(["https://example.com/list.jpg"])).toBeUndefined();
  });

  it("normalizes mixed image arrays", () => {
    expect(
      getItemImageUrls([
        "https://example.com/a.jpg",
        { url: "https://example.com/b.jpg" },
        { width: 1 },
        "",
        null,
      ]),
    ).toEqual(["https://example.com/a.jpg", "https://example.com/b.jpg"]);
  });
});
