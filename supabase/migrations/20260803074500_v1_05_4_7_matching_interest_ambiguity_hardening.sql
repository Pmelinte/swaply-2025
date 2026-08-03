begin;

-- V1-05.4.7 forward-only hardening.
--
-- public.express_matching_interest returns columns named to_user_id,
-- to_item_id and status. PostgreSQL exposes those output names as PL/pgSQL
-- variables, which made the partial ON CONFLICT target ambiguous at runtime.
-- Resolve ambiguous identifiers as table columns without changing the RPC
-- signature, response shape, matching rules, grants or idempotent behaviour.
create or replace function public.express_matching_interest(
  p_from_item_id uuid,
  p_to_item_id uuid,
  p_match_score numeric default null,
  p_source text default 'browsing'
)
returns table (
  id uuid,
  to_user_id uuid,
  to_item_id uuid,
  match_score numeric,
  status text
)
language plpgsql
security definer
set search_path = pg_catalog
as $function$
#variable_conflict use_column
declare
  v_actor_id uuid := auth.uid();
  v_from public.matching_items_v1%rowtype;
  v_to public.matching_items_v1%rowtype;
  v_source text := coalesce(p_source, 'browsing');
begin
  if v_actor_id is null then
    raise exception using errcode = '42501', message = 'AUTH_REQUIRED';
  end if;

  if v_source not in ('browsing', 'map', 'ai') then
    raise exception using errcode = '22023', message = 'INVALID_INTEREST_SOURCE';
  end if;

  select *
  into v_from
  from public.matching_items_v1 item
  where item.id = p_from_item_id
    and item.owner_id = v_actor_id;

  if not found then
    raise exception using errcode = '42501', message = 'SOURCE_ITEM_OWNER_REQUIRED';
  end if;

  select *
  into v_to
  from public.matching_items_v1 item
  where item.id = p_to_item_id;

  if not found then
    raise exception using errcode = '23514', message = 'TARGET_ITEM_UNAVAILABLE';
  end if;

  if v_to.owner_id = v_actor_id then
    raise exception using errcode = '23514', message = 'SELF_INTEREST_NOT_ALLOWED';
  end if;

  if not private.matching_pair_allowed_v1(
    v_from.item_type,
    v_from.swap_open_to,
    v_from.swap_wants_type,
    v_to.item_type,
    v_to.swap_open_to,
    v_to.swap_wants_type
  ) then
    raise exception using errcode = '23514', message = 'DOMAIN_PAIR_NOT_ALLOWED';
  end if;

  insert into public.matching_sessions (user_id, slot_1_item_id, filters)
  values (
    v_actor_id,
    p_from_item_id,
    jsonb_build_object(
      'source', 'express_interest',
      'from_domain', v_from.item_type,
      'to_domain', v_to.item_type
    )
  )
  on conflict (user_id)
  do update set
    slot_1_item_id = excluded.slot_1_item_id,
    filters = excluded.filters,
    updated_at = now();

  return query
  insert into public.matching_interests (
    from_user_id,
    to_user_id,
    from_item_id,
    to_item_id,
    match_score,
    source,
    status
  )
  values (
    v_actor_id,
    v_to.owner_id,
    p_from_item_id,
    p_to_item_id,
    least(100, greatest(0, coalesce(p_match_score, 0))),
    v_source,
    'pending'
  )
  on conflict (from_user_id, from_item_id, to_user_id, to_item_id)
  where status in ('pending', 'accepted')
  do update set
    match_score = excluded.match_score,
    source = excluded.source
  returning
    matching_interests.id,
    matching_interests.to_user_id,
    matching_interests.to_item_id,
    matching_interests.match_score,
    matching_interests.status;
end;
$function$;

revoke all on function public.express_matching_interest(
  uuid,
  uuid,
  numeric,
  text
) from public, anon;
grant execute on function public.express_matching_interest(
  uuid,
  uuid,
  numeric,
  text
) to authenticated;

comment on function public.express_matching_interest(
  uuid,
  uuid,
  numeric,
  text
) is
  'V1-05.4.7 ambiguity-safe participant-only interest authority with active-domain compatibility validation and idempotent partial-conflict reuse.';

commit;
