begin;

create or replace function public.set_user_block_v1(
  p_target_user_id uuid,
  p_blocked boolean,
  p_idempotency_key text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_actor_id uuid := auth.uid();
  v_key text := pg_catalog.btrim(coalesce(p_idempotency_key, ''));
  v_hash text;
  v_existing public.safety_command_requests%rowtype;
  v_block public.blocked_users%rowtype;
  v_response jsonb;
  v_pair_key text;
  v_refused_interest_count integer := 0;
  v_is_blocked boolean := false;
begin
  if v_actor_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if p_target_user_id is null
     or p_blocked is null
     or char_length(v_key) not between 8 and 240 then
    raise exception 'Invalid block input' using errcode = '22023';
  end if;

  if p_target_user_id = v_actor_id then
    raise exception 'Users cannot block themselves' using errcode = '23514';
  end if;

  if not exists (
    select 1
    from public.profiles profile
    where profile.user_id = p_target_user_id
  ) then
    raise exception 'Target user not found' using errcode = 'P0002';
  end if;

  v_hash := pg_catalog.md5(
    pg_catalog.jsonb_build_object(
      'command', 'block',
      'actor_id', v_actor_id,
      'target_user_id', p_target_user_id,
      'blocked', p_blocked
    )::text
  );

  v_pair_key := pg_catalog.least(v_actor_id::text, p_target_user_id::text)
    || ':' || pg_catalog.greatest(v_actor_id::text, p_target_user_id::text);

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(v_pair_key, 0)
  );

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(v_actor_id::text || ':block:' || v_key, 0)
  );

  select * into v_existing
  from public.safety_command_requests request_row
  where request_row.actor_id = v_actor_id
    and request_row.command = 'block'
    and request_row.idempotency_key = v_key;

  if found then
    if v_existing.subject_id <> p_target_user_id
       or v_existing.request_hash <> v_hash then
      raise exception 'Idempotency key conflict' using errcode = '23505';
    end if;

    return pg_catalog.jsonb_set(
      v_existing.response,
      '{replayed}',
      'true'::jsonb,
      true
    );
  end if;

  perform pg_catalog.set_config(
    'swaply.safety_authority',
    'set_user_block_v1',
    true
  );

  if p_blocked then
    insert into public.blocked_users (
      blocker_id,
      blocked_id
    ) values (
      v_actor_id,
      p_target_user_id
    )
    on conflict (blocker_id, blocked_id) do nothing;

    update public.matching_interests interest
       set status = 'refused'
     where interest.status = 'pending'
       and (
         (interest.from_user_id = v_actor_id and interest.to_user_id = p_target_user_id)
         or
         (interest.from_user_id = p_target_user_id and interest.to_user_id = v_actor_id)
       );
    get diagnostics v_refused_interest_count = row_count;
  else
    delete from public.blocked_users block_row
     where block_row.blocker_id = v_actor_id
       and block_row.blocked_id = p_target_user_id;
  end if;

  select * into v_block
  from public.blocked_users block_row
  where block_row.blocker_id = v_actor_id
    and block_row.blocked_id = p_target_user_id;
  v_is_blocked := found;

  perform pg_catalog.set_config('swaply.safety_authority', '', true);

  insert into public.audit_log (
    user_id,
    action,
    entity_type,
    entity_id,
    new_data,
    metadata
  ) values (
    v_actor_id,
    case when p_blocked then 'safety.user_blocked' else 'safety.user_unblocked' end,
    'user',
    p_target_user_id::text,
    pg_catalog.jsonb_build_object(
      'blocked', v_is_blocked,
      'refused_interest_count', v_refused_interest_count
    ),
    '{}'::jsonb
  );

  v_response := pg_catalog.jsonb_build_object(
    'target_user_id', p_target_user_id,
    'blocked', v_is_blocked,
    'block', case when v_is_blocked then pg_catalog.to_jsonb(v_block) else null end,
    'refused_interest_count', v_refused_interest_count,
    'replayed', false,
    'idempotency_key', v_key
  );

  insert into public.safety_command_requests (
    actor_id,
    command,
    idempotency_key,
    request_hash,
    subject_id,
    response
  ) values (
    v_actor_id,
    'block',
    v_key,
    v_hash,
    p_target_user_id,
    v_response
  );

  return v_response;
end;
$function$;

revoke execute on function public.set_user_block_v1(uuid, boolean, text)
  from public, anon, service_role;
grant execute on function public.set_user_block_v1(uuid, boolean, text)
  to authenticated;

commit;
