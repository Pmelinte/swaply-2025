import { describe, it, expect } from "vitest";
import { parsePaginationParams, applyCursorPagination, applyOffsetPagination } from "@/lib/pagination";

describe("parsePaginationParams", () => {
  it("returns defaults for empty params", () => {
    const result = parsePaginationParams({});
    expect(result.limit).toBe(20);
    expect(result.cursor).toBeUndefined();
    expect(result.offset).toBeUndefined();
    expect(result.direction).toBe("desc");
  });

  it("parses valid limit", () => {
    const result = parsePaginationParams({ limit: "50" });
    expect(result.limit).toBe(50);
  });

  it("clamps limit to MAX_PAGE_SIZE (100)", () => {
    const result = parsePaginationParams({ limit: "500" });
    expect(result.limit).toBe(100);
  });

  it("falls back to default for zero limit", () => {
    const result = parsePaginationParams({ limit: "0" });
    // parseInt("0") = 0, then Math.max(1, 0) = 1, but || DEFAULT gives 20 since 0 is falsy
    expect(result.limit).toBe(20);
  });

  it("handles invalid limit gracefully", () => {
    const result = parsePaginationParams({ limit: "abc" });
    expect(result.limit).toBe(20);
  });

  it("parses cursor", () => {
    const result = parsePaginationParams({ cursor: "2026-01-01T00:00:00Z" });
    expect(result.cursor).toBe("2026-01-01T00:00:00Z");
  });

  it("parses offset", () => {
    const result = parsePaginationParams({ offset: "40" });
    expect(result.offset).toBe(40);
  });

  it("clamps negative offset to 0", () => {
    const result = parsePaginationParams({ offset: "-10" });
    expect(result.offset).toBe(0);
  });

  it("parses ascending direction", () => {
    const result = parsePaginationParams({ direction: "asc" });
    expect(result.direction).toBe("asc");
  });

  it("defaults to desc for invalid direction", () => {
    const result = parsePaginationParams({ direction: "random" });
    expect(result.direction).toBe("desc");
  });
});

describe("applyCursorPagination", () => {
  // Mock query builder
  function mockQueryBuilder() {
    const calls: Record<string, unknown[]> = {};
    const builder = {
      lt: (...args: unknown[]) => { calls.lt = args; return builder; },
      gt: (...args: unknown[]) => { calls.gt = args; return builder; },
      order: (...args: unknown[]) => { calls.order = args; return builder; },
      limit: (...args: unknown[]) => { calls.limit = args; return builder; },
      _calls: calls,
    };
    return builder;
  }

  it("wraps result with hasMore=true when extra item returned", () => {
    const qb = mockQueryBuilder();
    const { wrapResult } = applyCursorPagination(qb, { limit: 2, direction: "desc" });

    const data = [
      { id: "1", created_at: "2026-03-01" },
      { id: "2", created_at: "2026-02-01" },
      { id: "3", created_at: "2026-01-01" }, // extra item
    ];
    const result = wrapResult(data);
    expect(result.hasMore).toBe(true);
    expect(result.data).toHaveLength(2);
    expect(result.nextCursor).toBe("2026-02-01");
  });

  it("wraps result with hasMore=false when exact count", () => {
    const qb = mockQueryBuilder();
    const { wrapResult } = applyCursorPagination(qb, { limit: 3, direction: "desc" });

    const data = [
      { id: "1", created_at: "2026-03-01" },
      { id: "2", created_at: "2026-02-01" },
    ];
    const result = wrapResult(data);
    expect(result.hasMore).toBe(false);
    expect(result.data).toHaveLength(2);
    expect(result.nextCursor).toBeNull();
  });

  it("applies cursor filter with desc direction", () => {
    const qb = mockQueryBuilder();
    applyCursorPagination(qb, { limit: 10, cursor: "2026-01-01", direction: "desc" });
    expect(qb._calls.lt).toEqual(["created_at", "2026-01-01"]);
  });

  it("applies cursor filter with asc direction", () => {
    const qb = mockQueryBuilder();
    applyCursorPagination(qb, { limit: 10, cursor: "2026-01-01", direction: "asc" });
    expect(qb._calls.gt).toEqual(["created_at", "2026-01-01"]);
  });

  it("handles empty result set", () => {
    const qb = mockQueryBuilder();
    const { wrapResult } = applyCursorPagination(qb, { limit: 10, direction: "desc" });
    const result = wrapResult([]);
    expect(result.hasMore).toBe(false);
    expect(result.data).toHaveLength(0);
    expect(result.nextCursor).toBeNull();
  });
});

describe("applyOffsetPagination", () => {
  function mockQueryBuilder() {
    const calls: Record<string, unknown[]> = {};
    const builder = {
      order: (...args: unknown[]) => { calls.order = args; return builder; },
      range: (...args: unknown[]) => { calls.range = args; return builder; },
      _calls: calls,
    };
    return builder;
  }

  it("wraps result with total count", () => {
    const qb = mockQueryBuilder();
    const { wrapResult } = applyOffsetPagination(qb, { limit: 10, offset: 0, direction: "desc" });

    const data = Array.from({ length: 10 }, (_, i) => ({ id: String(i) }));
    const result = wrapResult(data, 25);
    expect(result.hasMore).toBe(true);
    expect(result.total).toBe(25);
  });

  it("detects no more when offset + limit >= total", () => {
    const qb = mockQueryBuilder();
    const { wrapResult } = applyOffsetPagination(qb, { limit: 10, offset: 20, direction: "desc" });

    const data = Array.from({ length: 5 }, (_, i) => ({ id: String(i) }));
    const result = wrapResult(data, 25);
    expect(result.hasMore).toBe(false);
  });

  it("applies correct range", () => {
    const qb = mockQueryBuilder();
    applyOffsetPagination(qb, { limit: 20, offset: 40, direction: "asc" });
    expect(qb._calls.range).toEqual([40, 59]);
  });
});
