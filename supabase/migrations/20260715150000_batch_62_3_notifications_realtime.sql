begin;

-- Batch 62.3 closure requires canonical completion and feedback-request
-- notifications to reach the authenticated UI without a page reload.
-- Keep the migration safe for non-Supabase local databases where the managed
-- publication does not exist.

do $migration$
begin
  if exists (
    select 1
      from pg_catalog.pg_publication
     where pubname = 'supabase_realtime'
  )
  and not exists (
    select 1
      from pg_catalog.pg_publication_tables
     where pubname = 'supabase_realtime'
       and schemaname = 'public'
       and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end;
$migration$;

comment on table public.notifications is
  'Canonical in-app notifications. Published to Supabase Realtime for authenticated own-row updates.';

commit;
