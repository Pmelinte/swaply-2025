# Train E / E3.3 — Circular Exchanges & Bundles

## Scope

E3.3 activates the first complete multi-user exchange topology built on E3.1 participants/legs and E3.2 revision-bound unanimous consent.

## Contract

A circular or bundle exchange can move from `accepted` to `in_progress` only through `activate_atomic_exchange` and only when:

- the caller is the legacy requester or active proposer;
- `expected_revision` matches the current agreement revision;
- every active non-observer participant accepted that revision;
- every leg references active participants from the same swap;
- every leg has one unique, active item owned by its source participant;
- every active participant is involved;
- circular exchanges form one closed cycle;
- no item already has another active reservation.

## Atomicity

Validation occurs before reservation writes. The function then inserts all reservation rows, verifies that every leg was reserved, moves every leg from `draft` to `reserved`, and finally moves the swap from `accepted` to `in_progress`.

Because the RPC runs in one PostgreSQL transaction, any validation, uniqueness or write failure rolls back every reservation and state change. Partial activation is not a valid outcome.

## Idempotency

A repeated request for an already `in_progress` swap at the same revision returns the existing reservation count without creating duplicates or changing state.

## Safety boundaries

E3.3 does not:

- complete or fulfil any leg;
- deactivate or transfer item ownership;
- issue rewards, reputation, stories or feedback;
- send notifications;
- resolve cancellation or disputes;
- expose direct authenticated writes to reservation rows;
- apply migrations automatically to Production.

## Exit gate

- AI Evaluation & Regression Gate passes;
- Unit Tests pass;
- Lint & Type passes;
- 43-Locale Contract passes;
- Build passes;
- Vercel Preview is Ready;
- no merge occurs without Petru's explicit command.
