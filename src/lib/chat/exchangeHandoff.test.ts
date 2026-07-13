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
});
