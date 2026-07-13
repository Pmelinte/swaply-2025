begin;

create unique index if not exists swaps_conversation_id_unique
  on public.swaps (conversation_id)
  where conversation_id is not null;

create or replace function public.create_exchange_from_match_agreement(
  p_conversation_id uuid,
  p_expected_revision integer
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_conversation public.conversations%rowtype;
  v_match public.matches%rowtype;
  v_existing_swap public.swaps%rowtype;
  v_agreement jsonb := '{}'::jsonb;
  v_snapshot jsonb;
  v_summary jsonb;
  v_next_agenda jsonb;
  v_revision integer := 0;
  v_condition text := '';
  v_offer text := '';
  v_logistics_method text := null;
  v_logistics_notes text := '';
  v_additional_terms text := '';
  v_item_a_title text := '';
  v_item_b_title text := '';
  v_item_a_type text := 'object';
  v_item_b_type text := 'object';
  v_swap_type text := 'object';
  v_location_type text := 'public_spot';
  v_swap_id uuid;
  v_now timestamptz := clock_timestamp();
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if p_expected_revision is null or p_expected_revision < 1 then
    raise exception 'A saved agreement revision is required'
      using errcode = '22023';
  end if;

  select c.*
  into v_conversation
  from public.conversations c
  where c.id = p_conversation_id
  for update;

  if not found or v_conversation.match_id is null then
    raise exception 'Match conversation not found' using errcode = 'P0002';
  end if;

  if cardinality(v_conversation.participant_ids) <> 2
     or not (v_user_id = any(v_conversation.participant_ids)) then
    raise exception 'Conversation access denied' using errcode = '42501';
  end if;

  if jsonb_typeof(v_conversation.agenda_state -> 'agreement') = 'object' then
    v_agreement := v_conversation.agenda_state -> 'agreement';
  end if;

  if coalesce(v_agreement ->> 'revision', '') ~ '^[0-9]+$' then
    v_revision := (v_agreement ->> 'revision')::integer;
  end if;

  if p_expected_revision <> v_revision then
    raise exception 'Agreement revision conflict' using errcode = '40001';
  end if;

  if v_conversation.swap_id is not null then
    select s.*
    into v_existing_swap
    from public.swaps s
    where s.id = v_conversation.swap_id
      and s.conversation_id = v_conversation.id;

    if not found then
      raise exception 'Conversation Exchange link is inconsistent'
        using errcode = '23503';
    end if;

    return jsonb_build_object(
      'swap_id', v_existing_swap.id,
      'created', false,
      'agreement_revision', v_revision
    );
  end if;

  select m.*
  into v_match
  from public.matches m
  where m.id = v_conversation.match_id
  for update;

  if not found then
    raise exception 'Match not found' using errcode = 'P0002';
  end if;

  if v_match.status <> 'accepted' then
    raise exception 'Accepted match required' using errcode = '42501';
  end if;

  if v_match.converted_swap_id is not null then
    raise exception 'Match conversion state is inconsistent'
      using errcode = '23505';
  end if;

  if v_match.initiator_item_id is null
     or v_match.target_item_id is null
     or v_match.initiator_id = v_match.target_user_id
     or not (v_match.initiator_id = any(v_conversation.participant_ids))
     or not (v_match.target_user_id = any(v_conversation.participant_ids))
     or not (v_match.initiator_item_id = any(v_conversation.item_ids))
     or not (v_match.target_item_id = any(v_conversation.item_ids)) then
    raise exception 'Match participants or items do not match the conversation'
      using errcode = '42501';
  end if;

  v_condition := trim(coalesce(v_agreement ->> 'condition_notes', ''));
  v_offer := trim(coalesce(v_agreement ->> 'offer_notes', ''));
  v_logistics_method := nullif(trim(coalesce(v_agreement ->> 'logistics_method', '')), '');
  v_logistics_notes := trim(coalesce(v_agreement ->> 'logistics_notes', ''));
  v_additional_terms := trim(coalesce(v_agreement ->> 'additional_terms', ''));

  if not (
    length(v_condition) > 0
    or length(v_offer) > 0
    or v_logistics_method is not null
    or length(v_logistics_notes) > 0
    or length(v_additional_terms) > 0
  ) then
    raise exception 'Agreement cannot be empty' using errcode = '22023';
  end if;

  if jsonb_typeof(v_agreement -> 'confirmed_by') <> 'array'
     or not (v_agreement -> 'confirmed_by' ? v_conversation.participant_ids[1]::text)
     or not (v_agreement -> 'confirmed_by' ? v_conversation.participant_ids[2]::text)
     or jsonb_typeof(v_conversation.agenda_state -> 'completed_stages') <> 'array'
     or not (v_conversation.agenda_state -> 'completed_stages' ? 'agreement') then
    raise exception 'Both participants must confirm the same agreement revision'
      using errcode = '42501';
  end if;

  select i.title, i.item_type
  into v_item_a_title, v_item_a_type
  from public.items i
  where i.id = v_match.initiator_item_id;

  select i.title, i.item_type
  into v_item_b_title, v_item_b_type
  from public.items i
  where i.id = v_match.target_item_id;

  if v_item_a_type = v_item_b_type then
    v_swap_type := coalesce(nullif(v_item_a_type, ''), 'object');
  else
    v_swap_type := 'cross';
  end if;

  v_location_type := case
    when v_logistics_method in ('national_courier', 'international_courier') then 'courier'
    when v_logistics_method = 'local_handover' then 'public_spot'
    else 'flexible'
  end;

  v_snapshot := jsonb_build_object(
    'revision', v_revision,
    'condition_notes', v_condition,
    'offer_notes', v_offer,
    'logistics_method', v_logistics_method,
    'logistics_notes', v_logistics_notes,
    'additional_terms', v_additional_terms,
    'confirmed_by', v_agreement -> 'confirmed_by',
    'confirmed_at', v_agreement ->> 'updated_at'
  );

  v_summary := jsonb_build_object(
    'generatedAt', v_now,
    'swapTitle', concat(v_item_a_title, ' ↔ ', v_item_b_title),
    'itemA', jsonb_build_object(
      'id', v_match.initiator_item_id,
      'title', v_item_a_title,
      'owner', v_match.initiator_id
    ),
    'itemB', jsonb_build_object(
      'id', v_match.target_item_id,
      'title', v_item_b_title,
      'owner', v_match.target_user_id
    ),
    'agreedItems', jsonb_build_array('condition', 'offer', 'logistics', 'agreement'),
    'pendingItems', '[]'::jsonb,
    'services', jsonb_build_object('escrow', false, 'insurance', false),
    'logistics', jsonb_build_object(
      'exchangeMode', true,
      'location', v_logistics_method is not null,
      'inPerson', v_logistics_method = 'local_handover',
      'deliveryAddresses', false
    ),
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
    exchange_data
  )
  values (
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
      'source', 'match_bilateral_agreement',
      'match_id', v_match.id,
      'conversation_id', v_conversation.id,
      'agreement_revision', v_revision,
      'agreement_snapshot', v_snapshot,
      'converted_by', v_user_id,
      'converted_at', v_now
    ),
    v_conversation.id,
    jsonb_build_object(
      'source', 'match_bilateral_agreement',
      'agreement_snapshot', v_snapshot
    )
  )
  returning id into v_swap_id;

  update public.matches m
  set status = 'converted_to_swap',
      converted_swap_id = v_swap_id,
      updated_at = v_now
  where m.id = v_match.id;

  v_next_agenda :=
    case
      when jsonb_typeof(v_conversation.agenda_state) = 'object'
        then v_conversation.agenda_state
      else '{}'::jsonb
    end
    || jsonb_build_object(
      'exchange_swap_id', v_swap_id::text,
      'exchange_created_at', v_now,
      'updated_by', v_user_id,
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
    'agreement_revision', v_revision
  );
end;
$$;

revoke all on function public.create_exchange_from_match_agreement(uuid, integer)
  from public;
revoke all on function public.create_exchange_from_match_agreement(uuid, integer)
  from anon;
grant execute on function public.create_exchange_from_match_agreement(uuid, integer)
  to authenticated;

comment on function public.create_exchange_from_match_agreement(uuid, integer)
is 'Batch 60: explicit, participant-only and idempotent handoff from a bilaterally confirmed match agreement to one Exchange.';

commit;
