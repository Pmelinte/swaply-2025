import { describe, expect, it } from 'vitest';

import {
  COMMERCIAL_GUARDRAILS,
  COMMERCIAL_INVENTORY,
  getCommercialMechanism,
  validateCommercialInventory,
} from '@/lib/commerce/commercial-contract';

describe('E4.1 commercial contract', () => {
  it('keeps the core exchange free and trust rank non-purchasable', () => {
    expect(COMMERCIAL_GUARDRAILS.coreSwapMustRemainFree).toBe(true);
    expect(COMMERCIAL_GUARDRAILS.trustRankCannotBePurchased).toBe(true);
    expect(COMMERCIAL_INVENTORY.every((entry) => !entry.chargesCoreSwap)).toBe(true);
    expect(COMMERCIAL_INVENTORY.every((entry) => !entry.canAffectTrustRank)).toBe(true);
  });

  it('requires disclosure for affiliate and promoted placements', () => {
    const disclosed = COMMERCIAL_INVENTORY
      .filter((entry) => entry.category === 'affiliate' || entry.category === 'promotion')
      .every((entry) => entry.disclosureRequired);

    expect(disclosed).toBe(true);
  });

  it('keeps payments and insurance out of automatic Production activation', () => {
    expect(getCommercialMechanism('service-payments')?.status).toBe('sandbox-only');
    expect(getCommercialMechanism('third-party-insurance')?.status).toBe('sandbox-only');
    expect(COMMERCIAL_GUARDRAILS.productionPaymentsRequireExplicitActivation).toBe(true);
  });

  it('prohibits escrow, wallet and credit for v1', () => {
    expect(getCommercialMechanism('swaply-escrow')?.status).toBe('prohibited-for-v1');
    expect(getCommercialMechanism('swaply-wallet')?.status).toBe('prohibited-for-v1');
    expect(getCommercialMechanism('swaply-credit')?.status).toBe('prohibited-for-v1');
  });

  it('passes the canonical inventory validator', () => {
    expect(validateCommercialInventory()).toEqual([]);
  });

  it('fails closed for core-swap charges and purchasable trust', () => {
    const unsafe = [
      {
        ...COMMERCIAL_INVENTORY[0],
        id: 'unsafe-core-charge',
        chargesCoreSwap: true,
      },
      {
        ...COMMERCIAL_INVENTORY[1],
        id: 'unsafe-trust',
        canAffectTrustRank: true,
      },
    ];

    expect(validateCommercialInventory(unsafe)).toEqual([
      'core-swap-charge:unsafe-core-charge',
      'purchasable-trust:unsafe-trust',
    ]);
  });
});
