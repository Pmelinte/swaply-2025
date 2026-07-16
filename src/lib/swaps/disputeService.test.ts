import { describe, expect, it } from "vitest";
import {
  buildOpenDisputeIdempotencyKey,
  mapDisputeErrorStatus,
} from "./disputeService";

describe("Batch 63.2 dispute adapter", () => {
  it("builds one deterministic open-dispute key per actor and Swap", () => {
    const input = {
      swapId: "00000000-0000-4000-8000-000000000063",
      actorId: "00000000-0000-4000-8000-000000000064",
    };
    expect(buildOpenDisputeIdempotencyKey(input)).toBe(
      "dispute:00000000-0000-4000-8000-000000000063:00000000-0000-4000-8000-000000000064",
    );
    expect(buildOpenDisputeIdempotencyKey(input)).toBe(
      buildOpenDisputeIdempotencyKey(input),
    );
  });

  it("maps stale state and command conflicts to HTTP 409", () => {
    expect(mapDisputeErrorStatus("40001")).toBe(409);
    expect(mapDisputeErrorStatus("23505")).toBe(409);
  });

  it("keeps authorization, not-found and validation failures distinct", () => {
    expect(mapDisputeErrorStatus("42501")).toBe(403);
    expect(mapDisputeErrorStatus("P0002")).toBe(404);
    expect(mapDisputeErrorStatus("22023")).toBe(422);
    expect(mapDisputeErrorStatus("23514")).toBe(422);
    expect(mapDisputeErrorStatus(undefined)).toBe(500);
  });
});
