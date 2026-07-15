# Batch 62.3 — Authenticated C3 Closure

## Status

`VALIDATED / READY_TO_CLOSE`

Batch 62.3 is implemented and validated on draft PR `#469`. C3 remains open until the PR is merged on Petru's explicit command and the merged Production deployment is verified.

## Scope and final contract

The authenticated two-user graph proves:

1. dedicated sessions are valid and distinct;
2. guest and outsider requests are denied;
3. one confirmed Match agreement creates one canonical Exchange;
4. the first completion confirmation has zero C3 effects;
5. the second confirmation, raced with retry, completes exactly once;
6. the Exchange, two items and linked conversation reach their canonical completed states;
7. one post-completion registry row is created;
8. each participant receives exactly `+30` Swapleni, with two ledger rows totaling `60`;
9. each participant receives one completion and one feedback-request notification, with four unique dedupe keys;
10. both users receive the visible notification state without reload;
11. completion counters and deterministic trust update once;
12. both participants submit canonical Reviews concurrently;
13. same-payload replay creates no second Review;
14. changed payload with a reused idempotency key returns HTTP `409`;
15. only the reviewed participant may add the Review response;
16. `is_read`, legacy `read` and `read_at` remain synchronized;
17. cleanup removes every fixture row by immutable Swap ID and restores profile caches.

No historical completed Exchange was backfilled.

## Production migrations

- `20260715144457_batch_62_3_authenticated_e2e_cleanup`
  - private E2E account registry;
  - RLS and no browser table access;
  - participant and allowlist guard;
  - exact cardinality validation;
  - immutable-ID cleanup and cache restoration.
- `20260715145929_batch_62_3_notifications_realtime`
  - publishes `public.notifications` to Supabase Realtime exactly once.
- `20260715155017_batch_62_3_review_conflict_status`
  - changed-payload idempotency conflicts use SQLSTATE `23505`, producing HTTP `409`;
  - authenticated-only Review submission ACL remains unchanged.

Repository migration files use the canonical Batch 62.3 names under `supabase/migrations/`.

## Realtime and UI repairs

The closure audit found that notifications were not published to Realtime and that two consumers used the same channel topic on the shared Supabase client.

The visible notification hook now:

- uses `notifications-ui:{userId}`;
- exposes explicit connection state;
- handles INSERT and UPDATE events;
- deduplicates by notification ID;
- reconciles after `SUBSCRIBED` so the fetch/join race cannot lose events;
- renders canonical body text instead of repeating the title as the message.

## Iterative evidence

The failed runs produced concrete fixes and completed cleanup:

- `#61`: notifications absent from Realtime publication;
- `#63`: UI subscription conflict remained;
- `#66`: two-user baseline timing race;
- `#68`: expired reusable User B session;
- `#69`: 17 of 18 tests passed; notification title was duplicated as message;
- `#70`: Review idempotency conflict returned `400` instead of `409`;
- `#73`: full authenticated graph passed.

## Final validation

Authenticated GitHub Actions:

- run `#73`, ID `29429892042`;
- exact tested head `c7f0ff9497faea4f515325155978d500d4c53898`;
- result `SUCCESS`.

Repository CI:

- run `#1017`, ID `29429886622`;
- Unit Tests, Lint & Type Check, Build and Public Visual Audit all passed on the same code head.

Vercel Preview:

- deployment `dpl_6BGpfYuMweBEBgQvQxkAMDgjF9RY`;
- exact source head `c7f0ff9497faea4f515325155978d500d4c53898`;
- state `READY`;
- `/en/exchange` and `/en/messages`: HTTP `200`;
- no inspected `error`, `warning` or `fatal` runtime events.

After the successful automatic PR validation, `.github/workflows/two-user-auth-e2e.yml` was restored to its normal `workflow_dispatch` entrypoint. The final post-validation commits change only documentation and workflow trigger configuration, not the validated product or database contract.

## Final Production cleanup

After run `#73`:

- test Swaps: `0`;
- completion and post-completion effect rows: `0`;
- canonical test notifications: `0`;
- completion rewards: `0`;
- canonical test Reviews: `0`;
- notification `read/is_read` mismatches: `0`.

## Closure gate

C3 is `READY_TO_CLOSE`, not yet `CLOSED`.

C3 closes only after:

1. exact command `Merge #469`;
2. merge without head drift;
3. post-merge GitHub CI and Vercel Production verification;
4. final Production runtime and database cleanup checks.

Until then PR `#469` remains open and draft, Train C remains active, and C4 does not start.
