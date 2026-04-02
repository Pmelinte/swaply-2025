import { describe, it, expect } from "vitest";
import { cn, formatDate, formatScore } from "@/lib/utils";

describe("cn (class merge utility)", () => {
  it("merges simple class strings", () => {
    expect(cn("px-2", "py-1")).toBe("px-2 py-1");
  });

  it("handles conflicting Tailwind classes", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
  });

  it("handles conditional classes", () => {
    expect(cn("base", false && "hidden", "extra")).toBe("base extra");
  });

  it("handles undefined and null", () => {
    expect(cn("base", undefined, null, "end")).toBe("base end");
  });

  it("handles empty string", () => {
    expect(cn("", "px-2")).toBe("px-2");
  });
});

describe("formatDate", () => {
  it("formats ISO date to short format", () => {
    const result = formatDate("2026-01-15T12:00:00Z");
    expect(result).toBeTruthy();
    expect(result).toContain("15");
  });

  it("handles different months", () => {
    const jun = formatDate("2026-06-01T00:00:00Z");
    expect(jun).toBeTruthy();
    expect(jun).toContain("1");
  });

  it("handles edge case: beginning of year", () => {
    const result = formatDate("2026-01-01T00:00:00Z");
    expect(result).toBeTruthy();
  });

  it("handles edge case: end of year", () => {
    const result = formatDate("2026-12-31T23:59:59Z");
    expect(result).toContain("31");
  });
});

describe("formatScore", () => {
  it("formats score as percentage", () => {
    expect(formatScore(85)).toBe("85%");
  });

  it("formats zero score", () => {
    expect(formatScore(0)).toBe("0%");
  });

  it("formats 100% score", () => {
    expect(formatScore(100)).toBe("100%");
  });

  it("formats decimal score", () => {
    expect(formatScore(33.5)).toBe("33.5%");
  });
});
