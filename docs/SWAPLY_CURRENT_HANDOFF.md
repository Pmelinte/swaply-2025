# Swaply — Current Project Handoff

**Repository path:** `docs/SWAPLY_CURRENT_HANDOFF.md`  
**Last updated:** 2026-07-15  
**Purpose:** latest verified operational checkpoint and next Train C action.

## 1. Source-of-truth order

1. Current code, migrations, tests and Production evidence.
2. This handoff.
3. `docs/ROADMAP_TO_V1.md`.
4. `docs/SWAPLY_PRODUCT_MEMORY.md`.
5. Current technical contracts reconciled with migrations.
6. Closure reports and historical batch notes.
7. Older chat summaries.

## 2. Permanent rules

- Swaply remains global-first across Objects, Properties, Services and Events.
- Global navigation and contextual drawers remain separate.
- Blog and Stories remain separate.
- Swapleni and trust rank remain separate; rank cannot be bought.
- AI is advisory and every AI flow needs a fallback.
- Private data stays protected and exact location is disclosed only after consent.
- Use small reviewable batches.
- Merge only after Petru gives the exact `Merge #...` command.
- After merge verify GitHub CI, Vercel Production and relevant runtime/database evidence.

## 3. Program status

| Train / deliverable | Status | Evidence / next gate |
|---|---|---|
| Train A | `CLOSED` | Batch 40 closure report. |
| Train B | `CLOSED` | Batch 47 closure report. |
| Train C | `ACTIVE` | C1 and C2 closed; C3 ready to close; C4 and C5 remain. |
| C1 — Match agreement to Exchange handoff | `CLOSED` | Batch 60 closure and authenticated validation. |
| C2 — Canonical Exchange lifecycle | `CLOSED` | Batch 61.1–61.4 and authenticated bilateral completion. |
| C3 — Feedback, notifications, reputation and ledger | `READY_TO_CLOSE` | Batches 62.1 and 62.2 merged; Batch 62.3 validated on PR #469, merge pending. |
| C4 — Cancellation, disputes, report and block | `PLANNED` | Starts only after C3 closes. |
| C5 — Train C closure audit | `PLANNED` | Required before Train D. |
| Train D | `PLANNED` | Starts only after Train C closes. |
| Train E | `PLANNED` | Ends with `SWAPLY_V1_GA`; no Train F. |

## 4. Verified checkpoint

- Repository: `Pmelinte/swaply-2025`.
- Current `main`: `aa434594039b7bcb443b03848f3d5a76b6d26fff`.
- Production: `https://www.swaply.world`.
- Batch 62.1 PR `#467`: merged.
- Batch 62.2 PR `#468`: merged.
- Batch 62.3 PR `#469`: `OPEN / DRAFT`, not merged.
- Active branch: `agent/batch-62-3-authenticated-c3-closure`.
- Last fully validated code head before documentation-only commits: `c7f0ff9497faea4f515325155978d500d4c53898`.
- No PR #469 merge is authorized yet.

## 5. Closed C2 contract

Global `swaps.status` vocabulary:

`pending → accepted → in_progress → completed`

Controlled exceptional or terminal branches:

- `rejected`;
- `cancelled`;
- `expired`;
- `disputed`.

C2 guarantees:

- one canonical transition authority;
- row lock and expected-state CAS;
- participant authorization;
- private idempotency registry;
- immutable participant and item identity;
- bilateral completion confirmation;
- first confirmation has zero completion effects;
- second confirmation completes atomically;
- items become traded and inactive exactly once;
- linked conversation becomes completed exactly once;
- authenticated concurrency and cleanup evidence passed.

Detailed evidence:

- `docs/batch-61-2-single-transition-authority.md`;
- `docs/batch-61-4-authenticated-completion-validation.md`.

## 6. C3 canonical contract

### Batch 62.1 — Canonical Review Authority

Merged in PR `#467`.

- `public.reviews` is the only Exchange Review table;
- `submit_swap_review_v1(...)` is the only authenticated submission authority;
- reviewer derives from `auth.uid()`;
- reviewed user derives from the completed Swap;
- only participants may review;
- one immutable Review per participant and Swap;
- same-payload replay is idempotent;
- conflicting key or changed payload is rejected;
- direct browser writes are blocked;
- only the reviewed participant may add the response;
- legacy `feedback` and `swap_feedback` writers are removed from the active flow.

