import { describe, expect, it } from "vitest";
import { safeSwapStatus } from "@/lib/state/helpers";
import {
  SWAP_STATUSES,
  SWAP_TRANSITIONS,
  allowedSwapTransitions,
  canTransitionSwap,
  isSwapStatus,
  isTerminalSwapStatus,
} from "./lifecycle";

describe("Batch 61.1 canonical swap lifecycle", () => {
  it("uses one exact global status vocabulary", () => {
    expect(SWAP_STATUSES).toEqual([
      "pending",
      "accepted",
      "in_progress",
      "completed",
      "rejected",
      "cancelled",
      "expired",
      "disputed",
    ]);

    expect(Object.keys(SWAP_TRANSITIONS)).toEqual([...SWAP_STATUSES]);
  });

  it("keeps the state mapper aligned with every canonical status", () => {
    for (const status of SWAP_STATUSES) {
      expect(safeSwapStatus(status)).toBe(status);
    }
  });

  it("rejects logistics and dispute-resolution aliases as global statuses", () => {
    for (const alias of [
      "delivered_by_a",
      "delivered_by_b",
      "planning",
      "in_transit",
      "delivered",
      "resolved",
    ]) {
      expect(isSwapStatus(alias)).toBe(false);
      expect(safeSwapStatus(alias)).toBe("pending");
    }
  });

  it("pins the canonical transition graph", () => {
    expect(allowedSwapTransitions("pending")).toEqual([
      "accepted",
      "rejected",
      "cancelled",
      "expired",
    ]);
    expect(allowedSwapTransitions("accepted")).toEqual([
      "in_progress",
      "completed",
      "cancelled",
      "disputed",
    ]);
    expect(allowedSwapTransitions("in_progress")).toEqual([
      "completed",
      "cancelled",
      "disputed",
    ]);
  });

  it("keeps terminal statuses immutable", () => {
    for (const status of [
      "completed",
      "rejected",
      "cancelled",
      "expired",
      "disputed",
    ] as const) {
      expect(isTerminalSwapStatus(status)).toBe(true);
      expect(allowedSwapTransitions(status)).toEqual([]);
    }
  });

  it("keeps the temporary accepted-to-completed compatibility bridge explicit", () => {
    expect(canTransitionSwap("accepted", "completed")).toBe(true);
    expect(canTransitionSwap("pending", "completed")).toBe(false);
    expect(canTransitionSwap("in_progress", "accepted")).toBe(false);
  });
});
