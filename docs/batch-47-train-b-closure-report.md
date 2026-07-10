# Batch 47: Train B closure report

## Purpose

Batch 47 closes Train B as a documentation-only checkpoint.

Train B focused on Swaply's public content, SEO, legal and trust surface. It did not try to finish authenticated product flows, full CRUD, real end-to-end matching/chat/exchange validation, monetization, paid AI providers, or final human review for every supported locale.

This report records:

- the intended Train B scope;
- the merged Train B batches and supporting repair;
- the current verified production checkpoint;
- the formal closure decision;
- known limitations that remain outside Train B;
- the recommended opening scope for Train C.

## Scope of this batch

- Documentation only.
- One new file: `docs/batch-47-train-b-closure-report.md`.
- No UI changes.
- No route changes.
- No Supabase query, schema, RLS or Auth changes.
- No API changes.
- No payment, matching, chat, exchange or AI behavior changes.
- No production migration.
- No merge without Petru's explicit `Merge #...` command.

## Train B scope

Train B was defined as:

`public content / SEO / legal / trust stabilization`

The intended surface included:

- About;
- Blog;
- Contact;
- Terms;
- Privacy;
- Cookies;
- Safety;
- DMCA;
- Copyright;
- public route inventory;
- metadata;
- canonical URLs;
- hreflang;
- `x-default` fallback behavior;
- sitemap resilience;
- logged-out public pages;
- public copy consistency for legacy domains, contacts and placeholders.

## Train B merged batch inventory

| Batch | PR | Title | Merge commit | Notes |
| --- | ---: | --- | --- | --- |
| 41 | #429 | Public legal/trust/SEO inventory audit | `0ed065f2fd83ce4685c6904b3c484ba07ce3d63b` | Centralized audited public routes, legal/trust flags and sitemap source of truth. |
| 42 | #430 | Legal trust copy consistency | `d4fafdb641ee341f8d1ebc667b50ff4b49a06eda` | Normalized the canonical public domain and public contact copy across legal/trust pages. |
| 43 | #431 | Public SEO metadata sitemap guard | `f8356c800b9ee780abe40ad36196ee4466b1395e` | Centralized public URL helpers, canonical/hreflang generation and resilient sitemap loading. |
| 44 | #432 | Public per-page metadata hardening | `44acf78d09984ab05d89d22e00e7b92b1537b678` | Added route-specific metadata boundaries for public legal/trust pages and metadata tests. |
| 45 | #437 | Public `x-default` hreflang alignment | `0e7577dac4f01fd5457b27c66e356d35b5df8755` | Aligned `x-default` with the non-localized public fallback while preserving localized canonicals. |

## Supporting repair during Train B

Batch 45A / PR #438 was a CI alignment repair required before Batch 45 could be revalidated and merged safely.

- Merge commit: `a66be342452b0a40439e310704e1d948c32fcfcf`.
- It updated AI image fallback tests to respect the production security allowlist.
- It did not weaken SSRF protection.
- It did not change Train B page behavior or production AI implementation.

## Work completed after Train B scope

The following later work improved the same production baseline but is not counted as Train B scope:

- PR #435 / #436: coordinated P0 authorization, profile and privileged API hardening;
- Batch 46 / PR #439: server-only table hardening and pgvector extension relocation;
- Batch 46A / PR #440: alignment of the applied Supabase migration filename with production history.

These changes strengthen the platform underneath Train B but do not redefine Train B as a backend/security train.

## Current verified production checkpoint

After PR #440:

- Main commit: `4e7ca46bf9b16814700f0b1cdb30dda2ffe785c5`.
- Production deployment: `dpl_EgvaybthYcn3XNP6cVxeofMxJpuF`.
- Vercel status: `READY`.
- Production includes the complete Train B merge chain plus subsequent security hardening.
- The public metadata and `x-default` behavior from Batch 45 remain present in current `main`.

## Train B closure decision

Train B is closed for its intended scope.

Closed means:

