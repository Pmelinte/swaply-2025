import type { DomainListingType } from "@/lib/listings/domainListingPayload";

export type DomainListingMutationResult = {
  itemId: string;
  listingId: string;
  status: "active" | "paused" | "archived";
  revision: number;
  replayed: boolean;
};

function fingerprint(value: unknown): string {
  const input = JSON.stringify(value);
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function createKey(domain: DomainListingType, operation: string): string {
  const random =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  return `swaply:${domain}:${operation}:${random}`.slice(0, 120);
}

function clientTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

function mutationKey(options: {
  domain: DomainListingType;
  operation: string;
  storageKey: string;
  requestFingerprint: string;
}): string {
  try {
    const existing = localStorage.getItem(options.storageKey);
    if (existing) {
      const parsed = JSON.parse(existing) as { fingerprint?: unknown; key?: unknown };
      if (
        parsed.fingerprint === options.requestFingerprint &&
        typeof parsed.key === "string" &&
        parsed.key.length >= 8
      ) {
        return parsed.key;
      }
    }
  } catch {
    // A corrupt or unavailable entry is replaced below.
  }

  const key = createKey(options.domain, options.operation);
  try {
    localStorage.setItem(
      options.storageKey,
      JSON.stringify({ fingerprint: options.requestFingerprint, key }),
    );
  } catch {
    // The server still protects this browser attempt with the generated key.
  }
  return key;
}

function validResult(value: unknown): value is DomainListingMutationResult {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const result = value as Partial<DomainListingMutationResult>;
  return Boolean(
    typeof result.itemId === "string" &&
      typeof result.listingId === "string" &&
      ["active", "paused", "archived"].includes(result.status ?? "") &&
      typeof result.revision === "number" &&
      Number.isInteger(result.revision) &&
      result.revision >= 1 &&
      typeof result.replayed === "boolean",
  );
}

async function submitMutation(options: {
  domain: DomainListingType;
  operation: "edit" | "status";
  endpoint: string;
  storageKey: string;
  payload: Record<string, unknown>;
}): Promise<DomainListingMutationResult> {
  const requestFingerprint = fingerprint(options.payload);
  const key = mutationKey({
    domain: options.domain,
    operation: options.operation,
    storageKey: options.storageKey,
    requestFingerprint,
  });

  const response = await fetch(options.endpoint, {
    method: "PATCH",
    headers: {
      "content-type": "application/json",
      "idempotency-key": key,
    },
    body: JSON.stringify(options.payload),
  });

  const body = (await response.json().catch(() => null)) as
    | (Partial<DomainListingMutationResult> & { error?: string })
    | null;
  if (!response.ok) {
    throw new Error(body?.error ?? "The listing could not be updated. Please try again.");
  }
  if (!validResult(body)) {
    throw new Error("The listing service returned an invalid response.");
  }

  try {
    localStorage.removeItem(options.storageKey);
  } catch {
    // A stale local key is harmless because a changed request gets a new fingerprint.
  }

  return body;
}

export function updateDomainListing(options: {
  domain: DomainListingType;
  itemId: string;
  form: unknown;
  expectedRevision: number;
}): Promise<DomainListingMutationResult> {
  const timezone = clientTimeZone();
  return submitMutation({
    domain: options.domain,
    operation: "edit",
    endpoint: `/api/items/${options.domain === "property" ? "properties" : `${options.domain}s`}/${options.itemId}`,
    storageKey: `swaply_${options.domain}_${options.itemId}_edit_request`,
    payload: {
      form: options.form,
      timezone,
      expectedRevision: options.expectedRevision,
    },
  });
}

export function setDomainListingStatus(options: {
  domain: DomainListingType;
  itemId: string;
  status: "active" | "paused" | "archived";
  expectedRevision: number;
}): Promise<DomainListingMutationResult> {
  return submitMutation({
    domain: options.domain,
    operation: "status",
    endpoint: `/api/items/${options.domain === "property" ? "properties" : `${options.domain}s`}/${options.itemId}/status`,
    storageKey: `swaply_${options.domain}_${options.itemId}_${options.status}_request`,
    payload: {
      status: options.status,
      expectedRevision: options.expectedRevision,
    },
  });
}
