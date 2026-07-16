\set ON_ERROR_STOP on

begin;

select batch65_test.assert_true(
  (select count(*) = 5
   from information_schema.columns
   where table_schema = 'public'
     and table_name = 'public_profiles'
     and column_name in (
       'user_type', 'availability_status', 'is_public',
       'location', 'languages'
     )),
  'public profile projection columns exist'
);

select batch65_test.assert_true(
  not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and cmd = 'UPDATE'
  ),
  'no authenticated raw-profile UPDATE policy remains'
);

select batch65_test.assert_true(
  (select qual ilike '%is_public%'
          and qual ilike '%profile_identity_allowed_v1%'
   from pg_policies
   where schemaname = 'public'
     and tablename = 'public_profiles'
     and policyname = 'public_profiles_read'),
  'public projection policy combines public discovery and participant identity'
);

select batch65_test.assert_true(
  has_table_privilege('authenticated', 'public.profiles', 'SELECT')
    and has_table_privilege('authenticated', 'public.profiles', 'INSERT')
    and has_table_privilege('authenticated', 'public.profiles', 'DELETE')
    and not has_table_privilege('authenticated', 'public.profiles', 'UPDATE'),
  'authenticated raw-profile grants are owner read/insert/delete without direct update'
);

select batch65_test.assert_true(
  not has_table_privilege('anon', 'public.profiles', 'SELECT')
    and not has_table_privilege('anon', 'public.profiles', 'INSERT')
    and not has_table_privilege('anon', 'public.profiles', 'UPDATE')
    and not has_table_privilege('anon', 'public.profiles', 'DELETE'),
  'anonymous role has no raw-profile table privilege'
);

select batch65_test.assert_true(
  has_table_privilege('anon', 'public.public_profiles', 'SELECT')
    and has_table_privilege('authenticated', 'public.public_profiles', 'SELECT'),
  'public projection remains selectable under RLS by anonymous and authenticated roles'
);

select batch65_test.assert_true(
  not has_table_privilege('anon', 'public.profile_update_requests', 'SELECT')
    and not has_table_privilege('authenticated', 'public.profile_update_requests', 'SELECT')
    and not has_table_privilege('authenticated', 'public.profile_update_requests', 'INSERT')
    and not has_table_privilege('authenticated', 'public.profile_update_requests', 'UPDATE')
    and not has_table_privilege('authenticated', 'public.profile_update_requests', 'DELETE'),
  'idempotency registry has no browser table grants'
);

select batch65_test.assert_true(
  has_function_privilege('authenticated', 'public.ensure_own_profile_v1(text)', 'EXECUTE')
    and not has_function_privilege('anon', 'public.ensure_own_profile_v1(text)', 'EXECUTE'),
  'profile bootstrap authority is authenticated-only'
);

select batch65_test.assert_true(
  has_function_privilege('authenticated', 'public.update_own_profile_v1(bigint,jsonb,text)', 'EXECUTE')
    and not has_function_privilege('anon', 'public.update_own_profile_v1(bigint,jsonb,text)', 'EXECUTE')
    and not has_function_privilege('authenticated', 'public.update_own_profile_core_v1(bigint,jsonb,text)', 'EXECUTE'),
  'only the canonical update wrapper is exposed to authenticated callers'
);

select batch65_test.assert_true(
  has_function_privilege('authenticated', 'public.get_profile_identity_v1(uuid)', 'EXECUTE')
    and not has_function_privilege('anon', 'public.get_profile_identity_v1(uuid)', 'EXECUTE'),
  'explicit participant identity RPC is authenticated-only'
);

select batch65_test.assert_true(
  has_function_privilege('anon', 'public.profile_identity_allowed_v1(uuid)', 'EXECUTE')
    and has_function_privilege('authenticated', 'public.profile_identity_allowed_v1(uuid)', 'EXECUTE'),
  'RLS helper is executable by policy evaluation roles'
);

select batch65_test.assert_true(
  not has_function_privilege('authenticated', 'public.bootstrap_profile_from_auth_user_v1()', 'EXECUTE')
    and not has_function_privilege('anon', 'public.bootstrap_profile_from_auth_user_v1()', 'EXECUTE')
    and not has_function_privilege('authenticated', 'public.sync_public_profile()', 'EXECUTE'),
  'trigger-only functions are not browser-callable'
);

select batch65_test.assert_true(
  exists (
    select 1
    from pg_trigger t
    join pg_class c on c.oid = t.tgrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'auth'
      and c.relname = 'users'
      and t.tgname = 'batch_65_profile_bootstrap_after_auth_insert'
      and t.tgenabled = 'O'
      and not t.tgisinternal
  ),
  'Auth user profile-bootstrap trigger exists and is enabled'
);

select batch65_test.assert_true(
  (select pg_get_userbyid(p.proowner) = 'postgres'
          and p.prosecdef
          and array_to_string(p.proconfig, ',') ilike '%search_path=pg_catalog, public, auth%'
   from pg_proc p
   join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public'
     and p.proname = 'ensure_own_profile_v1'
     and pg_get_function_identity_arguments(p.oid) = 'p_route_locale text'),
  'ensure_own_profile_v1 is postgres-owned SECURITY DEFINER with explicit search path'
);

select batch65_test.assert_true(
  (select pg_get_userbyid(p.proowner) = 'postgres'
          and p.prosecdef
          and array_to_string(p.proconfig, ',') ilike '%search_path=pg_catalog, public%'
   from pg_proc p
   join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public'
     and p.proname = 'update_own_profile_v1'
     and pg_get_function_identity_arguments(p.oid) = 'p_expected_revision bigint, p_payload jsonb, p_idempotency_key text'),
  'canonical update wrapper is postgres-owned SECURITY DEFINER with explicit search path'
);

select batch65_test.assert_true(
  (select pg_get_userbyid(p.proowner) = 'postgres'
          and p.prosecdef
          and array_to_string(p.proconfig, ',') ilike '%search_path=pg_catalog, public%'
   from pg_proc p
   join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public'
     and p.proname = 'profile_identity_allowed_v1'
     and pg_get_function_identity_arguments(p.oid) = 'p_target_user_id uuid'),
  'participant RLS helper is postgres-owned SECURITY DEFINER with explicit search path'
);

select batch65_test.assert_true(
  (select relrowsecurity
   from pg_class
   where oid = 'public.profile_update_requests'::regclass),
  'idempotency registry RLS remains enabled'
);

select batch65_test.assert_true(
  (select count(*) = 1
   from pg_indexes
   where schemaname = 'public'
     and tablename = 'profile_update_requests'
     and indexname = 'profile_update_requests_expires_at_idx'),
  'idempotency expiry index exists'
);

commit;
