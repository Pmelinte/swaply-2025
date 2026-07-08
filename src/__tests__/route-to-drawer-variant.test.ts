import { describe, expect, it } from "vitest";
import {
  getDrawerVariantForPathname,
  stripLocaleFromPathname,
} from "@/lib/drawer/routeToDrawerVariant";

describe("route to drawer variant resolver", () => {
  it("strips locale prefixes while preserving root", () => {
    expect(stripLocaleFromPathname("/en")).toBe("/");
    expect(stripLocaleFromPathname("/ro/objects")).toBe("/objects");
    expect(stripLocaleFromPathname("/fil/matching?slot1=item-one")).toBe("/matching");
    expect(stripLocaleFromPathname("/de/exchange/")).toBe("/exchange");
  });

  it("maps primary domain pages to contextual drawers", () => {
    expect(getDrawerVariantForPathname("/en/objects")).toEqual({ type: "contextual", page: "objects" });
    expect(getDrawerVariantForPathname("/en/properties")).toEqual({ type: "contextual", page: "properties" });
    expect(getDrawerVariantForPathname("/en/services")).toEqual({ type: "contextual", page: "services" });
    expect(getDrawerVariantForPathname("/en/events")).toEqual({ type: "contextual", page: "events" });
  });

  it("maps legacy object routes to the objects contextual drawer", () => {
    expect(getDrawerVariantForPathname("/items/item-one")).toEqual({ type: "contextual", page: "objects" });
    expect(getDrawerVariantForPathname("/my-objects")).toEqual({ type: "contextual", page: "objects" });
    expect(getDrawerVariantForPathname("/wishlist")).toEqual({ type: "contextual", page: "objects" });
  });

  it("maps workflow routes to their drawer variants", () => {
    expect(getDrawerVariantForPathname("/matching")).toEqual({ type: "contextual", page: "matching" });
    expect(getDrawerVariantForPathname("/matches/item-one")).toEqual({ type: "contextual", page: "matching" });
    expect(getDrawerVariantForPathname("/messages")).toEqual({ type: "contextual", page: "messages" });
    expect(getDrawerVariantForPathname("/chat/item-one")).toEqual({ type: "contextual", page: "chat" });
    expect(getDrawerVariantForPathname("/exchange/item-one")).toEqual({ type: "contextual", page: "exchange" });
    expect(getDrawerVariantForPathname("/exchanges/item-one")).toEqual({ type: "contextual", page: "exchange" });
    expect(getDrawerVariantForPathname("/change/item-one")).toEqual({ type: "contextual", page: "exchange" });
  });

  it("maps learning surfaces to contextual drawers", () => {
    expect(getDrawerVariantForPathname("/blog/how-to-swap")).toEqual({ type: "contextual", page: "blog" });
    expect(getDrawerVariantForPathname("/stories")).toEqual({ type: "contextual", page: "stories" });
  });

  it("falls back to home for root and unknown pages", () => {
    expect(getDrawerVariantForPathname("/")).toEqual({ type: "home" });
    expect(getDrawerVariantForPathname("/en")).toEqual({ type: "home" });
    expect(getDrawerVariantForPathname("/contact")).toEqual({ type: "home" });
  });
});
