# V1-08.5.1 — Benchmark methodology correction

## Status

This batch corrects the prompt–scorer contract used by the real DeepSeek V4-Flash benchmark.

The previous real run on workflow run `31043748372` completed all 215 provider calls, stayed within budget, and produced valid operational evidence. Its quality verdict is classified as:

`INVALID_FOR_QUALITY_VERDICT`

The invalidation applies only to the quality PASS/FAIL result. Provider connectivity, model identity, token usage, latency, total cost, locale coverage, and artifact retention remain valid evidence.

## Root cause

The scorer required exact canonical concepts and category identifiers that were not visible in the provider input. The prompt referred to a gold label without including the scoring contract. Reasonable semantic answers could therefore fail exact hidden-label comparisons.

## Correction

Dataset methodology version `1.1.0`:

- embeds an explicit `evaluationContract` in every provider input;
- exposes canonical required concepts, accepted aliases, forbidden concepts, exact category identifiers, moderation expectation, source-preservation requirement, advisory boundary, and human-confirmation requirement;
- keeps localized prose free-form while keeping structured evaluation fields deterministic;
- normalizes punctuation and category separators before structured comparison;
- accepts only aliases declared in the dataset;
- does not weaken forbidden-concept, safety, provenance, schema, or human-boundary gates.

## Evidence boundary

This remains a text-only benchmark. Image classification is still `NOT_PROVEN`.

## Rerun rule

After this PR is merged and all gates are green, run the manual workflow once with `max_budget_usd=5`. Do not reuse either pre-correction run as a quality verdict.

## Non-scope

- no runtime provider activation;
- no Supabase migration, RLS, or RPC change;
- no Production test data;
- no tag, release, or v1.0.0 declaration.
