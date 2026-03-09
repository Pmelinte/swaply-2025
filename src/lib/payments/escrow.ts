/**
 * Escrow integration for Swaply.
 * Secure swap transactions with third-party escrow protection.
 *
 * API: Escrow.com REST API v2
 * Docs: https://www.escrow.com/api/docs
 *
 * Flow:
 *   1. Both parties agree to swap → escrow transaction created
 *   2. Both parties ship items → tracking verified
 *   3. Both parties confirm receipt → escrow releases
 *   4. If dispute → Swaply mediates or escalates to Escrow.com
 *
 * Revenue model: 3.5% of declared swap value (Swaply commission from escrow fee).
 *
 * Env vars:
 *   ESCROW_API_KEY
 *   ESCROW_API_EMAIL
 *   ESCROW_API_URL (defaults to sandbox)
 */

// ── Types ──

export type EscrowStatus =
  | "created"
  | "funded"
  | "items_shipped"
  | "items_received"
  | "inspection"
  | "complete"
  | "cancelled"
  | "disputed";

export interface EscrowParty {
  role: "buyer" | "seller" | "broker";
  email: string;
  name: string;
  phone?: string;
}

export interface EscrowCreateRequest {
  swapId: string;
  title: string;
  description: string;
  declaredValue: number;     // EUR
  currency?: string;         // defaults to EUR
  requester: EscrowParty;
  responder: EscrowParty;
  inspectionDays?: number;   // days for inspection, default 3
}

export interface EscrowTransaction {
  id: string;
  escrowId: string;          // Escrow.com transaction ID
  swapId: string;
  status: EscrowStatus;
  declaredValue: number;
  escrowFee: number;
  swaplyFee: number;
  totalFee: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
  statusUrl?: string;
}

export interface EscrowAction {
  action: "fund" | "ship" | "receive" | "accept" | "reject" | "cancel";
  transactionId: string;
  userId: string;
  trackingNumber?: string;
  notes?: string;
}

export interface EscrowActionResult {
  success: boolean;
  newStatus: EscrowStatus;
  message: string;
  error?: string;
}

// ── Config ──

const ESCROW_BASE_URL = process.env.ESCROW_API_URL ?? "https://api.escrow-sandbox.com/2017-09-01";
const SWAPLY_FEE_PERCENT = 3.5;

export function isEscrowConfigured(): boolean {
  return !!(process.env.ESCROW_API_KEY && process.env.ESCROW_API_EMAIL);
}

function getEscrowAuth(): string {
  const email = process.env.ESCROW_API_EMAIL ?? "";
  const key = process.env.ESCROW_API_KEY ?? "";
  return `Basic ${Buffer.from(`${email}:${key}`).toString("base64")}`;
}

// ── Create Transaction ──

