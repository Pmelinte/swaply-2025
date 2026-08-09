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
    expect(getProductionCapabilityForPath("/api/feature-flags")).toBeNull();
  });

  it("is fail-closed when the owner activation switch is absent", () => {
    vi.stubEnv("SWAPLY_ENABLE_STRIPE_PRODUCTION", "");
    expect(isProductionCapabilityAuthorised("stripe")).toBe(false);
  });

  it("allows activation only through the exact explicit switch", () => {
    vi.stubEnv("SWAPLY_ENABLE_STRIPE_PRODUCTION", "true");
    expect(isProductionCapabilityAuthorised("stripe")).toBe(true);

    vi.stubEnv("SWAPLY_ENABLE_STRIPE_PRODUCTION", "1");
    expect(isProductionCapabilityAuthorised("stripe")).toBe(false);
  });
});
