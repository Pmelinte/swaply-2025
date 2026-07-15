# Swaply — Current Project Handoff

**Last updated:** 2026-07-15

## Program status

- Train A: `CLOSED`.
- Train B: `CLOSED`.
- Train C: `ACTIVE`.
- C1: `CLOSED`.
- C2: `CLOSED`.
- C3: `READY_TO_CLOSE` on draft PR `#469`.
- C4 and C5: `PLANNED`.
- Train E is terminal for v1; there is no Train F.

## Permanent rules

- Swaply remains global-first across Objects, Properties, Services and Events.
- Global navigation and contextual drawers remain separate.
- Blog and Stories remain separate.
- Swapleni and trust rank remain separate.
- AI is advisory and requires fallback.
- Private data stays protected.
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

## C2 contract

- one canonical Swap transition authority;
- expected-state CAS and row lock;
- participant authorization;
- private idempotency registry;
- immutable participant and item identity;
- bilateral completion;
- first confirmation has zero completion effects;
- second confirmation completes atomically;
- items and linked conversation complete exactly once.

Evidence:

- `docs/batch-61-2-single-transition-authority.md`;
- `docs/batch-61-4-authenticated-completion-validation.md`.

## C3 contract

### Batch 62.1

- one canonical Review table and authenticated authority;
- reviewer and reviewed participant derived canonically;
- one immutable Review per participant and Swap;
- idempotent same-payload replay;
- direct browser writes blocked;
- reviewed participant controls the response.

Evidence: `docs/batch-62-1-canonical-review-authority.md`.

### Batch 62.2

For each new canonical completion:

- one private post-completion registry row;
- `+30` Swapleni per participant;
- four deduplicated completion/feedback notifications;
- completion counters and trust update once;
- Review insertion recalculates rating and trust;
- `is_read` is canonical and legacy `read` stays synchronized;
- structural and C3 effects share one transaction;
- no historical backfill.

Evidence: `docs/batch-62-2-post-completion-effects.md`.

### Batch 62.3

Validated guarantees:

- notifications published to Supabase Realtime;
- dedicated lossless and deduplicated UI channel;
- deterministic reusable-session refresh;
- changed-payload Review idempotency conflict returns HTTP `409`;
- guarded cleanup restricted to private E2E participants;
- cardinality validation and profile-cache restoration.

Production migrations:

- `20260715144457_batch_62_3_authenticated_e2e_cleanup`;
- `20260715145929_batch_62_3_notifications_realtime`;
- `20260715155017_batch_62_3_review_conflict_status`.

Evidence: `docs/batch-62-3-authenticated-c3-closure.md`.

## Final validation

- Authenticated Actions run `#73`, ID `29429892042`: `SUCCESS`.
- CI run `#1017`, ID `29429886622`: Unit Tests, Lint & Type Check, Build and Public Visual Audit succeeded.
- Vercel deployment `dpl_6BGpfYuMweBEBgQvQxkAMDgjF9RY`: `READY`.
- `/en/exchange` and `/en/messages`: HTTP `200`.
- No inspected Preview runtime errors, warnings or fatal events.
- Production cleanup: zero test Swaps, effects, notifications, rewards, Reviews and read-state mismatches.

## Closure gate

C3 is `READY_TO_CLOSE`, not `CLOSED`.

It closes only after exact command `Merge #469`, merge without head drift and successful post-merge GitHub CI, Vercel Production, runtime and database cleanup verification.

C4 must not start before those checks pass.
