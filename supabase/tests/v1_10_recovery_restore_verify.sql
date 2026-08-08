\set ON_ERROR_STOP on

begin;

select case when (select count(*) from auth.users) = 2 then 1 else 1 / 0 end as auth_users_restored;
select case when (select count(*) from public.profiles) = 2 then 1 else 1 / 0 end as profiles_restored;
select case when (select count(*) from public.items) = 2 then 1 else 1 / 0 end as items_restored;
select case when (select count(*) from public.swaps) = 1 then 1 else 1 / 0 end as swaps_restored;
select case when (select count(*) from public.messages) = 1 then 1 else 1 / 0 end as messages_restored;
select case when (select count(*) from public.story_consents) = 2 then 1 else 1 / 0 end as story_consents_restored;
select case when (select count(*) from public.swapleni_ledger) = 2 then 1 else 1 / 0 end as ledger_restored;
select case when (select count(*) from public.blog_posts) = 2 then 1 else 1 / 0 end as blog_posts_restored;
select case when (select count(*) from storage.objects) = 1 then 1 else 1 / 0 end as storage_metadata_restored;

select case when not exists (
  select 1
  from public.items item_row
  left join public.profiles profile_row on profile_row.user_id = item_row.owner_id
  where profile_row.user_id is null
) then 1 else 1 / 0 end as item_owner_integrity;

select case when not exists (
  select 1
  from public.messages message_row
  left join public.conversations conversation_row on conversation_row.id = message_row.conversation_id
  where conversation_row.id is null
) then 1 else 1 / 0 end as message_conversation_integrity;

select case when not exists (
  select 1
  from public.story_consents consent_row
  left join public.stories story_row on story_row.id = consent_row.story_id
  where story_row.id is null
) then 1 else 1 / 0 end as story_consent_integrity;

select case when (
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
) = 8 then 1 else 1 / 0 end as rls_restored;

select case when (
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
) = 8 then 1 else 1 / 0 end as policies_restored;

select case when (
  select md5(string_agg(username || ':' || preferred_language, '|' order by username))
  from public.profiles
) = md5('alice-recovery:ro|bob-recovery:de') then 1 else 1 / 0 end as profile_checksum_restored;

select case when (
  select sum(amount) from public.swapleni_ledger
) = 20 then 1 else 1 / 0 end as ledger_balance_restored;

rollback;
