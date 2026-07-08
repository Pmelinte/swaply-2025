# Integration audit v2

Batch 17 closes the Batch 8-17 foundation sequence with an integration audit contract.

## Covered foundations

The audit covers:

1. Human-centered swapping.
2. Advanced swap modes.
3. Photo discovery.
4. Guided chat.
5. Exchange lifecycle.
6. Token and rank separation.
7. Blog suggestions and structured feedback.
8. AI evaluations and fallback gates.
9. Global-first language fallback.

## Core release rule

The stack cannot be treated as production-ready only because isolated tests pass. The integrated foundation must also preserve the safety gates across modules.

## Non-negotiable gates

- Manual review is still required before merge.
- Public Visual Audit cannot be skipped.
- Stacked PR order must be preserved.
- No automatic Exchange completion.
- No token-to-rank conversion.
- No AI override of human decisions.
- No public pages blocked only by missing translations.
- No unmanaged public free-text blog comments.

## Audit statuses

- `pass` — all blocking checks pass.
- `warn` — non-blocking warnings exist, review required.
- `fail` — at least one blocking check fails.

## What this batch does not do

- It does not merge the stacked PRs.
- It does not mark the stack production-ready automatically.
- It does not change live UI.
- It does not create Supabase migrations.
- It does not deploy to Vercel by itself.

## Next safe step

After Batch 17 is green, the next step is review of the full stacked PR chain before deciding whether to merge, squash, rebase or continue with a new sequence of implementation batches.
