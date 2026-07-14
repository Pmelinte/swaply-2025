# Batch 61.1 — Canonical Swap/Exchange Lifecycle Contract

**Train:** C  
**Deliverable:** C2 — single canonical server-side Exchange lifecycle  
**Scope:** status vocabulary, transition graph, repository–Production parity and contract tests  
**Out of scope:** single write authority, bilateral completion, final feedback/reputation effects and complete dispute resolution

## Canonical global statuses

The `swaps.status` column represents only the global business state:

1. `pending`
2. `accepted`
3. `in_progress`
4. `completed`
5. `rejected`
6. `cancelled`
7. `expired`
8. `disputed`

The following are not global statuses:

- delivery-side aliases;
- courier or meetup timeline steps;
- dispute resolution outcomes;
- support-service statuses.

Those concepts remain in their own domain-specific state.

## Canonical transition graph

| Current status | Allowed next statuses |
|---|---|
| `pending` | `accepted`, `rejected`, `cancelled`, `expired` |
| `accepted` | `in_progress`, `completed`, `cancelled`, `disputed` |
| `in_progress` | `completed`, `cancelled`, `disputed` |
| `completed` | none |
| `rejected` | none |
| `cancelled` | none |
| `expired` | none |
| `disputed` | none until C4 defines the resolution outcome |

`accepted → completed` is retained temporarily as a compatibility bridge. Batch 61.3 must replace direct completion with bilateral server-side confirmation.

## Source of truth

The repository source of truth is:

- `src/lib/swaps/lifecycle.ts` for the TypeScript vocabulary and graph;
- `supabase/migrations/20260714192055_batch_61_1_canonical_swap_lifecycle.sql` for the Production check constraint and transition trigger;
- contract tests in `src/lib/swaps/lifecycle.test.ts` and `src/lib/swaps/lifecycleMigration.test.ts`.

The transition API and the main state mapper consume the TypeScript contract rather than declaring independent status lists.

## Production application evidence

The migration was applied to Production as:

- version: `20260714192055`;
- name: `batch_61_1_canonical_swap_lifecycle`.

Post-application verification confirmed:

- `swaps_status_check` contains exactly the eight canonical global statuses;
- the constraint is validated;
- `validate_swap_transition` still guards every update of `swaps.status`;
- the trigger function matches the repository transition matrix;
- all 401 existing `swaps` rows remain valid;
- incompatible status rows: zero.

## Deliberate limitations remaining after Batch 61.1

Batch 61.1 does not claim that C2 is closed. The following remain fixed work:

- Batch 61.2: one server-side write authority, participant roles, expected-state/CAS and idempotency;
- Batch 61.3: bilateral completion and exactly-once side effects;
- Batch 61.4: logistics, conversation and Realtime alignment;
- Batch 61.5: authenticated closure suite and report.

Direct browser updates and legacy completion paths must not be interpreted as canonical merely because they still exist during this compatibility stage.

## Exit gate for Batch 61.1

Batch 61.1 is complete only when:

- Unit Tests pass;
- Lint and Type Check pass;
- Build passes;
- Public Visual Audit passes;
- the migration is applied to Production;
- the Production constraint and trigger match the repository contract;
- existing Production rows remain valid;
- no application route or public UI regression is introduced.
