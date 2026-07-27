export type ExchangeAuthorityAction =
  | 'cancel_exchange'
  | 'withdraw_participant'
  | 'open_leg_dispute'
  | 'open_exchange_dispute';

export type ExchangeAuthorityActorRole =
  | 'proposer'
  | 'participant'
  | 'observer'
  | 'outsider';

export type ExchangeAuthoritySwapStatus =
  | 'pending'
  | 'accepted'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'disputed';

export interface ExchangeAuthorityInput {
  action: ExchangeAuthorityAction;
  actorRole: ExchangeAuthorityActorRole;
  swapStatus: ExchangeAuthoritySwapStatus;
  expectedRevision: number;
  actualRevision: number;
  participantCount: number;
  targetIsActor?: boolean;
  targetLegExists?: boolean;
  targetLegState?:
    | 'draft'
    | 'reserved'
    | 'sender_confirmed'
    | 'fulfilled'
    | 'cancelled'
    | 'disputed';
}

export interface ExchangeAuthorityDecision {
  allowed: boolean;
  idempotent: boolean;
  nextSwapStatus: ExchangeAuthoritySwapStatus;
  releaseActiveReservations: boolean;
  markTargetLegDisputed: boolean;
  deactivateParticipant: boolean;
  reason: string;
}

export function evaluateExchangeAuthority(
  input: ExchangeAuthorityInput,
): ExchangeAuthorityDecision {
  if (input.expectedRevision !== input.actualRevision) {
    return denied(input.swapStatus, 'stale_revision');
  }

  if (input.actorRole === 'observer' || input.actorRole === 'outsider') {
    return denied(input.swapStatus, 'participant_authority_required');
  }

  if (input.swapStatus === 'completed') {
    return denied(input.swapStatus, 'completed_exchange_is_terminal');
  }

  if (input.action === 'cancel_exchange') {
    if (input.swapStatus === 'cancelled') {
      return {
        allowed: true,
        idempotent: true,
        nextSwapStatus: 'cancelled',
        releaseActiveReservations: false,
        markTargetLegDisputed: false,
        deactivateParticipant: false,
        reason: 'already_cancelled',
      };
    }

    if (input.actorRole !== 'proposer') {
      return denied(input.swapStatus, 'proposer_authority_required');
    }

    if (!['pending', 'accepted', 'in_progress'].includes(input.swapStatus)) {
      return denied(input.swapStatus, 'exchange_cannot_be_cancelled');
    }

    return {
      allowed: true,
      idempotent: false,
      nextSwapStatus: 'cancelled',
      releaseActiveReservations: true,
      markTargetLegDisputed: false,
      deactivateParticipant: false,
      reason: 'exchange_cancelled',
    };
  }

  if (input.action === 'withdraw_participant') {
    if (!input.targetIsActor) {
      return denied(input.swapStatus, 'self_withdrawal_only');
    }

    if (!['pending', 'accepted'].includes(input.swapStatus)) {
      return denied(input.swapStatus, 'withdrawal_closed_after_activation');
    }

    const remainingParticipants = input.participantCount - 1;
    return {
      allowed: true,
      idempotent: false,
      nextSwapStatus: remainingParticipants >= 2 ? 'pending' : 'cancelled',
      releaseActiveReservations: true,
      markTargetLegDisputed: false,
      deactivateParticipant: true,
      reason:
        remainingParticipants >= 2
          ? 'participant_withdrawn_revision_invalidated'
          : 'insufficient_participants_after_withdrawal',
    };
  }

  if (input.action === 'open_leg_dispute') {
    if (!input.targetLegExists) {
      return denied(input.swapStatus, 'leg_not_found');
    }

    if (input.targetLegState === 'disputed' && input.swapStatus === 'disputed') {
      return {
        allowed: true,
        idempotent: true,
        nextSwapStatus: 'disputed',
        releaseActiveReservations: false,
        markTargetLegDisputed: false,
        deactivateParticipant: false,
        reason: 'already_disputed',
      };
    }

    if (!['in_progress', 'disputed'].includes(input.swapStatus)) {
      return denied(input.swapStatus, 'leg_dispute_requires_active_exchange');
    }

    if (input.targetLegState === 'fulfilled') {
      return denied(input.swapStatus, 'fulfilled_leg_requires_exchange_review');
    }

    return {
      allowed: true,
      idempotent: false,
      nextSwapStatus: 'disputed',
      releaseActiveReservations: false,
      markTargetLegDisputed: true,
      deactivateParticipant: false,
      reason: 'leg_dispute_opened',
    };
  }

  if (input.swapStatus === 'disputed') {
    return {
      allowed: true,
      idempotent: true,
      nextSwapStatus: 'disputed',
      releaseActiveReservations: false,
      markTargetLegDisputed: false,
      deactivateParticipant: false,
      reason: 'already_disputed',
    };
  }

  if (!['accepted', 'in_progress'].includes(input.swapStatus)) {
    return denied(input.swapStatus, 'exchange_dispute_requires_committed_exchange');
  }

  return {
    allowed: true,
    idempotent: false,
    nextSwapStatus: 'disputed',
    releaseActiveReservations: false,
    markTargetLegDisputed: false,
    deactivateParticipant: false,
    reason: 'exchange_dispute_opened',
  };
}

function denied(
  status: ExchangeAuthoritySwapStatus,
  reason: string,
): ExchangeAuthorityDecision {
  return {
    allowed: false,
    idempotent: false,
    nextSwapStatus: status,
    releaseActiveReservations: false,
    markTargetLegDisputed: false,
    deactivateParticipant: false,
    reason,
  };
}
