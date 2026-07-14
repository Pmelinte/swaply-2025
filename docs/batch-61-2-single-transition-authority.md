# Batch 61.2 — Single Server Write Authority, CAS and idempotency

**Train:** C  
**Deliverable:** C2 — Canonical Exchange lifecycle  
**Status:** implemented on branch; Production validation required before closure  
**Base checkpoint:** `95837cbd94b22f0264a83b3e4f1ad87411660c0b`

## 1. Objective

Batch 61.2 establishes one database authority for every global `swaps.status`
transition after the canonical vocabulary from Batch 61.1.

The authority must provide:

- authenticated participant authorization;
- role-aware decisions for a pending proposal;
- compare-and-set against the expected status;
- row locking under concurrency;
- idempotent retries;
- one atomic status write plus `swap_events` audit record;
- the same primitive for automatic expiry;
- no dependency on tables absent from Production.

## 2. Canonical write path

The public authenticated entry point is:

```text
transition_swap_v1(
  swap_id,
  expected_status,
  to_status,
  idempotency_key
)
```

It delegates to the non-public internal primitive:

```text
apply_swap_transition_v1(...)
```

The internal primitive:

1. locks the Swap row with `FOR UPDATE`;
2. verifies `status = expected_status`;
3. verifies participant and role authorization;
4. verifies the Batch 61.1 transition matrix;
5. updates the global status;
6. inserts the `status_transition` event;
7. returns the updated row.

The update and audit event are in the same PostgreSQL transaction.

## 3. CAS and stale-state behavior

Every canonical call includes `expected_status`.

If another request changes the row first, the stale request receives SQLSTATE
`40001`. The API maps this to HTTP `409` instead of silently overwriting the
newer state.

This prevents two requests that both observed the same old state from applying
conflicting transitions.

## 4. Idempotency

`swap_transition_requests` is a private registry keyed by:

```text
(actor_id, idempotency_key)
```

The stored request includes the Swap ID, expected status, target status and the
first successful response.

A retry with the same actor, key and transition returns the stored response with
`replayed = true`. Reusing the key for a different request is rejected.

The table:

- has RLS enabled;
- grants no direct access to `anon` or `authenticated`;
- is accessed only inside the security-definer RPC;
- cascades with the Swap during immutable-ID cleanup.

## 5. Authorization contract in this batch

- only the responder may move `pending → accepted`;
- only the responder may move `pending → rejected`;
- only the requester may move `pending → cancelled`;
- expiry is system-only;
- other currently allowed participant transitions retain the Batch 61.1
  compatibility contract.

Bilateral completion is deliberately not claimed here. It belongs to Batch
61.3.

## 6. Compatibility bridge

Some legacy authenticated UI paths still issue direct updates to
`swaps.status`.

The final transition trigger intercepts such writes and routes them through
`apply_swap_transition_v1`. The original outer write is suppressed, so the row
is not written twice.

The bridge:

- preserves current UI behavior during the migration;
- still uses the same participant authorization, transition matrix and audit
  primitive;
- rejects direct privileged writes without an authenticated actor;
- is temporary and must be removed after all clients use the public RPC.

A temporary-table PostgreSQL probe verified the controlled nested-update and
outer-write suppression pattern before Production migration.

## 7. API and adapters

`/api/swaps/transition` now:

- authenticates with the user's bearer token;
- does not use service-role writes;
- accepts `expectedStatus` and `Idempotency-Key`;
- calls the shared RPC adapter;
- maps stale state to HTTP `409`;
- returns `replayed` and the effective idempotency key.

The decision and completion compatibility endpoints, plus the Exchange service
adapter, no longer write `swaps.status` directly.

## 8. Production audit finding

The previous transition endpoint attempted a best-effort update of
`swap_bundles`, but that table does not exist in Production.

Batch 61.2 removes that dependency. It does not create a speculative replacement
table. Bundle design remains outside this batch unless a later canonical
contract requires it.

## 9. Deliberate exclusions

Batch 61.2 does not close C2 and does not implement:

- bilateral delivery or receipt confirmation;
- safe automatic completion;
- exactly-once item, conversation, notification, reputation or token effects;
- canonical logistics lifecycle;
- full dispute resolution;
- feedback hardening.

Those remain Batch 61.3, Batch 61.4 and C3/C4 work.

## 10. Required validation

Before merge:

- unit tests, lint, typecheck and build;
- migration contract tests;
- Vercel Preview smoke and runtime inspection;
- Production migration parity after controlled application.

Authenticated closure evidence must include:

- requester/responder role checks;
- outsider denied;
- stale expected status rejected;
- two concurrent requests cannot both win;
- same-key retry replays the same result;
- different request with reused key is rejected;
- one status event per successful transition;
- direct privileged bypass denied;
- persistence after reload;
- cleanup by immutable IDs.

## 11. Exit state

When this batch is verified and merged:

- Batch 61.1 remains closed;
- Batch 61.2 is closed;
- C2 remains active;
- the next fixed step is Batch 61.3 — Bilateral Completion.
