# Batch 66.2 — Authenticated language preference persistence

## Scope

This unit closes the authenticated primary-language hydration and persistence gap without changing Supabase schema or reopening Train C.

## Delivered contract

- canonical `primary_language`, `secondary_language` and `tertiary_language` columns are authoritative during profile hydration;
- the historical `languages` array is retained only as a compatibility source;
- unsupported and duplicate locale values are removed deterministically;
- all 43 registered locales are accepted, including Yiddish (`yi`);
- selecting a locale promotes it to the profile primary language while retaining two ordered fallbacks;
- authenticated selection persists through the existing revisioned `update_own_profile_v1` authority;
- login and reload restore the canonical profile primary locale into application state, the `NEXT_LOCALE` cookie and localized routing;
- country selection remains independent from language preference;
- no direct browser write to `public.profiles` is introduced.

## Safety boundary

- no Supabase migration;
- no Auth, RLS, grants or storage change;
- no external translation or AI provider;
- no paid service, subscription or cost;
- no historical user content rewrite;
- no Train C lifecycle change.

## Required evidence

- focused resolver and mapper tests;
- lint and full TypeScript check;
- unit suite;
- Next.js production build;
- public visual and 43-locale audit;
- exact-head Vercel Preview READY;
- representative EN/FR/YI route verification and clean runtime logs;
- automatic merge only after every critical gate is green;
- post-merge Production and parity verification.
