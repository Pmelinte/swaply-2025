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
| Train C | `ACTIVE` | C1 and C2 closed; C3 active. |
| C1 — Match agreement to Exchange handoff | `CLOSED` | Batch 60 closure and authenticated validation. |
| C2 — Canonical Exchange lifecycle | `CLOSED` | Batch 61.1–61.4, bilateral completion and authenticated race validation. |
| C3 — Feedback, notifications, reputation and ledger | `ACTIVE` | Batch 62.1 merged; Batch 62.2 implemented and Production-probed; PR/CI pending. |
| C4 — Cancellation, disputes, report and block | `PLANNED` | Starts after C3 closes. |
| C5 — Train C closure audit | `PLANNED` | Required before Train D. |
| Train D | `PLANNED` | Starts only after Train C closes. |
| Train E | `PLANNED` | Ends with `SWAPLY_V1_GA`; no Train F. |

## 4. Verified checkpoint

- Repository: `Pmelinte/swaply-2025`.
- Main head after Batch 62.1 merge: `9973c048bb042a348d963efa98522d2783ae42d7`.
- Production: `https://www.swaply.world`.
- Batch 62.1 PR: `#467`, merged.
- Active Batch 62.2 branch: `agent/batch-62-2-post-completion-effects`.
- No Batch 62.2 merge is authorized yet.

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
- first confirmation has zero completion side effects;
- second confirmation completes atomically;
- items become traded and inactive exactly once;
- linked conversation becomes completed exactly once;
- authenticated concurrency and cleanup evidence passed in Batch 61.4.

Detailed evidence:

- `docs/batch-61-2-single-transition-authority.md`;
- `docs/batch-61-4-authenticated-completion-validation.md`.

## 6. Batch 62.1 — Canonical Review Authority

Merged in PR `#467`.

Canonical contract:

- `public.reviews` is the only Exchange Review table;
- `submit_swap_review_v1(...)` is the only authenticated submission authority;
- reviewer derives from `auth.uid()`;
- reviewed user derives from the completed Swap;
- only participants may review;
- one immutable Review per participant and Swap;
- same-payload replay is idempotent;
- conflicting key or changed payload is rejected;
- direct browser writes are blocked;
- `respond_to_swap_review_v1(...)` permits only the reviewed participant to add the response;
- legacy `feedback` and `swap_feedback` writers are removed from the active flow.

Detailed evidence: `docs/batch-62-1-canonical-review-authority.md`.

## 7. Batch 62.2 — Exactly-Once Post-Completion Effects

Implemented on the active branch and applied to Production without historical backfill.

Canonical effects for each newly completed Exchange:

- private one-row registry `swap_post_completion_effects`;
- `+30` Swapleni for requester;
- `+30` Swapleni for responder;
- `user_tokens` remains ledger source of truth;
- `profiles.stats.tokens` remains the active balance cache;
- two deduplicated completion notifications;
- two deduplicated feedback-request notifications;
- `swaps_completed` and `stats.completedSwaps` increment once per participant;
- trust recalculates only for users touched by new canonical events;
- canonical Review insertion recalculates `rating`, `rating_count` and trust;
- `is_read` is canonical while the database synchronizes the legacy `read` field.

Structural C2 effects and C3 post-completion effects occur in the same database transaction. Any failure rolls back all of them together.

Production migrations:

- `20260715140012_batch_62_2_post_completion_effects`;
- `20260715140240_batch_62_2_trust_expression_fix`.

The first runtime rollback probe caught an invalid schema-qualified use of PostgreSQL `LEAST/GREATEST`. The probe rolled back completely. The follow-up migration corrected the function before the successful probes and the regression is pinned by a contract test.

Successful Production rollback evidence:

1. first confirmation produces no post-completion effects;
2. second confirmation completes;
3. one post-effect registry row;
4. two rewards totaling exactly `60`;
5. four notifications with four unique dedupe keys;
6. token caches and completion counters update once;
7. replay creates no duplicates;
8. `read/is_read` synchronization works both ways;
9. canonical Review updates rating and trust;
10. Review replay creates no second row.

Post-rollback state:

- zero post-effect rows;
- zero canonical completion notifications;
- zero recent canonical completion rewards;
- zero Reviews;
- zero notification read-state mismatches.

Detailed evidence: `docs/batch-62-2-post-completion-effects.md`.

## 8. C3 boundary

Still required before C3 can close:

- open and validate the Batch 62.2 draft PR;
- all GitHub CI checks green;
- Vercel Preview READY on the exact head;
- merge only on explicit command;
- verify GitHub CI, Vercel Production, runtime and database evidence after merge;
- Batch 62.3 authenticated E2E covering two participants, outsider, retry, concurrency, Realtime and cleanup;
- reconcile closure documentation.

C3 therefore remains `ACTIVE`.

## 9. Deliberate non-backfill policy

Historical seed/demo values are not globally recalculated.

In particular:

- historical completed Swaps do not receive new Batch 62.2 rewards or notifications;
- legacy `profiles.token_balance` and `profiles.lifetime_tokens` are not rewritten;
- only new canonical completion and Review events update the affected users;
- Review token rewards remain outside Batch 62.2.

## 10. Triage policy

- `FIX_NOW`: security, privacy, authorization, data integrity, blocked CI/build or broken canonical flow.
- `DEFER_TO_E5`: confirmed nonblocking cleanup or quality issue.
- `REVERIFY_AT_E5`: evidence gap without demonstrated failure.
- `POST_V1`: valid improvement outside v1 gates.

Current deferred items:

- `V1-DEBT-004`: auxiliary AI calls create nonfatal authenticated-E2E noise;
- `V1-DEBT-005`: a historical workflow display label remains stale although the executed graph is correct.

## 11. Exact next action

1. Open the Batch 62.2 PR as draft.
2. Run all repository CI and Vercel Preview checks on the exact final head.
3. Do not merge until Petru gives the exact command `Merge #...`.
