# Batch 62.3 — Authenticated C3 Closure

## Status

`VALIDATED / READY_TO_CLOSE`

Batch 62.3 is implemented and validated on draft PR `#469`. C3 remains open until the PR is merged on Petru's explicit command and the merged Production deployment is verified.

## Authenticated contract

The two-user graph proves:

1. valid, distinct authenticated sessions;
2. guest and outsider denial;
3. one canonical Exchange from a confirmed Match agreement;
4. zero C3 effects after the first completion confirmation;
5. exactly-once completion under second-confirmation retry and concurrency;
6. canonical completed state for Exchange, items and conversation;
7. one post-completion registry row;
8. exactly `+30` Swapleni per participant;
9. four deduplicated completion/feedback notifications;
10. visible notification delivery without reload;
11. one completion-counter and trust update per participant;
12. concurrent canonical Reviews from both participants;
13. Review replay without duplication;
14. HTTP `409` for changed payload with a reused idempotency key;
15. response authority limited to the reviewed participant;
16. synchronized `is_read`, `read` and `read_at`;
17. immutable-ID cleanup and profile-cache restoration.

No historical completed Exchange was backfilled.

## Production migrations

- `20260715144457_batch_62_3_authenticated_e2e_cleanup`;
- `20260715145929_batch_62_3_notifications_realtime`;
- `20260715155017_batch_62_3_review_conflict_status`.

The private cleanup registry has RLS and no browser table access. Cleanup requires an authenticated participant, both privately registered E2E accounts and valid effect cardinality.

## Realtime and Review fixes

The closure audit found and repaired:

- missing Realtime publication for `public.notifications`;
- duplicate channel topics on the shared Supabase client;
- a fetch/join window that could lose visible events;
- notification body fallback that repeated the title;
- expired reusable E2E session handling;
- SQLSTATE `22023` for an idempotency conflict that semantically requires HTTP `409`.

The visible notification hook now uses `notifications-ui:{userId}`, handles INSERT and UPDATE, deduplicates by row ID and reconciles after `SUBSCRIBED`.

## Iterative evidence

- `#61`: missing notification Realtime publication;
- `#63`: client subscription conflict;
- `#66`: two-user baseline timing race;
- `#68`: expired reusable User B session;
- `#69`: 17 of 18 passed; duplicate title/message exposed;
- `#70`: idempotency conflict returned `400` instead of `409`;
- `#73`: complete authenticated graph passed.

## Final validation

Authenticated GitHub Actions:

- run `#73`, ID `29429892042`;
- tested code head `c7f0ff9497faea4f515325155978d500d4c53898`;
- result `SUCCESS`.

Repository CI:

- run `#1017`, ID `29429886622`;
- Unit Tests, Lint & Type Check, Build and Public Visual Audit: success.

Vercel Preview:

- deployment `dpl_6BGpfYuMweBEBgQvQxkAMDgjF9RY`;
- state `READY` on the same code head;
- `/en/exchange` and `/en/messages`: HTTP `200`;
- no inspected runtime errors, warnings or fatal events.

After automatic validation, the authenticated workflow was restored to normal manual dispatch. Later commits modify documentation and workflow trigger configuration, not the validated product/database contract.

## Final Production cleanup

- test Swaps: `0`;
- completion and post-completion effects: `0`;
- test notifications: `0`;
- test rewards: `0`;
- test Reviews: `0`;
- notification read-state mismatches: `0`.

## Closure gate

C3 is `READY_TO_CLOSE`, not `CLOSED`.

It closes only after exact command `Merge #469`, merge without head drift and successful post-merge GitHub CI, Vercel Production, runtime and database cleanup verification.
