begin;
create or replace function public.resolve_swap_dispute_v1(
  p_dispute_id uuid,
  p_resolution text,
  p_notes text,
  p_idempotency_key text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_actor_id uuid := auth.uid();
  v_actor_role text;
  v_dispute public.disputes%rowtype;
  v_swap public.swaps%rowtype;
  v_existing public.swap_dispute_requests%rowtype;
  v_resolution text := pg_catalog.btrim(coalesce(p_resolution, ''));
  v_notes text := pg_catalog.btrim(coalesce(p_notes, ''));
  v_key text := pg_catalog.btrim(coalesce(p_idempotency_key, ''));
  v_hash text;
  v_response jsonb;
  v_penalized_user_id uuid;
  v_penalty_counted boolean := false;
  v_reactivated_item_count integer := 0;
  v_profile_count integer := 0;
begin
  if v_actor_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  select role into v_actor_role
  from public.profiles
  where user_id = v_actor_id;

  if coalesce(v_actor_role, '') not in ('admin', 'moderator') then
    raise exception 'Only admins or moderators may resolve disputes'
      using errcode = '42501';
  end if;

  if p_dispute_id is null
     or v_resolution not in (
       'resolved_requester',
       'resolved_responder',
       'resolved_split',
       'rejected'
     )
     or char_length(v_notes) not between 3 and 2000
     or char_length(v_key) not between 8 and 240 then
    raise exception 'Invalid dispute resolution input' using errcode = '22023';
  end if;

  v_hash := pg_catalog.md5(
    pg_catalog.jsonb_build_object(
      'command', 'resolve',
      'dispute_id', p_dispute_id,
      'actor_id', v_actor_id,
      'resolution', v_resolution,
      'notes', v_notes
    )::text
  );

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(v_actor_id::text || ':' || v_key, 0)
  );

  select * into v_existing
  from public.swap_dispute_requests
  where actor_id = v_actor_id
    and idempotency_key = v_key;

  if found then
    if v_existing.command <> 'resolve'
       or v_existing.dispute_id <> p_dispute_id
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

  select * into v_dispute
  from public.disputes
  where id = p_dispute_id
  for update;

  if not found then
    raise exception 'Dispute not found' using errcode = 'P0002';
  end if;

  if v_dispute.status not in ('open', 'waiting_evidence', 'under_review') then
    raise exception 'Dispute is already resolved' using errcode = '23505';
  end if;

  select * into v_swap
  from public.swaps
  where id = v_dispute.swap_id
  for update;

  if not found then
    raise exception 'Swap not found' using errcode = 'P0002';
  end if;

  if v_swap.status <> 'disputed' then
    raise exception 'Dispute resolution requires a disputed Swap'
      using errcode = '23514';
  end if;

  v_penalized_user_id := case v_resolution
    when 'resolved_requester' then v_dispute.respondent_id
    when 'resolved_responder' then v_dispute.initiator_id
    when 'rejected' then v_dispute.initiator_id
    else null
  end;
  v_penalty_counted := v_penalized_user_id is not null;

  perform pg_catalog.set_config(
    'swaply.dispute_authority',
    'resolve_swap_dispute_v1',
    true
  );

  update public.disputes
     set status = v_resolution,
         resolution_notes = v_notes,
         resolved_by = v_actor_id,
         resolved_at = pg_catalog.clock_timestamp(),
         updated_at = pg_catalog.clock_timestamp()
   where id = p_dispute_id
   returning * into v_dispute;

  update public.swaps
     set dispute = pg_catalog.jsonb_set(
           pg_catalog.jsonb_set(
             pg_catalog.jsonb_set(
               pg_catalog.jsonb_set(
                 coalesce(dispute, '{}'::jsonb),
                 '{status}',
                 pg_catalog.to_jsonb(v_resolution),
                 true
               ),
               '{resolutionNotes}',
               pg_catalog.to_jsonb(v_notes),
               true
             ),
             '{resolvedBy}',
             pg_catalog.to_jsonb(v_actor_id),
             true
           ),
           '{resolvedAt}',
           pg_catalog.to_jsonb(v_dispute.resolved_at),
           true
         ),
         updated_at = pg_catalog.clock_timestamp()
   where id = v_dispute.swap_id
   returning * into v_swap;

  perform pg_catalog.set_config('swaply.dispute_authority', '', true);

  update public.items
     set status = 'active',
         is_active = true,
         locked_by = null,
         locked_until = null,
         lock_reason = null,
         updated_at = pg_catalog.clock_timestamp()
   where id in (v_swap.offered_item_id, v_swap.requested_item_id)
     and status = 'reserved'
     and lock_reason = 'swap_active';
  get diagnostics v_reactivated_item_count = row_count;

  if v_swap.conversation_id is not null then
    update public.conversations
       set status = 'cancelled',
           updated_at = pg_catalog.clock_timestamp()
     where id = v_swap.conversation_id
       and status in ('active', 'agreed');
  end if;

  if v_penalty_counted then
    update public.profiles
       set swaps_disputed = coalesce(swaps_disputed, 0) + 1,
           updated_at = pg_catalog.clock_timestamp()
     where user_id = v_penalized_user_id;
    get diagnostics v_profile_count = row_count;

    if v_profile_count <> 1 then
      raise exception 'Penalized participant Profile is required'
        using errcode = 'P0002';
    end if;

    perform public.calculate_trust_score(v_penalized_user_id);
  end if;

  insert into public.swap_dispute_resolution_effects (
    dispute_id,
    swap_id,
    resolved_by,
    resolution,
    penalized_user_id,
    penalty_counted,
    reactivated_item_count,
    idempotency_key
  ) values (
    p_dispute_id,
    v_dispute.swap_id,
    v_actor_id,
    v_resolution,
    v_penalized_user_id,
    v_penalty_counted,
    v_reactivated_item_count,
    v_key
  );

  insert into public.notifications (
    user_id,
    type,
    title,
    body,
    data,
    priority,
    source_type,
    source_id,
    dedupe_key,
    is_read,
    read
  ) values
    (
      v_dispute.initiator_id,
      'dispute_resolved',
      'Dispute resolved',
      'A moderator resolved your exchange dispute.',
      pg_catalog.jsonb_build_object(
        'swap_id', v_dispute.swap_id,
        'dispute_id', p_dispute_id,
        'resolution', v_resolution,
        'penalized_user_id', v_penalized_user_id
      ),
      'warning',
      'swap',
      v_dispute.swap_id,
      'swap:' || v_dispute.swap_id::text || ':dispute-resolved:' || v_dispute.initiator_id::text,
      false,
      false
    ),
    (
      v_dispute.respondent_id,
      'dispute_resolved',
      'Dispute resolved',
      'A moderator resolved your exchange dispute.',
      pg_catalog.jsonb_build_object(
        'swap_id', v_dispute.swap_id,
        'dispute_id', p_dispute_id,
        'resolution', v_resolution,
        'penalized_user_id', v_penalized_user_id
      ),
      'warning',
      'swap',
      v_dispute.swap_id,
      'swap:' || v_dispute.swap_id::text || ':dispute-resolved:' || v_dispute.respondent_id::text,
      false,
      false
    )
  on conflict (dedupe_key) where dedupe_key is not null do nothing;

  insert into public.swap_events (
    swap_id,
    actor_id,
    action,
    from_status,
    to_status,
    metadata
  ) values (
    v_dispute.swap_id,
    v_actor_id,
    'dispute_resolved',
    'disputed',
    'disputed',
    pg_catalog.jsonb_build_object(
      'authority', 'resolve_swap_dispute_v1',
      'dispute_id', p_dispute_id,
      'resolution', v_resolution,
      'penalized_user_id', v_penalized_user_id,
      'penalty_counted', v_penalty_counted,
      'reactivated_item_count', v_reactivated_item_count,
      'idempotency_key', v_key,
      'notification_count', 2
    )
  );

  v_response := pg_catalog.jsonb_build_object(
    'dispute', pg_catalog.to_jsonb(v_dispute),
    'swap', pg_catalog.to_jsonb(v_swap),
    'replayed', false,
    'idempotency_key', v_key,
    'penalized_user_id', v_penalized_user_id,
    'penalty_counted', v_penalty_counted,
    'reactivated_item_count', v_reactivated_item_count
  );

  insert into public.swap_dispute_requests (
    swap_id,
    dispute_id,
    actor_id,
    command,
    idempotency_key,
    request_hash,
    response
  ) values (
    v_dispute.swap_id,
    p_dispute_id,
    v_actor_id,
    'resolve',
    v_key,
    v_hash,
    v_response
  );

  return v_response;
