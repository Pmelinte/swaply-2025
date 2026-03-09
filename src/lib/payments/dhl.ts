/**
 * DHL Express integration for Swaply.
 * International shipping for cross-border swaps.
 *
 * API: DHL Express API (MyDHL API)
 * Docs: https://developer.dhl.com/api-reference/dhl-express-mydhl-api
 *
 * Revenue model: 8% markup on shipping cost (same as local couriers).
 *
 * Env vars:
 *   DHL_API_KEY
 *   DHL_API_SECRET
 *   DHL_ACCOUNT_NUMBER
 *   DHL_API_URL (defaults to sandbox)
 */

// ── Types ──

export interface DHLAddress {
  name: string;
  phone: string;
  email?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  postalCode: string;
  countryCode: string; // ISO 3166-1 alpha-2
}

export interface DHLShipmentRequest {
  sender: DHLAddress;
  receiver: DHLAddress;
  weight: number;       // kg
  width?: number;       // cm
  height?: number;      // cm
  length?: number;      // cm
  declaredValue?: number;
  currency?: string;    // ISO 4217, defaults to EUR
  contents: string;
  swapId: string;
  isDocument?: boolean;
}

export interface DHLRateEstimate {
  productName: string;     // e.g. "EXPRESS WORLDWIDE"
  productCode: string;
  baseCost: number;        // EUR
  swaplyFee: number;       // EUR (our markup)
  totalCost: number;       // EUR
  estimatedDays: number;
  currency: string;
}

export interface DHLShipmentResult {
  success: boolean;
  trackingNumber?: string;
  labelUrl?: string;
  estimatedCost: number;
  swaplyFee: number;
  totalCost: number;
  estimatedDelivery?: string;
  trackingUrl?: string;
  error?: string;
}

export interface DHLTrackingEvent {
  date: string;
  status: string;
  location: string;
  description: string;
}

export interface DHLTrackingResult {
  trackingNumber: string;
  status: "picked_up" | "in_transit" | "customs" | "out_for_delivery" | "delivered" | "exception" | "unknown";
  events: DHLTrackingEvent[];
  estimatedDelivery?: string;
  origin?: string;
  destination?: string;
  error?: string;
}

// ── Config ──

const MARKUP_PERCENT = parseInt(process.env.COURIER_MARKUP_PERCENT ?? "8", 10);

const DHL_BASE_URL = process.env.DHL_API_URL ?? "https://express.api.dhl.com/mydhlapi/test";

function computeMarkup(baseCost: number): { fee: number; total: number } {
  const fee = Math.round(baseCost * MARKUP_PERCENT) / 100;
  return { fee, total: baseCost + fee };
}

export function isDHLConfigured(): boolean {
  return !!(process.env.DHL_API_KEY && process.env.DHL_API_SECRET);
}

function getAuthHeader(): string {
  const key = process.env.DHL_API_KEY ?? "";
  const secret = process.env.DHL_API_SECRET ?? "";
  return `Basic ${Buffer.from(`${key}:${secret}`).toString("base64")}`;
}

// ── Rate Quotes ──

