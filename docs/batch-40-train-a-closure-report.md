# Batch 40: Train A closure report

## Purpose

Batch 40 closes Train A as a documentation-only checkpoint.

Train A focused on the public shell and public expansion surface of Swaply. It did not try to finish the full Swaply product, authenticated flows, Supabase/RLS, real matching, real chat, real exchange, monetization, or AI.

This report records:

- what Train A covered;
- which PRs were merged;
- the last verified production checkpoint after Batch 39;
- what is intentionally outside Train A;
- the recommended split between Train B and Train C;
- the next safe working train.

## Scope of this batch

- Documentation only.
- One new file: `docs/batch-40-train-a-closure-report.md`.
- No UI changes.
- No route changes.
- No Supabase query changes.
- No RLS changes.
- No auth changes.
- No API changes.
- No business-logic changes.
- No paid AI or translation provider activation.
- No merge without Petru's explicit `Merge #...` command.

## Train A scope

Train A stabilized the visible public frame of Swaply:

- public shell stabilization;
- global navigation consistency;
- top BranchBar with `Objects`, `Properties`, `Services`, `Events`;
- bottom navigation with `Home`, `Explore`, `Matching`, `Messages`, `Exchange`;
- global drawer presence and smoke coverage;
- public expansion pages for core domains;
- removal of visible `Beta` badges from the main branch navigation;
- first copy/i18n cleanup passes for public `Properties`, `Services`, and `Events` pages;
- documentation after each batch;
- production verification after merges.

## Train A merged batch inventory

| Batch | PR | Title | Merge commit | Notes |
| --- | ---: | --- | --- | --- |
| 31 | #419 | Batch 31: admin diagnostic smoke test | `f81e3180f12f9aabbcc5c0b50ce400f10583ecab` | Added safe admin diagnostic smoke coverage and documentation. |
| 32 | #420 | Batch 32: public live audit baseline | `51a02a7e70495eeceb7ff43aa10b0bd61a841d06` | Added public live audit baseline documentation after Batch 31. |
| 33 | #421 | Batch 33: public shell smoke assertions | `13b7bc5541f8c76efff308c92887b6a29c0cc3a7` | Added Playwright public shell assertions for canonical logged-out routes. |
| 34 | #422 | Batch 34: remove beta badges from branch bar | `de8d7b20a93015b6d742567892440ba710667ff2` | Removed visible `Beta` badges from main BranchBar and added mobile smoke coverage. |
| 35 | #423 | Batch 35: public expansion pages audit | `c2a70c2d355ddcee08bc455b96aef9f2143dde4c` | Documentation-only audit for public expansion and empty-state pages. |
| 36 | #424 | Batch 36: expansion copy i18n prep | `971a99dfb593c8ac817e12b7d2c03a66d6ea3ffc` | Prepared copy/i18n cleanup plan for expansion pages. |
| 37 | #425 | Batch 37: properties copy i18n | `89a3ba3c6f14ba8fd57a17af325c15783a9ba814` | Reduced hardcoded English on the public Properties page using existing global keys. |
| 38 | #426 | Batch 38: services copy i18n | `b89398ca39960aa1d006e1507d95006b7fe7f567` | Reduced hardcoded English on the public Services page using existing global keys. |
| 39 | #427 | Batch 39: events copy i18n | `e9daa0da18423ca03d1525db76306731259f2e9a` | Reduced hardcoded English on the public Events page using existing global keys. |

## Last recorded production checkpoint after Batch 39

The last confirmed Train A production checkpoint was recorded after PR #427 / Batch 39.

- Merge commit: `e9daa0da18423ca03d1525db76306731259f2e9a`.
- Production deployment: `dpl_259BewatFz56qn8wA5vN8buxDj9A`.
- Vercel status: `READY`.
- `/en`: HTTP `200 OK`.
- Production runtime logs in the checked window: no `error`, `warning`, or `fatal` entries.

After Batch 40 is merged, production must still be checked again, even though this PR is documentation-only.

## Train A closure decision

Train A is closed for its intended scope.

Closed means:

- the public shell has a documented baseline;
- the canonical public shell is covered by smoke assertions;
- the main branch navigation is cleaner and no longer visibly marked as beta;
- public expansion pages have been audited;
- Properties, Services, and Events received first safe copy/i18n cleanup passes;
- Train A did not expand into authenticated flows or risky backend work.

