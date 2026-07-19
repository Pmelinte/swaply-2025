# Batch 66.3 — Failure-safe realtime chat translation

**Train:** D  
**Deliverable:** D1 — global-first profile and common infrastructure  
**Scope:** one small language-engine unit for the reusable realtime chat message translation surface

## Purpose

A translation provider failure must never replace, relabel or hide the original user message. Translation is optional assistance; the original message remains authoritative and readable at all times.

## Delivered contract

- `translateMessage` returns a structured result instead of an ambiguous string;
- successful translations, same-language no-ops and provider fallbacks are distinct states;
- fallback responses never become translated copy;
- HTTP and malformed responses fail explicitly instead of inventing a translation;
- only successful/no-op results may be cached in browser memory;
- provider fallback is not cached, so a later retry can recover;
- the cache key uses the complete message plus normalized source and target locales;
- representative Romanian, Greek, Cyrillic, Yiddish, Arabic, Japanese, Chinese and Korean scripts can be detected without defaulting all unknown Latin text to English;
- the realtime `ChatMessageTranslate` UI keeps the parent-rendered original visible;
- provider failure is shown as localized status copy with a retry affordance;
- original/translation switching is available only after a real successful translation;
- same-language responses remain a silent safe no-op.

## Safety boundaries

- no Supabase migration;
- no Auth, RLS, grants, storage or profile projection change;
- no external provider is enabled;
- the disabled Anthropic translation path remains disabled;
- no new paid service, subscription or cost;
- no historical message or translation-cache data is rewritten;
- no Train C scope is reopened.

## Deliberate exclusions

The older state-backed `ChatPanel` still contains its own direct `/api/translate` adapter. Migrating that larger surface is intentionally left to the next non-overlapping Batch 66 unit so this PR remains small and reviewable.

Batch 66 remains active after this unit for:

- the state-backed `ChatPanel` translation adapter and profile preference behavior;
- measured catalogue translation-debt reduction;
- remaining locale-specific overflow or hardcoded public copy;
- final Batch 66 closure evidence.

## Required gates

1. focused chat translation unit tests;
2. full unit suite;
3. lint and TypeScript;
4. production build and 43-locale contract;
5. public visual and i18n audits;
6. exact-head Vercel Preview `READY`;
7. representative chat/localized route and runtime-log verification;
8. automatic merge only when every critical gate is green;
9. post-merge GitHub CI, Vercel Production, routes and runtime logs verified.
