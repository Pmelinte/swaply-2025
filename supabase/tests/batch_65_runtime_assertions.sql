\set ON_ERROR_STOP on

begin;

create schema if not exists batch65_test;

create or replace function batch65_test.assert_true(p_condition boolean, p_message text)
returns void
language plpgsql
security invoker
set search_path = pg_catalog, public, batch65_test
as $function$
begin
  if coalesce(p_condition, false) is not true then
    raise exception 'Batch 65 assertion failed: %', p_message;
  end if;
end;
$function$;

create or replace function batch65_test.expect_error(
  p_sql text,
  p_expected_state text,
  p_message_fragment text default null
) returns void
language plpgsql
security invoker
set search_path = pg_catalog, public, batch65_test
as $function$
declare
  v_state text;
  v_message text;
begin
  begin
    execute p_sql;
    raise exception 'Statement unexpectedly succeeded: %', p_sql;
  exception when others then
    get stacked diagnostics
      v_state = returned_sqlstate,
      v_message = message_text;

    if v_state <> p_expected_state then
      raise exception 'Expected SQLSTATE %, got %: %', p_expected_state, v_state, v_message;
    end if;

    if p_message_fragment is not null
      and position(lower(p_message_fragment) in lower(coalesce(v_message, ''))) = 0
    then
      raise exception 'Expected error containing %, got: %', p_message_fragment, v_message;
    end if;
  end;
end;
$function$;

grant usage on schema batch65_test to anon, authenticated;
grant execute on all functions in schema batch65_test to anon, authenticated;

select batch65_test.assert_true(
  (select count(*) = 9
   from information_schema.columns
   where table_schema = 'public'
     and table_name = 'profiles'
     and column_name in (
       'primary_language', 'secondary_language', 'tertiary_language',
       'auto_translate_messages', 'show_original_language', 'profile_revision',
       'user_type', 'availability_status', 'timezone'
     )),
  'all additive global-profile columns exist'
);

select batch65_test.assert_true(
  (select relrowsecurity from pg_class where oid = 'public.profiles'::regclass),
  'profiles RLS remains enabled'
);

select batch65_test.assert_true(
  not has_table_privilege('authenticated', 'public.profiles', 'UPDATE'),
  'authenticated direct UPDATE privilege is revoked'
);

select batch65_test.assert_true(
  has_function_privilege('authenticated', 'public.update_own_profile_v1(bigint,jsonb,text)', 'EXECUTE'),
  'authenticated may execute canonical profile update authority'
);

select batch65_test.assert_true(
  not has_function_privilege('anon', 'public.update_own_profile_v1(bigint,jsonb,text)', 'EXECUTE'),
  'anonymous callers cannot execute profile update authority'
);

select batch65_test.assert_true(
  (select primary_language = 'ro'
          and secondary_language = 'en'
          and tertiary_language = 'fr'
          and preferred_locale = 'ro'
          and languages = array['ro','en','fr']::text[]
          and profile_revision = 1
   from public.profiles
   where user_id = '11111111-1111-4111-8111-111111111111'),
  'legacy owner language data is backfilled deterministically'
);

select batch65_test.assert_true(
  (select primary_language = 'de'
          and secondary_language is null
          and tertiary_language is null
   from public.profiles
   where user_id = '22222222-2222-4222-8222-222222222222'),
  'single-language legacy profile remains compatible'
);

select batch65_test.assert_true(
  (select is_public is false
          and bio is null
          and location = '{}'::jsonb
          and location_text is null
          and swap_intent is null
          and swap_context is null
          and swap_geo_range is null
          and open_to_types is null
          and user_type is null
          and availability_status is null
   from public.public_profiles
   where user_id = '33333333-3333-4333-8333-333333333333'),
  'private profile is stored only as a minimal participant row and excluded from discovery by RLS'
);

select batch65_test.assert_true(
  (select location = '{"city":"Tulcea","country":"RO"}'::jsonb
          and location_text = 'Tulcea, RO'
          and bio is null
          and interests is null
          and occupation is null
          and website_url is null
          and social_links is null
   from public.public_profiles
   where user_id = '11111111-1111-4111-8111-111111111111'),
  'public projection exposes city/country only and keeps optional fields private by default'
);

commit;

begin;

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at
) values (
  '00000000-0000-0000-0000-000000000000',
  '77777777-7777-4777-8777-777777777777',
  'authenticated',
  'authenticated',
  null,
  '',
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"language":"es"}',
  now(),
  now()
);

delete from public.profiles
where user_id = '77777777-7777-4777-8777-777777777777';

