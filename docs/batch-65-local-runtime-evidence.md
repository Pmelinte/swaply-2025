# Batch 65 — Local runtime evidence

## Status

`PASS — EPHEMERAL LOCAL DATABASE`

This evidence was produced without a Supabase cloud branch, without changing the Supabase subscription, and without touching Production.

## Execution

- GitHub workflow: `Batch 65 Database Runtime`
- Workflow run: `29511343220`
- Run number: `1`
- Tested head: `9a87c9367e087b5e0493fb6f9f2912416f55e2db`
- Runner: standard `ubuntu-latest`
- Database: local Supabase Postgres 17 container
- Production project reference: not supplied to the workflow
- Supabase access token: not used
- Production credentials: not used
- Telemetry: disabled with `SUPABASE_TELEMETRY_DISABLED=1` and `DO_NOT_TRACK=1`

## Applied migration chain

1. `20260716130000_batch_65_global_profile_contract.sql`
2. `20260716130100_batch_65_profile_revision_guard.sql`
3. `20260716130200_batch_65_locale_registry_completion.sql`

The migrations were applied to a Production-shaped synthetic baseline containing only deterministic Batch 65 fixture users and relationships.

## Passed runtime domains

| Domain | Result |
|---|---|
| Migration application | PASS |
| Additive schema and constraints | PASS |
| Legacy language backfill | PASS |
| 43-locale registry compatibility | PASS |
| Owner-only raw profile RLS | PASS |
| Anonymous raw profile denial | PASS |
| Direct authenticated UPDATE revocation | PASS |
| Canonical owner RPC | PASS |
| Unsupported-field/IDOR rejection | PASS |
| Public profile projection | PASS |
| Private profile removal from discovery | PASS |
| Optional public fields require consent | PASS |
| Participant minimal identity | PASS |
| Outsider identity denial | PASS |
| Admin minimal identity | PASS |
| Moderator minimal identity | PASS |
| Initial privileged-field guard | PASS |
| Idempotent replay | PASS |
| Idempotency conflict | PASS |
| Stale revision rejection | PASS |
| Two-session CAS race | PASS — one winner, one stale rejection |
| Revision increments exactly once | PASS |
| Fixture cleanup | PASS |
| Residual fixture rows | 0 |
| Container destruction | PASS |

## Files forming the reproducible evidence

- `.github/workflows/batch-65-database-runtime.yml`
- `supabase/config.toml`
- `supabase/tests/batch_65_runtime_setup.sql`
- `supabase/tests/batch_65_runtime_assertions.sql`
- `scripts/test-batch-65-concurrency.sh`
- `supabase/tests/batch_65_runtime_cleanup.sql`

## Boundary of this proof

This validates the Batch 65 SQL and security behavior against an isolated schema shaped after the audited Production contract. It does not copy or mutate Production data. The separate read-only Production inventory remains the evidence for compatibility with the current 957 profile rows.

No merge or Production migration is authorized by this result.
