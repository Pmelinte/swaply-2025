# Swaply — Current Project Handoff

**Last updated:** 2026-07-16

## Status

- Train A: `CLOSED`.
- Train B: `CLOSED`.
- Train C: `ACTIVE`.
- C1: `CLOSED`.
- C2: `CLOSED`.
- C3: `CLOSED`.
- C4: `ACTIVE`.
- C5: `PLANNED` as the final Train C closure gate.
- Train E is terminal for v1; there is no Train F.

C4 sequence:

- Batch 63.1 — canonical cancel authority: `CLOSED`;
- Batch 63.2 — canonical dispute authority: `CLOSED`;
- Batch 63.3 — canonical report/block authority: `IN_PROGRESS` on draft PR `#472`;
- Batch 63.4 — authenticated C4 closure: `PLANNED`.

## Rules

- Swaply remains global-first across Objects, Properties, Services and Events.
- Global navigation and contextual drawers remain separate.
- Blog and Stories remain separate.
- Swapleni and trust rank remain separate.
- AI is advisory and requires fallback.
- Private data stays protected.
- Historical migrations are never rewritten; every database change uses a new migration.
- Merge only after Petru gives the exact `Merge #...` command.
- After merge verify GitHub CI, Vercel Production, runtime and database evidence.

## Checkpoint

- Repository: `Pmelinte/swaply-2025`.
- Current `main`: `7cd2cf036a19c050ee8cee5d451f3c041d8601a3`.
- Production: `https://www.swaply.world`.
- PR `#470`: merged; Batch 63.1 closed.
- PR `#471`: merged; Batch 63.2 closed.
- PR `#472`: `OPEN / DRAFT`, not merged.
- Active branch: `agent/batch-63-3-report-block-authority`.
- Supabase Production includes:
  - `20260715182419_batch_63_1_cancel_authority`;
  - `20260715231323_batch_63_2_dispute_foundation`;
  - `20260715231400_batch_63_2_dispute_open_authority`;
  - `20260715231430_batch_63_2_dispute_evidence_authority`;
  - `20260715231502_batch_63_2_dispute_resolution_authority`.
- Batch 63.3 migrations are repository-only and have not been applied to Production.

## C2

C2 guarantees one canonical transition authority, expected-state CAS, participant authorization, immutable identity, bilateral completion and exactly-once structural effects.

Evidence:

- `docs/batch-61-2-single-transition-authority.md`;
- `docs/batch-61-4-authenticated-completion-validation.md`.

## C3

### Batch 62.1

One canonical Review table and authority; derived participants; immutable Review; idempotent replay; direct writes blocked; reviewed participant controls response.

Evidence: `docs/batch-62-1-canonical-review-authority.md`.

### Batch 62.2

Each new canonical completion creates one private effect row, awards `+30` Swapleni per participant, sends four deduplicated notifications, updates counters and trust once, synchronizes notification read state and shares one transaction with structural effects. No historical backfill.

Evidence: `docs/batch-62-2-post-completion-effects.md`.

### Batch 62.3

Authenticated two-user closure verified completion, reward, notification, Review, Realtime and immutable-ID cleanup contracts. PR `#469` was merged and post-merge Production checks passed.

Evidence: `docs/batch-62-3-authenticated-c3-closure.md`.

## C4

### Batch 63.1 — cancellation

Canonical participant-only cancellation is atomic and exactly-once. It uses expected-state CAS, reason validation, idempotency, targeted item reactivation, confirmation cleanup, conversation closure, actor-only post-acceptance cancellation counting, trust recalculation and two deduplicated notifications.

Production evidence:

- migration `20260715182419_batch_63_1_cancel_authority`;
- authenticated participant, outsider, stale, replay and two-session concurrency audit: `PASS`;
- immutable-ID cleanup: `PASS`;
- PR `#470` merged at `fac96cb0b0aee779513fbd61fe825fdd1bb51e55`;
- Vercel Production deployment `dpl_6REcL5UDEbBQZETBGVJzQgnNNmj7`: `READY`;
- `/en/exchange`: HTTP `200`;
- inspected runtime errors: none.

Evidence: `docs/batch-63-1-cancel-authority.md`.

### Batch 63.2 — disputes

Canonical dispute opening, participant evidence and moderator resolution are atomic and exactly-once. The global Swap remains terminal `disputed`; investigation outcomes remain local to the dispute. Direct writes and generic transitions are blocked, exact Swap locks are cleaned at resolution and only the responsible participant receives a trust consequence.

Production evidence:

- four Batch 63.2 migrations applied;
- authenticated participant, outsider, stale, replay, evidence, moderator and two-session concurrency audit: `PASS`;
- all four resolution outcomes: `PASS`;
- zero reward, Review and Story side effects: `PASS`;
- immutable-ID cleanup: `PASS`;
- PR `#471` merged at `7cd2cf036a19c050ee8cee5d451f3c041d8601a3`;
- Vercel Production deployment `dpl_2zDjdLKWRgazsKXjdbdVGq9igDik`: `READY`;
- `/en/exchange`: HTTP `200`;
- inspected runtime errors: none.

Evidence: `docs/batch-63-2-dispute-authority.md`.

### Batch 63.3 — reports and blocks

Audit found two incompatible report sources: user actions wrote `public.reports`, while the admin workflow used absent `public.abuse_reports`. Blocks were direct client writes, were not hydrated after login and did not create a server-side contact barrier. Unverified profile reports could also trigger automatic suspension before moderator review.

PR `#472` introduces:

- `public.reports` and `public.blocked_users` as the sole public safety sources;
- private idempotency and report-resolution effect registries;
- authenticated canonical report submission with validation, duplicate prevention and rate limiting;
- admin/moderator-only atomic report investigation and resolution;
- authenticated idempotent block/unblock;
- bilateral block enforcement for new interests, conversations, messages and Swaps;
- preservation of existing conversation history;
- removal of unverified automatic sanctions and direct writers;
- persisted block hydration and accurate UI success/error state;
- canonical admin report listing, statistics and actions.

Evidence: `docs/batch-63-3-report-block-authority.md`.

## Current closure gate

Batch 63.3 remains `IN_PROGRESS` and PR `#472` remains draft until:

- final CI and Vercel Preview pass on the latest head;
- migration review against current Production is complete;
- the migrations are applied only after explicit authorization;
- authenticated reporter, outsider, moderator, stale, replay, rate-limit and concurrency probes pass;
- every moderator outcome passes;
- block/unblock and contact-barrier enforcement pass in both directions;
- existing history remains readable;
- zero reward, Review, Story and trust side effects are verified;
- immutable-ID cleanup is complete.

No merge is authorized by this handoff.
