import { describe, expect, it } from 'vitest';

import {
  canStartCommercialCheckout,
  commercialFallbackMessage,
  disclosureLabel,
  summariseCommercialSelection,
  validateCommercialOffer,
  visibleCommercialHistory,
  type CommercialServiceOffer,
} from '@/lib/commerce/commercial-ui-contract';

const offer: CommercialServiceOffer = {
  id: 'offer-1',
  providerId: 'sandbox-courier',
  serviceType: 'courier',
  title: 'Courier delivery',
  disclosure: 'third-party',
  currency: 'EUR',
  subtotalMinor: 1000,
  commissionMinor: 50,
  totalMinor: 1050,
  optional: true,
};

describe('E4.6 commercial UI contract', () => {
  it('keeps the swap free and totals only optional services', () => {
    expect(summariseCommercialSelection([offer])).toEqual({
      swapPriceMinor: 0,
      selectedServiceCount: 1,
      servicesSubtotalMinor: 1000,
      swaplyCommissionMinor: 50,
      payableTotalMinor: 1050,
      currency: 'EUR',
    });
  });

  it('rejects hidden or inconsistent commercial totals', () => {
    expect(() => validateCommercialOffer({ ...offer, optional: false as true })).toThrow(
      'commercial-service-must-be-optional',
    );
    expect(() => validateCommercialOffer({ ...offer, totalMinor: 1000 })).toThrow(
      'commercial-offer-total-mismatch',
    );
  });

  it('discloses commercial origin and blocks unavailable providers', () => {
    expect(disclosureLabel('affiliate')).toBe('Affiliate offer');
    expect(canStartCommercialCheckout(offer)).toBe(true);
    expect(canStartCommercialCheckout({ ...offer, providerUnavailable: true })).toBe(false);
    expect(commercialFallbackMessage({ ...offer, providerUnavailable: true })).toContain(
      'swap can continue',
    );
  });

  it('rejects mixed-currency selections', () => {
    expect(() =>
      summariseCommercialSelection([offer, { ...offer, id: 'offer-2', currency: 'GBP' }]),
    ).toThrow('mixed-currency-commercial-selection');
  });

  it('shows order history newest first without mutating input', () => {
    const history = [
      {
        id: 'older',
        providerId: 'sandbox',
        serviceType: 'courier',
        status: 'paid' as const,
        currency: 'EUR',
        totalMinor: 1050,
        createdAt: '2026-07-26T10:00:00.000Z',
      },
      {
        id: 'newer',
        providerId: 'sandbox',
        serviceType: 'insurance',
        status: 'refunded' as const,
        currency: 'EUR',
        totalMinor: 500,
        createdAt: '2026-07-27T10:00:00.000Z',
      },
    ];

    expect(visibleCommercialHistory(history).map((item) => item.id)).toEqual(['newer', 'older']);
    expect(history[0]?.id).toBe('older');
  });
});
