-- V1-07.7 — Feedback and trust authority hardening
-- Forward-only migration. Trust remains separate from Swapleni.

create or replace function public.trigger_trust_score_on_swap()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  if new.status = 'completed'
     and old.status is distinct from 'completed' then
    update public.profiles
       set swaps_completed = coalesce(swaps_completed, 0) + 1
     where user_id in (new.requester_id, new.responder_id);

    perform public.calculate_trust_score(new.requester_id);
    perform public.calculate_trust_score(new.responder_id);
  end if;

  if new.status = 'cancelled'
     and old.status is distinct from 'cancelled' then
    update public.profiles
       set swaps_cancelled = coalesce(swaps_cancelled, 0) + 1
     where user_id in (new.requester_id, new.responder_id);

    perform public.calculate_trust_score(new.requester_id);
    perform public.calculate_trust_score(new.responder_id);
  end if;

  if new.status = 'disputed'
     and old.status is distinct from 'disputed' then
    update public.profiles
       set swaps_disputed = coalesce(swaps_disputed, 0) + 1
     where user_id in (new.requester_id, new.responder_id);

    perform public.calculate_trust_score(new.requester_id);
    perform public.calculate_trust_score(new.responder_id);
  end if;

  return new;
end;
$$;

drop trigger if exists swaps_trust_score_trigger on public.swaps;
create trigger swaps_trust_score_trigger
after update of status on public.swaps
for each row
when (old.status is distinct from new.status)
execute function public.trigger_trust_score_on_swap();

revoke all on function public.trigger_trust_score_on_swap() from public;
revoke all on function public.trigger_trust_score_on_swap() from anon;
revoke all on function public.trigger_trust_score_on_swap() from authenticated;
revoke all on function public.trigger_trust_score_on_swap() from service_role;

comment on function public.trigger_trust_score_on_swap() is
  'Trigger-only authority that updates outcome counters and recalculates persisted trust for both participants.';