Detailed evidence: `docs/batch-62-1-canonical-review-authority.md`.

### Batch 62.2 — Exactly-Once Post-Completion Effects

Merged in PR `#468`.

For each newly completed canonical Exchange:

- one private `swap_post_completion_effects` row;
- requester receives `+30` Swapleni;
- responder receives `+30` Swapleni;
- `user_tokens` is the ledger source of truth;
- `profiles.stats.tokens` is the active balance cache;
- two completion notifications and two feedback-request notifications;
- deterministic dedupe keys;
- `swaps_completed` and `stats.completedSwaps` increment once per participant;
- trust recalculates only for affected users;
- a new canonical Review recalculates rating and trust;
- `is_read` is canonical while legacy `read` remains synchronized;
- structural and C3 effects commit or roll back in the same transaction;
- historical completed Swaps are not backfilled.

Detailed evidence: `docs/batch-62-2-post-completion-effects.md`.

### Batch 62.3 — Authenticated C3 Closure

Validated on PR `#469`.

Additional fixes and guarantees:

- `public.notifications` is published to Supabase Realtime;
- the visible notification UI uses a dedicated channel topic;
- Realtime INSERT and UPDATE events are deduplicated by row ID;
- a reconciliation fetch after `SUBSCRIBED` prevents event loss during channel join;
- canonical notification body is displayed instead of repeating the title;
- expired reusable E2E sessions are refreshed deterministically;
- changed-payload Review idempotency conflicts return HTTP `409`;
- guarded cleanup is restricted to privately registered E2E participants;
- cleanup validates cardinality and restores affected profile caches.

Production migrations:

- `20260715144457_batch_62_3_authenticated_e2e_cleanup`;
- `20260715145929_batch_62_3_notifications_realtime`;
- `20260715155017_batch_62_3_review_conflict_status`.

Detailed evidence: `docs/batch-62-3-authenticated-c3-closure.md`.

## 7. Final Batch 62.3 evidence

Authenticated GitHub Actions:

- run `#73`, ID `29429892042`;
- exact tested code head `c7f0ff9497faea4f515325155978d500d4c53898`;
- result `SUCCESS`.

Repository CI:

- run `#1017`, ID `29429886622`;
- Unit Tests, Lint & Type Check, Build and Public Visual Audit passed on the same code head.

Vercel Preview:

- deployment `dpl_6BGpfYuMweBEBgQvQxkAMDgjF9RY`;
- exact code head `c7f0ff9497faea4f515325155978d500d4c53898`;
- state `READY`;
- `/en/exchange` and `/en/messages`: HTTP `200`;
- no inspected `error`, `warning` or `fatal` runtime events.

Production cleanup after the successful run:

- test Swaps: `0`;
- completion and post-completion effects: `0`;
- test notifications: `0`;
- test rewards: `0`;
- test Reviews: `0`;
- notification `read/is_read` mismatches: `0`.

## 8. C3 closure boundary

C3 is `READY_TO_CLOSE`, not yet `CLOSED`.

C3 becomes `CLOSED` only after:

1. Petru gives the exact command `Merge #469`;
2. the PR is merged without head drift;
3. GitHub CI and Vercel Production are verified on the merged commit;
4. Production runtime and database cleanup remain green.

C4 must not start before those checks pass.

## 9. Deliberate non-backfill policy

- historical completed Swaps do not receive Batch 62.2 rewards or notifications;
- legacy `profiles.token_balance` and `profiles.lifetime_tokens` are not globally rewritten;
- only new canonical completion and Review events update affected users;
- Review token rewards remain outside this C3 contract.

## 10. Triage policy

- `FIX_NOW`: security, privacy, authorization, data integrity, blocked CI/build or broken canonical flow.
- `DEFER_TO_E5`: confirmed nonblocking cleanup or quality issue.
- `REVERIFY_AT_E5`: evidence gap without demonstrated failure.
- `POST_V1`: valid improvement outside v1 gates.

Current deferred items:

- `V1-DEBT-004`: auxiliary AI calls create nonfatal authenticated-E2E noise;
- `V1-DEBT-005`: a historical workflow display label remains stale although the executed graph is correct.

## 11. Exact next action

1. Verify the final documentation-only PR #469 head has green CI and a READY Preview.
2. Do not merge until Petru gives the exact command `Merge #469`.
3. After merge, verify GitHub CI, Vercel Production, runtime and database cleanup before marking C3 `CLOSED`.
