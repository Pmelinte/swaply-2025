import { describe, expect, it } from 'vitest';

import {
  assertCommercialClosure,
  evaluateCommercialClosure,
  REQUIRED_COMMERCIAL_CLOSURE_SCENARIOS,
  type CommercialClosureEvidence,
} from '@/lib/commerce/commercial-closure-gate';

function completeEvidence(): CommercialClosureEvidence[] {
  return REQUIRED_COMMERCIAL_CLOSURE_SCENARIOS.map((scenario, index) => ({
    scenario,
    passed: true,
    zeroSideEffectsOnFailure: true,
    evidenceId: `e48:${String(index + 1).padStart(2, '0')}:${scenario}`,
  }));
}

describe('E4.8 commercial closure gate', () => {
  it('closes only when the complete commercial regression matrix passes', () => {
    const verdict = assertCommercialClosure(completeEvidence());

    expect(verdict.closed).toBe(true);
    expect(verdict.failed).toEqual([]);
    expect(verdict.passed).toHaveLength(REQUIRED_COMMERCIAL_CLOSURE_SCENARIOS.length);
    expect(verdict.milestone).toBe('MONETIZATION_AND_EXTERNAL_INTEGRATIONS_READY');
  });

  it('fails closed when one required scenario is missing', () => {
    const evidence = completeEvidence().filter(({ scenario }) => scenario !== 'webhook-replay');
    const verdict = evaluateCommercialClosure(evidence);

    expect(verdict.closed).toBe(false);
    expect(verdict.failed).toContain('webhook-replay');
    expect(() => assertCommercialClosure(evidence)).toThrow('commercial-closure-failed:webhook-replay');
  });

  it('requires zero-side-effect evidence for every failure path', () => {
    const evidence = completeEvidence().map((entry) =>
      entry.scenario === 'provider-unavailable-fallback'
        ? { ...entry, zeroSideEffectsOnFailure: false }
        : entry,
    );

    expect(evaluateCommercialClosure(evidence).failed).toContain('provider-unavailable-fallback');
  });

  it('rejects duplicate scenario evidence', () => {
    const evidence = completeEvidence();
    evidence.push({ ...evidence[0], evidenceId: 'e48:duplicate:free-swap-invariant' });

    expect(() => evaluateCommercialClosure(evidence)).toThrow(
      'duplicate-commercial-closure-scenario',
    );
  });

  it('rejects mutable or malformed evidence identifiers', () => {
    const evidence = completeEvidence();
    evidence[0] = { ...evidence[0], evidenceId: 'bad id' };

    expect(() => evaluateCommercialClosure(evidence)).toThrow(
      'invalid-commercial-closure-evidence-id',
    );
  });
});
