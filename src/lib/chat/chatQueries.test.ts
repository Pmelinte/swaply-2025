import { describe, expect, it } from "vitest";
import {
  parseMatchConversationAgenda,
  shouldApplyMatchConversationAgenda,
} from "./chatQueries";

describe("match conversation agenda parsing", () => {
  it("normalizes invalid versions and filters invalid stages", () => {
    expect(
      parseMatchConversationAgenda({
        version: "not-a-number",
        active_stage: "unknown",
        completed_stages: [
          "condition",
          "condition",
          "invalid",
          "logistics",
        ],
        updated_by: 123,
        updated_at: false,
      }),
    ).toEqual({
      version: 1,
      active_stage: "interest",
      completed_stages: ["condition", "logistics"],
      updated_by: null,
      updated_at: null,
    });
  });

  it("keeps finite positive integer versions", () => {
    expect(parseMatchConversationAgenda({ version: 3.9 }).version).toBe(3);
    expect(parseMatchConversationAgenda({ version: 0 }).version).toBe(1);
    expect(parseMatchConversationAgenda({ version: Number.NaN }).version).toBe(1);
  });
});

describe("match conversation agenda ordering", () => {
  const base = parseMatchConversationAgenda({
    version: 1,
    active_stage: "condition",
    completed_stages: ["condition"],
    updated_at: "2026-07-13T14:30:00.000Z",
  });

  it("accepts equal or newer server snapshots", () => {
    expect(
      shouldApplyMatchConversationAgenda(
        base,
        parseMatchConversationAgenda({
          active_stage: "logistics",
          updated_at: "2026-07-13T14:30:00.000Z",
        }),
      ),
    ).toBe(true);
    expect(
      shouldApplyMatchConversationAgenda(
        base,
        parseMatchConversationAgenda({
          active_stage: "agreement",
          updated_at: "2026-07-13T14:31:00.000Z",
        }),
      ),
    ).toBe(true);
  });

  it("rejects older or invalid snapshots after a dated snapshot", () => {
    expect(
      shouldApplyMatchConversationAgenda(
        base,
        parseMatchConversationAgenda({
          active_stage: "interest",
          updated_at: "2026-07-13T14:29:00.000Z",
        }),
      ),
    ).toBe(false);
    expect(
      shouldApplyMatchConversationAgenda(
        base,
        parseMatchConversationAgenda({
          active_stage: "interest",
          updated_at: "invalid",
        }),
      ),
    ).toBe(false);
  });
});
