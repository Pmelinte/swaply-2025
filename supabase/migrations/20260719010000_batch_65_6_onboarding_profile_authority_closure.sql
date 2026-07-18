-- Batch 65.6 — route onboarding through the revisioned owner profile authority.
--
-- The migration expands the existing owner RPC to cover every onboarding-owned
-- profile field, then removes direct authenticated INSERT/UPDATE access to the
-- base profile table. Existing rows and public read projections are preserved.
-- Existing validation, idempotency and concurrency guarantees remain intact.

begin;

create or replace function public.update_own_profile_v1(
  p_expected_revision bigint,
  p_payload jsonb,
  p_idempotency_key text
) returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $function$
declare
  v_user_id uuid := auth.uid();
  v_current public.profiles%rowtype;
  v_updated public.profiles%rowtype;
  v_existing public.profile_update_idempotency%rowtype;
  v_request_hash text;
  v_primary text;
  v_secondary text;
  v_tertiary text;
  v_languages text[];
  v_language text;
  v_normalized_language text;
  v_location jsonb;
  v_visibility jsonb;
  v_notifications jsonb;
  v_swap_preferences jsonb;
  v_swap_context text[];
  v_open_to_types text[];
  v_affinity_groups text[];
  v_interests text[];
  v_allowed_keys constant text[] := array[
    'username', 'full_name', 'display_name', 'first_name', 'avatar_url', 'bio',
    'primary_language', 'secondary_language', 'tertiary_language', 'languages',
    'auto_translate_messages', 'show_original_language', 'location', 'location_text',
    'visibility', 'notifications', 'swap_preferences', 'user_type',
    'availability_status', 'timezone', 'date_of_birth', 'address_country',
    'address_city', 'swap_geo_range', 'swap_context', 'open_to_types',
    'swap_intent', 'affinity_groups', 'interests', 'occupation',
    'onboarding_completed', 'onboarding_step'
  ];
  v_unknown_key text;
