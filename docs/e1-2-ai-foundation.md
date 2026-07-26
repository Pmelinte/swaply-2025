# Train E — E1.2 AI runtime foundation

## Implemented

- central task router for every canonical AI task;
- input and output schemas;
- prompt version, timeout, provider and privacy policy per task;
- runtime model registry connected to the server gateway;
- provider-output validation;
- distinct provider fallback and non-AI fallback states;
- cumulative latency and provider-attempt history;
- PII redaction and removal of direct identifiers before provider execution;
- local, repeatable, zero-provider eval runner.

## Deliberately excluded

- UI changes;
- Supabase or migrations;
- Auth or RLS changes;
- new AI providers;
- new provider keys;
- paid AI activation;
- Production activation.

Hugging Face remains the only external runtime provider and only for `classify_item` and `moderate_chat`. All other tasks retain deterministic non-AI fallback contracts until a later explicit product decision.
