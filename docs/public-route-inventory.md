# Swaply public route inventory

This inventory mirrors `src/lib/public-pages/publicRouteAudit.ts` and describes what the public visual audit protects.

## Visual audit routes

- `/en`
- `/en/objects`
- `/en/properties`
- `/en/services`
- `/en/events`
- `/en/explore`
- `/en/matching`
- `/en/messages`
- `/en/exchange`
- `/en/blog`
- `/en/about`
- `/en/contact`
- `/en/terms`
- `/en/privacy`
- `/en/safety`

## Drawer audit routes

- `/en/objects`
- `/en/properties`
- `/en/services`
- `/en/events`
- `/en/explore`
- `/en/matching`
- `/en/messages`
- `/en/exchange`
- `/en/blog`

## Context-only routes

These routes are documented as public-context surfaces, but they are not forced into brittle screenshots yet:

- `/chat`
- `/profile`

## Release smoke locales

Batch 7 adds a release readiness contract for route generation across:

- `en`
- `ro`
- `fr`
- `fil`

`fil` is included because it is a supported three-letter locale and protects locale stripping/routing logic.
