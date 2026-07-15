import { describe, expect, it } from "vitest";
import {
  buildSwapCancelIdempotencyKey,
  mapSwapCancelErrorStatus,
} from "./cancelService";

describe("Batch 63.1 cancel adapter", () => {
  it("builds a deterministic key for one expected cancellation state", () => {
    const input = {
      swapId: "00000000-0000-4000-8000-000000000063",
      expectedStatus: "accepted" as const,
    };

    expect(buildSwapCancelIdempotencyKey(input)).toBe(
      "cancel:00000000-0000-4000-8000-000000000063:accepted",
    );
    expect(buildSwapCancelIdempotencyKey(input)).toBe(
      buildSwapCancelIdempotencyKey(input),
    );
  });

  it("maps stale state and idempotency conflicts to HTTP 409", () => {
    expect(mapSwapCancelErrorStatus("40001")).toBe(409);
    expect(mapSwapCancelErrorStatus("23505")).toBe(409);
  });

  it("keeps authorization, not-found and validation failures distinct", () => {
    expect(mapSwapCancelErrorStatus("42501")).toBe(403);
    expect(mapSwapCancelErrorStatus("P0002")).toBe(404);
    expect(mapSwapCancelErrorStatus("22023")).toBe(422);
    expect(mapSwapCancelErrorStatus("23514")).toBe(422);
    expect(mapSwapCancelErrorStatus(undefined)).toBe(500);
  });
});
