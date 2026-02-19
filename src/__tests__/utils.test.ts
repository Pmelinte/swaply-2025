import { describe, it, expect } from "vitest";
import { formatDate, formatScore } from "@/lib/utils";

describe("formatDate", () => {
  it("formats ISO date to Romanian short format", () => {
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
