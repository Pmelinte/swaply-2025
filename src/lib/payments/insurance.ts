/**
 * Insurance integration for Swaply.
 * Provides shipping insurance and travel insurance for swap participants.
 *
 * Types of insurance:
 *   1. Shipping Insurance — protects items in transit
 *   2. Travel Insurance — for users traveling to house swaps or meetups
 *   3. Property Insurance — for house swap participants
 *
 * Providers:
 *   - XCover (Cover Genius): API-based insurance marketplace
 *   - Parcel insurance: Integrated with courier providers
 *   - Mondial Assistance / Allianz Travel: Affiliate links
 *
 * Revenue model:
 *   - XCover: 10-20% commission on premiums
 *   - Affiliate travel insurance: 8-15% CPA
 *
 * Env vars:
 *   XCOVER_API_KEY
 *   XCOVER_PARTNER_ID
 *   XCOVER_API_URL (defaults to sandbox)
 *   ALLIANZ_AFFILIATE_ID
 */

// ── Types ──

export type InsuranceType = "shipping" | "travel" | "property";
export type InsuranceStatus = "quoted" | "active" | "claimed" | "expired" | "cancelled";

export interface InsuranceQuoteRequest {
  type: InsuranceType;
  // Shipping insurance
  itemValue?: number;        // EUR
  shippingProvider?: string;
  trackingNumber?: string;
  originCountry?: string;
  destCountry?: string;
  // Travel insurance
  travelStartDate?: string;  // YYYY-MM-DD
  travelEndDate?: string;
  travelers?: number;
  destinationCountry?: string;
  // Property insurance
  propertyValue?: number;
  stayDays?: number;
  // Common
  currency?: string;         // defaults to EUR
  userId: string;
  swapId?: string;
}

export interface InsuranceQuote {
  id: string;
  type: InsuranceType;
  provider: string;
  premium: number;           // EUR (what user pays)
  swaplyCommission: number;  // EUR (our cut)
  coverage: number;          // EUR (max payout)
  deductible: number;        // EUR
  coverageDetails: string[];
  validUntil: string;
  purchaseUrl?: string;
}

export interface InsurancePolicy {
  id: string;
  quoteId: string;
  type: InsuranceType;
  status: InsuranceStatus;
  provider: string;
  premium: number;
  coverage: number;
  policyNumber: string;
  startDate: string;
  endDate: string;
  claimUrl?: string;
  certificateUrl?: string;
}

export interface InsuranceClaim {
  policyId: string;
  reason: string;
  description: string;
  evidencePhotos?: string[];
  estimatedLoss: number;
  currency: string;
}

export interface InsuranceClaimResult {
  success: boolean;
  claimId?: string;
  status: "submitted" | "under_review" | "approved" | "denied";
  message: string;
  error?: string;
}

// ── Config ──

const XCOVER_BASE_URL = process.env.XCOVER_API_URL ?? "https://api.xcover.com/api/v2";
const COMMISSION_PERCENT = 15; // Swaply's cut from insurance premiums

export function isInsuranceConfigured(): boolean {
  return !!(process.env.XCOVER_API_KEY && process.env.XCOVER_PARTNER_ID);
}

function getXCoverHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${process.env.XCOVER_API_KEY ?? ""}`,
    "X-Partner-ID": process.env.XCOVER_PARTNER_ID ?? "",
    "Content-Type": "application/json",
  };
}

// ── Shipping Insurance ──

function calculateShippingPremium(itemValue: number, isInternational: boolean): InsuranceQuote {
  // Premium: ~2-4% of item value, minimum €1.50
  const rate = isInternational ? 0.04 : 0.025;
  const premium = Math.max(1.50, Math.round(itemValue * rate * 100) / 100);
  const commission = Math.round(premium * COMMISSION_PERCENT) / 100;

  return {
    id: `sq_${Date.now()}`,
    type: "shipping",
    provider: "XCover",
    premium,
    swaplyCommission: commission,
    coverage: itemValue,
    deductible: 0,
    coverageDetails: [
      "Total loss in transit",
      "Damage during shipping",
      "Package theft",
      isInternational ? "Customs coverage" : "Domestic delivery coverage",
    ],
    validUntil: new Date(Date.now() + 24 * 3600000).toISOString(),
  };
}

// ── Travel Insurance ──

function calculateTravelPremium(days: number, travelers: number, isEurope: boolean): InsuranceQuote {
  // Premium: ~€2-5/day/person for Europe, ~€5-10/day for international
  const dailyRate = isEurope ? 3 : 7;
  const premium = Math.round(dailyRate * days * travelers * 100) / 100;
  const commission = Math.round(premium * COMMISSION_PERCENT) / 100;
  const coverage = isEurope ? 30000 : 50000;

  return {
    id: `tq_${Date.now()}`,
    type: "travel",
    provider: "XCover",
    premium,
    swaplyCommission: commission,
    coverage,
    deductible: 50,
    coverageDetails: [
      `Medical expenses up to €${coverage.toLocaleString()}`,
      "Trip cancellation",
      "Lost/delayed luggage",
      "24/7 assistance",
      "Repatriation",
      isEurope ? "European Health Card" : "Global coverage",
    ],
    validUntil: new Date(Date.now() + 48 * 3600000).toISOString(),
  };
}

// ── Property Insurance ──

function calculatePropertyPremium(propertyValue: number, stayDays: number): InsuranceQuote {
  // Premium: ~0.1-0.3% of property value per stay
  const rate = 0.002;
  const premium = Math.max(5, Math.round(propertyValue * rate * stayDays / 30 * 100) / 100);
  const commission = Math.round(premium * COMMISSION_PERCENT) / 100;

  return {
    id: `pq_${Date.now()}`,
    type: "property",
    provider: "XCover",
    premium,
    swaplyCommission: commission,
    coverage: Math.min(propertyValue, 50000),
    deductible: 100,
    coverageDetails: [
      "Property damage",
      "Theft from property",
      "Civil liability",
      "Excessive cleaning costs",
      "Lost keys/locks",
    ],
    validUntil: new Date(Date.now() + 72 * 3600000).toISOString(),
  };
}

// ── Public API ──

export async function getInsuranceQuote(req: InsuranceQuoteRequest): Promise<InsuranceQuote> {
  const europeanCountries = new Set([
    "RO", "DE", "FR", "ES", "IT", "NL", "BE", "AT", "CH", "PL",
    "CZ", "SK", "HU", "BG", "HR", "SI", "PT", "GR", "SE", "DK",
    "FI", "NO", "IE", "GB", "LT", "LV", "EE",
  ]);

  switch (req.type) {
    case "shipping": {
      const isInternational = !!(req.originCountry && req.destCountry && req.originCountry !== req.destCountry);
      return calculateShippingPremium(req.itemValue ?? 50, isInternational);
    }
    case "travel": {
      const startDate = req.travelStartDate ? new Date(req.travelStartDate) : new Date();
      const endDate = req.travelEndDate ? new Date(req.travelEndDate) : new Date(Date.now() + 7 * 86400000);
      const days = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / 86400000));
      const isEurope = europeanCountries.has(req.destinationCountry ?? "");
      return calculateTravelPremium(days, req.travelers ?? 1, isEurope);
    }
    case "property": {
      return calculatePropertyPremium(req.propertyValue ?? 100000, req.stayDays ?? 7);
    }
  }
}

export async function purchaseInsurance(quoteId: string, userId: string): Promise<InsurancePolicy | null> {
  if (!isInsuranceConfigured()) {
    // Mock policy for development
    return {
      id: `pol_${Date.now()}`,
      quoteId,
      type: "shipping",
      status: "active",
      provider: "XCover",
      premium: 0,
      coverage: 0,
      policyNumber: `SWAPLY-${Date.now().toString(36).toUpperCase()}`,
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 30 * 86400000).toISOString(),
    };
  }

  const res = await fetch(`${XCOVER_BASE_URL}/policies`, {
    method: "POST",
    headers: getXCoverHeaders(),
    body: JSON.stringify({
      quote_id: quoteId,
      customer_id: userId,
    }),
  });

  if (!res.ok) return null;

  const data = await res.json() as {
    id?: string;
    policy_number?: string;
    start_date?: string;
    end_date?: string;
    premium?: number;
    coverage_amount?: number;
    status?: string;
    certificate_url?: string;
    claim_url?: string;
  };

  return {
    id: data.id ?? "",
    quoteId,
    type: "shipping",
    status: "active",
    provider: "XCover",
    premium: data.premium ?? 0,
    coverage: data.coverage_amount ?? 0,
    policyNumber: data.policy_number ?? "",
    startDate: data.start_date ?? new Date().toISOString(),
    endDate: data.end_date ?? "",
    certificateUrl: data.certificate_url,
    claimUrl: data.claim_url,
  };
}

export async function fileClaim(claim: InsuranceClaim): Promise<InsuranceClaimResult> {
  if (!isInsuranceConfigured()) {
    return {
      success: true,
      claimId: `claim_${Date.now()}`,
      status: "submitted",
      message: "Claim has been submitted (mock)",
    };
  }

  const res = await fetch(`${XCOVER_BASE_URL}/claims`, {
    method: "POST",
    headers: getXCoverHeaders(),
    body: JSON.stringify({
      policy_id: claim.policyId,
      reason: claim.reason,
      description: claim.description,
      estimated_loss: claim.estimatedLoss,
      currency: claim.currency,
      evidence: claim.evidencePhotos,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    return { success: false, status: "submitted", message: "", error: `Claim error: ${body}` };
  }

  const data = await res.json() as { id?: string; status?: string };

  return {
    success: true,
    claimId: data.id,
    status: (data.status ?? "submitted") as InsuranceClaimResult["status"],
    message: "Claim has been submitted successfully",
  };
}

// ── Travel Insurance Affiliate Links ──

export function getTravelInsuranceLinks(
  destination: string,
  startDate: string,
  endDate: string,
  travelers: number,
): Array<{ provider: string; name: string; url: string; icon: string }> {
  const affiliateId = process.env.ALLIANZ_AFFILIATE_ID ?? "";
  const ref = affiliateId ? `&aff=${affiliateId}` : "";

  return [
    {
      provider: "allianz",
      name: "Allianz Travel",
      url: `https://www.allianz-travel.com/en_XX/travel-insurance.html?dest=${encodeURIComponent(destination)}&from=${startDate}&to=${endDate}&travelers=${travelers}${ref}`,
      icon: "🛡️",
    },
    {
      provider: "worldnomads",
      name: "World Nomads",
      url: `https://www.worldnomads.com/travel-insurance?dest=${encodeURIComponent(destination)}&from=${startDate}&to=${endDate}&travelers=${travelers}`,
      icon: "🏥",
    },
    {
      provider: "safetywing",
      name: "SafetyWing",
      url: `https://www.safetywing.com/travel-insurance`,
      icon: "🌍",
    },
  ];
}
