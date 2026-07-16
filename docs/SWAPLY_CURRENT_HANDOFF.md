# Swaply — Current Project Handoff

**Last updated:** 2026-07-16

## Status

- Train A: `CLOSED`.
- Train B: `CLOSED`.
- Train C: `ACTIVE`.
- C1: `CLOSED`.
- C2: `CLOSED`.
- C3: `CLOSED`.
- C4: `AUTHENTICATED PASS — CLOSURE PR PENDING`.
- C5: `PLANNED` as the final Train C closure gate.
- Train E is terminal for v1; there is no Train F.

C4 sequence:

- Batch 63.1 — canonical cancel authority: `CLOSED`;
- Batch 63.2 — canonical dispute authority: `CLOSED`;
- Batch 63.3 — canonical report/block authority: `CLOSED`;
- Batch 63.4 — authenticated C4 integration closure: `PASS`, awaiting closure CI/Preview and explicit merge.

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
- Current `main`: `44d20dbac30d2ce481d99a8510abb218afe39811`.
- Production: `https://www.swaply.world`.
- PR `#470`: merged; Batch 63.1 closed.
- PR `#471`: merged; Batch 63.2 closed.
- PR `#472`: merged; Batch 63.3 closed.
- Active branch: `agent/batch-63-4-c4-integration-closure`.
- Batch 63.4 introduces no database migration or new product behavior; it adds regression evidence and reconciles closure documentation.
- Supabase Production includes:
  - `20260715182419_batch_63_1_cancel_authority`;
  - four Batch 63.2 dispute migrations;
  - the Batch 63.3 legacy bridge and foundation;
  - split report submit and resolution authorities;
  - block authority, response hardening and cleanup guard;
  - moderation action compatibility;
  - post-audit `GREATEST` and `LEAST/GREATEST` fixes;
  - terminal-effect foreign-key indexes.
- Batch 63.4 authenticated Production integration audit: `PASS`.
- All Batch 63.4 reports, disputes, effects, deterministic fixtures, worker functions and cron artifacts: cleaned.
- Audited Production deployment: `dpl_A7Cb8NXFNKeLfKnw8qwGT2NiHnei`, commit `44d20dbac30d2ce481d99a8510abb218afe39811`, state `READY`.
- `/en/exchange`: HTTP `200`; inspected runtime `error`, `warning` and `fatal`: none.

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

`public.reports` and `public.blocked_users` are the sole public safety sources. Canonical report submission is authenticated, validated, rate-limited and side-effect free before moderation. Moderator resolution is atomic. Block/unblock is authenticated, private and idempotent, prevents future bilateral contact and preserves existing evidence and history.

Production evidence:

- all logical Batch 63.3 migrations applied; the long report authority was operationally split into submit and resolution units;
- two SQL qualification defects found by real authenticated probes were repaired only through new follow-up migrations;
- raw user/item report, self-target, own-item, missing target, duplicate, replay, conflict, RLS and direct-write probes: `PASS`;
- ten-per-24h rate limit and eleventh rejection: `PASS`;
- investigate, dismiss, warn, hide-item and seven-day suspension outcomes: `PASS`;
- stale status, terminal replay and exactly-once effects: `PASS`;
- bilateral block/unblock barriers for interests, conversations, messages and Swaps: `PASS`;
- pre-existing history readable after block: `PASS`;
- two-session same-key pg_cron concurrency: `PASS` with one block row, one request and one audit event;
- zero Swapleni, Review, Story, notification and trust side effects outside the explicit confirmed moderation outcome: `PASS`;
- immutable-ID and profile restoration cleanup: `PASS`;
- security/performance advisors reviewed; three new FK index findings remediated;
- PR `#472` merged at `44d20dbac30d2ce481d99a8510abb218afe39811`.

Evidence: `docs/batch-63-3-report-block-authority.md`.

### Batch 63.4 — integration closure

Authenticated Production integration proved that the three C4 authorities coexist without contradictory terminal states or suppressed safety rights.

Verified:

- cancellation and dispute are mutually exclusive terminal branches;
- dispute after cancellation and cancellation after dispute are rejected with stale-state SQLSTATE `40001`;
- block prevents new interests, conversations, messages and Swaps but does not prevent cancellation of an existing Swap;
- block does not prevent dispute opening, evidence append or moderator resolution;
- historical messages remain stored;
- raw reports do not transition Swaps, block users, alter trust, increment counters, suspend users, notify targets, award Swapleni or create Reviews;
- a real same-second cancel-versus-dispute race produced one winner, one terminal branch and no mixed effects;
- exact Production cleanup restored borrowed E2E items, profiles, triggers, cron state and all C4 registries;
- security and performance advisors showed no C4 correctness blocker;
- Vercel Production remained `READY`, `/en/exchange` returned `200`, and runtime error/warning/fatal inspection was empty.

Evidence: `docs/batch-63-4-c4-integration-closure.md`.

## Current closure gate

C4 has passed the authenticated Production integration audit. It becomes formally `CLOSED` only after the Batch 63.4 closure branch passes:

- Unit Tests, including `c4IntegrationClosure.test.ts`;
- lint and TypeScript;
- Next.js Production Build;
- Public Visual Audit;
- Vercel Preview and runtime-log inspection;
- explicit `Merge #...` authorization.

After Batch 63.4 is merged, the next mandatory deliverable is **C5 — final Train C closure audit**. Train C remains `ACTIVE` until C5 is passed and explicitly merged.
