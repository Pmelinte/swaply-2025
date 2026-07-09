# Batch 25 — Quiet translate-on-demand fallback

## Context

Vercel production logs showed repeated warnings on localized public routes:

```txt
[translate-on-demand] disabled
```

The message came from `src/lib/translate-on-demand.ts` while on-demand translation is intentionally disabled after the April 2026 runaway token/cost incident.

## Change

- Keep the translation API disabled.
- Keep the safe fallback behavior: return the original text.
- Remove the runtime `console.warn` because the disabled state is expected and can be called many times during page rendering.

## Safety boundary

This batch does **not** re-enable translation calls and does **not** change user-visible content. It only prevents healthy fallback rendering from producing noisy Vercel warning logs.
