export const MULTI_USER_EXCHANGE_KINDS = ["bilateral", "circular", "bundle"] as const;
export type MultiUserExchangeKind = (typeof MULTI_USER_EXCHANGE_KINDS)[number];

export const MULTI_USER_PARTICIPANT_ROLES = ["proposer", "participant", "observer"] as const;
export type MultiUserParticipantRole = (typeof MULTI_USER_PARTICIPANT_ROLES)[number];

export const MULTI_USER_PARTICIPANT_STATES = ["invited", "active", "withdrawn", "removed"] as const;
export type MultiUserParticipantState = (typeof MULTI_USER_PARTICIPANT_STATES)[number];

export const MULTI_USER_LEG_STATES = ["draft", "reserved", "fulfilled", "cancelled", "disputed"] as const;
export type MultiUserLegState = (typeof MULTI_USER_LEG_STATES)[number];

export interface MultiUserParticipant {
  userId: string;
  role: MultiUserParticipantRole;
  state: MultiUserParticipantState;
  position: number;
}

export interface MultiUserExchangeLeg {
  fromUserId: string;
  toUserId: string;
  itemId: string | null;
  position: number;
}

export interface MultiUserExchangeDraft {
  kind: MultiUserExchangeKind;
  revision: number;
  participants: MultiUserParticipant[];
  legs: MultiUserExchangeLeg[];
}

export interface MultiUserContractValidation {
  valid: boolean;
  errors: string[];
}

export function validateMultiUserExchangeDraft(draft: MultiUserExchangeDraft): MultiUserContractValidation {
  const errors: string[] = [];
  const activeParticipants = draft.participants.filter((participant) => participant.state === "active");
  const activeIds = new Set(activeParticipants.map((participant) => participant.userId));

  if (!Number.isInteger(draft.revision) || draft.revision < 1) {
    errors.push("revision_must_be_positive_integer");
  }

  if (draft.kind !== "bilateral" && activeParticipants.length < 3) {
    errors.push("multi_user_exchange_requires_at_least_three_active_participants");
  }

  if (draft.kind === "bilateral" && activeParticipants.length !== 2) {
    errors.push("bilateral_exchange_requires_exactly_two_active_participants");
  }

  if (activeIds.size !== activeParticipants.length) {
    errors.push("active_participants_must_be_unique");
  }

  const proposerCount = activeParticipants.filter((participant) => participant.role === "proposer").length;
  if (proposerCount !== 1) {
    errors.push("exchange_requires_exactly_one_active_proposer");
  }

  for (const leg of draft.legs) {
    if (!activeIds.has(leg.fromUserId) || !activeIds.has(leg.toUserId)) {
      errors.push("every_leg_must_reference_active_participants");
      break;
    }
    if (leg.fromUserId === leg.toUserId) {
      errors.push("exchange_leg_cannot_target_same_participant");
      break;
    }
  }

  if (draft.kind === "circular" && !formsClosedCircle(activeIds, draft.legs)) {
    errors.push("circular_exchange_must_form_one_closed_circle");
  }

  return { valid: errors.length === 0, errors };
}

function formsClosedCircle(participantIds: Set<string>, legs: MultiUserExchangeLeg[]): boolean {
  if (legs.length !== participantIds.size) return false;

  const outgoing = new Map<string, string>();
  const incoming = new Map<string, number>();
  for (const leg of legs) {
    if (outgoing.has(leg.fromUserId)) return false;
    outgoing.set(leg.fromUserId, leg.toUserId);
    incoming.set(leg.toUserId, (incoming.get(leg.toUserId) ?? 0) + 1);
  }

  if ([...participantIds].some((id) => !outgoing.has(id) || incoming.get(id) !== 1)) return false;

  const start = participantIds.values().next().value as string | undefined;
  if (!start) return false;

  const visited = new Set<string>();
  let current = start;
  while (!visited.has(current)) {
    visited.add(current);
    const next = outgoing.get(current);
    if (!next) return false;
    current = next;
  }

  return current === start && visited.size === participantIds.size;
}
