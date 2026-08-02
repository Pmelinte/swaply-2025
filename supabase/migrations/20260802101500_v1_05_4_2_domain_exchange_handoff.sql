begin;

create schema if not exists private;

create or replace function private.create_exchange_from_domain_agreement_v1(
  p_conversation_id uuid,
  p_expected_revision integer,
  p_agreement jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $function$
declare
  v_actor uuid := auth.uid();
  v_conversation public.conversations%rowtype;
  v_match public.matches%rowtype;
  v_existing_swap public.swaps%rowtype;
  v_item_a_title text;
  v_item_b_title text;
  v_item_a_type text;
  v_item_b_type text;
  v_swap_type text;
  v_logistics_method text;
  v_logistics_notes text;
  v_location_type text;
  v_content_hash text;
  v_swap_id uuid;
  v_summary jsonb;
  v_next_agenda jsonb;
  v_now timestamptz := clock_timestamp();
begin
  if v_actor is null then
    raise exception using errcode = '42501', message = 'Authentication required.';
  end if;

  select c.*
  into v_conversation
  from public.conversations c
  where c.id = p_conversation_id
  for update;

  if not found or v_conversation.match_id is null then
    raise exception using errcode = 'P0002', message = 'Match conversation not found.';
  end if;

  if cardinality(v_conversation.participant_ids) <> 2
    or not (v_actor = any(v_conversation.participant_ids))
  then
    raise exception using errcode = '42501', message = 'Conversation access denied.';
  end if;

  if v_conversation.swap_id is not null then
    select s.*
    into v_existing_swap
    from public.swaps s
    where s.id = v_conversation.swap_id
      and s.conversation_id = v_conversation.id;

    if not found then
      raise exception using errcode = '23503', message = 'Conversation Exchange link is inconsistent.';
    end if;

    if v_existing_swap.agreement_revision <> p_expected_revision
      or coalesce(v_existing_swap.swap_metadata ->> 'agreement_hash', '')
        <> coalesce(p_agreement ->> 'content_hash', '')
    then
      raise exception using errcode = '40001', message = 'Existing Exchange agreement snapshot is inconsistent.';
    end if;

    return jsonb_build_object(
      'swap_id', v_existing_swap.id,
      'created', false,
      'agreement_revision', v_existing_swap.agreement_revision,
      'agreement_hash', v_existing_swap.swap_metadata ->> 'agreement_hash'
    );
  end if;

  select m.*
  into v_match
  from public.matches m
  where m.id = v_conversation.match_id
  for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'Match not found.';
  end if;

  if v_match.status <> 'accepted' then
    raise exception using errcode = '42501', message = 'Accepted match required.';
  end if;

  if v_match.converted_swap_id is not null then
    raise exception using errcode = '23505', message = 'Match conversion state is inconsistent.';
  end if;

  if v_match.initiator_item_id is null
    or v_match.target_item_id is null
    or v_match.initiator_id = v_match.target_user_id
    or not (v_match.initiator_id = any(v_conversation.participant_ids))
    or not (v_match.target_user_id = any(v_conversation.participant_ids))
    or not (v_match.initiator_item_id = any(v_conversation.item_ids))
    or not (v_match.target_item_id = any(v_conversation.item_ids))
  then
    raise exception using errcode = '42501', message = 'Match participants or items do not match the conversation.';
  end if;

  select i.title, i.item_type
  into v_item_a_title, v_item_a_type
  from public.items i
  where i.id = v_match.initiator_item_id;

  select i.title, i.item_type
  into v_item_b_title, v_item_b_type
  from public.items i
  where i.id = v_match.target_item_id;

  if v_item_a_title is null or v_item_b_title is null then
    raise exception using errcode = '23503', message = 'Exchange items are unavailable.';
  end if;

  v_swap_type := case
    when v_item_a_type = v_item_b_type
      then coalesce(nullif(v_item_a_type, ''), 'object')
    else 'cross'
  end;
  v_logistics_method := nullif(btrim(coalesce(p_agreement ->> 'logistics_method', '')), '');
  v_logistics_notes := btrim(coalesce(p_agreement ->> 'logistics_notes', ''));
  v_content_hash := p_agreement ->> 'content_hash';
  v_location_type := case
    when v_logistics_method in ('national_courier', 'international_courier') then 'courier'
    when v_logistics_method = 'local_handover' then 'public_spot'
    else 'flexible'
  end;

  v_summary := jsonb_build_object(
    'generatedAt', v_now,
    'swapTitle', concat(v_item_a_title, ' ↔ ', v_item_b_title),
    'itemA', jsonb_build_object(
      'id', v_match.initiator_item_id,
      'title', v_item_a_title,
      'domain', v_item_a_type,
      'owner', v_match.initiator_id
    ),
    'itemB', jsonb_build_object(
      'id', v_match.target_item_id,
      'title', v_item_b_title,
      'domain', v_item_b_type,
      'owner', v_match.target_user_id
    ),
    'agreedItems', jsonb_build_array(
      'condition', 'offer', 'logistics', 'domain_terms', 'agreement'
    ),
    'pendingItems', '[]'::jsonb,
    'services', jsonb_build_object('escrow', false, 'insurance', false),
    'logistics', jsonb_build_object(
      'exchangeMode', true,
      'location', v_logistics_method is not null,
      'inPerson', v_logistics_method = 'local_handover',
      'deliveryAddresses', false
    ),
    'agreementRevision', p_expected_revision,
    'agreementHash', v_content_hash,
    'approvedBy', to_jsonb(v_conversation.participant_ids)
  );

  insert into public.swaps (
    requester_id,
    responder_id,
    offered_item_id,
    requested_item_id,
    status,
    logistics,
    notifications,
    swap_type,
    swap_metadata,
    conversation_id,
    exchange_data,
    agreement_revision
  ) values (
    v_match.initiator_id,
    v_match.target_user_id,
    v_match.initiator_item_id,
    v_match.target_item_id,
    'accepted',
    jsonb_build_object(
      'locationType', v_location_type,
      'agreementMethod', v_logistics_method,
      'notes', v_logistics_notes
    ),
    array[]::text[],
    v_swap_type,
    jsonb_build_object(
      'source', 'domain_aware_match_agreement',
      'match_id', v_match.id,
      'conversation_id', v_conversation.id,
      'agreement_revision', p_expected_revision,
      'agreement_hash', v_content_hash,
      'agreement_snapshot', p_agreement,
      'converted_by', v_actor,
      'converted_at', v_now
    ),
    v_conversation.id,
    jsonb_build_object(
      'source', 'domain_aware_match_agreement',
      'agreement_revision', p_expected_revision,
      'agreement_hash', v_content_hash,
      'agreement_snapshot', p_agreement,
      'domain_terms', p_agreement -> 'domain_terms'
    ),
    p_expected_revision
  )
  returning id into v_swap_id;

  update public.matches m
  set status = 'converted_to_swap',
      converted_swap_id = v_swap_id,
      updated_at = v_now
  where m.id = v_match.id;

  v_next_agenda := (
    case
      when jsonb_typeof(v_conversation.agenda_state) = 'object'
        then v_conversation.agenda_state
      else '{}'::jsonb
    end
  ) || jsonb_build_object(
    'exchange_swap_id', v_swap_id,
    'exchange_created_at', v_now,
    'updated_by', v_actor,
    'updated_at', v_now
  );

  update public.conversations c
  set swap_id = v_swap_id,
      status = 'agreed',
      agenda_state = v_next_agenda,
      summary = v_summary,
      summary_approved_by = v_conversation.participant_ids,
      updated_at = v_now
  where c.id = v_conversation.id;

  return jsonb_build_object(
    'swap_id', v_swap_id,
    'created', true,
    'agreement_revision', p_expected_revision,
    'agreement_hash', v_content_hash
  );
end;
$function$;

revoke all on function private.create_exchange_from_domain_agreement_v1(
  uuid, integer, jsonb
) from public, anon, authenticated, service_role;

create or replace function public.create_exchange_from_match_agreement(
  p_conversation_id uuid,
  p_expected_revision integer
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $function$
declare
  v_actor uuid := auth.uid();
  v_conversation public.conversations%rowtype;
  v_agreement jsonb := '{}'::jsonb;
  v_confirmations jsonb := '{}'::jsonb;
  v_domain_terms jsonb := '[]'::jsonb;
  v_revision integer := 0;
  v_content_hash text := '';
begin
  if v_actor is null then
    raise exception using errcode = '42501', message = 'Authentication required.';
  end if;

  if p_expected_revision is null or p_expected_revision < 1 then
    raise exception using errcode = '22023', message = 'A saved agreement revision is required.';
  end if;

  select c.*
  into v_conversation
  from public.conversations c
  where c.id = p_conversation_id
  for update;

  if not found or v_conversation.match_id is null then
    raise exception using errcode = 'P0002', message = 'Match conversation not found.';
  end if;

  if cardinality(v_conversation.participant_ids) <> 2
    or not (v_actor = any(v_conversation.participant_ids))
  then
    raise exception using errcode = '42501', message = 'Conversation access denied.';
  end if;

  if jsonb_typeof(v_conversation.agenda_state -> 'agreement') = 'object' then
    v_agreement := v_conversation.agenda_state -> 'agreement';
  end if;

  if coalesce(v_agreement ->> 'revision', '') ~ '^[0-9]+$' then
    v_revision := (v_agreement ->> 'revision')::integer;
  end if;

  if p_expected_revision <> v_revision then
    raise exception using errcode = '40001', message = 'Agreement revision conflict.';
  end if;

  if v_agreement ->> 'schema_version' is distinct from '3.0'
    or coalesce(v_agreement ->> 'content_hash', '') !~ '^[a-f0-9]{64}$'
    or jsonb_typeof(v_agreement -> 'domain_terms') is distinct from 'array'
    or jsonb_typeof(v_agreement -> 'confirmations') is distinct from 'object'
    or jsonb_typeof(v_agreement -> 'confirmed_by') is distinct from 'array'
  then
    raise exception using errcode = '22023', message = 'A complete domain agreement is required.';
  end if;

  v_content_hash := v_agreement ->> 'content_hash';
  v_confirmations := v_agreement -> 'confirmations';
  v_domain_terms := private.validate_match_agreement_domain_terms_v1(
    p_conversation_id,
    v_agreement -> 'domain_terms'
  );

  if v_domain_terms <> (v_agreement -> 'domain_terms')
    or not (v_agreement -> 'confirmed_by' ? v_conversation.participant_ids[1]::text)
    or not (v_agreement -> 'confirmed_by' ? v_conversation.participant_ids[2]::text)
    or (v_confirmations -> v_conversation.participant_ids[1]::text ->> 'revision')::integer <> v_revision
    or (v_confirmations -> v_conversation.participant_ids[2]::text ->> 'revision')::integer <> v_revision
    or v_confirmations -> v_conversation.participant_ids[1]::text ->> 'content_hash' <> v_content_hash
    or v_confirmations -> v_conversation.participant_ids[2]::text ->> 'content_hash' <> v_content_hash
    or not coalesce(v_conversation.agenda_state -> 'completed_stages' ? 'agreement', false)
  then
    raise exception using errcode = '42501', message = 'Both participants must confirm the same domain agreement revision and hash.';
  end if;

  return private.create_exchange_from_domain_agreement_v1(
    p_conversation_id,
    p_expected_revision,
    v_agreement
  );
end;
$function$;

revoke all on function public.create_exchange_from_match_agreement(uuid, integer)
  from public, anon;
grant execute on function public.create_exchange_from_match_agreement(uuid, integer)
  to authenticated, service_role;

comment on function private.create_exchange_from_domain_agreement_v1(
  uuid, integer, jsonb
) is
  'V1-05.4.2 internal exact-once Exchange handoff that freezes the complete domain agreement snapshot.';
comment on function public.create_exchange_from_match_agreement(uuid, integer) is
  'V1-05.4.2 participant-only Exchange gate requiring the same complete revision and content hash from both participants.';

commit;
