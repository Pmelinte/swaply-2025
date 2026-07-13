import { describe, expect, it } from "vitest";
import {
  hasMatchConversationAgreementContent,
  isMatchConversationAgreementConfirmedByBoth,
  parseMatchConversationAgenda,
  parseMatchConversationAgreement,
  shouldApplyMatchConversationAgenda,
} from "./chatQueries";

describe("match conversation agenda parsing", () => {
  it("normalizes invalid versions, stages, and agreement fields", () => {
    expect(
      parseMatchConversationAgenda({
        version: "not-a-number",
        conversation_id: 123,
        active_stage: "unknown",
        completed_stages: [
          "condition",
          "condition",
          "invalid",
          "logistics",
        ],
        agreement: {
          revision: -2,
          condition_notes: 123,
          offer_notes: "Camera for bicycle",
          logistics_method: "teleport",
          logistics_notes: null,
          additional_terms: "No automatic Exchange",
          confirmed_by: ["user-a", "user-a", 99, "user-b"],
          updated_by: false,
          updated_at: 123,
        },
        updated_by: 123,
        updated_at: false,
      }),
    ).toEqual({
      version: 1,
      conversation_id: null,
      active_stage: "interest",
      completed_stages: ["condition", "logistics"],
      agreement: {
        revision: 0,
        condition_notes: "",
        offer_notes: "Camera for bicycle",
        logistics_method: null,
        logistics_notes: "",
        additional_terms: "No automatic Exchange",
        confirmed_by: ["user-a", "user-b"],
        updated_by: null,
        updated_at: null,
      },
      updated_by: null,
      updated_at: null,
    });
  });

  it("keeps finite positive agenda versions and non-negative agreement revisions", () => {
    expect(parseMatchConversationAgenda({ version: 3.9 }).version).toBe(3);
    expect(parseMatchConversationAgenda({ version: 0 }).version).toBe(1);
    expect(parseMatchConversationAgenda({ version: Number.NaN }).version).toBe(1);
    expect(parseMatchConversationAgreement({ revision: 4.8 }).revision).toBe(4);
  });
});

describe("bilateral match agreement helpers", () => {
  const agreement = parseMatchConversationAgreement({
    revision: 2,
    condition_notes: "Both items inspected.",
    confirmed_by: ["user-a", "user-b"],
  });

  it("detects content and requires the exact two participants for bilateral confirmation", () => {
    expect(hasMatchConversationAgreementContent(agreement)).toBe(true);
    expect(
      isMatchConversationAgreementConfirmedByBoth(agreement, [
        "user-a",
        "user-b",
      ]),
    ).toBe(true);
    expect(
      isMatchConversationAgreementConfirmedByBoth(agreement, [
        "user-a",
        "user-c",
      ]),
    ).toBe(false);
    expect(
      isMatchConversationAgreementConfirmedByBoth(agreement, ["user-a"]),
    ).toBe(false);
  });

  it("treats an empty normalized agreement as not ready", () => {
    expect(
      hasMatchConversationAgreementContent(
        parseMatchConversationAgreement({
          revision: 1,
          condition_notes: "   ",
          confirmed_by: [],
        }),
      ),
    ).toBe(false);
  });
});

describe("match conversation agenda ordering", () => {
  const base = parseMatchConversationAgenda({
    version: 2,
    conversation_id: "conversation-a",
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
