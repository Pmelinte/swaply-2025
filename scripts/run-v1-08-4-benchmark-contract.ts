import { writeFile } from "node:fs/promises";
import {
  v1084BenchmarkCases,
  v1084BenchmarkManifest,
} from "../src/lib/ai-benchmark/v1-08-4-dataset";

const evidence = {
  generatedAt: new Date().toISOString(),
  status: "provider_free_contract_only",
  manifest: v1084BenchmarkManifest,
  taskDistribution: Object.fromEntries(
    v1084BenchmarkManifest.taskTypes.map((taskType) => [
      taskType,
      v1084BenchmarkCases.filter((entry) => entry.taskType === taskType).length,
    ]),
  ),
  localeDistribution: Object.fromEntries(
    v1084BenchmarkManifest.locales.map((locale) => [
      locale,
      v1084BenchmarkCases.filter((entry) => entry.locale === locale).length,
    ]),
  ),
  privacy: {
    personalDataCases: v1084BenchmarkCases.filter(
      (entry) => entry.provenance.containsPersonalData,
    ).length,
    syntheticPrivacySafeCases: v1084BenchmarkCases.filter(
      (entry) => entry.provenance.source === "synthetic_privacy_safe",
    ).length,
  },
  dimensionsReady: [
    "classification_l1_l2",
    "localized_description",
    "translation_source_preservation",
    "advisory_matching",
    "moderation_false_positive_review",
    "schema",
    "cost",
    "latency",
    "fallback",
    "privacy",
    "provenance",
    "human_confirmation",
  ],
  providerExecutionAuthorised: false,
  realCostAuthorised: false,
};

await writeFile(
  "v1-08-4-benchmark-contract-evidence.json",
  `${JSON.stringify(evidence, null, 2)}\n`,
  "utf8",
);

console.log(JSON.stringify(evidence, null, 2));
