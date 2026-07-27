# Train E / E3.1 — Multi-user exchange contract and data model

## Scope

Add an additive data model and deterministic contract for exchanges with more than two participants, while preserving the current bilateral Swap lifecycle.

## Delivered

- `swap_participants` for explicit participant membership, role, state and ordering;
- `swap_legs` for directed obligations between participants;
- `swap_revision_acceptances` for immutable acceptance evidence per agreement revision;
- `swaps.exchange_kind` with `bilateral`, `circular` and `bundle` values;
- `swaps.agreement_revision` as the basis for stale-revision protection in E3.2;
- participant-only RLS visibility, including compatibility with legacy requester/responder swaps;
- no authenticated insert, update or delete policies yet;
- deterministic TypeScript validation for bilateral and circular structures;
- contract and migration tests.

## Security boundary

E3.1 is a read-safe foundation. Multi-user rows may be written only by trusted server/service-role code until E3.2 introduces revision-safe RPCs and unanimous consent.

An outsider is not considered a participant and cannot read participant, leg or acceptance rows. Observers remain visible members but do not automatically gain acceptance authority.

## Compatibility

The existing bilateral flow remains valid:

- `swaps.requester_id` and `swaps.responder_id` remain unchanged;
- existing item columns remain unchanged;
- existing statuses and transition trigger remain unchanged;
- `exchange_kind` defaults to `bilateral`;
- existing rows receive `agreement_revision = 1`.

## Explicit non-goals

E3.1 does not:

- create multi-user exchanges from the UI;
- reserve or deactivate items;
- accept an agreement;
- invalidate stale acceptances;
- transition Swap status;
- create conversations or notifications;
- apply the migration to Production;
- change current RLS on `swaps`.

Those write-authority and consensus operations belong to E3.2.

## Exit gate

E3.1 is ready for merge only when Unit Tests, Lint & Type, 43-Locale Contract, Build and Vercel Preview are green. Production migration application remains a separate explicit operation after merge and review.
