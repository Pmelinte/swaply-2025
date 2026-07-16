import { describe, expect, it } from "vitest";
import {
  isSafetyReportAction,
  isSafetyReportReason,
  isSafetyReportStatus,
  mapSafetyErrorStatus,
} from "./reportBlockPolicy";

describe("Batch 63.3 safety policy", () => {
  it("accepts only canonical reasons, statuses and moderator actions", () => {
    expect(isSafetyReportReason("scam")).toBe(true);
    expect(isSafetyReportReason("inappropriate_content")).toBe(false);
    expect(isSafetyReportStatus("investigating")).toBe(true);
    expect(isSafetyReportStatus("pending")).toBe(false);
    expect(isSafetyReportAction("suspend_7d")).toBe(true);
    expect(isSafetyReportAction("ban_forever")).toBe(false);
  });

  it("maps authorization, conflict, validation and rate limits distinctly", () => {
    expect(mapSafetyErrorStatus("42501")).toBe(403);
    expect(mapSafetyErrorStatus("P0002")).toBe(404);
    expect(mapSafetyErrorStatus("40001")).toBe(409);
    expect(mapSafetyErrorStatus("23505")).toBe(409);
    expect(mapSafetyErrorStatus("22023")).toBe(422);
    expect(mapSafetyErrorStatus("23514")).toBe(422);
    expect(mapSafetyErrorStatus("54000")).toBe(429);
    expect(mapSafetyErrorStatus(undefined)).toBe(500);
  });
});
