import type {
  ExternalProviderDefinition,
  ProviderOperationalState,
} from './provider-registry';

export type ProviderFailureKind =
  | 'disabled'
  | 'degraded'
  | 'circuit-open'
  | 'timeout'
  | 'provider-error'
  | 'invalid-response';

export interface ProviderExecutionSuccess<T> {
  ok: true;
  providerId: string;
  value: T;
  attempts: number;
  durationMs: number;
  fallbackUsed: false;
}

export interface ProviderExecutionFallback<T> {
  ok: false;
  providerId: string;
  failure: ProviderFailureKind;
  fallback: T;
  attempts: number;
  durationMs: number;
  fallbackUsed: true;
}

export type ProviderExecutionResult<T> =
  | ProviderExecutionSuccess<T>
  | ProviderExecutionFallback<T>;

export interface ProviderCircuitState {
  failures: number;
  openedAt?: number;
}

export interface ProviderExecutionContext {
  now?: () => number;
  sleep?: (ms: number) => Promise<void>;
  circuitState?: ProviderCircuitState;
}

export interface ProviderCallResult<T> {
  ok: boolean;
  value?: T;
  statusCode?: number;
  retryable?: boolean;
}

function stateFailure(state: ProviderOperationalState): ProviderFailureKind | undefined {
  if (state === 'disabled') return 'disabled';
  if (state === 'degraded') return 'degraded';
  return undefined;
}

function isCircuitOpen(
  provider: ExternalProviderDefinition,
  circuit: ProviderCircuitState,
  now: number,
): boolean {
  if (!circuit.openedAt) return false;
  return now - circuit.openedAt < provider.circuitBreaker.resetAfterMs;
}

export async function executeProviderCall<T>(input: {
  provider: ExternalProviderDefinition;
  call: (attempt: number, signal: AbortSignal) => Promise<ProviderCallResult<T>>;
  fallback: () => T;
  context?: ProviderExecutionContext;
}): Promise<ProviderExecutionResult<T>> {
  const now = input.context?.now ?? Date.now;
  const sleep = input.context?.sleep ??
    ((ms: number) => new Promise((resolve) => setTimeout(resolve, ms)));
  const circuit = input.context?.circuitState ?? { failures: 0 };
  const startedAt = now();
  const blockedByState = stateFailure(input.provider.state);

  if (blockedByState) {
    return {
      ok: false,
      providerId: input.provider.id,
      failure: blockedByState,
      fallback: input.fallback(),
      attempts: 0,
      durationMs: now() - startedAt,
      fallbackUsed: true,
    };
  }

  if (isCircuitOpen(input.provider, circuit, now())) {
    return {
      ok: false,
      providerId: input.provider.id,
      failure: 'circuit-open',
      fallback: input.fallback(),
      attempts: 0,
      durationMs: now() - startedAt,
      fallbackUsed: true,
    };
  }

  let lastFailure: ProviderFailureKind = 'provider-error';

  for (let attempt = 1; attempt <= input.provider.retry.maxAttempts; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), input.provider.timeoutMs);

    try {
      const result = await input.call(attempt, controller.signal);

      if (result.ok && result.value !== undefined) {
        circuit.failures = 0;
        circuit.openedAt = undefined;
        return {
          ok: true,
          providerId: input.provider.id,
          value: result.value,
          attempts: attempt,
          durationMs: now() - startedAt,
          fallbackUsed: false,
        };
      }

      lastFailure = result.ok ? 'invalid-response' : 'provider-error';
      const retryable =
        result.retryable === true ||
        (result.statusCode !== undefined &&
          input.provider.retry.retryableStatusCodes.includes(result.statusCode));

      if (!retryable || attempt === input.provider.retry.maxAttempts) break;
    } catch {
      lastFailure = controller.signal.aborted ? 'timeout' : 'provider-error';
      if (attempt === input.provider.retry.maxAttempts) break;
    } finally {
      clearTimeout(timeout);
    }

    await sleep(input.provider.retry.baseDelayMs * attempt);
  }

  circuit.failures += 1;
  if (circuit.failures >= input.provider.circuitBreaker.failureThreshold) {
    circuit.openedAt = now();
  }

  return {
    ok: false,
    providerId: input.provider.id,
    failure: lastFailure,
    fallback: input.fallback(),
    attempts: input.provider.retry.maxAttempts,
    durationMs: now() - startedAt,
    fallbackUsed: true,
  };
}
