# Batch 65.5 — Strict browser profile RPC boundary

**Train:** D  
**Deliverable:** D1 — global-first profile and common infrastructure  
**Scope:** application authority hardening only

## Goal

Remove the legacy direct browser write fallback from ordinary profile bootstrap and profile persistence. The canonical functions `ensure_own_profile_v1` and `update_own_profile_v1` are now the only authority used by the shared application profile service.

## Delivered

- missing-profile bootstrap calls `ensure_own_profile_v1` only;
- ordinary owner profile saves call `update_own_profile_v1` only;
- missing RPC, stale revision, validation, authorization and malformed response failures remain visible and never fall back to `public.profiles` writes;
- positive revision validation remains mandatory;
- idempotency remains mandatory for profile updates;
- the existing caller payload shape is retained temporarily to avoid an unrelated state-provider rewrite, but the legacy payload is never sent to Supabase;
- focused unit and static integration tests prove that the bridge contains no `.from("profiles")` write path.

## Safety boundary

- no Supabase migration;
- no Production data mutation;
- no Auth, RLS, grant or policy change;
- no Train C lifecycle change;
- no paid service or new cost;
- profile reads and account deletion remain unchanged.

## Deliberate remaining boundary

The onboarding wizard still contains its historical direct owner profile update. It is not hidden by this unit. The next Batch 65 unit must:

1. route onboarding fields through a canonical server-side owner authority;
2. preserve all current onboarding fields and global-first language behavior;
3. prove browser persistence and stale-revision recovery;
4. revoke direct authenticated `INSERT` and `UPDATE` on `public.profiles` only after the canonical onboarding path is live and verified;
5. close Batch 65 before Batch 66 begins.

## Acceptance gates

- Unit Tests pass;
- Lint & Type Check pass;
- Next.js Production Build passes;
- Public Visual Audit passes;
- exact-head Vercel Preview is `READY`;
- Preview routes and runtime logs show no critical regression;
- post-merge Production deployment and runtime are verified.
