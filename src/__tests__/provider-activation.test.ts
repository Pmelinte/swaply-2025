import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getProductionCapabilityForPath,
  isProductionCapabilityAuthorised,
} from "@/lib/provider-activation";

describe("provider production activation", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("maps provider-backed API routes to their capability", () => {
    expect(getProductionCapabilityForPath("/api/payments/checkout")).toBe("stripe");
    expect(getProductionCapabilityForPath("/api/payments/paypal/create")).toBe("paypal");
    expect(getProductionCapabilityForPath("/api/escrow/create")).toBe("escrow");
    expect(getProductionCapabilityForPath("/api/courier/create-awb")).toBe("couriers");
    expect(getProductionCapabilityForPath("/api/insurance/quote")).toBe("insurance");
    expect(getProductionCapabilityForPath("/api/travel/flights")).toBe("travel_integrations");

    for (const path of [
      "/api/ai/image",
      "/api/analyze-image",
      "/api/embeddings",
      "/api/match-semantic",
    ]) {
      expect(getProductionCapabilityForPath(path)).toBe("paid_ai");
    }
  });

  it("keeps gateway-backed non-AI fallbacks reachable", () => {
    for (const path of [
      "/api/ai",
      "/api/ai/match",
      "/api/moderate",
      "/api/translate",
      "/api/feature-flags",
      "/api/health",
    ]) {
      expect(getProductionCapabilityForPath(path)).toBeNull();
    }
  });

  it("is fail-closed when the owner activation switch is absent", () => {
    vi.stubEnv("SWAPLY_ENABLE_STRIPE_PRODUCTION", "");
    vi.stubEnv("SWAPLY_ENABLE_PAID_AI_PRODUCTION", "");
    expect(isProductionCapabilityAuthorised("stripe")).toBe(false);
    expect(isProductionCapabilityAuthorised("paid_ai")).toBe(false);
  });

  it("allows activation only through the exact explicit switch", () => {
    vi.stubEnv("SWAPLY_ENABLE_STRIPE_PRODUCTION", "true");
    expect(isProductionCapabilityAuthorised("stripe")).toBe(true);

    vi.stubEnv("SWAPLY_ENABLE_STRIPE_PRODUCTION", "1");
    expect(isProductionCapabilityAuthorised("stripe")).toBe(false);
  });
});
