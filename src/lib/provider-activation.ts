export type ProductionCapability =
  | "stripe"
  | "paypal"
  | "escrow"
  | "couriers"
  | "insurance"
  | "travel_integrations"
  | "paid_ai";

const CAPABILITY_ENV: Record<ProductionCapability, string> = {
  stripe: "SWAPLY_ENABLE_STRIPE_PRODUCTION",
  paypal: "SWAPLY_ENABLE_PAYPAL_PRODUCTION",
  escrow: "SWAPLY_ENABLE_ESCROW_PRODUCTION",
  couriers: "SWAPLY_ENABLE_COURIERS_PRODUCTION",
  insurance: "SWAPLY_ENABLE_INSURANCE_PRODUCTION",
  travel_integrations: "SWAPLY_ENABLE_TRAVEL_INTEGRATIONS_PRODUCTION",
  paid_ai: "SWAPLY_ENABLE_PAID_AI_PRODUCTION",
};

const PROVIDER_ROUTE_RULES: Array<{
  prefix: string;
  capability: ProductionCapability;
}> = [
  { prefix: "/api/payments/paypal", capability: "paypal" },
  { prefix: "/api/payments/escrow", capability: "escrow" },
  { prefix: "/api/escrow", capability: "escrow" },
  { prefix: "/api/courier", capability: "couriers" },
  { prefix: "/api/dhl", capability: "couriers" },
  { prefix: "/api/insurance", capability: "insurance" },
  { prefix: "/api/travel", capability: "travel_integrations" },

  // These routes invoke providers directly and cannot complete their task
  // without external AI. Gateway-backed routes such as /api/ai, /api/moderate
  // and /api/translate stay reachable: createServerAIGateway omits providers
  // when unauthorised and returns their deterministic non-AI fallbacks.
  { prefix: "/api/ai/image", capability: "paid_ai" },
  { prefix: "/api/analyze-image", capability: "paid_ai" },
  { prefix: "/api/embeddings", capability: "paid_ai" },
  { prefix: "/api/match-semantic", capability: "paid_ai" },

  { prefix: "/api/payments", capability: "stripe" },
];

export function isProductionCapabilityAuthorised(
  capability: ProductionCapability,
): boolean {
  return process.env[CAPABILITY_ENV[capability]] === "true";
}

export function getProductionCapabilityForPath(
  pathname: string,
): ProductionCapability | null {
  return (
    PROVIDER_ROUTE_RULES.find(({ prefix }) =>
      pathname === prefix || pathname.startsWith(`${prefix}/`),
    )?.capability ?? null
  );
}

export function getProductionCapabilityEnvName(
  capability: ProductionCapability,
): string {
  return CAPABILITY_ENV[capability];
}
