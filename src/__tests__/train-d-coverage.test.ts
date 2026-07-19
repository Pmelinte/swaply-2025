import { describe, expect, it } from "vitest";
import {
  TRAIN_D_BATCH_COVERAGE,
  TRAIN_D_REQUIRED_BATCHES,
  getTrainDBatchCoverage,
  getTrainDCoverageSummary,
} from "@/lib/train-d/coverage";

describe("Train D coverage registry", () => {
  it("covers every batch from 66 through 92 exactly once", () => {
    const batches = TRAIN_D_BATCH_COVERAGE.map((entry) => entry.batch);

    expect(batches).toEqual(TRAIN_D_REQUIRED_BATCHES);
    expect(new Set(batches).size).toBe(27);
  });

  it("keeps batches grouped into the five roadmap deliverable waves", () => {
    expect(TRAIN_D_BATCH_COVERAGE.map((entry) => entry.wave)).toEqual([
      "D1", "D1", "D1",
      "D2", "D2", "D2", "D2", "D2", "D2", "D2",
      "D3", "D3", "D3", "D3", "D3", "D3", "D3",
      "D4", "D4", "D4", "D4", "D4", "D4", "D4",
      "D5", "D5", "D5",
    ]);
  });

  it("records dependencies only on earlier batches", () => {
    for (const entry of TRAIN_D_BATCH_COVERAGE) {
      expect(entry.dependencies.every((dependency) => dependency < entry.batch)).toBe(true);
    }
  });

  it("exposes a compact status summary and lookup helper", () => {
    expect(getTrainDBatchCoverage(86)?.feature).toContain("Server-controlled token rewards");

    const summary = getTrainDCoverageSummary();
    expect(summary.blocked).toEqual([]);
    expect(summary.partial).toEqual([82, 91, 92]);
    expect(summary.implemented).toContain(66);
    expect(summary.implemented).toContain(90);
    expect(summary.verdict).toBe("TRAIN_D_FUNCTIONAL_CONTRACT_IMPLEMENTED_WITH_DEFERRED_HARDENING");
  });
});
