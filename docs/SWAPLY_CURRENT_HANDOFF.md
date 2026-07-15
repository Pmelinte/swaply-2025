# Swaply — Current Project Handoff

**Last updated:** 2026-07-15

## Status

- Train A: `CLOSED`.
- Train B: `CLOSED`.
- Train C: `ACTIVE`.
- C1: `CLOSED`.
- C2: `CLOSED`.
- C3: `READY_TO_CLOSE` on draft PR `#469`.
- C4 and C5: `PLANNED`.
- Train E is terminal for v1; there is no Train F.

## Rules

- Swaply remains global-first across Objects, Properties, Services and Events.
- Global navigation and contextual drawers remain separate.
- Blog and Stories remain separate.
- Swapleni and trust rank remain separate.
- AI is advisory and requires fallback.
- Private data stays protected.
- Merge only after Petru gives the exact `Merge #...` command.
- After merge verify GitHub CI, Vercel Production, runtime and database evidence.

## Checkpoint

- Repository: `Pmelinte/swaply-2025`.
- Current `main`: `aa434594039b7bcb443b03848f3d5a76b6d26fff`.
- Production: `https://www.swaply.world`.
- PR `#467` and PR `#468`: merged.
- PR `#469`: `OPEN / DRAFT`, not merged.
- Branch: `agent/batch-62-3-authenticated-c3-closure`.
- Fully validated product/database code head: `c7f0ff9497faea4f515325155978d500d4c53898`.
- Later commits contain documentation and restoration of the authenticated workflow to manual dispatch.

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

Validated fixes:

- notification Realtime publication;
- dedicated lossless UI channel;
- deterministic E2E session refresh;
- HTTP `409` for changed-payload Review idempotency conflict;
- private guarded cleanup and cache restoration.

Production migrations:

- `20260715144457_batch_62_3_authenticated_e2e_cleanup`;
- `20260715145929_batch_62_3_notifications_realtime`;
- `20260715155017_batch_62_3_review_conflict_status`.

Evidence: `docs/batch-62-3-authenticated-c3-closure.md`.

## Final validation

- Authenticated run `#73`, ID `29429892042`: `SUCCESS`.
- CI run `#1017`, ID `29429886622`: all four jobs succeeded.
- Vercel deployment `dpl_6BGpfYuMweBEBgQvQxkAMDgjF9RY`: `READY`.
- `/en/exchange` and `/en/messages`: HTTP `200`.
- No inspected Preview runtime errors, warnings or fatal events.
- Production cleanup: zero test Swaps, effects, notifications, rewards, Reviews and read-state mismatches.

## Closure gate

C3 is `READY_TO_CLOSE`, not `CLOSED`.

It closes only after exact command `Merge #469`, merge without head drift and successful post-merge GitHub CI, Vercel Production, runtime and database cleanup verification.

C4 must not start before those checks pass.
