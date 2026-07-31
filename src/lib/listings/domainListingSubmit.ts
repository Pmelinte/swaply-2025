type SubmitResult = {
  items?: { id: string }[];
  listingId?: string;
  replayed?: boolean;
  error?: string;
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

function createKey(domain: string): string {
  const random =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  return `swaply:${domain}:${random}`.slice(0, 120);
}

function clientTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

function idempotencyKey(options: {
  domain: string;
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
    // A corrupt or unavailable localStorage entry is replaced below.
  }

  const key = createKey(options.domain);
  try {
    localStorage.setItem(
      options.storageKey,
      JSON.stringify({ fingerprint: options.requestFingerprint, key }),
    );
  } catch {
    // The request still remains server-idempotent for this browser attempt.
  }
  return key;
}

export async function submitDomainListing(options: {
  domain: "property" | "service" | "event";
  endpoint: string;
  storageKey: string;
  form: unknown;
}): Promise<{ id: string }[]> {
  const timezone = clientTimeZone();
  const requestFingerprint = fingerprint({ form: options.form, timezone });
  const key = idempotencyKey({
    domain: options.domain,
    storageKey: options.storageKey,
    requestFingerprint,
  });

  const response = await fetch(options.endpoint, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "idempotency-key": key,
    },
    body: JSON.stringify({ form: options.form, timezone }),
  });

  const body = (await response.json().catch(() => null)) as SubmitResult | null;
  if (!response.ok) {
    throw new Error(body?.error ?? "The listing could not be published. Please try again.");
  }

  try {
    localStorage.removeItem(options.storageKey);
  } catch {
    // A stale key is harmless because a changed form produces a new fingerprint.
  }

  return body?.items ?? [];
}
