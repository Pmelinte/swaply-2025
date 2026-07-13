-- Batch 60: explicit, participant-driven handoff from a bilaterally confirmed
-- match agreement to one idempotent Exchange record.

create unique index if not exists swaps_conversation_id_key
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
  v_actor uuid := auth.uid();
  v_conversation public.conversations%rowtype;
  v_match public.matches%rowtype;
  v_agreement jsonb;
  v_revision integer;
  v_confirmed_by uuid[];
  v_swap_id uuid;
  v_snapshot jsonb;
begin
  if v_actor is null then
    raise exception 'authentication_required';
  end if;

  if p_expected_revision is null or p_expected_revision < 1 then
    raise exception 'invalid_agreement_revision';
  end if;

  select *
    into v_conversation
    from public.conversations
   where id = p_conversation_id
   for update;

  if not found then
    raise exception 'conversation_not_found';
  end if;

  if cardinality(v_conversation.participant_ids) <> 2
     or not (v_actor = any(v_conversation.participant_ids)) then
    raise exception 'conversation_participant_required';
  end if;

  if v_conversation.match_id is null then
    raise exception 'match_conversation_required';
  end if;

  select *
    into v_match
    from public.matches
   where id = v_conversation.match_id
   for update;

  if not found
     or v_match.status not in ('accepted', 'converted_to_swap')
     or v_match.initiator_id <> all(v_conversation.participant_ids)
     or v_match.target_user_id <> all(v_conversation.participant_ids) then
    raise exception 'accepted_match_required';
  end if;

  if v_match.initiator_item_id is null or v_match.target_item_id is null then
    raise exception 'two_item_match_required';
  end if;

  -- Idempotent return for an already converted conversation.
  select id
    into v_swap_id
    from public.swaps
   where conversation_id = v_conversation.id;

  if v_swap_id is not null then
    return jsonb_build_object(
      'swap_id', v_swap_id,
      'conversation_id', v_conversation.id,
      'match_id', v_match.id,
      'created', false
    );
  end if;

  v_agreement := coalesce(v_conversation.agenda_state -> 'agreement', '{}'::jsonb);
  v_revision := coalesce((v_agreement ->> 'revision')::integer, 0);

  if v_revision <> p_expected_revision then
    raise exception 'stale_agreement_revision';
  end if;

  if nullif(btrim(coalesce(v_agreement ->> 'condition_notes', '')), '') is null
     and nullif(btrim(coalesce(v_agreement ->> 'offer_notes', '')), '') is null
     and nullif(btrim(coalesce(v_agreement ->> 'logistics_method', '')), '') is null
     and nullif(btrim(coalesce(v_agreement ->> 'logistics_notes', '')), '') is null
     and nullif(btrim(coalesce(v_agreement ->> 'additional_terms', '')), '') is null then
    raise exception 'agreement_content_required';
  end if;

  select coalesce(array_agg(value::uuid), '{}'::uuid[])
    into v_confirmed_by
    from jsonb_array_elements_text(coalesce(v_agreement -> 'confirmed_by', '[]'::jsonb));

  if not (v_match.initiator_id = any(v_confirmed_by))
     or not (v_match.target_user_id = any(v_confirmed_by)) then
    raise exception 'bilateral_confirmation_required';
  end if;

  v_snapshot := jsonb_build_object(
    'source', 'match_bilateral_agreement',
    'match_id', v_match.id,
    'conversation_id', v_conversation.id,
    'agreement_revision', v_revision,
    'agreement', v_agreement,
    'confirmed_by', to_jsonb(v_confirmed_by),
    'converted_by', v_actor,
    'converted_at', now()
  );

  insert into public.swaps (
    requester_id,
    responder_id,
    offered_item_id,
    requested_item_id,
    status,
    swap_type,
    conversation_id,
    logistics,
    exchange_data,
    swap_metadata,
    confirmed_by,
    updated_at
  ) values (
    v_match.initiator_id,
    v_match.target_user_id,
    v_match.initiator_item_id,
    v_match.target_item_id,
    'accepted',
    'object',
    v_conversation.id,
    jsonb_build_object(
      'method', nullif(v_agreement ->> 'logistics_method', ''),
      'notes', coalesce(v_agreement ->> 'logistics_notes', '')
    ),
    jsonb_build_object('agreement_snapshot', v_snapshot),
    v_snapshot,
    '{}'::uuid[],
    now()
  )
  on conflict (conversation_id) where conversation_id is not null
  do update set conversation_id = excluded.conversation_id
  returning id into v_swap_id;

  update public.matches
     set status = 'converted_to_swap',
         converted_swap_id = v_swap_id,
         updated_at = now()
   where id = v_match.id;

  update public.conversations
     set swap_id = v_swap_id,
         status = 'agreed',
         updated_at = now()
   where id = v_conversation.id;

  return jsonb_build_object(
    'swap_id', v_swap_id,
    'conversation_id', v_conversation.id,
    'match_id', v_match.id,
    'created', true
  );
end;
$$;

revoke all on function public.create_exchange_from_match_agreement(uuid, integer) from public;
revoke all on function public.create_exchange_from_match_agreement(uuid, integer) from anon;
grant execute on function public.create_exchange_from_match_agreement(uuid, integer) to authenticated;
