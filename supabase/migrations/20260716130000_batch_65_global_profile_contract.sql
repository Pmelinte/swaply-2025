-- Batch 65 — global-first profile contract.
--
-- This migration is deliberately additive and idempotent. It reconciles the
-- language-preference migration that exists in repository history but is not
-- present in the current Production schema, establishes one revisioned profile
-- update authority, and keeps private profile data separate from public and
-- participant-only projections.

begin;

create or replace function public.normalize_swaply_locale(p_locale text)
returns text
language plpgsql
immutable
security invoker
set search_path = pg_catalog, public
as $function$
declare
  v_locale text;
  v_supported constant text[] := array[
    'en', 'ro', 'fr', 'de', 'es', 'it', 'pt', 'nl', 'pl', 'el',
    'hu', 'bg', 'cs', 'sk', 'hr', 'sl', 'sr', 'sv', 'da', 'fi',
    'no', 'lt', 'lv', 'et', 'ga', 'mt', 'ru', 'tr', 'ar', 'zh',
    'hi', 'bn', 'ja', 'ko', 'vi', 'th', 'id', 'ms', 'fil', 'fa',
    'mn', 'uk'
  ];
begin
  v_locale := lower(replace(btrim(coalesce(p_locale, '')), '_', '-'));

  if v_locale = '' then
    return null;
  end if;

  if v_locale = any(v_supported) then
    return v_locale;
  end if;

  v_locale := split_part(v_locale, '-', 1);
  if v_locale = any(v_supported) then
    return v_locale;
  end if;

  return null;
end;
$function$;

revoke execute on function public.normalize_swaply_locale(text) from public, anon;
grant execute on function public.normalize_swaply_locale(text) to authenticated, service_role;

alter table public.profiles
  add column if not exists primary_language text,
  add column if not exists secondary_language text,
  add column if not exists tertiary_language text,
  add column if not exists auto_translate_messages boolean not null default true,
  add column if not exists show_original_language boolean not null default false,
  add column if not exists profile_revision bigint not null default 1,
  add column if not exists user_type text not null default 'individual',
  add column if not exists availability_status text not null default 'available',
  add column if not exists timezone text not null default 'UTC';

-- Reconcile legacy locale arrays, preferred_locale and sparse Auth metadata.
-- Existing explicit values win. English is only the final technical fallback.
do $backfill$
declare
  r record;
  v_candidate text;
  v_primary text;
  v_secondary text;
  v_tertiary text;
  v_candidates text[];
begin
  for r in
    select
      p.user_id,
      p.primary_language,
      p.secondary_language,
      p.tertiary_language,
      p.preferred_locale,
      p.languages,
      p.visibility,
      u.raw_user_meta_data ->> 'language' as auth_language
    from public.profiles p
    left join auth.users u on u.id = p.user_id
  loop
    v_primary := null;
    v_secondary := null;
    v_tertiary := null;

    v_candidates := array_cat(
      array[r.primary_language, r.preferred_locale],
      array_cat(
        coalesce(r.languages, '{}'::text[]),
        array[r.auth_language, 'en']
      )
    );

    foreach v_candidate in array v_candidates loop
      v_candidate := public.normalize_swaply_locale(v_candidate);
      continue when v_candidate is null;
      v_primary := v_candidate;
      exit;
    end loop;

    foreach v_candidate in array array_cat(
      array[r.secondary_language],
      coalesce(r.languages, '{}'::text[])
    ) loop
      v_candidate := public.normalize_swaply_locale(v_candidate);
      continue when v_candidate is null or v_candidate = v_primary;
      v_secondary := v_candidate;
      exit;
    end loop;

    foreach v_candidate in array array_cat(
      array[r.tertiary_language],
      coalesce(r.languages, '{}'::text[])
    ) loop
      v_candidate := public.normalize_swaply_locale(v_candidate);
      continue when v_candidate is null
        or v_candidate = v_primary
        or v_candidate = v_secondary;
      v_tertiary := v_candidate;
      exit;
    end loop;

    update public.profiles
    set
      primary_language = coalesce(v_primary, 'en'),
      secondary_language = v_secondary,
      tertiary_language = v_tertiary,
      preferred_locale = coalesce(v_primary, 'en'),
      languages = array_remove(
        array[coalesce(v_primary, 'en'), v_secondary, v_tertiary],
        null
      ),
      profile_revision = greatest(coalesce(profile_revision, 1), 1),
      user_type = coalesce(nullif(user_type, ''), 'individual'),
      availability_status = coalesce(nullif(availability_status, ''), 'available'),
      timezone = coalesce(nullif(timezone, ''), 'UTC'),
      visibility = jsonb_build_object(
        'publicProfile', true,
        'itemsVisibility', 'public',
        'showExactLocation', false,
        'showLastSeen', true,
        'showBio', false,
        'showInterests', false,
        'showOccupation', false,
        'showWebsite', false,
        'showSocialLinks', false
      ) || coalesce(r.visibility, '{}'::jsonb)
    where user_id = r.user_id;
  end loop;
