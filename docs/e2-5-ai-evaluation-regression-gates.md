# Train E / E2.5 — AI Evaluation & Regression Gates

## Scope

Add a deterministic, zero-cost evaluation gate for the E2 AI capabilities without calling paid providers or changing product behaviour.

## Covered tasks

- item classification;
- original-preserving translation;
- semantic match explanation;
- message moderation.

## Gate conditions

Every case must:

- return output matching its contract;
- use the expected non-AI fallback when providers are disabled;
- preserve locale context;
- remain within its latency budget;
- report zero estimated external cost.

The aggregate suite requires:

- 100% pass rate;
- no contract failures;
- no fallback failures;
- no latency failures;
- no cost failures;
- average latency at or below 500 ms;
- total estimated cost equal to zero.

## CI evidence

The dedicated `AI Evaluation & Regression Gate` workflow runs on pull requests, pushes to `main` and manual dispatch. It uploads:

- `ai-eval-results.json`;
- `ai-eval-summary.json`.

## Safety boundary

E2.5 does not activate providers, send user content externally, write data, modify ranking, enforce moderation decisions or alter Supabase/RLS. It tests the existing contracts and deterministic fallbacks only.
