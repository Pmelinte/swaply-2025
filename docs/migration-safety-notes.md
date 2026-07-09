# Migration and RLS safety notes

Migration and RLS changes are high-risk in Swaply because public browsing, profile privacy, messages, token ledger and story consent depend on correct table access.

## A PR that adds migrations must state

- migration file path
- whether it is required before deployment
- whether it is safe to apply more than once
- whether it can be rolled back
- what tables are affected
- whether RLS policies change
- whether public pages depend on the changed tables
- whether private data could become visible

## Do not mix with unrelated UI batches

Avoid combining migrations with public UI, drawer, Playwright or editorial documentation unless the migration is strictly required by that PR.

## Tables that need extra caution

- `profiles`
- `items`
- `matches` / `swaps` / `exchanges`
- `swap_messages`
- `notifications`
- `token_ledger`
- `stories`
- `story_consents`
- `blog_feedback`
- `blog_suggestions`
- `ai_requests`
- `ai_cache`

## Safer default

When the data model is not final, document the intended schema first and keep the implementation behind typed contracts and tests. Apply Supabase migrations only when the access rules are clear.
