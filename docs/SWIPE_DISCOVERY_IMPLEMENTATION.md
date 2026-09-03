# Swipe Discovery — implementation note

Branch: `codex/explore-domain-architecture`. Baseline: `7a86027c`.
This is a branch implementation note, not an amendment to the frozen canonical product specification.

## Scope

All four domain pages now render explicit wants, Swipe Discovery, the existing Horizon/map, explicit offers and Demand Discovery in that order. The general Explore hub, map behavior, Matching, Exchange and canonical specification files are unchanged.

Swipe includes a large active card and next-card stack, native Pointer Events for touch/mouse, explicit dismiss/interested/strong-interest buttons, keyboard arrows, focus visibility, live action announcements, reduced-motion styles, automatic progression, completion/empty/loading/error states, restart and local undo. Missing images and metadata are not fabricated.

A minimal accessibility correction gives the existing domain-page grid/list/filter controls their i18n labels in React. This prevents the global AccessibleNameGuard from mutating them before hydration; it does not change their behavior.

## Persistence and guest behavior

| Level | Behavior in this implementation |
| --- | --- |
| dismissed | React state for this page visit only |
| interested | Separate React state for this page visit only |
| strong_interest | Separate React state for this page visit only |
| explicit wish | Existing profile concept, never created or changed by Swipe |

Undo removes the most recent local decision; restart clears local decisions. Leaving/reloading the page, changing domain, or changing viewer resets the deck state. There are no new database writes, RPC mutations, localStorage/sessionStorage writes or matching requests. The UI explicitly discloses this for guests and signed-in viewers. Since no persistent action is offered, discovery is never login-gated.

## Data

- Objects: isolated, abortable anonymous/RLS-governed read of active `items`, capped at 200. The selected columns were checked against the deployed schema; no `wizard_type` select is used because it is absent there.
- Properties and Services: their existing public dedicated-table/item fallback sources and filters, preserving original row metadata and demo flags.
- Events: the existing public `/api/items/events` source and its filters.
- Own offers, duplicates, inactive rows and explicitly cross-domain rows are excluded.
- Real structured dates/capacity/bedrooms/service format/event location_type/reach/owner wants are shown only when supplied. UTC date formatting avoids server/client timezone drift. Availability weekdays use locale formatting.
- Exact addresses, coordinates, venue details and private ticket transfer credentials are not read into cards.
- Public transfer format is shown only if such a public field exists; no digital/physical transfer is inferred from an event's attendance format.
- “Why do I see this?” is neutral, or states only that listing/profile indicate the same city. It does not claim a distance calculation, compatibility score or guaranteed exchange.
- Explicitly marked demo rows remain marked as demo. End state describes only the currently loaded/filtered set; there is no fabricated total or unlimited-deck claim.

## Verification

- TypeScript: passed.
- Relevant Vitest suite: 176 passed across five files, including all four domains in all 43 locale catalogues.
- Full ESLint: zero errors, 73 existing warnings; no newly introduced warnings.
- Browser suite: 24 passed — Objects/Properties/Services/Events × desktop/tablet/mobile × English/Romanian.
- Native mouse and touch left/right, buttons, strong interest, next card, undo, end, restart, keyboard focus, reload reset, guest access, no mutation requests, no hydration errors and no horizontal overflow were verified.
- Guest browser tests use deterministic intercepted public fixtures. Service workers are blocked only in the test configuration so they cannot bypass fixture interception.
- Signed-in viewer behavior and exclusion of own offers are covered by component tests. An actual authenticated browser session was not supplied, so live logged-in E2E is not claimed.
- Production build: `npm run build` passed (including the 43-locale contract check and 222 generated pages).

Reproduce:

```text
npm run typecheck
npm run lint
npx vitest run src/__tests__/swipe-discovery.test.tsx src/__tests__/explore-architecture.test.ts src/__tests__/explore-hub.test.tsx src/__tests__/explore-i18n-contract.test.tsx src/__tests__/properties.test.ts
npm run build
npx playwright test --config playwright.swipe.config.ts
```

Browser tests default to an already-running localhost:3100 instance. For isolated local fixtures, start that instance with a test-only NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY. Alternatively set SWIPE_PREVIEW_URL to a Preview with the public Supabase client configured. Fixture tests never need real account credentials.

## Not implemented

No backend interest persistence, explicit-wish creation, new authentication flow, new matching/AI logic, Reverse Exploration, Photo Search, map expansion, Exchange changes, merge or PR.

## Complete changed-file list (55)

- `src/app/[locale]/objects/page.tsx`
- `src/app/[locale]/properties/page.tsx`
- `src/app/[locale]/services/page.tsx`
- `src/app/[locale]/events/page.tsx`
- `src/components/explore/ExploreWorld.tsx`
- `src/components/explore/DomainSwipeDiscovery.tsx`
- `src/components/explore/ObjectSwipeSource.tsx`
- `src/lib/explore/swipeDiscovery.ts`
- `src/__tests__/swipe-discovery.test.tsx`
- `e2e/swipe-discovery.spec.ts`
- `playwright.swipe.config.ts`
- `src/messages/ar.json`
- `src/messages/bg.json`
- `src/messages/bn.json`
- `src/messages/cs.json`
- `src/messages/da.json`
- `src/messages/de.json`
- `src/messages/el.json`
- `src/messages/en.json`
- `src/messages/es.json`
- `src/messages/et.json`
- `src/messages/fa.json`
- `src/messages/fi.json`
- `src/messages/fil.json`
- `src/messages/fr.json`
- `src/messages/ga.json`
- `src/messages/hi.json`
- `src/messages/hr.json`
- `src/messages/hu.json`
- `src/messages/id.json`
- `src/messages/it.json`
- `src/messages/ja.json`
- `src/messages/ko.json`
- `src/messages/lt.json`
- `src/messages/lv.json`
- `src/messages/mn.json`
- `src/messages/ms.json`
- `src/messages/mt.json`
- `src/messages/nl.json`
- `src/messages/no.json`
- `src/messages/pl.json`
- `src/messages/pt.json`
- `src/messages/ro.json`
- `src/messages/ru.json`
- `src/messages/sk.json`
- `src/messages/sl.json`
- `src/messages/sr.json`
- `src/messages/sv.json`
- `src/messages/th.json`
- `src/messages/tr.json`
- `src/messages/uk.json`
- `src/messages/vi.json`
- `src/messages/yi.json`
- `src/messages/zh.json`
- `docs/SWIPE_DISCOVERY_IMPLEMENTATION.md`
