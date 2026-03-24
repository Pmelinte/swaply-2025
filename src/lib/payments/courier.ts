/**
 * Courier integration for Swaply.
 * Direct API integrations for courier providers (currently FanCourier, Sameday, Cargus).
 * For other countries, services are listed via the services_by_country DB table
 * and the country-registry.ts configuration.
 *
 * Revenue model: 5-10% markup on shipping cost.
 *
 * Env vars:
 *   FANCOURIER_CLIENT_ID
 *   FANCOURIER_USERNAME
 *   FANCOURIER_PASSWORD
 *   SAMEDAY_API_KEY
 *   SAMEDAY_API_URL (sandbox or production)
 *   CARGUS_API_KEY
 *   COURIER_MARKUP_PERCENT (default: 8)
 */

// ── Types ──

export type CourierProvider = "fancourier" | "sameday" | "cargus";

export interface ShippingAddress {
  name: string;
  phone: string;
  email?: string;
  county: string;       // State/Province/County
  city: string;
  street: string;
  postalCode: string;
  notes?: string;
}

export interface AWBRequest {
  provider: CourierProvider;
  sender: ShippingAddress;
  receiver: ShippingAddress;
  weight: number;          // kg
  width?: number;          // cm
  height?: number;         // cm
  length?: number;         // cm
  declaredValue?: number;  // RON
  contents: string;        // description
  swapId: string;
  paymentBy: "sender" | "receiver";
}

export interface AWBResult {
  success: boolean;
  awbNumber?: string;
  estimatedCost: number;     // RON (courier cost)
  swaplyFee: number;         // RON (our markup)
  totalCost: number;         // RON (user pays)
  estimatedDelivery?: string;
  trackingUrl?: string;
  error?: string;
}

export interface TrackingEvent {
  date: string;
  status: string;
  location: string;
  details?: string;
}

export interface TrackingResult {
  awbNumber: string;
  provider: CourierProvider;
  status: "picked_up" | "in_transit" | "out_for_delivery" | "delivered" | "returned" | "unknown";
  events: TrackingEvent[];
  estimatedDelivery?: string;
  error?: string;
}

export interface CourierEstimate {
  provider: CourierProvider;
  providerName: string;
  baseCost: number;     // RON
  swaplyFee: number;    // RON
  totalCost: number;    // RON
  estimatedDays: number;
}

// ── Config ──

const MARKUP_PERCENT = parseInt(process.env.COURIER_MARKUP_PERCENT ?? "8", 10);

function computeMarkup(baseCost: number): { fee: number; total: number } {
  const fee = Math.round(baseCost * MARKUP_PERCENT) / 100;
  return { fee, total: baseCost + fee };
}

export function isCourierConfigured(provider: CourierProvider): boolean {
  switch (provider) {
    case "fancourier":
      return !!(process.env.FANCOURIER_CLIENT_ID && process.env.FANCOURIER_USERNAME);
    case "sameday":
      return !!process.env.SAMEDAY_API_KEY;
    case "cargus":
      return !!process.env.CARGUS_API_KEY;
    default:
      return false;
  }
}

export function getAvailableCouriers(): CourierProvider[] {
  return (["fancourier", "sameday", "cargus"] as CourierProvider[]).filter(isCourierConfigured);
}

// ── FanCourier ──

async function fanCourierAuth(): Promise<string | null> {
  const clientId = process.env.FANCOURIER_CLIENT_ID;
  const username = process.env.FANCOURIER_USERNAME;
  const password = process.env.FANCOURIER_PASSWORD;
  if (!clientId || !username || !password) return null;

  const res = await fetch("https://api.fancourier.ro/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ client_id: clientId, username, password }),
  });

  if (!res.ok) return null;
  const data = await res.json() as { token?: string };
  return data.token ?? null;
}

