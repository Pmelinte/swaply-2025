-- V1-07.8 — Blog feedback and suggestion authority
-- Forward-only migration. Contributions never publish Blog content or modify Trust/Swapleni directly.

create table if not exists public.blog_contributions (
  id uuid primary key default gen_random_uuid(),
  blog_post_id uuid references public.blog_posts(id) on delete set null,
  contributor_id uuid not null references public.profiles(user_id) on delete cascade,
  contribution_type text not null check (contribution_type in ('feedback', 'suggestion')),
  subject text not null check (char_length(subject) between 3 and 160),
  body text not null check (char_length(body) between 10 and 5000),
  locale text not null default 'en' check (char_length(locale) between 2 and 16),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'withdrawn')),
  revision integer not null default 1 check (revision > 0),
  idempotency_key text not null check (char_length(idempotency_key) between 8 and 200),
  request_hash text not null,
  moderation_notes text,
  moderated_by uuid references public.profiles(user_id) on delete set null,
  moderated_at timestamptz,
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  unique (contributor_id, idempotency_key)
);

create index if not exists blog_contributions_post_idx
  on public.blog_contributions (blog_post_id, status, created_at desc);
create index if not exists blog_contributions_contributor_idx
  on public.blog_contributions (contributor_id, created_at desc);

alter table public.blog_contributions enable row level security;

drop policy if exists blog_contributions_owner_read on public.blog_contributions;
create policy blog_contributions_owner_read
on public.blog_contributions
for select
to authenticated
using (contributor_id = auth.uid());

create or replace function public.require_blog_contribution_authority_v1()
returns trigger
language plpgsql
set search_path = pg_catalog, pg_temp
as $$
declare
  v_authority text := pg_catalog.current_setting('swaply.blog_contribution_authority', true);
begin
  if tg_op = 'INSERT' and v_authority is distinct from 'submit_blog_contribution_v1' then
    raise exception 'Direct Blog contribution inserts are forbidden' using errcode = '42501';
  end if;

  if tg_op = 'UPDATE'
     and v_authority not in ('moderate_blog_contribution_v1', 'withdraw_blog_contribution_v1') then
    raise exception 'Direct Blog contribution updates are forbidden' using errcode = '42501';
  end if;

  if tg_op = 'DELETE' then
    raise exception 'Blog contribution history is immutable' using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists require_blog_contribution_authority_trigger on public.blog_contributions;
create trigger require_blog_contribution_authority_trigger
before insert or update or delete on public.blog_contributions
for each row execute function public.require_blog_contribution_authority_v1();

