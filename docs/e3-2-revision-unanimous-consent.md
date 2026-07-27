# Train E — E3.2 Revision-safe unanimous consent

## Scope

E3.2 adds the first server-side write authority for multi-user agreement revisions and participant consent.

## Contract

- every agreement has a positive `agreement_revision`;
- only the active proposer, with legacy requester compatibility, may create the next revision;
- revision updates use expected-revision compare-and-set semantics;
- acceptances are immutable evidence bound to one participant and one revision;
- acceptances from previous revisions never count toward the current revision;
- acceptance replay is idempotent;
- observers, outsiders, inactive and withdrawn participants cannot accept;
- a pending swap becomes accepted only when all active non-observer participants accept the current revision;
- the transition remains server-side and atomic.

## Safety boundaries

This batch does not:

- reserve or deactivate items;
- start logistics;
- complete an exchange;
- award tokens or reputation;
- create notifications;
- expose direct authenticated table writes;
- activate a new UI flow;
- apply the migration to Production automatically.

## Concurrency guarantees

Both RPCs lock the target swap row. A stale expected revision fails with SQLSTATE `40001`. Duplicate acceptance requests use the unique `(swap_id, participant_id, revision)` key and `ON CONFLICT DO NOTHING`.

## Exit gate

- unanimous consent contract tests pass;
- migration safety tests pass;
- AI regression gate passes;
- Unit Tests, Lint & Type, 43-Locale Contract and Build pass;
- Vercel Preview is READY;
- merge requires Petru's explicit command;
- database closure requires separate confirmation that the E3.1 and E3.2 migrations were applied and verified in Supabase Production.
