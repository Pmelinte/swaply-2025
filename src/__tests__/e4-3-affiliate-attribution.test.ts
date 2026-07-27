import { describe, expect, it } from 'vitest';

import {
  acceptAffiliateConversion,
  buildAffiliateRedirectUrl,
  createAffiliateClickRecord,
  validateAffiliateOffer,
  type AffiliateClickRecord,
  type AffiliateOffer,
} from '@/lib/commerce/affiliate-attribution';

const offer: AffiliateOffer = {
  id: 'offer-1',
  providerId: 'booking-affiliate',
  campaignId: 'campaign-1',
  destinationUrl: 'https://example.com/search?city=Tulcea',
  status: 'sandbox',
  disclosureLabel: 'Affiliate offer',
  sponsored: true,
  attributionWindowHours: 72,
  startsAt: '2026-07-01T00:00:00.000Z',
  endsAt: '2026-08-01T00:00:00.000Z',
  allowedLocales: ['ro', 'en'],
  productionActivationExplicitlyApproved: false,
};

describe('E4.3 affiliate offers and attribution', () => {
  it('requires explicit production approval', () => {
    expect(
      validateAffiliateOffer(
        offer,
        new Date('2026-07-20T00:00:00.000Z'),
        'production',
      ),
    ).toEqual({ accepted: false, reason: 'production-not-approved' });
  });

  it('requires visible affiliate disclosure', () => {
    expect(
      validateAffiliateOffer(
        { ...offer, disclosureLabel: '', sponsored: false },
        new Date('2026-07-20T00:00:00.000Z'),
      ),
    ).toEqual({ accepted: false, reason: 'missing-disclosure' });
  });

  it('creates a revision-independent expiring attribution record', () => {
    const result = createAffiliateClickRecord(
      {
        offer,
        userId: 'user-1',
        occurredAt: '2026-07-20T12:00:00.000Z',
        locale: 'ro',
        source: 'exchange-logistics',
        deduplicationKey: 'click-key-1',
      },
      { createId: () => 'attr-1' },
    );

    expect(result).toMatchObject({
      attributionId: 'attr-1',
      offerId: 'offer-1',
      providerId: 'booking-affiliate',
      campaignId: 'campaign-1',
      expiresAt: '2026-07-23T12:00:00.000Z',
      status: 'clicked',
    });
  });

  it('rejects locales outside the campaign contract', () => {
    expect(
      createAffiliateClickRecord({
        offer,
        anonymousSessionId: 'session-1',
        occurredAt: '2026-07-20T12:00:00.000Z',
        locale: 'de',
        source: 'exchange-logistics',
        deduplicationKey: 'click-key-2',
      }),
    ).toEqual({ accepted: false, reason: 'locale-not-allowed' });
  });

  it('deduplicates provider conversions and conversion requests', () => {
    const click: AffiliateClickRecord = {
      attributionId: 'attr-1',
      offerId: 'offer-1',
      providerId: 'booking-affiliate',
      campaignId: 'campaign-1',
      userId: 'user-1',
      occurredAt: '2026-07-20T12:00:00.000Z',
      expiresAt: '2026-07-23T12:00:00.000Z',
      locale: 'ro',
      source: 'exchange-logistics',
      deduplicationKey: 'click-key-1',
      status: 'clicked',
    };

    const conversion = {
      attributionId: 'attr-1',
      providerConversionId: 'provider-conversion-1',
      occurredAt: '2026-07-21T12:00:00.000Z',
      deduplicationKey: 'conversion-key-1',
    };

    expect(
      acceptAffiliateConversion({
        click,
        conversion,
        seenProviderConversionIds: new Set(['provider-conversion-1']),
        seenDeduplicationKeys: new Set(),
      }),
    ).toEqual({ accepted: false, reason: 'duplicate' });

    expect(
      acceptAffiliateConversion({
        click,
        conversion,
        seenProviderConversionIds: new Set(),
        seenDeduplicationKeys: new Set(['conversion-key-1']),
      }),
    ).toEqual({ accepted: false, reason: 'duplicate' });
  });

  it('rejects conversions outside the attribution window', () => {
    const click: AffiliateClickRecord = {
      attributionId: 'attr-1',
      offerId: 'offer-1',
      providerId: 'booking-affiliate',
      campaignId: 'campaign-1',
      anonymousSessionId: 'session-1',
      occurredAt: '2026-07-20T12:00:00.000Z',
      expiresAt: '2026-07-23T12:00:00.000Z',
      locale: 'ro',
      source: 'exchange-logistics',
      deduplicationKey: 'click-key-1',
      status: 'clicked',
    };

    expect(
      acceptAffiliateConversion({
        click,
        conversion: {
          attributionId: 'attr-1',
          providerConversionId: 'provider-conversion-2',
          occurredAt: '2026-07-24T12:00:00.000Z',
          deduplicationKey: 'conversion-key-2',
        },
        seenProviderConversionIds: new Set(),
        seenDeduplicationKeys: new Set(),
      }),
    ).toEqual({ accepted: false, reason: 'expired' });
  });

  it('adds attribution metadata without replacing provider query parameters', () => {
    const url = buildAffiliateRedirectUrl({ offer, attributionId: 'attr-1' });
    expect(url).toContain('city=Tulcea');
    expect(url).toContain('swaply_attribution_id=attr-1');
    expect(url).toContain('swaply_campaign_id=campaign-1');
  });
});
