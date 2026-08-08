\set ON_ERROR_STOP on

begin;

create function pg_temp.assert_true(condition boolean, assertion_name text)
returns text
language plpgsql
as $$
begin
  if condition is distinct from true then
    raise exception 'Recovery assertion failed: %', assertion_name;
  end if;

  return assertion_name;
end;
$$;

select pg_temp.assert_true(
  (select count(*) from auth.users) = 2,
  'auth_users_restored'
) as result;

select pg_temp.assert_true(
  (select count(*) from public.profiles) = 2,
  'profiles_restored'
) as result;

select pg_temp.assert_true(
  (select count(*) from public.items) = 2,
  'items_restored'
) as result;

select pg_temp.assert_true(
  (select count(*) from public.swaps) = 1,
  'swaps_restored'
) as result;

select pg_temp.assert_true(
  (select count(*) from public.messages) = 1,
  'messages_restored'
) as result;

select pg_temp.assert_true(
  (select count(*) from public.story_consents) = 2,
  'story_consents_restored'
) as result;

select pg_temp.assert_true(
  (select count(*) from public.swapleni_ledger) = 2,
  'ledger_restored'
) as result;

select pg_temp.assert_true(
  (select count(*) from public.blog_posts) = 2,
  'blog_posts_restored'
) as result;

select pg_temp.assert_true(
  (select count(*) from storage.objects) = 1,
  'storage_metadata_restored'
) as result;

select pg_temp.assert_true(
  not exists (
    select 1
    from public.items item_row
    left join public.profiles profile_row on profile_row.user_id = item_row.owner_id
    where profile_row.user_id is null
  ),
  'item_owner_integrity'
) as result;

select pg_temp.assert_true(
  not exists (
    select 1
    from public.messages message_row
    left join public.conversations conversation_row
      on conversation_row.id = message_row.conversation_id
    where conversation_row.id is null
  ),
  'message_conversation_integrity'
) as result;

select pg_temp.assert_true(
  not exists (
    select 1
    from public.story_consents consent_row
    left join public.stories story_row on story_row.id = consent_row.story_id
    where story_row.id is null
  ),
  'story_consent_integrity'
) as result;

select pg_temp.assert_true(
  (
    select count(*)
    from pg_class table_row
    join pg_namespace schema_row on schema_row.oid = table_row.relnamespace
    where schema_row.nspname = 'public'
      and table_row.relname in (
        'profiles',
        'items',
        'swaps',
        'conversations',
        'messages',
        'stories',
        'story_consents',
        'swapleni_ledger'
      )
      and table_row.relrowsecurity
  ) = 8,
  'rls_restored'
) as result;

select pg_temp.assert_true(
  (
    select count(*)
    from pg_policies
    where schemaname = 'public'
      and tablename in (
        'profiles',
        'items',
        'swaps',
        'conversations',
        'messages',
        'stories',
        'story_consents',
        'swapleni_ledger'
      )
  ) = 8,
  'policies_restored'
) as result;

select pg_temp.assert_true(
  (
    select md5(
      string_agg(username || ':' || preferred_language, '|' order by username)
    )
    from public.profiles
  ) = md5('alice-recovery:ro|bob-recovery:de'),
  'profile_checksum_restored'
) as result;

select pg_temp.assert_true(
  (select sum(amount) from public.swapleni_ledger) = 20,
  'ledger_balance_restored'
) as result;

rollback;
