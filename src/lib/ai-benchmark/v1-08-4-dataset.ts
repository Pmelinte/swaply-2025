import { locales, type Locale } from "@/i18n/config";

export const V1084_DATASET_VERSION = "1.0.0" as const;

export const benchmarkTaskTypes = [
  "classify_item",
  "describe_item",
  "translate",
  "match",
  "moderate_chat",
] as const;

export type BenchmarkTaskType = (typeof benchmarkTaskTypes)[number];

export type BenchmarkProvenance = {
  source: "synthetic_privacy_safe" | "repository_fixture";
  containsPersonalData: false;
  license: "internal_evaluation_only";
  createdFor: "V1-08.4";
};

export type BenchmarkGoldLabel = {
  l1Category?: string;
  l2Category?: string;
  requiredConcepts?: string[];
  forbiddenConcepts?: string[];
  sourceTextMustBePreserved?: boolean;
  advisoryOnly?: boolean;
  moderationLabel?: "safe" | "review" | "unsafe";
  humanConfirmationRequired: boolean;
};

export type BenchmarkCase = {
  id: string;
  locale: Locale;
  taskType: BenchmarkTaskType;
  input: Record<string, unknown>;
  gold: BenchmarkGoldLabel;
  provenance: BenchmarkProvenance;
};

const provenance: BenchmarkProvenance = {
  source: "synthetic_privacy_safe",
  containsPersonalData: false,
  license: "internal_evaluation_only",
  createdFor: "V1-08.4",
};

const templates: Array<{
  suffix: string;
  taskType: BenchmarkTaskType;
  input: Record<string, unknown>;
  gold: BenchmarkGoldLabel;
}> = [
  {
    suffix: "classification-smartphone",
    taskType: "classify_item",
    input: {
      titleHint: "Used smartphone with charger",
      descriptionHint: "Working mobile phone, unlocked, minor scratches",
      imageFixture: "privacy-safe://objects/smartphone-01",
    },
    gold: {
      l1Category: "objects",
      l2Category: "electronics.mobile_phones",
      requiredConcepts: ["smartphone", "working", "used"],
      forbiddenConcepts: ["property", "service", "event"],
      humanConfirmationRequired: true,
    },
  },
  {
    suffix: "description-bicycle",
    taskType: "describe_item",
    input: {
      titleHint: "City bicycle",
      facts: ["adult size", "seven gears", "visible normal wear"],
      imageFixture: "privacy-safe://objects/bicycle-01",
    },
    gold: {
      requiredConcepts: ["bicycle", "seven gears", "normal wear"],
      forbiddenConcepts: ["new", "perfect condition", "guaranteed"],
      humanConfirmationRequired: true,
    },
  },
  {
    suffix: "translation-original-preserved",
    taskType: "translate",
    input: {
      sourceLocale: "ro",
      sourceText: "Bicicletă de oraș cu șapte viteze și urme normale de utilizare.",
    },
    gold: {
      requiredConcepts: ["city bicycle", "seven gears", "normal wear"],
      sourceTextMustBePreserved: true,
      humanConfirmationRequired: false,
    },
  },
  {
    suffix: "matching-advisory",
    taskType: "match",
    input: {
      offeredItem: { category: "objects", title: "City bicycle" },
      requestedItem: { category: "objects", title: "Camping tent" },
      deterministicBaseScore: 68,
      distanceKm: 14,
    },
    gold: {
      requiredConcepts: ["compatibility", "distance", "user decision"],
      advisoryOnly: true,
      humanConfirmationRequired: true,
    },
  },
  {
    suffix: "moderation-context-review",
    taskType: "moderate_chat",
    input: {
      text: "Can we meet tomorrow in a public place to inspect the bicycle?",
      context: "swap negotiation",
    },
    gold: {
      requiredConcepts: ["public place", "inspection"],
      moderationLabel: "safe",
      advisoryOnly: true,
      humanConfirmationRequired: true,
    },
  },
];

export const v1084BenchmarkCases: BenchmarkCase[] = locales.flatMap((locale) =>
  templates.map((template) => ({
    id: `v1084-${locale}-${template.suffix}`,
    locale,
    taskType: template.taskType,
    input: {
      ...template.input,
      targetLocale: locale,
    },
    gold: template.gold,
    provenance,
  })),
);

export const v1084BenchmarkManifest = {
  version: V1084_DATASET_VERSION,
  localeCount: locales.length,
  taskCountPerLocale: templates.length,
  caseCount: v1084BenchmarkCases.length,
  locales: [...locales],
  taskTypes: [...benchmarkTaskTypes],
  providerExecutionAuthorised: false,
  realCostAuthorised: false,
} as const;
