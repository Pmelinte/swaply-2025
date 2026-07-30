-- V1-02-R7 — Stories privacy and consent foundation
-- Forward-only schema. Do not apply to Production without explicit owner authorisation.

create table if not exists public.stories (
  id uuid primary key default gen_random_uuid(),
  swap_id uuid not null references public.swaps(id) on delete restrict,
  created_by uuid not null references auth.users(id) on delete restrict,
  status text not null default 'draft'
    check (status in ('draft', 'pending_consent', 'pending_moderation', 'published', 'hidden', 'disputed', 'rejected')),
  visibility text not null default 'private'
    check (visibility in ('private', 'participants', 'public')),
  current_revision integer not null default 1 check (current_revision > 0),
  published_revision integer,
  dispute_suppressed boolean not null default false,
  published_at timestamptz,
  hidden_at timestamptz,
  withdrawn_at timestamptz,
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  unique (swap_id)
);

create table if not exists public.story_participants (
  story_id uuid not null references public.stories(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  participant_role text not null check (participant_role in ('author', 'partner')),
  created_at timestamptz not null default clock_timestamp(),
  primary key (story_id, user_id),
  unique (story_id, participant_role)
);

create table if not exists public.story_revisions (
  story_id uuid not null references public.stories(id) on delete cascade,
  revision integer not null check (revision > 0),
  title text not null check (length(btrim(title)) between 3 and 160),
  body text not null check (length(btrim(body)) between 20 and 12000),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default clock_timestamp(),
  primary key (story_id, revision)
);

create table if not exists public.story_consents (
  story_id uuid not null references public.stories(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  revision integer not null check (revision > 0),
  consent_status text not null check (consent_status in ('granted', 'withdrawn')),
  granted_at timestamptz,
  withdrawn_at timestamptz,
  updated_at timestamptz not null default clock_timestamp(),
  primary key (story_id, user_id),
  foreign key (story_id, revision) references public.story_revisions(story_id, revision) on delete cascade
);

create table if not exists public.story_moderation (
  story_id uuid primary key references public.stories(id) on delete cascade,
  revision integer not null check (revision > 0),
  decision text not null check (decision in ('approved', 'rejected')),
  moderation_notes text,
  decided_by uuid references auth.users(id) on delete set null,
  decided_at timestamptz not null default clock_timestamp(),
  foreign key (story_id, revision) references public.story_revisions(story_id, revision) on delete cascade
);

create table if not exists public.story_publications (
  story_id uuid primary key references public.stories(id) on delete restrict,
  revision integer not null check (revision > 0),
  public_slug text not null unique check (public_slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  title text not null,
  body text not null,
  is_visible boolean not null default true,
  published_at timestamptz not null default clock_timestamp(),
  hidden_at timestamptz,
  foreign key (story_id, revision) references public.story_revisions(story_id, revision) on delete restrict
);

create index if not exists stories_created_by_idx on public.stories(created_by);
create index if not exists stories_status_idx on public.stories(status);
create index if not exists story_participants_user_idx on public.story_participants(user_id);
create index if not exists story_revisions_story_created_idx on public.story_revisions(story_id, created_at desc);
create index if not exists story_publications_visible_idx on public.story_publications(is_visible, published_at desc);

alter table public.stories enable row level security;
alter table public.story_participants enable row level security;
alter table public.story_revisions enable row level security;
alter table public.story_consents enable row level security;
alter table public.story_moderation enable row level security;
alter table public.story_publications enable row level security;

create or replace function private.is_story_participant_v1(
  p_story_id uuid,
  p_user_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public, private
as $$
  select p_user_id is not null
     and exists (
       select 1
         from public.story_participants participant_row
        where participant_row.story_id = p_story_id
          and participant_row.user_id = p_user_id
     );
$$;

create or replace function private.is_story_moderator_v1(
  p_user_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public, private
as $$
  select p_user_id is not null
     and (
       exists (
         select 1
           from public.user_roles role_row
          where role_row.user_id = p_user_id
            and role_row.role in ('admin', 'moderator')
       )
       or exists (
         select 1
           from public.profiles profile_row
          where profile_row.user_id = p_user_id
            and profile_row.role in ('admin', 'moderator')
       )
     );
$$;

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
     and (p_title || E'\n' || p_body) !~* '\b(?:street|st\.|strada|str\.|avenue|ave\.|road|rd\.|boulevard|blvd\.)\s+[[:alnum:] .-]+\s+[0-9]{1,5}\b';
$$;

create or replace function private.story_has_active_dispute_v1(
  p_swap_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select exists (
    select 1
      from public.disputes dispute_row
     where dispute_row.swap_id = p_swap_id
       and dispute_row.status not in ('resolved_requester', 'resolved_responder', 'resolved_split', 'rejected', 'closed')
  );
$$;

create or replace function public.create_story_draft_v1(
  p_swap_id uuid,
  p_title text,
  p_body text
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public, private
as $$
declare
  caller_id uuid := auth.uid();
  swap_row public.swaps%rowtype;
  story_id uuid;
begin
  if caller_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  select * into swap_row
    from public.swaps
   where id = p_swap_id
     and status = 'completed'
     and caller_id in (requester_id, responder_id)
   for share;

  if not found then
    raise exception 'Completed participant swap required' using errcode = '42501';
  end if;

  insert into public.stories (swap_id, created_by, status, visibility)
  values (p_swap_id, caller_id, 'pending_consent', 'participants')
  returning id into story_id;

  insert into public.story_participants (story_id, user_id, participant_role)
  values
    (story_id, caller_id, 'author'),
    (story_id,
      case when caller_id = swap_row.requester_id then swap_row.responder_id else swap_row.requester_id end,
      'partner');

  insert into public.story_revisions (story_id, revision, title, body, created_by)
  values (story_id, 1, btrim(p_title), btrim(p_body), caller_id);

  return story_id;
end;
$$;

create or replace function public.save_story_revision_v1(
  p_story_id uuid,
  p_expected_revision integer,
  p_title text,
  p_body text
)
returns integer
language plpgsql
security definer
set search_path = pg_catalog, public, private
as $$
declare
  caller_id uuid := auth.uid();
  next_revision integer;
begin
  if caller_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  update public.stories
     set current_revision = current_revision + 1,
         status = 'pending_consent',
         visibility = 'participants',
         published_revision = null,
         published_at = null,
         hidden_at = null,
         withdrawn_at = null,
         dispute_suppressed = false,
         updated_at = clock_timestamp()
   where id = p_story_id
     and created_by = caller_id
     and current_revision = p_expected_revision
     and status <> 'disputed'
  returning current_revision into next_revision;

  if next_revision is null then
    raise exception 'Story revision is stale or caller is not the author' using errcode = '40001';
  end if;

  insert into public.story_revisions (story_id, revision, title, body, created_by)
  values (p_story_id, next_revision, btrim(p_title), btrim(p_body), caller_id);

  delete from public.story_consents where story_id = p_story_id;
  delete from public.story_moderation where story_id = p_story_id;
  update public.story_publications
     set is_visible = false,
         hidden_at = clock_timestamp()
   where story_id = p_story_id
     and is_visible;

  return next_revision;
end;
$$;

create or replace function public.set_story_consent_v1(
  p_story_id uuid,
  p_revision integer,
  p_granted boolean
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, private
as $$
declare
  caller_id uuid := auth.uid();
  current_revision_value integer;
  participant_count integer;
  granted_count integer;
begin
  if caller_id is null or not private.is_story_participant_v1(p_story_id, caller_id) then
    raise exception 'Story participant required' using errcode = '42501';
  end if;

  select current_revision into current_revision_value
    from public.stories
   where id = p_story_id
   for update;

  if current_revision_value is null or current_revision_value <> p_revision then
    raise exception 'Story revision is stale' using errcode = '40001';
  end if;

  insert into public.story_consents (
    story_id, user_id, revision, consent_status, granted_at, withdrawn_at, updated_at
  ) values (
    p_story_id,
    caller_id,
    p_revision,
    case when p_granted then 'granted' else 'withdrawn' end,
    case when p_granted then clock_timestamp() else null end,
    case when p_granted then null else clock_timestamp() end,
    clock_timestamp()
  )
  on conflict (story_id, user_id) do update
     set revision = excluded.revision,
         consent_status = excluded.consent_status,
         granted_at = excluded.granted_at,
         withdrawn_at = excluded.withdrawn_at,
         updated_at = excluded.updated_at;

  if not p_granted then
    update public.stories
       set status = 'hidden',
           visibility = 'participants',
           withdrawn_at = clock_timestamp(),
           hidden_at = clock_timestamp(),
           updated_at = clock_timestamp()
     where id = p_story_id;

    update public.story_publications
       set is_visible = false,
           hidden_at = clock_timestamp()
     where story_id = p_story_id
       and is_visible;
    return;
  end if;

  select count(*) into participant_count
    from public.story_participants
   where story_id = p_story_id;

  select count(*) into granted_count
    from public.story_consents
   where story_id = p_story_id
     and revision = p_revision
     and consent_status = 'granted';

  update public.stories
     set status = case when participant_count = granted_count then 'pending_moderation' else 'pending_consent' end,
         updated_at = clock_timestamp()
   where id = p_story_id;
end;
$$;

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
begin
  if auth.role() <> 'service_role' and not private.is_story_moderator_v1(caller_id) then
    raise exception 'Moderator authority required' using errcode = '42501';
  end if;

  select current_revision into current_revision_value
    from public.stories
   where id = p_story_id
   for update;

  if current_revision_value is null or current_revision_value <> p_revision then
    raise exception 'Story revision is stale' using errcode = '40001';
  end if;

  insert into public.story_moderation (story_id, revision, decision, moderation_notes, decided_by)
  values (
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
     set status = case when p_approved then 'pending_moderation' else 'rejected' end,
         updated_at = clock_timestamp()
   where id = p_story_id;
end;
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
  if caller_id is null or not private.is_story_participant_v1(p_story_id, caller_id) then
    raise exception 'Story participant required' using errcode = '42501';
  end if;

  select * into story_row
    from public.stories
   where id = p_story_id
   for update;

  if not found or story_row.current_revision <> p_revision then
    raise exception 'Story revision is stale' using errcode = '40001';
  end if;

  if story_row.dispute_suppressed or private.story_has_active_dispute_v1(story_row.swap_id) then
    raise exception 'Story publication blocked by dispute' using errcode = '42501';
  end if;

  select * into revision_row
    from public.story_revisions
   where story_id = p_story_id
     and revision = p_revision;

  if not private.story_content_is_safe_v1(revision_row.title, revision_row.body) then
    raise exception 'Story contains private contact, exact location or coordinate data' using errcode = '22023';
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
    raise exception 'All participants must consent to this revision' using errcode = '42501';
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

  insert into public.story_publications (
    story_id, revision, public_slug, title, body, is_visible, published_at, hidden_at
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
  on conflict (story_id) do update
     set revision = excluded.revision,
         public_slug = excluded.public_slug,
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

create or replace function private.suppress_stories_for_dispute_v1()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, private
as $$
begin
  if new.status not in ('resolved_requester', 'resolved_responder', 'resolved_split', 'rejected', 'closed') then
    update public.stories
       set status = 'disputed',
           visibility = 'participants',
           dispute_suppressed = true,
           hidden_at = clock_timestamp(),
           updated_at = clock_timestamp()
     where swap_id = new.swap_id;

    update public.story_publications publication_row
       set is_visible = false,
           hidden_at = clock_timestamp()
      from public.stories story_row
     where story_row.id = publication_row.story_id
       and story_row.swap_id = new.swap_id
       and publication_row.is_visible;
  end if;
  return new;
end;
$$;

drop trigger if exists suppress_stories_on_dispute on public.disputes;
create trigger suppress_stories_on_dispute
after insert or update of status on public.disputes
for each row execute function private.suppress_stories_for_dispute_v1();

create policy stories_participant_select
on public.stories
for select
to authenticated
using (private.is_story_participant_v1(id) or private.is_story_moderator_v1());

create policy story_participants_participant_select
on public.story_participants
for select
to authenticated
using (private.is_story_participant_v1(story_id) or private.is_story_moderator_v1());

create policy story_revisions_participant_select
on public.story_revisions
for select
to authenticated
using (private.is_story_participant_v1(story_id) or private.is_story_moderator_v1());

create policy story_consents_participant_select
on public.story_consents
for select
to authenticated
using (private.is_story_participant_v1(story_id) or private.is_story_moderator_v1());

create policy story_moderation_participant_select
on public.story_moderation
for select
to authenticated
using (private.is_story_participant_v1(story_id) or private.is_story_moderator_v1());

create policy story_publications_public_select
on public.story_publications
for select
to anon, authenticated
using (is_visible);

revoke all on table public.stories from public, anon, authenticated;
revoke all on table public.story_participants from public, anon, authenticated;
revoke all on table public.story_revisions from public, anon, authenticated;
revoke all on table public.story_consents from public, anon, authenticated;
revoke all on table public.story_moderation from public, anon, authenticated;
revoke all on table public.story_publications from public, anon, authenticated;

grant select on table public.stories to authenticated;
grant select on table public.story_participants to authenticated;
grant select on table public.story_revisions to authenticated;
grant select on table public.story_consents to authenticated;
grant select on table public.story_moderation to authenticated;
grant select on table public.story_publications to anon, authenticated;

revoke all on function private.is_story_participant_v1(uuid, uuid) from public, anon, authenticated, service_role;
revoke all on function private.is_story_moderator_v1(uuid) from public, anon, authenticated, service_role;
revoke all on function private.story_content_is_safe_v1(text, text) from public, anon, authenticated, service_role;
revoke all on function private.story_has_active_dispute_v1(uuid) from public, anon, authenticated, service_role;
revoke all on function private.suppress_stories_for_dispute_v1() from public, anon, authenticated, service_role;

revoke all on function public.create_story_draft_v1(uuid, text, text) from public, anon, authenticated, service_role;
revoke all on function public.save_story_revision_v1(uuid, integer, text, text) from public, anon, authenticated, service_role;
revoke all on function public.set_story_consent_v1(uuid, integer, boolean) from public, anon, authenticated, service_role;
revoke all on function public.moderate_story_revision_v1(uuid, integer, boolean, text) from public, anon, authenticated, service_role;
revoke all on function public.publish_story_revision_v1(uuid, integer, text) from public, anon, authenticated, service_role;

grant execute on function public.create_story_draft_v1(uuid, text, text) to authenticated;
grant execute on function public.save_story_revision_v1(uuid, integer, text, text) to authenticated;
grant execute on function public.set_story_consent_v1(uuid, integer, boolean) to authenticated;
grant execute on function public.moderate_story_revision_v1(uuid, integer, boolean, text) to authenticated, service_role;
grant execute on function public.publish_story_revision_v1(uuid, integer, text) to authenticated;

comment on table public.stories is 'Private Story workflow tied to one completed Swap. Public publication requires revision-bound consent, moderation and no active dispute.';
comment on table public.story_revisions is 'Immutable Story content revisions. Editing creates a new revision and resets consent and moderation.';
comment on table public.story_consents is 'Explicit per-participant consent bound to one Story revision. Withdrawal hides any public snapshot.';
comment on table public.story_publications is 'Public Story snapshot containing approved content only; participant identities and private swap data are intentionally absent.';
