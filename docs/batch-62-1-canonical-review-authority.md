# Batch 62.1 — Canonical Review Authority

## Scope

Batch 62.1 consolidates completed-Exchange feedback into the existing `public.reviews` table.

It does not award Swapleni, create post-completion notifications or recalculate trust. Those exactly-once effects remain Batch 62.2.

## Canonical contract

`submit_swap_review_v1(...)` is the only authenticated Review submission authority.

The function:

- derives the reviewer from `auth.uid()`;
- locks and reads the canonical `swaps` row;
- requires `status = 'completed'`;
- accepts only requester or responder;
- derives the reviewed counterparty from the Swap;
- permits one Review per participant and Swap;
- supports same-payload replay;
- rejects conflicting key reuse or changed content;
- stores the result only in `reviews`.

`respond_to_swap_review_v1(uuid, text)` is the only authenticated response authority. It allows only `reviewed_id` to set the public response and the table trigger prevents mutation of immutable Review fields.

## Write protection

- public and authenticated users retain public Review read access;
- all historic browser table privileges are removed, including `TRUNCATE`, `TRIGGER` and `REFERENCES`;
- browser roles receive only `SELECT` on `reviews`;
- a null-safe write-authority trigger rejects direct Review inserts and updates when the authority marker is missing or incorrect;
- the submission and response RPCs are not executable by `anon`, `PUBLIC` or `service_role`;
- only `authenticated` can invoke the two public authorities.

## Application integration

- canonical endpoint: `POST /api/swaps/[id]/reviews`;
- current-user persistence check: `GET /api/swaps/[id]/reviews`;
- Review response: `POST /api/reviews/[id]/response`;
- `/api/reviews` remains a compatibility API but delegates submission to the same RPC;
- `/api/swaps/[id]/feedback` remains a compatibility adapter and delegates to the canonical endpoint;
- Exchange and Chat Review forms use the canonical API and restore submitted state after reload;
- the client no longer sends trusted reviewer/counterparty identifiers;
- unsupported direct multidimensional Review columns are no longer written.

## Removed parallel implementation

The following unsupported paths are removed:

- generic `feedback` writer;
- `swap_feedback` writer;
- the repository migration that would have created the unapplied parallel `swap_feedback` table.

## Production migrations

Applied and repository-aligned:

- `20260715122030_batch_62_1_review_schema`;
- `20260715122059_batch_62_1_review_write_guard`;
- `20260715122200_batch_62_1_review_submission_function`;
- `20260715122229_batch_62_1_review_submission_authenticated_grant`;
- `20260715122251_batch_62_1_review_submission_revoke_nonparticipants`;
- `20260715122311_batch_62_1_review_response_function`;
- `20260715122323_batch_62_1_review_response_authenticated_grant`;
- `20260715122333_batch_62_1_review_response_revoke_nonparticipants`;
- `20260715122354_batch_62_1_review_constraints`;
- `20260715122600_batch_62_1_review_table_grants_hardening`;
- `20260715122900_batch_62_1_review_authority_null_guard`.

## Production rollback probe

A completed-Exchange probe ran inside a transaction and ended with `ROLLBACK`.

Verified:

- direct Review insert denied;
- completed-Swap participant insert succeeds;
- reviewer and counterparty are derived correctly;
- same key and payload replay without a second row;
- conflicting key reuse rejected;
- outsider rejected;
- reviewed participant can add a response;
- reviewer cannot add the counterparty response;
- direct immutable-field update denied;
- an `accepted` Exchange cannot receive a Review.

Post-rollback cleanup:

- zero Reviews;
- zero probe Reviews;
- zero notifications;
- zero completion or Review token rows.

## Remaining validation gates

Before merge:

1. unit and migration contract tests;
2. lint and TypeScript;
3. Next.js build;
4. Public Visual Audit;
5. Vercel Preview runtime check.

No merge without Petru's explicit `Merge #...` command.
