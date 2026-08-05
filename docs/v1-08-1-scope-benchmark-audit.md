# V1-08.1 — Global-first and AI benchmark scope contract

## 0. Control header

| Field | Value |
|---|---|
| Roadmap package | `V1-08` |
| Batch ID | `V1-08.1` |
| Status | `PR_OPEN` |
| Application base SHA | `42846413dabf2e1db22ddba2a8b209b711bef1e2` |
| Working branch | `v1-08-1-scope-benchmark-contract` |
| Canonical product version | `v2.0.0` |
| Production target | `https://www.swaply.world` |

## 1. Objective

Create one executable, reviewable contract that fixes the V1-08 requirement IDs, records the predictive evidence inventory and defines the mandatory global-first and real-provider benchmark journeys without activating any paid provider.

## 2. Canonical scope verdict

V1-08 has two inseparable evidence families:

1. **Global-first runtime proof** beyond locale-file existence.
2. **Repeatable real AI benchmark proof** beyond zero-cost contracts and assumptions.

V1-08 does not authorise payments, escrow, commercial logistics, paid AI, provider activation, a tag, a GitHub Release or `v1.0.0`.

## 3. Requirement IDs

### I18n and global-first

- `V108-I18N-001` — persisted primary, secondary and tertiary profile languages;
- `V108-I18N-002` — one reusable fallback chain;
- `V108-I18N-003` — English only as final technical fallback;
- `V108-I18N-004` — original text preserved;
- `V108-I18N-005` — show-original presentation;
- `V108-I18N-006` — repeatable hardcoded-public-string audit;
- `V108-I18N-007` — multi-locale routes and contextual CTA;
- `V108-I18N-008` — long-text and RTL layout resilience;
- `V108-I18N-009` — Blog and Stories translation completeness.

### AI benchmark

- `V108-AI-001` — benchmark on 10–15 languages;
- `V108-AI-002` — representative privacy-safe real images;
- `V108-AI-003` — L1/L2 classification scoring;
- `V108-AI-004` — localized description quality;
- `V108-AI-005` — translation quality with source preservation;
- `V108-AI-006` — matching explanation quality and advisory boundary;
- `V108-AI-007` — moderation safety and false-positive review;
- `V108-AI-008` — schema correctness;
- `V108-AI-009` — cost measurement;
- `V108-AI-010` — latency measurement;
- `V108-AI-011` — provider failure and non-AI fallback;
- `V108-AI-012` — privacy and provenance;
- `V108-AI-013` — human confirmation.

## 4. Predictive inventory

### Code and UI

Verified foundations:

- 43-locale configuration and canonical locale normalization;
- reusable locale fallback resolver;
- LTR/RTL regression coverage;
- translation/original preservation foundations;
- AI Gateway, task router, schemas and fallback contracts;
- matching explanations remain advisory;
- moderation contracts do not apply final sanctions automatically;
- manual/non-AI fallback is preserved for core flows.

Not yet proven cumulatively for V1-08:

- persisted three-language profile parity across DB, UI and Production;
- universal use of the same fallback chain across Chat, Stories, Blog and notifications;
- actionable public hardcoded-string scan with controlled allowlists;
- complete long-text and RTL visual evidence across representative desktop/mobile routes;
- all-locale translation-completeness artifacts for Blog and Stories;
- real-provider benchmark artifacts covering 10–15 languages, cost, latency and provenance.

### Database, RLS and RPC/API

V1-08.1 changes no schema, migration, RLS, grant, RPC or Production data. Database and Production evidence not inspected directly in this contract remains `UNKNOWN`, never inferred green.

### Existing automated evidence

- general quality gates;
- i18n key and usage checks;
- 43-locale Playwright suite;
- AI Evaluation & Regression Gate;
- contract tests for fallback, schema validation, moderation and advisory matching.

These are foundations. They do not alone satisfy the roadmap requirement for a real, repeatable multilingual benchmark.

## 5. Contradictions and gaps

1. `CURRENT_VERSION.md` and the merged V1-07 closure identify V1-08 as `NEXT`.
2. `IMPLEMENTATION_MATRIX.md`, `PRODUCT_COMPLETION_DASHBOARD.md` and `PROJECT_MEMORY.md` still contain an older V1-06 baseline in parts of the canonical repository.
3. This is a documentation reconciliation gap, not evidence that V1-07 regressed.
4. The roadmap says a real-provider benchmark is required, but provider activation and real cost require explicit approval. Therefore V1-08 must first prepare the dataset, runner, scoring and evidence format without incurring cost; the provider-backed execution is a later approval gate inside V1-08.

## 6. Required journeys

1. profile language preferences persist after reload;
2. guest routes and CTA in multiple non-RO/non-EN locales;
3. translated authenticated content with original preserved and show-original;
4. representative RTL and long-text desktop/mobile routes;
5. Blog translation completeness and fallback provenance;
6. Stories translation completeness and fallback provenance;
7. image classification with L1/L2 gold labels;
8. localized item description evaluation;
9. localized matching explanation evaluation;
10. multilingual moderation with false-positive review;
11. provider-unavailable fallback without blocking the core flow.

## 7. Finite substage structure and realistic PR count

A realistic V1-08 plan is **6 PRs**, assuming no P0/P1 is discovered:

1. `V1-08.1` — scope, IDs, predictive inventory and executable contract;
2. `V1-08.2` — global-first persistence and fallback usage inventory/repair;
3. `V1-08.3` — hardcoded-string, translation-completeness and RTL/long-text audit tooling;
4. `V1-08.4` — versioned benchmark dataset, gold labels, scoring and evidence schema;
5. `V1-08.5` — authorised provider-backed multilingual benchmark and fallback replay;
6. `V1-08.6` — cumulative Preview/Production gate and closure evidence.

The count may increase only for a confirmed isolated defect or migration that cannot safely share a PR.

## 8. First executable batch

`V1-08.1` is safe because it:

- creates no migration;
- changes no runtime business logic;
- activates no provider;
- incurs no external cost;
- writes no Production data;
- creates a stable, testable contract for subsequent batches.

## 9. PASS / FAIL

### PASS

- all 22 IDs are unique;
- every ID has exactly one initial audit row;
- unknown evidence stays explicit;
- the benchmark range is fixed at 10–15 languages;
- quality, locale coverage, schema, safety, cost, latency, fallback, privacy, provenance and human confirmation are mandatory dimensions;
- required journeys are finite and executable;
- no paid provider or release action is authorised;
- CI, AI Evaluation and Vercel Preview are green on the PR head.

### FAIL

- duplicate or missing requirement IDs;
- a foundation is labelled Production-verified without exact evidence;
- English becomes an early visible fallback;
- original text can be overwritten by translation;
- AI can auto-confirm a consequential action;
- the benchmark omits cost, latency, safety, privacy or provenance;
- a paid provider is activated without explicit approval;
- any P0/P1, destructive migration or persistent Production fixture is introduced.

## 10. Evidence required before merge eligibility

- exact PR head SHA;
- general CI success;
- AI Evaluation & Regression Gate success;
- Vercel Preview `READY` and route smoke;
- review threads resolved with zero P0/P1;
- confirmation that migration head remains `20260805133249`;
- no Production data created;
- no tag, release or GA declaration.
