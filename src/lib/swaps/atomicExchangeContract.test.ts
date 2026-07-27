import { describe, expect, it } from "vitest";
import { validateAtomicExchangeActivation } from "./atomicExchangeContract";

const participants = [
  { userId: "a", role: "proposer" as const, state: "active" as const, position: 0 },
  { userId: "b", role: "participant" as const, state: "active" as const, position: 1 },
  { userId: "c", role: "participant" as const, state: "active" as const, position: 2 },
];

const circularLegs = [
  { fromUserId: "a", toUserId: "b", itemId: "item-a", position: 0 },
  { fromUserId: "b", toUserId: "c", itemId: "item-b", position: 1 },
  { fromUserId: "c", toUserId: "a", itemId: "item-c", position: 2 },
];

describe("validateAtomicExchangeActivation", () => {
  it("accepts one fully consented closed circle", () => {
    const result = validateAtomicExchangeActivation({
      kind: "circular",
      revision: 2,
      status: "accepted",
      participants,
      legs: circularLegs,
      acceptedUserIds: ["a", "b", "c"],
    });

    expect(result).toEqual({
      valid: true,
      errors: [],
      reservableItemIds: ["item-a", "item-b", "item-c"],
    });
  });

  it("rejects a partial or stale consent set", () => {
    const result = validateAtomicExchangeActivation({
      kind: "circular",
      revision: 2,
      status: "accepted",
      participants,
      legs: circularLegs,
      acceptedUserIds: ["a", "b"],
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toContain("every_active_participant_must_accept_current_revision");
    expect(result.reservableItemIds).toEqual([]);
  });

  it("rejects a broken circle", () => {
    const result = validateAtomicExchangeActivation({
      kind: "circular",
      revision: 1,
      status: "accepted",
      participants,
      legs: [
        circularLegs[0],
        circularLegs[1],
        { fromUserId: "c", toUserId: "b", itemId: "item-c", position: 2 },
      ],
      acceptedUserIds: ["a", "b", "c"],
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toContain("circular_exchange_must_form_one_closed_circle");
  });

  it("rejects duplicate or unavailable items without partial reservations", () => {
    const result = validateAtomicExchangeActivation({
      kind: "bundle",
      revision: 3,
      status: "accepted",
      participants,
      legs: [
        { fromUserId: "a", toUserId: "b", itemId: "shared", position: 0 },
        { fromUserId: "b", toUserId: "c", itemId: "shared", position: 1 },
        { fromUserId: "c", toUserId: "a", itemId: "unavailable", position: 2 },
      ],
      acceptedUserIds: ["a", "b", "c"],
      unavailableItemIds: ["unavailable"],
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toContain("atomic_exchange_items_must_be_unique");
    expect(result.errors).toContain("all_exchange_items_must_be_available");
    expect(result.reservableItemIds).toEqual([]);
  });

  it("accepts a bundle only when every active participant is involved", () => {
    const result = validateAtomicExchangeActivation({
      kind: "bundle",
      revision: 1,
      status: "accepted",
      participants,
      legs: [
        { fromUserId: "a", toUserId: "b", itemId: "item-a", position: 0 },
        { fromUserId: "b", toUserId: "a", itemId: "item-b", position: 1 },
      ],
      acceptedUserIds: ["a", "b", "c"],
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toContain("bundle_exchange_must_involve_every_active_participant");
  });
});
