export const V108_REQUIREMENTS = {
  i18n: [
    "V108-I18N-001",
    "V108-I18N-002",
    "V108-I18N-003",
    "V108-I18N-004",
    "V108-I18N-005",
    "V108-I18N-006",
    "V108-I18N-007",
    "V108-I18N-008",
    "V108-I18N-009",
  ],
  aiBenchmark: [
    "V108-AI-001",
    "V108-AI-002",
    "V108-AI-003",
    "V108-AI-004",
    "V108-AI-005",
    "V108-AI-006",
    "V108-AI-007",
    "V108-AI-008",
    "V108-AI-009",
    "V108-AI-010",
    "V108-AI-011",
    "V108-AI-012",
    "V108-AI-013",
  ],
} as const;

export type V108RequirementId =
  (typeof V108_REQUIREMENTS)[keyof typeof V108_REQUIREMENTS][number];

export type V108EvidenceState =
  | "absent"
  | "foundation"
  | "partial"
  | "repository_verified"
  | "production_verified"
  | "unknown";

export interface V108AuditRow {
  id: V108RequirementId;
  requirement: string;
  code: V108EvidenceState;
  database: V108EvidenceState;
  tests: V108EvidenceState;
  production: V108EvidenceState;
  gap: string | null;
}

const row = (
  id: V108RequirementId,
  requirement: string,
  code: V108EvidenceState,
  database: V108EvidenceState,
  tests: V108EvidenceState,
  production: V108EvidenceState,
  gap: string | null,
): V108AuditRow => ({ id, requirement, code, database, tests, production, gap });

export const V108_INITIAL_AUDIT: readonly V108AuditRow[] = [
  row("V108-I18N-001", "Profile supports primary, secondary and tertiary language preferences.", "partial", "unknown", "partial", "unknown", "The shared locale chain exists, but persisted profile parity and authenticated UI evidence must be reconfirmed."),
  row("V108-I18N-002", "A single reusable fallback chain is used across applicable product surfaces.", "repository_verified", "absent", "repository_verified", "unknown", "Cross-surface usage must be inventoried; repository presence alone does not prove universal adoption."),
  row("V108-I18N-003", "English is used only as the final technical fallback.", "repository_verified", "absent", "repository_verified", "unknown", "Runtime evidence across representative non-English locales remains required."),
  row("V108-I18N-004", "Original user-authored text is preserved when translated content is displayed.", "partial", "unknown", "partial", "unknown", "Chat, Stories and Blog need separate persistence and presentation evidence."),
  row("V108-I18N-005", "Users can show the original text when a translation is displayed.", "partial", "unknown", "partial", "unknown", "Route-level authenticated browser evidence remains incomplete."),
  row("V108-I18N-006", "Public UI contains no unregistered hardcoded strings on audited routes.", "partial", "absent", "partial", "unknown", "A repeatable scanner with actionable allowlists and route coverage is required."),
  row("V108-I18N-007", "Routes and contextual calls to action work in multiple LTR and RTL locales.", "repository_verified", "absent", "repository_verified", "partial", "Production evidence exists for selected locales, but V1-08 cumulative route coverage is not yet attached."),
  row("V108-I18N-008", "Layouts tolerate longer translations and active RTL presentation without navigation regressions.", "partial", "absent", "partial", "partial", "Visual evidence must cover representative long-text LTR and RTL routes on desktop and mobile."),
  row("V108-I18N-009", "Blog and Stories have measurable translation completeness for all active locales.", "partial", "partial", "partial", "unknown", "A deterministic completeness artifact and original/fallback provenance are required."),

  row("V108-AI-001", "The benchmark covers at least 10 to 15 representative languages.", "foundation", "absent", "foundation", "unknown", "Existing zero-cost evaluation infrastructure does not yet prove a real multilingual benchmark run."),
  row("V108-AI-002", "The benchmark uses representative real or privacy-safe object images.", "foundation", "absent", "foundation", "unknown", "A versioned, licensed or generated benchmark dataset manifest is required."),
  row("V108-AI-003", "Item classification is scored at category level L1 and subcategory level L2.", "foundation", "absent", "foundation", "unknown", "Gold labels and explicit scoring thresholds are not yet demonstrated cumulatively."),
  row("V108-AI-004", "Generated item descriptions are evaluated for factuality, usefulness and locale quality.", "foundation", "absent", "foundation", "unknown", "A repeatable rubric and human-review record are required."),
  row("V108-AI-005", "Translation quality is measured without losing the original source text.", "foundation", "partial", "foundation", "unknown", "Real-provider multilingual results and provenance remain required."),
  row("V108-AI-006", "Matching explanations are evaluated for structure, usefulness and non-decisive behavior.", "repository_verified", "absent", "repository_verified", "unknown", "The contract is tested, but real multilingual provider output is not yet benchmarked."),
  row("V108-AI-007", "Moderation is evaluated for safety coverage and false-positive handling.", "repository_verified", "partial", "repository_verified", "unknown", "Real-provider multilingual moderation cases and review outcomes remain required."),
  row("V108-AI-008", "Every evaluated structured output is schema-validated.", "repository_verified", "absent", "repository_verified", "unknown", "Benchmark artifacts must record schema success and failure per case."),
  row("V108-AI-009", "Cost is measured per task, model and successful operation.", "foundation", "partial", "foundation", "unknown", "No authorised paid-provider benchmark cost record exists yet."),
  row("V108-AI-010", "Latency is measured per task, model, locale and cache state.", "foundation", "partial", "foundation", "unknown", "No repeatable real-provider latency artifact exists yet."),
  row("V108-AI-011", "Provider failure and non-AI fallback are exercised without blocking core flows.", "repository_verified", "partial", "repository_verified", "partial", "Cumulative V1-08 evidence must include user-visible fallback behavior on exact Preview and Production builds."),
  row("V108-AI-012", "Privacy and provenance are recorded without unnecessary raw sensitive content.", "partial", "partial", "partial", "unknown", "Dataset provenance, provider disclosure and redaction evidence remain incomplete."),
  row("V108-AI-013", "Human confirmation is required for consequential AI suggestions and decisions.", "repository_verified", "partial", "repository_verified", "partial", "V1-08 must replay representative UI journeys and prove that AI cannot auto-finalize user decisions."),
];

export const V108_REQUIRED_LOCALE_SAMPLE_MIN = 10;
export const V108_REQUIRED_LOCALE_SAMPLE_MAX = 15;

export const V108_REQUIRED_BENCHMARK_DIMENSIONS = [
  "quality",
  "locale_coverage",
  "schema_correctness",
  "safety",
  "cost",
  "latency",
  "fallback",
  "privacy",
  "provenance",
  "human_confirmation",
] as const;

export const V108_REQUIRED_JOURNEYS = [
  "profile_language_preferences",
  "guest_multi_locale_routes",
  "authenticated_translation_show_original",
  "rtl_desktop_mobile_layout",
  "blog_translation_completeness",
  "stories_translation_completeness",
  "item_image_classification_l1_l2",
  "localized_item_description",
  "localized_matching_explanation",
  "multilingual_moderation_review",
  "provider_failure_non_ai_fallback",
] as const;
