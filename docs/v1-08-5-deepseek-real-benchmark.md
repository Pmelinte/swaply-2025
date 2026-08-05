# V1-08.5 — DeepSeek V4-Flash real multilingual benchmark

## Control header

| Field | Value |
|---|---|
| Package | `V1-08` |
| Batch | `V1-08.5` |
| Provider | `DeepSeek` |
| Model | `deepseek-v4-flash` |
| Locales | `43` |
| Planned cases | `215` |
| Approved maximum cost | `5 USD` |
| Provider execution | `AUTHORISED_BY_PETRU` |
| Production data | `NONE` |
| Migration | `NONE` |

## Authorisation

Petru approved DeepSeek V4-Flash for all 43 supported languages with a hard maximum budget of 5 USD.

The workflow requires the repository secret `DEEPSEEK_API_KEY`. The key is never written to source, logs or evidence.

## Execution contract

The manually dispatched workflow:

1. rejects budgets that are missing, non-positive or greater than 5 USD;
2. rejects execution when `DEEPSEEK_API_KEY` is absent;
3. invokes `https://api.deepseek.com/chat/completions` with model `deepseek-v4-flash`;
4. uses non-thinking JSON mode and bounded output;
5. records prompt tokens, completion tokens, latency and calculated cost for every completed case;
6. persists evidence after every case;
7. stops before a request when a conservative reserve could exceed the approved budget;
8. uploads the final JSON evidence as a GitHub Actions artifact.

## Evidence boundary

DeepSeek V4-Flash is used here as a text provider. No image bytes are sent. Therefore:

- classification is evaluated from title and description hints only;
- `visualInputSupported` is recorded as `false`;
- `classificationModality` is recorded as `text_hints_only`;
- `visualClassificationEvidence` remains `NOT_PROVEN`.

This batch must not be used to claim that image classification passed. A provider or model with verified image input is still required for that part of the canonical V1-08 scope.

## PASS

- all 215 planned calls complete or every non-completion is explicitly recorded;
- total calculated cost is at most 5 USD;
- all 43 locales are represented;
- provider, model, latency, tokens, cost, schema, safety and human-boundary evidence are retained;
- no secret appears in source, logs or artifacts;
- no Production data, migration, RLS or RPC change occurs.

## FAIL

- calculated cost exceeds 5 USD;
- the workflow attempts to continue after the conservative budget guard blocks a call;
- output or usage evidence is missing;
- an API key is committed or printed;
- text-only classification is presented as visual evidence;
- any P0/P1 regression is introduced.

## Non-scope

- visual/image benchmark completion;
- activation of DeepSeek in user-facing Production runtime;
- persistent storage of benchmark outputs in Supabase;
- tag, GitHub Release or `v1.0.0` declaration.
