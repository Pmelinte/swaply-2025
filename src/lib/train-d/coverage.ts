export type TrainDStatus = "implemented" | "partial" | "blocked";

export type TrainDWave = "D1" | "D2" | "D3" | "D4" | "D5";

export type TrainDBatchCoverage = {
  batch: number;
  wave: TrainDWave;
  feature: string;
  systems: readonly string[];
  dependencies: readonly number[];
  status: TrainDStatus;
  hardening?: string;
};

const batch = (
  batch: number,
  wave: TrainDWave,
  feature: string,
  systems: readonly string[],
  dependencies: readonly number[] = [],
  hardening?: string,
): TrainDBatchCoverage => ({
  batch,
  wave,
  feature,
  systems,
  dependencies,
  status: hardening ? "partial" : "implemented",
  ...(hardening ? { hardening } : {}),
});

export const TRAIN_D_BATCH_COVERAGE = [
  batch(66, "D1", "Global locale, authenticated language preferences, failure-safe chat translation and accessible contextual drawer", ["i18n", "profile", "chat", "drawer"]),
  batch(67, "D1", "Approximate-location readiness for global discovery without exposing exact private coordinates", ["profile", "geo", "public_profiles"], [65, 66]),
  batch(68, "D1", "Media fallback contract for profile and listing surfaces", ["profile", "objects", "media"], [66]),
  batch(69, "D2", "Properties wizard parity: validation, draft state, submit normalization and discoverable cards", ["properties", "wizard", "explore"], [66]),
  batch(70, "D2", "Services wizard parity: offer/request intent, availability, location scope and browse cards", ["services", "wizard", "explore"], [66]),
  batch(71, "D2", "Events wizard parity: date window, participation terms, location scope and browse cards", ["events", "wizard", "explore"], [66]),
  batch(72, "D2", "Cross-domain taxonomy and category metadata shared by Objects, Properties, Services and Events", ["taxonomy", "categories", "i18n"], [69, 70, 71]),
  batch(73, "D2", "Unified explore filters across four domains with empty/loading/error states", ["explore", "filters", "ui"], [69, 70, 71, 72]),
  batch(74, "D2", "Domain-aware detail page contract and safe action routing", ["objects", "properties", "services", "events", "routing"], [73]),
  batch(75, "D2", "Domain parity smoke coverage for create, browse and detail routes", ["tests", "playwright", "routing"], [69, 70, 71, 74]),
  batch(76, "D3", "Cross-domain interest creation preserving source-domain and target-domain intent", ["matching", "interests", "database"], [75]),
  batch(77, "D3", "Human-centered matching explanation model with non-AI fallback", ["matching", "ai", "fallbacks"], [76]),
  batch(78, "D3", "Cross-domain conversation agenda and guided negotiation prompts", ["chat", "agenda", "matching"], [76, 77]),
  batch(79, "D3", "Cross-domain exchange handoff terms for object/property/service/event swaps", ["exchange", "terms", "chat"], [78]),
  batch(80, "D3", "Logistics options for local, courier, service delivery, event attendance and property handover", ["exchange", "logistics"], [79]),
  batch(81, "D3", "Cross-domain completion, cancellation and dispute integration on the canonical lifecycle", ["swaps", "reviews", "disputes"], [79, 80]),
  batch(82, "D3", "Cross-domain E2E smoke fixture covering at least one mixed-domain exchange", ["tests", "playwright", "database"], [81], "Broaden authenticated browser coverage after stable seeded Production fixtures are available."),
  batch(83, "D4", "Stories submission workflow with consent gate and moderation state", ["stories", "moderation", "consent"], [66]),
  batch(84, "D4", "Blog interaction policy keeping editorial blog content separate from user stories", ["blog", "stories", "policy"], [83]),
  batch(85, "D4", "Trust profile summary aligned with reviews, reports, disputes and completion history", ["trust", "reviews", "safety"], [81]),
  batch(86, "D4", "Server-controlled token rewards with idempotency keys and no purchasable rank", ["tokens", "rank", "database"], [81, 85]),
  batch(87, "D4", "Admin moderation queue for stories, reports, disputes and trust-impacting events", ["admin", "moderation", "safety"], [83, 85, 86]),
  batch(88, "D4", "Notification center coverage for cross-domain match, chat, exchange, story and moderation events", ["notifications", "realtime"], [78, 81, 87]),
  batch(89, "D4", "Global monetization surfaces that explain Premium/Platinum without selling trust rank", ["monetization", "trust", "ui"], [86]),
  batch(90, "D5", "Train D release readiness matrix for functionality, migrations, CI, Preview and Production smoke", ["release", "ci", "docs"], [66, 75, 82, 89]),
  batch(91, "D5", "Security and RLS closure checklist for profile, public projection, cross-domain data and rewards", ["security", "rls", "supabase"], [90], "Run full Supabase advisors and Production parity checks in the final deployment window."),
  batch(92, "D5", "Public Beta closure verdict and single deferred hardening backlog", ["release", "docs", "production"], [90, 91], "Record final external deployment evidence once CI/Vercel/Supabase credentials are available in the execution environment."),
] as const satisfies readonly TrainDBatchCoverage[];

export const TRAIN_D_REQUIRED_BATCHES = Array.from({ length: 27 }, (_, index) => index + 66);

export function getTrainDBatchCoverage(batchNumber: number) {
  return TRAIN_D_BATCH_COVERAGE.find((entry) => entry.batch === batchNumber);
}

export function getTrainDCoverageSummary() {
  const implemented = TRAIN_D_BATCH_COVERAGE.filter((entry) => entry.status === "implemented").map((entry) => entry.batch);
  const partial = TRAIN_D_BATCH_COVERAGE.filter((entry) => entry.status === "partial").map((entry) => entry.batch);
  const blocked = TRAIN_D_BATCH_COVERAGE.filter((entry) => entry.status === "blocked").map((entry) => entry.batch);

  return {
    implemented,
    partial,
    blocked,
    verdict: partial.length === 0 && blocked.length === 0 ? "TRAIN_D_FUNCTIONALLY_IMPLEMENTED" : "TRAIN_D_FUNCTIONAL_CONTRACT_IMPLEMENTED_WITH_DEFERRED_HARDENING",
  } as const;
}
