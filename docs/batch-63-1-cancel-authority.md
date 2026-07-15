# Batch 63.1 — Canonical Cancel Authority

## Status

Implementation branch: `agent/batch-63-1-cancel-authority`.

This Batch does not merge or apply the migration to Production. It prepares the reviewed repository contract and a draft PR.

## Scope

Batch 63.1 makes cancellation a complete server-controlled command rather than a bare `swaps.status` change.

The canonical global status remains `cancelled`. Logistics detail states remain separate.

## Contract

### Allowed source states

- `pending`;
- `accepted`;
- `in_progress`.

Terminal states cannot be cancelled.

### Authorization

- a pending proposal may be withdrawn only by its requester;
- after acceptance, either participant may cancel;
- guests and outsiders are rejected;
- participant and item identity remain immutable.

### Compare-and-set and idempotency

`cancel_swap_v1` requires:

- immutable Swap ID;
- expected current status;
- reason;
- idempotency key.

The command locks the Swap row, rejects stale state and stores the response in the private `swap_cancel_requests` registry. Reusing the same actor/key/payload returns the stored response with `replayed=true`. Reusing the key for different input returns a conflict.

### Atomic effects

In one transaction the command:

1. transitions the Swap through the C2 writer to `cancelled`;
2. stores `cancel_reason`;
3. clears incomplete bilateral completion confirmations;
4. removes private completion confirmation rows;
5. reactivates only the two Swap items that are still `reserved` with `lock_reason='swap_active'`;
6. marks the linked active/agreed conversation as `cancelled`;
7. increments `swaps_cancelled` only for the cancelling actor and only after the proposal had been accepted;
8. recalculates trust only when that counter changes;
9. writes two deduplicated participant notifications;
10. writes an immutable cancellation effect row and audit event.

No Swapleni, Reviews, completion rewards or Story effects are created.

## Authority boundary

The generic transition endpoint rejects `toStatus=cancelled`.

The database transition trigger also requires the transaction-local `cancel_swap_v1` authority marker before accepting a transition to `cancelled`. This protects direct authenticated writes and generic transition RPC callers.

## Repository files

- `supabase/migrations/20260715190000_batch_63_1_cancel_authority.sql`;
- `src/lib/swaps/cancelPolicy.ts`;
- `src/lib/swaps/cancelService.ts`;
- `src/app/api/swaps/[id]/cancel/route.ts`;
- `src/app/api/swaps/transition/route.ts`;
- focused Vitest policy, adapter and migration-contract tests.

## Validation gates

Before merge:

- typecheck;
- lint;
- unit and migration-contract tests;
- build;
- migration review against the current Production schema;
- authenticated Preview tests for participant, outsider, stale state, replay and concurrent cancellation;
- verification that only Swap-owned locks are cleared;
- verification of zero reward/Review side effects;
- immutable-ID cleanup.

After an explicit merge command only:

- apply the new migration in Production;
- verify migration parity;
- verify GitHub CI and Vercel Production;
- run the authenticated Production cancellation probes;
- verify runtime logs and cleanup.
