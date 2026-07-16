-- Batch 65.1 — corrective profile bootstrap, participant projection and
-- idempotency-retention contract.
--
-- This migration is additive. It does not rewrite prior migration history.

begin;

-- ---------------------------------------------------------------------------
-- Participant-aware public projection
-- ---------------------------------------------------------------------------

alter table public.public_profiles
  add column if not exists is_public boolean not null default true;

create or replace function public.profile_identity_allowed_v1(p_target_user_id uuid)
returns boolean
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

revoke execute on function public.profile_identity_allowed_v1(uuid) from public;
grant execute on function public.profile_identity_allowed_v1(uuid) to anon, authenticated, service_role;

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

  v_is_public := coalesce((new.visibility ->> 'publicProfile')::boolean, true);
  v_city := coalesce(nullif(new.location ->> 'city', ''), nullif(new.address_city, ''));
  v_country := coalesce(nullif(new.location ->> 'country', ''), nullif(new.address_country, ''));

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
    user_type,
    availability_status,
    is_public
  ) values (
    new.user_id,
    new.username,
    new.display_name,
    new.avatar_url,
    case
      when v_is_public and new.visibility @> '{"showBio": true}'::jsonb
      then new.bio
      else null
    end,
    v_public_location_text,
    v_public_location,
    new.badge,
    array_remove(array[new.primary_language, new.secondary_language, new.tertiary_language], null),
    new.rating,
    new.rating_count,
    new.trust_level,
    new.trust_score,
    new.id_verified,
    new.phone_verified,
    new.swaps_completed,
    case when v_is_public then new.response_time_avg_h else null end,
    case when v_is_public then new.response_rate_pct else null end,
    case
      when v_is_public
        and coalesce((new.visibility ->> 'showLastSeen')::boolean, true)
      then new.last_active_at
      else null
    end,
    null,
    null,
    null,
    null,
    case
      when v_is_public and new.visibility @> '{"showInterests": true}'::jsonb
      then new.affinity_groups
      else null
    end,
    case
      when v_is_public and new.visibility @> '{"showInterests": true}'::jsonb
      then new.interests
      else null
    end,
    case
      when v_is_public and new.visibility @> '{"showOccupation": true}'::jsonb
      then new.occupation
      else null
    end,
    case
      when v_is_public and new.visibility @> '{"showWebsite": true}'::jsonb
      then new.website_url
      else null
    end,
    case
      when v_is_public and new.visibility @> '{"showSocialLinks": true}'::jsonb
      then new.social_links
      else null
    end,
    case when v_is_public then new.profile_completeness else null end,
    case when v_is_public then new.event_badges else null end,
    new.created_at,
    null,
    null,
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
    user_type = excluded.user_type,
    availability_status = excluded.availability_status,
    is_public = excluded.is_public;

  return new;
end;
$function$;

revoke execute on function public.sync_public_profile() from public, anon, authenticated;

drop policy if exists public_profiles_read on public.public_profiles;
create policy public_profiles_read
on public.public_profiles
for select
to anon, authenticated
using (
  is_public
  or public.profile_identity_allowed_v1(user_id)
);

-- Rebuild the projection under the corrected privacy contract.
update public.profiles set updated_at = updated_at;

-- ---------------------------------------------------------------------------
-- Deterministic owner profile bootstrap
-- ---------------------------------------------------------------------------

create or replace function public.ensure_own_profile_v1(p_route_locale text default null)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $function$
declare
  v_actor_id uuid := auth.uid();
  v_auth_user auth.users%rowtype;
  v_locale text;
  v_display_name text;
  v_username text;
  v_inserted_id uuid;
  v_profile public.profiles%rowtype;
begin
  if v_actor_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  select *
  into v_auth_user
  from auth.users
  where id = v_actor_id;

  if not found then
    raise exception 'Authenticated user not found' using errcode = 'P0002';
  end if;

  v_locale := coalesce(
    public.normalize_swaply_locale(p_route_locale),
    public.normalize_swaply_locale(v_auth_user.raw_user_meta_data ->> 'language'),
    'en'
  );

  v_display_name := coalesce(
    nullif(btrim(v_auth_user.raw_user_meta_data ->> 'full_name'), ''),
    nullif(btrim(split_part(coalesce(v_auth_user.email, ''), '@', 1)), ''),
    'Swaply User'
  );

  v_username := 'user_' || replace(v_actor_id::text, '-', '');

  insert into public.profiles (
    user_id,
    username,
    email,
    full_name,
    display_name,
    languages,
    preferred_locale,
    primary_language,
    secondary_language,
    tertiary_language,
    auto_translate_messages,
    show_original_language,
    profile_revision,
    user_type,
    availability_status,
    timezone,
    location,
    visibility,
    notifications,
    swap_preferences,
    security,
    stats,
    preferences
  ) values (
    v_actor_id,
    v_username,
    v_auth_user.email,
    v_display_name,
    v_display_name,
    array[v_locale],
    v_locale,
    v_locale,
    null,
    null,
    true,
    false,
    1,
    'individual',
    'available',
    'UTC',
    '{}'::jsonb,
    '{"publicProfile":true,"itemsVisibility":"public","showExactLocation":false,"showLastSeen":true,"showBio":false,"showInterests":false,"showOccupation":false,"showWebsite":false,"showSocialLinks":false}'::jsonb,
    '{}'::jsonb,
    '{}'::jsonb,
    '{}'::jsonb,
    '{}'::jsonb,
    '{}'::jsonb
  )
  on conflict (user_id) do nothing
  returning user_id into v_inserted_id;

  select *
  into v_profile
  from public.profiles
  where user_id = v_actor_id;

  if not found then
    raise exception 'Profile bootstrap failed' using errcode = 'P0002';
  end if;

  return jsonb_build_object(
    'created', v_inserted_id is not null,
    'profile_revision', v_profile.profile_revision,
    'profile', to_jsonb(v_profile)
  );
end;
$function$;

revoke execute on function public.ensure_own_profile_v1(text) from public, anon;
grant execute on function public.ensure_own_profile_v1(text) to authenticated;

create or replace function public.bootstrap_profile_from_auth_user_v1()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $function$
declare
  v_locale text;
  v_display_name text;
  v_username text;
begin
  v_locale := coalesce(
    public.normalize_swaply_locale(new.raw_user_meta_data ->> 'language'),
    'en'
  );

  v_display_name := coalesce(
    nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''),
    nullif(btrim(split_part(coalesce(new.email, ''), '@', 1)), ''),
    'Swaply User'
  );

  v_username := 'user_' || replace(new.id::text, '-', '');

  insert into public.profiles (
    user_id,
    username,
    email,
    full_name,
    display_name,
    languages,
    preferred_locale,
    primary_language,
    profile_revision,
    user_type,
    availability_status,
    timezone,
    location,
    visibility,
    notifications,
    swap_preferences,
    security,
    stats,
    preferences
  ) values (
    new.id,
    v_username,
    new.email,
    v_display_name,
    v_display_name,
    array[v_locale],
    v_locale,
    v_locale,
    1,
    'individual',
    'available',
    'UTC',
    '{}'::jsonb,
    '{"publicProfile":true,"itemsVisibility":"public","showExactLocation":false,"showLastSeen":true,"showBio":false,"showInterests":false,"showOccupation":false,"showWebsite":false,"showSocialLinks":false}'::jsonb,
    '{}'::jsonb,
    '{}'::jsonb,
    '{}'::jsonb,
    '{}'::jsonb,
    '{}'::jsonb
  )
  on conflict (user_id) do nothing;

  return new;
