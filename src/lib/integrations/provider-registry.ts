export type ProviderEnvironment = 'sandbox' | 'production';

export type ProviderCapability =
  | 'payments'
  | 'courier'
  | 'packaging'
  | 'insurance'
  | 'travel'
  | 'accommodation'
  | 'affiliate';

export type ProviderOperationalState = 'enabled' | 'disabled' | 'degraded';

export interface ProviderRetryPolicy {
  maxAttempts: number;
  baseDelayMs: number;
  retryableStatusCodes: readonly number[];
}

export interface ProviderCircuitBreakerPolicy {
  failureThreshold: number;
  resetAfterMs: number;
}

export interface ExternalProviderDefinition {
  id: string;
  displayName: string;
  capabilities: readonly ProviderCapability[];
  environment: ProviderEnvironment;
  state: ProviderOperationalState;
  timeoutMs: number;
  retry: ProviderRetryPolicy;
  circuitBreaker: ProviderCircuitBreakerPolicy;
  secretEnvironmentVariables: readonly string[];
  productionActivationExplicitlyApproved: boolean;
  failureMayBlockCoreSwap: false;
}

export const PROVIDER_REGISTRY: readonly ExternalProviderDefinition[] = [
  {
    id: 'stripe',
    displayName: 'Stripe',
    capabilities: ['payments'],
    environment: 'sandbox',
    state: 'disabled',
    timeoutMs: 8_000,
    retry: {
      maxAttempts: 2,
      baseDelayMs: 250,
      retryableStatusCodes: [408, 409, 425, 429, 500, 502, 503, 504],
    },
    circuitBreaker: { failureThreshold: 5, resetAfterMs: 60_000 },
    secretEnvironmentVariables: ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET'],
    productionActivationExplicitlyApproved: false,
    failureMayBlockCoreSwap: false,
  },
  {
    id: 'courier-generic',
    displayName: 'Courier integration',
    capabilities: ['courier'],
    environment: 'sandbox',
    state: 'disabled',
    timeoutMs: 6_000,
    retry: {
      maxAttempts: 2,
      baseDelayMs: 200,
      retryableStatusCodes: [408, 425, 429, 500, 502, 503, 504],
    },
    circuitBreaker: { failureThreshold: 4, resetAfterMs: 45_000 },
    secretEnvironmentVariables: ['COURIER_API_KEY'],
    productionActivationExplicitlyApproved: false,
    failureMayBlockCoreSwap: false,
  },
  {
    id: 'booking-affiliate',
    displayName: 'Booking affiliate',
    capabilities: ['accommodation', 'affiliate'],
    environment: 'sandbox',
    state: 'disabled',
    timeoutMs: 5_000,
    retry: {
      maxAttempts: 1,
      baseDelayMs: 200,
      retryableStatusCodes: [408, 429, 500, 502, 503, 504],
    },
    circuitBreaker: { failureThreshold: 3, resetAfterMs: 60_000 },
    secretEnvironmentVariables: ['BOOKING_AFFILIATE_ID'],
    productionActivationExplicitlyApproved: false,
    failureMayBlockCoreSwap: false,
  },
] as const;

export function validateProviderRegistry(
  providers: readonly ExternalProviderDefinition[] = PROVIDER_REGISTRY,
): string[] {
  const violations: string[] = [];
  const ids = new Set<string>();

  for (const provider of providers) {
    if (ids.has(provider.id)) violations.push(`duplicate-provider:${provider.id}`);
    ids.add(provider.id);

    if (provider.capabilities.length === 0) violations.push(`missing-capability:${provider.id}`);
    if (provider.timeoutMs < 100 || provider.timeoutMs > 30_000) {
      violations.push(`invalid-timeout:${provider.id}`);
    }
    if (provider.retry.maxAttempts < 1 || provider.retry.maxAttempts > 4) {
      violations.push(`invalid-retry-attempts:${provider.id}`);
    }
    if (provider.circuitBreaker.failureThreshold < 1) {
      violations.push(`invalid-circuit-threshold:${provider.id}`);
    }
    if (provider.failureMayBlockCoreSwap !== false) {
      violations.push(`core-swap-blocking-provider:${provider.id}`);
    }
    if (
      provider.environment === 'production' &&
      !provider.productionActivationExplicitlyApproved
    ) {
      violations.push(`unapproved-production-provider:${provider.id}`);
    }
    if (provider.secretEnvironmentVariables.some((name) => !/^[A-Z0-9_]+$/.test(name))) {
      violations.push(`invalid-secret-name:${provider.id}`);
    }
  }

  return violations;
}

export function getProvider(id: string): ExternalProviderDefinition | undefined {
  return PROVIDER_REGISTRY.find((provider) => provider.id === id);
}

export function getProvidersForCapability(
  capability: ProviderCapability,
  providers: readonly ExternalProviderDefinition[] = PROVIDER_REGISTRY,
): ExternalProviderDefinition[] {
  return providers.filter((provider) => provider.capabilities.includes(capability));
}
