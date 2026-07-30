# Swaply database migration governance

**Active epoch:** `V1-02-R5`  
**Baseline application SHA:** `b81480e4c2d6275ad03e78b33c1715f8ca781c6b`  
**Supabase Production project:** `keaejxlwqtjjglijiplh`  
**Forward-only boundary:** versions strictly greater than `20260730122901`

## Purpose

The migration directory contains a verified historical layer, generated Production mappings, one documented historical version collision, mixed legacy files and one operational Auth one-shot. It is not an indiscriminate pending queue.

R4 classified every SQL file that existed at the baseline and every Production migration-history row. R5 makes that classification executable in CI without rewriting Production history.

## Machine-readable sources

- `supabase/migration-governance/r4-classification-snapshot.json` — immutable R4 baseline classification;
- `supabase/migration-governance/forward-epoch.json` — active forward-only registry and rules;
- `scripts/check-migration-governance.mjs` — local and CI enforcement.

The normalized R4 snapshot must retain SHA-256:

```text
dcb61e8d49fd7b41cdafe5e68fd9e2b6db2299dfb4b7d5029587fc83a0f6c88b
```

## Permanent rules

1. Applied or historical SQL files are immutable. Do not edit, delete or rename them.
2. Every new migration uses a unique 14-digit version greater than `20260730122901`.
3. Every new migration is listed in `forward-epoch.json` with `kind: FORWARD_ONLY` in the same PR.
4. Every new migration contains only the approved delta for the current Production schema.
5. A database-changing PR includes authority, RLS, grant and search-path verification plus a contract test where applicable.
6. Production application requires a separate explicit owner command and creates one immutable history row.
7. After application, repository, migration history, objects, grants and advisors are rechecked.
8. Production history is never repaired by replay, deletion, renaming or manufactured timestamp equality.

## Historical exception

Version `20260324200000` is used by two historical files. This exact collision is preserved and allowlisted by the R4 manifest. The guard rejects every other duplicate version, including any new duplicate.

## Unsafe operational file

`20260710152500_quarantine_demo_auth_accounts.sql` is classified as `UNSAFE_OPERATIONAL_ONE_SHOT`. It is not part of automated migration flow. Any equivalent future operation requires its own explicit authorization, live preflight and post-verification.

## Prohibited automation

Repository scripts and GitHub Actions must not invoke the full historical directory with the Supabase include-all option. The CI guard scans executable automation and fails when that command is introduced.

## Required commands

```bash
npm run migration:guard
npm run migration:guard:self-test
```

The first command validates the real repository inventory and, in CI, the migration diff. The second proves that the guard rejects an unclassified migration, a duplicate future version and forbidden replay automation.

## Adding a future migration

1. Create a new file under `supabase/migrations/` with a unique version greater than the epoch boundary.
2. Add the exact path, version, logical name and `kind: FORWARD_ONLY` to `forward-epoch.json`.
3. Run both guard commands.
4. Add contract/security tests appropriate to the change.
5. Open one PR and obtain explicit merge authorization.
6. Obtain separate explicit authorization before applying the migration to Supabase Production.

No current R5 file applies a database migration or modifies Production.
