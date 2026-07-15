# Batch 62.2 — Exactly-Once Post-Completion Effects

## Scope

Batch 62.2 extends the canonical bilateral Exchange completion transaction with the C3 effects that Batch 61.3 deliberately excluded:

- `+30` Swapleni for each participant;
- deduplicated completion and feedback-request notifications;
- completed-Swap counters and touched-user trust recalculation;
- canonical Review aggregation into profile rating and trust;
- one canonical notification read state with legacy compatibility.

Historical completed Swaps are intentionally not backfilled.

## Canonical completion contract

The existing bilateral authority remains unchanged:

1. each participant confirms independently through `confirm_swap_completion_v1(...)`;
2. the first confirmation has no completion side effects;
3. the second confirmation enters `completed` through `apply_swap_transition_v1(...)`;
4. `apply_swap_completion_effects_v1(...)` performs structural and C3 effects inside the same transaction;
5. any failure rolls back status, item, conversation, reward, notification and reputation changes together.

`public.swap_post_completion_effects` is the private one-row-per-Swap registry for C3 post-completion effects. Browser roles have no direct access.

## Swapleni ledger

`public.user_tokens` remains the source of truth.

For each newly completed canonical Exchange:

- requester receives `+30` with reason `swap_completed` and `reference_id = swap_id`;
- responder receives `+30` with the same canonical reason and reference;
- the existing unique ledger index prevents a duplicate reward per participant and Swap;
- `profiles.stats.tokens` remains the active cached balance;
- `profiles.token_balance` and `profiles.lifetime_tokens` remain legacy and are not rewritten;
- a missing Profile now prevents the ledger insert, avoiding new orphan token rows.

No Review reward is introduced in this batch.

## Notifications

Completion creates four in-app notifications:

- one `swap_completed` notification for each participant;
- one `feedback_requested` notification for each participant.

Each row contains:

- `source_type = 'swap'`;
- `source_id = swap_id`;
- a deterministic `dedupe_key` protected by a unique partial index;
- structured `data` with the Swap identifier and event;
- translation keys for the UI, with an English fallback title/body for compatibility.

The UI resolves the new keys through the existing 43-language message catalog.

`is_read` is canonical. A database trigger synchronizes the historical `read` field in both directions so existing writers do not create contradictory unread state.

## Reputation

Only users touched by new canonical events are recalculated. Seed/demo profiles are not globally rewritten.

On completion:

- `profiles.swaps_completed` increments once for each participant;
- `profiles.stats.completedSwaps` increments once;
- `calculate_trust_score(...)` recalculates `trust_score`, `trust_level` and `stats.reputation`.

On canonical Review insertion:

- `rating` is recalculated from `public.reviews` for the reviewed user;
- `rating_count` is recalculated from the same canonical table;
- trust is recalculated after the aggregate update;
- same-payload Review replay does not insert another row and does not repeat the aggregate trigger.

Tokens and trust remain separate: Swapleni cannot buy or directly convert into trust rank.

## Production migrations

Applied and repository-aligned:

- `20260715140012_batch_62_2_post_completion_effects`;
- `20260715140240_batch_62_2_trust_expression_fix`.

The second migration records a critical issue caught by the first runtime rollback probe: PostgreSQL `LEAST` and `GREATEST` are expressions and cannot be schema-qualified as `pg_catalog` functions. The failed probe rolled back completely. The corrected function was applied before the successful probes and is pinned by a migration contract test.

## Production rollback evidence

All probes ran inside explicit transactions and ended with `ROLLBACK`.

Verified after the trust correction:

1. first participant confirmation does not complete the Exchange;
2. first confirmation creates no token, notification or post-effect row;
3. second participant confirmation completes the Exchange;
4. exactly one `swap_post_completion_effects` row is created;
5. exactly two `swap_completed` ledger rows are created;
6. the reward total is exactly `60`, or `+30` per participant;
7. exactly four notifications are created with four unique dedupe keys;
8. both active token caches increase by exactly `30`;
9. both completed-Swap counters increase exactly once;
10. completion replay reports replay and creates no duplicate reward or notification;
11. legacy `read = true` synchronizes canonical `is_read = true` and `read_at`;
12. canonical `is_read = false` synchronizes legacy `read = false` and clears `read_at`;
13. canonical Review insertion updates the reviewed profile to rating `5`, count `1` in the probe;
14. same-payload Review replay creates no second Review.

Post-rollback cleanup:

- zero `swap_post_completion_effects` rows;
- zero canonical completion notifications;
- zero recent canonical completion rewards;
- zero Reviews;
- zero `read/is_read` mismatches.

## Deliberate exclusions

- no historical completion backfill;
- no Review token reward;
- no rewrite of legacy `token_balance` or `lifetime_tokens`;
- no cancellation or dispute counters in this batch;
- no email or push delivery orchestration;
- no C3 closure declaration before Batch 62.3 authenticated E2E and cleanup evidence.

## Remaining validation gates

Before merge:

1. unit and migration contract tests;
2. lint and TypeScript;
3. Next.js build;
4. Public Visual Audit;
5. Vercel Preview runtime check.

No merge without Petru's explicit `Merge #...` command.
