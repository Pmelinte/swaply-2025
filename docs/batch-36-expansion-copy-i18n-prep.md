# Batch 36: Expansion copy and i18n preparation

## Purpose

Batch 36 prepares the safest copy/i18n pass after Batch 35 identified the main public expansion-page debt.

The goal is not to rewrite the public pages in this batch. The goal is to define the exact translation-key contract and replacement map so the next implementation batch can be small, reviewable, and safe across the full global-first language set.

## Scope

- Documentation and i18n preparation only.
- No UI behavior changes.
- No route changes.
- No Supabase changes.
- No RLS changes.
- No auth changes.
- No API changes.
- No business-logic changes.
- No paid AI or translation provider activation.

## Production baseline

Batch 35 was verified before starting this preparation.

- Production deployment: `dpl_4W9cbn77WbFUKStaAqMR83HpMnfA`.
- Production commit: `c2a70c2d355ddcee08bc455b96aef9f2143dde4c`.
- Deployment status: `READY`.
- `/en` returned HTTP `200`.
- Recent production runtime logs for this deployment showed no `error`, `warning`, or `fatal` entries in the checked window.

## Why this batch is preparation-first

The project has a global-first language direction. Changing page copy by adding keys to only `en` and `ro` would create a false sense of completion and may introduce missing-key risk in other locales.

The safer sequence is:

1. Define the key namespace and exact replacement map.
2. Add the keys consistently across translation files or through an approved fallback strategy.
3. Replace the safest hardcoded labels in one narrow implementation PR.
4. Keep Supabase queries, auth flow, matching, chat persistence, and exchange state untouched.

## Proposed namespace

Use a dedicated namespace:

```json
"expansionPages": {
  "properties": {},
  "services": {},
  "events": {},
  "messages": {},
  "chat": {},
  "exchange": {}
}
```

This avoids overloading the existing `objects`, `branches`, `chat`, and `exchange` namespaces with branch-specific public-page copy.

## Properties keys

Target file:

- `src/app/[locale]/properties/page.tsx`

Recommended keys:

```json
"properties": {
  "addCta": "Add property",
  "searchPlaceholder": "Search by title, city, type…",
  "resultsCount": "{count, plural, one {# property found} other {# properties found}}",
  "emptyGuestTitle": "No properties available right now",
  "emptyLoggedTitle": "No properties yet",
  "emptyLoggedSub": "Add a property you can exchange, host, swap or offer for a longer stay.",
  "emptyLoggedSubFilters": "No properties match your current filters.",
  "clearFilters": "Clear filters"
}
```

Current hardcoded / generic copy to replace later:

- `Add property`
- `Search by title, city, type…`
- `{filtered.length} properties found`
- `No properties available right now`
- generic object empty-state copy used on logged-in empty states

## Services keys

Target file:

- `src/app/[locale]/services/page.tsx`

Recommended keys:

```json
"services": {
  "addCta": "Add service",
  "searchPlaceholder": "Search by title, category, location…",
  "resultsCount": "{count, plural, one {# service found} other {# services found}}",
  "emptyGuestTitle": "No services available right now",
  "emptyLoggedTitle": "No services yet",
  "emptyLoggedSub": "Add a skill, service, consultation or practical help you can exchange.",
  "emptyLoggedSubFilters": "No services match your current filters.",
  "clearFilters": "Clear filters"
}
```

Current hardcoded / generic copy to replace later:

- `Add service`
- `Search by title, category, location…`
- `{filtered.length} services found`
- `No services available right now`
- generic object empty-state copy used on logged-in empty states

## Events keys

Target file:

- `src/app/[locale]/events/page.tsx`

Recommended keys:

