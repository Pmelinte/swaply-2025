export type CommercialMechanismStatus =
  | 'keep'
  | 'sandbox-only'
  | 'defer'
  | 'prohibited-for-v1';

export type CommercialCategory =
  | 'logistics'
  | 'packaging'
  | 'insurance'
  | 'travel'
  | 'accommodation'
  | 'local-service'
  | 'promotion'
  | 'affiliate'
  | 'subscription'
  | 'payment'
  | 'escrow'
  | 'wallet'
  | 'credit'
  | 'auction'
  | 'token-economy';

export interface CommercialMechanism {
  id: string;
  category: CommercialCategory;
  status: CommercialMechanismStatus;
  chargesCoreSwap: boolean;
  canAffectTrustRank: boolean;
  requiresExternalProvider: boolean;
  requiresRegulatoryReview: boolean;
  disclosureRequired: boolean;
  rationale: string;
}

export const COMMERCIAL_GUARDRAILS = {
  coreSwapMustRemainFree: true,
  trustRankCannotBePurchased: true,
  sponsoredContentMustBeDisclosed: true,
  externalProviderFailureCannotBlockCoreSwap: true,
  cardDataMustNotBeStoredBySwaply: true,
  productionPaymentsRequireExplicitActivation: true,
} as const;

export const COMMERCIAL_INVENTORY: readonly CommercialMechanism[] = [
  {
    id: 'third-party-logistics',
    category: 'logistics',
    status: 'keep',
    chargesCoreSwap: false,
    canAffectTrustRank: false,
    requiresExternalProvider: true,
    requiresRegulatoryReview: false,
    disclosureRequired: true,
    rationale: 'Optional delivery services may generate commission without charging the exchange itself.',
  },
  {
    id: 'packaging-services',
    category: 'packaging',
    status: 'keep',
    chargesCoreSwap: false,
    canAffectTrustRank: false,
    requiresExternalProvider: true,
    requiresRegulatoryReview: false,
    disclosureRequired: true,
    rationale: 'Optional packaging is a connected service and must remain separate from exchange authority.',
  },
  {
    id: 'third-party-insurance',
    category: 'insurance',
    status: 'sandbox-only',
    chargesCoreSwap: false,
    canAffectTrustRank: false,
    requiresExternalProvider: true,
    requiresRegulatoryReview: true,
    disclosureRequired: true,
    rationale: 'Insurance requires a licensed provider and legal review before Production activation.',
  },
  {
    id: 'affiliate-offers',
    category: 'affiliate',
    status: 'keep',
    chargesCoreSwap: false,
    canAffectTrustRank: false,
    requiresExternalProvider: true,
    requiresRegulatoryReview: false,
    disclosureRequired: true,
    rationale: 'Affiliate recommendations are allowed only with transparent attribution and disclosure.',
  },
  {
    id: 'featured-listings',
    category: 'promotion',
    status: 'sandbox-only',
    chargesCoreSwap: false,
    canAffectTrustRank: false,
    requiresExternalProvider: false,
    requiresRegulatoryReview: false,
    disclosureRequired: true,
    rationale: 'Paid visibility may be tested only when it is visually distinct from organic ranking.',
  },
  {
    id: 'premium-subscriptions',
    category: 'subscription',
    status: 'defer',
    chargesCoreSwap: false,
    canAffectTrustRank: false,
    requiresExternalProvider: true,
    requiresRegulatoryReview: false,
    disclosureRequired: true,
    rationale: 'Legacy subscription code exists, but v1 benefits and billing promises are not yet canonical.',
  },
  {
    id: 'service-payments',
    category: 'payment',
    status: 'sandbox-only',
    chargesCoreSwap: false,
    canAffectTrustRank: false,
    requiresExternalProvider: true,
    requiresRegulatoryReview: true,
    disclosureRequired: true,
    rationale: 'Payments may cover connected services only and require webhook, refund and reconciliation gates.',
  },
  {
    id: 'item-auctions',
    category: 'auction',
    status: 'defer',
    chargesCoreSwap: false,
    canAffectTrustRank: false,
    requiresExternalProvider: false,
    requiresRegulatoryReview: true,
    disclosureRequired: true,
    rationale: 'Legacy auction tables are outside the v1 exchange contract and need separate product review.',
  },
  {
    id: 'token-marketplace',
    category: 'token-economy',
    status: 'defer',
    chargesCoreSwap: false,
    canAffectTrustRank: false,
    requiresExternalProvider: false,
    requiresRegulatoryReview: true,
    disclosureRequired: true,
    rationale: 'Legacy token rewards and gifts must not become money-like value without explicit review.',
  },
  {
    id: 'swaply-escrow',
    category: 'escrow',
    status: 'prohibited-for-v1',
    chargesCoreSwap: false,
    canAffectTrustRank: false,
    requiresExternalProvider: true,
    requiresRegulatoryReview: true,
    disclosureRequired: true,
    rationale: 'Swaply must not custody funds in v1.',
  },
  {
    id: 'swaply-wallet',
    category: 'wallet',
    status: 'prohibited-for-v1',
    chargesCoreSwap: false,
    canAffectTrustRank: false,
    requiresExternalProvider: true,
    requiresRegulatoryReview: true,
    disclosureRequired: true,
    rationale: 'Stored monetary value is outside the v1 legal and operational boundary.',
  },
  {
    id: 'swaply-credit',
    category: 'credit',
    status: 'prohibited-for-v1',
    chargesCoreSwap: false,
    canAffectTrustRank: false,
    requiresExternalProvider: true,
    requiresRegulatoryReview: true,
    disclosureRequired: true,
    rationale: 'Credit and lending are explicitly excluded from v1.',
  },
] as const;

export function validateCommercialInventory(
  mechanisms: readonly CommercialMechanism[] = COMMERCIAL_INVENTORY,
): string[] {
  const violations: string[] = [];
  const ids = new Set<string>();

  for (const mechanism of mechanisms) {
    if (ids.has(mechanism.id)) violations.push(`duplicate:${mechanism.id}`);
    ids.add(mechanism.id);

    if (mechanism.chargesCoreSwap) violations.push(`core-swap-charge:${mechanism.id}`);
    if (mechanism.canAffectTrustRank) violations.push(`purchasable-trust:${mechanism.id}`);
    if (
      mechanism.status === 'prohibited-for-v1' &&
      !mechanism.requiresRegulatoryReview
    ) {
      violations.push(`prohibited-without-review:${mechanism.id}`);
    }
    if (
      (mechanism.category === 'affiliate' || mechanism.category === 'promotion') &&
      !mechanism.disclosureRequired
    ) {
      violations.push(`missing-disclosure:${mechanism.id}`);
    }
  }

  return violations;
}

export function getCommercialMechanism(id: string): CommercialMechanism | undefined {
  return COMMERCIAL_INVENTORY.find((mechanism) => mechanism.id === id);
}
