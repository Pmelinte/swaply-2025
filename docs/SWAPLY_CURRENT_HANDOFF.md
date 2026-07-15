# Swaply — Current Project Handoff

**Repository path:** `docs/SWAPLY_CURRENT_HANDOFF.md`  
**Last updated:** 2026-07-15  
**Purpose:** latest verified operational checkpoint and next Train C action.

## Current status

- Train A: `CLOSED`.
- Train B: `CLOSED`.
- Train C: `ACTIVE`.
- C1: `CLOSED`.
- C2: `CLOSED`.
- C3: `READY_TO_CLOSE` on draft PR `#469`.
- C4 and C5: `PLANNED`.
- Train E remains the terminal v1 train; there is no Train F.

## Permanent rules

- Swaply remains global-first across Objects, Properties, Services and Events.
- Global navigation and contextual drawers remain separate.
- Blog and Stories remain separate.
- Swapleni and trust rank remain separate; rank cannot be bought.
- AI is advisory and every AI flow needs a fallback.
- Private data stays protected and exact location is disclosed only after consent.
- Merge only after Petru gives the exact `Merge #...` command.
- After merge verify GitHub CI, Vercel Production, runtime and database evidence.

## Verified checkpoint

- Repository: `Pmelinte/swaply-2025`.
- Current `main`: `aa434594039b7bcb443b03848f3d5a76b6d26fff`.
- Production: `https://www.swaply.world`.
- PR `#467` / Batch 62.1: merged.
- PR `#468` / Batch 62.2: merged.
- PR `#469` / Batch 62.3: `OPEN / DRAFT`, not merged.
- Active branch: `agent/batch-62-3-authenticated-c3-closure`.
- Fully validated product/database code head: `c7f0ff9497faea4f515325155978d500d4c53898`.
- Later commits contain closure documentation and restoration of the authenticated workflow to manual dispatch.

## Closed C2 contract

- one canonical Swap transition authority;
- expected-state CAS and row lock;
- participant authorization;
- private idempotency registry;
- immutable participant and item identity;
- bilateral completion;
- first confirmation has zero completion effects;
- second confirmation completes atomically;
- items and linked conversation complete exactly once.

Detailed evidence:

- `docs/batch-61-2-single-transition-authority.md`;
- `docs/batch-61-4-authenticated-completion-validation.md`.

## C3 contract

### Batch 62.1 — Canonical Review Authority

- `public.reviews` is the only Exchange Review table;
- authenticated RPC is the only submission authority;
- reviewer and reviewed participant are derived canonically;
- one immutable Review per participant and Swap;
- same-payload replay is idempotent;
- direct browser writes are blocked;
- only the reviewed participant may respond.

Evidence: `docs/batch-62-1-canonical-review-authority.md`.

### Batch 62.2 — Exactly-Once Post-Completion Effects

For every newly completed canonical Exchange:

- one private post-completion registry row;
- `+30` Swapleni per participant;
- two completion and two feedback-request notifications;
- deterministic dedupe keys;
- completion counters and trust update once;
- Review insertion recalculates rating and trust;
- `is_read` is canonical and legacy `read` remains synchronized;
- structural and C3 effects share one transaction;
- historical completed Swaps are not backfilled.

Evidence: `docs/batch-62-2-post-completion-effects.md`.

### Batch 62.3 — Authenticated C3 Closure

Validated guarantees:

- notifications are published to Supabase Realtime;
- the visible UI uses a dedicated lossless, deduplicated Realtime channel;
- expired reusable E2E sessions refresh deterministically;
- changed-payload Review idempotency conflicts return HTTP `409`;
- guarded cleanup is restricted to privately registered E2E participants;
- cleanup validates cardinality and restores profile caches.

Production migrations:

- `20260715144457_batch_62_3_authenticated_e2e_cleanup`;
- `20260715145929_batch_62_3_notifications_realtime`;
- `20260715155017_batch_62_3_review_conflict_status`.

Evidence: `docs/batch-62-3-authenticated-c3-closure.md`.

## Final validation

Authenticated GitHub Actions:

- run `#73`, ID `29429892042`;
- exact code head `c7f0ff9497faea4f515325155978d500d4c53898`;
- result `SUCCESS`.

Repository CI:

- run `#1017`, ID `29429886622`;
- Unit Tests, Lint & Type Check, Build and Public Visual Audit: success.

Vercel Preview:

- deployment `dpl_6BGpfYuMweBEBgQvQxkAMDgjF9RY`;
- state `READY` on the exact validated code head;
- `/en/exchange` and `/en/messages`: HTTP `200`;
- no inspected runtime errors, warnings or fatal events.

Production cleanup:

- test Swaps: `0`;
- completion effects: `0`;
- post-completion effects: `0`;
- test notifications: `0`;
- test rewards: `0`;
- test Reviews: `0`;
- notification read-state mismatches: `0`.

## Closure gate

C3 is `READY_TO_CLOSE`, not `CLOSED`.

C3 closes only after:

1. exact command `Merge #469`;
2. merge without head drift;
3. post-merge GitHub CI and Vercel Production verification;
4. final Production runtime and database cleanup checks.

C4 must not start before those checks pass.

## Exact next action

Verify the final PR #469 head, then wait for Petru's exact command `Merge #469`.
