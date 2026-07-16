# Batch 65.1 — Production rollback plan

## Status

`PREPARED — NOT EXECUTED`

This document describes the emergency recovery path if Batch 65 is later applied to Supabase Production and the application must be rolled back. It does not authorize a Production migration, deployment or merge.

## Principle

Supabase migration history must not be rewritten. Any rollback is delivered as a new forward-only migration, reviewed separately and applied only after an explicit incident decision.

The additive profile columns may safely remain in place. The emergency goal is to restore the previous application's ability to save owner profiles while preserving the hardened public projection wherever possible.

## Pre-apply evidence required

Before any Production apply, capture read-only evidence for:

- current `profiles` and `public_profiles` columns;
- current RLS policies and table grants;
- definitions and owners of `sync_public_profile`, `protect_profile_privileged_fields` and profile-completeness functions;
- current profile/auth/public-profile row counts;
- current migration list;
- current production deployment SHA.

## Rollback trigger conditions

Prepare the forward rollback immediately if any of these is observed after apply:

- authenticated profile bootstrap fails;
- Profile or Onboarding cannot save;
- a valid owner receives repeated stale conflicts without recovery;
- private profiles become visible to outsiders or anonymous users;
- existing participants cannot resolve minimal identity;
- profile synchronization causes repeated runtime errors;
- profile row counts or public/private projection counts diverge unexpectedly.

## Emergency sequence

1. Stop further application rollout and keep PR merge disabled.
2. Record the exact database migration version and application deployment SHA.
3. Keep Production traffic on the last known-good application deployment where possible.
4. Apply a new emergency migration that restores owner-only direct UPDATE compatibility:
   - grant `UPDATE` on `public.profiles` to `authenticated`;
   - recreate `update_own_profile` with both `USING` and `WITH CHECK` equal to `auth.uid() = user_id`;
   - do not grant anonymous access;
   - do not weaken privileged-field protection.
5. Leave the additive Batch 65 columns in place.
6. Leave the sanitized public projection in place unless the projection itself caused the incident.
7. Verify owner, outsider and anonymous access before restoring normal traffic.
8. Verify Profile and Onboarding against the restored application version.
9. Inspect PostgreSQL, Auth and Vercel runtime logs.
10. Open a corrective PR; do not edit or delete applied migration files.

## Forward rollback SQL template

This template is intentionally not in `supabase/migrations`, so it cannot be applied automatically. A real incident migration must receive a new timestamp and a separate explicit authorization.

```sql
begin;

grant update on table public.profiles to authenticated;

drop policy if exists update_own_profile on public.profiles;
create policy update_own_profile
on public.profiles
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

commit;
```

## Post-rollback acceptance checks

- owner can read and update only their own raw profile;
- outsider cannot read or update another raw profile;
- anonymous cannot read `profiles`;
- privileged role, trust, verification, subscription, token and API fields remain protected;
- public profile location remains city/country only;
- private profile is absent from anonymous discovery;
- existing participant receives only minimal identity;
- no profile, Auth user or public projection row is deleted by rollback;
- GitHub CI, Vercel deployment and runtime logs are green.

## Non-goals

The emergency rollback does not:

- remove additive columns;
- delete idempotency records;
- rewrite migration history;
- restore broad public exposure of biographies, interests, occupation, websites or social links;
- change Train C swap lifecycle behavior.
