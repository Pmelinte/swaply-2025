# Swaply Train E — E1.1 AI & Legacy Commercial Audit Evidence

**Audit date:** 27 July 2026  
**Repository:** `Pmelinte/swaply-2025`  
**Mode:** read-only inventory and evidence capture; no runtime, database, provider, billing, or feature activation changes.  
**Scope:** E1.1 AI architecture inventory plus legacy commercial-path inventory required before E5 closure.

## 1. Executive verdict

E1.1 is now represented by a repository artefact. The current AI foundation is server-side by contract for the new Train E gateway, has deterministic non-AI fallbacks, privacy redaction, timeout handling, provider ordering, output validation, and privacy-safe observability hooks.

However, the repository still contains legacy direct-provider call paths and commercial integration paths outside the new Train E authority boundaries. Their existence does not prove that they are enabled in Production, but they must be reconciled in PR B before Train E closure.

**E1.1 status after this report:** `FOUND — audit evidence complete at repository level`.

## 2. AI authority inventory

### 2.1 Canonical Train E AI boundary

| Area | Repository evidence | Status | Notes |
|---|---|---:|---|
| Server-side gateway | `src/lib/ai/gateway.ts` | FOUND | Explicit browser guard; task validation; provider ordering; timeout; output validation; provider and non-AI fallback statuses. |
| Task router/contracts | `src/lib/ai/task-router.ts`, `src/lib/ai/taskTypes.ts`, `src/lib/ai/contracts.ts` | FOUND | Task-specific schemas, policies, prompt versions and deterministic fallbacks. |
| Model registry | `src/lib/ai/model-registry.ts` | FOUND | Enabled/priority/task capability contract. |
| Provider implementations | `src/lib/ai/providers.ts` | FOUND | Hugging Face external provider plus deterministic fallback provider. |
| Runtime facade | Train E AI service/facade files under `src/lib/ai/` | FOUND | New E2 services call the gateway rather than browser-side provider SDKs. |
| Privacy-safe observability | E1.3 observability/logging modules and tests | FOUND | Logs metadata, not raw prompt content; gateway supports cost, latency, provider, status and cache metadata. |
| Evaluation gate | AI evaluation runner, regression suite and workflow | FOUND | Separate GitHub workflow is green at audited HEAD. |

### 2.2 Provider inventory

| Provider / mechanism | Intended role | Key/config surface | Fallback | Cost classification | Qualification |
|---|---|---|---|---|---|
| Hugging Face Inference API | Classification and moderation in current canonical provider implementation | `HUGGINGFACE_API_KEY`; legacy `NEXT_PUBLIC_HF_ENABLED` flag also exists | Deterministic keyword classification and deterministic moderation | External metered dependency; exact price is not encoded in repository | Direct HTTP calls are contained in `src/lib/ai/providers.ts`; calls run behind the server-side gateway in the new path. |
| Deterministic Swaply rules | Non-AI classification/moderation fallback | No key | N/A | £0 external provider cost | Required continuity path; returns structured outputs compatible with task contracts. |
| Groq | Legacy/parallel LLM capability referenced by environment and repository paths | `GROQ_API_KEY` | Varies by legacy route | External metered dependency | Presence in `.env.example`, health/config and legacy AI routes/scripts requires reconciliation; not part of the inspected canonical provider implementation. |
| Gemini | Legacy/parallel fallback capability | `GEMINI_API_KEY` | Varies by legacy route | External metered dependency | Referenced in environment/health and legacy paths; must not be treated as canonical merely because configured. |
| xAI/Grok Vision | Legacy image analysis capability | `XAI_API_KEY` | Varies by image route | External metered dependency | Referenced for listing image analysis; inventory does not prove Production activation. |
| Translation providers / direct translation scripts | Localisation and content translation | Provider-specific code in `src/lib/translate.ts` and scripts | Existing text/original-language preservation or deterministic passthrough depending on path | Potential external metered dependency | Batch scripts are operational tooling; runtime calls must remain server-side and must be inventoried before closure. |

> Currency note: the repository does not encode stable provider prices. This audit therefore classifies dependencies as external/metered rather than inventing monetary values.

## 3. Canonical gateway guarantees

The new gateway provides the following repository-level guarantees:

1. Browser execution is rejected outside tests.
2. Inputs and outputs are schema-validated.
3. Provider order can be controlled by registry priority or task policy.
4. Every provider attempt is timeout-bounded.
5. External-provider input can be PII-redacted according to task privacy policy.
6. Invalid outputs, timeouts and provider errors fall through to another provider or deterministic fallback.
7. Non-AI fallback has explicit status and zero estimated external cost.
8. Observability can record task type, provider, model, latency, estimated cost, cache metadata, locale and error code without requiring raw user content.

