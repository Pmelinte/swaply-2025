# Train E — E2.2 AI Translation

## Scope

E2.2 moves user-generated-content translation behind the E1 AI gateway and makes original-message preservation part of the server contract.

## Delivered

- concrete `translate` input and output schemas;
- original text returned separately from translated text;
- source and target locale provenance;
- same-language short circuit;
- deterministic non-AI fallback;
- mandatory human confirmation;
- `/api/translate` compatibility through the existing `translated` response field;
- cache writes only for a successful translated result;
- no direct Anthropic call from the API route;
- no paid provider activation.

## Safety guarantees

- The original message is never replaced or discarded.
- A failed or unavailable translation returns the original text unchanged.
- AI output is advisory and requires human confirmation.
- No new database table, migration, RLS policy or external paid service is introduced.
- PII continues to pass through the E1 redaction policy before provider execution.

## Intentional limits

This batch does not add translation UI, live chat auto-translation, provider credentials, paid-model activation or automatic publication of translated content.
