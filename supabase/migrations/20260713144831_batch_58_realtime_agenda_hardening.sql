begin;

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
    'interest',
    'condition',
    'offer',
    'logistics',
    'agreement'
  ];
  v_completed jsonb := '[]'::jsonb;
  v_next jsonb;
begin
  if v_user_id is null then
    raise exception 'Authentication required'
      using errcode = '42501';
  end if;

  if p_stage is null or not (p_stage = any(v_allowed_stages)) then
    raise exception 'Invalid conversation stage'
      using errcode = '22023';
  end if;

  select conversation_row.*
  into v_conversation
  from public.conversations conversation_row
  where conversation_row.id = p_conversation_id
  for update;

  if not found or v_conversation.match_id is null then
    raise exception 'Match conversation not found'
      using errcode = 'P0002';
  end if;

  if cardinality(v_conversation.participant_ids) <> 2
     or not (v_user_id = any(v_conversation.participant_ids)) then
    raise exception 'Conversation access denied'
      using errcode = '42501';
  end if;

  if not exists (
    select 1
    from public.matches match_row
    where match_row.id = v_conversation.match_id
      and match_row.status = 'accepted'
      and match_row.initiator_id = any(v_conversation.participant_ids)
      and match_row.target_user_id = any(v_conversation.participant_ids)
  ) then
    raise exception 'Accepted match required'
      using errcode = '42501';
  end if;

  select coalesce(jsonb_agg(stage_row.stage order by stage_row.first_position), '[]'::jsonb)
  into v_completed
  from (
    select stage_value as stage, min(stage_position) as first_position
    from jsonb_array_elements_text(
      coalesce(v_conversation.agenda_state -> 'completed_stages', '[]'::jsonb)
    ) with ordinality as completed_stage(stage_value, stage_position)
    where stage_value = any(v_allowed_stages)
    group by stage_value
  ) stage_row;

  if p_completed is true and not (v_completed ? p_stage) then
    v_completed := v_completed || jsonb_build_array(p_stage);
  elsif p_completed is false then
    select coalesce(jsonb_agg(stage_value order by stage_position), '[]'::jsonb)
    into v_completed
    from jsonb_array_elements_text(v_completed)
      with ordinality as completed_stage(stage_value, stage_position)
    where stage_value <> p_stage;
  end if;

  v_next := jsonb_build_object(
    'version', 1,
    'active_stage', p_stage,
    'completed_stages', v_completed,
    'updated_by', v_user_id,
    'updated_at', clock_timestamp()
  );

  update public.conversations conversation_row
  set agenda_state = v_next,
      updated_at = clock_timestamp()
  where conversation_row.id = p_conversation_id;

  return v_next;
end;
$$;

revoke all on function public.update_match_conversation_agenda(uuid, text, boolean)
  from public;
revoke all on function public.update_match_conversation_agenda(uuid, text, boolean)
  from anon;
grant execute on function public.update_match_conversation_agenda(uuid, text, boolean)
  to authenticated;

comment on function public.update_match_conversation_agenda(uuid, text, boolean)
is 'Batch 58: participant-only realtime guided agenda with hardened search_path.';

commit;
