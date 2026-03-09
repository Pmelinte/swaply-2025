/**
 * Server-side pagination utilities.
 * Supports cursor-based and offset-based pagination for Supabase queries.
 */

export interface PaginationParams {
  /** Number of items per page */
  limit: number;
  /** Cursor for cursor-based pagination (created_at ISO string) */
  cursor?: string;
  /** Offset for offset-based pagination */
  offset?: number;
  /** Sort direction */
  direction?: "asc" | "desc";
}

export interface PaginatedResult<T> {
  data: T[];
  nextCursor: string | null;
  hasMore: boolean;
  total?: number;
}

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

/**
 * Parse pagination params from URL search params or request body.
 */
export function parsePaginationParams(
  params: Record<string, string | undefined>,
): PaginationParams {
  const limit = Math.min(
    Math.max(1, parseInt(params.limit ?? String(DEFAULT_PAGE_SIZE), 10) || DEFAULT_PAGE_SIZE),
    MAX_PAGE_SIZE,
  );
  const cursor = params.cursor || undefined;
  const offset = params.offset ? Math.max(0, parseInt(params.offset, 10) || 0) : undefined;
  const direction = params.direction === "asc" ? "asc" : "desc";

  return { limit, cursor, offset, direction };
}

/**
 * Apply cursor-based pagination to a Supabase query builder.
 * Returns a function that wraps the result into PaginatedResult.
 *
 * Usage:
 * ```ts
 * const { query, wrapResult } = applyCursorPagination(
 *   supabase.from("items").select("*").eq("is_active", true),
 *   { limit: 20, cursor: "2026-01-01T00:00:00Z", direction: "desc" },
 *   "created_at"
 * );
 * const { data, error } = await query;
 * return wrapResult(data ?? []);
 * ```
 */
export function applyCursorPagination<T extends Record<string, unknown>>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  queryBuilder: any,
  params: PaginationParams,
  cursorColumn: string = "created_at",
) {
  let query = queryBuilder;

  // Apply cursor filter
  if (params.cursor) {
    if (params.direction === "desc") {
      query = query.lt(cursorColumn, params.cursor);
    } else {
      query = query.gt(cursorColumn, params.cursor);
    }
  }

  // Order and limit (fetch one extra to determine hasMore)
  query = query
    .order(cursorColumn, { ascending: params.direction === "asc" })
    .limit(params.limit + 1);

  function wrapResult(data: T[]): PaginatedResult<T> {
    const hasMore = data.length > params.limit;
    const items = hasMore ? data.slice(0, params.limit) : data;
    const lastItem = items[items.length - 1];
    const nextCursor = hasMore && lastItem
      ? String(lastItem[cursorColumn] ?? "")
      : null;

    return {
      data: items,
      nextCursor,
      hasMore,
    };
  }

  return { query, wrapResult };
}

/**
 * Apply offset-based pagination to a Supabase query builder.
 */
export function applyOffsetPagination<T>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  queryBuilder: any,
  params: PaginationParams,
  orderColumn: string = "created_at",
) {
  const offset = params.offset ?? 0;

  const query = queryBuilder
    .order(orderColumn, { ascending: params.direction === "asc" })
    .range(offset, offset + params.limit - 1);

  function wrapResult(data: T[], count?: number): PaginatedResult<T> {
    return {
      data,
      nextCursor: null,
      hasMore: count ? offset + params.limit < count : data.length === params.limit,
      total: count,
    };
  }

  return { query, wrapResult };
}
