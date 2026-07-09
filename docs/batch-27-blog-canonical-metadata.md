# Batch 27: Blog canonical metadata

## Problem

The localized Blog index page generated its own metadata, but its `alternates` object only preserved the RSS feed link.

Because the root localized layout also defines default route alternates, the Blog page needed an explicit canonical URL and hreflang map for `/blog` to avoid inheriting route metadata intended for the localized home page.

## Change

- Added `buildRouteAlternates(locale, "/blog")` to `src/app/[locale]/blog/page.tsx`.
- Preserved the existing RSS alternate under `alternates.types`.
- Did not change UI, routing, database access, authentication, or blog content logic.

## Validation target

After deployment, `/en/blog` should expose:

- canonical: `https://www.swaply.world/en/blog`
- x-default: `https://www.swaply.world/en/blog`
- localized hreflang links for the supported locales
- RSS alternate: `/blog/feed.xml`
