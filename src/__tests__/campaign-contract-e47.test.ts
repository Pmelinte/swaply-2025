import { describe, expect, it } from 'vitest';

import {
  activateCampaignKillSwitch,
  campaignAffectsTrustRank,
  expireCampaign,
  isCampaignEligible,
  validateCampaign,
  type PromotionCampaign,
} from '@/lib/commerce/campaign-contract';

const campaign: PromotionCampaign = {
  id: 'campaign-1',
  advertiserId: 'advertiser-1',
  title: 'Courier offer',
  disclosureLabel: 'sponsored',
  status: 'active',
  startsAt: '2026-07-27T00:00:00.000Z',
  endsAt: '2026-08-27T00:00:00.000Z',
  budgetMinor: 100_000,
  currency: 'EUR',
  spentMinor: 10_000,
  frequencyCapPerUserPerDay: 3,
  targeting: {
    countries: ['RO'],
    locales: ['ro'],
    categories: ['courier'],
    placements: ['exchange-services'],
  },
  moderationApprovedAt: '2026-07-26T12:00:00.000Z',
};

describe('E4.7 campaign contract', () => {
  it('requires explicit sponsored disclosure and valid budget', () => {
    expect(validateCampaign(campaign).disclosureLabel).toBe('sponsored');
    expect(() => validateCampaign({ ...campaign, budgetMinor: 0 })).toThrow('invalid-campaign-budget');
  });

  it('enforces contextual targeting and frequency caps', () => {
    expect(
      isCampaignEligible({
        campaign,
        now: '2026-07-27T12:00:00.000Z',
        country: 'RO',
        locale: 'ro',
        category: 'courier',
        placement: 'exchange-services',
        impressionsForUserToday: 2,
      }),
    ).toBe(true);

    expect(
      isCampaignEligible({
        campaign,
        now: '2026-07-27T12:00:00.000Z',
        country: 'RO',
        locale: 'ro',
        category: 'courier',
        placement: 'exchange-services',
        impressionsForUserToday: 3,
      }),
    ).toBe(false);
  });

  it('fails closed without moderation approval', () => {
    expect(
      isCampaignEligible({
        campaign: { ...campaign, moderationApprovedAt: undefined },
        now: '2026-07-27T12:00:00.000Z',
        country: 'RO',
        locale: 'ro',
        category: 'courier',
        placement: 'exchange-services',
        impressionsForUserToday: 0,
      }),
    ).toBe(false);
  });

  it('stops delivery immediately through the kill switch', () => {
    const paused = activateCampaignKillSwitch(campaign, '2026-07-27T12:00:00.000Z');
    expect(paused.status).toBe('paused');
    expect(paused.killSwitchActivatedAt).toBeTruthy();
  });

  it('expires deterministically and never affects trust rank', () => {
    expect(expireCampaign(campaign, '2026-08-27T00:00:00.000Z').status).toBe('expired');
    expect(campaignAffectsTrustRank()).toBe(false);
  });
});