- the public legal/trust/SEO route inventory is explicit and testable;
- audited static public routes drive sitemap generation;
- canonical public domain helpers are centralized;
- public legal/trust pages have route-specific metadata;
- canonical URLs and localized hreflang values are generated consistently;
- `x-default` uses the non-localized public fallback route;
- legal/trust copy no longer exposes the known legacy public domain/contact variants covered by the normalization contract;
- sitemap static routes remain available even if optional dynamic Supabase data fails;
- the public Train B surface has CI, build and visual audit coverage;
- production was revalidated after the final Train B merge chain.

Closed does not mean the full Swaply product is complete.

## Known limitations accepted at Train B closure

The following do not block Train B closure, but remain future work:

- legal pages are product copy, not a substitute for final review by qualified legal counsel;
- all 43 languages have not received native-speaker or legal-language review;
- complete stylistic and semantic localization parity is not guaranteed for every dynamic value and fallback;
- authenticated user journeys were not proven end-to-end by Train B;
- account creation, profile completion, object CRUD, wishlist, matching, chat, exchange and feedback require a separate Train C audit;
- paid AI and translation providers remain intentionally unactivated unless separately approved;
- Leaked Password Protection remains unavailable on the current Supabase plan;
- password rules were strengthened manually in Supabase Dashboard to minimum 10 characters with lowercase, uppercase, digit and symbol requirements, but this dashboard setting is not represented by a SQL migration;
- old superseded PRs and administrative branch cleanup are separate repository hygiene tasks.

## Intentionally outside Train B

The following are not missing Train B deliverables:

- complete Add Object wizard validation;
- My Objects CRUD validation;
- object edit/delete and ownership boundary validation;
- profile onboarding completion;
- wishlist / wants lifecycle;
- authenticated Matching end-to-end;
- authenticated Messages and Chat end-to-end;
- authenticated Exchange lifecycle end-to-end;
- feedback and Stories publication lifecycle;
- full monetization and payment flows;
- public commercial API;
- live paid AI classification, estimation, matching or translation;
- full operational moderation and dispute handling;
- final native/legal review across every locale.

## Recommended Train C name

`Train C: authenticated functional flows and ownership boundaries`

## Recommended Train C opening batch

Recommended next batch:

`Batch 48: authenticated end-to-end baseline audit`

Batch 48 should begin with evidence, not broad implementation.

Recommended checks:

1. Create or designate two disposable test users.
2. Verify registration, login, logout and session persistence.
3. Verify each user can read and edit only their own private profile data.
4. Verify public profile projection exposes only sanitized fields.
5. Verify object creation, list, detail, edit, deactivate/reactivate and delete ownership boundaries.
6. Verify user A cannot edit or delete user B's object.
7. Verify wishlist/wants access boundaries.
8. Verify Express Interest creates or reuses the correct match.
9. Verify match-to-swap-to-conversation flow for both participants.
10. Verify chat messages are visible only to conversation participants.
11. Verify exchange accept/reject, logistics, completion and feedback transitions.
12. Record failures as a prioritized Train C backlog before changing multiple flows.

Batch 48 should not repair every discovered problem in the audit PR. The audit should first establish a reproducible authenticated baseline and split fixes into small, reviewable batches.

## Guardrails carried forward

- Romanian responses for Petru.
- Small, reversible batches.
- No direct push to `main`.
- No merge without explicit `Merge #...` command.
- Verify GitHub CI and Vercel production after every merge.
- Apply and verify Supabase migrations explicitly; never assume repository presence means production application.
- Preserve the global-first product direction and four domains: Objects, Properties, Services, Events.
- Preserve the bottom navigation: Home, Explore, Matching, Messages, Exchange.
- Keep Blog and Stories separate.
- Keep Swapleni utility tokens separate from trust rank.
- Keep AI advisory, provider-optional and human-reviewable.
- Do not reduce the complete Swaply vision to an artificial MVP.

## Checks for Batch 47

Because this batch is documentation-only:

- no runtime behavior should change;
- no tests or source files should change;
- diff should contain this single documentation file only;
- CI should still pass;
- Vercel preview should still build successfully;
- after merge, production must still be checked for `READY`, `/en` HTTP 200 and clean recent runtime logs.

## Merge rule

Do not merge Batch 47 until Petru gives the explicit command:

`Merge #...`
