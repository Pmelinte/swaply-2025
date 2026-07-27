import { describe, expect, it } from 'vitest';

import { evaluateExchangeAuthority } from '@/lib/exchange/multi-user-dispute-authority';

describe('E3.5 cancel, withdrawal and dispute authority', () => {
  it('allows proposer cancellation and releases active reservations', () => {
    const decision = evaluateExchangeAuthority({
      action: 'cancel_exchange',
      actorRole: 'proposer',
      swapStatus: 'in_progress',
      expectedRevision: 3,
      actualRevision: 3,
      participantCount: 3,
    });

    expect(decision.allowed).toBe(true);
    expect(decision.nextSwapStatus).toBe('cancelled');
    expect(decision.releaseActiveReservations).toBe(true);
  });

  it('rejects stale revision and outsider actions', () => {
    expect(
      evaluateExchangeAuthority({
        action: 'open_exchange_dispute',
        actorRole: 'participant',
        swapStatus: 'in_progress',
        expectedRevision: 2,
        actualRevision: 3,
        participantCount: 3,
      }).reason,
    ).toBe('stale_revision');

    expect(
      evaluateExchangeAuthority({
        action: 'cancel_exchange',
        actorRole: 'outsider',
        swapStatus: 'pending',
        expectedRevision: 1,
        actualRevision: 1,
        participantCount: 3,
      }).allowed,
    ).toBe(false);
  });

  it('permits self-withdrawal only before activation', () => {
    const pending = evaluateExchangeAuthority({
      action: 'withdraw_participant',
      actorRole: 'participant',
      swapStatus: 'accepted',
      expectedRevision: 2,
      actualRevision: 2,
      participantCount: 4,
      targetIsActor: true,
    });

    expect(pending.allowed).toBe(true);
    expect(pending.nextSwapStatus).toBe('pending');
    expect(pending.deactivateParticipant).toBe(true);

    const active = evaluateExchangeAuthority({
      action: 'withdraw_participant',
      actorRole: 'participant',
      swapStatus: 'in_progress',
      expectedRevision: 2,
      actualRevision: 2,
      participantCount: 4,
      targetIsActor: true,
    });

    expect(active.allowed).toBe(false);
    expect(active.reason).toBe('withdrawal_closed_after_activation');
  });

  it('cancels the exchange when withdrawal leaves fewer than two participants', () => {
    const decision = evaluateExchangeAuthority({
      action: 'withdraw_participant',
      actorRole: 'participant',
      swapStatus: 'pending',
      expectedRevision: 1,
      actualRevision: 1,
      participantCount: 2,
      targetIsActor: true,
    });

    expect(decision.allowed).toBe(true);
    expect(decision.nextSwapStatus).toBe('cancelled');
  });

  it('opens a leg dispute only on an existing active unfulfilled leg', () => {
    const decision = evaluateExchangeAuthority({
      action: 'open_leg_dispute',
      actorRole: 'participant',
      swapStatus: 'in_progress',
      expectedRevision: 5,
      actualRevision: 5,
      participantCount: 3,
      targetLegExists: true,
      targetLegState: 'sender_confirmed',
    });

    expect(decision.allowed).toBe(true);
    expect(decision.nextSwapStatus).toBe('disputed');
    expect(decision.markTargetLegDisputed).toBe(true);

    const fulfilled = evaluateExchangeAuthority({
      action: 'open_leg_dispute',
      actorRole: 'participant',
      swapStatus: 'in_progress',
      expectedRevision: 5,
      actualRevision: 5,
      participantCount: 3,
      targetLegExists: true,
      targetLegState: 'fulfilled',
    });

    expect(fulfilled.allowed).toBe(false);
    expect(fulfilled.reason).toBe('fulfilled_leg_requires_exchange_review');
  });

  it('treats repeated terminal authority calls as idempotent', () => {
    const cancelled = evaluateExchangeAuthority({
      action: 'cancel_exchange',
      actorRole: 'proposer',
      swapStatus: 'cancelled',
      expectedRevision: 4,
      actualRevision: 4,
      participantCount: 3,
    });

    const disputed = evaluateExchangeAuthority({
      action: 'open_exchange_dispute',
      actorRole: 'participant',
      swapStatus: 'disputed',
      expectedRevision: 4,
      actualRevision: 4,
      participantCount: 3,
    });

    expect(cancelled.idempotent).toBe(true);
    expect(disputed.idempotent).toBe(true);
  });

  it('keeps completed exchanges terminal', () => {
    const decision = evaluateExchangeAuthority({
      action: 'open_exchange_dispute',
      actorRole: 'participant',
      swapStatus: 'completed',
      expectedRevision: 2,
      actualRevision: 2,
      participantCount: 3,
    });

    expect(decision.allowed).toBe(false);
    expect(decision.reason).toBe('completed_exchange_is_terminal');
  });
});
