import { describe, expect, it } from "vitest";
import {
  canParticipantCancel,
  isCancellableSwapStatus,
  isCancellationCounted,
  normalizeCancelReason,
  requiresCancelReason,
  validateCancelReason,
} from "./cancelPolicy";

describe("Batch 63.1 cancel policy", () => {
  it("allows cancellation only from the three pre-terminal states", () => {
    expect(isCancellableSwapStatus("pending")).toBe(true);
    expect(isCancellableSwapStatus("accepted")).toBe(true);
    expect(isCancellableSwapStatus("in_progress")).toBe(true);
    expect(isCancellableSwapStatus("completed")).toBe(false);
    expect(isCancellableSwapStatus("cancelled")).toBe(false);
    expect(isCancellableSwapStatus("disputed")).toBe(false);
  });

  it("restricts pending withdrawal to the requester", () => {
    expect(canParticipantCancel("pending", "requester")).toBe(true);
    expect(canParticipantCancel("pending", "responder")).toBe(false);
    expect(canParticipantCancel("accepted", "requester")).toBe(true);
    expect(canParticipantCancel("accepted", "responder")).toBe(true);
    expect(canParticipantCancel("in_progress", "requester")).toBe(true);
    expect(canParticipantCancel("in_progress", "responder")).toBe(true);
  });

  it("requires a reason only after acceptance", () => {
    expect(requiresCancelReason("pending")).toBe(false);
    expect(requiresCancelReason("accepted")).toBe(true);
    expect(requiresCancelReason("in_progress")).toBe(true);
    expect(validateCancelReason("pending", "")).toEqual({
      ok: true,
      reason: "withdrawn",
    });
    expect(validateCancelReason("accepted", "  ")).toEqual({
      ok: false,
      message: "Cancellation reason is required after acceptance",
    });
  });

  it("normalizes and limits the persisted reason", () => {
    expect(normalizeCancelReason("  courier unavailable  ")).toBe(
      "courier unavailable",
    );
    expect(validateCancelReason("accepted", "courier unavailable")).toEqual({
      ok: true,
      reason: "courier unavailable",
    });
    expect(validateCancelReason("accepted", "x".repeat(501))).toEqual({
      ok: false,
      message: "Cancellation reason is too long",
    });
  });

  it("counts only cancellations after a swap was accepted", () => {
    expect(isCancellationCounted("pending")).toBe(false);
    expect(isCancellationCounted("accepted")).toBe(true);
    expect(isCancellationCounted("in_progress")).toBe(true);
  });
});
