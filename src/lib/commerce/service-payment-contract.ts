export type ServicePaymentCategory =
  | 'courier'
  | 'packaging'
  | 'insurance'
  | 'travel'
  | 'accommodation'
  | 'promotion'
  | 'affiliate-service';

export type ServicePaymentStatus =
  | 'draft'
  | 'checkout-pending'
  | 'payment-pending'
  | 'paid'
  | 'payment-failed'
  | 'cancelled'
  | 'refund-pending'
  | 'refunded';

export interface MoneyAmount {
  amountMinor: number;
  currency: string;
}

export interface ServiceCommissionPolicy {
  category: ServicePaymentCategory;
  rateBasisPoints: number;
  minimumCommissionMinor?: number;
  maximumCommissionMinor?: number;
}

export interface ServicePaymentOrder {
  id: string;
  userId: string;
  exchangeId?: string;
  providerId: string;
  providerReference?: string;
  category: ServicePaymentCategory;
  status: ServicePaymentStatus;
  subtotal: MoneyAmount;
  commission: MoneyAmount;
  total: MoneyAmount;
  idempotencyKey: string;
  createdAt: string;
  updatedAt: string;
}

export interface ServicePaymentDraftInput {
  id: string;
  userId: string;
  exchangeId?: string;
  providerId: string;
  category: ServicePaymentCategory;
  subtotal: MoneyAmount;
  idempotencyKey: string;
  createdAt: string;
}

export const DEFAULT_SERVICE_COMMISSION_POLICIES: readonly ServiceCommissionPolicy[] = [
  { category: 'courier', rateBasisPoints: 500 },
  { category: 'packaging', rateBasisPoints: 700 },
  { category: 'insurance', rateBasisPoints: 500 },
  { category: 'travel', rateBasisPoints: 400 },
  { category: 'accommodation', rateBasisPoints: 400 },
  { category: 'promotion', rateBasisPoints: 1000 },
  { category: 'affiliate-service', rateBasisPoints: 0 },
] as const;

const TERMINAL_STATUSES: readonly ServicePaymentStatus[] = ['cancelled', 'refunded'];

const ALLOWED_TRANSITIONS: Readonly<Record<ServicePaymentStatus, readonly ServicePaymentStatus[]>> = {
  draft: ['checkout-pending', 'cancelled'],
  'checkout-pending': ['payment-pending', 'payment-failed', 'cancelled'],
  'payment-pending': ['paid', 'payment-failed', 'cancelled'],
  paid: ['refund-pending'],
  'payment-failed': ['checkout-pending', 'cancelled'],
  cancelled: [],
  'refund-pending': ['refunded', 'paid'],
  refunded: [],
};

function assertIntegerMinorUnits(value: number, field: string): void {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error(`${field}-must-be-a-non-negative-safe-integer`);
  }
}

export function normaliseCurrency(currency: string): string {
  const normalised = currency.trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(normalised)) throw new Error('currency-must-be-iso-4217');
  return normalised;
}

export function validateIdempotencyKey(value: string): string {
  const key = value.trim();
  if (key.length < 16 || key.length > 128 || !/^[A-Za-z0-9:_-]+$/.test(key)) {
    throw new Error('invalid-idempotency-key');
  }
  return key;
}

export function calculateServiceCommission(
  subtotal: MoneyAmount,
  policy: ServiceCommissionPolicy,
): MoneyAmount {
  assertIntegerMinorUnits(subtotal.amountMinor, 'subtotal');
  const currency = normaliseCurrency(subtotal.currency);
  if (!Number.isInteger(policy.rateBasisPoints) || policy.rateBasisPoints < 0 || policy.rateBasisPoints > 10_000) {
    throw new Error('invalid-commission-rate');
  }

  let amountMinor = Math.round((subtotal.amountMinor * policy.rateBasisPoints) / 10_000);
  if (policy.minimumCommissionMinor !== undefined) {
    assertIntegerMinorUnits(policy.minimumCommissionMinor, 'minimum-commission');
    amountMinor = Math.max(amountMinor, policy.minimumCommissionMinor);
  }
  if (policy.maximumCommissionMinor !== undefined) {
    assertIntegerMinorUnits(policy.maximumCommissionMinor, 'maximum-commission');
    amountMinor = Math.min(amountMinor, policy.maximumCommissionMinor);
  }

  return { amountMinor, currency };
}

export function createServicePaymentDraft(
  input: ServicePaymentDraftInput,
  policies: readonly ServiceCommissionPolicy[] = DEFAULT_SERVICE_COMMISSION_POLICIES,
): ServicePaymentOrder {
  assertIntegerMinorUnits(input.subtotal.amountMinor, 'subtotal');
  const currency = normaliseCurrency(input.subtotal.currency);
  const policy = policies.find((candidate) => candidate.category === input.category);
  if (!policy) throw new Error(`missing-commission-policy:${input.category}`);

  const commission = calculateServiceCommission({ ...input.subtotal, currency }, policy);
  const totalAmountMinor = input.subtotal.amountMinor + commission.amountMinor;
  assertIntegerMinorUnits(totalAmountMinor, 'total');

  return {
    id: input.id,
    userId: input.userId,
    exchangeId: input.exchangeId,
    providerId: input.providerId,
    category: input.category,
    status: 'draft',
    subtotal: { amountMinor: input.subtotal.amountMinor, currency },
    commission,
    total: { amountMinor: totalAmountMinor, currency },
    idempotencyKey: validateIdempotencyKey(input.idempotencyKey),
    createdAt: input.createdAt,
    updatedAt: input.createdAt,
  };
}

export function canTransitionServicePayment(
  from: ServicePaymentStatus,
  to: ServicePaymentStatus,
): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

export function transitionServicePayment(
  order: ServicePaymentOrder,
  nextStatus: ServicePaymentStatus,
  updatedAt: string,
  providerReference?: string,
): ServicePaymentOrder {
  if (TERMINAL_STATUSES.includes(order.status)) throw new Error('payment-order-is-terminal');
  if (!canTransitionServicePayment(order.status, nextStatus)) {
    throw new Error(`invalid-payment-transition:${order.status}->${nextStatus}`);
  }

  return {
    ...order,
    status: nextStatus,
    providerReference: providerReference ?? order.providerReference,
    updatedAt,
  };
}

export function paymentOrderDeduplicationKey(input: {
  userId: string;
  providerId: string;
  idempotencyKey: string;
}): string {
  return `${input.userId}:${input.providerId}:${validateIdempotencyKey(input.idempotencyKey)}`;
}

export function isProviderPaymentAuthoritative(status: ServicePaymentStatus): boolean {
  return ['paid', 'payment-failed', 'refunded'].includes(status);
}
