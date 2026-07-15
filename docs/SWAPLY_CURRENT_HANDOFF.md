# Swaply — Current Project Handoff

**Last updated:** 2026-07-15

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
- Batch 63.2 — canonical dispute authority: `IN_PROGRESS` on draft PR `#471`;
- Batch 63.3 — canonical report/block authority: `PLANNED`;
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
- Current `main`: `fac96cb0b0aee779513fbd61fe825fdd1bb51e55`.
- Production: `https://www.swaply.world`.
- PR `#469`: merged; C3 closed.
- PR `#470`: merged; Batch 63.1 closed.
- PR `#471`: `OPEN / DRAFT`, not merged.
- Active branch: `agent/batch-63-2-dispute-authority`.
- Supabase Production includes migration `20260715182419_batch_63_1_cancel_authority`.
- Batch 63.2 migrations are repository-only and have not been applied to Production.

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

Audit found that the historical dispute migration existed only in the repository: `public.disputes` and `public.dispute_evidence` were absent from Supabase Production. Legacy APIs used application `service_role`, non-atomic writes and a non-canonical global `resolved` state.

PR `#471` introduces:

- one canonical dispute row per Swap;
- participant evidence;
- private idempotency and effect registries;
- atomic participant-only dispute opening from `accepted` or `in_progress`;
- participant-only evidence append;
- admin/moderator-only resolution;
- dispute-local outcomes while the global Swap remains terminal `disputed`;
- targeted item cleanup, exact loser/rejected-initiator trust consequence and deduplicated notifications;
- direct-write and generic-transition guards;
- removal of client and service-role fallback writers.

Evidence: `docs/batch-63-2-dispute-authority.md`.

## Current closure gate

Batch 63.2 remains `IN_PROGRESS` and PR `#471` remains draft until:

- final CI and Preview pass on the latest head;
- migration review against current Production is complete;
- the migrations are applied only after explicit authorization;
- authenticated participant, outsider, stale, replay, concurrency, evidence and moderator-resolution probes pass;
- zero reward, Review and Story side effects are verified;
- immutable-ID cleanup is complete.

No merge is authorized by this handoff.
