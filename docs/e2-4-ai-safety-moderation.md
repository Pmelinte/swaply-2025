# Train E / E2.4 — AI Safety and Moderation

## Scope

Unify message moderation behind a server-side safety proposal while preserving deterministic rules, legacy API fields and human authority.

## Delivered

- deterministic moderation remains the first authority;
- high-risk text is not sent to external providers;
- optional provider analysis runs only through the E1 gateway;
- response includes category, risk score, recommended action and provenance;
- legacy `safe`, `flags` and `message` fields remain available;
- rate limiting and input validation remain server-side;
- human review is explicit for manual-review and block recommendations;
- `automaticEnforcement` is always `false`.

## Non-goals

E2.4 does not suspend users, delete messages, create reports, write moderation actions, alter RLS, add tables or activate paid providers.

## Decision rule

AI advises. Server-side deterministic policy protects the boundary. People decide and any enforcement remains a separate authorised workflow.
