import type { ServicePaymentStatus } from './service-payment-contract';

export type PaymentWebhookProvider = 'stripe' | 'paypal' | 'sandbox';

export type WebhookProcessingStatus =
  | 'received'
  | 'processing'
  | 'processed'
  | 'ignored'
  | 'retry-pending'
  | 'dead-letter';

export type CanonicalPaymentEventType =
  | 'payment-pending'
  | 'payment-succeeded'
  | 'payment-failed'
  | 'refund-pending'
  | 'refund-succeeded'
  | 'refund-failed';

export interface VerifiedWebhookEnvelope {
  provider: PaymentWebhookProvider;
  providerEventId: string;
  providerObjectId: string;
  eventType: CanonicalPaymentEventType;
  createdAt: string;
  receivedAt: string;
  payloadDigest: string;
  signatureVerified: true;
}

export interface WebhookLedgerEntry extends VerifiedWebhookEnvelope {
  orderId: string;
  processingStatus: WebhookProcessingStatus;
  attemptCount: number;
  nextAttemptAt?: string;
  processedAt?: string;
  lastErrorCode?: string;
}

export interface ReconciliationSnapshot {
  orderId: string;
  provider: PaymentWebhookProvider;
  providerObjectId: string;
  localStatus: ServicePaymentStatus;
  providerStatus: ServicePaymentStatus;
  checkedAt: string;
}

const EVENT_PRIORITY: Readonly<Record<CanonicalPaymentEventType, number>> = {
  'payment-pending': 10,
  'payment-failed': 20,
  'payment-succeeded': 30,
  'refund-pending': 40,
  'refund-failed': 45,
  'refund-succeeded': 50,
};

const EVENT_TO_STATUS: Readonly<Record<CanonicalPaymentEventType, ServicePaymentStatus>> = {
  'payment-pending': 'payment-pending',
  'payment-succeeded': 'paid',
  'payment-failed': 'payment-failed',
  'refund-pending': 'refund-pending',
  'refund-succeeded': 'refunded',
  'refund-failed': 'paid',
};

export function validateProviderEventId(value: string): string {
  const eventId = value.trim();
  if (eventId.length < 8 || eventId.length > 255 || !/^[A-Za-z0-9_:\-.]+$/.test(eventId)) {
    throw new Error('invalid-provider-event-id');
  }
  return eventId;
}

export function validatePayloadDigest(value: string): string {
  const digest = value.trim().toLowerCase();
  if (!/^[a-f0-9]{64}$/.test(digest)) throw new Error('invalid-payload-digest');
  return digest;
}

export function webhookDeduplicationKey(input: {
  provider: PaymentWebhookProvider;
  providerEventId: string;
}): string {
  return `${input.provider}:${validateProviderEventId(input.providerEventId)}`;
}

export function assertVerifiedWebhook(
  envelope: Omit<VerifiedWebhookEnvelope, 'signatureVerified'> & { signatureVerified: boolean },
): VerifiedWebhookEnvelope {
  if (!envelope.signatureVerified) throw new Error('webhook-signature-not-verified');
  return {
    ...envelope,
    providerEventId: validateProviderEventId(envelope.providerEventId),
    payloadDigest: validatePayloadDigest(envelope.payloadDigest),
    signatureVerified: true,
  };
}

export function canonicalStatusForWebhook(eventType: CanonicalPaymentEventType): ServicePaymentStatus {
  return EVENT_TO_STATUS[eventType];
}

export function shouldApplyWebhookEvent(input: {
  currentEventType?: CanonicalPaymentEventType;
  incomingEventType: CanonicalPaymentEventType;
}): boolean {
  if (!input.currentEventType) return true;
  return EVENT_PRIORITY[input.incomingEventType] >= EVENT_PRIORITY[input.currentEventType];
}

export function createWebhookLedgerEntry(input: {
  envelope: VerifiedWebhookEnvelope;
  orderId: string;
}): WebhookLedgerEntry {
  return {
    ...input.envelope,
    orderId: input.orderId,
    processingStatus: 'received',
    attemptCount: 0,
  };
}

export function markWebhookAttempt(
  entry: WebhookLedgerEntry,
  input: {
    succeeded: boolean;
    processedAt: string;
    retryAt?: string;
    errorCode?: string;
    maximumAttempts?: number;
  },
): WebhookLedgerEntry {
  if (entry.processingStatus === 'processed' || entry.processingStatus === 'ignored') {
    return entry;
  }

  const attemptCount = entry.attemptCount + 1;
  const maximumAttempts = input.maximumAttempts ?? 5;

  if (input.succeeded) {
    return {
      ...entry,
      processingStatus: 'processed',
      attemptCount,
      processedAt: input.processedAt,
      nextAttemptAt: undefined,
      lastErrorCode: undefined,
    };
  }

  if (attemptCount >= maximumAttempts) {
    return {
      ...entry,
      processingStatus: 'dead-letter',
      attemptCount,
      processedAt: input.processedAt,
      nextAttemptAt: undefined,
      lastErrorCode: input.errorCode ?? 'webhook-processing-failed',
    };
  }

  if (!input.retryAt) throw new Error('retry-at-required');
  return {
    ...entry,
    processingStatus: 'retry-pending',
    attemptCount,
    processedAt: input.processedAt,
    nextAttemptAt: input.retryAt,
    lastErrorCode: input.errorCode ?? 'webhook-processing-failed',
  };
}

export function reconcilePaymentStatus(snapshot: ReconciliationSnapshot): {
  consistent: boolean;
  authoritativeStatus: ServicePaymentStatus;
  action: 'none' | 'apply-provider-status' | 'manual-review';
} {
  if (snapshot.localStatus === snapshot.providerStatus) {
    return { consistent: true, authoritativeStatus: snapshot.localStatus, action: 'none' };
  }

  if (snapshot.localStatus === 'cancelled') {
    return {
      consistent: false,
      authoritativeStatus: snapshot.localStatus,
      action: 'manual-review',
    };
  }

  return {
    consistent: false,
    authoritativeStatus: snapshot.providerStatus,
    action: 'apply-provider-status',
  };
}
