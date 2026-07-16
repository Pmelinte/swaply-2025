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

## Explicit non-effects

Batch 63.3 does not create:

- Swapleni or token-ledger entries;
- Reviews;
- Stories or blog posts;
- trust recalculation;
- automatic sanctions from an unverified report;
- block notifications;
- deletion of conversation history.

## Validation gate

Before merge, the batch requires:

- unit, migration-contract, lint, TypeScript, build and public visual checks;
- migration review against current Production;
- explicit authorization before applying Production migrations;
- authenticated reporter, outsider and moderator checks;
- self-target, invalid target, duplicate, replay and changed-payload checks;
- report rate-limit and stale-status checks;
- every moderation outcome;
- block/unblock replay and concurrency;
- enforcement on interest, conversation, message and Swap creation;
- preserved historical reads;
- zero reward, Review, Story and trust side effects;
- immutable-ID cleanup.

## Current state

- Branch: `agent/batch-63-3-report-block-authority`.
- PR: `#472`, draft.
- Production: unchanged.
- Merge: not authorized.
