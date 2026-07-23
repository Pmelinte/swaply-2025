begin;

create or replace function public.can_users_chat_v1(
  p_participant_a uuid,
  p_participant_b uuid
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_actor_id uuid := auth.uid();
begin
  if v_actor_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if p_participant_a is null
     or p_participant_b is null
     or p_participant_a = p_participant_b
     or v_actor_id not in (p_participant_a, p_participant_b) then
    raise exception 'Invalid chat participants' using errcode = '22023';
  end if;

  return not exists (
    select 1
    from public.blocked_users block_row
    where (
      block_row.blocker_id = p_participant_a
      and block_row.blocked_id = p_participant_b
    ) or (
      block_row.blocker_id = p_participant_b
      and block_row.blocked_id = p_participant_a
    )
  );
end;
$function$;

revoke all on function public.can_users_chat_v1(uuid, uuid) from public, anon, authenticated;
grant execute on function public.can_users_chat_v1(uuid, uuid) to authenticated;

comment on function public.can_users_chat_v1(uuid, uuid)
  is 'Prompt 71: participant-only chat gate that blocks message delivery when either participant has blocked the other.';

commit;