end;
$function$;

revoke execute on function public.bootstrap_profile_from_auth_user_v1()
  from public, anon, authenticated;

drop trigger if exists batch_65_profile_bootstrap_after_auth_insert on auth.users;
create trigger batch_65_profile_bootstrap_after_auth_insert
after insert on auth.users
for each row execute function public.bootstrap_profile_from_auth_user_v1();

-- Repair all pre-existing Auth users that do not yet have a profile.
insert into public.profiles (
  user_id,
  username,
  email,
  full_name,
  display_name,
  languages,
  preferred_locale,
  primary_language,
  profile_revision,
  user_type,
  availability_status,
  timezone,
  location,
  visibility,
  notifications,
  swap_preferences,
  security,
  stats,
  preferences
)
select
  u.id,
  'user_' || replace(u.id::text, '-', ''),
  u.email,
  coalesce(
    nullif(btrim(u.raw_user_meta_data ->> 'full_name'), ''),
    nullif(btrim(split_part(coalesce(u.email, ''), '@', 1)), ''),
    'Swaply User'
  ),
  coalesce(
    nullif(btrim(u.raw_user_meta_data ->> 'full_name'), ''),
    nullif(btrim(split_part(coalesce(u.email, ''), '@', 1)), ''),
    'Swaply User'
  ),
  array[coalesce(public.normalize_swaply_locale(u.raw_user_meta_data ->> 'language'), 'en')],
  coalesce(public.normalize_swaply_locale(u.raw_user_meta_data ->> 'language'), 'en'),
  coalesce(public.normalize_swaply_locale(u.raw_user_meta_data ->> 'language'), 'en'),
  1,
  'individual',
  'available',
  'UTC',
  '{}'::jsonb,
  '{"publicProfile":true,"itemsVisibility":"public","showExactLocation":false,"showLastSeen":true,"showBio":false,"showInterests":false,"showOccupation":false,"showWebsite":false,"showSocialLinks":false}'::jsonb,
  '{}'::jsonb,
  '{}'::jsonb,
  '{}'::jsonb,
  '{}'::jsonb,
  '{}'::jsonb
