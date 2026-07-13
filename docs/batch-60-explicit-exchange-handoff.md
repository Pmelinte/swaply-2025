# Batch 60 — Explicit Exchange handoff

## Scope

Batch 60 connects the bilaterally confirmed Match agreement to the existing Exchange workspace.

The handoff remains explicitly human-triggered:

1. both participants confirm the same saved agreement revision;
2. the UI exposes `Create Exchange`;
3. one participant explicitly clicks the button;
4. the server creates or reuses exactly one Exchange;
5. both participants open the same Exchange ID.

## Atomic server contract

`public.create_exchange_from_match_agreement(conversation_id, expected_revision)`:

- requires an authenticated conversation participant;
- requires exactly two conversation participants;
- requires an accepted Match with the same participants and items;
- requires the expected saved agreement revision;
- requires both participant IDs in `confirmed_by`;
- requires the `agreement` stage to be complete;
- locks the conversation and Match during conversion;
- creates one `swaps` row with status `accepted`;
- copies an immutable agreement snapshot to `swap_metadata` and `exchange_data`;
- stores a compatible `conversations.summary` for the existing Exchange UI;
- links `matches.converted_swap_id`, `conversations.swap_id`, and `swaps.conversation_id`;
- changes the Match to `converted_to_swap` and the conversation to `agreed`;
- returns the existing Exchange on retries.

A partial unique index on `swaps.conversation_id` prevents duplicate Exchange rows.

## Realtime

The conversion updates `conversations.agenda_state.updated_at`. The existing conversation Realtime channel receives this update. `MatchAgreementPanel` then refreshes the linked `swap_id`, so the other participant sees `Open Exchange` without a second Realtime architecture.

## Guardrails

The handoff does not:

- create an Exchange merely because both participants confirmed;
- send a Chat message;
- create a new notification or email;
- award tokens or change trust/rank;
- reserve, lock, pause, or deactivate either item;
- complete the Exchange;
- activate escrow, insurance, courier, or payment services;
- alter Auth or general RLS policies.

The Exchange is inserted directly with status `accepted`. This avoids the legacy `pending` swap-proposal notification trigger because the participants already agreed in Chat.

## Migrations

- `20260713204828_batch_60_explicit_exchange_handoff`
- `20260713205642_batch_60_confirmation_guard_hardening`

The second migration wraps the atomic implementation with explicit null-safe bilateral confirmation checks. The internal implementation has no direct client EXECUTE grant.

## Validation target

- Unit Tests
- Lint and Type Check
- Next.js Build
- Public Visual Audit
- Vercel Preview
- Train C through Batch 60: 17 tests

The Batch 60 authenticated E2E verifies:

- zero Exchange before the explicit click;
- one Exchange after the click;
- same Exchange ID for both users;
- retry returns the same ID;
- frozen snapshot revision matches the confirmed revision;
- Match, conversation, and Exchange links are consistent;
- item states remain unchanged;
- token balances, lifetime tokens, trust level, trust score, notifications, and token ledger remain unchanged;
- cleanup by immutable IDs restores the accepted Match test fixture.
