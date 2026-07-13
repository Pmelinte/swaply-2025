begin;

alter function public.create_exchange_from_match_agreement(uuid, integer)
  rename to create_exchange_from_match_agreement_v1;

revoke all on function public.create_exchange_from_match_agreement_v1(uuid, integer)
  from public;
revoke all on function public.create_exchange_from_match_agreement_v1(uuid, integer)
  from anon;
revoke all on function public.create_exchange_from_match_agreement_v1(uuid, integer)
  from authenticated;

create function public.create_exchange_from_match_agreement(
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
  v_agreement jsonb := '{}'::jsonb;
  v_confirmed jsonb := '[]'::jsonb;
  v_completed jsonb := '[]'::jsonb;
  v_revision integer := 0;
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
  where c.id = p_conversation_id;

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

  if jsonb_typeof(v_agreement -> 'confirmed_by') = 'array' then
    v_confirmed := v_agreement -> 'confirmed_by';
  end if;

  if jsonb_typeof(v_conversation.agenda_state -> 'completed_stages') = 'array' then
    v_completed := v_conversation.agenda_state -> 'completed_stages';
  end if;

  if not coalesce(v_confirmed ? v_conversation.participant_ids[1]::text, false)
     or not coalesce(v_confirmed ? v_conversation.participant_ids[2]::text, false)
     or not coalesce(v_completed ? 'agreement', false) then
    raise exception 'Both participants must confirm the same agreement revision'
      using errcode = '42501';
  end if;

  return public.create_exchange_from_match_agreement_v1(
    p_conversation_id,
    p_expected_revision
  );
end;
$$;

revoke all on function public.create_exchange_from_match_agreement(uuid, integer)
  from public;
revoke all on function public.create_exchange_from_match_agreement(uuid, integer)
  from anon;
grant execute on function public.create_exchange_from_match_agreement(uuid, integer)
  to authenticated;

comment on function public.create_exchange_from_match_agreement_v1(uuid, integer)
is 'Batch 60 internal atomic conversion implementation. Direct client execution is denied.';

comment on function public.create_exchange_from_match_agreement(uuid, integer)
is 'Batch 60 hardened participant-only guard and explicit idempotent Exchange handoff.';

commit;
