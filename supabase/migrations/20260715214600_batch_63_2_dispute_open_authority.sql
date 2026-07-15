begin;
create or replace function public.open_swap_dispute_v1(
  p_swap_id uuid,
  p_expected_status text,
  p_reason text,
  p_description text,
  p_evidence jsonb,
  p_idempotency_key text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_actor_id uuid := auth.uid();
  v_swap public.swaps%rowtype;
  v_dispute public.disputes%rowtype;
  v_existing public.swap_dispute_requests%rowtype;
  v_reason text := pg_catalog.btrim(coalesce(p_reason, ''));
  v_description text := pg_catalog.btrim(coalesce(p_description, ''));
  v_evidence jsonb := coalesce(p_evidence, '[]'::jsonb);
  v_key text := pg_catalog.btrim(coalesce(p_idempotency_key, ''));
  v_hash text;
  v_transition jsonb;
  v_response jsonb;
  v_partner_id uuid;
  v_evidence_count integer := 0;
  v_photo_evidence jsonb := '[]'::jsonb;
begin
  if v_actor_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if p_swap_id is null
     or p_expected_status not in ('accepted', 'in_progress')
     or v_reason not in (
       'item_not_received',
       'wrong_item',
       'damaged',
       'condition_mismatch',
       'no_show',
       'other'
     )
     or char_length(v_description) not between 10 and 2000
     or char_length(v_key) not between 8 and 240
     or pg_catalog.jsonb_typeof(v_evidence) <> 'array'
     or pg_catalog.jsonb_array_length(v_evidence) > 10 then
    raise exception 'Invalid dispute input' using errcode = '22023';
  end if;

  if exists (
    select 1
    from pg_catalog.jsonb_array_elements(v_evidence) entry
    where coalesce(entry->>'evidence_type', '') not in (
        'photo',
        'chat_screenshot',
        'tracking',
        'meeting_code',
        'location_proof',
        'note'
      )
       or char_length(pg_catalog.btrim(coalesce(entry->>'content', '')))
          not between 1 and 2000
  ) then
    raise exception 'Invalid dispute evidence' using errcode = '22023';
  end if;

  v_hash := pg_catalog.md5(
    pg_catalog.jsonb_build_object(
      'command', 'open',
      'swap_id', p_swap_id,
      'actor_id', v_actor_id,
      'expected_status', p_expected_status,
      'reason', v_reason,
      'description', v_description,
      'evidence', v_evidence
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
    if v_existing.command <> 'open'
       or v_existing.swap_id <> p_swap_id
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

  select * into v_swap
  from public.swaps
  where id = p_swap_id
  for update;

  if not found then
    raise exception 'Swap not found' using errcode = 'P0002';
  end if;

  if v_actor_id = v_swap.requester_id then
    v_partner_id := v_swap.responder_id;
  elsif v_actor_id = v_swap.responder_id then
    v_partner_id := v_swap.requester_id;
  else
    raise exception 'Actor is not a swap participant' using errcode = '42501';
  end if;

  if v_swap.status is distinct from p_expected_status then
    raise exception 'Stale swap status: expected %, current %',
      p_expected_status,
      v_swap.status
      using errcode = '40001';
  end if;

  if exists (select 1 from public.disputes where swap_id = p_swap_id) then
    raise exception 'A dispute already exists for this Swap'
      using errcode = '23505';
  end if;

  perform pg_catalog.set_config(
    'swaply.dispute_authority',
    'open_swap_dispute_v1',
    true
  );

  insert into public.disputes (
    swap_id,
    initiator_id,
    respondent_id,
    opened_from_status,
    reason,
    description,
    status
  ) values (
    p_swap_id,
    v_actor_id,
    v_partner_id,
    p_expected_status,
    v_reason,
    v_description,
    'open'
  ) returning * into v_dispute;

  v_transition := public.apply_swap_transition_v1(
    p_swap_id,
    p_expected_status,
    'disputed',
    v_actor_id,
    'dispute_authority',
    v_key
  );

  insert into public.dispute_evidence (
    dispute_id,
    submitted_by,
    evidence_type,
    content
  )
  select
    v_dispute.id,
    v_actor_id,
    entry->>'evidence_type',
    pg_catalog.btrim(entry->>'content')
  from pg_catalog.jsonb_array_elements(v_evidence) entry;
  get diagnostics v_evidence_count = row_count;

  select coalesce(
    pg_catalog.jsonb_agg(content order by created_at),
    '[]'::jsonb
  ) into v_photo_evidence
  from public.dispute_evidence
  where dispute_id = v_dispute.id
    and evidence_type = 'photo';

  perform pg_catalog.set_config(
    'swaply.completion_authority',
    'open_swap_dispute_v1',
    true
  );

  update public.swaps
     set dispute = pg_catalog.jsonb_build_object(
           'id', v_dispute.id,
           'filedBy', v_actor_id,
           'reason', v_reason,
           'description', v_description,
           'evidencePhotos', v_photo_evidence,
           'evidenceCount', v_evidence_count,
           'status', 'open',
           'filedAt', v_dispute.created_at
         ),
         requester_confirmed = false,
         responder_confirmed = false,
         confirmed_by = '{}'::uuid[],
         updated_at = pg_catalog.clock_timestamp()
   where id = p_swap_id
   returning * into v_swap;

  perform pg_catalog.set_config('swaply.completion_authority', '', true);
  perform pg_catalog.set_config('swaply.dispute_authority', '', true);

  delete from public.swap_completion_confirmations
   where swap_id = p_swap_id;

  insert into public.swap_dispute_effects (
    swap_id,
    dispute_id,
    opened_by,
    from_status,
    evidence_count,
    idempotency_key
  ) values (
    p_swap_id,
    v_dispute.id,
    v_actor_id,
    p_expected_status,
    v_evidence_count,
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
      v_actor_id,
      'dispute_opened',
      'Dispute opened',
      'Your dispute was opened and the exchange is now frozen.',
      pg_catalog.jsonb_build_object(
        'swap_id', p_swap_id,
        'dispute_id', v_dispute.id,
        'reason', v_reason,
        'opened_by', v_actor_id
      ),
      'warning',
      'swap',
      p_swap_id,
      'swap:' || p_swap_id::text || ':dispute-opened:' || v_actor_id::text,
      false,
      false
    ),
    (
      v_partner_id,
      'dispute_opened',
      'Dispute opened',
      'The other participant opened a dispute for this exchange.',
      pg_catalog.jsonb_build_object(
        'swap_id', p_swap_id,
        'dispute_id', v_dispute.id,
        'reason', v_reason,
        'opened_by', v_actor_id
      ),
      'warning',
      'swap',
      p_swap_id,
      'swap:' || p_swap_id::text || ':dispute-opened:' || v_partner_id::text,
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
    p_swap_id,
    v_actor_id,
    'dispute_opened',
    p_expected_status,
    'disputed',
    pg_catalog.jsonb_build_object(
      'authority', 'open_swap_dispute_v1',
      'dispute_id', v_dispute.id,
      'idempotency_key', v_key,
      'reason', v_reason,
      'evidence_count', v_evidence_count,
      'notification_count', 2
    )
  );

  v_response := pg_catalog.jsonb_build_object(
    'dispute', pg_catalog.to_jsonb(v_dispute),
    'swap', pg_catalog.to_jsonb(v_swap),
    'replayed', false,
    'idempotency_key', v_key,
    'evidence_count', v_evidence_count,
    'transition', v_transition
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
    p_swap_id,
    v_dispute.id,
    v_actor_id,
    'open',
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
       or v_existing.command <> 'open'
       or v_existing.swap_id <> p_swap_id
       or v_existing.request_hash <> v_hash then
      raise exception 'Dispute command conflict' using errcode = '23505';
    end if;

    return pg_catalog.jsonb_set(
      v_existing.response,
      '{replayed}',
      'true'::jsonb,
      true
    );
end;
$function$;

revoke execute on function public.open_swap_dispute_v1(uuid, text, text, text, jsonb, text)
  from public, anon, service_role;
grant execute on function public.open_swap_dispute_v1(uuid, text, text, text, jsonb, text)
  to authenticated;

commit;
