# Swaply — Current Project Handoff

**Last updated:** 2026-07-16

## Status

- Train A: `CLOSED`.
- Train B: `CLOSED`.
- Train C: `CLOSED` after C5 cumulative audit and closure documentation.
- C1: `CLOSED`.
- C2: `CLOSED`.
- C3: `CLOSED`.
- C4: `CLOSED`.
- C5: `PASS — CLOSURE PR OPEN`.
- Milestone reached: `CLOSED_BETA_READY_OBJECTS_ONE_TO_ONE`.
- Train D: `PLANNED`; it starts only after the C5 closure PR passes CI/Preview and is explicitly merged.
- Train E is terminal for v1; there is no Train F.

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

## Current checkpoint

- Repository: `Pmelinte/swaply-2025`.
- Audited `main`: `67081c613d49f7c6605525c5d438d349b59b6247`.
- Production: `https://www.swaply.world`.
- Active closure branch: `agent/batch-64-c5-train-c-closure`.
- Batch 64 introduces no database migration and no new product behavior.
- Batch 64 adds the final Train C closure report and reconciles canonical status documentation.
- Train C closure report: `docs/TRAIN_C_CLOSURE_REPORT.md`.

## Train C summary

Train C delivered the real one-to-one exchange engine for Objects:

`Profile → Object → Wanted/Favorite → Express Interest → Match → Chat → Bilateral Agreement → Create Exchange → Logistics → Bilateral Completion → Review`

It also delivered controlled lifecycle branches for cancellation, dispute, report and block.

## C1 — Explicit Exchange handoff

C1 closed the Batch 60 sequence and demonstrated:

- zero Exchange before the explicit user action;
- exactly one Exchange after the explicit action;
- the same Exchange ID for both participants;
- retry without duplicates;
- bilateral agreement revision checks;
- consistent Match–conversation–Exchange links;
- zero unintended token, reputation, item or notification effects;
- immutable-ID cleanup.

Evidence: `docs/batch-60-4-validation-closure.md`.

## C2 — Canonical lifecycle

C2 established:

- one server-side transition authority;
- expected-state CAS and stale-state denial;
- participant-only mutation authority and outsider denial;
- immutable Swap identity;
- bilateral completion;
- exactly-once structural effects;
- controlled item locking and release;
- persistence and immutable-ID cleanup.

Evidence:

- `docs/batch-61-2-single-transition-authority.md`;
- `docs/batch-61-4-authenticated-completion-validation.md`.

## C3 — Feedback and post-completion effects

C3 delivered:

- one canonical Review authority;
- participant-only and immutable Reviews;
- controlled response by the reviewed participant;
- idempotent replay;
- `+30` Swapleni per participant after canonical completion;
- deduplicated notifications;
- exactly-once counters and trust recalculation;
- Realtime synchronization;
- authenticated two-user closure and cleanup.

Historical completed Swaps before the canonical cutover were intentionally not backfilled.

Evidence:

- `docs/batch-62-1-canonical-review-authority.md`;
- `docs/batch-62-2-post-completion-effects.md`;
- `docs/batch-62-3-authenticated-c3-closure.md`.

## C4 — Safety lifecycle

### Cancellation

Canonical cancellation is participant-only, atomic and exactly once. It validates expected status and reason, reactivates only the affected items, removes incomplete completion confirmations, closes the linked conversation, applies the allowed trust/counter effects and sends deduplicated notifications.

Evidence: `docs/batch-63-1-cancel-authority.md`.

### Disputes

Canonical dispute opening, evidence and moderator resolution are atomic and exactly once. The global Swap remains terminal `disputed`; local resolution outcomes do not rewrite that terminal state. Direct writes are blocked, locks are cleaned at resolution and only an explicitly responsible participant receives the defined trust consequence.

Evidence: `docs/batch-63-2-dispute-authority.md`.

### Reports and blocks

`public.reports` and `public.blocked_users` are the canonical safety sources. Report submission is authenticated, validated, rate-limited and side-effect free before moderation. Moderator resolution is atomic. Block/unblock is authenticated, private and idempotent, prevents future bilateral contact and preserves historical evidence.

Evidence: `docs/batch-63-3-report-block-authority.md`.

### Integration closure

Authenticated Production integration demonstrated:

- `cancelled` and `disputed` are mutually exclusive terminal branches;
- stale cross-branch attempts are rejected;
- block prevents new interests, conversations, messages and Swaps;
- block does not prevent cancellation, dispute, evidence or moderator resolution for an existing Swap;
- historical messages remain stored;
- raw reports do not transition Swaps, alter trust, increment counters, suspend users, block users, notify targets, award Swapleni or create Reviews;
- a real same-second cancel-versus-dispute race produced one winner and no mixed effects;
- exact cleanup restored fixtures, items, profiles, workers and cron state.

Evidence: `docs/batch-63-4-c4-integration-closure.md`.

## C5 — Final cumulative audit

C5 confirmed cumulatively:

- canonical repository head and merged C4 closure;
- required GitHub checks green on the audited head;
- Vercel Production `READY`;
- critical Production route HTTP `200`;
- no relevant Vercel runtime `error`, `warning` or `fatal` entries in the inspected window;
- Supabase Production `ACTIVE_HEALTHY`;
- complete Train C migration chain, including follow-up fixes and indexes;
- one canonical lifecycle and immutable identity;
- reload persistence and Realtime evidence;
- participant authorization and outsider denial;
- idempotency and stale-state rejection;
- real concurrent-session serialization;
- exactly-once Reviews, rewards, notifications and trust effects;
- zero orphan or duplicate canonical effects;
- zero self-blocks or duplicate block pairs;
- zero mixed cancelled/disputed terminal states;
- zero residual Batch 63 cron jobs or temporary workers;
- zero nonconforming canonical completions after cutover;
- immutable-ID cleanup and restoration.

Detailed evidence: `docs/TRAIN_C_CLOSURE_REPORT.md`.

## Train C closure verdict

- C5: `PASS`.
- Critical failures: `0`.
- Residual audit artifacts: `0`.
- Train C: `CLOSED` once this closure PR is explicitly merged.
- Milestone: `CLOSED_BETA_READY_OBJECTS_ONE_TO_ONE`.

## Next mandatory action

1. Let the Batch 64 closure PR run all required GitHub CI and Vercel Preview checks.
2. Do not merge automatically.
3. Merge only after Petru gives the exact command `Merge #...`.
4. After merge, verify GitHub CI, Vercel Production, runtime logs and the final repository checkpoint.
5. Then begin Train D with D1: global-first profile, languages/fallback, media and approximate location.