begin
  if v_user_id is null then
    raise exception using errcode = '42501', message = 'Authentication required.';
  end if;

  if p_expected_revision is null or p_expected_revision < 1 then
    raise exception using errcode = '22023', message = 'A positive expected revision is required.';
  end if;

  if jsonb_typeof(p_payload) is distinct from 'object' then
    raise exception using errcode = '22023', message = 'Profile payload must be a JSON object.';
  end if;

  if p_idempotency_key is null
    or char_length(p_idempotency_key) not between 8 and 120
    or p_idempotency_key !~ '^[A-Za-z0-9._:-]+$'
  then
    raise exception using errcode = '22023', message = 'Invalid idempotency key.';
  end if;

  select keys.key
  into v_unknown_key
  from jsonb_object_keys(p_payload) as keys(key)
  where not (keys.key = any(v_allowed_keys))
  limit 1;

  if v_unknown_key is not null then
    raise exception using
      errcode = '22023',
      message = format('Unsupported profile field: %s', v_unknown_key);
  end if;

  if p_payload ? 'auto_translate_messages'
    and jsonb_typeof(p_payload -> 'auto_translate_messages') <> 'boolean'
  then
    raise exception using errcode = '22023', message = 'auto_translate_messages must be boolean.';
  end if;

  if p_payload ? 'show_original_language'
    and jsonb_typeof(p_payload -> 'show_original_language') <> 'boolean'
  then
    raise exception using errcode = '22023', message = 'show_original_language must be boolean.';
  end if;

  if p_payload ? 'onboarding_completed'
    and jsonb_typeof(p_payload -> 'onboarding_completed') <> 'boolean'
  then
    raise exception using errcode = '22023', message = 'onboarding_completed must be boolean.';
  end if;

  if p_payload ? 'username'
    and nullif(btrim(p_payload ->> 'username'), '') is null
  then
    raise exception using errcode = '22023', message = 'Username cannot be empty.';
  end if;

  if p_payload ? 'user_type'
    and (p_payload ->> 'user_type') not in ('individual', 'professional', 'organization')
  then
    raise exception using errcode = '22023', message = 'Unsupported user_type.';
  end if;

  if p_payload ? 'availability_status'
    and (p_payload ->> 'availability_status') not in ('available', 'limited', 'away')
  then
    raise exception using errcode = '22023', message = 'Unsupported availability_status.';
  end if;

  if p_payload ? 'timezone'
    and nullif(btrim(p_payload ->> 'timezone'), '') is null
  then
    raise exception using errcode = '22023', message = 'Timezone cannot be empty.';
  end if;

  if p_payload ? 'address_country'
    and nullif(btrim(p_payload ->> 'address_country'), '') is not null
    and btrim(p_payload ->> 'address_country') !~ '^[A-Za-z]{2}$'
  then
    raise exception using errcode = '22023', message = 'Country must be an ISO 3166-1 alpha-2 code.';
  end if;

  if p_payload ? 'swap_geo_range'
    and (p_payload ->> 'swap_geo_range') not in ('local', 'regional', 'international', 'vacation')
  then
    raise exception using errcode = '22023', message = 'Unsupported swap_geo_range.';
  end if;

  if p_payload ? 'swap_intent'
    and (p_payload ->> 'swap_intent') not in ('exploring', 'open', 'clear', 'serious')
  then
    raise exception using errcode = '22023', message = 'Unsupported swap_intent.';
  end if;

  if p_payload ? 'languages'
    and jsonb_typeof(p_payload -> 'languages') <> 'array'
  then
    raise exception using errcode = '22023', message = 'Languages must be an array.';
  end if;

  if p_payload ? 'swap_context'
    and jsonb_typeof(p_payload -> 'swap_context') <> 'array'
  then
    raise exception using errcode = '22023', message = 'Swap context must be an array.';
  end if;

  if p_payload ? 'open_to_types'
    and jsonb_typeof(p_payload -> 'open_to_types') <> 'array'
  then
    raise exception using errcode = '22023', message = 'Open-to types must be an array.';
  end if;

  if p_payload ? 'affinity_groups'
    and jsonb_typeof(p_payload -> 'affinity_groups') <> 'array'
  then
    raise exception using errcode = '22023', message = 'Affinity groups must be an array.';
  end if;

  if p_payload ? 'interests'
    and jsonb_typeof(p_payload -> 'interests') <> 'array'
  then
    raise exception using errcode = '22023', message = 'Interests must be an array.';
  end if;

  if exists (
    select 1
    from jsonb_array_elements_text(coalesce(p_payload -> 'swap_context', '[]'::jsonb)) as contexts(value)
    where contexts.value not in ('permanent', 'vacation', 'temporary', 'urgent')
  ) then
    raise exception using errcode = '22023', message = 'Unsupported swap context.';
  end if;

  if exists (
    select 1
    from jsonb_array_elements_text(coalesce(p_payload -> 'open_to_types', '[]'::jsonb)) as asset_types(value)
    where asset_types.value not in ('object', 'property', 'service', 'event')
  ) then
    raise exception using errcode = '22023', message = 'Unsupported open-to type.';
  end if;

  v_request_hash := md5(p_expected_revision::text || ':' || p_payload::text);

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(v_user_id::text || ':' || p_idempotency_key, 0)
  );

  select *
  into v_existing
  from public.profile_update_idempotency
  where user_id = v_user_id
    and idempotency_key = p_idempotency_key;

  if found then
    if v_existing.request_hash <> v_request_hash then
      raise exception using
        errcode = '23505',
        message = 'Idempotency key was already used with a different request.';
    end if;

    select *
    into strict v_current
    from public.profiles
    where user_id = v_user_id;

    return jsonb_build_object(
      'profile', to_jsonb(v_current),
      'profile_revision', v_current.profile_revision,
      'replayed', true,
      'idempotent_result_revision', v_existing.response_revision
    );
  end if;

  select *
  into v_current
  from public.profiles
  where user_id = v_user_id
  for update;

  if not found then
    perform public.ensure_own_profile_v1(null);
    select *
    into strict v_current
    from public.profiles
    where user_id = v_user_id
    for update;
  end if;

  if v_current.profile_revision <> p_expected_revision then
    raise exception using
      errcode = '40001',
      message = format(
        'Stale profile revision: expected %s, current %s.',
        p_expected_revision,
        v_current.profile_revision
      );
  end if;

  if p_payload ? 'languages' then
    if p_payload ? 'primary_language'
      or p_payload ? 'secondary_language'
      or p_payload ? 'tertiary_language'
    then
      raise exception using
        errcode = '22023',
        message = 'Use either languages or explicit language preference fields, not both.';
    end if;

    v_languages := '{}'::text[];
    for v_language in
      select language_items.value
      from jsonb_array_elements_text(p_payload -> 'languages') as language_items(value)
    loop
      v_normalized_language := public.normalize_swaply_locale(v_language);
      if v_normalized_language is null then
        raise exception using
          errcode = '22023',
          message = format('Unsupported language: %s', v_language);
      end if;
      if not (v_normalized_language = any(v_languages)) then
        v_languages := array_append(v_languages, v_normalized_language);
      end if;
    end loop;

    if cardinality(v_languages) = 0 then
      raise exception using
        errcode = '22023',
        message = 'At least one supported language is required.';
    end if;

    v_primary := v_languages[1];
    v_secondary := v_languages[2];
    v_tertiary := v_languages[3];
  else
    v_primary := case
      when p_payload ? 'primary_language'
        then public.normalize_swaply_locale(p_payload ->> 'primary_language')
      else v_current.primary_language
    end;
    v_secondary := case
      when p_payload ? 'secondary_language'
        then public.normalize_swaply_locale(p_payload ->> 'secondary_language')
      else v_current.secondary_language
    end;
    v_tertiary := case
      when p_payload ? 'tertiary_language'
        then public.normalize_swaply_locale(p_payload ->> 'tertiary_language')
      else v_current.tertiary_language
    end;

    if v_primary is null then
      raise exception using
        errcode = '22023',
        message = 'Primary language is required and must be supported.';
    end if;
    if v_secondary = v_primary then
      raise exception using
        errcode = '22023',
        message = 'Secondary language must differ from primary language.';
    end if;
    if v_tertiary = v_primary
      or (v_tertiary is not null and v_tertiary = v_secondary)
    then
      raise exception using
        errcode = '22023',
        message = 'Tertiary language must be distinct.';
    end if;

    v_languages := array_remove(array[v_primary, v_secondary, v_tertiary], null);
  end if;

  v_location := case
    when p_payload ? 'location' then p_payload -> 'location'
    else v_current.location
  end;
  v_visibility := case
    when p_payload ? 'visibility' then p_payload -> 'visibility'
    else v_current.visibility
  end;
  v_notifications := case
    when p_payload ? 'notifications' then p_payload -> 'notifications'
    else v_current.notifications
  end;
  v_swap_preferences := case
    when p_payload ? 'swap_preferences' then p_payload -> 'swap_preferences'
    else v_current.swap_preferences
  end;

  if jsonb_typeof(coalesce(v_location, '{}'::jsonb)) <> 'object'
    or jsonb_typeof(coalesce(v_visibility, '{}'::jsonb)) <> 'object'
    or jsonb_typeof(coalesce(v_notifications, '{}'::jsonb)) <> 'object'
    or jsonb_typeof(coalesce(v_swap_preferences, '{}'::jsonb)) <> 'object'
  then
    raise exception using
      errcode = '22023',
      message = 'Profile JSON fields must be objects.';
  end if;

  v_swap_context := case
    when p_payload ? 'swap_context'
      then array(select jsonb_array_elements_text(p_payload -> 'swap_context'))
    else v_current.swap_context
  end;
  v_open_to_types := case
    when p_payload ? 'open_to_types'
      then array(select jsonb_array_elements_text(p_payload -> 'open_to_types'))
    else v_current.open_to_types
  end;
  v_affinity_groups := case
    when p_payload ? 'affinity_groups'
      then array(select jsonb_array_elements_text(p_payload -> 'affinity_groups'))
    else v_current.affinity_groups
  end;
  v_interests := case
    when p_payload ? 'interests'
      then array(select jsonb_array_elements_text(p_payload -> 'interests'))
    else v_current.interests
  end;

  update public.profiles
  set
    username = case
      when p_payload ? 'username' then btrim(p_payload ->> 'username')
      else username
    end,
    full_name = case
      when p_payload ? 'full_name' then nullif(btrim(p_payload ->> 'full_name'), '')
      else full_name
    end,
    display_name = case
      when p_payload ? 'display_name' then nullif(btrim(p_payload ->> 'display_name'), '')
      else display_name
    end,
    first_name = case
      when p_payload ? 'first_name' then nullif(btrim(p_payload ->> 'first_name'), '')
      else first_name
    end,
    avatar_url = case
      when p_payload ? 'avatar_url' then nullif(btrim(p_payload ->> 'avatar_url'), '')
      else avatar_url
    end,
    bio = case
      when p_payload ? 'bio' then nullif(btrim(p_payload ->> 'bio'), '')
      else bio
    end,
    primary_language = v_primary,
    secondary_language = v_secondary,
    tertiary_language = v_tertiary,
    preferred_locale = v_primary,
    languages = v_languages,
    auto_translate_messages = case
      when p_payload ? 'auto_translate_messages'
        then (p_payload ->> 'auto_translate_messages')::boolean
      else auto_translate_messages
    end,
    show_original_language = case
      when p_payload ? 'show_original_language'
        then (p_payload ->> 'show_original_language')::boolean
      else show_original_language
    end,
    location = coalesce(v_location, '{}'::jsonb),
    location_text = case
      when p_payload ? 'location_text' then nullif(btrim(p_payload ->> 'location_text'), '')
      else location_text
    end,
    visibility = coalesce(v_visibility, '{}'::jsonb),
    notifications = coalesce(v_notifications, '{}'::jsonb),
    swap_preferences = coalesce(v_swap_preferences, '{}'::jsonb),
    user_type = case
      when p_payload ? 'user_type' then p_payload ->> 'user_type'
      else user_type
    end,
    availability_status = case
      when p_payload ? 'availability_status' then p_payload ->> 'availability_status'
      else availability_status
    end,
    timezone = case
      when p_payload ? 'timezone' then btrim(p_payload ->> 'timezone')
      else timezone
    end,
    date_of_birth = case
      when p_payload ? 'date_of_birth'
        then nullif(btrim(p_payload ->> 'date_of_birth'), '')::date
      else date_of_birth
    end,
    address_country = case
      when p_payload ? 'address_country'
        then upper(nullif(btrim(p_payload ->> 'address_country'), ''))
      else address_country
    end,
    address_city = case
      when p_payload ? 'address_city' then nullif(btrim(p_payload ->> 'address_city'), '')
      else address_city
    end,
    swap_geo_range = case
      when p_payload ? 'swap_geo_range' then nullif(btrim(p_payload ->> 'swap_geo_range'), '')
      else swap_geo_range
    end,
    swap_context = coalesce(v_swap_context, '{}'::text[]),
    open_to_types = coalesce(v_open_to_types, '{}'::text[]),
    swap_intent = case
      when p_payload ? 'swap_intent' then nullif(btrim(p_payload ->> 'swap_intent'), '')
      else swap_intent
    end,
    affinity_groups = coalesce(v_affinity_groups, '{}'::text[]),
    interests = coalesce(v_interests, '{}'::text[]),
    occupation = case
      when p_payload ? 'occupation' then nullif(btrim(p_payload ->> 'occupation'), '')
      else occupation
    end,
    onboarding_completed = case
      when p_payload ? 'onboarding_completed'
        then coalesce(onboarding_completed, false) or (p_payload ->> 'onboarding_completed')::boolean
      else onboarding_completed
    end,
    onboarding_step = case
      when p_payload ? 'onboarding_step' then nullif(btrim(p_payload ->> 'onboarding_step'), '')
      else onboarding_step
    end,
    profile_revision = profile_revision + 1,
    updated_at = now()
  where user_id = v_user_id
  returning * into strict v_updated;

  insert into public.profile_update_idempotency(
    user_id,
    idempotency_key,
    request_hash,
    response_revision
  ) values (
    v_user_id,
    p_idempotency_key,
    v_request_hash,
    v_updated.profile_revision
  );

  delete from public.profile_update_idempotency
  where created_at < now() - interval '24 hours';

  return jsonb_build_object(
    'profile', to_jsonb(v_updated),
    'profile_revision', v_updated.profile_revision,
    'replayed', false,
    'idempotent_result_revision', v_updated.profile_revision
  );
end;
$function$;

revoke execute on function public.update_own_profile_v1(bigint, jsonb, text)
  from public, anon;
grant execute on function public.update_own_profile_v1(bigint, jsonb, text)
  to authenticated, service_role;

revoke insert, update on table public.profiles from authenticated;
drop policy if exists insert_own_profile on public.profiles;
drop policy if exists update_own_profile on public.profiles;

commit;
