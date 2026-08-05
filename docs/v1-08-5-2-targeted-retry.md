# V1-08.5.2 — DeepSeek targeted retry

## Scope

This batch retries only the five matching cases that failed in workflow run `31048130276`:

- `v1084-bg-matching-advisory`
- `v1084-no-matching-advisory`
- `v1084-th-matching-advisory`
- `v1084-mn-matching-advisory`
- `v1084-yi-matching-advisory`

The 210 cases that already passed are not executed again.

## Retry contract

Each targeted case receives one normal attempt. A second and final attempt is allowed only when the provider response is invalid JSON or has an empty `localizedOutput`. HTTP, authentication, model identity, token usage, budget or other provider failures do not trigger an automatic retry.

Every billable attempt is recorded separately with token usage, latency and cost. The targeted workflow has a local hard ceiling of `0.10 USD`, below the previously approved global ceiling of `5 USD`.

## Evidence

The workflow writes and uploads:

`artifacts/v1-08-5-2/deepseek-v4-flash-targeted-retry-results.json`

The artifact records the source run, targeted case IDs, every attempt, total cost and deterministic score.

## PASS

- exactly five cases targeted;
- all five complete;
- no failed or budget-stopped case;
- all deterministic scores pass;
- total targeted cost is at most `0.10 USD`;
- artifact is uploaded.

## Boundaries

This batch does not modify Supabase, RLS, RPC, application runtime, Production data, provider activation, tags, releases or `v1.0.0` status.
