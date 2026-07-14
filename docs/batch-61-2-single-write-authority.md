# Batch 61.2 — Single Server Write Authority, CAS and Idempotency

**Train:** C  
**Deliverable:** C2 — single canonical server-side Exchange lifecycle  
**Scope:** one global status write authority, immutable participant roles, expected-state compare-and-swap and idempotent replay  
**Out of scope:** bilateral completion redesign, exactly-once completion rewards, dispute resolution outcomes and complete logistics/Realtime alignment

## Problem closed by this batch

Before Batch 61.2, several application paths could update `public.swaps.status` directly. The lifecycle graph existed, but the read–validate–write sequence was split across application code and therefore remained vulnerable to:

- concurrent updates based on the same stale status;
- duplicate retries producing duplicate audit or compatibility effects;
- browser writes bypassing the canonical API;
- service-role writes bypassing participant-role checks;
- participant IDs being replaced after creation under the previous broad update policy;
- new rows being inserted directly in a non-`pending` status.

## Canonical write boundary

The only database command that may change the global status is:

```text
public.transition_swap_status_authoritative(
  p_swap_id,
  p_actor_id,
  p_expected_status,
  p_to_status,
  p_idempotency_key
)
```

The function is `SECURITY DEFINER`, has an empty fixed `search_path`, and is executable only by `service_role`. The public API authenticates the caller and passes the verified user ID as `p_actor_id`.

Browser roles cannot execute the function directly.

## Atomic guarantees

One transaction performs all of the following:

1. validates the request and canonical statuses;
2. checks whether the same actor already used the same idempotency key;
3. locks the target swap row with `FOR UPDATE`;
4. derives the actor role as `requester` or `responder`;
5. compares the locked current status with `p_expected_status`;
6. validates the canonical transition graph;
7. updates the row with `WHERE status = p_expected_status`;
8. records the transition audit event;
9. stores the response in the idempotency ledger.

A retry with the same `(swap, actor, idempotency key)` returns the stored result and does not repeat the status write or transition audit event.

A competing command that expected the previous state returns `stale_state` and does not overwrite the winning transition.

## Outcome contract

| Outcome | API status | Meaning |
|---|---:|---|
| `applied` | 200 | First successful application |
| `replayed` | 200 | Same command retried; stored result returned |
| `stale_state` | 409 | Current status differs from `expectedStatus` |
| `idempotency_conflict` | 409 | Same key reused for a different command |
| `not_participant` | 403 | Verified user is not a swap participant |
| `not_found` | 404 | Swap does not exist |
| `invalid_transition` | 422 | Transition is outside the canonical graph |
| `invalid_request` | 400 | Invalid status or command fields |

## Direct-write and identity prevention

Batch 61.2 adds a `BEFORE UPDATE OF status` guard. A direct update is rejected unless it is executed inside the authoritative function's transaction context and strict enforcement has been activated.

A second guard freezes `requester_id`, `responder_id`, `offered_item_id` and `requested_item_id` after creation. The participant role used by the authority therefore cannot be rewritten by a browser, a stale application path or a service-role update.

The participant insert policy is narrowed: a requester may create a swap only with `status = 'pending'`.

The browser Supabase client contains a temporary compatibility firewall. Any remaining legacy PostgREST PATCH containing `swaps.status` is converted into a call to `/api/swaps/transition` with the current status as `expectedStatus`. Other fields from the same PATCH are written only after the authoritative transition succeeds.

The database guards remain the final protection for external clients, stale application code and service-role bypass attempts.

## Deployment sequence

The migration creates a service-role-only singleton configuration row with `enforced = false`. This permits a safe pre-merge installation:

1. apply the migration while the previous Production application is still active;
2. verify that the RPC, ledger, grants, identity guard and `pending` insert policy exist;
3. merge and deploy the application that uses the authoritative RPC;
4. verify the new Production deployment and public/runtime smoke tests;
5. update the internal configuration to `enforced = true`;
6. prove that direct status writes are rejected while the RPC remains functional.

The configuration table is inaccessible to `public`, `anon` and `authenticated`. Only `service_role` can activate or deactivate strict enforcement.

## Compatibility boundary

The temporary `accepted -> completed` transition remains available because Batch 61.3 owns the bilateral completion redesign.

Existing completion, notification and profile effects are not declared final by this batch. Where legacy compatibility effects remain, application code executes them only for `outcome = applied`, never for `replayed`.

Batch 61.3 must define the final bilateral command and exactly-once completion side effects.

## Exit gate

Batch 61.2 is complete only when:

- Unit Tests pass;
- Lint and Type Check pass;
- Build passes;
- Public Visual Audit passes;
- the Production migration is applied;
- Production grants expose the RPC and configuration only to `service_role`;
- the merge deployment is READY before strict enforcement is activated;
- strict enforcement is active and direct status writes are rejected;
- participant and item identity columns are immutable after creation;
- new participant-created swaps are restricted to `pending`;
- existing Production rows remain unchanged and valid;
- the idempotency ledger, CAS function and guards match the repository contract;
- no Production runtime regression is introduced.
