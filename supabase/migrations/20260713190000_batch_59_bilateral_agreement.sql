begin;

update public.conversations c
set agenda_state =
  jsonb_set(
    jsonb_set(
      case
        when jsonb_typeof(c.agenda_state) = 'object' then c.agenda_state
        else '{}'::jsonb
      end,
      '{version}',
      '2'::jsonb,
      true
    ),
    '{conversation_id}',
    to_jsonb(c.id::text),
    true
  )
where c.match_id is not null;

create or replace function public.update_match_conversation_agenda(
  p_conversation_id uuid,
  p_stage text,
  p_completed boolean default null
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_conversation public.conversations%rowtype;
  v_allowed_stages constant text[] := array[
    'interest', 'condition', 'offer', 'logistics', 'agreement'
  ];
  v_completed jsonb := '[]'::jsonb;
  v_now timestamptz := clock_timestamp();
  v_next jsonb;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if p_stage is null or not (p_stage = any(v_allowed_stages)) then
    raise exception 'Invalid conversation stage' using errcode = '22023';
  end if;

  if p_stage = 'agreement' and p_completed is not null then
    raise exception 'Agreement completion requires bilateral confirmation'
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

  if not exists (
    select 1
    from public.matches m
    where m.id = v_conversation.match_id
      and m.status = 'accepted'
      and m.initiator_id = any(v_conversation.participant_ids)
      and m.target_user_id = any(v_conversation.participant_ids)
  ) then
    raise exception 'Accepted match required' using errcode = '42501';
  end if;

  select coalesce(
    jsonb_agg(x.stage order by x.first_position),
    '[]'::jsonb
  )
  into v_completed
  from (
    select stage_value as stage, min(stage_position) as first_position
    from jsonb_array_elements_text(
      case
        when jsonb_typeof(v_conversation.agenda_state -> 'completed_stages') = 'array'
          then v_conversation.agenda_state -> 'completed_stages'
        else '[]'::jsonb
      end
    ) with ordinality as s(stage_value, stage_position)
    where stage_value = any(v_allowed_stages)
    group by stage_value
  ) x;

  if p_completed is true and not (v_completed ? p_stage) then
    v_completed := v_completed || jsonb_build_array(p_stage);
  elsif p_completed is false then
    select coalesce(
      jsonb_agg(stage_value order by stage_position),
      '[]'::jsonb
    )
    into v_completed
    from jsonb_array_elements_text(v_completed)
      with ordinality as s(stage_value, stage_position)
    where stage_value <> p_stage;
  end if;

  v_next :=
    case
      when jsonb_typeof(v_conversation.agenda_state) = 'object'
        then v_conversation.agenda_state
      else '{}'::jsonb
    end
    || jsonb_build_object(
      'version', 2,
      'conversation_id', v_conversation.id::text,
      'active_stage', p_stage,
      'completed_stages', v_completed,
      'updated_by', v_user_id,
      'updated_at', v_now
    );

  update public.conversations c
  set agenda_state = v_next,
      updated_at = v_now
  where c.id = p_conversation_id;

  return v_next;
end;
$$;

create or replace function public.update_match_conversation_agreement(
  p_conversation_id uuid,
  p_action text,
  p_expected_revision integer,
  p_payload jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_conversation public.conversations%rowtype;
  v_allowed_actions constant text[] := array['save', 'confirm', 'withdraw'];
  v_allowed_logistics constant text[] := array[
    'local_handover',
    'national_courier',
    'international_courier',
    'other'
  ];
  v_allowed_stages constant text[] := array[
    'interest', 'condition', 'offer', 'logistics', 'agreement'
  ];
  v_agreement jsonb := '{}'::jsonb;
  v_completed jsonb := '[]'::jsonb;
  v_confirmed jsonb := '[]'::jsonb;
  v_revision integer := 0;
  v_condition text := '';
  v_offer text := '';
  v_logistics_method text := null;
  v_logistics_notes text := '';
  v_additional text := '';
  v_active_stage text := 'agreement';
  v_now timestamptz := clock_timestamp();
  v_next jsonb;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if p_action is null or not (p_action = any(v_allowed_actions)) then
    raise exception 'Invalid agreement action' using errcode = '22023';
  end if;

  if p_expected_revision is null or p_expected_revision < 0 then
    raise exception 'Invalid expected agreement revision'
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

  if not exists (
    select 1
    from public.matches m
    where m.id = v_conversation.match_id
      and m.status = 'accepted'
      and m.initiator_id = any(v_conversation.participant_ids)
      and m.target_user_id = any(v_conversation.participant_ids)
  ) then
    raise exception 'Accepted match required' using errcode = '42501';
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

  v_condition := left(coalesce(v_agreement ->> 'condition_notes', ''), 1000);
  v_offer := left(coalesce(v_agreement ->> 'offer_notes', ''), 1000);
  v_logistics_method := nullif(v_agreement ->> 'logistics_method', '');
  v_logistics_notes := left(coalesce(v_agreement ->> 'logistics_notes', ''), 1000);
  v_additional := left(coalesce(v_agreement ->> 'additional_terms', ''), 1500);

  if v_logistics_method is not null
     and not (v_logistics_method = any(v_allowed_logistics)) then
    v_logistics_method := null;
  end if;

  select coalesce(
    jsonb_agg(participant_id::text order by participant_id::text),
    '[]'::jsonb
  )
  into v_confirmed
  from unnest(v_conversation.participant_ids) participant_id
  where coalesce(v_agreement -> 'confirmed_by', '[]'::jsonb)
    ? participant_id::text;

  select coalesce(
    jsonb_agg(x.stage order by x.first_position),
    '[]'::jsonb
  )
  into v_completed
  from (
    select stage_value as stage, min(stage_position) as first_position
    from jsonb_array_elements_text(
      case
        when jsonb_typeof(v_conversation.agenda_state -> 'completed_stages') = 'array'
          then v_conversation.agenda_state -> 'completed_stages'
        else '[]'::jsonb
      end
    ) with ordinality as s(stage_value, stage_position)
    where stage_value = any(v_allowed_stages)
    group by stage_value
  ) x;

  if coalesce(v_conversation.agenda_state ->> 'active_stage', '')
     = any(v_allowed_stages) then
    v_active_stage := v_conversation.agenda_state ->> 'active_stage';
  end if;

  if p_action = 'save' then
    if jsonb_typeof(coalesce(p_payload, '{}'::jsonb)) <> 'object' then
      raise exception 'Agreement payload must be an object'
        using errcode = '22023';
    end if;

    v_condition := trim(coalesce(p_payload ->> 'condition_notes', ''));
    v_offer := trim(coalesce(p_payload ->> 'offer_notes', ''));
    v_logistics_method :=
      nullif(trim(coalesce(p_payload ->> 'logistics_method', '')), '');
    v_logistics_notes := trim(coalesce(p_payload ->> 'logistics_notes', ''));
    v_additional := trim(coalesce(p_payload ->> 'additional_terms', ''));

    if length(v_condition) > 1000
       or length(v_offer) > 1000
       or length(v_logistics_notes) > 1000
       or length(v_additional) > 1500 then
      raise exception 'Agreement text is too long' using errcode = '22001';
    end if;

    if v_logistics_method is not null
       and not (v_logistics_method = any(v_allowed_logistics)) then
      raise exception 'Invalid logistics method' using errcode = '22023';
    end if;

    v_revision := v_revision + 1;
    v_confirmed := '[]'::jsonb;
    v_active_stage := 'agreement';

  elsif p_action = 'confirm' then
    if v_revision < 1 then
      raise exception 'Save the agreement before confirming it'
        using errcode = '22023';
    end if;

    if not (
      length(trim(v_condition)) > 0
      or length(trim(v_offer)) > 0
      or v_logistics_method is not null
      or length(trim(v_logistics_notes)) > 0
      or length(trim(v_additional)) > 0
    ) then
      raise exception 'Agreement cannot be empty' using errcode = '22023';
    end if;

    if not (v_confirmed ? v_user_id::text) then
      v_confirmed := v_confirmed || jsonb_build_array(v_user_id::text);
    end if;

  elsif p_action = 'withdraw' then
    select coalesce(
      jsonb_agg(confirmed_value order by confirmed_position),
      '[]'::jsonb
    )
    into v_confirmed
    from jsonb_array_elements_text(v_confirmed)
      with ordinality as c(confirmed_value, confirmed_position)
    where confirmed_value <> v_user_id::text;
  end if;

  select coalesce(
    jsonb_agg(stage_value order by stage_position),
    '[]'::jsonb
  )
  into v_completed
  from jsonb_array_elements_text(v_completed)
    with ordinality as s(stage_value, stage_position)
  where stage_value <> 'agreement';

  if jsonb_array_length(v_confirmed) = 2 then
    v_completed := v_completed || jsonb_build_array('agreement');
  end if;

  v_agreement := jsonb_build_object(
    'revision', v_revision,
    'condition_notes', v_condition,
    'offer_notes', v_offer,
    'logistics_method', v_logistics_method,
    'logistics_notes', v_logistics_notes,
    'additional_terms', v_additional,
    'confirmed_by', v_confirmed,
    'updated_by', v_user_id,
    'updated_at', v_now
  );

  v_next :=
    case
      when jsonb_typeof(v_conversation.agenda_state) = 'object'
        then v_conversation.agenda_state
      else '{}'::jsonb
    end
    || jsonb_build_object(
      'version', 2,
      'conversation_id', v_conversation.id::text,
      'active_stage', v_active_stage,
      'completed_stages', v_completed,
      'agreement', v_agreement,
      'updated_by', v_user_id,
      'updated_at', v_now
    );

  update public.conversations c
  set agenda_state = v_next,
      updated_at = v_now
  where c.id = p_conversation_id;

  return v_next;
end;
$$;

revoke all on function public.update_match_conversation_agenda(uuid, text, boolean)
  from public;
revoke all on function public.update_match_conversation_agenda(uuid, text, boolean)
  from anon;
grant execute on function public.update_match_conversation_agenda(uuid, text, boolean)
  to authenticated;

revoke all on function public.update_match_conversation_agreement(uuid, text, integer, jsonb)
  from public;
revoke all on function public.update_match_conversation_agreement(uuid, text, integer, jsonb)
  from anon;
grant execute on function public.update_match_conversation_agreement(uuid, text, integer, jsonb)
  to authenticated;

comment on function public.update_match_conversation_agenda(uuid, text, boolean)
is 'Batch 59: guided agenda preserving the bilateral agreement snapshot.';

comment on function public.update_match_conversation_agreement(uuid, text, integer, jsonb)
is 'Batch 59: participant-only agreement revisions and bilateral confirmation.';

commit;
