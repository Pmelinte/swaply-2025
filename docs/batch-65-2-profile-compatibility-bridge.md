# Batch 65.2 — Zero-downtime profile compatibility bridge

## Status

`CORRECTED — FINAL RE-AUDIT REQUIRED — NO PRODUCTION CHANGE`

This batch is a small application-only bridge created from the current `main` branch. It does not include the Batch 65 UI, does not apply a Supabase migration and does not authorize merge or Production deployment.

## Purpose

The current Production database does not yet expose `ensure_own_profile_v1` or `update_own_profile_v1`. The later Batch 65 database contract removes normal direct browser profile updates. The bridge keeps one application version compatible with both database states.

## Contract

For missing-profile bootstrap:

1. call `ensure_own_profile_v1` first;
2. use the current legacy owner `profiles.upsert(...)` only when the RPC is specifically reported missing with code `PGRST202` or `42883` and the error names `ensure_own_profile_v1`;
3. never use the fallback for permission, RLS, validation, malformed-response or uncoded message-only errors;
4. when the Auth user has no usable email, generate the unique deterministic username `user_<uuid-without-hyphens>` before the legacy insert.

For profile saves:

1. call `update_own_profile_v1` first with the current profile revision and an idempotency key;
2. use the current legacy owner `profiles.upsert(...)` only when the RPC is specifically reported missing with code `PGRST202` or `42883` and the error names `update_own_profile_v1`;
3. never use the fallback for stale revision, permission, RLS, validation, idempotency, malformed-response or uncoded message-only errors;
4. require every successful RPC response to contain a positive integer profile revision, and reject contradictory envelope/profile revisions.

The legacy fallback receives only fields that already exist in the current Production profile schema. The RPC path receives only the Batch 65 allow-listed owner-editable fields.

## Scope

- one compatibility service;
- focused unit tests for RPC-first behavior and exact fallback boundaries;
- deterministic collision-free bootstrap for Auth users without email;
- strict positive revision validation for successful RPC responses;
- minimal integration into the existing application state provider;
- no new user-facing profile controls;
- no database migration;
- no billing change;
- no merge without Petru's exact explicit command.

## Acceptance matrix

| Scenario | Expected |
|---|---|
| Current Production DB, missing ensure RPC | legacy bootstrap succeeds |
| Email-less Auth user, missing ensure RPC | unique `user_<uuid>` bootstrap succeeds |
| Migrated DB, ensure RPC available | RPC bootstrap succeeds, no legacy write |
| Current Production DB, missing update RPC | legacy profile save succeeds |
| Migrated DB, update RPC available | revisioned RPC save succeeds |
| Missing, zero or contradictory RPC revision | error surfaces, no fallback |
| Stale revision | error surfaces, no fallback |
| RLS/permission failure | error surfaces, no fallback |
| Validation failure | error surfaces, no fallback |
| Message-only missing-function text without approved code | error surfaces, no fallback |
| Malformed successful RPC response | error surfaces, no fallback |
| CI / Build / Visual Audit | PASS required |
| Vercel Preview | READY required |

## Production sequencing boundary

After migration 4, both RPCs must be confirmed through the authenticated Data API before migration 5 removes direct profile `UPDATE`. A transient or stale PostgREST schema cache must not be treated as sufficient evidence that the canonical RPC path is ready.

A later merge of this bridge still requires the explicit command for PR #476. After merge, Production verification must prove login, reload and one profile save against the unchanged database before any Batch 65 migration is authorized.
