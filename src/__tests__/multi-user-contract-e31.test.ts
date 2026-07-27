import { describe, expect, it } from "vitest";
import { validateMultiUserExchangeDraft } from "@/lib/swaps/multiUserContract";

const active = (userId: string, role: "proposer" | "participant" = "participant", position = 0) => ({
  userId,
  role,
  state: "active" as const,
  position,
});

describe("E3.1 multi-user exchange contract", () => {
  it("accepts one closed three-party circle", () => {
    const result = validateMultiUserExchangeDraft({
      kind: "circular",
      revision: 1,
      participants: [active("a", "proposer", 0), active("b", "participant", 1), active("c", "participant", 2)],
      legs: [
        { fromUserId: "a", toUserId: "b", itemId: "item-a", position: 0 },
        { fromUserId: "b", toUserId: "c", itemId: "item-b", position: 1 },
        { fromUserId: "c", toUserId: "a", itemId: "item-c", position: 2 },
      ],
    });

    expect(result).toEqual({ valid: true, errors: [] });
  });

  it("rejects a circular exchange with a missing participant leg", () => {
    const result = validateMultiUserExchangeDraft({
      kind: "circular",
      revision: 1,
      participants: [active("a", "proposer", 0), active("b", "participant", 1), active("c", "participant", 2)],
      legs: [
        { fromUserId: "a", toUserId: "b", itemId: "item-a", position: 0 },
        { fromUserId: "b", toUserId: "a", itemId: "item-b", position: 1 },
      ],
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toContain("circular_exchange_must_form_one_closed_circle");
  });

  it("keeps bilateral compatibility explicit", () => {
    const result = validateMultiUserExchangeDraft({
      kind: "bilateral",
      revision: 1,
      participants: [active("a", "proposer", 0), active("b", "participant", 1)],
      legs: [
        { fromUserId: "a", toUserId: "b", itemId: "item-a", position: 0 },
        { fromUserId: "b", toUserId: "a", itemId: "item-b", position: 1 },
      ],
    });

    expect(result.valid).toBe(true);
  });

  it("rejects duplicate active participants and self-directed legs", () => {
    const result = validateMultiUserExchangeDraft({
      kind: "bundle",
      revision: 1,
      participants: [active("a", "proposer", 0), active("a", "participant", 1), active("c", "participant", 2)],
      legs: [{ fromUserId: "a", toUserId: "a", itemId: null, position: 0 }],
    });

    expect(result.errors).toContain("active_participants_must_be_unique");
    expect(result.errors).toContain("exchange_leg_cannot_target_same_participant");
  });
});
