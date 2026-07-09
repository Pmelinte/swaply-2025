# Batch 37: Properties copy/i18n pass

## Purpose

Batch 37 implements the first narrow copy/i18n step recommended by Batch 36.

The target is only the public Properties page. The patch reduces hardcoded English copy by reusing translation keys that already exist across the global language files.

## Scope

- One page: `src/app/[locale]/properties/page.tsx`.
- One documentation file.
- No new routes.
- No Supabase query changes.
- No RLS changes.
- No auth changes.
- No API changes.
- No business-logic changes.
- No paid AI or translation provider activation.

## Production baseline

Batch 36 was verified before starting this patch.

- Production deployment: `dpl_BW3DqGE7wcp8YSSMTvDngAu2Gznf`.
- Production commit: `971a99dfb593c8ac817e12b7d2c03a66d6ea3ffc`.
- Deployment status: `READY`.
- `/en` returned HTTP `200`.
- Recent production runtime logs for this deployment showed no `error`, `warning`, or `fatal` entries in the checked window.

## Implementation decision

Do not add a new `expansionPages.properties` namespace in only one or two locales.

Instead, this batch uses existing shared translation namespaces:

- `common.add`
- `common.search`
- `branches.properties`
- `branches.propertiesDesc`
- existing `objects` empty-state and filter helper keys where they are already used safely

This avoids missing translation keys across the broader language set.

## Changes

The Properties page now derives shared labels from existing translation keys:

- header title uses `branches.properties` through a local `propertyLabel` variable;
- primary CTA derives from `common.add + branches.properties`;
- logged-in empty-state CTA uses the same derived add label;
- search placeholder derives from `common.search + branches.properties`;
- result count uses the translated branch label instead of hardcoded `properties found`;
- logged-in empty state uses `branches.properties` and `branches.propertiesDesc` when there are no filters;
- logged-out empty state uses `branches.properties` and `branches.propertiesDesc` instead of hardcoded English.

## Hardcoded strings intentionally not touched

This batch deliberately does not change lower-risk card metadata and fallback strings such as:

- `Property listing` fallback title;
- `bed` / `bath` compact card labels;
- `m²` area unit;
- dynamic property type and exchange type values coming from data.

Those should be reviewed separately because they may need better data formatting or dedicated translation keys.

## Why this is safe

The patch changes presentation copy only.

It does not modify:

- data loading;
- Supabase tables or queries;
- auth gates;
- favorites behavior;
- routing;
- create-property flow;
- public shell tests;
- item lifecycle;
- matching or exchange logic.

## Search verification

After the patch, the following strings are no longer present in `src/app/[locale]/properties/page.tsx`:

- `Add property`
- `Search by title, city, type…`
- `properties found`

## Recommended Batch 38

Batch 38 should repeat the same narrow pattern for Services:

- one page only: `src/app/[locale]/services/page.tsx`;
- reuse existing global keys first;
- avoid new locale keys unless they are added consistently across the language set or through an approved fallback strategy;
- no Supabase/auth/business-logic changes.

## Merge rule

Do not merge the Batch 37 PR until Petru gives the explicit command:

`Merge #...`
