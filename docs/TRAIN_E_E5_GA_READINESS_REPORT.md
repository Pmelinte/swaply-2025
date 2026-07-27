# Swaply — Train E / E5 General Availability Readiness Report

**Date:** 2026-07-27  
**Repository:** `Pmelinte/swaply-2025`  
**Production:** `https://www.swaply.world`  
**Scope:** PR C — final E5 audit, security hardening and release gate evidence

## Verdict

**GA readiness: CONDITIONAL — not yet authorised for `v1.0.0`.**

The repository and Supabase Production parity gap identified by the independent Train E audit was closed by PR B. PR C addresses the remaining confirmed database security-advisor findings introduced by the new Train E RPCs and records the final release conditions.

No tag, GitHub Release, paid provider activation or Production commercial activation is performed by this PR. Publishing `v1.0.0` requires Petru's explicit release command after all checks below are green.

## Evidence completed

- PR A supplies the read-only E1.1 AI and legacy commercial inventory.
- PR B applies and verifies E3.1–E3.5 and E4.3/E4.4/E4.5/E4.7 in Supabase Production.
- Required Train E tables and RPCs exist in Production.
- RLS is enabled on the new Train E tables.
- Browser writes are denied for commercial authority tables.
- No real payment, affiliate, webhook, promotion or paid AI provider is activated.
- GitHub has no open issue labelled or titled P0/P1 at this checkpoint.

## Confirmed E5 security finding and correction

The Supabase security advisor reported that the new Train E `SECURITY DEFINER` RPCs remained executable by `anon` through inherited/default function privileges. This is a release-blocking authority-boundary defect even though every RPC also validates `auth.uid()` internally.

This PR adds a forward-only migration that:

- explicitly revokes function execution from both `PUBLIC` and `anon`;
- grants execution only to `authenticated` for participant-authorised RPCs;
- preserves the existing server-side participant, role, revision and lifecycle checks;
- pins `set_matching_session_updated_at()` to `pg_catalog, public` to remove its mutable search-path warning.

## Security advisor interpretation

Tables intentionally used only by server authority may have RLS enabled with no client policy. The advisor reports these as informational `rls_enabled_no_policy`; this is intentional deny-by-default behaviour where table privileges are also revoked from `anon` and `authenticated`.

Authenticated access to participant-authorised `SECURITY DEFINER` functions is intentional. Those functions are the canonical server authority and must remain callable by signed-in participants while enforcing internal ownership and lifecycle checks.

The separate Supabase Auth warning for leaked-password protection is an operator configuration recommendation. It does not change repository code and should be enabled in the Supabase dashboard before the final public GA release where the current plan supports it.

## Remaining E5 release gates

Before tagging `v1.0.0`, the release-candidate commit must show:

1. GitHub CI and all mandatory regression gates green;
2. Vercel Preview green, followed after merge by Vercel Production green;
3. the E5 migration applied to Supabase Production;
4. a repeat security-advisor check proving the six Train E RPCs are no longer executable by `anon`;
5. repository–migration–Production parity;
6. critical public and authenticated route smoke checks;
7. backup/restore/rollback evidence or an explicit owner-approved operational recovery record;
8. no open P0/P1 blockers;
9. explicit owner command authorising the `v1.0.0` tag and Train E closure.

## Release boundary

This PR may be merged only through the explicit command `Merge #...`.

After merge and Production verification, a separate explicit owner command is still required to publish `v1.0.0` and formally close Train E. There is no Train F.
