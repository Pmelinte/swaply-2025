# Batch 65.2 — Zero-downtime profile compatibility bridge

## Status

`IMPLEMENTATION IN PROGRESS — NO PRODUCTION CHANGE`

This batch is a small application-only bridge created from the current `main` branch. It does not include the Batch 65 UI, does not apply a Supabase migration and does not authorize merge or Production deployment.

## Purpose

The current Production database does not yet expose `ensure_own_profile_v1` or `update_own_profile_v1`. The later Batch 65 database contract removes normal direct browser profile updates. The bridge keeps one application version compatible with both database states.

## Contract

For missing-profile bootstrap:

1. call `ensure_own_profile_v1` first;
2. use the current legacy owner `profiles.upsert(...)` only when the RPC is specifically reported missing;
3. never use the fallback for permission, RLS, validation or malformed-response errors.

For profile saves:

1. call `update_own_profile_v1` first with the current profile revision and an idempotency key;
2. use the current legacy owner `profiles.upsert(...)` only when the RPC is specifically reported missing;
3. never use the fallback for stale revision, permission, RLS, validation, idempotency or malformed-response errors.

The legacy fallback receives only fields that already exist in the current Production profile schema. The RPC path receives only the Batch 65 allow-listed owner-editable fields.

## Scope

- one compatibility service;
- focused unit tests for RPC-first behavior and exact fallback boundaries;
- minimal integration into the existing application state provider;
- no new user-facing profile controls;
- no database migration;
- no billing change;
- no merge without Petru's exact explicit command.

## Acceptance matrix

| Scenario | Expected |
|---|---|
| Current Production DB, missing ensure RPC | legacy bootstrap succeeds |
| Migrated DB, ensure RPC available | RPC bootstrap succeeds, no legacy write |
| Current Production DB, missing update RPC | legacy profile save succeeds |
| Migrated DB, update RPC available | revisioned RPC save succeeds |
| Stale revision | error surfaces, no fallback |
| RLS/permission failure | error surfaces, no fallback |
| Validation failure | error surfaces, no fallback |
| Malformed successful RPC response | error surfaces, no fallback |
| CI / Build / Visual Audit | PASS required |
| Vercel Preview | READY required |

## Production boundary

A later merge of this bridge still requires the explicit command for its PR number. After merge, Production verification must prove login, reload and one profile save against the unchanged database before any Batch 65 migration is authorized.
