# Project: Swaply 2025

## Environment
- This project runs ONLY on the web (Claude Code on the web). There is NO local environment.
- NEVER suggest local commands, local terminals, or local workflows to the user.
- All git operations (merge, push, PR creation) should be done through GitHub or through the tools available in this environment.

## Git
- Always push to the designated feature branch (`claude/<descriptive-name>`), never directly to `main`.
- Use GitHub PRs to merge into `main`. NEVER push to `main` directly.
- Always check the actual remote state (`git fetch origin main`) before assuming history.
- After pushing, create a PR via `mcp__github__create_pull_request`. Do NOT ask the user to create it manually.

## Automated CI/CD pipeline (DO NOT BREAK)

The repo has a fully automated flow. After you push a `claude/*` branch and open a PR, the user does nothing — everything below runs server-side:

1. **CI runs** (`.github/workflows/ci.yml`): Lint & Type Check → Test (vitest) → Build (Next.js).
   - All three are **REQUIRED status checks** on `main` (branch protection ruleset). A PR cannot merge if any fails.
2. **Auto-merge** (`.github/workflows/auto-merge-claude.yml`): `pascalgn/automerge-action` squash-merges any PR from a `claude/*` branch (or `claude` actor) once required checks pass. Configured with `MERGE_DELETE_BRANCH: "true"` so the branch is deleted as part of the merge.
3. **Vercel deploys** to Production on every merge to `main`.
4. **Playwright smoke** (`.github/workflows/playwright-after-deploy.yml`): runs on `deployment_status` for `Production` only (NOT preview) — hits `/en`, `/en/chat`, `/en/match`. Screenshots upload to Cloudinary (`CLOUDINARY_URL` repo secret) and a comment is posted on the deployed commit with inline previews + ✅/❌ status.

### Required repo secrets (already configured)
- `CLOUDINARY_URL` — `cloudinary://<api_key>:<api_secret>@<cloud_name>` for screenshot upload.
- `TEST_PASSWORD` — currently unused but kept for future authenticated smoke tests.

### Workflow non-negotiables
- The Playwright workflow MUST filter on `github.event.deployment.environment == 'Production'`. Never remove this — preview deploys have Vercel SSO and would always fail.
- Tests MUST run with `--config playwright.audit.config.ts` (not the default `playwright.config.ts`, whose `testDir` is `./e2e`).
- Each test in `tests/smoke.spec.ts` MUST use `try/finally` so screenshots are captured on failure.
- `tests/` is included in `tsconfig.json` compilation — do NOT add Node-only or playwright-only types that break Next.js build.

## Build hygiene (PRs that broke production already)
- `src/components/chat/ChatPage.tsx`: `handleToggleAgenda` (the panel toggle, no args) and `handleAgendaItemStatus` (`(key, nextStatus)`) are DIFFERENT functions. Never collapse them — duplicate identifiers in the same scope are a SyntaxError under strict-mode ESM and Vercel build fails in 24s.
- The root chat container should be `flex flex-col h-dvh w-full bg-white border-x border-gray-200 overflow-hidden`. Do NOT add `max-w-2xl` — the parent `[locale]/layout.tsx` already provides `max-w-6xl mx-auto`. Double-constraint = ~50% width chat with white margins.
- The "Stop Claude" button users may report seeing in the bottom nav comes from the Claude for Chrome extension, not from this codebase. Do NOT search for it; do NOT try to remove it.

## What the user typically asks (and how to respond)

- **"verifică ultimul deploy"** / **"ce mai e"** → Use `mcp__github__get_commit` on the latest `main` SHA, find the commit comment posted by the Playwright workflow, summarize ✅/❌ + show the screenshot URLs from Cloudinary.
- **"subscribe la PR #N"** → Call `subscribe_pr_activity` for PR N. React to CI failures and review comments while the session is alive.
- **Screenshots from the user** → Often Vercel deploy errors. Investigate via `mcp__github__pull_request_read` (`get_check_runs`), reproduce with `npm ci && npm run build` if Next.js compile, then fix on a new `claude/*` branch.

## Anti-patterns to avoid
- Do NOT base new branches on stale local branches. Always: `git fetch origin main && git checkout -b claude/<name> origin/main`.
- Do NOT try to delete branches via `git push --delete` — the remote rejects it (403). Branches auto-delete via `MERGE_DELETE_BRANCH` after merge.
- Do NOT post 10 reply comments on a PR. Reply only when a reviewer is wrong (per `Be frugal about posting replies` instruction).
- Do NOT add automation that depends on the user keeping a Claude Code session open. Everything important must run server-side via GitHub Actions.
