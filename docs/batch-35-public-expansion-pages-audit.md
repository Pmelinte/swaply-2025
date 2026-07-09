# Batch 35: Public expansion and empty-state pages audit

## Purpose

Batch 35 audits the public expansion and empty-state pages after Batch 34 removed the visible `Beta` badges from the global branch bar.

The goal is to confirm that pages outside the core Objects flow still have a clear public purpose, a safe logged-out state, and a usable next step without making the global navigation look unfinished.

## Scope

- Documentation-only audit.
- No UI changes.
- No route changes.
- No Supabase changes.
- No RLS changes.
- No auth changes.
- No API changes.
- No business-logic changes.
- No paid AI or translation provider activation.

## Production baseline

Batch 34 was verified before this audit was written.

- Production deployment: `dpl_41Kn9o7fnxVMVKH3Zoiz2cGfuFXc`.
- Production commit: `de8d7b20a93015b6d742567892440ba710667ff2`.
- Deployment status: `READY`.
- `/en` returned HTTP `200`.
- Recent production runtime logs for this deployment showed no `error`, `warning`, or `fatal` entries in the checked window.
- The live branch bar now presents the four domains without visible `Beta` badges: Objects, Properties, Services, Events.

## Pages audited

This audit covers:

- `/en/properties`
- `/en/services`
- `/en/events`
- `/en/messages`
- `/en/chat`
- `/en/exchange`

The public route and shell contracts already cover these routes through Playwright smoke tests. Batch 35 focuses on the page-level product state and user-facing copy.

## Findings by page

### `/en/properties`

Status: usable expansion page.

What is already present:

- Public logged-out guest banner.
- Public browse/listing page structure.
- Header with branch title and description.
- `Add property` CTA that sends logged-out users to registration with a return path.
- Search, view mode, filters, loading skeleton, list/grid cards.
- Empty state for both logged-in and logged-out users.
- Favorite action is protected for guests through `AuthGateModal`.

Risks:

- Several user-facing strings are hardcoded in English, including `Add property`, `Search by title, city, type…`, `properties found`, and `No properties available right now`.
- Empty-state copy reuses generic object translation keys instead of property-specific copy in some places.

Recommendation:

- Do not change the route now.
- In a later copy/i18n batch, move remaining hardcoded strings into translation files and make empty states property-specific.

### `/en/services`

Status: usable expansion page.

What is already present:

- Public logged-out guest banner.
- Public browse/listing page structure.
- Header with branch title and description.
- `Add service` CTA that sends logged-out users to registration with a return path.
- Search, view mode, filters, loading skeleton, list/grid cards.
- Empty state for both logged-in and logged-out users.
- Favorite action is protected for guests through `AuthGateModal`.

Risks:

- Several user-facing strings are hardcoded in English, including `Add service`, `Search by title, category, location…`, `services found`, and `No services available right now`.
- Empty-state copy reuses generic object translation keys instead of service-specific copy in some places.

Recommendation:

- Do not change the route now.
- In a later copy/i18n batch, move remaining hardcoded strings into translation files and make empty states service-specific.

### `/en/events`

Status: usable expansion page, slightly cleaner than Properties and Services.

What is already present:

- Public logged-out guest banner.
- Public browse/listing page structure.
- Header with branch title and description.
- `Add event` CTA that sends logged-out users to registration with a return path.
- Search, view mode, filters, loading skeleton, list/grid cards.
- Empty state for both logged-in and logged-out users.
- Guest empty-state copy uses the `events` translation namespace for `noEvents` and `noEventsDesc`.
- Favorite action is protected for guests through `AuthGateModal`.

Risks:

- Several user-facing strings are still hardcoded in English, including `Add event`, `Search by title, category, location…`, and `events found`.
- Some card labels such as `Online` and date formatting rely on runtime defaults rather than explicit locale formatting.

Recommendation:

- Keep the current route.
- In a later copy/i18n batch, move remaining hardcoded strings into translation files and standardize event date formatting by locale.

### `/en/messages`

Status: good public preview page.

What is already present:

