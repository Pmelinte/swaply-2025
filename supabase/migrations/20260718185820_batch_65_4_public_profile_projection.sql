-- Batch 65.4 — privacy-minimized public and participant profile projection.
--
-- This migration is additive. It preserves the existing public_profiles table
-- shape, adds an explicit public/private marker, and rebuilds projected values
-- from owner visibility choices. It does not revoke the legacy authenticated
-- profiles UPDATE path; that remains a later Batch 65 gate.

begin;

alter table public.public_profiles
  add column if not exists is_public boolean not null default true;

create index if not exists public_profiles_is_public_idx
  on public.public_profiles (is_public)
  where is_public;

create or replace function public.profile_identity_allowed_v1(
  p_target_user_id uuid
) returns boolean
language plpgsql
stable
security definer
set search_path = pg_catalog, public
as $function$
declare
  v_actor_id uuid := auth.uid();
begin
  if v_actor_id is null or p_target_user_id is null then
    return false;
  end if;

  if v_actor_id = p_target_user_id then
    return true;
  end if;

  if exists (
    select 1
    from public.user_roles r
    where r.user_id = v_actor_id
      and r.role in ('moderator', 'admin')
  ) then
    return true;
  end if;

  if exists (
    select 1
    from public.swaps s
    where (s.requester_id = v_actor_id and s.responder_id = p_target_user_id)
       or (s.responder_id = v_actor_id and s.requester_id = p_target_user_id)
  ) then
    return true;
  end if;

  if exists (
    select 1
    from public.conversations c
    where c.participant_ids @> array[v_actor_id, p_target_user_id]::uuid[]
  ) then
    return true;
  end if;

  if exists (
    select 1
    from public.matches m
    where (m.initiator_id = v_actor_id and m.target_user_id = p_target_user_id)
       or (m.target_user_id = v_actor_id and m.initiator_id = p_target_user_id)
  ) then
    return true;
  end if;

  return false;
end;
$function$;

revoke execute on function public.profile_identity_allowed_v1(uuid)
  from public;
grant execute on function public.profile_identity_allowed_v1(uuid)
  to anon, authenticated, service_role;

create or replace function public.sync_public_profile()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $function$
declare
  v_city text;
  v_country text;
  v_is_public boolean;
  v_show_bio boolean;
  v_show_interests boolean;
  v_show_occupation boolean;
  v_show_website boolean;
  v_show_social_links boolean;
  v_show_last_seen boolean;
  v_public_location jsonb;
  v_public_location_text text;
