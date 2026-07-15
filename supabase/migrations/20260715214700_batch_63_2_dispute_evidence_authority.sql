begin;
create or replace function public.add_swap_dispute_evidence_v1(
  p_dispute_id uuid,
  p_evidence_type text,
  p_content text,
  p_idempotency_key text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_actor_id uuid := auth.uid();
  v_dispute public.disputes%rowtype;
  v_swap public.swaps%rowtype;
  v_evidence public.dispute_evidence%rowtype;
  v_existing public.swap_dispute_requests%rowtype;
  v_type text := pg_catalog.btrim(coalesce(p_evidence_type, ''));
  v_content text := pg_catalog.btrim(coalesce(p_content, ''));
  v_key text := pg_catalog.btrim(coalesce(p_idempotency_key, ''));
  v_hash text;
  v_response jsonb;
  v_partner_id uuid;
  v_evidence_count integer;
  v_photo_evidence jsonb := '[]'::jsonb;
begin
  if v_actor_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if p_dispute_id is null
     or v_type not in (
       'photo',
       'chat_screenshot',
       'tracking',
       'meeting_code',
       'location_proof',
       'note'
     )
     or char_length(v_content) not between 1 and 2000
     or char_length(v_key) not between 8 and 240 then
    raise exception 'Invalid dispute evidence input' using errcode = '22023';
  end if;

  v_hash := pg_catalog.md5(
    pg_catalog.jsonb_build_object(
      'command', 'evidence',
      'dispute_id', p_dispute_id,
      'actor_id', v_actor_id,
      'evidence_type', v_type,
      'content', v_content
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
    if v_existing.command <> 'evidence'
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

  if v_actor_id = v_dispute.initiator_id then
    v_partner_id := v_dispute.respondent_id;
  elsif v_actor_id = v_dispute.respondent_id then
    v_partner_id := v_dispute.initiator_id;
  else
    raise exception 'Actor is not a dispute participant' using errcode = '42501';
  end if;

  if v_dispute.status not in ('open', 'waiting_evidence') then
    raise exception 'Dispute no longer accepts evidence' using errcode = '23514';
  end if;

  select count(*) into v_evidence_count
  from public.dispute_evidence
  where dispute_id = p_dispute_id;
  if v_evidence_count >= 50 then
    raise exception 'Dispute evidence limit reached' using errcode = '23514';
  end if;

  perform pg_catalog.set_config(
    'swaply.dispute_authority',
    'add_swap_dispute_evidence_v1',
    true
  );

  insert into public.dispute_evidence (
    dispute_id,
    submitted_by,
    evidence_type,
    content
  ) values (
    p_dispute_id,
    v_actor_id,
    v_type,
    v_content
  ) returning * into v_evidence;

  update public.disputes
     set updated_at = pg_catalog.clock_timestamp()
   where id = p_dispute_id
   returning * into v_dispute;

  select count(*) into v_evidence_count
  from public.dispute_evidence
  where dispute_id = p_dispute_id;

  select coalesce(
    pg_catalog.jsonb_agg(content order by created_at),
    '[]'::jsonb
  ) into v_photo_evidence
  from public.dispute_evidence
  where dispute_id = p_dispute_id
    and evidence_type = 'photo';

  update public.swaps
     set dispute = pg_catalog.jsonb_set(
           pg_catalog.jsonb_set(
             coalesce(dispute, '{}'::jsonb),
             '{evidenceCount}',
             pg_catalog.to_jsonb(v_evidence_count),
             true
           ),
           '{evidencePhotos}',
           v_photo_evidence,
           true
         ),
         updated_at = pg_catalog.clock_timestamp()
   where id = v_dispute.swap_id
   returning * into v_swap;

  perform pg_catalog.set_config('swaply.dispute_authority', '', true);

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
  ) values (
    v_partner_id,
    'dispute_evidence_added',
    'New dispute evidence',
    'The other participant added evidence to the dispute.',
    pg_catalog.jsonb_build_object(
      'swap_id', v_dispute.swap_id,
      'dispute_id', p_dispute_id,
      'evidence_id', v_evidence.id,
      'evidence_type', v_type,
      'submitted_by', v_actor_id
    ),
    'warning',
    'swap',
    v_dispute.swap_id,
    'dispute:' || p_dispute_id::text || ':evidence:' || v_evidence.id::text,
    false,
    false
  ) on conflict (dedupe_key) where dedupe_key is not null do nothing;

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
    'dispute_evidence_added',
    'disputed',
    'disputed',
    pg_catalog.jsonb_build_object(
      'authority', 'add_swap_dispute_evidence_v1',
      'dispute_id', p_dispute_id,
      'evidence_id', v_evidence.id,
      'evidence_type', v_type,
      'idempotency_key', v_key
    )
  );

  v_response := pg_catalog.jsonb_build_object(
    'dispute', pg_catalog.to_jsonb(v_dispute),
    'evidence', pg_catalog.to_jsonb(v_evidence),
    'replayed', false,
    'idempotency_key', v_key
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
    'evidence',
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
       or v_existing.command <> 'evidence'
       or v_existing.dispute_id <> p_dispute_id
       or v_existing.request_hash <> v_hash then
      raise exception 'Dispute evidence command conflict' using errcode = '23505';
    end if;

    return pg_catalog.jsonb_set(
      v_existing.response,
      '{replayed}',
      'true'::jsonb,
      true
    );
end;
$function$;

revoke execute on function public.add_swap_dispute_evidence_v1(uuid, text, text, text)
  from public, anon, service_role;
grant execute on function public.add_swap_dispute_evidence_v1(uuid, text, text, text)
  to authenticated;

commit;
