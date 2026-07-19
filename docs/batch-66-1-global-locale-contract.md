# Batch 66.1 — Global locale contract and 43-locale runtime smoke

**Train:** D1 — global-first profile and common infrastructure  
**Batch:** 66.1  
**Base:** Batch 65 closed on `main`  
**Scope:** deterministic locale catalogue contract, document direction, and public routing smoke

## Objective

Establish the first small, reviewable Batch 66 unit without changing authentication, Supabase data, paid providers, or the existing translation delivery model.

This unit makes the current 43-locale promise testable in every pull request:

- the locale registry remains the source of truth;
- every registered locale has a parseable message catalogue;
- every English leaf key exists in every locale;
- message value types and ICU-style placeholders remain compatible;
- all 43 locale-prefixed Home and Objects routes render without a missing-page or internationalization error;
- the document root publishes the correct `lang` and `dir` attributes;
- Arabic, Persian, and Yiddish render as RTL;
- deep EN, RO, DE, AR, ZH, and YI samples cover desktop/light and mobile/dark layouts.

## Files

- `scripts/check-i18n-keys.mjs`
- `src/i18n/direction.ts`
- `src/app/[locale]/layout.tsx`
- `src/lib/i18n/batch66LocaleContract.test.ts`
- `e2e/i18n-43-locales.spec.ts`
- `package.json`
- `.github/workflows/ci.yml`

## Security and data impact

- No database migration.
- No RLS, grants, Auth, storage, or private profile change.
- No external AI or translation provider call.
- No new service, subscription, or cost.
- No user content is rewritten.
- Historical extra translation keys are reported but not automatically deleted.

## Required evidence

The PR is mergeable only when all critical gates are green:

1. ESLint and TypeScript.
2. Vitest, including the canonical locale registry, direction, and logged-in/guest fallback chain tests.
3. The 43-locale key/type/placeholder contract.
4. Next.js build.
5. Existing public visual audit.
6. New 43-locale routing audit and six-locale deep layout samples.
7. Vercel Preview `READY` and representative EN, RO, AR, ZH, and YI routes reachable.
8. No relevant Preview runtime `error` or `fatal` events.
9. Post-merge GitHub CI and Vercel Production verification.

## Deliberate exclusions

Batch 66 remains active after this unit. Later non-overlapping Batch 66 units must still close:

- authenticated language preference persistence through login/reload;
- chat original/translated display behavior under provider failure;
- any remaining hardcoded public copy and locale-specific overflow found by the audit;
- final Batch 66 closure evidence against the complete master-plan gate.
