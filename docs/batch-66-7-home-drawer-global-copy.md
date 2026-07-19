# Batch 66.7 — Home drawer global copy and RTL alignment

## Classification

`FAST` — small isolated UI and contract-test change. No Supabase migration, Auth, RLS, grants, storage, lifecycle, dispute, rewards, ledger, private-data or irreversible operational impact.

## Objective

Remove the remaining hardcoded public English labels from the shared Home drawer and make its action alignment follow the document writing direction without adding new translation debt.

## Predictive audit

Before this unit:

- the Blog link label was hardcoded as `Blog`;
- the legal navigation section title was hardcoded as `Legal`;
- the shared drawer action button used physical `text-left` alignment, which is incorrect for RTL locales;
- existing catalogue keys already expressed the required Blog and legal navigation concepts, so adding new message leaves was unnecessary.

## Delivered contract

- the Blog link uses `blog.pageTitle` from the active locale catalogue;
- the legal section uses `nav.termsAndGdpr` from the active locale catalogue;
- the cookie-settings action uses logical `text-start` alignment and therefore follows LTR or RTL document direction;
- no new catalogue key or fallback leaf was introduced;
- navigation destinations and authentication behavior are unchanged.

## Tests

Focused contract coverage proves:

- the hardcoded `Blog` link label is absent;
- the hardcoded `Legal` section title is absent;
- the existing translated keys are used;
- logical rather than physical text alignment is retained.

## Safety boundary

- no database or migration change;
- no Auth, RLS, grant, storage or private-profile change;
- no external translation or AI provider;
- no new paid service, subscription or cost;
- no historical content rewrite;
- no Train C scope reopened.

## Remaining Batch 66 work

Batch 66 remains active for measured translation-debt reduction, remaining locale-specific overflow or hardcoded copy, and final 43-locale plus six-locale deep closure evidence.
