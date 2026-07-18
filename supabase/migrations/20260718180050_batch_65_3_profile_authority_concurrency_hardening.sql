-- Batch 65.3 follow-up — serialize duplicate requests and harden payload types.
-- Production version: 20260718180050.

begin;

create or replace function public.update_own_profile_v1(
  p_expected_revision bigint,
  p_payload jsonb,
  p_idempotency_key text
)
returns jsonb
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
  v_location jsonb;
  v_visibility jsonb;
  v_notifications jsonb;
  v_swap_preferences jsonb;
  v_allowed_keys constant text[] := array[
    'username', 'full_name', 'display_name', 'first_name', 'avatar_url', 'bio',
    'primary_language', 'secondary_language', 'tertiary_language',
    'auto_translate_messages', 'show_original_language',
    'location', 'location_text', 'visibility', 'notifications', 'swap_preferences',
    'user_type', 'availability_status', 'timezone'
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

  select keys.key into v_unknown_key
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

  if p_payload ? 'username' and nullif(btrim(p_payload ->> 'username'), '') is null then
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

  if p_payload ? 'timezone' and nullif(btrim(p_payload ->> 'timezone'), '') is null then
    raise exception using errcode = '22023', message = 'Timezone cannot be empty.';
  end if;

  v_request_hash := md5(p_expected_revision::text || ':' || p_payload::text);

  -- Serialize requests sharing one actor/key. The second concurrent request sees
  -- the committed marker and replays instead of failing as a stale update.
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(v_user_id::text || ':' || p_idempotency_key, 0)
  );

  select * into v_existing
  from public.profile_update_idempotency
  where user_id = v_user_id and idempotency_key = p_idempotency_key;

  if found then
    if v_existing.request_hash <> v_request_hash then
      raise exception using
        errcode = '23505',
        message = 'Idempotency key was already used with a different request.';
    end if;

    select * into strict v_current
    from public.profiles
    where user_id = v_user_id;

    return jsonb_build_object(
      'profile', to_jsonb(v_current),
      'profile_revision', v_current.profile_revision,
      'replayed', true,
      'idempotent_result_revision', v_existing.response_revision
    );
  end if;

  select * into v_current
  from public.profiles
  where user_id = v_user_id
  for update;

  if not found then
    perform public.ensure_own_profile_v1(null);
    select * into strict v_current
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
    raise exception using errcode = '22023', message = 'Primary language is required and must be supported.';
  end if;

  if v_secondary = v_primary then
    raise exception using errcode = '22023', message = 'Secondary language must differ from primary language.';
  end if;

  if v_tertiary = v_primary or (v_tertiary is not null and v_tertiary = v_secondary) then
    raise exception using errcode = '22023', message = 'Tertiary language must be distinct.';
  end if;

  v_location := case when p_payload ? 'location' then p_payload -> 'location' else v_current.location end;
  v_visibility := case when p_payload ? 'visibility' then p_payload -> 'visibility' else v_current.visibility end;
  v_notifications := case when p_payload ? 'notifications' then p_payload -> 'notifications' else v_current.notifications end;
  v_swap_preferences := case when p_payload ? 'swap_preferences' then p_payload -> 'swap_preferences' else v_current.swap_preferences end;

  if jsonb_typeof(coalesce(v_location, '{}'::jsonb)) <> 'object'
    or jsonb_typeof(coalesce(v_visibility, '{}'::jsonb)) <> 'object'
    or jsonb_typeof(coalesce(v_notifications, '{}'::jsonb)) <> 'object'
    or jsonb_typeof(coalesce(v_swap_preferences, '{}'::jsonb)) <> 'object'
  then
    raise exception using errcode = '22023', message = 'Profile JSON fields must be objects.';
  end if;

  update public.profiles
  set
    username = case when p_payload ? 'username' then btrim(p_payload ->> 'username') else username end,
    full_name = case when p_payload ? 'full_name' then nullif(btrim(p_payload ->> 'full_name'), '') else full_name end,
    display_name = case when p_payload ? 'display_name' then nullif(btrim(p_payload ->> 'display_name'), '') else display_name end,
    first_name = case when p_payload ? 'first_name' then nullif(btrim(p_payload ->> 'first_name'), '') else first_name end,
    avatar_url = case when p_payload ? 'avatar_url' then nullif(btrim(p_payload ->> 'avatar_url'), '') else avatar_url end,
    bio = case when p_payload ? 'bio' then nullif(btrim(p_payload ->> 'bio'), '') else bio end,
    primary_language = v_primary,
    secondary_language = v_secondary,
    tertiary_language = v_tertiary,
    preferred_locale = v_primary,
    languages = array_remove(array[v_primary, v_secondary, v_tertiary], null),
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
    location_text = case when p_payload ? 'location_text' then nullif(btrim(p_payload ->> 'location_text'), '') else location_text end,
    visibility = coalesce(v_visibility, '{}'::jsonb),
    notifications = coalesce(v_notifications, '{}'::jsonb),
    swap_preferences = coalesce(v_swap_preferences, '{}'::jsonb),
    user_type = case when p_payload ? 'user_type' then p_payload ->> 'user_type' else user_type end,
    availability_status = case when p_payload ? 'availability_status' then p_payload ->> 'availability_status' else availability_status end,
    timezone = case when p_payload ? 'timezone' then btrim(p_payload ->> 'timezone') else timezone end,
    profile_revision = profile_revision + 1,
    updated_at = now()
  where user_id = v_user_id
  returning * into strict v_updated;

  insert into public.profile_update_idempotency (
    user_id, idempotency_key, request_hash, response_revision
  ) values (
    v_user_id, p_idempotency_key, v_request_hash, v_updated.profile_revision
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

commit;
