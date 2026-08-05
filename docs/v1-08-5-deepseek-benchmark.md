# V1-08.5 — DeepSeek V4-Flash provider-backed benchmark

## Control header

| Field | Value |
|---|---|
| Roadmap package | `V1-08` |
| Batch ID | `V1-08.5` |
| Status | `PR_OPEN` |
| Provider | `DeepSeek` |
| Model | `deepseek-v4-flash` |
| Locale coverage | `43/43` |
| Dataset cases | `215` |
| Maximum authorised cost | `5 USD` |
| Production data writes | `NONE` |
| Migrations | `NONE` |

## Explicit authorisation

Petru authorised:

> DeepSeek V4-Flash, all 43 languages, maximum budget 5 USD.

This authorisation applies only to the V1-08.5 benchmark execution. It does not authorise a permanent Production provider integration, paid runtime AI, tag, release or GA declaration.

## Execution boundary

The provider-backed benchmark is executed only through the manual GitHub Actions workflow:

`.github/workflows/v1-08-5-deepseek-benchmark.yml`

The workflow:

- cannot run on push, pull request or schedule;
- requires repository secret `DEEPSEEK_API_KEY`;
- rejects a budget greater than `5 USD`;
- uses `deepseek-v4-flash`;
- disables thinking mode to control latency and cost;
- requests JSON output;
- executes all 215 V1-08.4 cases;
- uploads evidence artifacts for 30 days.

## Cost control

The runner uses the official DeepSeek V4-Flash public rates current at implementation time as a conservative upper-bound calculation:

- cache-miss input: `0.14 USD / 1M tokens`;
- output: `0.28 USD / 1M tokens`.

Cache discounts are intentionally ignored in the guard calculation. Before every request, the runner reserves a conservative worst-case allowance and stops before the authorised ceiling can be exceeded.

## Evidence artifacts

- `deepseek-evidence.json` — raw per-case provider evidence, token usage, latency and parsing result;
- `deepseek-scores.json` — deterministic V1-08.4 scores;
- `deepseek-summary.json` — aggregate quality, schema, safety, provenance, human-boundary, latency and cost evidence.

## PASS

- exactly 215 cases attempted;
- all 43 locales represented;
- zero API or parse failures;
- spend remains at or below 5 USD;
- provider and model provenance recorded;
- original-preservation and human-confirmation fields scored;
- CI and Preview are green;
- no P0/P1 remains open.

## FAIL

- missing `DEEPSEEK_API_KEY`;
- budget input invalid or greater than 5 USD;
- provider/model mismatch;
- incomplete case execution;
- API or JSON parsing failure;
- budget guard activation;
- missing evidence artifact;
- Production data write, migration, RLS/RPC change, tag or release.

## Known boundary

DeepSeek V4-Flash is evaluated through its text Chat Completions interface. The V1-08.4 privacy-safe image fixture identifiers are supplied as structured benchmark context; this batch does not claim direct binary image-input evaluation unless the provider API exposes and the repository separately implements verified image input.
