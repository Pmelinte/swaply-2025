# Batch 63.2 — Canonical Dispute Authority

## Status

Implementation branch: `agent/batch-63-2-dispute-authority`.

This Batch does not merge and does not apply its migrations to Supabase Production. It prepares the reviewed repository contract and a draft PR.

## Audit finding

The repository contained a historical dispute migration and three legacy API routes, but the canonical `disputes` and `dispute_evidence` tables were absent from Production migration history and from the Production schema.

The legacy write flow was not atomic:

- it used `service_role` from application routes;
- it created a dispute separately from the Swap transition;
- it treated notifications and status changes as best effort;
- it allowed client fallbacks to write `swaps.dispute` directly;
- dispute resolution attempted to transition the global Swap to a non-canonical `resolved` status.

Batch 63.2 removes those parallel write paths.

## Canonical state model

The global Swap may enter terminal status `disputed` only from:

- `accepted`;
- `in_progress`.

Dispute investigation states and outcomes remain local to `public.disputes`:

- `open`;
- `waiting_evidence`;
- `under_review`;
- `resolved_requester`;
- `resolved_responder`;
- `resolved_split`;
- `rejected`.

Resolution does not invent a global `resolved` Swap status. The Swap remains terminal `disputed` as the immutable lifecycle record.

## Canonical storage

### `public.disputes`

One canonical dispute row per Swap. The row records derived participants, the source Swap state, reason, description, investigation state and resolution.

### `public.dispute_evidence`

Participant evidence attached to the canonical dispute.

### Private effect registries

- `public.swap_dispute_requests` — actor-scoped idempotency for open, evidence and resolution commands;
- `public.swap_dispute_effects` — exactly-once opening effects;
- `public.swap_dispute_resolution_effects` — exactly-once resolution, cleanup and trust effects.

Browser roles may read participant-authorized dispute data through RLS, but cannot write the canonical tables directly.

## Commands

### `open_swap_dispute_v1`

Participant-only command with:

- expected-state compare-and-set;
- row locking;
- canonical reason and description validation;
- up to ten initial evidence entries;
- actor-scoped idempotency;
- one canonical dispute per Swap.

Atomic effects:

1. insert the dispute and initial evidence;
2. transition through the C2 writer to global `disputed`;
3. write the compatibility snapshot to `swaps.dispute`;
4. clear incomplete bilateral completion confirmation state;
5. keep the two Swap items frozen;
6. send two deduplicated participant notifications;
7. write immutable opening effects and audit events.

No Swapleni, Review, Story or completion effects are created.

### `add_swap_dispute_evidence_v1`

Either participant may append validated evidence while the dispute is `open` or `waiting_evidence`.

The command is idempotent, updates the compatibility snapshot, notifies the other participant once and writes an audit event. Direct evidence writes are blocked.

### `resolve_swap_dispute_v1`

Only a profile with role `admin` or `moderator` may resolve a dispute.

Supported outcomes:

- `resolved_requester` — respondent receives one dispute penalty;
- `resolved_responder` — initiator receives one dispute penalty;
- `resolved_split` — no participant penalty;
- `rejected` — initiator receives one dispute penalty.

Atomic resolution effects:

1. set the dispute-local outcome and resolution metadata;
2. update the compatibility snapshot while the Swap remains `disputed`;
3. reactivate only the two referenced items still reserved with `lock_reason='swap_active'`;
4. close the linked active/agreed conversation;
5. increment `swaps_disputed` only for the penalized participant;
6. recalculate that participant's trust once;
7. send two deduplicated notifications;
8. store one resolution effect row and audit event.

## Authority boundary

The generic transition API rejects `toStatus=disputed`.

The database status guard also requires the transaction-local `open_swap_dispute_v1` authority marker. Direct authenticated updates, generic transition RPC calls and service-role application fallbacks cannot create a disputed Swap without the canonical dispute row and effects.

Direct writes to:

- `disputes`;
- `dispute_evidence`;
- `swaps.dispute`;

are protected by authority triggers.

## Repository files

- `supabase/migrations/20260715214500_batch_63_2_dispute_foundation.sql`;
- `supabase/migrations/20260715214600_batch_63_2_dispute_open_authority.sql`;
- `supabase/migrations/20260715214700_batch_63_2_dispute_evidence_authority.sql`;
- `supabase/migrations/20260715214800_batch_63_2_dispute_resolution_authority.sql`;
- `src/lib/swaps/disputePolicy.ts`;
- `src/lib/swaps/disputeService.ts`;
- canonical dispute API adapters;
- client fallback removal;
- focused policy, adapter and migration-contract tests.

## Validation gates

Before merge:

- lint and TypeScript;
- unit and migration-contract tests;
- production build;
- migration review against the current Production schema;
- authenticated tests for both participants, outsider, stale state, replay, changed-payload conflict and concurrent opening;
- evidence participant and closed-state checks;
- admin/moderator resolution and non-admin denial;
- verification that items remain frozen while open and only referenced locks clear at resolution;
- exact penalty and trust verification for each outcome;
- zero reward, Review and Story effects;
- immutable-ID cleanup.

After an explicit merge command only:

- apply the new migrations to Supabase Production;
- verify migration parity;
- verify GitHub CI and Vercel Production;
- run authenticated Production probes;
- inspect runtime logs and verify complete cleanup.
