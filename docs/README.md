# Swaply — Docs Index (Start here)

## Source of Truth
1) Excalidraw UX/Flows: `/docs/design/` (canonical)
2) Programmatic Spec (verbatim, ID-based): `/docs/spec/`
3) Blueprints (implementation contracts): `/docs/blueprints/`
4) DB baseline (RLS/grants/policies contract): `/docs/db/`

## What a developer/agent must do
- Implement features by referencing the Programmatic Spec IDs (no omissions).
- Respect DB Baseline: RLS ON + least privilege grants.
- No fake tables. Demo data uses `is_demo` or staging.
- Unfinished = disabled gracefully (never break build).
- Keys/server-only for all external services.

## Files
- Architecture Blueprint: `/docs/blueprints/ARCHITECTURE_BLUEPRINT.md`
- Data Model & RLS Blueprint: `/docs/blueprints/DATA_MODEL_RLS_BLUEPRINT.md`
- Acceptance Matrix: `/docs/blueprints/ACCEPTANCE_MATRIX.md`
- DB Baseline: `/docs/db/DB_BASELINE.md`
