# Batch 66.9 — Profile language accessibility and responsive semantics

## Classification

`FAST` — isolated authenticated profile UI semantics, localization reuse, deterministic tests and documentation only.

## Scope discovery

The post-merge Batch 66.8 audit left one measured Batch 66 area suitable for an isolated FAST unit: the authenticated profile language editor still used a hardcoded avatar accessible name and unstructured language chips, while long native language names had no explicit mobile-safe wrapping contract.

This unit does not change the canonical language authority, persistence, fallback order or profile data model.

## Delivered contract

- the profile avatar accessible name reuses the existing localized `profile.avatarUrl` message instead of hardcoded English;
- selected spoken languages use labeled list semantics;
- language names and the add-language selector remain within narrow mobile widths;
- long native language names may wrap without forcing horizontal overflow;
- remove-language controls retain localized accessible names;
- decorative upload, removal, loading and progress visuals are hidden from assistive technology where applicable;
- the authenticated English E2E selector follows the localized accessible name;
- deterministic Vitest coverage prevents the hardcoded avatar label, missing list semantics and responsive language-chip regression from returning.

## Preserved behavior

- all 43 registered locales remain available;
- existing language add/remove behavior;
- canonical profile hydration and revisioned persistence authority;
- existing avatar upload behavior;
- profile location, visibility and save behavior;
- RTL direction inherited from the localized document;
- no new translation message key or technical-fallback leaf.

## Security and data impact

- no Supabase migration;
- no Auth, RLS, grants, storage policy or profile authority change;
- no lifecycle, dispute, reward, ledger or private-data visibility change;
- no external translation or AI provider enabled;
- no new paid service, subscription or cost;
- no historical user content rewrite;
- no Train C scope reopened.

## Verification gates

- focused Batch 66.9 Vitest contract;
- lint and typecheck;
- unit tests;
- production build;
- applicable profile and locale E2E checks;
- exact-head Vercel Preview;
- post-merge Production route and runtime-log review;
- repository and Supabase Production migration parity remains unchanged.