These are contract-level guarantees. Production connectivity, billing, quotas and observed latency remain PR B concerns.

## 4. Direct-provider call inventory

Repository search identified direct external HTTP-call surfaces that require classification as canonical, legacy runtime, build/maintenance tooling, or unrelated integration:

| Path | Classification | Risk / action |
|---|---|---|
| `src/lib/ai/providers.ts` | Canonical provider adapter | ACCEPTED behind gateway; verify Production key, timeout and observability in PR B. |
| `src/lib/translate.ts` | Legacy/parallel runtime translation | REVIEW; confirm it is routed through the E2.2 authority boundary or explicitly retained as a documented adapter. |
| `src/app/api/ai/image/route.ts` | Legacy/parallel AI runtime route | REVIEW; inspect provider calls, auth, rate limits, privacy and fallback. |
| `src/app/api/matching/ai/route.ts` | Legacy/parallel AI matching route | REVIEW; reconcile with E2.3 semantic-match authority. |
| `src/app/api/chat/summary/route.ts` | Legacy/parallel AI summary route | REVIEW; confirm server-only, privacy, timeout, fallback and cost controls. |
| `scripts/generate-seo-content.ts` | Offline/admin generation tooling | DOCUMENT; must never be mistaken for end-user runtime authority. |
| `scripts/translate-direct.mjs` | Offline/admin translation tooling | DOCUMENT; paid-provider use requires explicit operator execution. |
| `scripts/translate-all-locale-keys.mjs` | Offline/admin localisation tooling | DOCUMENT; not a runtime fallback. |
| `src/scripts/populate-translation-cache.ts` | Operational cache population | REVIEW; confirm environment isolation and cost controls. |
| `src/scripts/populate-blog-translations.ts` | Offline/admin content tooling | DOCUMENT. |
| `src/scripts/translate-descriptions-only.ts` | Offline/admin content tooling | DOCUMENT. |

### Required PR B decision for each runtime path

Every runtime path above must receive exactly one status:

- `CANONICAL_ADAPTER` — called only through the Train E authority boundary;
- `LEGACY_ALLOWED` — deliberately retained, documented, tested and non-conflicting;
- `DISABLED` — unreachable or feature-flagged off;
- `REMOVE_LATER` — not a Train E closure blocker only when unreachable and documented.

No path may remain `UNKNOWN` at closure.

## 5. Cache, fallback and cost matrix

| Capability | Cache evidence | Non-AI fallback | Paid dependency risk | Repository-level result |
|---|---|---|---|---|
| Item classification/enrichment | Gateway exposes `cacheHit`; cache implementation is task/path-specific | Keyword taxonomy and tags | Hugging Face or legacy LLM usage | PASS contractually; Production cache behaviour needs evidence. |
| Moderation | No mandatory cache required | Deterministic PII/spam/length rules | Hugging Face toxicity model | PASS contractually; live false-positive/false-negative behaviour not proven. |
| Translation | Translation cache/tooling exists in repository | Original preservation/passthrough contract | Groq/Gemini/other provider depending on path | PARTIAL; direct translation path reconciliation required. |
| Semantic matching | Repository semantic matching service and fallback contract | Non-AI deterministic matching | Embedding/LLM provider depending on configuration | PASS contractually; Production provider/DB evidence pending. |
| Chat summary | Legacy route exists | Unknown until path-level review | External LLM | NEEDS REVIEW in PR B. |
| Image analysis | Legacy route exists | Route-specific fallback | Hugging Face/xAI/Groq/Gemini depending on implementation | NEEDS REVIEW in PR B. |

## 6. Environment and paid-dependency inventory

The environment contract exposes the following external or potentially paid capabilities:

### AI and platform

- Hugging Face
- Groq
- Gemini
- xAI/Grok Vision
- Supabase
- Cloudinary
- Google Maps
- Resend

### Payments and commercial

- Stripe
- PayPal
- Escrow.com
- courier integrations: FAN Courier, Sameday, Cargus, DHL and country-specific providers
- affiliates: Booking, Airbnb, Vrbo, Kiwi, Skyscanner, Rentalcars, DiscoverCars, AutoEurope, FlixBus, Omio, BlaBlaCar
- insurance: XCover and Allianz affiliate
- packaging affiliates/integrations
- ads: AdSense and Carbon

Presence in `.env.example` means the repository supports configuration. It does **not** prove that a provider is enabled, healthy, contractually approved or used in Production.

## 7. Legacy commercial-path inventory