from auth.users u
where not exists (
  select 1
  from public.profiles p
  where p.user_id = u.id
)
on conflict (user_id) do nothing;

-- The legacy browser bootstrap uses an INSERT ... ON CONFLICT form. Retain the
-- table-level UPDATE privilege required to parse that statement, while keeping
-- UPDATE impossible because no authenticated UPDATE RLS policy exists.
grant update on table public.profiles to authenticated;

-- ---------------------------------------------------------------------------
-- Bounded idempotency retention without duplicated profile snapshots
-- ---------------------------------------------------------------------------

alter table public.profile_update_requests
  add column if not exists expires_at timestamptz;

update public.profile_update_requests
set expires_at = coalesce(expires_at, created_at + interval '24 hours');

alter table public.profile_update_requests
  alter column expires_at set default (now() + interval '24 hours'),
  alter column expires_at set not null;

create index if not exists profile_update_requests_expires_at_idx
  on public.profile_update_requests (expires_at);

do $rename_core$
begin
  if to_regprocedure('public.update_own_profile_core_v1(bigint,jsonb,text)') is null then
    alter function public.update_own_profile_v1(bigint, jsonb, text)
      rename to update_own_profile_core_v1;
  end if;
end;
$rename_core$;

revoke execute on function public.update_own_profile_core_v1(bigint, jsonb, text)
  from public, anon, authenticated;

-- Existing responses are reduced before the wrapper becomes authoritative.
update public.profile_update_requests
set response = case
  when result_revision is null then null
  else jsonb_build_object('profile_revision', result_revision)
end;

delete from public.profile_update_requests
where expires_at < now();

create or replace function public.update_own_profile_v1(
  p_expected_revision bigint,
  p_payload jsonb,
  p_idempotency_key text
) returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $function$
declare
  v_actor_id uuid := auth.uid();
  v_result jsonb;
  v_profile public.profiles%rowtype;
  v_original_revision bigint;
begin
  if v_actor_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  delete from public.profile_update_requests
  where actor_id = v_actor_id
    and expires_at < now();

  v_result := public.update_own_profile_core_v1(
    p_expected_revision,
    p_payload,
    p_idempotency_key
  );

  v_original_revision := nullif(v_result ->> 'profile_revision', '')::bigint;

  if v_result ? 'profile' then
    update public.profile_update_requests
    set
      response = jsonb_build_object(
        'profile_revision', coalesce(result_revision, v_original_revision)
      ),
      expires_at = now() + interval '24 hours'
    where actor_id = v_actor_id
      and idempotency_key = btrim(p_idempotency_key);

    return v_result;
  end if;

  select *
  into v_profile
  from public.profiles
  where user_id = v_actor_id;

  if not found then
    raise exception 'Profile not found' using errcode = 'P0002';
  end if;

  return jsonb_build_object(
    'replayed', true,
    'profile_revision', v_profile.profile_revision,
    'idempotent_result_revision', coalesce(v_original_revision, v_profile.profile_revision),
    'profile', to_jsonb(v_profile)
  );
end;
$function$;

revoke execute on function public.update_own_profile_v1(bigint, jsonb, text)
  from public, anon;
grant execute on function public.update_own_profile_v1(bigint, jsonb, text)
  to authenticated;

comment on function public.ensure_own_profile_v1(text) is
  'Idempotently creates or returns the authenticated user profile with coherent canonical language fields.';
comment on function public.profile_identity_allowed_v1(uuid) is
  'Returns whether the authenticated actor may resolve minimal identity for a private profile.';
comment on function public.update_own_profile_v1(bigint, jsonb, text) is
  'Canonical CAS profile update wrapper with 24-hour idempotency retention and no duplicated profile snapshot.';
comment on column public.public_profiles.is_public is
  'True for public discovery rows. Private rows are visible only to owner, participant, moderator or admin through RLS.';
comment on column public.profile_update_requests.expires_at is
  'Idempotency retention deadline. Expired actor rows are pruned on the next profile update.';

commit;
