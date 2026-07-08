# AI evaluation foundation

Batch 15 adds a safe foundation for evaluating AI behavior in Swaply.

## Product rule

AI can assist, explain and suggest. AI must not make final user decisions.

## Evaluation tasks

The initial evaluation contract covers:

- item classification;
- item description;
- matching explanation;
- photo discovery;
- chat summary;
- exchange guidance;
- story prompt;
- translation.

## Scorecard

Each evaluation result can score:

- correctness;
- safety;
- privacy;
- usefulness;
- fallback readiness.

The total score is weighted. Safety and privacy have explicit minimum thresholds.

## Verdicts

- `pass` — acceptable for low-risk helper behavior;
- `warn` — usable only with human review;
- `fail` — use fallback and do not rely on output.

High-risk tasks require human review even when scores are high.

## Fallback rule

Swaply must remain usable when AI fails, is unavailable or gives low-confidence output. Fallback readiness is part of the scorecard.

## Non-negotiable rules

- AI evaluations are advisory.
- AI cannot override a human decision.
- Raw eval data is not exposed publicly.
- Low safety or low privacy fails the evaluation.
- High-risk exchange guidance requires human review.

## What this batch does not do

- It does not connect a model provider.
- It does not run live AI calls.
- It does not create dashboards.
- It does not create database tables.
- It does not expose user data to evals.
- It does not change live UI.

## Next safe step

A later batch can connect this contract to AI Gateway responses and write anonymized eval records for internal quality monitoring.
