export const E3_MULTI_USER_MILESTONE = 'ADVANCED_MULTI_USER_EXCHANGE_READY' as const;

export type E3ClosureScenario = {
  id: string;
  category:
    | 'happy_path'
    | 'authority'
    | 'concurrency'
    | 'privacy'
    | 'recovery'
    | 'cleanup';
  authenticatedActors: number;
  requiresOutsider: boolean;
  requiresConcurrentSessions: boolean;
  expectedInvariant: string;
};

export const E3_CLOSURE_SCENARIOS: readonly E3ClosureScenario[] = [
  {
    id: 'circular-three-participant-completion',
    category: 'happy_path',
    authenticatedActors: 3,
    requiresOutsider: false,
    requiresConcurrentSessions: false,
    expectedInvariant: 'all legs fulfil before the exchange completes',
  },
  {
    id: 'bundle-unanimous-consent',
    category: 'happy_path',
    authenticatedActors: 3,
    requiresOutsider: false,
    requiresConcurrentSessions: false,
    expectedInvariant: 'activation requires acceptance of the same revision by every active participant',
  },
  {
    id: 'participant-refusal',
    category: 'authority',
    authenticatedActors: 3,
    requiresOutsider: false,
    requiresConcurrentSessions: false,
    expectedInvariant: 'one refusal prevents activation without partial reservation effects',
  },
  {
    id: 'stale-revision-rejection',
    category: 'concurrency',
    authenticatedActors: 3,
    requiresOutsider: false,
    requiresConcurrentSessions: true,
    expectedInvariant: 'a stale revision cannot mutate consent, lifecycle or authority state',
  },
  {
    id: 'duplicate-confirmation-idempotency',
    category: 'concurrency',
    authenticatedActors: 3,
    requiresOutsider: false,
    requiresConcurrentSessions: true,
    expectedInvariant: 'replayed confirmation produces no duplicate side effect',
  },
  {
    id: 'cancel-versus-completion-race',
    category: 'concurrency',
    authenticatedActors: 3,
    requiresOutsider: false,
    requiresConcurrentSessions: true,
    expectedInvariant: 'row locking and terminal-state rules yield one authoritative result',
  },
  {
    id: 'leg-dispute-blocks-completion',
    category: 'authority',
    authenticatedActors: 3,
    requiresOutsider: false,
    requiresConcurrentSessions: false,
    expectedInvariant: 'a disputed leg blocks lifecycle progress and rewards',
  },
  {
    id: 'outsider-zero-authority',
    category: 'privacy',
    authenticatedActors: 4,
    requiresOutsider: true,
    requiresConcurrentSessions: false,
    expectedInvariant: 'an outsider cannot read participant-only evidence or invoke mutation authority',
  },
  {
    id: 'reload-reconnect-stability',
    category: 'recovery',
    authenticatedActors: 3,
    requiresOutsider: false,
    requiresConcurrentSessions: true,
    expectedInvariant: 'reload and reconnect preserve the server-authoritative state',
  },
  {
    id: 'immutable-id-cleanup',
    category: 'cleanup',
    authenticatedActors: 3,
    requiresOutsider: false,
    requiresConcurrentSessions: false,
    expectedInvariant: 'test data is removed only by captured immutable identifiers',
  },
] as const;

export type E3ClosureEvidence = {
  scenarioId: string;
  passed: boolean;
  evidenceRef?: string;
};

export function evaluateE3Closure(evidence: readonly E3ClosureEvidence[]) {
  const evidenceByScenario = new Map(evidence.map((entry) => [entry.scenarioId, entry]));
  const missing = E3_CLOSURE_SCENARIOS.filter((scenario) => !evidenceByScenario.has(scenario.id)).map(
    (scenario) => scenario.id,
  );
  const failed = E3_CLOSURE_SCENARIOS.filter(
    (scenario) => evidenceByScenario.get(scenario.id)?.passed === false,
  ).map((scenario) => scenario.id);
  const unknown = evidence
    .filter((entry) => !E3_CLOSURE_SCENARIOS.some((scenario) => scenario.id === entry.scenarioId))
    .map((entry) => entry.scenarioId);

  return {
    milestone: E3_MULTI_USER_MILESTONE,
    ready: missing.length === 0 && failed.length === 0 && unknown.length === 0,
    requiredScenarioCount: E3_CLOSURE_SCENARIOS.length,
    passedScenarioCount: E3_CLOSURE_SCENARIOS.length - missing.length - failed.length,
    missing,
    failed,
    unknown,
  } as const;
}
