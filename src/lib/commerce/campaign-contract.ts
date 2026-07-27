export type CampaignStatus =
  | 'draft'
  | 'pending-review'
  | 'approved'
  | 'active'
  | 'paused'
  | 'rejected'
  | 'expired'
  | 'cancelled';

export type CampaignPlacement =
  | 'explore-feed'
  | 'exchange-services'
  | 'search-results'
  | 'category-page';

export interface CampaignTargeting {
  countries?: string[];
  locales?: string[];
  categories?: string[];
  placements: CampaignPlacement[];
}

export interface PromotionCampaign {
  id: string;
  advertiserId: string;
  title: string;
  disclosureLabel: 'sponsored';
  status: CampaignStatus;
  startsAt: string;
  endsAt: string;
  budgetMinor: number;
  currency: string;
  spentMinor: number;
  frequencyCapPerUserPerDay: number;
  targeting: CampaignTargeting;
  moderationApprovedAt?: string;
  killSwitchActivatedAt?: string;
}

const ACTIVE_STATUSES: readonly CampaignStatus[] = ['approved', 'active'];

function assertIsoDate(value: string, field: string): number {
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) throw new Error(`invalid-${field}`);
  return timestamp;
}

function normaliseCodes(values: readonly string[] | undefined, pattern: RegExp): string[] | undefined {
  if (!values) return undefined;
  const normalised = [...new Set(values.map((value) => value.trim()).filter(Boolean))];
  if (normalised.some((value) => !pattern.test(value))) throw new Error('invalid-targeting-code');
  return normalised;
}

export function validateCampaign(campaign: PromotionCampaign): PromotionCampaign {
  const startsAt = assertIsoDate(campaign.startsAt, 'starts-at');
  const endsAt = assertIsoDate(campaign.endsAt, 'ends-at');
  if (endsAt <= startsAt) throw new Error('campaign-end-must-follow-start');
  if (!Number.isSafeInteger(campaign.budgetMinor) || campaign.budgetMinor <= 0) {
    throw new Error('invalid-campaign-budget');
  }
  if (!Number.isSafeInteger(campaign.spentMinor) || campaign.spentMinor < 0) {
    throw new Error('invalid-campaign-spend');
  }
  if (campaign.spentMinor > campaign.budgetMinor) throw new Error('campaign-budget-exceeded');
  if (!/^[A-Z]{3}$/.test(campaign.currency)) throw new Error('invalid-campaign-currency');
  if (
    !Number.isInteger(campaign.frequencyCapPerUserPerDay) ||
    campaign.frequencyCapPerUserPerDay < 1 ||
    campaign.frequencyCapPerUserPerDay > 20
  ) {
    throw new Error('invalid-frequency-cap');
  }
  if (campaign.disclosureLabel !== 'sponsored') throw new Error('campaign-disclosure-required');
  if (campaign.targeting.placements.length === 0) throw new Error('campaign-placement-required');

  return {
    ...campaign,
    targeting: {
      ...campaign.targeting,
      countries: normaliseCodes(campaign.targeting.countries, /^[A-Z]{2}$/),
      locales: normaliseCodes(campaign.targeting.locales, /^[a-z]{2,3}(?:-[A-Z]{2})?$/),
      categories: campaign.targeting.categories
        ? [...new Set(campaign.targeting.categories.map((value) => value.trim()).filter(Boolean))]
        : undefined,
      placements: [...new Set(campaign.targeting.placements)],
    },
  };
}

export function isCampaignEligible(input: {
  campaign: PromotionCampaign;
  now: string;
  country?: string;
  locale?: string;
  category?: string;
  placement: CampaignPlacement;
  impressionsForUserToday: number;
}): boolean {
  const campaign = validateCampaign(input.campaign);
  const now = assertIsoDate(input.now, 'now');
  if (!ACTIVE_STATUSES.includes(campaign.status)) return false;
  if (!campaign.moderationApprovedAt) return false;
  if (campaign.killSwitchActivatedAt) return false;
  if (now < Date.parse(campaign.startsAt) || now >= Date.parse(campaign.endsAt)) return false;
  if (campaign.spentMinor >= campaign.budgetMinor) return false;
  if (input.impressionsForUserToday >= campaign.frequencyCapPerUserPerDay) return false;
  if (!campaign.targeting.placements.includes(input.placement)) return false;
  if (campaign.targeting.countries?.length && (!input.country || !campaign.targeting.countries.includes(input.country))) return false;
  if (campaign.targeting.locales?.length && (!input.locale || !campaign.targeting.locales.includes(input.locale))) return false;
  if (campaign.targeting.categories?.length && (!input.category || !campaign.targeting.categories.includes(input.category))) return false;
  return true;
}

export function expireCampaign(campaign: PromotionCampaign, now: string): PromotionCampaign {
  if (Date.parse(now) < Date.parse(campaign.endsAt)) return campaign;
  if (['expired', 'cancelled', 'rejected'].includes(campaign.status)) return campaign;
  return { ...campaign, status: 'expired' };
}

export function activateCampaignKillSwitch(
  campaign: PromotionCampaign,
  activatedAt: string,
): PromotionCampaign {
  assertIsoDate(activatedAt, 'kill-switch-at');
  if (['cancelled', 'expired', 'rejected'].includes(campaign.status)) return campaign;
  return { ...campaign, status: 'paused', killSwitchActivatedAt: activatedAt };
}

export function campaignAffectsTrustRank(): false {
  return false;
}
