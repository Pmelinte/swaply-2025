# Batch 63.3 — Canonical Report & Block Authority

## Purpose

Batch 63.3 closes the report and block authority gap in Train C4. It creates one authoritative report lifecycle and one authoritative block relationship, removes parallel writers and enforces safety decisions at database boundaries.

## Root causes

The pre-Batch implementation had several incompatible paths:

- users inserted directly into `public.reports`;
- the admin page and stats endpoint used `public.abuse_reports`, which is absent from Production;
- report reasons and statuses differed between the two schemas;
- report inserts could increment `profiles.report_count` and auto-suspend a user before moderator review;
- report resolution, warning, item hiding and suspension were separate non-atomic operations;
- block and unblock directly mutated `public.blocked_users`;
- the client showed a successful block/report even after database failure;
- persisted blocks were not hydrated after login;
- blocking did not prevent new contact server-side.

## Canonical storage

- `public.reports` is the single report source of truth.
- `public.blocked_users` is the single block source of truth.
- `public.safety_command_requests` is a private idempotency registry.
- `public.safety_report_resolution_effects` records terminal moderation effects exactly once.
- Historical `public.abuse_reports`, when present, is reconciled into `public.reports` and removed.

## Report submission

`public.submit_safety_report_v1`:

- requires `auth.uid()`;
- accepts a user or item target and derives the canonical reported user;
- forbids self-reporting and reporting one's own item;
- validates reason, description and up to ten evidence entries;
- limits one active report per reporter and target;
- limits a reporter to ten submissions per 24 hours;
- uses an actor-scoped idempotency key and request hash;
- creates an audit entry;
- does not suspend, hide, warn, increment counters, alter trust or award tokens.

## Moderator resolution

`public.resolve_safety_report_v1`:

- requires an `admin` or `moderator` row in `public.user_roles`;
- uses expected-status compare-and-set and row locking;
- supports `investigate`, `dismiss`, `warn`, `hide_item` and `suspend_7d`;
- applies each terminal moderation effect and report transition in one transaction;
- writes one `moderation_actions` row where applicable;
- increments `report_count` only after a confirmed warning, hidden item or suspension;
- records one terminal effect row and one audit entry;
- supports same-payload replay and rejects conflicting key reuse.

Raw reports and dismissed reports have no trust or reputation effect. `report_count` is not part of the current canonical trust formula.

## Block authority

`public.set_user_block_v1`:

- requires `auth.uid()`;
- forbids self-blocking;
- validates the target profile;
- uses a pair lock plus actor-scoped idempotency;
- creates or removes only the actor's directed block row;
- refuses pending matching interests between the pair when a block is created;
- returns the persisted block state;
- creates a private audit entry;
- sends no target notification.

A block is bilateral as a contact barrier: if either participant has blocked the other, database triggers prevent:

- new matching interests or acceptance of an existing interest;
- new conversations;
- new messages;
- new Swaps.

Existing conversations and messages remain readable according to their existing participant policies. Blocking does not delete history and does not cancel an already active Swap.

## Direct-write protection

Browser roles have SELECT-only access where required. INSERT, UPDATE and DELETE on `reports`, `blocked_users` and private registries are revoked. Guard triggers accept writes only while the corresponding canonical RPC holds the transaction-local authority marker.

## Application integration

- `useSafetyActions` calls the canonical report/block RPC adapters;
- block state changes only after a successful response;
- persisted outgoing blocks are hydrated after authentication;
- report/block UI displays failures and prevents duplicate clicks;
- the admin report page reads `public.reports` and resolves through the canonical RPC;
- the admin overview counts `open` and `investigating` canonical reports;
- application references to `abuse_reports` are removed.

## Production migration record

Production was explicitly authorized and migrated on 2026-07-16.

The logical report-authority migration was applied as two operational units because the connector rejected the single long payload before execution:

- `batch_63_3_report_submit_authority`;
- `batch_63_3_report_resolution_authority`.

All other canonical migrations were applied in order. Authenticated runtime probes then found two SQL qualification defects:

