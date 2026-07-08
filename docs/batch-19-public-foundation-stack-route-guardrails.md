# Batch 19 — Public foundation stack UI guardrails

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
- No new server/runtime policy module.

## 10 actions included

1. Start Batch 19 from the Batch 18 branch.
2. Keep the foundation stack visible on the same public routes introduced in Batch 18.
3. Add stable `data-track-id` metadata for each public foundation card.
4. Add stable `data-login-required` metadata for login-gated foundation cards.
5. Add stable `data-foundation-page` metadata for the section.
6. Add route-level guardrail coverage copy inside the public section.
7. Extend unit tests for advisory AI, internal CTAs, language fallback and visible safety cards.
8. Extend the public visual audit to verify advisory AI markers.
9. Extend the public visual audit to verify login-gated action markers and route coverage copy.
10. Document the batch and its safety limits.

## Public routes covered by audit

- `/en`
- `/en/objects`
- `/en/properties`
- `/en/services`
- `/en/events`
- `/en/explore`
- `/en/matching`
- `/en/messages`
- `/en/exchange`

## Guardrails kept visible

- AI remains advisory.
- Real actions remain after login.
- Language fallback stays visible on the default public foundation pages.
- Token/rank separation remains visible where it matters most.
- Exchange safety remains explained before real confirmation flows.
- Public cards use internal CTAs only.

## What this batch does not do

This batch does not implement the real matching algorithm, real translations, real chat behavior, real exchange lifecycle or token accounting. It only makes the public foundation explanations harder to regress.

## Required checks

- Unit Tests
- Lint & Type Check
- Build
- Public Visual Audit / Playwright
