import { describe, expect, it } from 'vitest';

import {
  E3_CLOSURE_SCENARIOS,
  E3_MULTI_USER_MILESTONE,
  evaluateE3Closure,
} from '@/lib/exchange/multi-user-closure-contract';

describe('E3.6 authenticated E2E and closure matrix', () => {
  it('covers the complete multi-user closure risk surface', () => {
    expect(E3_CLOSURE_SCENARIOS).toHaveLength(10);
    expect(new Set(E3_CLOSURE_SCENARIOS.map((scenario) => scenario.id)).size).toBe(
      E3_CLOSURE_SCENARIOS.length,
    );

    expect(E3_CLOSURE_SCENARIOS.some((scenario) => scenario.requiresOutsider)).toBe(true);
    expect(E3_CLOSURE_SCENARIOS.some((scenario) => scenario.requiresConcurrentSessions)).toBe(true);
    expect(
      E3_CLOSURE_SCENARIOS.every((scenario) => scenario.authenticatedActors >= 3),
    ).toBe(true);

    expect(new Set(E3_CLOSURE_SCENARIOS.map((scenario) => scenario.category))).toEqual(
      new Set(['happy_path', 'authority', 'concurrency', 'privacy', 'recovery', 'cleanup']),
    );
  });

  it('does not close E3 with missing evidence', () => {
    const result = evaluateE3Closure([
      {
        scenarioId: 'circular-three-participant-completion',
        passed: true,
        evidenceRef: 'vitest:e3-circular',
      },
    ]);

    expect(result.ready).toBe(false);
    expect(result.missing).toHaveLength(E3_CLOSURE_SCENARIOS.length - 1);
    expect(result.milestone).toBe(E3_MULTI_USER_MILESTONE);
  });

  it('does not close E3 when any required scenario fails', () => {
    const evidence = E3_CLOSURE_SCENARIOS.map((scenario) => ({
      scenarioId: scenario.id,
      passed: scenario.id !== 'cancel-versus-completion-race',
      evidenceRef: `contract:${scenario.id}`,
    }));

    const result = evaluateE3Closure(evidence);

    expect(result.ready).toBe(false);
    expect(result.failed).toEqual(['cancel-versus-completion-race']);
    expect(result.missing).toEqual([]);
  });

  it('rejects evidence that is not part of the canonical matrix', () => {
    const evidence = [
      ...E3_CLOSURE_SCENARIOS.map((scenario) => ({
        scenarioId: scenario.id,
        passed: true,
        evidenceRef: `contract:${scenario.id}`,
      })),
      { scenarioId: 'invented-scenario', passed: true },
    ];

    const result = evaluateE3Closure(evidence);

    expect(result.ready).toBe(false);
    expect(result.unknown).toEqual(['invented-scenario']);
  });

  it('emits the terminal milestone only with complete passing evidence', () => {
    const evidence = E3_CLOSURE_SCENARIOS.map((scenario) => ({
      scenarioId: scenario.id,
      passed: true,
      evidenceRef: `contract:${scenario.id}`,
    }));

    const result = evaluateE3Closure(evidence);

    expect(result.ready).toBe(true);
    expect(result.milestone).toBe('ADVANCED_MULTI_USER_EXCHANGE_READY');
    expect(result.passedScenarioCount).toBe(result.requiredScenarioCount);
    expect(result.missing).toEqual([]);
    expect(result.failed).toEqual([]);
    expect(result.unknown).toEqual([]);
  });
});