```json
"events": {
  "addCta": "Add event",
  "searchPlaceholder": "Search by title, category, location…",
  "resultsCount": "{count, plural, one {# event found} other {# events found}}",
  "onlineBadge": "Online",
  "emptyGuestTitle": "No events available right now",
  "emptyGuestSub": "Events, tickets and reservations will appear here when people offer them for exchange.",
  "emptyLoggedTitle": "No events yet",
  "emptyLoggedSub": "Add a ticket, reservation, access pass or event package you can exchange.",
  "emptyLoggedSubFilters": "No events match your current filters.",
  "clearFilters": "Clear filters"
}
```

Current hardcoded / generic copy to replace later:

- `Add event`
- `Search by title, category, location…`
- `{filtered.length} events found`
- `Online`
- generic object empty-state copy used on logged-in empty states

## Messages keys

Target file:

- `src/app/[locale]/messages/page.tsx`

Current status:

- Good public preview behavior exists.
- Copy is currently local to the page with `en` and `ro` variants.

Recommended future move:

```json
"messages": {
  "publicPreview": {
    "badge": "Public preview",
    "title": "Messages workspace",
    "body": "After login, Swaply keeps every exchange discussion, checklist and final confirmation in one workspace.",
    "login": "Sign in to continue",
    "matching": "See matching preview",
    "tools": ["Translation", "Checklist", "Attachments", "Courier details", "Final feedback"]
  }
}
```

Replacement should preserve the current logged-out safety behavior.

## Chat keys

Target files:

- `src/app/[locale]/chat/page.tsx`
- `src/components/chat/ChatPage.tsx`

Current status:

- `/en/chat` renders `demo-1` when no conversation id is provided.
- This is useful for visual audit but less explanatory than `/en/messages`.

Recommended future keys:

```json
"chat": {
  "publicDemo": {
    "badge": "Demo preview",
    "title": "See how a Swaply conversation works",
    "body": "Real conversations start after Matching. This demo shows the checklist, messages and exchange handover tools without exposing private data.",
    "login": "Sign in to start a real chat",
    "matching": "Go to Matching"
  },
  "actions": {
    "goToExchange": "Go to Exchange",
    "backToMatching": "Back to Matching",
    "releaseTitle": "Release this item?",
    "releaseBody": "Releasing this item will remove it from this swap and make it available again. Are you sure?",
    "cancel": "Cancel",
    "confirmRelease": "Confirm & Release"
  }
}
```

Replacement should not change real chat persistence, Supabase reads/writes, message sending, checklist state, or summary generation.

## Exchange keys

Target file:

- `src/app/[locale]/exchange/page.tsx`

Current status:

- Good public preview behavior exists.
- Copy is currently local to the page with `en` and `ro` variants.

Recommended future move:

```json
"exchange": {
  "publicPreview": {
    "badge": "Public preview",
    "heading": "Manage the exchange after both sides agree",
    "description": "The exchange workspace turns a match into a clear handover: checklist, logistics, shared details and final feedback.",
    "signin": "Sign in to manage exchanges",
    "messagesPreview": "See messages preview"
  }
}
```

The current logged-out protection should be preserved.

## Replacement order for implementation

Recommended safest order for Batch 37 or later:

1. Properties CTA, search placeholder, count and empty-state copy.
2. Services CTA, search placeholder, count and empty-state copy.
3. Events CTA, search placeholder, count, `Online`, and empty-state copy.
4. Chat public demo wrapper and action-label copy.
5. Messages public preview copy move.
6. Exchange public preview copy move.

## Guardrails for the implementation batch

- Do not edit Supabase queries.
- Do not edit RLS policies.
- Do not edit auth redirect behavior.
- Do not edit item/service/property/event data models.
- Do not edit chat message persistence.
- Do not edit swap/exchange state transitions.
- Do not activate paid AI translation.
- Keep public route smoke tests green.
- Keep logged-out public previews safe.

## Recommended Batch 37

Batch 37 should implement step 1 only:

- Properties copy/i18n replacement.
- One page only.
- No data/query/auth/business-logic changes.

After Properties is safe, repeat the same pattern for Services and Events.

## Merge rule

Do not merge the Batch 36 PR until Petru gives the explicit command:

`Merge #...`
