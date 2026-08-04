-- V1-07.4 — Require bilateral consent before Story moderation.
-- Forward-only authority hardening. Apply to Production only after PR merge and explicit verification.

create or replace function public.moderate_story_revision_v1(
  p_story_id uuid,
  p_revision integer,
  p_approved boolean,
  p_notes text default null
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, private
as $$
declare
  caller_id uuid := auth.uid();
  current_revision_value integer;
  current_status_value text;
  participant_count integer;
  granted_count integer;
begin
  if auth.role() <> 'service_role'
     and not private.is_story_moderator_v1(caller_id) then
    raise exception 'Moderator authority required' using errcode = '42501';
  end if;

  select current_revision, status
    into current_revision_value, current_status_value
    from public.stories
   where id = p_story_id
   for update;

  if current_revision_value is null
     or current_revision_value <> p_revision then
    raise exception 'Story revision is stale' using errcode = '40001';
  end if;

  select count(*) into participant_count
    from public.story_participants
   where story_id = p_story_id;

  select count(*) into granted_count
    from public.story_consents
   where story_id = p_story_id
     and revision = p_revision
     and consent_status = 'granted';

  if current_status_value <> 'pending_moderation'
     or participant_count <> 2
     or granted_count <> participant_count then
    raise exception 'Bilateral Story consent required before moderation'
      using errcode = '42501';
  end if;

  insert into public.story_moderation (
    story_id,
    revision,
    decision,
    moderation_notes,
    decided_by
  ) values (
    p_story_id,
    p_revision,
    case when p_approved then 'approved' else 'rejected' end,
    nullif(btrim(p_notes), ''),
    caller_id
  )
  on conflict (story_id) do update
     set revision = excluded.revision,
         decision = excluded.decision,
         moderation_notes = excluded.moderation_notes,
         decided_by = excluded.decided_by,
         decided_at = clock_timestamp();

  update public.stories
     set status = case
       when p_approved then 'pending_moderation'
       else 'rejected'
     end,
     updated_at = clock_timestamp()
   where id = p_story_id;
end;
$$;

revoke all on function public.moderate_story_revision_v1(uuid, integer, boolean, text) from public;
grant execute on function public.moderate_story_revision_v1(uuid, integer, boolean, text) to authenticated;
grant execute on function public.moderate_story_revision_v1(uuid, integer, boolean, text) to service_role;
