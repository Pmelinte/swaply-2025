import type { ServicePaymentStatus } from './service-payment-contract';

export type CommercialDisclosure = 'organic' | 'affiliate' | 'sponsored' | 'third-party';

export interface CommercialServiceOffer {
  id: string;
  providerId: string;
  serviceType: string;
  title: string;
  disclosure: CommercialDisclosure;
  currency: string;
  subtotalMinor: number;
  commissionMinor: number;
  totalMinor: number;
  optional: true;
  providerUnavailable?: boolean;
  termsUrl?: string;
}

export interface CommercialOrderHistoryItem {
  id: string;
  providerId: string;
  serviceType: string;
  status: ServicePaymentStatus;
  currency: string;
  totalMinor: number;
  createdAt: string;
  receiptUrl?: string;
}

export interface CommercialExchangeSummary {
  swapPriceMinor: 0;
  selectedServiceCount: number;
  servicesSubtotalMinor: number;
  swaplyCommissionMinor: number;
  payableTotalMinor: number;
  currency?: string;
}

function assertMinorUnits(value: number, field: string): void {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error(`${field}-must-be-a-non-negative-safe-integer`);
  }
}

export function validateCommercialOffer(offer: CommercialServiceOffer): CommercialServiceOffer {
  if (!offer.id.trim() || !offer.providerId.trim() || !offer.serviceType.trim() || !offer.title.trim()) {
    throw new Error('commercial-offer-required-field-missing');
  }
  if (offer.optional !== true) throw new Error('commercial-service-must-be-optional');
  if (!/^[A-Z]{3}$/.test(offer.currency)) throw new Error('commercial-offer-currency-invalid');

  assertMinorUnits(offer.subtotalMinor, 'commercial-subtotal');
  assertMinorUnits(offer.commissionMinor, 'commercial-commission');
  assertMinorUnits(offer.totalMinor, 'commercial-total');

  if (offer.totalMinor !== offer.subtotalMinor + offer.commissionMinor) {
    throw new Error('commercial-offer-total-mismatch');
  }

  return offer;
}

export function summariseCommercialSelection(
  offers: readonly CommercialServiceOffer[],
): CommercialExchangeSummary {
  const available = offers.filter((offer) => !validateCommercialOffer(offer).providerUnavailable);
  const currencies = new Set(available.map((offer) => offer.currency));
  if (currencies.size > 1) throw new Error('mixed-currency-commercial-selection');

  return {
    swapPriceMinor: 0,
    selectedServiceCount: available.length,
    servicesSubtotalMinor: available.reduce((sum, offer) => sum + offer.subtotalMinor, 0),
    swaplyCommissionMinor: available.reduce((sum, offer) => sum + offer.commissionMinor, 0),
    payableTotalMinor: available.reduce((sum, offer) => sum + offer.totalMinor, 0),
    currency: available[0]?.currency,
  };
}

export function disclosureLabel(disclosure: CommercialDisclosure): string {
  const labels: Readonly<Record<CommercialDisclosure, string>> = {
    organic: 'Optional service',
    affiliate: 'Affiliate offer',
    sponsored: 'Sponsored offer',
    'third-party': 'Third-party service',
  };
  return labels[disclosure];
}

export function canStartCommercialCheckout(offer: CommercialServiceOffer): boolean {
  validateCommercialOffer(offer);
  return !offer.providerUnavailable && offer.totalMinor > 0;
}

export function commercialFallbackMessage(offer: CommercialServiceOffer): string | null {
  return offer.providerUnavailable
    ? 'This provider is temporarily unavailable. The swap can continue without this optional service.'
    : null;
}

export function visibleCommercialHistory(
  items: readonly CommercialOrderHistoryItem[],
): CommercialOrderHistoryItem[] {
  return [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