- Logged-out visitors see a public preview instead of a broken private workspace.
- Preview explains the messages workspace purpose.
- Primary CTA sends users to login with `returnTo=/messages`.
- Secondary CTA links to Matching preview.
- Tool cards explain Translation, Checklist, Attachments, Courier details, and Final feedback.
- Logged-in users render the chat workspace.

Risks:

- The public preview copy is implemented as a local `en`/`ro` copy object inside the page rather than through the main translation files.
- This is safe for now but not global-first enough for the final 43-language direction.

Recommendation:

- Keep the preview route.
- In a later i18n/global-first batch, move local page copy into translation files and expand fallback coverage beyond `en`/`ro`.

### `/en/chat`

Status: functional demo route, but weaker public explanation than Messages.

What is already present:

- If no conversation id is supplied, the route renders `ChatPage` in `demo-1` mode.
- Demo mode creates a local fixture and does not require a real Supabase conversation.
- The chat UI can demonstrate checklist, messages, summary, and exchange CTA surfaces.
- Guest input is guarded by `loginRequired`.

Risks:

- `/en/chat` does not have a dedicated public preview wrapper like `/en/messages`.
- A logged-out visitor lands directly in a demo conversation, which may be useful for testing but less clear as public product copy.
- Several chat action labels remain hardcoded in English, including `Swaply`, `Back to Matching`, `Release this item?`, `Cancel`, and `Confirm & Release`.

Recommendation:

- Do not remove the demo route yet because it is useful for visual audit.
- Next safe patch should add a clearer public demo/preview explanation above or around the demo chat, without changing real chat persistence.
- Later, move remaining hardcoded chat action labels into translation files.

### `/en/exchange`

Status: good public preview page and safe authenticated workspace entry.

What is already present:

- Logged-out visitors see a public preview instead of private exchange data.
- Preview explains the exchange workspace purpose: checklist, logistics, shared details, final feedback.
- Primary CTA sends users to login with `returnTo=/exchange`.
- Secondary CTA links to Messages preview.
- Preview has a structured four-step explanation.
- Logged-in users see active swaps, auto-navigate to a single active swap, or receive an empty-state CTA back to Matching.

Risks:

- The public preview copy is implemented as a local `en`/`ro` copy object inside the page rather than through the main translation files.
- The code logs Supabase query errors to console when loading swaps; this is acceptable for debugging but should be reviewed later for production observability/noise.

Recommendation:

- Keep the current route.
- In a later i18n/global-first batch, move local page copy into translation files and expand fallback coverage beyond `en`/`ro`.

## Cross-page findings

### Finding 1 — Public safety is acceptable

The audited pages are not raw 404s and do not expose private data to logged-out visitors.

Messages and Exchange have explicit public previews. Properties, Services and Events have public browsing/listing states with registration CTAs. Chat has a demo mode rather than a private data exposure.

### Finding 2 — Global branch bar is now cleaner

After Batch 34, the main branch bar no longer marks Properties, Services and Events as `Beta`. This is the right direction for a global-first public shell.

Any maturity note should live inside the page, not in the global navigation.

### Finding 3 — i18n is the main debt

The largest shared issue is not route structure. It is copy consistency and translation readiness:

- hardcoded English strings remain in Properties, Services, Events and Chat;
- Messages and Exchange use local `en`/`ro` copy objects instead of the main translation files;
- some empty states reuse generic object strings instead of branch-specific strings.

### Finding 4 — Chat needs clearer public positioning

`/en/chat` is useful as a visual demo, but it is less self-explanatory than `/en/messages` and `/en/exchange`.

A small future patch should clarify that the page is a demo/preview for logged-out users and that real chat starts from Matching or Messages after login.

## Recommended Batch 36

Batch 36 should be a small copy/i18n preparation patch, not a database or business-logic patch.

Recommended target:

- Add or prepare translation keys for expansion-page empty states and CTAs.
- Move only the safest hardcoded labels from Properties, Services and Events into translation files.
- Do not touch Supabase queries, auth, item lifecycle, chat persistence, swap state transitions, or AI.

Alternative Batch 36 if Petru wants the original Train A plan:

- Metadata/canonical/legal/contact/blog review.

## Merge rule

Do not merge the Batch 35 PR until Petru gives the explicit command:

`Merge #...`