async function fanCourierCreateAWB(req: AWBRequest): Promise<AWBResult> {
  const token = await fanCourierAuth();
  if (!token) return { success: false, estimatedCost: 0, swaplyFee: 0, totalCost: 0, error: "FanCourier authentication failed" };

  const res = await fetch("https://api.fancourier.ro/intern-awb", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      service: "Standard",
      sender: {
        name: req.sender.name,
        phone: req.sender.phone,
        email: req.sender.email,
        county: req.sender.county,
        locality: req.sender.city,
        street: req.sender.street,
        zipCode: req.sender.postalCode,
      },
      recipient: {
        name: req.receiver.name,
        phone: req.receiver.phone,
        email: req.receiver.email,
        county: req.receiver.county,
        locality: req.receiver.city,
        street: req.receiver.street,
        zipCode: req.receiver.postalCode,
      },
      packages: [{
        weight: req.weight,
        width: req.width ?? 20,
        height: req.height ?? 15,
        length: req.length ?? 30,
      }],
      content: req.contents,
      declaredValue: req.declaredValue ?? 0,
      payment: req.paymentBy === "sender" ? "sender" : "recipient",
      observation: `Swaply Swap #${req.swapId.slice(0, 8)}`,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    return { success: false, estimatedCost: 0, swaplyFee: 0, totalCost: 0, error: `FanCourier: ${body}` };
  }

  const data = await res.json() as { awb?: string; rate?: number; estimatedDelivery?: string };
  const baseCost = data.rate ?? 15;
  const { fee, total } = computeMarkup(baseCost);

  return {
    success: true,
    awbNumber: data.awb,
    estimatedCost: baseCost,
    swaplyFee: fee,
    totalCost: total,
    estimatedDelivery: data.estimatedDelivery,
    trackingUrl: data.awb ? `https://www.fancourier.ro/awb-tracking/?awb=${data.awb}` : undefined,
  };
}

// ── Sameday ──

async function samedayCreateAWB(req: AWBRequest): Promise<AWBResult> {
  const apiKey = process.env.SAMEDAY_API_KEY;
  const apiUrl = process.env.SAMEDAY_API_URL ?? "https://api.sameday.ro";
  if (!apiKey) return { success: false, estimatedCost: 0, swaplyFee: 0, totalCost: 0, error: "Sameday not configured" };

  // Authenticate
  const authRes = await fetch(`${apiUrl}/api/authenticate`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `username=${apiKey}`,
  });

  if (!authRes.ok) return { success: false, estimatedCost: 0, swaplyFee: 0, totalCost: 0, error: "Sameday authentication failed" };
  const authData = await authRes.json() as { token?: string };
  if (!authData.token) return { success: false, estimatedCost: 0, swaplyFee: 0, totalCost: 0, error: "Sameday token missing" };

  const res = await fetch(`${apiUrl}/api/awb`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${authData.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      pickupPoint: null,
      contactPerson: null,
      packageType: 0, // parcel
      packageWeight: req.weight,
      service: 7, // standard
      awbPayment: req.paymentBy === "sender" ? 1 : 2,
      insuredValue: req.declaredValue ?? 0,
      thirdPartyPickup: 0,
      parcels: [{ weight: req.weight, width: req.width ?? 20, height: req.height ?? 15, length: req.length ?? 30 }],
      observation: `Swaply #${req.swapId.slice(0, 8)}`,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    return { success: false, estimatedCost: 0, swaplyFee: 0, totalCost: 0, error: `Sameday: ${body}` };
  }

  const data = await res.json() as { awbNumber?: string; cost?: number };
  const baseCost = data.cost ?? 18;
  const { fee, total } = computeMarkup(baseCost);

  return {
    success: true,
    awbNumber: data.awbNumber,
    estimatedCost: baseCost,
    swaplyFee: fee,
    totalCost: total,
    trackingUrl: data.awbNumber ? `https://sameday.ro/tracking/awb/${data.awbNumber}` : undefined,
  };
}

// ── Cargus ──

