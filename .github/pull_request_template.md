## Summary

- Batch:
- Base branch:
- Head branch:
- Why this PR exists:

## Scope

- [ ] This PR is intentionally small and reversible.
- [ ] This PR does not remove existing Swaply functionality.
- [ ] This PR does not reduce requirements to MVP.
- [ ] This PR does not duplicate global navigation inside contextual drawers.
- [ ] This PR keeps Blog and Stories separate when touching either area.
- [ ] This PR keeps AI advisory/fallback-safe when touching AI areas.

## Not implemented in this PR

List intentionally excluded work here:

-
-
-

## CI gate

- [ ] Unit Tests passed.
- [ ] Lint & Type Check passed.
- [ ] Build passed.
- [ ] Public Visual Audit passed.

## Required artifacts

- [ ] `vitest-results`
- [ ] `swaply-public-visual-audit-screenshots`
- [ ] `swaply-public-visual-audit-report`
- [ ] `swaply-public-visual-audit-test-results`

## Visual audit notes

Screenshots checked:

- [ ] Desktop Home
- [ ] Mobile Home
- [ ] Objects
- [ ] Matching drawer
- [ ] Messages drawer
- [ ] Exchange drawer
- [ ] Blog drawer

## Risk check

- [ ] No API keys added.
- [ ] No paid provider connected unintentionally.
- [ ] No Supabase migration added without explanation.
- [ ] No auth/RLS behavior changed accidentally.
- [ ] No public route became a login wall.
- [ ] No exact location, private message or consent-gated story data is exposed.
