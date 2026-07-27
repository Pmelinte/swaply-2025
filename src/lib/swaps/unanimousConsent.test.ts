import { describe, expect, it } from "vitest";
import {
  canAcceptRevision,
  evaluateUnanimousConsent,
  nextAgreementRevision,
  type ConsentParticipant,
} from "./unanimousConsent";

const participants: ConsentParticipant[] = [
  { participantId: "p1", userId: "u1", role: "proposer", state: "active" },
  { participantId: "p2", userId: "u2", role: "participant", state: "active" },
  { participantId: "p3", userId: "u3", role: "participant", state: "active" },
  { participantId: "p4", userId: "u4", role: "observer", state: "active" },
];

describe("E3.2 unanimous consent", () => {
  it("requires every active non-observer participant on the current revision", () => {
    const result = evaluateUnanimousConsent({
      revision: 2,
      participants,
      acceptances: [
        { participantId: "p1", revision: 2 },
        { participantId: "p2", revision: 2 },
        { participantId: "p3", revision: 2 },
      ],
    });

    expect(result.unanimous).toBe(true);
    expect(result.requiredParticipantIds).toEqual(["p1", "p2", "p3"]);
    expect(result.missingParticipantIds).toEqual([]);
  });

  it("does not count stale acceptances from a previous revision", () => {
    const result = evaluateUnanimousConsent({
      revision: 3,
      participants,
      acceptances: [
        { participantId: "p1", revision: 2 },
        { participantId: "p2", revision: 2 },
        { participantId: "p3", revision: 3 },
      ],
    });

    expect(result.unanimous).toBe(false);
    expect(result.missingParticipantIds).toEqual(["p1", "p2"]);
  });

  it("deduplicates replayed acceptance evidence", () => {
    const result = evaluateUnanimousConsent({
      revision: 1,
      participants: participants.slice(0, 2),
      acceptances: [
        { participantId: "p1", revision: 1 },
        { participantId: "p1", revision: 1 },
        { participantId: "p2", revision: 1 },
      ],
    });

    expect(result.acceptedParticipantIds).toEqual(["p1", "p2"]);
    expect(result.unanimous).toBe(true);
  });

  it("rejects stale revision, observers and inactive participants", () => {
    expect(canAcceptRevision({
      currentRevision: 2,
      expectedRevision: 1,
      participant: participants[0],
    })).toEqual({ allowed: false, error: "stale_revision" });

    expect(canAcceptRevision({
      currentRevision: 2,
      expectedRevision: 2,
      participant: participants[3],
    })).toEqual({ allowed: false, error: "observer_cannot_accept" });

    expect(canAcceptRevision({
      currentRevision: 2,
      expectedRevision: 2,
      participant: { ...participants[1], state: "withdrawn" },
    })).toEqual({ allowed: false, error: "participant_not_active" });
  });

  it("increments only the expected current revision", () => {
    expect(nextAgreementRevision(4, 4)).toBe(5);
    expect(() => nextAgreementRevision(4, 3)).toThrow("stale_revision");
  });
});