async function cargusCreateAWB(req: AWBRequest): Promise<AWBResult> {
  const apiKey = process.env.CARGUS_API_KEY;
  if (!apiKey) return { success: false, estimatedCost: 0, swaplyFee: 0, totalCost: 0, error: "Cargus not configured" };

  const res = await fetch("https://urgentcargus.azure-api.net/api/Awbs/WithGetAwb", {
    method: "POST",
    headers: {
      "Ocp-Apim-Subscription-Key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      Sender: {
        Name: req.sender.name,
        PhoneNumber: req.sender.phone,
        CountyName: req.sender.county,
        LocalityName: req.sender.city,
        StreetName: req.sender.street,
        PostalCode: req.sender.postalCode,
      },
      Recipient: {
        Name: req.receiver.name,
        PhoneNumber: req.receiver.phone,
        CountyName: req.receiver.county,
        LocalityName: req.receiver.city,
        StreetName: req.receiver.street,
        PostalCode: req.receiver.postalCode,
      },
      Parcels: 1,
      Weight: req.weight,
      DeclaredValue: req.declaredValue ?? 0,
      CashRepayment: 0,
      ShipmentPayer: req.paymentBy === "sender" ? 1 : 2,
      Observations: `Swaply Swap #${req.swapId.slice(0, 8)} — ${req.contents}`,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    return { success: false, estimatedCost: 0, swaplyFee: 0, totalCost: 0, error: `Cargus: ${body}` };
  }

  const data = await res.json() as { BarCode?: string; ShipmentPrice?: number };
  const baseCost = data.ShipmentPrice ?? 16;
  const { fee, total } = computeMarkup(baseCost);

  return {
    success: true,
    awbNumber: data.BarCode,
    estimatedCost: baseCost,
    swaplyFee: fee,
    totalCost: total,
    trackingUrl: data.BarCode ? `https://www.cargus.ro/tracking/?t=${data.BarCode}` : undefined,
  };
}

// ── Unified API ──

export async function createAWB(req: AWBRequest): Promise<AWBResult> {
  switch (req.provider) {
    case "fancourier": return fanCourierCreateAWB(req);
    case "sameday":    return samedayCreateAWB(req);
    case "cargus":     return cargusCreateAWB(req);
    default:
      return { success: false, estimatedCost: 0, swaplyFee: 0, totalCost: 0, error: `Unknown courier: ${req.provider}` };
  }
}

/** Get shipping estimates from all configured couriers. */
export async function getEstimates(
  senderCounty: string,
  receiverCounty: string,
  weight: number,
): Promise<CourierEstimate[]> {
  const available = getAvailableCouriers();
  if (available.length === 0) {
    // Return mock estimates when no courier is configured
    return [
      { provider: "fancourier", providerName: "FanCourier", baseCost: 15, swaplyFee: 1.2, totalCost: 16.2, estimatedDays: 2 },
      { provider: "sameday", providerName: "Sameday", baseCost: 18, swaplyFee: 1.44, totalCost: 19.44, estimatedDays: 1 },
      { provider: "cargus", providerName: "Cargus", baseCost: 14, swaplyFee: 1.12, totalCost: 15.12, estimatedDays: 3 },
    ];
  }

  const PROVIDER_NAMES: Record<CourierProvider, string> = {
    fancourier: "FanCourier",
    sameday: "Sameday",
    cargus: "Cargus",
  };

  const ESTIMATED_DAYS: Record<CourierProvider, number> = {
    fancourier: 2,
    sameday: 1,
    cargus: 3,
  };

  // Weight-based base estimates (simplified — real API would do locality lookup)
  return available.map((provider) => {
    const baseCost = weight <= 1 ? 12 : weight <= 5 ? 16 : weight <= 10 ? 22 : 30;
    const adjustment = provider === "sameday" ? 3 : provider === "cargus" ? -1 : 0;
    const cost = baseCost + adjustment;
    const { fee, total } = computeMarkup(cost);
    return {
      provider,
      providerName: PROVIDER_NAMES[provider],
      baseCost: cost,
      swaplyFee: fee,
      totalCost: total,
      estimatedDays: ESTIMATED_DAYS[provider] + (senderCounty === receiverCounty ? 0 : 1),
    };
  });
}

/** Track an AWB across providers. */
export async function trackAWB(awbNumber: string, provider: CourierProvider): Promise<TrackingResult> {
  // In production, each provider has a tracking API.
  // For now, return a structured mock that demonstrates the interface.
  return {
    awbNumber,
    provider,
    status: "in_transit",
    events: [
      { date: new Date().toISOString(), status: "Picked up by courier", location: "Central depot" },
      { date: new Date(Date.now() - 3600000).toISOString(), status: "AWB created", location: "Online" },
    ],
    estimatedDelivery: new Date(Date.now() + 86400000 * 2).toISOString().split("T")[0],
  };
}
