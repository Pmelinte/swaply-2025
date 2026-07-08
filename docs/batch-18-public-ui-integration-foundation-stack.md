# Batch 18 — Public UI integration for foundation stack

Batch 18 starts the UI integration phase for the foundation stack created in Batch 8–17.

## Goal

Make the public interface explain the foundation stack without turning previews into fake live features.

This batch is intentionally safe:

- no Supabase migrations;
- no RLS changes;
- no auth changes;
- no provider AI calls;
- no automatic merge;
- no production-ready declaration;
- no bypass of Public Visual Audit.

## 10 actions included

1. Create branch `agentic/batch-18-public-ui-integration-foundation-stack` from the green Batch 17 SHA.
2. Add public foundation stack types for public UI tracks.
3. Add public content tracks connected to Integration Audit v2 checks.
4. Cover human-centered swapping, advanced swaps, photo discovery, guided chat, exchange safety, token/rank separation, blog feedback, AI advisory behavior and language fallback.
5. Add a reusable `PublicFoundationStackSection` component.
6. Render the foundation stack inside the existing public guest experience card.
7. Extend the public guest experience slot to Explore, Matching, Messages and Exchange.
8. Keep real actions login-gated; the public UI only explains and previews.
9. Add unit tests that connect public cards to Batch 17 audit checks.
10. Extend Public Visual Audit so public routes verify the foundation stack is visible.

## What the UI now explains

- AI explains and recommends; people decide.
- Tokens are utility; rank is trust and cannot be purchased.
- Language fallback keeps public pages useful when exact translations are missing.
- Exchange safety requires checklist and human confirmations.
- Photo discovery has manual fallback.
- Guided chat preserves original messages.
- Advanced and circular swaps require participant consent.
- Blog feedback remains structured and editorially reviewed.

## What this batch does not do

- It does not implement real AI provider calls.
- It does not add Supabase tables or migrations.
- It does not change token balances, rank calculations or payments.
- It does not create real circular swap execution.
- It does not publish stories.
- It does not remove any authentication gate for real actions.
- It does not merge PRs in the existing stack.

## Required checks

After the PR is created, the required checks remain:

- Unit Tests;
- Lint & Type Check;
- Build;
- Public Visual Audit / Playwright.

The PR must stay draft until the checks are green and manual review is done.
