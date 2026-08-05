-- V1-07.6 — Blog editorial authority
-- Forward-only migration. Blog remains separate from Stories, feedback and rewards.

alter table public.blog_posts
  add column if not exists editorial_status text,
  add column if not exists revision integer not null default 1,
  add column if not exists published_at timestamptz,
  add column if not exists archived_at timestamptz;

update public.blog_posts
set editorial_status = case when published is true then 'published' else 'draft' end
where editorial_status is null;

alter table public.blog_posts
  alter column editorial_status set default 'draft',
  alter column editorial_status set not null;

alter table public.blog_posts
  drop constraint if exists blog_posts_editorial_status_check;

alter table public.blog_posts
  add constraint blog_posts_editorial_status_check
  check (editorial_status in ('draft', 'review', 'published', 'archived'));

update public.blog_posts
set published_at = coalesce(published_at, updated_at, created_at, now())
where editorial_status = 'published' and published_at is null;

create or replace function public.transition_blog_post_v1(
  p_post_id uuid,
  p_expected_revision integer,
  p_target_status text
)
returns public.blog_posts
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
declare
  v_post public.blog_posts;
  v_current_status text;
begin
  if auth.role() <> 'service_role' then
    raise exception 'blog_editorial_forbidden' using errcode = '42501';
  end if;

  if p_post_id is null then
    raise exception 'blog_editorial_post_id_required' using errcode = '22023';
  end if;

  if p_expected_revision is null or p_expected_revision < 1 then
    raise exception 'blog_editorial_invalid_revision' using errcode = '22023';
  end if;

  if p_target_status is null or p_target_status not in ('draft', 'review', 'published', 'archived') then
    raise exception 'blog_editorial_invalid_status' using errcode = '22023';
  end if;

  select * into v_post
  from public.blog_posts
  where id = p_post_id
  for update;

  if not found then
    raise exception 'blog_post_not_found' using errcode = 'P0002';
  end if;

  v_current_status := v_post.editorial_status;

  -- Idempotent same-state call and lost-response replay.
  if v_current_status = p_target_status
     and v_post.revision in (p_expected_revision, p_expected_revision + 1) then
    return v_post;
  end if;

  if v_post.revision is distinct from p_expected_revision then
    raise exception 'blog_editorial_stale_revision' using errcode = '40001';
  end if;

  if not (
    (v_current_status = 'draft' and p_target_status = 'review') or
    (v_current_status = 'review' and p_target_status in ('draft', 'published')) or
    (v_current_status = 'published' and p_target_status = 'archived') or
    (v_current_status = 'archived' and p_target_status = 'draft')
  ) then
    raise exception 'blog_editorial_invalid_transition' using errcode = '22023';
  end if;

  update public.blog_posts
  set editorial_status = p_target_status,
      revision = revision + 1,
      published = (p_target_status = 'published'),
      published_at = case
        when p_target_status = 'published' then coalesce(published_at, now())
        else published_at
      end,
      archived_at = case
        when p_target_status = 'archived' then now()
        when p_target_status = 'draft' then null
        else archived_at
      end,
      updated_at = now()
  where id = p_post_id
  returning * into v_post;

  return v_post;
end;
$$;

revoke all on function public.transition_blog_post_v1(uuid, integer, text) from public;
revoke all on function public.transition_blog_post_v1(uuid, integer, text) from anon;
revoke all on function public.transition_blog_post_v1(uuid, integer, text) from authenticated;
grant execute on function public.transition_blog_post_v1(uuid, integer, text) to service_role;

drop policy if exists blog_posts_public_read on public.blog_posts;
create policy blog_posts_public_read
on public.blog_posts
for select
to public
using (editorial_status = 'published' and published is true);

comment on function public.transition_blog_post_v1(uuid, integer, text) is
  'Service-role-only, revision-checked and idempotent Blog editorial transition authority.';
