# Train E — E2.3 Semantic Matching & Match Explanation

## Scope

E2.3 adds an advisory semantic explanation layer on top of Swaply's existing deterministic matching algorithm.

## Invariants

- The local matching score remains authoritative.
- AI output never changes ranking automatically.
- No database writes or publications are performed.
- No paid provider is activated.
- Every result requires human confirmation.
- Provider input is routed through the E1 privacy boundary.

## Output

The semantic proposal includes:

- semantic score;
- bounded score adjustment suggestion;
- explanation summary;
- reasons and risks;
- confidence and provenance;
- original base score and suggested score;
- `affectsRanking: false`;
- `requiresHumanConfirmation: true`.

## Route compatibility

`POST /api/ai/match` preserves the legacy response fields while adding the E2.3 metadata. Direct Groq and Gemini calls were removed from the active route.