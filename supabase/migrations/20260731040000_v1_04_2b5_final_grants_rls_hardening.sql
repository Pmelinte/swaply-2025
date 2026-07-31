-- V1-04.2B.5 — Final Grants & RLS Hardening

-- Canonical authority tables are read-only to application roles.
revoke insert, update, delete on table public.matching_interests from authenticated, anon;
revoke insert, update, delete on table public.matches from authenticated, anon;
revoke insert, update, delete on table public.conversations from authenticated, anon;
revoke insert, update, delete on table public.swaps from authenticated, anon;

-- Messages remain append-only with narrowly constrained operational updates.
revoke delete on table public.messages from authenticated, anon;
grant select, insert, update on table public.messages to authenticated;

-- Remove obsolete direct-write policies now superseded by canonical RPCs.
drop policy if exists matching_interests_insert_initiator on public.matching_interests;
drop policy if exists matching_interests_update_initiator on public.matching_interests;
drop policy if exists matching_interests_delete_initiator on public.matching_interests;

drop policy if exists matches_insert_own on public.matches;
drop policy if exists matches_update_own on public.matches;

drop policy if exists conversations_insert on public.conversations;
drop policy if exists conversations_update on public.conversations;

drop policy if exists insert_own_swaps on public.swaps;
drop policy if exists update_own_swaps on public.swaps;
drop policy if exists delete_own_swaps on public.swaps;

drop policy if exists delete_own_messages on public.messages;
drop policy if exists update_own_messages on public.messages;
drop policy if exists messages_update_operational_v1 on public.messages;

create policy messages_update_operational_v1
on public.messages
for update
to authenticated
using (
  auth.uid() = sender_id
  or auth.uid() = recipient_id
)
with check (
  auth.uid() = sender_id
  or auth.uid() = recipient_id
);

-- Explicit read/write surface for authenticated clients.
grant select on table public.matching_interests to authenticated;
grant select on table public.matches to authenticated;
grant select on table public.conversations to authenticated;
grant select on table public.swaps to authenticated;

-- Canonical RPC execution surface.
grant execute on function public.express_matching_interest(uuid, uuid, numeric, text) to authenticated;
grant execute on function public.accept_matching_interest(uuid) to authenticated;
grant execute on function public.withdraw_matching_interest_v1(uuid) to authenticated;
grant execute on function public.update_match_conversation_agenda(uuid, text, boolean) to authenticated;
grant execute on function public.update_match_conversation_agreement(uuid, text, integer, jsonb) to authenticated;
grant execute on function public.create_exchange_from_match_agreement(uuid, integer) to authenticated;
grant execute on function public.transition_swap_v1(uuid, text, text, text) to authenticated;
grant execute on function public.cancel_swap_v1(uuid, text, text, text) to authenticated;
grant execute on function public.confirm_swap_completion_v1(uuid, text) to authenticated;
grant execute on function public.open_swap_dispute_v1(uuid, text, text, text, jsonb, text) to authenticated;
grant execute on function public.submit_swap_review_v1(uuid, integer, text, text[], text[], text) to authenticated;
grant execute on function public.update_exchange_logistics_v1(uuid, text, jsonb) to authenticated;