| Domain | Repository/config evidence | Train E authority relationship | Closure qualification |
|---|---|---|---|
| Stripe | publishable/secret/webhook and price variables; legacy payment routes/services exist | Must be reconciled with E4.4/E4.5 payment and webhook authority | NEEDS REVIEW; health/config flags are not transaction evidence. |
| PayPal | client, secret, webhook and sandbox/live mode variables | Parallel legacy payment provider | NEEDS REVIEW; verify sandbox mode, webhook authority and idempotency. |
| Escrow | API key/email/URL; legacy transaction support | Separate financial authority path | NEEDS REVIEW; must not bypass E4 contracts. |
| Boosts/promotions | legacy boosts plus E4.7 campaign contracts | Potential duplicate promotion authority | NEEDS REVIEW; kill switch, budget and frequency authority must be singular. |
| Ads | AdSense/Carbon public configuration | E4.7 controlled promotion boundary | NEEDS REVIEW; configuration is not approval or safe activation. |
| Courier markups | courier credentials and configurable markup percentage | Commercial service boundary | NEEDS REVIEW; disclose markups and keep provider execution server-side. |
| Travel/accommodation affiliates | multiple affiliate IDs | E4.2/E4.3 provider registry and attribution | NEEDS REVIEW; attribution and disclosure must use canonical contracts. |
| Insurance and packaging | provider/affiliate variables | E4 integration and attribution contracts | NEEDS REVIEW; no automatic legitimacy from config presence. |

## 8. Security and privacy findings

### Positive controls

- The canonical gateway rejects client-side execution.
- External-provider payloads support PII redaction.
- Provider secrets are server variables in the canonical design.
- Deterministic fallback limits availability dependence on external AI.
- Structured error codes avoid returning raw provider failures by default.

### Risks requiring PR B verification

1. `NEXT_PUBLIC_HF_ENABLED` is public configuration and must never be treated as a secret or sufficient authorisation.
2. Legacy runtime routes may call providers outside the canonical gateway.
3. Health flags may report configuration rather than real connectivity.
4. Direct scripts can incur provider cost when manually executed; operator documentation must state this explicitly.
5. Legacy payment/ads/provider paths may create duplicate authority or inconsistent disclosure.
6. Cost estimation is optional in the gateway; providers without `estimateCost` return no numerical estimate.
7. `cacheHit` is represented in the result contract, but the gateway shown does not itself provide a cache store.

## 9. E1.1 gap matrix

| Requirement | Result | Evidence / remaining action |
|---|---:|---|
| Inventory AI tasks | PASS | Canonical Train E tasks plus legacy image, matching, summary and translation surfaces identified. |
| Inventory providers/models | PASS | Hugging Face, deterministic fallback, Groq, Gemini and xAI configuration/surfaces identified. |
| Inventory routes/direct calls | PASS | Runtime and script surfaces listed above. |
| Inventory cache | PARTIAL | Cache metadata and translation cache tooling exist; runtime implementation must be verified per path. |
| Inventory fallbacks | PASS contractually | Canonical deterministic fallbacks are explicit; legacy route fallbacks need PR B verification. |
| Inventory cost/paid dependencies | PASS as classification | External metered services identified; no invented prices. Live billing/quota verification remains out of scope. |
| Verify no client-side provider secrets | PASS for canonical gateway; NEEDS REVIEW globally | Canonical gateway is server-only; legacy paths and public flags require path review. |
| Verify direct-provider calls are controlled | PARTIAL | Canonical provider adapter is controlled; legacy runtime paths remain to classify. |
| Verify Production activation/health | OUT OF SCOPE for PR A | PR B. |

## 10. PR A acceptance criteria

- [x] A durable E1.1 audit artefact exists in `docs/`.
- [x] Canonical AI authority and guarantees are documented.
- [x] Providers, tasks, routes, scripts, fallbacks, cache surfaces and paid dependencies are inventoried.
- [x] Legacy Stripe, PayPal, escrow, ads, boosts, affiliate, courier, insurance and packaging paths are inventoried.
- [x] No provider, payment, migration, feature flag, database or Production change is made.
- [x] Unknown runtime paths are explicitly deferred to PR B rather than silently accepted.

## 11. Next bounded step

**PR B — Production parity and authenticated verification** must:

1. compare repository migrations with Supabase Production;
2. inspect live RLS, functions, views and policies;
3. classify every legacy runtime AI and commercial path;
4. run authenticated E3 fixtures with outsider denial, reload persistence and immutable-ID cleanup;
5. test E4 webhook replay, stale events, refunds/reconciliation and campaign kill switch in safe sandbox/simulation;
6. make only evidence-backed, forward-only corrections for real drift.

This report does not close Train E. It closes only the missing E1.1 repository-evidence gap and defines the finite handoff to PR B.
