# Train E — E1.3 AI observability

## Scope

E1.3 adds privacy-safe, server-side observability for the AI runtime created in E1.2.

## Event contract

Only operational metadata is retained:

- task type;
- provider and model identifiers;
- request status;
- latency;
- estimated cost;
- cache-hit flag;
- attempt count;
- locale dimensions;
- error code;
- prompt version;
- timestamp.

Raw prompts, chat messages, item descriptions, user IDs, input hashes and provider payloads are never part of the observability event.

## Aggregations

The in-memory collector reports:

- total requests;
- successful and failed requests;
- provider and non-AI fallbacks;
- timeouts;
- cache hits;
- total estimated cost;
- average latency;
- counts by task, provider and status.

Retention is bounded and defaults to 1,000 events. This batch does not introduce persistence, migrations, dashboards or paid providers.

## Eval reporting

The local eval runner now exposes a deterministic summary containing pass/fail counts, average latency and total estimated cost.

## Exit criteria

- no raw user content in events;
- accidental email and phone values in dimensions are redacted;
- bounded retention;
- deterministic aggregation tests;
- existing gateway, provider and fallback contracts remain unchanged;
- CI, typecheck and production build pass.
