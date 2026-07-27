import { describe, expect, it } from 'vitest';

import {
  assertVerifiedWebhook,
  canonicalStatusForWebhook,
  createWebhookLedgerEntry,
  markWebhookAttempt,
  reconcilePaymentStatus,
  shouldApplyWebhookEvent,
  webhookDeduplicationKey,
} from '@/lib/commerce/webhook-authority';

const digest = 'a'.repeat(64);

function verifiedEnvelope() {
  return assertVerifiedWebhook({
    provider: 'sandbox',
    providerEventId: 'evt_12345678',
    providerObjectId: 'pi_12345678',
    eventType: 'payment-succeeded',
    createdAt: '2026-07-27T10:00:00.000Z',
    receivedAt: '2026-07-27T10:00:01.000Z',
    payloadDigest: digest,
    signatureVerified: true,
  });
}

describe('E4.5 webhook authority', () => {
  it('fails closed when the signature is not verified', () => {
    expect(() =>
      assertVerifiedWebhook({
        provider: 'stripe',
        providerEventId: 'evt_12345678',
        providerObjectId: 'pi_12345678',
        eventType: 'payment-succeeded',
        createdAt: '2026-07-27T10:00:00.000Z',
        receivedAt: '2026-07-27T10:00:01.000Z',
        payloadDigest: digest,
        signatureVerified: false,
      }),
    ).toThrow('webhook-signature-not-verified');
  });

  it('produces a stable provider event deduplication key', () => {
    expect(
      webhookDeduplicationKey({ provider: 'stripe', providerEventId: 'evt_12345678' }),
    ).toBe('stripe:evt_12345678');
  });

  it('maps authoritative provider events to canonical payment statuses', () => {
    expect(canonicalStatusForWebhook('payment-succeeded')).toBe('paid');
    expect(canonicalStatusForWebhook('refund-succeeded')).toBe('refunded');
  });

  it('ignores stale out-of-order events after a higher-priority event', () => {
    expect(
      shouldApplyWebhookEvent({
        currentEventType: 'payment-succeeded',
        incomingEventType: 'payment-pending',
      }),
    ).toBe(false);
    expect(
      shouldApplyWebhookEvent({
        currentEventType: 'payment-succeeded',
        incomingEventType: 'refund-succeeded',
      }),
    ).toBe(true);
  });

  it('replays a processed event without creating a second effect', () => {
    const entry = createWebhookLedgerEntry({ envelope: verifiedEnvelope(), orderId: 'order-1' });
    const processed = markWebhookAttempt(entry, {
      succeeded: true,
      processedAt: '2026-07-27T10:00:02.000Z',
    });
    const replay = markWebhookAttempt(processed, {
      succeeded: true,
      processedAt: '2026-07-27T10:00:03.000Z',
    });

    expect(replay).toEqual(processed);
    expect(replay.attemptCount).toBe(1);
  });

  it('moves failed processing to retry and then dead-letter', () => {
    let entry = createWebhookLedgerEntry({ envelope: verifiedEnvelope(), orderId: 'order-1' });
    entry = markWebhookAttempt(entry, {
      succeeded: false,
      processedAt: '2026-07-27T10:00:02.000Z',
      retryAt: '2026-07-27T10:01:00.000Z',
      maximumAttempts: 2,
      errorCode: 'database-temporarily-unavailable',
    });
    expect(entry.processingStatus).toBe('retry-pending');

    entry = markWebhookAttempt(entry, {
      succeeded: false,
      processedAt: '2026-07-27T10:01:01.000Z',
      maximumAttempts: 2,
      errorCode: 'database-temporarily-unavailable',
    });
    expect(entry.processingStatus).toBe('dead-letter');
    expect(entry.attemptCount).toBe(2);
  });

  it('treats the provider as authoritative during reconciliation except cancelled orders', () => {
    expect(
      reconcilePaymentStatus({
        orderId: 'order-1',
        provider: 'stripe',
        providerObjectId: 'pi_1',
        localStatus: 'payment-pending',
        providerStatus: 'paid',
        checkedAt: '2026-07-27T11:00:00.000Z',
      }),
    ).toEqual({ consistent: false, authoritativeStatus: 'paid', action: 'apply-provider-status' });

    expect(
      reconcilePaymentStatus({
        orderId: 'order-2',
        provider: 'stripe',
        providerObjectId: 'pi_2',
        localStatus: 'cancelled',
        providerStatus: 'paid',
        checkedAt: '2026-07-27T11:00:00.000Z',
      }).action,
    ).toBe('manual-review');
  });
});
