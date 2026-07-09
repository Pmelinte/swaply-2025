# Batch 38: Services copy/i18n pass

## Purpose

Batch 38 repeats the narrow copy/i18n pattern from Batch 37, this time for the public Services page.

The target is only the public Services page. The patch reduces hardcoded English copy by reusing translation keys that already exist across the global language files.

## Scope

- One page: `src/app/[locale]/services/page.tsx`.
- One documentation file.
- No new routes.
- No Supabase query changes.
- No RLS changes.
- No auth changes.
- No API changes.
- No business-logic changes.
- No paid AI or translation provider activation.

## Production baseline

Batch 37 was verified before starting this patch.

- Production deployment: `dpl_8SHNXUC1iBuUehX3hHco1C9tb6vH`.
- Production commit: `89a3ba3c6f14ba8fd57a17af325c15783a9ba814`.
- Deployment status: `READY`.
- `/en` returned HTTP `200`.
- Recent production runtime logs for this deployment showed no `error`, `warning`, or `fatal` entries in the checked window.

## Implementation decision

Do not add a new `expansionPages.services` namespace in only one or two locales.

Instead, this batch uses existing shared translation namespaces:

- `common.add`
- `common.search`
- `branches.services`
- `branches.servicesDesc`
- existing `objects` empty-state and filter helper keys where they are already used safely

This avoids missing translation keys across the broader language set.

## Changes

The Services page now derives shared labels from existing translation keys:

- header title uses `branches.services` through a local `serviceLabel` variable;
- primary CTA derives from `common.add + branches.services`;
- logged-in empty-state CTA uses the same derived add label;
- search placeholder derives from `common.search + branches.services`;
- result count uses the translated branch label instead of hardcoded `services found`;
- logged-in empty state uses `branches.services` and `branches.servicesDesc` when there are no filters;
- logged-out empty state uses `branches.services` and `branches.servicesDesc` instead of hardcoded English.

## Hardcoded strings intentionally not touched

This batch deliberately does not change lower-risk card metadata and fallback strings such as:

- `Service listing` fallback title;
- dynamic service category labels coming from data;
- dynamic service modality values coming from data;
- dynamic experience level values coming from data.

Those should be reviewed separately because they may need better data normalization or dedicated translation keys.

## Why this is safe

The patch changes presentation copy only.

It does not modify:

- data loading;
- Supabase tables or queries;
- auth gates;
- favorites behavior;
- routing;
- create-service flow;
- public shell tests;
- item lifecycle;
- matching or exchange logic.

## Search verification

After the patch, the following strings are no longer present in `src/app/[locale]/services/page.tsx`:

- `Add service`
- `Search by title, category, location…`
- `services found`
- `No services available right now`

Search still finds some of these strings in older documentation files where they are listed as previous hardcoded copy to replace. That is expected and safe.

## Recommended Batch 39

Batch 39 should repeat the same narrow pattern for Events:

- one page only: `src/app/[locale]/events/page.tsx`;
- reuse existing global keys first;
- avoid new locale keys unless they are added consistently across the language set or through an approved fallback strategy;
- no Supabase/auth/business-logic changes.

## Merge rule

Do not merge the Batch 38 PR until Petru gives the explicit command:

`Merge #...`
