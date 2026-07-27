export type AffiliateOfferStatus = 'draft' | 'sandbox' | 'active' | 'paused' | 'expired';
export type AffiliateAttributionStatus = 'clicked' | 'converted' | 'rejected' | 'expired';

export interface AffiliateOffer {
  id: string;
  providerId: string;
  campaignId: string;
  destinationUrl: string;
  status: AffiliateOfferStatus;
  disclosureLabel: string;
  sponsored: boolean;
  attributionWindowHours: number;
  startsAt: string;
  endsAt: string;
  allowedLocales: readonly string[];
  productionActivationExplicitlyApproved: boolean;
}

export interface AffiliateClickInput {
  offer: AffiliateOffer;
  userId?: string;
  anonymousSessionId?: string;
  occurredAt: string;
  locale: string;
  source: string;
  deduplicationKey: string;
}

export interface AffiliateClickRecord {
  attributionId: string;
  offerId: string;
  providerId: string;
  campaignId: string;
  userId?: string;
  anonymousSessionId?: string;
  occurredAt: string;
  expiresAt: string;
  locale: string;
  source: string;
  deduplicationKey: string;
  status: 'clicked';
}

export interface AffiliateConversionInput {
  attributionId: string;
  providerConversionId: string;
  occurredAt: string;
  deduplicationKey: string;
  amountMinor?: number;
  currency?: string;
}

export interface AffiliateConversionRecord extends AffiliateConversionInput {
  status: 'converted';
}

export interface AffiliateAttributionDecision {
  accepted: boolean;
  reason:
    | 'accepted'
    | 'offer-inactive'
    | 'outside-campaign-window'
    | 'locale-not-allowed'
    | 'missing-disclosure'
    | 'production-not-approved'
    | 'missing-identity'
    | 'invalid-window';
}

const MAX_ATTRIBUTION_WINDOW_HOURS = 24 * 90;

function timestamp(value: string): number {
  return Date.parse(value);
}

export function validateAffiliateOffer(
  offer: AffiliateOffer,
  now = new Date(),
  environment: 'sandbox' | 'production' = 'sandbox',
): AffiliateAttributionDecision {
  if (!offer.disclosureLabel.trim() || offer.sponsored !== true) {
    return { accepted: false, reason: 'missing-disclosure' };
  }

  if (
    !Number.isInteger(offer.attributionWindowHours) ||
    offer.attributionWindowHours <= 0 ||
    offer.attributionWindowHours > MAX_ATTRIBUTION_WINDOW_HOURS
  ) {
    return { accepted: false, reason: 'invalid-window' };
  }

  if (environment === 'production' && !offer.productionActivationExplicitlyApproved) {
    return { accepted: false, reason: 'production-not-approved' };
  }

  if (offer.status !== 'sandbox' && offer.status !== 'active') {
    return { accepted: false, reason: 'offer-inactive' };
  }

  const current = now.getTime();
  const startsAt = timestamp(offer.startsAt);
  const endsAt = timestamp(offer.endsAt);
  if (!Number.isFinite(startsAt) || !Number.isFinite(endsAt) || current < startsAt || current >= endsAt) {
    return { accepted: false, reason: 'outside-campaign-window' };
  }

  return { accepted: true, reason: 'accepted' };
}

export function createAffiliateClickRecord(
  input: AffiliateClickInput,
  options: {
    environment?: 'sandbox' | 'production';
    createId?: () => string;
  } = {},
): AffiliateClickRecord | AffiliateAttributionDecision {
  const decision = validateAffiliateOffer(
    input.offer,
    new Date(input.occurredAt),
    options.environment ?? 'sandbox',
  );
  if (!decision.accepted) return decision;

  if (!input.userId && !input.anonymousSessionId) {
    return { accepted: false, reason: 'missing-identity' };
  }

  if (
    input.offer.allowedLocales.length > 0 &&
    !input.offer.allowedLocales.includes(input.locale)
  ) {
    return { accepted: false, reason: 'locale-not-allowed' };
  }

  const occurredAt = timestamp(input.occurredAt);
  const expiresAt = new Date(
    occurredAt + input.offer.attributionWindowHours * 60 * 60 * 1000,
  ).toISOString();

  return {
    attributionId: (options.createId ?? (() => crypto.randomUUID()))(),
    offerId: input.offer.id,
    providerId: input.offer.providerId,
    campaignId: input.offer.campaignId,
    userId: input.userId,
    anonymousSessionId: input.anonymousSessionId,
    occurredAt: input.occurredAt,
    expiresAt,
    locale: input.locale,
    source: input.source,
    deduplicationKey: input.deduplicationKey,
    status: 'clicked',
  };
}

export function acceptAffiliateConversion(input: {
  click: AffiliateClickRecord;
  conversion: AffiliateConversionInput;
  seenProviderConversionIds: ReadonlySet<string>;
  seenDeduplicationKeys: ReadonlySet<string>;
}): AffiliateConversionRecord | { accepted: false; reason: 'expired' | 'duplicate' } {
  if (
    input.seenProviderConversionIds.has(input.conversion.providerConversionId) ||
    input.seenDeduplicationKeys.has(input.conversion.deduplicationKey)
  ) {
    return { accepted: false, reason: 'duplicate' };
  }

  if (timestamp(input.conversion.occurredAt) > timestamp(input.click.expiresAt)) {
    return { accepted: false, reason: 'expired' };
  }

  return {
    ...input.conversion,
    status: 'converted',
  };
}

export function buildAffiliateRedirectUrl(input: {
  offer: AffiliateOffer;
  attributionId: string;
}): string {
  const url = new URL(input.offer.destinationUrl);
  url.searchParams.set('swaply_attribution_id', input.attributionId);
  url.searchParams.set('swaply_campaign_id', input.offer.campaignId);
  return url.toString();
}
