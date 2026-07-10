# Batch 48: Train C demo Auth quarantine

## Purpose

Train C opened with an authenticated-flow inventory. Before a two-user end-to-end audit could begin, the inventory found a P0 authentication exposure in the production demo population.

The active repository seed created 100 confirmed `demoN@swaply.test` Auth users with one deterministic shared password. The password was committed to Git history. Production verification showed:

- 100 matching demo Auth users;
- all 100 still accepted the repository-known password at hash level;
- none was banned;
- no active demo sessions or refresh tokens existed at the time of verification.

These identities own public demo profiles and items, so deleting them could remove or orphan public content. The safe response is to preserve ownership rows while eliminating login capability.

## Changes

### Production migration

`supabase/migrations/20260710152500_quarantine_demo_auth_accounts.sql`

- deletes any demo refresh tokens and sessions;
- assigns every demo account an independent unknown random password;
- bans interactive login until 2099;
- preserves `auth.users`, profiles, items and identities;
- fails if the former repository-known password still validates after rotation.

### Active seed guard

`supabase/seed.sql`

- replaces the insecure demo seed with a no-op security notice;
- prevents accidental recreation of login-capable demo users with shared credentials;
- leaves the old seed recoverable from Git history for later secure redesign.

### Manual hotfix replacement

`supabase/fix-auth-identities.sql`

- no longer assigns a shared password;
- now performs the same quarantine model as the production migration;
- keeps demo ownership records intact.

### Regression test

`src/__tests__/demo-auth-seed-security.test.ts`

- ensures the former shared password is absent from active seed/hotfix files;
- ensures the active seed does not insert Auth users;
- ensures the quarantine notice remains present.

## Scope boundaries

This batch does not change:

- real user credentials;
- real user sessions;
- profiles or items data;
- RLS policies;
- application Auth UI;
- matching, chat, exchange, payments or AI behavior;
- demo content visibility.

## Application rule

The migration must not be applied until Petru explicitly approves the PR merge.

After merge and migration application, verify:

1. 100 demo users remain in `auth.users`.
2. Zero demo users validate the former shared password.
3. All 100 demo users are banned.
4. Zero demo sessions and refresh tokens remain.
5. Demo profiles and demo items counts remain unchanged.
6. Production deployment is `READY` and public pages still return HTTP 200.

## Train C continuation

After this P0 is closed, the next batch resumes the planned authenticated baseline audit with two dedicated, non-demo test users:

- login/session persistence;
- own-profile read/write;
- cross-user ownership denial;
- object CRUD boundaries;
- wishlist;
- matching;
- chat participant isolation;
- exchange lifecycle and feedback.