end;
$backfill$;

alter table public.profiles
  alter column primary_language set default 'en',
  alter column primary_language set not null,
  alter column languages set default array['en'::text],
  alter column languages set not null,
  alter column preferred_locale set default 'en';

do $constraints$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'profiles_primary_language_valid'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_primary_language_valid
      check (
        primary_language = public.normalize_swaply_locale(primary_language)
      );
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'profiles_secondary_language_valid'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_secondary_language_valid
      check (
        secondary_language is null
        or secondary_language = public.normalize_swaply_locale(secondary_language)
      );
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'profiles_tertiary_language_valid'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_tertiary_language_valid
      check (
        tertiary_language is null
        or tertiary_language = public.normalize_swaply_locale(tertiary_language)
      );
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'profiles_languages_distinct'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_languages_distinct
      check (
        (secondary_language is null or secondary_language <> primary_language)
        and (tertiary_language is null or tertiary_language <> primary_language)
        and (
          secondary_language is null
          or tertiary_language is null
          or secondary_language <> tertiary_language
        )
      );
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'profiles_revision_positive'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_revision_positive
      check (profile_revision >= 1);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'profiles_user_type_valid'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_user_type_valid
      check (user_type in ('individual', 'professional', 'organization'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'profiles_availability_status_valid'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_availability_status_valid
      check (availability_status in ('available', 'limited', 'away'));
  end if;
end;
$constraints$;

comment on column public.profiles.primary_language is
  'Canonical primary language used before every visible fallback.';
comment on column public.profiles.secondary_language is
  'Optional second language used before route, source and English fallback.';
comment on column public.profiles.tertiary_language is
  'Optional third language used before route, source and English fallback.';
comment on column public.profiles.auto_translate_messages is
  'Owner preference for automatic message translation. Original content remains stored.';
comment on column public.profiles.show_original_language is
  'Owner preference for showing original content together with a translation.';
comment on column public.profiles.profile_revision is
  'Monotonic compare-and-set revision controlled by update_own_profile_v1.';
comment on column public.profiles.user_type is
  'Cross-domain account type: individual, professional or organization.';
comment on column public.profiles.availability_status is
  'Shared high-level availability. Domain calendars remain domain-specific.';
comment on column public.profiles.timezone is
  'Private IANA timezone used for cross-domain scheduling.';

-- Public profile remains a server-maintained projection. Sensitive fields are
-- never copied, optional social fields require explicit visibility consent,
-- and publicProfile=false removes the row entirely.
alter table public.public_profiles
  add column if not exists user_type text,
  add column if not exists availability_status text;

create or replace function public.sync_public_profile()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $function$
declare
  v_city text;
  v_country text;
  v_public_location jsonb;
  v_public_location_text text;
begin
  if tg_op = 'DELETE' then
    delete from public.public_profiles where user_id = old.user_id;
    return old;
  end if;

  if new.is_banned
    or (new.is_suspended and coalesce(new.suspended_until, 'infinity') >= now())
    or coalesce((new.visibility ->> 'publicProfile')::boolean, true) = false
  then
    delete from public.public_profiles where user_id = new.user_id;
    return new;
  end if;

  v_city := coalesce(nullif(new.location ->> 'city', ''), nullif(new.address_city, ''));
  v_country := coalesce(nullif(new.location ->> 'country', ''), nullif(new.address_country, ''));
  v_public_location := jsonb_strip_nulls(jsonb_build_object(
    'city', v_city,
    'country', v_country
  ));
  v_public_location_text := nullif(concat_ws(', ', v_city, v_country), '');

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
    availability_status
  ) values (
    new.user_id,
    new.username,
    new.display_name,
    new.avatar_url,
    case when new.visibility @> '{"showBio": true}'::jsonb then new.bio else null end,
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
    new.response_time_avg_h,
    new.response_rate_pct,
    case
      when coalesce((new.visibility ->> 'showLastSeen')::boolean, true)
      then new.last_active_at
      else null
    end,
    new.swap_intent,
    new.swap_context,
    new.swap_geo_range,
    new.open_to_types,
    case when new.visibility @> '{"showInterests": true}'::jsonb then new.affinity_groups else null end,
    case when new.visibility @> '{"showInterests": true}'::jsonb then new.interests else null end,
    case when new.visibility @> '{"showOccupation": true}'::jsonb then new.occupation else null end,
    case when new.visibility @> '{"showWebsite": true}'::jsonb then new.website_url else null end,
    case when new.visibility @> '{"showSocialLinks": true}'::jsonb then new.social_links else null end,
    new.profile_completeness,
    new.event_badges,
    new.created_at,
    new.user_type,
    new.availability_status
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
    availability_status = excluded.availability_status;

  return new;
end;
$function$;

revoke execute on function public.sync_public_profile() from public, anon, authenticated;

-- Rebuild the projection through the canonical trigger without changing user
-- data or profile revisions.
update public.profiles set updated_at = updated_at;

create table if not exists public.profile_update_requests (
  actor_id uuid not null references auth.users(id) on delete cascade,
  idempotency_key text not null,
  payload_hash text not null,
  expected_revision bigint not null,
  result_revision bigint,
  response jsonb,
  created_at timestamptz not null default now(),
  primary key (actor_id, idempotency_key)
);

alter table public.profile_update_requests enable row level security;
revoke all on table public.profile_update_requests from public, anon, authenticated;
grant all on table public.profile_update_requests to service_role;

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
  v_profile public.profiles%rowtype;
  v_existing_request public.profile_update_requests%rowtype;
  v_payload_hash text;
  v_response jsonb;
  v_unknown_keys text[];
  v_unknown_visibility_keys text[];
  v_primary text;
  v_secondary text;
  v_tertiary text;
  v_user_type text;
  v_availability text;
  v_timezone text;
  v_allowed_keys constant text[] := array[
    'username', 'full_name', 'display_name', 'first_name', 'avatar_url', 'bio',
    'primary_language', 'secondary_language', 'tertiary_language',
    'auto_translate_messages', 'show_original_language',
    'location', 'location_text', 'visibility', 'notifications', 'swap_preferences',
    'swap_intent', 'swap_context', 'swap_geo_range', 'open_to_types',
    'date_of_birth', 'gender', 'nationality', 'address_line1', 'address_city',
    'address_country', 'address_postal_code', 'address_lat', 'address_lon',
    'website_url', 'social_links', 'affinity_groups', 'interests', 'occupation',
    'company', 'preferred_currency', 'dark_mode', 'user_type',
    'availability_status', 'timezone'
  ];
  v_allowed_visibility_keys constant text[] := array[
    'publicProfile', 'itemsVisibility', 'showExactLocation', 'showLastSeen',
    'showBio', 'showInterests', 'showOccupation', 'showWebsite', 'showSocialLinks'
  ];
begin
  if v_actor_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if p_expected_revision is null or p_expected_revision < 1 then
    raise exception 'A positive expected profile revision is required' using errcode = '22023';
  end if;

  p_idempotency_key := btrim(coalesce(p_idempotency_key, ''));
  if length(p_idempotency_key) < 8 or length(p_idempotency_key) > 120 then
    raise exception 'Invalid profile idempotency key' using errcode = '22023';
  end if;

  if p_payload is null or jsonb_typeof(p_payload) <> 'object' then
    raise exception 'Profile payload must be a JSON object' using errcode = '22023';
  end if;

  select array_agg(key order by key)
  into v_unknown_keys
  from jsonb_object_keys(p_payload) as payload_keys(key)
  where not (key = any(v_allowed_keys));

  if v_unknown_keys is not null then
    raise exception 'Unsupported profile fields: %', array_to_string(v_unknown_keys, ', ')
      using errcode = '22023';
  end if;

  if p_payload ? 'visibility' then
    if jsonb_typeof(p_payload -> 'visibility') <> 'object' then
      raise exception 'visibility must be a JSON object' using errcode = '22023';
    end if;

    select array_agg(key order by key)
    into v_unknown_visibility_keys
    from jsonb_object_keys(p_payload -> 'visibility') as visibility_keys(key)
    where not (key = any(v_allowed_visibility_keys));

    if v_unknown_visibility_keys is not null then
      raise exception 'Unsupported visibility fields: %', array_to_string(v_unknown_visibility_keys, ', ')
        using errcode = '22023';
    end if;
  end if;

  if p_payload ? 'location' and jsonb_typeof(p_payload -> 'location') <> 'object' then
    raise exception 'location must be a JSON object' using errcode = '22023';
  end if;

  if p_payload ? 'notifications' and jsonb_typeof(p_payload -> 'notifications') <> 'object' then
    raise exception 'notifications must be a JSON object' using errcode = '22023';
  end if;

  if p_payload ? 'swap_preferences' and jsonb_typeof(p_payload -> 'swap_preferences') <> 'object' then
    raise exception 'swap_preferences must be a JSON object' using errcode = '22023';
  end if;

  if p_payload ? 'social_links' and jsonb_typeof(p_payload -> 'social_links') <> 'object' then
    raise exception 'social_links must be a JSON object' using errcode = '22023';
  end if;

  if p_payload ? 'swap_context' and jsonb_typeof(p_payload -> 'swap_context') <> 'array' then
    raise exception 'swap_context must be a JSON array' using errcode = '22023';
  end if;

  if p_payload ? 'open_to_types' and jsonb_typeof(p_payload -> 'open_to_types') <> 'array' then
    raise exception 'open_to_types must be a JSON array' using errcode = '22023';
  end if;

  if p_payload ? 'affinity_groups' and jsonb_typeof(p_payload -> 'affinity_groups') <> 'array' then
    raise exception 'affinity_groups must be a JSON array' using errcode = '22023';
  end if;

  if p_payload ? 'interests' and jsonb_typeof(p_payload -> 'interests') <> 'array' then
    raise exception 'interests must be a JSON array' using errcode = '22023';
  end if;

  v_payload_hash := md5(p_payload::text);

  insert into public.profile_update_requests (
    actor_id,
    idempotency_key,
    payload_hash,
    expected_revision
  ) values (
    v_actor_id,
    p_idempotency_key,
    v_payload_hash,
    p_expected_revision
  )
  on conflict (actor_id, idempotency_key) do nothing;

  if not found then
    select *
    into v_existing_request
    from public.profile_update_requests
    where actor_id = v_actor_id
      and idempotency_key = p_idempotency_key;

    if v_existing_request.payload_hash <> v_payload_hash
      or v_existing_request.expected_revision <> p_expected_revision
    then
      raise exception 'Profile idempotency key conflict' using errcode = '23505';
    end if;

    if v_existing_request.response is null then
      raise exception 'Profile update replay is not complete' using errcode = '40001';
    end if;

    return jsonb_set(v_existing_request.response, '{replayed}', 'true'::jsonb, true);
  end if;

  select *
  into v_profile
  from public.profiles
  where user_id = v_actor_id
  for update;

  if not found then
    raise exception 'Profile not found' using errcode = 'P0002';
  end if;

  if v_profile.profile_revision <> p_expected_revision then
    raise exception 'Stale profile revision: expected %, current %',
      p_expected_revision,
      v_profile.profile_revision
      using errcode = '40001';
  end if;

  v_primary := case
    when p_payload ? 'primary_language'
      then public.normalize_swaply_locale(p_payload ->> 'primary_language')
    else v_profile.primary_language
  end;
  v_secondary := case
    when p_payload ? 'secondary_language'
      then public.normalize_swaply_locale(p_payload ->> 'secondary_language')
    else v_profile.secondary_language
  end;
  v_tertiary := case
    when p_payload ? 'tertiary_language'
      then public.normalize_swaply_locale(p_payload ->> 'tertiary_language')
    else v_profile.tertiary_language
  end;

  if v_primary is null then
    raise exception 'A supported primary language is required' using errcode = '22023';
  end if;

  if v_secondary = v_primary
    or v_tertiary = v_primary
    or (v_secondary is not null and v_secondary = v_tertiary)
  then
    raise exception 'Profile languages must be distinct' using errcode = '23514';
  end if;

  v_user_type := case
    when p_payload ? 'user_type' then nullif(p_payload ->> 'user_type', '')
    else v_profile.user_type
  end;
  if v_user_type not in ('individual', 'professional', 'organization') then
    raise exception 'Invalid profile user type' using errcode = '22023';
  end if;

  v_availability := case
    when p_payload ? 'availability_status' then nullif(p_payload ->> 'availability_status', '')
    else v_profile.availability_status
  end;
  if v_availability not in ('available', 'limited', 'away') then
    raise exception 'Invalid profile availability status' using errcode = '22023';
  end if;

  v_timezone := case
    when p_payload ? 'timezone' then nullif(p_payload ->> 'timezone', '')
    else v_profile.timezone
  end;
  if v_timezone is null
    or not exists (select 1 from pg_timezone_names where name = v_timezone)
  then
    raise exception 'Invalid IANA timezone' using errcode = '22023';
  end if;

  if p_payload ? 'display_name'
    and length(btrim(coalesce(p_payload ->> 'display_name', ''))) not between 2 and 100
  then
    raise exception 'Display name must contain 2 to 100 characters' using errcode = '22023';
  end if;

  if p_payload ? 'username'
    and length(btrim(coalesce(p_payload ->> 'username', ''))) not between 3 and 50
  then
    raise exception 'Username must contain 3 to 50 characters' using errcode = '22023';
  end if;

  update public.profiles
  set
    username = case when p_payload ? 'username' then btrim(p_payload ->> 'username') else v_profile.username end,
    full_name = case when p_payload ? 'full_name' then nullif(btrim(p_payload ->> 'full_name'), '') else v_profile.full_name end,
    display_name = case when p_payload ? 'display_name' then btrim(p_payload ->> 'display_name') else v_profile.display_name end,
    first_name = case when p_payload ? 'first_name' then nullif(btrim(p_payload ->> 'first_name'), '') else v_profile.first_name end,
    avatar_url = case when p_payload ? 'avatar_url' then nullif(btrim(p_payload ->> 'avatar_url'), '') else v_profile.avatar_url end,
    bio = case when p_payload ? 'bio' then nullif(p_payload ->> 'bio', '') else v_profile.bio end,
    primary_language = v_primary,
    secondary_language = v_secondary,
    tertiary_language = v_tertiary,
    preferred_locale = v_primary,
    languages = array_remove(array[v_primary, v_secondary, v_tertiary], null),
    auto_translate_messages = case
      when p_payload ? 'auto_translate_messages'
        then (p_payload ->> 'auto_translate_messages')::boolean
      else v_profile.auto_translate_messages
    end,
    show_original_language = case
      when p_payload ? 'show_original_language'
        then (p_payload ->> 'show_original_language')::boolean
      else v_profile.show_original_language
    end,
    location = case
      when p_payload ? 'location'
        then coalesce(v_profile.location, '{}'::jsonb) || (p_payload -> 'location')
      else v_profile.location
    end,
    location_text = case
      when p_payload ? 'location_text' then nullif(btrim(p_payload ->> 'location_text'), '')
      when p_payload ? 'location' then nullif(concat_ws(
        ', ',
        nullif(p_payload -> 'location' ->> 'city', ''),
        nullif(p_payload -> 'location' ->> 'country', '')
      ), '')
      else v_profile.location_text
    end,
    visibility = case
      when p_payload ? 'visibility'
        then coalesce(v_profile.visibility, '{}'::jsonb) || (p_payload -> 'visibility')
      else v_profile.visibility
    end,
    notifications = case
      when p_payload ? 'notifications'
        then coalesce(v_profile.notifications, '{}'::jsonb) || (p_payload -> 'notifications')
      else v_profile.notifications
    end,
    swap_preferences = case
      when p_payload ? 'swap_preferences'
        then coalesce(v_profile.swap_preferences, '{}'::jsonb) || (p_payload -> 'swap_preferences')
      else v_profile.swap_preferences
    end,
    swap_intent = case when p_payload ? 'swap_intent' then nullif(p_payload ->> 'swap_intent', '') else v_profile.swap_intent end,
    swap_context = case
      when p_payload ? 'swap_context'
        then array(select jsonb_array_elements_text(p_payload -> 'swap_context'))
      else v_profile.swap_context
    end,
    swap_geo_range = case when p_payload ? 'swap_geo_range' then nullif(p_payload ->> 'swap_geo_range', '') else v_profile.swap_geo_range end,
    open_to_types = case
      when p_payload ? 'open_to_types'
        then array(select jsonb_array_elements_text(p_payload -> 'open_to_types'))
      else v_profile.open_to_types
    end,
    date_of_birth = case
      when p_payload ? 'date_of_birth' then nullif(p_payload ->> 'date_of_birth', '')::date
      else v_profile.date_of_birth
    end,
    gender = case when p_payload ? 'gender' then nullif(p_payload ->> 'gender', '') else v_profile.gender end,
    nationality = case when p_payload ? 'nationality' then upper(nullif(p_payload ->> 'nationality', '')) else v_profile.nationality end,
    address_line1 = case when p_payload ? 'address_line1' then nullif(p_payload ->> 'address_line1', '') else v_profile.address_line1 end,
    address_city = case when p_payload ? 'address_city' then nullif(p_payload ->> 'address_city', '') else v_profile.address_city end,
    address_country = case when p_payload ? 'address_country' then upper(nullif(p_payload ->> 'address_country', '')) else v_profile.address_country end,
    address_postal_code = case when p_payload ? 'address_postal_code' then nullif(p_payload ->> 'address_postal_code', '') else v_profile.address_postal_code end,
    address_lat = case when p_payload ? 'address_lat' then nullif(p_payload ->> 'address_lat', '')::numeric else v_profile.address_lat end,
    address_lon = case when p_payload ? 'address_lon' then nullif(p_payload ->> 'address_lon', '')::numeric else v_profile.address_lon end,
    website_url = case when p_payload ? 'website_url' then nullif(p_payload ->> 'website_url', '') else v_profile.website_url end,
    social_links = case
      when p_payload ? 'social_links'
        then coalesce(v_profile.social_links, '{}'::jsonb) || (p_payload -> 'social_links')
      else v_profile.social_links
    end,
    affinity_groups = case
      when p_payload ? 'affinity_groups'
        then array(select jsonb_array_elements_text(p_payload -> 'affinity_groups'))
      else v_profile.affinity_groups
    end,
    interests = case
      when p_payload ? 'interests'
        then array(select jsonb_array_elements_text(p_payload -> 'interests'))
      else v_profile.interests
    end,
    occupation = case when p_payload ? 'occupation' then nullif(p_payload ->> 'occupation', '') else v_profile.occupation end,
    company = case when p_payload ? 'company' then nullif(p_payload ->> 'company', '') else v_profile.company end,
    preferred_currency = case when p_payload ? 'preferred_currency' then upper(nullif(p_payload ->> 'preferred_currency', '')) else v_profile.preferred_currency end,
    dark_mode = case when p_payload ? 'dark_mode' then (p_payload ->> 'dark_mode')::boolean else v_profile.dark_mode end,
    user_type = v_user_type,
    availability_status = v_availability,
    timezone = v_timezone,
    profile_revision = v_profile.profile_revision + 1,
    updated_at = now()
  where user_id = v_actor_id
  returning * into v_profile;

  v_response := jsonb_build_object(
    'replayed', false,
    'profile_revision', v_profile.profile_revision,
    'profile', to_jsonb(v_profile)
  );

  update public.profile_update_requests
  set
    result_revision = v_profile.profile_revision,
    response = v_response
  where actor_id = v_actor_id
    and idempotency_key = p_idempotency_key;

  return v_response;
end;
$function$;

revoke execute on function public.update_own_profile_v1(bigint, jsonb, text)
  from public, anon;
grant execute on function public.update_own_profile_v1(bigint, jsonb, text)
  to authenticated;

comment on function public.update_own_profile_v1(bigint, jsonb, text) is
  'Canonical owner-only profile update authority with CAS and idempotent replay.';

-- Direct browser UPDATE is removed so stale-revision protection cannot be
-- bypassed. INSERT remains available for initial owner profile creation.
drop policy if exists update_own_profile on public.profiles;
revoke update on table public.profiles from authenticated;
grant select, insert, delete on table public.profiles to authenticated;

-- Private profiles remain absent from public discovery, while an authenticated
-- participant can resolve only the minimum identity needed to render existing
-- Match, Chat and Exchange history.
create or replace function public.get_profile_identity_v1(p_target_user_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = pg_catalog, public
as $function$
declare
  v_actor_id uuid := auth.uid();
  v_allowed boolean := false;
  v_identity jsonb;
begin
  if v_actor_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if p_target_user_id is null then
    raise exception 'Target user is required' using errcode = '22023';
  end if;

  v_allowed := v_actor_id = p_target_user_id
    or exists (
      select 1
      from public.user_roles r
      where r.user_id = v_actor_id
        and r.role in ('moderator', 'admin')
    )
    or exists (
      select 1
      from public.swaps s
      where (s.requester_id = v_actor_id and s.responder_id = p_target_user_id)
         or (s.responder_id = v_actor_id and s.requester_id = p_target_user_id)
    )
    or exists (
      select 1
      from public.conversations c
      where c.participant_ids @> array[v_actor_id, p_target_user_id]::uuid[]
    )
    or exists (
      select 1
      from public.matches m
      where (m.initiator_id = v_actor_id and m.target_user_id = p_target_user_id)
         or (m.target_user_id = v_actor_id and m.initiator_id = p_target_user_id)
    );

  if not v_allowed then
    raise exception 'Profile identity access denied' using errcode = '42501';
  end if;

  select jsonb_build_object(
    'user_id', p.user_id,
    'display_name', p.display_name,
    'avatar_url', p.avatar_url,
    'badge', p.badge,
    'languages', array_remove(array[p.primary_language, p.secondary_language, p.tertiary_language], null),
    'rating', p.rating,
    'rating_count', p.rating_count,
    'trust_level', p.trust_level,
    'id_verified', p.id_verified,
    'user_type', p.user_type,
    'availability_status', p.availability_status
  )
  into v_identity
  from public.profiles p
  where p.user_id = p_target_user_id;

  if v_identity is null then
    raise exception 'Profile not found' using errcode = 'P0002';
  end if;

  return v_identity;
end;
$function$;

revoke execute on function public.get_profile_identity_v1(uuid)
  from public, anon;
grant execute on function public.get_profile_identity_v1(uuid)
  to authenticated;

comment on function public.get_profile_identity_v1(uuid) is
  'Minimal participant/admin identity projection. Never returns email, DOB, exact location, payments, moderation or token fields.';

commit;
