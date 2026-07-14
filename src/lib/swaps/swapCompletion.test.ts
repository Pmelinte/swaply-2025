import { describe, expect, it } from "vitest";
import {
  buildSwapCompletionIdempotencyKey,
  mapSwapCompletionErrorStatus,
} from "./swapCompletion";

describe("Batch 61.3 bilateral completion adapter", () => {
  it("builds an actor-scoped retry key", () => {
    expect(
      buildSwapCompletionIdempotencyKey(
        "00000000-0000-4000-8000-000000000061",
        "00000000-0000-4000-8000-000000000062",
        "retry-1",
      ),
    ).toBe(
      "completion:00000000-0000-4000-8000-000000000061:00000000-0000-4000-8000-000000000062:retry-1",
    );
  });

  it("maps authorization, stale/conflict and contract failures", () => {
    expect(mapSwapCompletionErrorStatus("42501")).toBe(403);
    expect(mapSwapCompletionErrorStatus("P0002")).toBe(404);
    expect(mapSwapCompletionErrorStatus("40001")).toBe(409);
    expect(mapSwapCompletionErrorStatus("23505")).toBe(409);
    expect(mapSwapCompletionErrorStatus("22023")).toBe(422);
    expect(mapSwapCompletionErrorStatus("23514")).toBe(422);
    expect(mapSwapCompletionErrorStatus(undefined)).toBe(500);
  });
});
