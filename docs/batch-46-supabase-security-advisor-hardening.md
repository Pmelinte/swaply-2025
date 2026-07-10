# Batch 46 — Supabase Security Advisor hardening

Date: 2026-07-10  
Branch: `batch-46-supabase-security-advisor-hardening`  
Base: `main`

## Goal

Resolve the three database-level Security Advisor findings that can be addressed safely through a versioned Supabase migration:

1. `public.contact_messages` has RLS enabled but no explicit policy.
2. `public.translation_cache` has RLS enabled but no explicit policy.
3. The `vector` extension is installed in the `public` schema.

The separate Auth warning for leaked-password protection is not part of this migration because it must be enabled in the Supabase Dashboard.

## Preflight findings

### `contact_messages`

- RLS was already enabled.
- No RLS policies existed.
- `anon` and `authenticated` still had full table grants.
- The contact API writes through `getServiceSupabase()` / `service_role`.
- `service_role` has full table privileges.

### `translation_cache`

- RLS was already enabled.
- No RLS policies existed.
- Client grants had already been revoked by the previous hardening migration.
- Translation routes prefer `service_role`; cache access is best-effort.
- `service_role` has full table privileges.

### `vector`

- Extension version: `0.8.0`.
- Installed schema: `public`.
- Extension is relocatable.
- Target schema `extensions` already exists.
- Database `search_path` already contains `extensions`.
- Only Swaply dependency found:
  - `public.items.embedding_vector vector(1536)`
  - index `public.idx_items_embedding` using `vector_cosine_ops`
- No custom Swaply function hardcodes `public.vector`.

## Migration

File:

- `supabase/migrations/20260710131000_security_advisor_server_only_and_vector_schema.sql`

The migration:

- revokes all direct table privileges from `public`, `anon`, and `authenticated` for both server-only tables;
- preserves full privileges for `service_role`;
- adds explicit restrictive deny-all policies for `anon` and `authenticated`;
- moves `vector` from `public` to `extensions` only when it is still installed in `public`.

## Why restrictive deny policies

The policies are intentionally restrictive and always evaluate to `false` for client roles. This makes the server-only contract explicit and prevents a later permissive policy from accidentally exposing these tables.

`service_role` continues to work because it bypasses RLS and retains its grants.

## No-touch areas

This batch does not change:

- table data;
- public profile access;
- authentication flows;
- payment logic;
- matching or exchange logic;
- AI provider behavior;
- API response contracts;
- frontend code.

## Post-merge application and validation

After the PR is explicitly merged, apply the migration to production and verify:

```sql
select n.nspname as vector_schema
from pg_extension e
join pg_namespace n on n.oid = e.extnamespace
where e.extname = 'vector';
```

Expected:

```text
extensions
```

Verify the two tables:

```sql
select
  c.relname,
  c.relrowsecurity,
  array_agg(p.polname order by p.polname) filter (where p.polname is not null) as policies
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
left join pg_policy p on p.polrelid = c.oid
where n.nspname = 'public'
  and c.relname in ('contact_messages', 'translation_cache')
group by c.relname, c.relrowsecurity;
```

Then rerun Supabase Security Advisor. The only expected remaining database/Auth warning should be leaked-password protection until it is enabled manually in the Dashboard.

## Merge rule

Do not merge until Petru explicitly gives the exact command associated with this PR.