export async function getDHLRates(req: DHLShipmentRequest): Promise<DHLRateEstimate[]> {
  if (!isDHLConfigured()) {
    // Return mock estimates when not configured
    return [
      { productName: "EXPRESS WORLDWIDE", productCode: "P", baseCost: 35, swaplyFee: 2.80, totalCost: 37.80, estimatedDays: 3, currency: "EUR" },
      { productName: "EXPRESS 12:00", productCode: "Y", baseCost: 55, swaplyFee: 4.40, totalCost: 59.40, estimatedDays: 2, currency: "EUR" },
      { productName: "ECONOMY SELECT", productCode: "H", baseCost: 22, swaplyFee: 1.76, totalCost: 23.76, estimatedDays: 5, currency: "EUR" },
    ];
  }

  const params = new URLSearchParams({
    accountNumber: process.env.DHL_ACCOUNT_NUMBER ?? "",
    originCountryCode: req.sender.countryCode,
    originCityName: req.sender.city,
    destinationCountryCode: req.receiver.countryCode,
    destinationCityName: req.receiver.city,
    weight: String(req.weight),
    length: String(req.length ?? 30),
    width: String(req.width ?? 20),
    height: String(req.height ?? 15),
    plannedShippingDate: new Date().toISOString().split("T")[0],
    isCustomsDeclarable: req.sender.countryCode !== req.receiver.countryCode ? "true" : "false",
    unitOfMeasurement: "metric",
  });

  const res = await fetch(`${DHL_BASE_URL}/rates?${params}`, {
    headers: {
      Authorization: getAuthHeader(),
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) return [];

  const data = await res.json() as {
    products?: Array<{
      productName?: string;
      productCode?: string;
      totalPrice?: Array<{ price?: number; currencyType?: string }>;
      deliveryCapabilities?: { estimatedDeliveryDateAndTime?: string };
    }>;
  };

  return (data.products ?? []).map((product) => {
    const price = product.totalPrice?.find((p) => p.currencyType === "BILLC");
    const baseCost = price?.price ?? 30;
    const { fee, total } = computeMarkup(baseCost);

    // Calculate estimated days from delivery date
    const deliveryDate = product.deliveryCapabilities?.estimatedDeliveryDateAndTime;
    const estimatedDays = deliveryDate
      ? Math.max(1, Math.ceil((new Date(deliveryDate).getTime() - Date.now()) / 86400000))
      : 3;

    return {
      productName: product.productName ?? "DHL Express",
      productCode: product.productCode ?? "P",
      baseCost,
      swaplyFee: fee,
      totalCost: total,
      estimatedDays,
      currency: "EUR",
    };
  });
}

// ── Create Shipment ──

export async function createDHLShipment(req: DHLShipmentRequest): Promise<DHLShipmentResult> {
  if (!isDHLConfigured()) {
    return { success: false, estimatedCost: 0, swaplyFee: 0, totalCost: 0, error: "DHL nu este configurat" };
  }

  const isInternational = req.sender.countryCode !== req.receiver.countryCode;

  const shipmentBody = {
    plannedShippingDateAndTime: new Date().toISOString(),
    pickup: { isRequested: false },
    productCode: "P", // Express Worldwide
    accounts: [{ typeCode: "shipper", number: process.env.DHL_ACCOUNT_NUMBER }],
    customerDetails: {
      shipperDetails: {
        postalAddress: {
          postalCode: req.sender.postalCode,
          cityName: req.sender.city,
          countryCode: req.sender.countryCode,
          addressLine1: req.sender.addressLine1,
          addressLine2: req.sender.addressLine2,
        },
        contactInformation: {
          email: req.sender.email ?? "",
          phone: req.sender.phone,
          companyName: "Swaply User",
          fullName: req.sender.name,
        },
      },
      receiverDetails: {
        postalAddress: {
          postalCode: req.receiver.postalCode,
          cityName: req.receiver.city,
          countryCode: req.receiver.countryCode,
          addressLine1: req.receiver.addressLine1,
          addressLine2: req.receiver.addressLine2,
        },
        contactInformation: {
          email: req.receiver.email ?? "",
          phone: req.receiver.phone,
          companyName: "Swaply User",
          fullName: req.receiver.name,
        },
      },
    },
    content: {
      packages: [{
        weight: req.weight,
        dimensions: {
          length: req.length ?? 30,
          width: req.width ?? 20,
          height: req.height ?? 15,
        },
      }],
      isCustomsDeclarable: isInternational,
      declaredValue: req.declaredValue ?? 0,
      declaredValueCurrency: req.currency ?? "EUR",
      description: req.contents,
      incoterm: "DAP",
      unitOfMeasurement: "metric",
    },
    shipmentNotification: [
      { typeCode: "email", receiverId: req.receiver.email ?? "" },
    ],
    getRateEstimates: true,
    requestOndemandDeliveryURL: false,
    outputImageProperties: {
      encodingFormat: "pdf",
      imageOptions: [{ typeCode: "label", templateName: "ECOM26_84_001" }],
    },
  };

  const res = await fetch(`${DHL_BASE_URL}/shipments`, {
    method: "POST",
    headers: {
      Authorization: getAuthHeader(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(shipmentBody),
  });

  if (!res.ok) {
    const body = await res.text();
    return { success: false, estimatedCost: 0, swaplyFee: 0, totalCost: 0, error: `DHL: ${body}` };
  }

  const data = await res.json() as {
    shipmentTrackingNumber?: string;
    documents?: Array<{ content?: string; typeCode?: string }>;
    estimatedDeliveryDate?: { estimatedDeliveryDate?: string };
    shipmentCharges?: Array<{ currencyType?: string; price?: number }>;
  };

  const charge = data.shipmentCharges?.find((c) => c.currencyType === "BILLC");
  const baseCost = charge?.price ?? 35;
  const { fee, total } = computeMarkup(baseCost);

  const labelDoc = data.documents?.find((d) => d.typeCode === "label");

  return {
    success: true,
    trackingNumber: data.shipmentTrackingNumber,
    labelUrl: labelDoc?.content ? `data:application/pdf;base64,${labelDoc.content}` : undefined,
    estimatedCost: baseCost,
    swaplyFee: fee,
    totalCost: total,
    estimatedDelivery: data.estimatedDeliveryDate?.estimatedDeliveryDate,
    trackingUrl: data.shipmentTrackingNumber
      ? `https://www.dhl.com/ro-ro/home/tracking.html?tracking-id=${data.shipmentTrackingNumber}`
      : undefined,
  };
}

// ── Tracking ──

export async function trackDHLShipment(trackingNumber: string): Promise<DHLTrackingResult> {
  if (!isDHLConfigured()) {
    return {
      trackingNumber,
      status: "in_transit",
      events: [
        { date: new Date().toISOString(), status: "In Transit", location: "Hub central", description: "Coletul este în tranzit" },
      ],
    };
  }

  const res = await fetch(`${DHL_BASE_URL}/tracking?shipmentTrackingNumber=${trackingNumber}`, {
    headers: { Authorization: getAuthHeader() },
  });

  if (!res.ok) {
    return { trackingNumber, status: "unknown", events: [], error: "Nu s-a putut verifica statusul" };
  }

  const data = await res.json() as {
    shipments?: Array<{
      status?: { statusCode?: string; status?: string; location?: { address?: { addressLocality?: string } } };
      events?: Array<{
        date?: string;
        description?: string;
        location?: { address?: { addressLocality?: string } };
      }>;
      estimatedDeliveryDate?: string;
      origin?: { address?: { addressLocality?: string } };
      destination?: { address?: { addressLocality?: string } };
    }>;
  };

  const shipment = data.shipments?.[0];
  if (!shipment) return { trackingNumber, status: "unknown", events: [] };

  const statusMap: Record<string, DHLTrackingResult["status"]> = {
    "pre-transit": "picked_up",
    transit: "in_transit",
    customs: "customs",
    delivered: "delivered",
    failure: "exception",
  };

  const events: DHLTrackingEvent[] = (shipment.events ?? []).map((e) => ({
    date: e.date ?? "",
    status: e.description ?? "",
    location: e.location?.address?.addressLocality ?? "",
    description: e.description ?? "",
  }));

  return {
    trackingNumber,
    status: statusMap[shipment.status?.statusCode ?? ""] ?? "in_transit",
    events,
    estimatedDelivery: shipment.estimatedDeliveryDate,
    origin: shipment.origin?.address?.addressLocality,
    destination: shipment.destination?.address?.addressLocality,
  };
}
