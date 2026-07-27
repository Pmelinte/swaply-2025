import { describe, expect, it } from "vitest";
import {
  canActorConfirmLeg,
  summarizeMultiUserLifecycle,
  type MultiUserLifecycleSnapshot,
} from "@/lib/swaps/multiUserLifecycle";

const baseSnapshot: MultiUserLifecycleSnapshot = {
  revision: 3,
  swapStatus: "in_progress",
  legs: [
    { id: "leg-a", fromUserId: "a", toUserId: "b", state: "fulfilled" },
    { id: "leg-b", fromUserId: "b", toUserId: "c", state: "sender_confirmed" },
    { id: "leg-c", fromUserId: "c", toUserId: "a", state: "reserved" },
  ],
};

describe("E3.4 multi-user lifecycle contract", () => {
  it("aggregates progress without allowing partial completion", () => {
    expect(summarizeMultiUserLifecycle(baseSnapshot)).toEqual({
      totalLegs: 3,
      senderConfirmedLegs: 2,
      receiverConfirmedLegs: 1,
      fulfilledLegs: 1,
      disputedLegs: 0,
      cancelledLegs: 0,
      completionEligible: false,
      blocked: false,
    });
  });

  it("allows completion only when every leg is fulfilled", () => {
    const snapshot: MultiUserLifecycleSnapshot = {
      ...baseSnapshot,
      legs: baseSnapshot.legs.map((leg) => ({ ...leg, state: "fulfilled" })),
    };

    expect(summarizeMultiUserLifecycle(snapshot).completionEligible).toBe(true);
  });

  it("blocks completion when any leg is disputed", () => {
    const snapshot: MultiUserLifecycleSnapshot = {
      ...baseSnapshot,
      legs: [
        { ...baseSnapshot.legs[0], state: "fulfilled" },
        { ...baseSnapshot.legs[1], state: "fulfilled" },
        { ...baseSnapshot.legs[2], state: "disputed" },
      ],
    };

    const summary = summarizeMultiUserLifecycle(snapshot);
    expect(summary.blocked).toBe(true);
    expect(summary.completionEligible).toBe(false);
  });

  it("restricts confirmations to the correct participant and state", () => {
    const leg = baseSnapshot.legs[2];
    expect(canActorConfirmLeg(leg, "c", "sender_confirm")).toBe(true);
    expect(canActorConfirmLeg(leg, "a", "sender_confirm")).toBe(false);
    expect(canActorConfirmLeg(leg, "a", "receiver_confirm")).toBe(false);

    const dispatched = { ...leg, state: "sender_confirmed" as const };
    expect(canActorConfirmLeg(dispatched, "a", "receiver_confirm")).toBe(true);
    expect(canActorConfirmLeg(dispatched, "c", "receiver_confirm")).toBe(false);
  });
});
