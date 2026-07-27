export type ConsentParticipantState = "invited" | "active" | "withdrawn" | "removed";
export type ConsentParticipantRole = "proposer" | "participant" | "observer";

export interface ConsentParticipant {
  participantId: string;
  userId: string;
  role: ConsentParticipantRole;
  state: ConsentParticipantState;
}

export interface RevisionAcceptance {
  participantId: string;
  revision: number;
}

export interface UnanimousConsentSnapshot {
  revision: number;
  participants: ConsentParticipant[];
  acceptances: RevisionAcceptance[];
}

export interface UnanimousConsentResult {
  revision: number;
  requiredParticipantIds: string[];
  acceptedParticipantIds: string[];
  missingParticipantIds: string[];
  unanimous: boolean;
}

export function evaluateUnanimousConsent(snapshot: UnanimousConsentSnapshot): UnanimousConsentResult {
  if (!Number.isInteger(snapshot.revision) || snapshot.revision < 1) {
    throw new Error("revision_must_be_positive_integer");
  }

  const requiredParticipantIds = snapshot.participants
    .filter((participant) => participant.state === "active" && participant.role !== "observer")
    .map((participant) => participant.participantId);

  const requiredSet = new Set(requiredParticipantIds);
  const acceptedParticipantIds = Array.from(new Set(
    snapshot.acceptances
      .filter((acceptance) => acceptance.revision === snapshot.revision)
      .map((acceptance) => acceptance.participantId)
      .filter((participantId) => requiredSet.has(participantId)),
  ));

  const acceptedSet = new Set(acceptedParticipantIds);
  const missingParticipantIds = requiredParticipantIds.filter((participantId) => !acceptedSet.has(participantId));

  return {
    revision: snapshot.revision,
    requiredParticipantIds,
    acceptedParticipantIds,
    missingParticipantIds,
    unanimous: requiredParticipantIds.length >= 2 && missingParticipantIds.length === 0,
  };
}

export function canAcceptRevision(input: {
  currentRevision: number;
  expectedRevision: number;
  participant: ConsentParticipant | null;
}): { allowed: boolean; error: string | null } {
  if (input.expectedRevision !== input.currentRevision) {
    return { allowed: false, error: "stale_revision" };
  }
  if (!input.participant) {
    return { allowed: false, error: "not_a_participant" };
  }
  if (input.participant.role === "observer") {
    return { allowed: false, error: "observer_cannot_accept" };
  }
  if (input.participant.state !== "active") {
    return { allowed: false, error: "participant_not_active" };
  }
  return { allowed: true, error: null };
}

export function nextAgreementRevision(currentRevision: number, expectedRevision: number): number {
  if (currentRevision !== expectedRevision) throw new Error("stale_revision");
  if (!Number.isInteger(currentRevision) || currentRevision < 1) {
    throw new Error("revision_must_be_positive_integer");
  }
  return currentRevision + 1;
}
