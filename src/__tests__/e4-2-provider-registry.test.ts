import { describe, expect, it } from 'vitest';

import { executeProviderCall } from '@/lib/integrations/provider-executor';
import {
  PROVIDER_REGISTRY,
  getProvidersForCapability,
  validateProviderRegistry,
  type ExternalProviderDefinition,
} from '@/lib/integrations/provider-registry';

const enabledProvider: ExternalProviderDefinition = {
  id: 'test-provider',
  displayName: 'Test provider',
  capabilities: ['courier'],
  environment: 'sandbox',
  state: 'enabled',
  timeoutMs: 1_000,
  retry: {
    maxAttempts: 2,
    baseDelayMs: 1,
    retryableStatusCodes: [429, 500, 503],
  },
  circuitBreaker: {
    failureThreshold: 2,
    resetAfterMs: 60_000,
  },
  secretEnvironmentVariables: ['TEST_PROVIDER_API_KEY'],
  productionActivationExplicitlyApproved: false,
  failureMayBlockCoreSwap: false,
};

describe('E4.2 provider registry and integration layer', () => {
  it('keeps the canonical registry fail-closed and sandbox-only', () => {
    expect(validateProviderRegistry()).toEqual([]);
    expect(PROVIDER_REGISTRY.every((provider) => provider.environment === 'sandbox')).toBe(true);
    expect(PROVIDER_REGISTRY.every((provider) => provider.state === 'disabled')).toBe(true);
    expect(PROVIDER_REGISTRY.every((provider) => provider.failureMayBlockCoreSwap === false)).toBe(true);
  });

  it('rejects unapproved Production activation', () => {
    const unsafe: ExternalProviderDefinition = {
      ...enabledProvider,
      environment: 'production',
      productionActivationExplicitlyApproved: false,
    };

    expect(validateProviderRegistry([unsafe])).toContain(
      'unapproved-production-provider:test-provider',
    );
  });

  it('selects providers by declared capability', () => {
    expect(getProvidersForCapability('payments').map((provider) => provider.id)).toEqual([
      'stripe',
    ]);
    expect(getProvidersForCapability('courier').map((provider) => provider.id)).toEqual([
      'courier-generic',
    ]);
  });

  it('returns deterministic fallback without calling a disabled provider', async () => {
    let calls = 0;
    const result = await executeProviderCall({
      provider: PROVIDER_REGISTRY[0],
      call: async () => {
        calls += 1;
        return { ok: true, value: 'unexpected' };
      },
      fallback: () => 'manual-payment-option',
    });

    expect(calls).toBe(0);
    expect(result).toMatchObject({
      ok: false,
      failure: 'disabled',
      fallback: 'manual-payment-option',
      fallbackUsed: true,
      attempts: 0,
    });
  });

  it('retries retryable failures and returns a successful response', async () => {
    const attempts: number[] = [];
    const result = await executeProviderCall({
      provider: enabledProvider,
      call: async (attempt) => {
        attempts.push(attempt);
        if (attempt === 1) return { ok: false, statusCode: 503 };
        return { ok: true, value: { quoteId: 'quote-1' } };
      },
      fallback: () => ({ quoteId: 'manual' }),
      context: { sleep: async () => undefined },
    });

    expect(attempts).toEqual([1, 2]);
    expect(result).toMatchObject({
      ok: true,
      value: { quoteId: 'quote-1' },
      attempts: 2,
      fallbackUsed: false,
    });
  });

  it('opens the circuit after repeated failures and never blocks the core swap', async () => {
    const circuitState = { failures: 1 };
    let now = 1_000;

    const failed = await executeProviderCall({
      provider: enabledProvider,
      call: async () => ({ ok: false, statusCode: 500 }),
      fallback: () => 'manual-courier',
      context: {
        circuitState,
        now: () => now,
        sleep: async () => undefined,
      },
    });

    expect(failed).toMatchObject({ ok: false, fallback: 'manual-courier' });
    expect(circuitState.failures).toBe(2);
    expect(circuitState.openedAt).toBe(1_000);

    now = 2_000;
    const blocked = await executeProviderCall({
      provider: enabledProvider,
      call: async () => ({ ok: true, value: 'should-not-run' }),
      fallback: () => 'manual-courier',
      context: { circuitState, now: () => now },
    });

    expect(blocked).toMatchObject({
      ok: false,
      failure: 'circuit-open',
      fallback: 'manual-courier',
      attempts: 0,
    });
  });
});
