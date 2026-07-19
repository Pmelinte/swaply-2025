# Batch 66.4 — State-backed ChatPanel translation adapter

## Classification

`STANDARD` — ordinary client application code. This unit does not alter Supabase schema, migrations, Auth, RLS, grants, storage, private-profile visibility or irreversible data.

## Scope

This unit connects the state-backed `ChatPanel` to the failure-safe realtime translation contract delivered in Batch 66.3.

## Delivered contract

- `ChatPanel` no longer calls `/api/translate` directly.
- Translation is routed through `translateMessage` and `likelyNeedsTranslation` from the shared chat translation helper.
- The original message remains rendered and authoritative after every successful, failed or fallback translation attempt.
- A successful translation is rendered separately and may be shown or hidden without replacing the original.
- Provider fallback, HTTP failure and malformed output render localized failure state rather than synthetic translated copy.
- Retry remains available after failure.
- Automatic translation is limited to eligible incoming text when the conversation translation toggle is enabled.
- Own messages and location messages are not automatically translated.
- No translation provider, AI service, subscription or paid feature is enabled by this unit.

## Verification contract

The focused application-contract test asserts that:

1. the shared translation helper is the only chat translation adapter used by `ChatPanel`;
2. the component contains no direct `/api/translate` request;
3. original content is rendered before and independently from translated content;
4. auto-translation is constrained to eligible incoming text;
5. fallback and exception paths preserve retry.

The PR gate also requires lint, typecheck, unit tests, production build, Vercel Preview and affected-route smoke verification.

## Database and security impact

- no Supabase migration;
- no Auth, RLS, grants or storage change;
- no private-data projection change;
- no historical message or cache rewrite;
- no destructive operation;
- no new cost;
- no Train C scope reopened.

## Remaining Batch 66 work

Batch 66 remains active after this unit. Later non-overlapping units must cover profile translation-preference hydration/application, measured translation-debt reduction, remaining locale-specific overflow or hardcoded copy and final Batch 66 closure evidence.
