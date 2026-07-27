import { describe, expect, it } from 'vitest';

import {
  calculateServiceCommission,
  canTransitionServicePayment,
  createServicePaymentDraft,
  isProviderPaymentAuthoritative,
  paymentOrderDeduplicationKey,
  transitionServicePayment,
  type ServiceCommissionPolicy,
} from '@/lib/commerce/service-payment-contract';

const createdAt = '2026-07-27T10:30:00.000Z';

function draft() {
  return createServicePaymentDraft({
    id: 'order-1',
    userId: 'user-1',
    exchangeId: 'exchange-1',
    providerId: 'stripe',
    category: 'courier',
    subtotal: { amountMinor: 10_000, currency: 'eur' },
    idempotencyKey: 'checkout:user-1:order-1',
    createdAt,
  });
}

describe('E4.4 service payment and commission contract', () => {
  it('calculates commission in integer minor units and never charges the swap itself', () => {
    const order = draft();

    expect(order.subtotal).toEqual({ amountMinor: 10_000, currency: 'EUR' });
    expect(order.commission).toEqual({ amountMinor: 500, currency: 'EUR' });
    expect(order.total).toEqual({ amountMinor: 10_500, currency: 'EUR' });
    expect(order.category).toBe('courier');
  });

  it('supports bounded commission policies', () => {
    const policy: ServiceCommissionPolicy = {
      category: 'packaging',
      rateBasisPoints: 1_000,
      minimumCommissionMinor: 100,
      maximumCommissionMinor: 500,
    };

    expect(calculateServiceCommission({ amountMinor: 200, currency: 'GBP' }, policy).amountMinor).toBe(100);
    expect(calculateServiceCommission({ amountMinor: 10_000, currency: 'GBP' }, policy).amountMinor).toBe(500);
  });

  it('uses stable request-level deduplication keys', () => {
    expect(
      paymentOrderDeduplicationKey({
        userId: 'user-1',
        providerId: 'stripe',
        idempotencyKey: 'checkout:user-1:order-1',
      }),
    ).toBe('user-1:stripe:checkout:user-1:order-1');
  });

  it('permits only explicit payment lifecycle transitions', () => {
    expect(canTransitionServicePayment('draft', 'checkout-pending')).toBe(true);
    expect(canTransitionServicePayment('draft', 'paid')).toBe(false);

    const checkout = transitionServicePayment(draft(), 'checkout-pending', '2026-07-27T10:31:00.000Z');
    const pending = transitionServicePayment(
      checkout,
      'payment-pending',
      '2026-07-27T10:32:00.000Z',
      'pi_test_1',
    );
    const paid = transitionServicePayment(pending, 'paid', '2026-07-27T10:33:00.000Z');

    expect(paid.status).toBe('paid');
    expect(paid.providerReference).toBe('pi_test_1');
    expect(isProviderPaymentAuthoritative(paid.status)).toBe(true);
    expect(() => transitionServicePayment(paid, 'refunded', '2026-07-27T10:34:00.000Z')).toThrow(
      'invalid-payment-transition:paid->refunded',
    );
  });

  it('requires refund-pending before refunded and makes refunded terminal', () => {
    const checkout = transitionServicePayment(draft(), 'checkout-pending', createdAt);
    const pending = transitionServicePayment(checkout, 'payment-pending', createdAt);
    const paid = transitionServicePayment(pending, 'paid', createdAt);
    const refundPending = transitionServicePayment(paid, 'refund-pending', createdAt);
    const refunded = transitionServicePayment(refundPending, 'refunded', createdAt);

    expect(refunded.status).toBe('refunded');
    expect(() => transitionServicePayment(refunded, 'paid', createdAt)).toThrow('payment-order-is-terminal');
  });

  it('rejects malformed money, currencies and idempotency keys', () => {
    expect(() => calculateServiceCommission(
      { amountMinor: 1.5, currency: 'EUR' },
      { category: 'courier', rateBasisPoints: 500 },
    )).toThrow('subtotal-must-be-a-non-negative-safe-integer');

    expect(() => createServicePaymentDraft({
      id: 'order-2',
      userId: 'user-1',
      providerId: 'stripe',
      category: 'courier',
      subtotal: { amountMinor: 100, currency: 'EU' },
      idempotencyKey: 'too-short',
      createdAt,
    })).toThrow('currency-must-be-iso-4217');
  });
});