exception
  when unique_violation then
    select * into v_existing
    from public.swap_dispute_requests
    where actor_id = v_actor_id
      and idempotency_key = v_key;

    if not found
       or v_existing.command <> 'resolve'
       or v_existing.dispute_id <> p_dispute_id
       or v_existing.request_hash <> v_hash then
      raise exception 'Dispute resolution command conflict' using errcode = '23505';
    end if;

    return pg_catalog.jsonb_set(
      v_existing.response,
      '{replayed}',
      'true'::jsonb,
      true
    );
end;
$function$;

revoke execute on function public.resolve_swap_dispute_v1(uuid, text, text, text)
  from public, anon, service_role;
grant execute on function public.resolve_swap_dispute_v1(uuid, text, text, text)
  to authenticated;

comment on table public.disputes is
  'Batch 63.2 canonical one-row-per-Swap dispute record; global Swap remains terminal disputed.';
comment on table public.dispute_evidence is
  'Batch 63.2 participant evidence attached only through canonical dispute commands.';
comment on table public.swap_dispute_requests is
  'Batch 63.2 private idempotency registry for open, evidence and resolution commands.';
comment on table public.swap_dispute_effects is
  'Batch 63.2 exactly-once dispute-opening effect registry.';
comment on table public.swap_dispute_resolution_effects is
  'Batch 63.2 exactly-once dispute-resolution cleanup and trust effect registry.';
comment on function public.open_swap_dispute_v1(uuid, text, text, text, jsonb, text) is
  'Batch 63.2 participant-only atomic dispute opening with CAS, evidence, frozen completion state and idempotency.';
comment on function public.add_swap_dispute_evidence_v1(uuid, text, text, text) is
  'Batch 63.2 participant-only idempotent evidence append command.';
comment on function public.resolve_swap_dispute_v1(uuid, text, text, text) is
  'Batch 63.2 moderator-only idempotent dispute resolution; outcome remains local while Swap stays disputed.';

commit;