export async function createEscrowTransaction(req: EscrowCreateRequest): Promise<EscrowTransaction> {
  const currency = req.currency ?? "EUR";
  const escrowFee = Math.round(req.declaredValue * 0.032 * 100) / 100; // ~3.2% Escrow.com fee
  const swaplyFee = Math.round(req.declaredValue * SWAPLY_FEE_PERCENT) / 100;
  const totalFee = Math.round((escrowFee + swaplyFee) * 100) / 100;

  if (!isEscrowConfigured()) {
    // Return mock transaction for development
    return {
      id: `esc_${req.swapId.slice(0, 8)}`,
      escrowId: `mock_${Date.now()}`,
      swapId: req.swapId,
      status: "created",
      declaredValue: req.declaredValue,
      escrowFee,
      swaplyFee,
      totalFee,
      currency,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  const res = await fetch(`${ESCROW_BASE_URL}/transaction`, {
    method: "POST",
    headers: {
      Authorization: getEscrowAuth(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      parties: [
        { role: "buyer", customer: req.requester.email },
        { role: "seller", customer: req.responder.email },
        { role: "broker", customer: process.env.ESCROW_API_EMAIL },
      ],
      currency,
      description: req.description,
      items: [
        {
          title: req.title,
          description: req.description,
          type: "general_merchandise",
          inspection_period: (req.inspectionDays ?? 3) * 86400, // seconds
          quantity: 1,
          schedule: [
            { amount: req.declaredValue, payer_customer: req.requester.email, beneficiary_customer: req.responder.email },
          ],
          fees: [
            { amount: swaplyFee, type: "broker_fee", payer_customer: req.requester.email, beneficiary_customer: process.env.ESCROW_API_EMAIL },
          ],
        },
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    return {
      id: "",
      escrowId: "",
      swapId: req.swapId,
      status: "cancelled",
      declaredValue: req.declaredValue,
      escrowFee,
      swaplyFee,
      totalFee,
      currency,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      statusUrl: undefined,
    };
  }

  const data = await res.json() as { id?: number; status?: { name?: string } };

  return {
    id: `esc_${req.swapId.slice(0, 8)}`,
    escrowId: String(data.id ?? ""),
    swapId: req.swapId,
    status: "created",
    declaredValue: req.declaredValue,
    escrowFee,
    swaplyFee,
    totalFee,
    currency,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    statusUrl: data.id ? `https://www.escrow.com/transactions/${data.id}` : undefined,
  };
}

// ── Transaction Actions ──

export async function performEscrowAction(action: EscrowAction): Promise<EscrowActionResult> {
  if (!isEscrowConfigured()) {
    const statusFlow: Record<EscrowAction["action"], EscrowStatus> = {
      fund: "funded",
      ship: "items_shipped",
      receive: "items_received",
      accept: "complete",
      reject: "disputed",
      cancel: "cancelled",
    };
    return {
      success: true,
      newStatus: statusFlow[action.action],
      message: `Acțiune ${action.action} executată cu succes (mock)`,
    };
  }

  const actionMap: Record<EscrowAction["action"], string> = {
    fund: "fund",
    ship: "ship",
    receive: "receive",
    accept: "accept",
    reject: "reject",
    cancel: "cancel",
  };

  const body: Record<string, unknown> = {
    action: actionMap[action.action],
  };

  if (action.trackingNumber) {
    body.tracking_number = action.trackingNumber;
  }
  if (action.notes) {
    body.note = action.notes;
  }

  const res = await fetch(`${ESCROW_BASE_URL}/transaction/${action.transactionId}`, {
    method: "PATCH",
    headers: {
      Authorization: getEscrowAuth(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errBody = await res.text();
    return { success: false, newStatus: "created", message: "", error: `Escrow error: ${errBody}` };
  }

  const data = await res.json() as { status?: { name?: string } };
  const statusMap: Record<string, EscrowStatus> = {
    "in progress": "funded",
    shipped: "items_shipped",
    received: "items_received",
    "in inspection": "inspection",
    complete: "complete",
    cancelled: "cancelled",
    "in dispute": "disputed",
  };

  const newStatus = statusMap[data.status?.name ?? ""] ?? "created";

  return {
    success: true,
    newStatus,
    message: `Tranzacție actualizată: ${newStatus}`,
  };
}

// ── Get Transaction Status ──

export async function getEscrowStatus(escrowId: string): Promise<EscrowTransaction | null> {
  if (!isEscrowConfigured()) return null;

  const res = await fetch(`${ESCROW_BASE_URL}/transaction/${escrowId}`, {
    headers: { Authorization: getEscrowAuth() },
  });

  if (!res.ok) return null;

  const data = await res.json() as {
    id?: number;
    status?: { name?: string };
    currency?: string;
    items?: Array<{ schedule?: Array<{ amount?: number }> }>;
  };

  const declaredValue = data.items?.[0]?.schedule?.[0]?.amount ?? 0;

  return {
    id: `esc_${escrowId}`,
    escrowId: String(data.id ?? escrowId),
    swapId: "",
    status: (data.status?.name ?? "created") as EscrowStatus,
    declaredValue,
    escrowFee: Math.round(declaredValue * 0.032 * 100) / 100,
    swaplyFee: Math.round(declaredValue * SWAPLY_FEE_PERCENT) / 100,
    totalFee: Math.round(declaredValue * (0.032 + SWAPLY_FEE_PERCENT / 100) * 100) / 100,
    currency: data.currency ?? "EUR",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    statusUrl: `https://www.escrow.com/transactions/${escrowId}`,
  };
}
