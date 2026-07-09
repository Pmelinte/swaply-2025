# Batch 31: Admin diagnostic smoke test

## Purpose

Batch 31 rebuilds the safe useful part of old PR #362 from current `main`.

The goal is to make `/en/admin/diagnostic` part of the Playwright smoke contract without assuming one single authentication state.

## Scope

- Test-only application coverage plus this documentation file.
- No UI changes.
- No Supabase changes.
- No RLS changes.
- No auth changes.
- No business-logic changes.
- No production feature activation.

## Contract

The admin diagnostic route is considered healthy when:

1. It returns HTTP `>= 200` and `< 500`.
2. The final URL is either:
   - `/en/admin/diagnostic`, when the diagnostic page or inline admin guard is rendered; or
   - `/en/login`, if routing/middleware redirects unauthenticated visitors to login.
3. The visible page shows either:
   - `Swaply diagnostic`; or
   - a safe auth/access guard such as authenticate, access restricted, auth required, login, or sign in.
4. A screenshot is captured as `test-results/admin-admin-diagnostic.png` even if the assertion fails.

## Why this replaces the old PR #362 approach

The old PR #362 idea was useful, but the test was too narrow because it expected auth/login copy to be visible. That can fail when the real diagnostic page is rendered for an admin session.

This batch accepts both correct states and only fails on server errors, broken routing, or missing visible diagnostic/guard content.

## Validation target

Expected CI:

- Unit Tests
- Lint & Type Check
- Build
- Public Visual Audit / Playwright

After merge/deploy:

- Vercel deployment should become `READY`.
- `/en/admin/diagnostic` should not produce production runtime `error`, `warning`, or `fatal` logs.
