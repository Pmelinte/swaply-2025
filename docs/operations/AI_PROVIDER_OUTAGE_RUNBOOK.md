# Swaply — AI provider outage runbook

## 1. Permanent boundary

AI in Swaply is advisory. It must not own item creation, matching decisions, Story publication, moderation sanctions, dispute outcomes or exchange completion. Every AI flow requires a non-AI fallback.

## 2. Trigger

Activate this runbook for timeout, invalid/schema-breaking output, provider quota/rate limit, excessive latency/cost, unsafe output, credential failure or provider-wide outage.

## 3. Immediate actions

1. Record task type, provider/model, prompt version, error code and affected time window without logging unnecessary raw private content.
2. Disable the failing route/provider through existing configuration where possible.
3. Keep core flows available manually:
   - item fields remain editable/manual;
   - search falls back to deterministic filters;
   - matching remains rule-based and human-selected;
   - chat keeps original messages and may disable translation/summary;
   - moderation escalates uncertain serious cases to human review;
   - Blog/Stories remain drafts until human approval.
4. Never silently replace a failed provider with invented successful output.

## 4. Fallback order

1. cache hit with matching content hash/version;
2. approved secondary provider when configured and within budget/privacy rules;
3. deterministic non-AI implementation;
4. clear unavailable state that preserves user data and allows retry.

A secondary provider is not activated merely by this runbook; activation still requires its configured authority and privacy disclosure.

## 5. Recovery verification

- provider health and credential validity;
- schema validation and timeout behavior;
- non-AI fallback regression tests;
- original-content preservation;
- no automatic human-boundary violation;
- cost/latency/error logging;
- representative multilingual cases;
- no secret exposure in client or logs.

## 6. Reopening

Re-enable incrementally per task. Stop and revert if schema, safety, privacy, cost or fallback checks fail. Record provider/model/version and exact evidence.

## 7. Communication

Tell users which optional assistance is unavailable and which manual path still works. Do not claim AI decisions are required for a valid exchange.