1. `pg_catalog.greatest(...)` in the seven-day suspension outcome;
2. `pg_catalog.least(...)` / `pg_catalog.greatest(...)` in the block pair-lock functions.

Neither failed command committed a side effect. They were repaired only through new migrations:

- `batch_63_3_resolution_greatest_fix`;
- `batch_63_3_block_least_greatest_fix`.

The performance advisor also identified the three new terminal-effect foreign keys without covering indexes. They were corrected through:

- `batch_63_3_resolution_effect_indexes`.

No applied migration was rewritten.

## Authenticated Production audit

### Report submission — PASS

Authenticated reporter, reported user, outsider and administrator probes verified:

- user and item reports;
- self-target and own-item rejection;
- missing-target rejection;
- one active report per reporter and target;
- same-payload replay;
- changed-payload idempotency conflict;
- direct-write rejection;
- reporter-only and moderator RLS visibility;
- non-moderator resolution rejection;
- exactly two request rows and two audit events in the controlled rollback probe;
- zero notification, Swapleni, Review, suspension, counter or trust effects from raw reports.

The rate-limit probe accepted exactly ten reports in 24 hours and rejected the eleventh with SQLSTATE `54000`. The whole probe was rolled back.

### Moderator lifecycle — PASS

The real Production RPCs verified:

- `open → investigating` with no terminal effect;
- investigate replay;
- stale expected-status rejection with SQLSTATE `40001`;
- changed-payload idempotency rejection with SQLSTATE `23505`;
- `dismissed` with exactly one terminal effect and no sanction;
- `warning_issued` with one action, one effect and one confirmed counter increment;
- `item_hidden` with one action, one effect and only the reported fixture item archived;
- `user_suspended` with one normalized `suspend_user` action, one effect and a seven-day term;
- terminal replay without duplicated effects;
- trust unchanged and zero Swapleni, Review, Story or notification effects.

Every profile, item and registry mutation used by the audit was restored or deleted immediately after verification.

### Block lifecycle — PASS

Authenticated A/B probes verified:

- block and unblock;
- same-payload replay;
- changed-payload conflict;
- self-block and missing-target rejection;
- outgoing-only block visibility;
- direct-write rejection;
- pending-interest cleanup;
- bilateral rejection of new interests, interest acceptance, conversations, messages and Swaps;
- preservation and readability of pre-existing Swap, conversation and message history;
- zero notification to the blocked user;
- re-enabled contact after unblock.

A pre-existing pending E2E interest changed by the block command was identified through the shared PostgreSQL transaction `xmin` and restored exactly to `pending`.

### Real concurrency — PASS

Two pg_cron sessions started in the same second with the same actor, target and idempotency key. Both completed successfully. The final state contained exactly:

- one block row;
- one idempotency request row;
- one `safety.user_blocked` audit event.

Repeated scheduled calls were replay-only. Both jobs were unscheduled, the block was removed, the affected interest was restored and all audit fixtures were deleted.

## Explicit non-effects

Batch 63.3 created no:

- Swapleni or token-ledger entries;
- Reviews;
- Stories or blog posts;
- trust recalculation;
- automatic sanction from an unverified report;
- block notification;
- deletion of conversation history;
- automatic cancellation of an existing Swap.

## Advisors

Security advisor findings related to Batch 63.3 are intentional and verified:

- the canonical RPCs are `SECURITY DEFINER`, but authenticate with `auth.uid()`, enforce server-side role/participant rules and expose only the required signatures;
- private registry tables use RLS with no browser policies, which is default-deny;
- `private` schema objects are not exposed through PostgREST.

Performance findings for the three new resolution-effect foreign keys were remediated. Other advisor warnings predate Batch 63.3 and remain outside this batch.

## Current state

- Branch: `agent/batch-63-3-report-block-authority`.
- PR: `#472`, draft.
- Production migrations: applied.
- Authenticated Production audit: `PASS`.
- Immutable-ID cleanup: `PASS`.
- Remaining gate: final GitHub CI and Vercel Preview on the post-audit head.
- Merge: not authorized.
