begin;

-- E5 GA security gate: SECURITY DEFINER functions must never inherit the
-- default PUBLIC execute privilege. Keep the participant-authorised RPCs
-- callable only by authenticated users; every function still validates
-- auth.uid(), participant role, expected revision and lifecycle state.
revoke all on function public.accept_swap_revision(uuid, integer, jsonb) from public, anon;
revoke all on function public.activate_atomic_exchange(uuid, integer) from public, anon;
revoke all on function public.apply_swap_authority_action(uuid, integer, text, uuid, uuid, text, jsonb) from public, anon;
revoke all on function public.confirm_swap_leg_progress(uuid, uuid, integer, text) from public, anon;
revoke all on function public.is_swap_participant(uuid) from public, anon;
revoke all on function public.revise_swap_agreement(uuid, integer, jsonb) from public, anon;

grant execute on function public.accept_swap_revision(uuid, integer, jsonb) to authenticated;
grant execute on function public.activate_atomic_exchange(uuid, integer) to authenticated;
grant execute on function public.apply_swap_authority_action(uuid, integer, text, uuid, uuid, text, jsonb) to authenticated;
grant execute on function public.confirm_swap_leg_progress(uuid, uuid, integer, text) to authenticated;
grant execute on function public.is_swap_participant(uuid) to authenticated;
grant execute on function public.revise_swap_agreement(uuid, integer, jsonb) to authenticated;

-- E5 GA security gate: remove the mutable search-path warning from the
-- matching-session timestamp trigger helper.
alter function public.set_matching_session_updated_at()
  set search_path = pg_catalog, public;

comment on function public.is_swap_participant(uuid) is
  'Participant predicate for authenticated RLS/RPC use. Explicitly unavailable to anon and PUBLIC.';

commit;
