import { describe, expect, it } from "vitest";
import {
  buildSwapTransitionIdempotencyKey,
  mapSwapTransitionErrorStatus,
} from "./transitionService";

describe("Batch 61.2 swap transition adapter", () => {
  it("builds a deterministic key for a single directed transition", () => {
    const input = {
      swapId: "00000000-0000-4000-8000-000000000061",
      expectedStatus: "pending" as const,
      toStatus: "accepted" as const,
    };

    expect(buildSwapTransitionIdempotencyKey(input)).toBe(
      "swap:00000000-0000-4000-8000-000000000061:pending:accepted",
    );
    expect(buildSwapTransitionIdempotencyKey(input)).toBe(
      buildSwapTransitionIdempotencyKey(input),
    );
  });

  it("maps stale state and duplicate conflicts to HTTP 409", () => {
    expect(mapSwapTransitionErrorStatus("40001")).toBe(409);
    expect(mapSwapTransitionErrorStatus("23505")).toBe(409);
  });

  it("keeps authorization, not-found and contract errors distinct", () => {
    expect(mapSwapTransitionErrorStatus("42501")).toBe(403);
    expect(mapSwapTransitionErrorStatus("P0002")).toBe(404);
    expect(mapSwapTransitionErrorStatus("22023")).toBe(422);
    expect(mapSwapTransitionErrorStatus("23514")).toBe(422);
    expect(mapSwapTransitionErrorStatus(undefined)).toBe(500);
  });
});
