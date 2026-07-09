# Swaply AI Gateway skeleton

Batch 5 adds typed AI contracts and safe fallback behavior without connecting any paid provider.

## Goals

- Keep all provider calls server-side through `AIGateway`.
- Keep UI flows functional even when no AI provider is configured.
- Return conservative fallback results instead of inventing data.
- Log only safe task metadata, not raw prompts, private notes, exact addresses, image URLs or provider payloads.
- Prepare typed integration points for later providers such as OpenAI, Mistral, Gemini, Claude, Grok or local/open-weight models.

## Typed tasks covered

1. `classify_item`
2. `generate_item_description`
3. `estimate_value`
4. `translate`
5. `match`

## Provider-free facade

`createFallbackOnlySwaplyAIFacade()` creates a facade with no providers. It still uses the same public methods as a provider-backed facade:

- `classifyItem(request)`
- `generateItemDescription(request)`
- `estimateValue(request)`
- `translateText(request)`
- `explainMatch(request)`

If a provider is missing or fails, the facade returns a fallback result marked with `source: "fallback"`.

## Safe metadata rule

`buildSafeAITaskMetadata()` records counts and high-level hints only:

- task type
- locale pair
- field count
- text field count
- image count
- location/currency hint booleans
- optional input hash / prompt version

It must not store raw user text, image URLs, exact addresses or provider prompts.

## What this batch does not do

- It does not add paid AI credentials.
- It does not call external providers.
- It does not create migrations.
- It does not change object creation, matching, chat, translation or pricing UI flows yet.
- It does not replace manual user review.
