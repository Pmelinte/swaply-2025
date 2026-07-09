# Batch 21 — Build-safe localization diagnostic

## Goal

Batch 21 investigates the safest next step for public foundation stack localization without changing the public UI runtime.

Batch 20 proved that a documentation-only fallback contract is build-safe. Earlier Batch 20 attempts also showed that adding a new runtime copy module under `src/lib` and wiring it into the foundation stack path can make `next build` fail even when unit tests and TypeScript pass.

## Current evidence

- The final Batch 20 documentation-only PR is green.
- Unit Tests passed before and after the runtime-copy attempts.
- Lint & Type Check passed before and after the runtime-copy attempts.
- `next build` failed when the runtime copy module was introduced or wired near the public foundation stack runtime path.
- `next build` passed after the new runtime module was removed and Batch 20 was reduced to documentation only.
- The connector returned truncated build logs, so the final Next.js error line could not be read from inside this session.

## Diagnostic added in this batch

`src/__tests__/public-foundation-stack-copy-diagnostic.test.ts` derives a safe copy table from the existing `PUBLIC_FOUNDATION_STACK_TRACKS` runtime config and proves the fallback algorithm in test space only.

The diagnostic test proves:

1. Default copy can be derived from the existing public foundation stack config.
2. Every track has non-empty copy for `title`, `summary`, `publicPromise`, `badge` and `ctaLabel`.
3. A partial locale can override one field while the other fields fall back to English.
4. A missing locale falls back fully to English.

## Safety boundary

This batch intentionally does not:

- add a new runtime localization module under `src/lib`;
- wire foundation stack UI to localized runtime copy;
- change public UI copy;
- change public routes;
- change Supabase, RLS, auth or backend code;
- add real translations;
- change Playwright routes;
- merge anything.

## Working hypothesis

The failure is not the fallback algorithm itself. The diagnostic test uses the same fallback idea and should pass under Vitest.

The likely risk is the location and wiring of the runtime copy module in the Next.js build graph, not the copy data model. A future runtime implementation should therefore start smaller:

1. Keep a single source of truth in the existing `publicFoundationStackContent.ts` until proven otherwise.
2. Add a small pure helper first, without importing it into a public component.
3. Make `next build` pass.
4. Only then wire it into UI.
5. Keep the old hardcoded runtime config as fallback until localized runtime copy is proven safe.

## Recommended next batch if green

Batch 22 should not translate all languages. It should add the smallest possible build-safe helper around the existing runtime content, then run the full CI again.

Recommended Batch 22 scope:

- no UI behavior change;
- one helper or one doc/test only;
- no new locale files;
- no route changes;
- keep English as canonical fallback;
- CI must pass Unit Tests, Lint & Type Check, Build and Public Visual Audit.
