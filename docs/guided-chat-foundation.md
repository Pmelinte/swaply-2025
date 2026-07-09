# Guided chat foundation

Batch 11 adds a safe foundation for guided chat in Swaply.

## Product rule

Chat should guide the exchange, not control the people.

The user must still be able to write normal free text. Guided prompts are optional helpers.

## Guided stages

- `interest`
- `why_i_want_it`
- `what_i_offer`
- `condition_clarification`
- `logistics_clarification`
- `agreement_summary`
- `move_to_exchange`
- `feedback`
- `story_prompt`

## Translation-ready model

A guided message draft keeps:

- original text;
- source locale;
- optional target locale;
- optional translated text;
- `showOriginalAvailable`.

This prepares the system for translation without losing the original message.

## Location safety

Exact location should not be shared before both people agree. This batch detects simple exact-location patterns and can redact them until the location sharing state is `mutually_agreed`.

## Human confirmation

Agreement summaries are drafts. They can help users move to Exchange, but they always require human confirmation.

## What this batch does not do

- It does not change the live chat UI.
- It does not create Supabase migrations.
- It does not send real translations.
- It does not connect an AI summarizer.
- It does not force guided stages.
- It does not block normal chat.

## Next safe step

A later batch can expose these prompts in the Messages/Chat drawer or composer while keeping the normal text input available.