Closed does not mean the full Swaply product is complete.

## Intentionally outside Train A

The following remain outside Train A and should not be treated as missing work from Train A:

- full stylistic perfection across all 43 languages;
- complete localized date, badge, metadata, and dynamic value formatting;
- real complete Chat;
- real complete Exchange;
- full Matching AI;
- Supabase schema redesign;
- RLS hardening or new policies;
- real data model expansion;
- authenticated flows end-to-end;
- Add object wizard;
- My Objects CRUD;
- Object detail/edit/delete stabilization;
- Profile completion flow;
- Wishlist / wants;
- feedback and story flows;
- monetization;
- public API;
- real translation provider integration;
- paid AI integration;
- AI classification, matching, moderation, or translation activation.

## Train B recommendation

Train B should focus on public content, SEO, legal, and trust pages.

Recommended Train B name:

`Train B: public content / SEO / legal / trust stabilization`

Recommended Train B scope:

- `About`;
- `Blog`;
- `Contact`;
- `Terms`;
- `Privacy`;
- `Cookies`;
- `Safety`;
- `DMCA`;
- `Copyright`;
- metadata;
- canonical URLs;
- hreflang;
- logged-out public pages;
- public copy audit for text that still looks demo, beta, inconsistent, too technical, or too regional.

Recommended Train B rules:

- keep changes small and page-by-page;
- prefer documentation/audit first, implementation second;
- do not touch Supabase/RLS/auth/API unless explicitly requested;
- do not activate paid AI;
- do not introduce RO/EN-only solutions;
- do not hardcode public copy in components when translation infrastructure exists;
- preserve the public shell from Train A;
- after each merge, verify Vercel production again.

## Recommended Batch 41

Recommended next batch:

`Batch 41: public legal/trust/SEO inventory audit`

Recommended Batch 41 should be documentation-only and should inspect:

- which public trust/legal pages exist;
- which public trust/legal routes are missing;
- whether existing pages are reachable from the shell/drawer/footer;
- whether pages contain placeholder/demo/beta/inconsistent copy;
- whether metadata/canonical/hreflang coverage is present;
- whether Blog is integrated safely as guide/education content;
- whether Contact is clear enough for support, legal, and safety needs.

Recommended Batch 41 should not implement a large legal rewrite in the same PR. The first Train B PR should create a clear inventory and then propose the smallest safe implementation order.

## Train C recommendation

Train C should be separate from Train B because it will touch functional authenticated flows and probably backend/data/security boundaries.

Recommended Train C name:

`Train C: authenticated functional flows`

Recommended Train C scope:

- Add object wizard;
- My Objects CRUD;
- Object detail/edit/delete;
- Profile;
- Wishlist / wants;
- Matching;
- Chat;
- Exchange;
- Feedback;
- Supabase schema;
- RLS;
- AI classification/matching/translation only when planned explicitly.

Train C should begin only with a fresh audit and a narrow first target. It should not be mixed into Train B unless Petru explicitly chooses that.

## Guardrails carried forward

Continue these rules into Train B and Train C:

- Romanian responses for Petru.
- Small steps, one batch at a time.
- No merge without explicit `Merge #...` command.
- After every merge, verify Vercel production.
- No Supabase/RLS/auth/API/business logic changes unless clearly planned.
- No paid AI activation.
- No reduction of the complete Swaply vision to MVP.
- Complete files when code is sent or replaced.
- Preserve global-first product direction.
- Preserve the four main branches: Objects, Properties, Services, Events.
- Preserve bottom navigation: Home, Explore, Matching, Messages, Exchange.
- Keep Blog and Stories conceptually separate.
- Keep tokens/swapleni separate from trust rank.
- Treat AI as a future transversal facilitator, not as an uncontrolled paid dependency.

## Checks for Batch 40

Because this batch is documentation-only:

- local build was not required for functional validation;
- no runtime behavior should change;
- no tests were modified;
- no source files were modified;
- diff should contain this single documentation file only.

Still required after merge:

- confirm Vercel production deployment reaches `READY`;
- confirm `/en` returns HTTP `200`;
- check recent production logs for `error`, `warning`, and `fatal`.

## Merge rule

Do not merge the Batch 40 PR until Petru gives the explicit command:

`Merge #...`