set local role authenticated;
select set_config('request.jwt.claim.sub', '77777777-7777-4777-8777-777777777777', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

with ensured as (
  select public.ensure_own_profile_v1('pt-BR') as payload
)
select batch65_test.assert_true(
  (select (payload ->> 'created')::boolean is true
          and (payload ->> 'profile_revision')::bigint = 1
          and payload -> 'profile' ->> 'primary_language' = 'pt'
          and payload -> 'profile' -> 'languages' = '["pt"]'::jsonb
   from ensured),
  'ensure_own_profile_v1 creates a missing profile with coherent route language and revision 1'
);

rollback;

begin;
set local role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

select batch65_test.assert_true(
  (select count(*) = 1 from public.profiles),
  'owner can select only their own raw profile'
);

select batch65_test.expect_error(
  $sql$update public.profiles set display_name = 'Direct bypass' where user_id = '11111111-1111-4111-8111-111111111111'$sql$,
  '42501',
  'permission denied'
);

with result as (
  select public.update_own_profile_v1(
    1,
    '{
      "display_name":"Owner Canonical",
      "bio":"Owner public biography",
      "interests":["technology","exchange"],
      "occupation":"Doctor",
      "website_url":"https://owner-public.example.test",
      "social_links":{"github":"owner-public"},
      "visibility":{
        "showBio":true,
        "showInterests":true,
        "showOccupation":true,
        "showWebsite":true,
        "showSocialLinks":true
      }
    }'::jsonb,
    'batch65-owner-save-0001'
  ) as payload
)
select batch65_test.assert_true(
  (select (payload ->> 'replayed')::boolean is false
          and (payload ->> 'profile_revision')::bigint = 2
   from result),
  'canonical owner save increments revision exactly once'
);

with replay as (
  select public.update_own_profile_v1(
    1,
    '{
      "display_name":"Owner Canonical",
      "bio":"Owner public biography",
      "interests":["technology","exchange"],
      "occupation":"Doctor",
      "website_url":"https://owner-public.example.test",
      "social_links":{"github":"owner-public"},
      "visibility":{
        "showBio":true,
        "showInterests":true,
        "showOccupation":true,
        "showWebsite":true,
        "showSocialLinks":true
      }
    }'::jsonb,
    'batch65-owner-save-0001'
  ) as payload
)
select batch65_test.assert_true(
  (select (payload ->> 'replayed')::boolean is true
          and (payload ->> 'profile_revision')::bigint = 2
   from replay),
  'same idempotency key and payload replays without a new revision'
);

select batch65_test.expect_error(
  $sql$select public.update_own_profile_v1(1, '{"display_name":"Conflicting replay"}'::jsonb, 'batch65-owner-save-0001')$sql$,
  '23505',
  'idempotency key conflict'
);

select batch65_test.expect_error(
  $sql$select public.update_own_profile_v1(1, '{"bio":"stale write"}'::jsonb, 'batch65-owner-stale-0002')$sql$,
  '40001',
  'Stale profile revision'
);

select batch65_test.assert_true(
  (select profile_revision = 2 and display_name = 'Owner Canonical'
   from public.profiles
   where user_id = '11111111-1111-4111-8111-111111111111'),
  'failed replay and stale writes leave owner state unchanged'
);

select batch65_test.assert_true(
  (select display_name = 'Owner Canonical'
          and bio = 'Owner public biography'
          and interests = array['technology','exchange']::text[]
          and occupation = 'Doctor'
          and website_url = 'https://owner-public.example.test'
          and social_links = '{"github":"owner-public"}'::jsonb
          and location = '{"city":"Tulcea","country":"RO"}'::jsonb
   from public.public_profiles
   where user_id = '11111111-1111-4111-8111-111111111111'),
  'explicit visibility consent publishes only approved optional fields'
);

with identity as (
  select public.get_profile_identity_v1('33333333-3333-4333-8333-333333333333') as payload
)
select batch65_test.assert_true(
  (select payload ->> 'display_name' = 'Private Participant'
          and payload ? 'languages'
          and not payload ? 'email'
          and not payload ? 'bio'
          and not payload ? 'date_of_birth'
          and not payload ? 'address_line1'
          and not payload ? 'address_lat'
          and not payload ? 'address_lon'
          and not payload ? 'stripe_customer_id'
          and not payload ? 'token_balance'
          and not payload ? 'api_key_hash'
   from identity),
  'existing swap participant receives minimal private-profile identity only'
);

select batch65_test.assert_true(
  (select count(*) = 1
   from public.public_profiles
   where user_id = '33333333-3333-4333-8333-333333333333'
     and is_public is false
     and display_name = 'Private Participant'
     and bio is null
     and location = '{}'::jsonb),
  'existing participant can resolve the minimal private row through the regular public_profiles consumer'
);

commit;

