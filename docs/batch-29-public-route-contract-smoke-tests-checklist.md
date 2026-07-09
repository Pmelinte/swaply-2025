# Batch 29 validation checklist

## CI

- [ ] Lint & Type Check
- [ ] Unit Tests
- [ ] Build
- [ ] Public Visual Audit

## Preview / production expectations

- Public routes should return HTTP 2xx/3xx, not 4xx/5xx.
- Legacy `/match` should end on `/matching`.
- Legacy `/change` should end on `/exchange`.
- Legacy `/items` remains a known gap until Batch 30.

## Follow-up

After this batch is merged, Batch 30 should implement `/[locale]/items` → `/[locale]/objects` and activate its smoke test.
