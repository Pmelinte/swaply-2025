import { describe, it, expect } from "vitest";
import {
  safeString,
  safeBoolean,
  safeArray,
  safeObject,
  safeBadgeTier,
  safeNotificationPriority,
  safeSwapStatus,
  safeLocationType,
  computeTierBenefits,
  makeDmConversationId,
  parseDmConversationId,
} from "@/lib/state/helpers";

describe("safeString", () => {
  it("returns string value", () => {
    expect(safeString("hello")).toBe("hello");
  });

  it("returns fallback for non-string", () => {
    expect(safeString(123)).toBe("");
    expect(safeString(null)).toBe("");
    expect(safeString(undefined)).toBe("");
    expect(safeString(true, "fallback")).toBe("fallback");
  });
});

describe("safeBoolean", () => {
  it("returns boolean value", () => {
    expect(safeBoolean(true)).toBe(true);
    expect(safeBoolean(false)).toBe(false);
  });

  it("returns fallback for non-boolean", () => {
    expect(safeBoolean("true")).toBe(false);
    expect(safeBoolean(1, true)).toBe(true);
    expect(safeBoolean(undefined)).toBe(false);
  });
});

describe("safeArray", () => {
  it("returns array value", () => {
    expect(safeArray([1, 2, 3], [])).toEqual([1, 2, 3]);
  });

  it("returns fallback for non-array", () => {
    expect(safeArray("not-array", [1])).toEqual([1]);
    expect(safeArray(null, [])).toEqual([]);
  });
});

describe("safeObject", () => {
  it("returns object value", () => {
    const obj = { a: 1 };
    expect(safeObject(obj, {})).toEqual({ a: 1 });
  });

  it("returns fallback for non-object", () => {
    expect(safeObject("string", { x: 1 })).toEqual({ x: 1 });
    expect(safeObject(null, { x: 1 })).toEqual({ x: 1 });
  });
});

describe("safeBadgeTier", () => {
  it("returns valid badge tiers", () => {
    expect(safeBadgeTier("free")).toBe("free");
    expect(safeBadgeTier("premium")).toBe("premium");
    expect(safeBadgeTier("platinum")).toBe("platinum");
  });

  it("returns fallback for invalid tier", () => {
    expect(safeBadgeTier("gold")).toBe("free");
    expect(safeBadgeTier(null)).toBe("free");
  });
});

describe("safeNotificationPriority", () => {
  it("returns valid priorities", () => {
    expect(safeNotificationPriority("info")).toBe("info");
    expect(safeNotificationPriority("warning")).toBe("warning");
    expect(safeNotificationPriority("success")).toBe("success");
  });

  it("returns fallback for invalid", () => {
    expect(safeNotificationPriority("critical")).toBe("info");
  });
});

describe("safeSwapStatus", () => {
  it("returns all valid statuses", () => {
    for (const s of ["pending", "accepted", "rejected", "completed", "cancelled", "expired", "disputed"]) {
      expect(safeSwapStatus(s)).toBe(s);
    }
  });

  it("returns fallback for invalid", () => {
    expect(safeSwapStatus("unknown")).toBe("pending");
  });
});

describe("safeLocationType", () => {
  it("returns valid location types", () => {
    expect(safeLocationType("public_spot")).toBe("public_spot");
    expect(safeLocationType("courier")).toBe("courier");
    expect(safeLocationType("pickup")).toBe("pickup");
  });

  it("returns fallback for invalid", () => {
    expect(safeLocationType("drone")).toBe("public_spot");
  });
});

describe("computeTierBenefits", () => {
  it("returns free tier benefits", () => {
    const b = computeTierBenefits("free");
    expect(b.mapPinVisible).toBe(false);
    expect(b.priorityMatching).toBe(false);
    expect(b.monthlyTokens).toBe(10);
    expect(b.itemLimit).toBe(10);
    expect(b.adFree).toBe(false);
  });

  it("returns premium tier benefits", () => {
    const b = computeTierBenefits("premium");
    expect(b.mapPinVisible).toBe(true);
    expect(b.priorityMatching).toBe(true);
    expect(b.aiSuggestions).toBe(true);
    expect(b.monthlyTokens).toBe(50);
    expect(b.itemLimit).toBe(50);
    expect(b.adFree).toBe(true);
    expect(b.exportReports).toBe(false);
  });

  it("returns platinum tier benefits", () => {
    const b = computeTierBenefits("platinum");
    expect(b.monthlyTokens).toBe(999);
    expect(b.itemLimit).toBe(999);
    expect(b.exportReports).toBe(true);
    expect(b.auctionMode).toBe(true);
    expect(b.profileBadge).toBe(true);
    expect(b.prioritySupport).toBe(true);
  });
});

describe("makeDmConversationId", () => {
  it("creates deterministic ID regardless of order", () => {
    const id1 = makeDmConversationId("alice", "bob");
    const id2 = makeDmConversationId("bob", "alice");
    expect(id1).toBe(id2);
  });

  it("starts with dm: prefix", () => {
    expect(makeDmConversationId("a", "b")).toMatch(/^dm:/);
  });

  it("sorts user IDs alphabetically", () => {
    const id = makeDmConversationId("zebra", "alpha");
    expect(id).toBe("dm:alpha:zebra");
  });
});

describe("parseDmConversationId", () => {
  it("parses valid DM conversation ID", () => {
    const result = parseDmConversationId("dm:alice:bob");
    expect(result).toEqual({ a: "alice", b: "bob" });
  });

  it("returns null for non-dm prefix", () => {
    expect(parseDmConversationId("group:alice:bob")).toBeNull();
  });

  it("returns null for wrong part count", () => {
    expect(parseDmConversationId("dm:alice")).toBeNull();
    expect(parseDmConversationId("dm:a:b:c")).toBeNull();
  });

  it("returns null for empty parts", () => {
    expect(parseDmConversationId("dm::bob")).toBeNull();
  });
});