begin;
set local role authenticated;
select set_config('request.jwt.claim.sub', '22222222-2222-4222-8222-222222222222', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

select batch65_test.assert_true(
  not exists (
    select 1 from public.profiles
    where user_id = '11111111-1111-4111-8111-111111111111'
  ),
  'outsider cannot read another raw profile'
);

select batch65_test.expect_error(
  $sql$select public.update_own_profile_v1(1, '{"user_id":"11111111-1111-4111-8111-111111111111"}'::jsonb, 'batch65-idor-0001')$sql$,
  '22023',
  'Unsupported profile fields'
);

select batch65_test.expect_error(
  $sql$select public.get_profile_identity_v1('33333333-3333-4333-8333-333333333333')$sql$,
  '42501',
  'access denied'
);

select batch65_test.assert_true(
  not exists (
    select 1
    from public.public_profiles
    where user_id = '33333333-3333-4333-8333-333333333333'
  ),
  'outsider regular public_profiles query cannot resolve a private participant row'
);

with result as (
  select public.update_own_profile_v1(
    1,
    '{"display_name":"Outsider Private","visibility":{"publicProfile":false}}'::jsonb,
    'batch65-outsider-private-0001'
  ) as payload
)
select batch65_test.assert_true(
  (select (payload ->> 'profile_revision')::bigint = 2 from result),
  'outsider may update only their own profile through the canonical authority'
);

commit;

select batch65_test.assert_true(
  (select display_name = 'Owner Canonical'
   from public.profiles
   where user_id = '11111111-1111-4111-8111-111111111111'),
  'outsider update cannot mutate owner profile'
);

select batch65_test.assert_true(
  (select is_public is false
          and bio is null
          and location = '{}'::jsonb
          and location_text is null
          and swap_intent is null
          and user_type is null
          and availability_status is null
   from public.public_profiles
   where user_id = '22222222-2222-4222-8222-222222222222'),
  'publicProfile=false reduces the row to participant-only minimal identity immediately'
);

begin;
set local role authenticated;
select set_config('request.jwt.claim.sub', '44444444-4444-4444-8444-444444444444', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

select batch65_test.assert_true(
  (select count(*) = 1 from public.profiles),
  'admin browser session still has owner-only raw profile RLS'
);

with identity as (
  select public.get_profile_identity_v1('33333333-3333-4333-8333-333333333333') as payload
)
select batch65_test.assert_true(
  (select payload ->> 'display_name' = 'Private Participant'
          and not payload ? 'email'
          and not payload ? 'address_line1'
   from identity),
  'admin role receives the same minimal identity projection, not raw private data'
);

commit;

begin;
set local role authenticated;
select set_config('request.jwt.claim.sub', '55555555-5555-4555-8555-555555555555', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

with identity as (
  select public.get_profile_identity_v1('33333333-3333-4333-8333-333333333333') as payload
)
select batch65_test.assert_true(
  (select payload ->> 'display_name' = 'Private Participant' from identity),
  'moderator role may resolve minimal identity'
);

commit;

begin;
set local role anon;
select set_config('request.jwt.claim.role', 'anon', true);

select batch65_test.expect_error(
  $sql$select * from public.profiles limit 1$sql$,
  '42501',
  'permission denied'
);

select batch65_test.expect_error(
  $sql$select public.update_own_profile_v1(1, '{}'::jsonb, 'batch65-anon-0001')$sql$,
  '42501',
  'permission denied'
);

select batch65_test.assert_true(
  exists (
    select 1 from public.public_profiles
    where user_id = '11111111-1111-4111-8111-111111111111'
  )
  and not exists (
    select 1 from public.public_profiles
    where user_id in (
      '22222222-2222-4222-8222-222222222222',
      '33333333-3333-4333-8333-333333333333'
    )
  ),
  'anonymous discovery sees public profiles and excludes private profiles'
);

commit;

delete from public.profiles
where user_id = '66666666-6666-4666-8666-666666666666';

begin;
set local role authenticated;
select set_config('request.jwt.claim.sub', '66666666-6666-4666-8666-666666666666', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

insert into public.profiles (
  user_id,
  username,
  display_name,
  email,
  role,
  badge,
  profile_revision,
  trust_score,
  token_balance,
  api_key_hash,
  languages,
  preferred_locale,
  location,
  visibility
) values (
  '66666666-6666-4666-8666-666666666666',
  'batch65-guard',
  'Guard Fixture',
  'batch65-guard@example.test',
  'admin',
  'platinum',
  99,
  999,
  999,
  'should-not-survive',
  array['en'],
  'en',
  '{"city":"Test","country":"RO"}',
  '{"publicProfile":true,"itemsVisibility":"public","showExactLocation":false,"showLastSeen":true}'
);

select batch65_test.assert_true(
  (select role = 'user'
          and badge = 'free'
          and profile_revision = 1
          and trust_score = 0
          and token_balance = 0
          and api_key_hash is null
   from public.profiles
   where user_id = '66666666-6666-4666-8666-666666666666'),
  'authenticated insert cannot forge server-controlled fields or initial revision'
);

commit;

select batch65_test.assert_true(
  (select count(*) = 1
   from public.profile_update_requests
   where actor_id = '11111111-1111-4111-8111-111111111111'),
  'owner idempotency registry contains exactly one completed request before concurrency test'
);

select batch65_test.assert_true(
  (select response = jsonb_build_object('profile_revision', result_revision)
          and expires_at > created_at
          and expires_at <= created_at + interval '25 hours'
   from public.profile_update_requests
   where actor_id = '11111111-1111-4111-8111-111111111111'),
  'idempotency registry keeps only a bounded revision marker, not a duplicated profile snapshot'
);

select 'Batch 65 runtime assertions passed' as result;
