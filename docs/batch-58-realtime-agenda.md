# Batch 58 — Realtime Guided Match Conversation

## Scope

- reuse the existing `real-chat:{conversationId}` channel;
- subscribe to `UPDATE` events on `public.conversations`;
- synchronize `agenda_state` between both participants without reload;
- prevent overlapping stage writes while one RPC is pending;
- ignore stale agenda snapshots using the server `updated_at` value;
- refetch the active conversation once when the realtime channel errors or times out;
- normalize invalid legacy agenda versions;
- harden the SECURITY DEFINER function search path.

## Guardrails

- no second realtime architecture;
- no polling while the channel is connected;
- no automatic messages;
- no automatic match rejection;
- no Exchange creation;
- no token or notification side effects;
- RLS and participant-only RPC access remain unchanged.

## Validation target

- Train C: 15 tests;
- User A updates are visible to User B without reload;
- User B updates are visible to User A without reload;
- all stage controls are disabled during an in-flight save;
- reload preserves the same shared state;
- one conversation per match;
- no message or Exchange side effects;
- anonymous read and update remain denied.
