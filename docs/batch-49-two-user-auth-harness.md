# Batch 49: Train C two-user authenticated harness

## Purpose

Train C requires proof that authenticated flows work for two distinct users and that ownership boundaries can be tested without reusing public demo identities.

## What this batch adds

- dedicated Playwright authentication setup for user A and user B;
- separate saved browser states under `e2e/.auth/`;
- a baseline test proving the two sessions are distinct and both can open the authenticated profile route;
- an isolated Playwright configuration that does not change the existing public audit configuration;
- a manual GitHub Actions workflow that reads credentials only from repository secrets;
- a non-secret environment template.

## Required repository secrets

Create two dedicated, non-demo Supabase users and add these GitHub Actions secrets:

- `E2E_USER_A_EMAIL`
- `E2E_USER_A_PASSWORD`
- `E2E_USER_B_EMAIL`
- `E2E_USER_B_PASSWORD`

Do not use `@swaply.test` demo accounts and do not commit real values to Git.

## Running the baseline

From GitHub Actions, run `Train C Two-User Auth E2E` manually after the four secrets exist.

Local command:

```bash
npx playwright test --config=playwright.two-user.config.ts --project=two-user-auth
```

## Scope boundaries

This batch does not yet test object ownership, wishlist, matching, chat, exchange or feedback. It establishes the two-identity harness required for those later Train C batches.

## Exit criteria

- CI for the repository remains green;
- preview deployment is READY;
- the manual workflow exists and does not contain credentials;
- after secrets are configured, both users authenticate independently and the baseline test passes.
