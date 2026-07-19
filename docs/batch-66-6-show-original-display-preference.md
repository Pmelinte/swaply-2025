# Batch 66.6 — Show-original display preference application

## Classification

`STANDARD` — ordinary client application code. No Supabase migration, Auth, RLS, grants, storage, private-data projection or irreversible operational change.

## Objective

Apply the canonical `profiles.show_original_language` preference to authenticated Chat display without hiding or replacing the authoritative original message and without taking control away from the per-message user toggle.

## Predictive audit

Before this unit:

- Batch 66.5 hydrated `show_original_language` into the typed profile projection;
- `ChatPanel` ignored that hydrated value and defaulted every message to `showOriginal = true`;
- the existing toggle calculated its first transition from an undefined local override rather than from the effective display default;
- original message text was already rendered independently of translated text and had to remain authoritative;
- automatic translation, provider failure fallback and retry behavior were already isolated by Batches 66.3–66.5.

## Delivered contract

- authenticated Chat reads `showOriginalLanguage` through the canonical profile preference mapper;
- each message without a local override uses the hydrated profile preference as its initial display policy;
- a per-message user action remains authoritative after the initial default is applied;
- the first toggle now inverts the effective value, including when the local override is still absent;
- original message content remains visible and authoritative at all times;
- translated text is supplementary and is shown only when available and selected;
- translation provider failure still leaves the original message usable.

## Tests

Focused contract coverage proves:

- the canonical profile mapper is used;
- the hydrated preference supplies only the initial per-message default;
- the first manual toggle inverts the effective default correctly;
- the original message remains rendered independently of translation;
- existing show-original/show-translation controls remain available.

## Safety boundary

- no database migration;
- no profile write or historical data rewrite;
- no translation provider enabled;
- no paid service, subscription or new cost;
- no message, translation-cache, Auth, RLS, grant or storage change;
- no Train C scope reopened.

## Remaining Batch 66 work

Batch 66 remains active for:

1. measured translation-debt reduction;
2. remaining locale-specific overflow or hardcoded public copy;
3. final 43-locale smoke, minimum six-locale deep E2E and closure evidence.
