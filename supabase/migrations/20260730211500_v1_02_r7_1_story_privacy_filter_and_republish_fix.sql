-- V1-02-R7.1 — Story privacy filter and republish forward-fix
-- Forward-only correction after Production verification of R7.

create or replace function private.story_content_is_safe_v1(
  p_title text,
  p_body text
)
returns boolean
language sql
immutable
set search_path = pg_catalog
as $$
  select p_title is not null
     and p_body is not null
     and (p_title || E'\n' || p_body) !~* '[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}'
     and (p_title || E'\n' || p_body) !~* '(?:\+?[0-9][0-9 ()-]{7,}[0-9])'
     and (p_title || E'\n' || p_body) !~* '[-+]?[0-9]{1,2}\.[0-9]{4,}\s*[,;]\s*[-+]?[0-9]{1,3}\.[0-9]{4,}'
     and (p_title || E'\n' || p_body) !~* '(?:^|[^[:alnum:]_])(?:street|st\.|strada|str\.|avenue|ave\.|road|rd\.|boulevard|blvd\.)[[:space:]]+[[:alnum:] .-]+[[:space:]]+[0-9]{1,5}(?:[^[:alnum:]_]|$)';
$$;

create or replace function public.publish_story_revision_v1(
  p_story_id uuid,
  p_revision integer,
  p_public_slug text
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, private
as $$
declare
  caller_id uuid := auth.uid();
  story_row public.stories%rowtype;
  revision_row public.story_revisions%rowtype;
  participant_count integer;
  granted_count integer;
begin
  if caller_id is null
     or not private.is_story_participant_v1(p_story_id, caller_id) then
    raise exception 'Story participant required' using errcode = '42501';
  end if;

  select * into story_row
    from public.stories
   where id = p_story_id
   for update;

  if not found or story_row.current_revision <> p_revision then
    raise exception 'Story revision is stale' using errcode = '40001';
  end if;

  if story_row.dispute_suppressed
     or private.story_has_active_dispute_v1(story_row.swap_id) then
    raise exception 'Story publication blocked by dispute'
      using errcode = '42501';
  end if;

  select * into revision_row
    from public.story_revisions
   where story_id = p_story_id
     and revision = p_revision;

  if not private.story_content_is_safe_v1(
    revision_row.title,
    revision_row.body
  ) then
    raise exception 'Story contains private contact, exact location or coordinate data'
      using errcode = '22023';
  end if;

  select count(*) into participant_count
    from public.story_participants
   where story_id = p_story_id;

  select count(*) into granted_count
    from public.story_consents
   where story_id = p_story_id
     and revision = p_revision
     and consent_status = 'granted';

  if participant_count < 2 or participant_count <> granted_count then
    raise exception 'All participants must consent to this revision'
      using errcode = '42501';
  end if;

  if not exists (
    select 1
      from public.story_moderation moderation_row
     where moderation_row.story_id = p_story_id
       and moderation_row.revision = p_revision
       and moderation_row.decision = 'approved'
  ) then
    raise exception 'Approved moderation required' using errcode = '42501';
  end if;

  update public.story_publications
     set is_visible = false,
         hidden_at = clock_timestamp()
   where story_id = p_story_id
     and revision <> p_revision
     and is_visible;

  insert into public.story_publications (
    story_id,
    revision,
    public_slug,
    title,
    body,
    is_visible,
    published_at,
    hidden_at
  ) values (
    p_story_id,
    p_revision,
    lower(btrim(p_public_slug)),
    revision_row.title,
    revision_row.body,
    true,
    clock_timestamp(),
    null
  )
  on conflict (story_id, revision) do update
     set public_slug = excluded.public_slug,
         title = excluded.title,
         body = excluded.body,
         is_visible = true,
         published_at = clock_timestamp(),
         hidden_at = null;

  update public.stories
     set status = 'published',
         visibility = 'public',
         published_revision = p_revision,
         published_at = clock_timestamp(),
         hidden_at = null,
         withdrawn_at = null,
         updated_at = clock_timestamp()
   where id = p_story_id;
end;
$$;

revoke all on function private.story_content_is_safe_v1(text, text)
  from public, anon, authenticated, service_role;
revoke all on function public.publish_story_revision_v1(uuid, integer, text)
  from public, anon, authenticated, service_role;
grant execute on function public.publish_story_revision_v1(uuid, integer, text)
  to authenticated;

comment on function private.story_content_is_safe_v1(text, text) is
  'Rejects email, phone-like strings, coordinate pairs and obvious exact street addresses before Story publication.';
comment on function public.publish_story_revision_v1(uuid, integer, text) is
  'Publishes or safely re-publishes the consented, moderated current Story revision while restoring its public snapshot visibility.';
