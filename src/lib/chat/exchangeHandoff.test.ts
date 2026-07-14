import { describe, expect, it } from "vitest";
import { parseMatchAgreementExchangeResult } from "./exchangeHandoff";

describe("parseMatchAgreementExchangeResult", () => {
  it("normalizes a successful newly created Exchange", () => {
    expect(
      parseMatchAgreementExchangeResult({
        swap_id: "11111111-1111-4111-8111-111111111111",
        created: true,
        agreement_revision: 3,
      }),
    ).toEqual({
      swapId: "11111111-1111-4111-8111-111111111111",
      created: true,
      agreementRevision: 3,
    });
  });

  it("keeps an idempotently reused Exchange distinct from a new one", () => {
    expect(
      parseMatchAgreementExchangeResult({
        swap_id: "22222222-2222-4222-8222-222222222222",
        created: false,
        agreement_revision: "4",
      }),
    ).toEqual({
      swapId: "22222222-2222-4222-8222-222222222222",
      created: false,
      agreementRevision: 4,
    });
  });

  it("rejects malformed RPC payloads", () => {
    expect(parseMatchAgreementExchangeResult(null)).toBeNull();
    expect(
      parseMatchAgreementExchangeResult({
        swap_id: "",
        created: true,
        agreement_revision: 0,
      }),
    ).toBeNull();
  });

  it("rejects a drifted RPC response that omits the agreement revision", () => {
    expect(
      parseMatchAgreementExchangeResult({
        swap_id: "33333333-3333-4333-8333-333333333333",
        conversation_id: "44444444-4444-4444-8444-444444444444",
        match_id: "55555555-5555-4555-8555-555555555555",
        created: true,
      }),
    ).toBeNull();
  });
});
