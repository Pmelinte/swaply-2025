-- V1-02-R9 — legacy least-privilege grant hardening
-- Forward-only privilege reconciliation for public RLS tables.
-- Policies are preserved; only table grants for ordinary API roles are narrowed.

-- Ordinary API roles never need ownership-like table capabilities. RLS does not
-- protect TRUNCATE, REFERENCES or TRIGGER, so remove them from every RLS table.
do $$
declare
  relation_row record;
begin
  for relation_row in
    select format('%I.%I', namespace_row.nspname, class_row.relname) as qualified_name
      from pg_class class_row
      join pg_namespace namespace_row on namespace_row.oid = class_row.relnamespace
     where namespace_row.nspname = 'public'
       and class_row.relkind in ('r', 'p')
       and class_row.relrowsecurity
  loop
    execute format(
      'revoke truncate, references, trigger on table %s from anon, authenticated',
      relation_row.qualified_name
    );
  end loop;
end;
$$;

-- Anonymous users receive only the explicitly supported public-read surface and
-- the single guest analytics insert. Removing stale grants makes future RLS
-- policy mistakes fail closed instead of inheriting broad legacy authority.
do $$
declare
  relation_row record;
begin
  for relation_row in
    select format('%I.%I', namespace_row.nspname, class_row.relname) as qualified_name
      from pg_class class_row
      join pg_namespace namespace_row on namespace_row.oid = class_row.relnamespace
     where namespace_row.nspname = 'public'
       and class_row.relkind in ('r', 'p')
       and class_row.relrowsecurity
  loop
    execute format(
      'revoke select, insert, update, delete on table %s from anon',
      relation_row.qualified_name
    );
  end loop;
end;
$$;

grant select on table public.blog_posts to anon;
grant select on table public.categories to anon;
grant select on table public.cities to anon;
grant select on table public.countries to anon;
grant select on table public.events_listings to anon;
grant select on table public.item_boosts to anon;
grant select on table public.items to anon;
grant select on table public.properties to anon;
grant select on table public.public_profiles to anon;
grant select on table public.reviews to anon;
grant select on table public.services_by_country to anon;
grant select on table public.services_listings to anon;
grant select on table public.story_publications to anon;
grant select on table public.subcategories to anon;
grant select on table public.wanted_requests to anon;
grant select on table public.weekly_events to anon;
grant insert on table public.item_analytics to anon;

-- Rebuild authenticated grants from the commands already authorised by RLS
-- policies assigned to authenticated or public. This retains legitimate direct
-- CRUD flows while deleting stale privileges that have no matching policy.
do $$
declare
  relation_row record;
  command_row record;
begin
  for relation_row in
    select namespace_row.nspname as schema_name,
           class_row.relname as relation_name,
           format('%I.%I', namespace_row.nspname, class_row.relname) as qualified_name
      from pg_class class_row
      join pg_namespace namespace_row on namespace_row.oid = class_row.relnamespace
     where namespace_row.nspname = 'public'
       and class_row.relkind in ('r', 'p')
       and class_row.relrowsecurity
  loop
    execute format(
      'revoke select, insert, update, delete on table %s from authenticated',
      relation_row.qualified_name
    );

    for command_row in
      select distinct policy_command
        from (
          select case
                   when policy_row.cmd = 'ALL' then expanded_command.command
                   else policy_row.cmd
                 end as policy_command
            from pg_policies policy_row
            cross join lateral (
              values ('SELECT'), ('INSERT'), ('UPDATE'), ('DELETE')
            ) as expanded_command(command)
           where policy_row.schemaname = relation_row.schema_name
             and policy_row.tablename = relation_row.relation_name
             and policy_row.roles && array['public', 'authenticated']::name[]
             and (policy_row.cmd = 'ALL' or policy_row.cmd = expanded_command.command)
        ) policy_commands
  loop
      execute format(
        'grant %s on table %s to authenticated',
        command_row.policy_command,
        relation_row.qualified_name
      );
    end loop;
  end loop;
end;
$$;

comment on table public.item_analytics is
  'Guest access is limited to INSERT under the explicit guest-view RLS policy; all other anonymous table authority is denied.';
