begin;

create or replace function public.enforce_unblocked_matching_interest_v1()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_pair_key text;
begin
  -- The block command may only move existing pending interests to refused.
  -- It cannot create, accept or rewrite any other interest state.
  if coalesce(current_setting('swaply.safety_authority', true), '')
       = 'set_user_block_v1'
     and tg_op = 'UPDATE'
     and old.status = 'pending'
     and new.status = 'refused'
     and new.from_user_id = old.from_user_id
     and new.to_user_id = old.to_user_id
     and new.from_item_id = old.from_item_id
     and new.to_item_id = old.to_item_id then
    return new;
  end if;

  v_pair_key := pg_catalog.least(new.from_user_id::text, new.to_user_id::text)
    || ':' || pg_catalog.greatest(new.from_user_id::text, new.to_user_id::text);

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(v_pair_key, 0)
  );

  if private.is_blocked_pair_v1(new.from_user_id, new.to_user_id) then
    raise exception 'Blocked users cannot create or accept interests'
      using errcode = '42501';
  end if;

  return new;
end;
$function$;

revoke execute on function public.enforce_unblocked_matching_interest_v1()
  from public, anon, authenticated;

commit;
