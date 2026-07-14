# Batch 61.2 — Single Server Write Authority, CAS and idempotency

**Train:** C  
**Deliverable:** C2 — Canonical Exchange lifecycle  
**Status:** implemented and Production-validated on PR #462; merge pending  
**Base checkpoint:** `95837cbd94b22f0264a83b3e4f1ad87411660c0b`

## 1. Objective

Batch 61.2 establishes one database authority for every global
`swaps.status` transition after the vocabulary fixed by Batch 61.1.

The contract provides:

- authenticated participant authorization;
- role-aware pending decisions;
- expected-status compare-and-set;
- row locking;
- idempotent retries;
- one transactional status write plus `swap_events` audit record;
- the same internal primitive for automatic expiry;
- no dependency on the absent `swap_bundles` table.

## 2. Canonical write path

Public authenticated entry point:

```text
transition_swap_v1(
  swap_id,
  expected_status,
  to_status,
  idempotency_key
)
```

Non-public internal primitive:

```text
apply_swap_transition_v1(...)
```

The primitive locks the row using `FOR UPDATE`, verifies the expected state,
authorizes the actor and role, validates the transition matrix, updates the
status and inserts one audit event in the same transaction.

Only `authenticated` may execute the public RPC. The internal primitive has no
execute grant for `anon`, `authenticated` or `service_role`.

## 3. CAS and stale state

Every canonical request carries `expected_status`.

If another request has already changed the row, the stale request receives
SQLSTATE `40001`; the API maps this to HTTP `409`. The row lock serializes
competing writers and the expected-state recheck allows only the first valid
transition to succeed.

A true two-session SQL probe is not available in the connected Production
extension set. The row-lock contract is pinned in migration tests, while stale
state was exercised against Production through a rollback probe.

## 4. Idempotency

`swap_transition_requests` is a private RLS-enabled registry keyed by:

```text
(actor_id, idempotency_key)
```

It stores the Swap ID, expected status, target status and first successful
response.

- same actor + same key + same request returns `replayed = true`;
- replay produces no second status event;
- the same key used for a different transition is rejected with SQLSTATE
  `22023`;
- cleanup cascades from the immutable Swap ID.

No direct table access is granted to `anon` or `authenticated`.

## 5. Authorization contract

- only the responder may perform `pending → accepted`;
- only the responder may perform `pending → rejected`;
- only the requester may perform `pending → cancelled`;
- expiry is system-only;
- outsiders are rejected;
- requester, responder and item identity become immutable after Swap creation.

Bilateral completion is deliberately not claimed here. It belongs to Batch
61.3.

## 6. Compatibility bridge

Legacy authenticated clients that still issue a direct status update are
intercepted by the transition trigger and routed through the same internal
primitive. The outer write is suppressed, preventing a double write.

Direct privileged writes without an authenticated actor are rejected.

The bridge is temporary and must be removed after all clients use
`transition_swap_v1` directly.

## 7. Marker hardening

The first rollback probe found that the transaction-local authority marker
remained set after a successful RPC. A later direct write in the same
transaction could therefore inherit the marker.

Migration `20260714202251` resets the marker immediately after the protected
UPDATE and before the audit insert. The complete probe was repeated afterward
and the privileged bypass was rejected.

## 8. Parallel migration reconciliation

While PR #462 was under validation, a parallel branch applied migration
`20260714202043_batch_61_2_swap_transition_authority` to Production.

It introduced a second, disabled transition guard and a service-role function
that targeted a different idempotency schema and the absent `swap_bundles`
table.

Migration `20260714202934` removed the redundant authority and config table,
while explicitly preserving the useful identity-immutability trigger and the
safe `pending` proposal-entry policy.

The repository contains a safe historical marker for version `20260714202043`;
a fresh database does not recreate the transient unsafe authority and reaches
the same final schema through the reconciliation migration.

## 9. API and adapters

`/api/swaps/transition` now:

- authenticates with the user's bearer token;
- does not perform service-role status writes;
- accepts `expectedStatus` and `Idempotency-Key`;
- calls the shared RPC adapter;
- maps stale state to HTTP `409`;
- returns `replayed` and the effective key.

Decision, completion compatibility and Exchange adapters no longer write
`swaps.status` directly.

## 10. Production migration versions

- `20260714201653_batch_61_2_single_swap_transition_authority`
- `20260714201719_batch_61_2_transition_guard_bridge`
- `20260714202043_batch_61_2_swap_transition_authority` — reconciled historical marker
- `20260714202251_batch_61_2_authority_marker_reset_hardening`
- `20260714202934_batch_61_2_parallel_authority_reconciliation`

## 11. Production rollback-probe evidence

The final probe passed:

1. canonical responder `pending → accepted`;
2. same-key replay with one status event;
3. idempotency-key conflict rejected;
4. stale expected state rejected;
5. requester cannot accept;
6. responder can reject;
7. outsider denied;
8. privileged direct bypass denied;
9. legacy authenticated write routed through the same authority;
10. requester can cancel pending;
11. expected idempotency registry cardinality.

The probe ran inside one transaction and ended with `ROLLBACK`.

Final Production state:

- Swap rows: `401`;
- invalid status rows: `0`;
- transition-request test rows: `0`;
- parallel config table: absent;
- parallel transition function: absent;
- canonical public and internal functions: present;
- triggers retained: canonical status guard and identity immutability.

## 12. Deliberate exclusions

Batch 61.2 does not implement:

- bilateral delivery or receipt confirmation;
- completion only after both participants confirm;
- exactly-once item, conversation, notification, reputation or token effects;
- canonical logistics lifecycle and Realtime;
- full dispute resolution;
- feedback hardening.

These remain Batch 61.3, Batch 61.4 and C3/C4 work.

## 13. Exit state

After PR #462 is merged and Production deployment is verified:

- Batch 61.1 remains closed;
- Batch 61.2 closes;
- C2 remains active;
- next fixed step: Batch 61.3 — Bilateral Completion.
