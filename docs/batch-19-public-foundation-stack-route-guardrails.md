# Batch 19 — Public foundation stack route guardrails

## Goal

Batch 19 keeps the Batch 8–18 foundation stack visible and testable on the main public routes, without adding backend risk.

The work is intentionally small and safe: it strengthens the public UI contract introduced in Batch 18 so future batches cannot accidentally hide the explanations for advisory AI, token/rank separation, language fallback, exchange safety, advanced swaps, photo discovery or guided chat.

## Safety boundaries

- No Supabase migrations.
- No RLS changes.
- No auth changes.
- No provider AI integration.
- No payment/token accounting changes.
- No merge.
- No public free-text comments.
- No real action without login.
- No duplicate nav/drawer work.

## 10 actions included

1. Start Batch 19 from the Batch 18 branch.
2. Add a route policy for the public foundation stack.
3. Define the public routes that must render the foundation stack.
4. Define the page-level guardrails that must stay visible inside the default card limit.
5. Add localized route helpers so Playwright does not duplicate route lists manually.
6. Add UI metadata for each visible card through stable `data-*` attributes.
7. Add route-level coverage copy inside the public section.
8. Extend unit tests for route policy, required guardrails and public audit alignment.
9. Extend the public visual audit to verify AI advisory and login-gated action markers.
10. Document the batch and its safety limits.

## Public routes covered

- `/`
- `/objects`
- `/properties`
- `/services`
- `/events`
- `/explore`
- `/matching`
- `/messages`
- `/exchange`

The localized audit currently checks the English routes through `/en/...`, but the route helper supports other locales.

## Required guardrails by page

- Home: advisory AI, token/rank separation, language fallback, exchange safety.
- Objects: advisory AI, language fallback, advanced swaps, exchange safety, photo discovery.
- Properties/services/events: advisory AI, language fallback, advanced swaps, exchange safety.
- Explore: advisory AI, language fallback, advanced swaps, photo discovery.
- Matching: advisory AI, language fallback, advanced swaps, token/rank separation, exchange safety.
- Messages: advisory AI, language fallback, guided chat, exchange safety.
- Exchange: advisory AI, language fallback, advanced swaps, token/rank separation, exchange safety.

## What this batch does not do

This batch does not implement the real matching algorithm, real translations, real chat behavior, real exchange lifecycle or token accounting. It only makes the public foundation explanations harder to regress.

## Required checks

- Unit Tests
- Lint & Type Check
- Build
- Public Visual Audit / Playwright
