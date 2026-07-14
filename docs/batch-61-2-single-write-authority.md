# Batch 61.2 — Single Server Write Authority, CAS and Idempotency

**Train:** C  
**Deliverable:** C2 — single canonical server-side Exchange lifecycle  
**Scope:** one global status writer, immutable participant roles, expected-state compare-and-swap and idempotent replay  
**Out of scope:** bilateral completion redesign, exactly-once completion rewards, dispute resolution outcomes and complete logistics/Realtime alignment

## Problem closed by this batch

Before Batch 61.2, several application paths could update `public.swaps.status` directly. The lifecycle graph existed, but the read–validate–write sequence was split across application code and therefore remained vulnerable to:

- concurrent updates based on the same stale status;
- duplicate retries producing duplicate audit or compatibility effects;
- browser writes bypassing the canonical API;
- service-role writes bypassing participant-role checks;
- participant IDs being replaced after creation under the previous broad update policy;
- new rows being inserted directly in a non-`pending` status.

## Single database writer

The only function that executes `UPDATE public.swaps SET status = ...` is:

```text
public.apply_swap_transition_v1(
  p_swap_id,
  p_expected_status,
  p_to_status,
  p_actor_id,
  p_source,
  p_idempotency_key
)
```

Every entrypoint delegates to this writer:

- `/api/swaps/transition` uses the service-role wrapper `transition_swap_status_authoritative`;
- the optional authenticated RPC `transition_swap_v1` delegates to the same wrapper;
- the temporary authenticated direct-update bridge delegates to the same wrapper;
- `expire_old_swaps` delegates system expiry to the same writer.

`apply_swap_transition_v1` is `SECURITY DEFINER`, uses a fixed empty `search_path`, and is not executable by `public`, `anon` or `authenticated`.

## Role rules

Participant membership alone is not enough for every transition:

- only the responder may perform `pending -> accepted`;
- only the responder may perform `pending -> rejected`;
- only the requester may perform `pending -> cancelled`;
- only the system expiry path may perform `pending -> expired`;
- both participants may use the canonical allowed transitions after acceptance.

The service API wrapper returns `not_authorized` when a real participant attempts a transition reserved for the other role.

## Atomic and idempotent guarantees

The service wrapper performs the following in one transaction:

1. validates command fields and the idempotency key;
2. acquires a transaction advisory lock for `(actor, idempotency key)`;
3. returns the stored response when the command is a replay;
4. locks the target swap row with `FOR UPDATE`;
5. compares the locked status with `expectedStatus`;
6. delegates the actual write to `apply_swap_transition_v1`;
7. stores the successful response in the service-only ledger.

The writer independently:

- derives the actor role as `requester`, `responder` or `system`;
- validates role restrictions and the canonical transition graph;
- updates with `WHERE status = p_expected_status`;
- locks bundles on acceptance;
- records one `status_transition` event;
- sets both database guard contexts for the duration of the write.

A retry with the same actor and idempotency key returns the stored result and does not repeat the status update, trigger effects or transition event.

A competing command based on the previous state returns `stale_state` and cannot overwrite the winner.

## Outcome contract

| Outcome | API status | Meaning |
|---|---:|---|
| `applied` | 200 | First successful application |
| `replayed` | 200 | Same command retried; stored result returned |
| `stale_state` | 409 | Current status differs from `expectedStatus` |
| `idempotency_conflict` | 409 | Same key reused for a different command |
| `not_authorized` | 403 | Participant role cannot perform this transition |
| `not_participant` | 403 | Verified user is not a swap participant |
| `not_found` | 404 | Swap does not exist |
| `invalid_transition` | 422 | Transition is outside the canonical graph |
| `invalid_request` | 400 | Invalid status or command fields |

## Direct-write and identity prevention

Batch 61.2 adds a `BEFORE UPDATE OF status` guard. A direct update is rejected after strict enforcement is activated unless it is executed inside the single writer's transaction context.

A second guard freezes `requester_id`, `responder_id`, `offered_item_id` and `requested_item_id` after creation. The authorization boundary therefore cannot be rewritten by a browser, stale application code or a privileged update.

The participant insert policy is narrowed: a requester may create a swap only with `status = 'pending'`.

The browser Supabase client contains a compatibility firewall. A legacy PostgREST PATCH containing `swaps.status` is converted into `/api/swaps/transition` with the current status as `expectedStatus`. Non-status fields from that PATCH are sent only after the authoritative transition succeeds.

While staged enforcement remains disabled, the database compatibility trigger routes authenticated direct updates through the same authority. Privileged legacy writes remain temporarily available only to keep the previous Production deployment functional. After activation, all direct writes are rejected.

## Deployment sequence

The migration creates a service-role-only singleton configuration row with `enforced = false`:

1. install and verify the consolidated authority while the previous Production deployment remains active;
2. merge and deploy the application using the service wrapper;
3. verify the exact Production deployment, public routes and runtime logs;
4. set `enforced = true` through the service role;
5. prove direct writes are rejected while authoritative RPC transitions remain functional.

The configuration and ledger tables are inaccessible to browser roles.

## Compatibility boundary

The temporary `accepted -> completed` transition remains available because Batch 61.3 owns bilateral completion.

Existing completion, notification and profile effects are not final in this batch. Legacy compatibility effects execute only for `outcome = applied`, never for `replayed`.

Batch 61.3 must define the bilateral command and exactly-once final effects.

## Exit gate

Batch 61.2 is complete only when:

- Unit Tests, Lint/Type Check, Build and Public Visual Audit pass;
- Production migration history is represented in the repository;
- the consolidated writer, wrappers, ledger, grants and guards match the repository contract;
- Production keeps all existing swap rows valid and unchanged;
- the merge deployment is READY before strict enforcement is activated;
- strict enforcement is active and direct status writes are rejected;
- participant and item identity are immutable;
- new participant-created swaps are restricted to `pending`;
- no Production runtime regression is introduced.
