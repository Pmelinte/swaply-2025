# Batch 39: Events copy/i18n pass

## Purpose

Batch 39 repeats the narrow copy/i18n pattern from Batch 37 and Batch 38, this time for the public Events page.

The target is only the public Events page. The patch reduces hardcoded English copy by reusing translation keys that already exist across the global language files.

## Scope

- One page: `src/app/[locale]/events/page.tsx`.
- One documentation file.
- No new routes.
- No Supabase query changes.
- No RLS changes.
- No auth changes.
- No API changes.
- No business-logic changes.
- No paid AI or translation provider activation.

## Production baseline

Batch 38 was verified before starting this patch.

- Production deployment: `dpl_EbZxGCBYsyCKqtbV8XS49zDNtf33`.
- Production commit: `b89398ca39960aa1d006e1507d95006b7fe7f567`.
- Deployment status: `READY`.
- `/en` returned HTTP `200`.
- Recent production runtime logs for this deployment showed no `error`, `warning`, or `fatal` entries in the checked window.

## Implementation decision

Do not add a new `expansionPages.events` namespace in only one or two locales.

Instead, this batch uses existing shared translation namespaces:

- `common.add`
- `common.search`
- `branches.events`
- `branches.eventsDesc`
- existing `objects` empty-state and filter helper keys where they are already used safely

This avoids missing translation keys across the broader language set.

## Changes

The Events page now derives shared labels from existing translation keys:

- header title uses `branches.events` through a local `eventLabel` variable;
- primary CTA derives from `common.add + branches.events`;
- logged-in empty-state CTA uses the same derived add label;
- search placeholder derives from `common.search + branches.events`;
- result count uses the translated branch label instead of hardcoded `events found`;
- logged-in empty state uses `branches.events` and `branches.eventsDesc` when there are no filters;
- logged-out empty state uses `branches.events` and `branches.eventsDesc` instead of local page copy.

## Hardcoded strings intentionally not touched

This batch deliberately does not change lower-risk card metadata and fallback strings such as:

- `Event listing` fallback title;
- `Online` badge and location fallback;
- dynamic event category labels coming from data;
- date formatting.

Those should be reviewed separately because they may need better locale-aware formatting or dedicated translation keys.

## Why this is safe

The patch changes presentation copy only.

It does not modify:

- data loading;
- Supabase tables or queries;
- auth gates;
- favorites behavior;
- routing;
- create-event flow;
- public shell tests;
- item lifecycle;
- matching or exchange logic.

## Search verification

After the patch, the following strings are no longer present in `src/app/[locale]/events/page.tsx`:

- `Add event`
- `Search by title, category, location…`
- `events found`

Search still finds some of these strings in older documentation files where they are listed as previous hardcoded copy to replace. That is expected and safe.

## Recommended Batch 40

Batch 40 should stop the repetition cycle and inspect actual build/typing output for the three implementation batches:

- Properties copy/i18n
- Services copy/i18n
- Events copy/i18n

Recommended target:

- production verification after Batch 39;
- review whether `common.add + branch label` produces acceptable wording in target languages;
- then choose the next narrow target: Chat public demo positioning or metadata/canonical/legal/contact/blog review.

## Merge rule

Do not merge the Batch 39 PR until Petru gives the explicit command:

`Merge #...`
