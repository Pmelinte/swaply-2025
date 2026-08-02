import { describe, expect, it } from "vitest";

import {
  domainListAllows,
  isMatchingPairCompatible,
  normalizeMatchingDomain,
  normalizeMatchingDomainList,
} from "@/lib/matching/domainCompatibility";

describe("V1-05.4.1 cross-domain compatibility", () => {
  it("normalizes only the four canonical domains", () => {
    expect(normalizeMatchingDomain(" Property ")).toBe("property");
    expect(normalizeMatchingDomain("EVENT")).toBe("event");
    expect(normalizeMatchingDomain("house")).toBeNull();
    expect(normalizeMatchingDomainList(["object", "event", "OBJECT", "x"]))
      .toEqual(["object", "event"]);
  });

  it("treats null or empty preference arrays as open constraints", () => {
    expect(domainListAllows(null, "service")).toBe(true);
    expect(domainListAllows([], "event")).toBe(true);
    expect(domainListAllows(["anything"], "property")).toBe(true);
    expect(domainListAllows(["object"], "property")).toBe(false);
  });

  it("permits a pair only when both listings accept the other domain", () => {
    expect(
      isMatchingPairCompatible(
        {
          item_type: "service",
          swap_open_to: ["object", "property"],
          swap_wants_type: ["object"],
        },
        {
          item_type: "object",
          swap_open_to: ["service"],
          swap_wants_type: ["service"],
        },
      ),
    ).toBe(true);

    expect(
      isMatchingPairCompatible(
        {
          item_type: "service",
          swap_open_to: ["object"],
          swap_wants_type: ["object"],
        },
        {
          item_type: "object",
          swap_open_to: ["object"],
          swap_wants_type: ["object"],
        },
      ),
    ).toBe(false);
  });

  it("supports same-domain matching without weakening explicit restrictions", () => {
    expect(
      isMatchingPairCompatible(
        {
          item_type: "property",
          swap_open_to: ["property"],
          swap_wants_type: ["property"],
        },
        {
          item_type: "property",
          swap_open_to: ["property"],
          swap_wants_type: ["property"],
        },
      ),
    ).toBe(true);

    expect(
      isMatchingPairCompatible(
        {
          item_type: "event",
          swap_open_to: ["service"],
          swap_wants_type: ["service"],
        },
        {
          item_type: "event",
          swap_open_to: ["event"],
          swap_wants_type: ["event"],
        },
      ),
    ).toBe(false);
  });

  it("fails closed for unknown domains", () => {
    expect(
      isMatchingPairCompatible(
        { item_type: "house", swap_open_to: [], swap_wants_type: [] },
        { item_type: "object", swap_open_to: [], swap_wants_type: [] },
      ),
    ).toBe(false);
  });
});
