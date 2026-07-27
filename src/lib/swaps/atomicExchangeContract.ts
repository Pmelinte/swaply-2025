import type { MultiUserExchangeKind, MultiUserExchangeLeg, MultiUserParticipant } from "./multiUserContract";

export interface AtomicExchangeActivationInput {
  kind: MultiUserExchangeKind;
  revision: number;
  status: string;
  participants: MultiUserParticipant[];
  legs: MultiUserExchangeLeg[];
  acceptedUserIds: string[];
  unavailableItemIds?: string[];
}

export interface AtomicExchangeActivationResult {
  valid: boolean;
  errors: string[];
  reservableItemIds: string[];
}

export function validateAtomicExchangeActivation(
  input: AtomicExchangeActivationInput,
): AtomicExchangeActivationResult {
  const errors: string[] = [];
  const activeParticipants = input.participants.filter(
    (participant) => participant.state === "active" && participant.role !== "observer",
  );
  const activeIds = new Set(activeParticipants.map((participant) => participant.userId));
  const acceptedIds = new Set(input.acceptedUserIds);
  const unavailableIds = new Set(input.unavailableItemIds ?? []);
  const itemIds = input.legs
    .map((leg) => leg.itemId)
    .filter((itemId): itemId is string => Boolean(itemId));

  if (!Number.isInteger(input.revision) || input.revision < 1) {
    errors.push("revision_must_be_positive_integer");
  }

  if (input.status !== "accepted") {
    errors.push("exchange_requires_unanimous_accepted_status");
  }

  if (activeParticipants.length < 2) {
    errors.push("exchange_requires_at_least_two_active_participants");
  }

  if (activeParticipants.some((participant) => !acceptedIds.has(participant.userId))) {
    errors.push("every_active_participant_must_accept_current_revision");
  }

  if (input.legs.length === 0) {
    errors.push("exchange_requires_at_least_one_leg");
  }

  for (const leg of input.legs) {
    if (!activeIds.has(leg.fromUserId) || !activeIds.has(leg.toUserId)) {
      errors.push("every_leg_must_reference_active_participants");
      break;
    }
    if (leg.fromUserId === leg.toUserId) {
      errors.push("exchange_leg_cannot_target_same_participant");
      break;
    }
    if (!leg.itemId) {
      errors.push("every_atomic_leg_requires_an_item");
      break;
    }
  }

  if (new Set(itemIds).size !== itemIds.length) {
    errors.push("atomic_exchange_items_must_be_unique");
  }

  if (itemIds.some((itemId) => unavailableIds.has(itemId))) {
    errors.push("all_exchange_items_must_be_available");
  }

  if (input.kind === "circular" && !formsSingleClosedCircle(activeIds, input.legs)) {
    errors.push("circular_exchange_must_form_one_closed_circle");
  }

  if (input.kind === "bundle" && !coversEveryParticipant(activeIds, input.legs)) {
    errors.push("bundle_exchange_must_involve_every_active_participant");
  }

  return {
    valid: errors.length === 0,
    errors,
    reservableItemIds: errors.length === 0 ? itemIds : [],
  };
}

function coversEveryParticipant(participantIds: Set<string>, legs: MultiUserExchangeLeg[]): boolean {
  const involved = new Set<string>();
  for (const leg of legs) {
    involved.add(leg.fromUserId);
    involved.add(leg.toUserId);
  }
  return [...participantIds].every((id) => involved.has(id));
}

function formsSingleClosedCircle(participantIds: Set<string>, legs: MultiUserExchangeLeg[]): boolean {
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