create or replace function public.submit_blog_contribution_v1(
  p_blog_post_id uuid,
  p_contribution_type text,
  p_subject text,
  p_body text,
  p_locale text,
  p_idempotency_key text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
declare
  v_actor_id uuid := auth.uid();
  v_type text := pg_catalog.lower(pg_catalog.btrim(coalesce(p_contribution_type, '')));
  v_subject text := pg_catalog.btrim(coalesce(p_subject, ''));
  v_body text := pg_catalog.btrim(coalesce(p_body, ''));
  v_locale text := pg_catalog.lower(pg_catalog.btrim(coalesce(p_locale, 'en')));
  v_key text := pg_catalog.btrim(coalesce(p_idempotency_key, ''));
  v_hash text;
  v_existing public.blog_contributions%rowtype;
  v_contribution public.blog_contributions%rowtype;
begin
  if v_actor_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if v_type not in ('feedback', 'suggestion')
     or char_length(v_subject) not between 3 and 160
     or char_length(v_body) not between 10 and 5000
     or char_length(v_locale) not between 2 and 16
     or char_length(v_key) not between 8 and 200 then
    raise exception 'Invalid Blog contribution input' using errcode = '22023';
  end if;

  if p_blog_post_id is not null and not exists (
    select 1
    from public.blog_posts
    where id = p_blog_post_id
      and editorial_status = 'published'
      and published is true
  ) then
    raise exception 'Published Blog post not found' using errcode = 'P0002';
  end if;

  v_hash := pg_catalog.md5(
    pg_catalog.jsonb_build_object(
      'blog_post_id', p_blog_post_id,
      'contributor_id', v_actor_id,
      'contribution_type', v_type,
      'subject', v_subject,
      'body', v_body,
      'locale', v_locale
    )::text
  );

  select * into v_existing
  from public.blog_contributions
  where contributor_id = v_actor_id
    and idempotency_key = v_key;

  if found then
    if v_existing.request_hash is distinct from v_hash then
      raise exception 'Blog contribution idempotency conflict' using errcode = '23505';
    end if;

    return pg_catalog.jsonb_build_object(
      'contribution', pg_catalog.to_jsonb(v_existing),
      'replayed', true,
      'idempotency_key', v_key
    );
  end if;

  perform pg_catalog.set_config(
    'swaply.blog_contribution_authority',
    'submit_blog_contribution_v1',
    true
  );

  insert into public.blog_contributions (
    blog_post_id,
    contributor_id,
    contribution_type,
    subject,
    body,
    locale,
    idempotency_key,
    request_hash
  ) values (
    p_blog_post_id,
    v_actor_id,
    v_type,
    v_subject,
    v_body,
    v_locale,
    v_key,
    v_hash
  )
  returning * into v_contribution;

  perform pg_catalog.set_config('swaply.blog_contribution_authority', '', true);

  return pg_catalog.jsonb_build_object(
    'contribution', pg_catalog.to_jsonb(v_contribution),
    'replayed', false,
    'idempotency_key', v_key
  );
end;
$$;

create or replace function public.moderate_blog_contribution_v1(
  p_contribution_id uuid,
  p_expected_revision integer,
  p_target_status text,
  p_notes text default null
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
declare
  v_target text := pg_catalog.lower(pg_catalog.btrim(coalesce(p_target_status, '')));
  v_notes text := nullif(pg_catalog.btrim(coalesce(p_notes, '')), '');
  v_contribution public.blog_contributions%rowtype;
begin
  if auth.role() <> 'service_role' then
    raise exception 'Blog contribution moderation forbidden' using errcode = '42501';
  end if;

  if p_contribution_id is null
     or p_expected_revision is null
     or p_expected_revision < 1
     or v_target not in ('approved', 'rejected')
     or char_length(coalesce(v_notes, '')) > 2000 then
    raise exception 'Invalid Blog contribution moderation input' using errcode = '22023';
  end if;

  select * into v_contribution
  from public.blog_contributions
  where id = p_contribution_id
  for update;

  if not found then
    raise exception 'Blog contribution not found' using errcode = 'P0002';
  end if;

  if v_contribution.status = v_target
     and v_contribution.revision in (p_expected_revision, p_expected_revision + 1) then
    return pg_catalog.jsonb_build_object(
      'contribution', pg_catalog.to_jsonb(v_contribution),
      'replayed', true
    );
  end if;

  if v_contribution.revision is distinct from p_expected_revision then
    raise exception 'Blog contribution stale revision' using errcode = '40001';
  end if;

  if v_contribution.status <> 'pending' then
    raise exception 'Blog contribution invalid transition' using errcode = '22023';
  end if;

  perform pg_catalog.set_config(
    'swaply.blog_contribution_authority',
    'moderate_blog_contribution_v1',
    true
  );

  update public.blog_contributions
  set status = v_target,
      revision = revision + 1,
      moderation_notes = v_notes,
      moderated_by = auth.uid(),
      moderated_at = pg_catalog.clock_timestamp(),
      updated_at = pg_catalog.clock_timestamp()
  where id = p_contribution_id
  returning * into v_contribution;

  perform pg_catalog.set_config('swaply.blog_contribution_authority', '', true);

  return pg_catalog.jsonb_build_object(
    'contribution', pg_catalog.to_jsonb(v_contribution),
    'replayed', false
  );
end;
$$;

create or replace function public.withdraw_blog_contribution_v1(
  p_contribution_id uuid,
  p_expected_revision integer
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
declare
  v_actor_id uuid := auth.uid();
  v_contribution public.blog_contributions%rowtype;
begin
  if v_actor_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if p_contribution_id is null or p_expected_revision is null or p_expected_revision < 1 then
    raise exception 'Invalid Blog contribution withdrawal input' using errcode = '22023';
  end if;

  select * into v_contribution
  from public.blog_contributions
  where id = p_contribution_id
  for update;

  if not found then
    raise exception 'Blog contribution not found' using errcode = 'P0002';
  end if;

  if v_contribution.contributor_id <> v_actor_id then
    raise exception 'Only the contributor may withdraw' using errcode = '42501';
  end if;

  if v_contribution.status = 'withdrawn'
     and v_contribution.revision in (p_expected_revision, p_expected_revision + 1) then
    return pg_catalog.jsonb_build_object(
      'contribution', pg_catalog.to_jsonb(v_contribution),
      'replayed', true
    );
  end if;

  if v_contribution.revision is distinct from p_expected_revision then
    raise exception 'Blog contribution stale revision' using errcode = '40001';
  end if;

  if v_contribution.status not in ('pending', 'approved') then
    raise exception 'Blog contribution invalid withdrawal' using errcode = '22023';
  end if;

  perform pg_catalog.set_config(
    'swaply.blog_contribution_authority',
    'withdraw_blog_contribution_v1',
    true
  );

  update public.blog_contributions
  set status = 'withdrawn',
      revision = revision + 1,
      updated_at = pg_catalog.clock_timestamp()
  where id = p_contribution_id
  returning * into v_contribution;

  perform pg_catalog.set_config('swaply.blog_contribution_authority', '', true);

  return pg_catalog.jsonb_build_object(
    'contribution', pg_catalog.to_jsonb(v_contribution),
    'replayed', false
  );
end;
$$;

revoke all on table public.blog_contributions from public, anon;
revoke insert, update, delete on table public.blog_contributions from authenticated;
grant select on table public.blog_contributions to authenticated;

revoke all on function public.require_blog_contribution_authority_v1() from public, anon, authenticated, service_role;
revoke all on function public.submit_blog_contribution_v1(uuid, text, text, text, text, text) from public, anon;
grant execute on function public.submit_blog_contribution_v1(uuid, text, text, text, text, text) to authenticated;
revoke all on function public.moderate_blog_contribution_v1(uuid, integer, text, text) from public, anon, authenticated;
grant execute on function public.moderate_blog_contribution_v1(uuid, integer, text, text) to service_role;
revoke all on function public.withdraw_blog_contribution_v1(uuid, integer) from public, anon;
grant execute on function public.withdraw_blog_contribution_v1(uuid, integer) to authenticated;

comment on table public.blog_contributions is
  'Authenticated Blog feedback and suggestions with owner-only read, server moderation and immutable history.';
