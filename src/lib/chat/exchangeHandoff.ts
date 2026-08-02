import type { SupabaseClient } from "@supabase/supabase-js";

export type MatchAgreementExchangeResult = {
  swapId: string;
  created: boolean;
  agreementRevision: number;
  agreementHash: string;
};

export function parseMatchAgreementExchangeResult(
  value: unknown,
): MatchAgreementExchangeResult | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;

  const row = value as Record<string, unknown>;
  const swapId = typeof row.swap_id === "string" ? row.swap_id : "";
  const created = row.created === true;
  const agreementRevision = Number(row.agreement_revision);
  const agreementHash =
    typeof row.agreement_hash === "string" ? row.agreement_hash : "";

  if (
    !swapId ||
    !Number.isFinite(agreementRevision) ||
    agreementRevision < 1 ||
    !/^[a-f0-9]{64}$/.test(agreementHash)
  ) {
    return null;
  }

  return {
    swapId,
    created,
    agreementRevision: Math.trunc(agreementRevision),
    agreementHash,
  };
}

export async function createExchangeFromMatchAgreement(
  supabase: SupabaseClient,
  input: {
    conversationId: string;
    expectedRevision: number;
  },
): Promise<MatchAgreementExchangeResult | null> {
  const { data, error } = await supabase.rpc(
    "create_exchange_from_match_agreement",
    {
      p_conversation_id: input.conversationId,
      p_expected_revision: input.expectedRevision,
    },
  );

  if (error) {
    console.error("createExchangeFromMatchAgreement failed", error);
    return null;
  }

  const parsed = parseMatchAgreementExchangeResult(data);
  if (!parsed) {
    console.error("createExchangeFromMatchAgreement returned invalid data", data);
  }

  return parsed;
}
