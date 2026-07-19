# Batch 66.5 — Profile translation preference hydration and application

## Classification

`STANDARD` — ordinary client application code. No Supabase migration, Auth, RLS, grants, storage, private-data projection or irreversible operational change.

## Objective

Connect the canonical profile translation preferences already stored in Supabase Production to the authenticated chat experience without turning the preference into an irreversible per-conversation override.

## Predictive audit

Before this unit:

- `public.profiles.auto_translate_messages` and `public.profiles.show_original_language` existed in Production and were accepted by `update_own_profile_v1`;
- profile hydration restored canonical languages but discarded both translation preference fields;
- hydrated and newly created chat conversations started with `translationEnabled: false` regardless of the authenticated profile preference;
- the per-conversation translation toggle worked locally and had to remain user-controlled;
- the failure-safe translation path from Batches 66.3 and 66.4 already preserved original messages and retry behavior.

## Delivered contract

- profile hydration now carries both canonical database preferences in one typed application projection;
- missing fields use the database-compatible defaults: automatic translation enabled, show-original disabled;
- authenticated chat reads the hydrated automatic-translation preference;
- when automatic translation is enabled, each available conversation is seeded exactly once;
- the seed toggles only conversations that are currently disabled;
- after the initial seed, the existing per-conversation control remains authoritative and the user can turn translation off;
- removed conversations are removed from the seed registry, so a later independent conversation can be initialized correctly;
- `show_original_language` is hydrated for the next focused display-policy unit but this unit does not alter the Batch 66.4 original-message safety contract.

## Tests

Focused coverage proves:

- explicit true/false preference hydration;
- database-compatible defaults when fields are absent;
- the application reads both canonical column names;
- automatic translation is seeded once rather than forced on every render;
- manual conversation toggles remain available after seeding.

## Safety boundary

- no database migration;
- no profile write or historical data rewrite;
- no translation provider enabled;
- no new paid service, subscription or cost;
- no message, translation-cache, Auth, RLS, grant or storage change;
- no Train C scope reopened.

## Remaining Batch 66 work

Batch 66 remains active for:

1. application of the hydrated `show_original_language` display preference while preserving the original message as authoritative;
2. measured translation-debt reduction;
3. remaining locale-specific overflow or hardcoded public copy;
4. final 43-locale and Batch 66 closure evidence.
