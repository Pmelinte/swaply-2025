# Batch 29: Public route contract smoke tests

## Purpose

Rebuild the safe, useful part of old PR #366 from current `main`, without merging stale code.

This batch strengthens automated coverage for public routes before we start touching risky application flows such as Objects CRUD, Matching persistence, Chat, Exchange state transitions, Supabase, or RLS.

## Scope

- Test-only application change.
- One documentation file.
- No UI changes.
- No route implementation changes.
- No auth changes.
- No Supabase or database changes.
- No business logic changes.
- No Vercel environment changes.

## Public canonical route contract

The smoke suite now checks that these public routes return HTTP `>= 200` and `< 400`:

- `/en`
- `/en/objects`
- `/en/explore`
- `/en/matching`
- `/en/messages`
- `/en/exchange`
- `/en/chat`
- `/en/properties`
- `/en/services`
- `/en/events`
- `/en/blog`
- `/en/about`
- `/en/contact`

A public route returning `404`, `401`, `403`, or `5xx` is now a test failure.

## Legacy route redirect contract

The smoke suite now verifies legacy aliases that already resolve in production:

- `/en/match` → `/en/matching`
- `/en/change` → `/en/exchange`

## Known gap: `/en/items`

Live production currently returns `404` for `/en/items`.

The test suite documents this as `test.fixme` instead of failing CI, because this batch is test-only and does not implement redirects.

Recommended follow-up:

- Batch 30 should add `/[locale]/items` → `/[locale]/objects`, then convert the `fixme` into an active test.

## Admin route guardrails

Admin routes remain guarded differently depending on auth state. The smoke suite only asserts they do not server-error (`< 500`):

- `/en/admin/canonical`
- `/en/admin/flows`
- `/en/admin/live-data`
- `/en/admin/matching-engine`

## Validation target

CI should pass:

- Unit Tests
- Lint & Type Check
- Build
- Public Visual Audit

After merge, Vercel production should deploy without runtime warnings/errors/fatal logs.
