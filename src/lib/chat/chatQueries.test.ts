import { describe, expect, it } from "vitest";
import {
  hasMatchConversationAgreementContent,
  isMatchConversationAgreementConfirmedByBoth,
  parseMatchConversationAgenda,
  parseMatchConversationAgreement,
  shouldApplyMatchConversationAgenda,
} from "./chatQueries";

const HASH = "a".repeat(64);

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
          domain_terms: [{ domain: "unknown" }],
          confirmed_by: ["user-a", "user-a", 99, "user-b"],
          confirmations: {
            "user-a": { revision: 0, content_hash: "bad", confirmed_at: "" },
          },
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
        schema_version: "2.0",
        revision: 0,
        content_hash: "",
        condition_notes: "",
        offer_notes: "Camera for bicycle",
        logistics_method: null,
        logistics_notes: "",
        additional_terms: "No automatic Exchange",
        domain_terms: [],
        confirmed_by: ["user-a", "user-b"],
        confirmations: {},
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
    schema_version: "3.0",
    revision: 2,
    content_hash: HASH,
    condition_notes: "Both items inspected.",
    confirmed_by: ["user-a", "user-b"],
    confirmations: {
      "user-a": {
        revision: 2,
        content_hash: HASH,
        confirmed_at: "2026-08-02T10:00:00Z",
      },
      "user-b": {
        revision: 2,
        content_hash: HASH,
        confirmed_at: "2026-08-02T10:01:00Z",
      },
    },
  });

  it("requires the exact revision and content hash from both participants", () => {
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

  it("rejects confirmations copied from another revision or hash", () => {
    const stale = parseMatchConversationAgreement({
      ...agreement,
      revision: 3,
    });
    expect(
      isMatchConversationAgreementConfirmedByBoth(stale, [
        "user-a",
        "user-b",
      ]),
    ).toBe(false);

    const changedHash = parseMatchConversationAgreement({
      ...agreement,
      content_hash: "b".repeat(64),
    });
    expect(
      isMatchConversationAgreementConfirmedByBoth(changedHash, [
        "user-a",
        "user-b",
      ]),
    ).toBe(false);
  });

  it("treats domain terms as content and an empty agreement as not ready", () => {
    expect(
      hasMatchConversationAgreementContent(
        parseMatchConversationAgreement({
          revision: 1,
          domain_terms: [
            {
              item_id: "item-a",
              domain: "property",
              terms: {
                period_start: "2026-09-01",
                period_end: "2026-09-07",
              },
            },
          ],
        }),
      ),
    ).toBe(true);

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
