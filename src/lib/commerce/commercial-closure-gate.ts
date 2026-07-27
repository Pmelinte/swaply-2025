export type CommercialClosureScenario =
  | 'free-swap-invariant'
  | 'optional-service-disclosure'
  | 'provider-unavailable-fallback'
  | 'affiliate-click-deduplication'
  | 'affiliate-conversion-expiry'
  | 'payment-idempotency'
  | 'payment-declined'
  | 'webhook-invalid-signature'
  | 'webhook-replay'
  | 'webhook-out-of-order'
  | 'refund-reconciliation'
  | 'campaign-moderation'
  | 'campaign-frequency-cap'
  | 'campaign-budget-cap'
  | 'campaign-kill-switch'
  | 'outsider-denied'
  | 'participant-read-only-history'
  | 'cleanup-by-immutable-id';

export interface CommercialClosureEvidence {
  scenario: CommercialClosureScenario;
  passed: boolean;
  zeroSideEffectsOnFailure: boolean;
  evidenceId: string;
}

export interface CommercialClosureVerdict {
  milestone: 'MONETIZATION_AND_EXTERNAL_INTEGRATIONS_READY';
  closed: boolean;
  passed: CommercialClosureScenario[];
  failed: CommercialClosureScenario[];
}

export const REQUIRED_COMMERCIAL_CLOSURE_SCENARIOS: readonly CommercialClosureScenario[] = [
  'free-swap-invariant',
  'optional-service-disclosure',
  'provider-unavailable-fallback',
  'affiliate-click-deduplication',
  'affiliate-conversion-expiry',
  'payment-idempotency',
  'payment-declined',
  'webhook-invalid-signature',
  'webhook-replay',
  'webhook-out-of-order',
  'refund-reconciliation',
  'campaign-moderation',
  'campaign-frequency-cap',
  'campaign-budget-cap',
  'campaign-kill-switch',
  'outsider-denied',
  'participant-read-only-history',
  'cleanup-by-immutable-id',
] as const;

function validateEvidenceId(value: string): string {
  const evidenceId = value.trim();
  if (evidenceId.length < 8 || evidenceId.length > 160 || !/^[A-Za-z0-9:_\-.]+$/.test(evidenceId)) {
    throw new Error('invalid-commercial-closure-evidence-id');
  }
  return evidenceId;
}

export function evaluateCommercialClosure(
  evidence: readonly CommercialClosureEvidence[],
): CommercialClosureVerdict {
  const byScenario = new Map<CommercialClosureScenario, CommercialClosureEvidence>();

  for (const entry of evidence) {
    validateEvidenceId(entry.evidenceId);
    if (byScenario.has(entry.scenario)) throw new Error('duplicate-commercial-closure-scenario');
    byScenario.set(entry.scenario, entry);
  }

  const passed: CommercialClosureScenario[] = [];
  const failed: CommercialClosureScenario[] = [];

  for (const scenario of REQUIRED_COMMERCIAL_CLOSURE_SCENARIOS) {
    const entry = byScenario.get(scenario);
    if (entry?.passed && entry.zeroSideEffectsOnFailure) passed.push(scenario);
    else failed.push(scenario);
  }

  return {
    milestone: 'MONETIZATION_AND_EXTERNAL_INTEGRATIONS_READY',
    closed: failed.length === 0,
    passed,
    failed,
  };
}

export function assertCommercialClosure(
  evidence: readonly CommercialClosureEvidence[],
): CommercialClosureVerdict {
  const verdict = evaluateCommercialClosure(evidence);
  if (!verdict.closed) {
    throw new Error(`commercial-closure-failed:${verdict.failed.join(',')}`);
  }
  return verdict;
}