begin
  if tg_op = 'DELETE' then
    delete from public.public_profiles where user_id = old.user_id;
    return old;
  end if;

  if new.is_banned
    or (new.is_suspended and coalesce(new.suspended_until, 'infinity') >= now())
  then
    delete from public.public_profiles where user_id = new.user_id;
    return new;
  end if;

  v_is_public := case lower(coalesce(new.visibility ->> 'publicProfile', 'true'))
    when 'false' then false
    else true
  end;
  v_show_bio := lower(coalesce(new.visibility ->> 'showBio', 'false')) = 'true';
  v_show_interests := lower(coalesce(new.visibility ->> 'showInterests', 'false')) = 'true';
  v_show_occupation := lower(coalesce(new.visibility ->> 'showOccupation', 'false')) = 'true';
  v_show_website := lower(coalesce(new.visibility ->> 'showWebsite', 'false')) = 'true';
  v_show_social_links := lower(coalesce(new.visibility ->> 'showSocialLinks', 'false')) = 'true';
  v_show_last_seen := lower(coalesce(new.visibility ->> 'showLastSeen', 'true')) <> 'false';

  v_city := coalesce(
    nullif(new.location ->> 'city', ''),
    nullif(new.address_city, '')
  );
  v_country := coalesce(
    nullif(new.location ->> 'country', ''),
    nullif(new.address_country, '')
  );

  v_public_location := case
    when v_is_public then jsonb_strip_nulls(jsonb_build_object(
      'city', v_city,
      'country', v_country
    ))
    else '{}'::jsonb
  end;

  v_public_location_text := case
    when v_is_public then nullif(concat_ws(', ', v_city, v_country), '')
    else null
  end;

  insert into public.public_profiles (
    user_id,
    username,
    display_name,
    avatar_url,
    bio,
    location_text,
    location,
    badge,
    languages,
    rating,
    rating_count,
    trust_level,
    trust_score,
    id_verified,
    phone_verified,
    swaps_completed,
    response_time_avg_h,
    response_rate_pct,
    last_active_at,
    swap_intent,
    swap_context,
    swap_geo_range,
    open_to_types,
    affinity_groups,
    interests,
    occupation,
    website_url,
    social_links,
    profile_completeness,
    event_badges,
    created_at,
    is_public
  ) values (
    new.user_id,
    new.username,
    new.display_name,
    new.avatar_url,
    case when v_is_public and v_show_bio then new.bio else null end,
    v_public_location_text,
    v_public_location,
    new.badge,
    array_remove(
      array[new.primary_language, new.secondary_language, new.tertiary_language],
      null
    ),
    new.rating,
    new.rating_count,
    new.trust_level,
    new.trust_score,
    new.id_verified,
    new.phone_verified,
    new.swaps_completed,
    case when v_is_public then new.response_time_avg_h else null end,
    case when v_is_public then new.response_rate_pct else null end,
    case when v_is_public and v_show_last_seen then new.last_active_at else null end,
    null,
    null,
    null,
    null,
    case when v_is_public and v_show_interests then new.affinity_groups else null end,
    case when v_is_public and v_show_interests then new.interests else null end,
    case when v_is_public and v_show_occupation then new.occupation else null end,
    case when v_is_public and v_show_website then new.website_url else null end,
    case when v_is_public and v_show_social_links then new.social_links else null end,
    case when v_is_public then new.profile_completeness else null end,
    case when v_is_public then new.event_badges else null end,
    new.created_at,
    v_is_public
  )
  on conflict (user_id) do update set
    username = excluded.username,
    display_name = excluded.display_name,
    avatar_url = excluded.avatar_url,
    bio = excluded.bio,
    location_text = excluded.location_text,
    location = excluded.location,
    badge = excluded.badge,
    languages = excluded.languages,
    rating = excluded.rating,
    rating_count = excluded.rating_count,
    trust_level = excluded.trust_level,
    trust_score = excluded.trust_score,
    id_verified = excluded.id_verified,
    phone_verified = excluded.phone_verified,
    swaps_completed = excluded.swaps_completed,
    response_time_avg_h = excluded.response_time_avg_h,
    response_rate_pct = excluded.response_rate_pct,
    last_active_at = excluded.last_active_at,
    swap_intent = excluded.swap_intent,
    swap_context = excluded.swap_context,
    swap_geo_range = excluded.swap_geo_range,
    open_to_types = excluded.open_to_types,
    affinity_groups = excluded.affinity_groups,
    interests = excluded.interests,
    occupation = excluded.occupation,
    website_url = excluded.website_url,
    social_links = excluded.social_links,
    profile_completeness = excluded.profile_completeness,
    event_badges = excluded.event_badges,
    created_at = excluded.created_at,
    is_public = excluded.is_public;

  return new;
end;
$function$;

revoke execute on function public.sync_public_profile()
  from public, anon, authenticated;

revoke all on table public.public_profiles from anon, authenticated;
grant select on table public.public_profiles to anon, authenticated;
grant all on table public.public_profiles to service_role;

alter table public.public_profiles enable row level security;

drop policy if exists public_profiles_read on public.public_profiles;
create policy public_profiles_read
  on public.public_profiles
  for select
  to anon, authenticated
  using (
    is_public
    or public.profile_identity_allowed_v1(user_id)
  );

-- Re-run the existing projection trigger without changing owner profile values.
update public.profiles
set updated_at = updated_at;

commit;
