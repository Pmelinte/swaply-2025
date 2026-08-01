import { NextResponse } from "next/server";

import {
  DomainListingPayloadError,
  type DomainListingCreatePayload,
  type DomainListingType,
} from "@/lib/listings/domainListingPayload";
import { getServerSupabase } from "@/lib/supabase/server";

const IDEMPOTENCY_KEY_PATTERN = /^[A-Za-z0-9._:-]{8,120}$/;
const VALUE_TIERS = new Set(["small", "medium", "large", "special"]);
const DOMAIN_STATUSES = new Set(["active", "paused", "archived"]);

type DomainNormalizer = (form: unknown) => DomainListingCreatePayload;

type MutationRpcResult = {
  schema_version?: unknown;
  domain?: unknown;
  operation?: unknown;
  item_id?: unknown;
  listing_id?: unknown;
  status?: unknown;
  revision?: unknown;
  replayed?: unknown;
};

function safeErrorStatus(code: string | undefined): number {
  if (code === "23505" || code === "40001") return 409;
  if (code === "22023" || code === "22P02" || code === "23514") return 400;
  if (code === "42501") return 403;
  if (code === "P0002") return 404;
  return 500;
}

function safeErrorMessage(status: number, operation: "edit" | "status"): string {
  if (status === 409) {
    return operation === "edit"
      ? "This listing changed or this edit request conflicts with an earlier request. Reload and try again."
      : "This listing changed or this lifecycle request conflicts with an earlier request. Reload and try again.";
  }
  if (status === 400) return "The listing data is invalid or incomplete.";
  if (status === 403) return "You are not allowed to manage this listing.";
  if (status === 404) return "Listing not found.";
  return operation === "edit"
    ? "The listing could not be updated. Please try again."
    : "The listing status could not be changed. Please try again.";
}

function assertRequiredValueTiers(
  payload: DomainListingCreatePayload,
  domain: DomainListingType,
): void {
  if (domain === "property") return;

  const values = [
    payload.item.perceived_value_tier,
    payload.item.swap_wants_value_tier,
    payload.listing.swap_wants_value_tier,
  ];

  if (
    values.some(
      (value) => typeof value !== "string" || !VALUE_TIERS.has(value),
    )
  ) {
    throw new DomainListingPayloadError(
      "INVALID_VALUE_TIER",
      "Value tier must be small, medium, large or special.",
    );
  }
}

function boundEditorPayload(
  payload: DomainListingCreatePayload,
  domain: DomainListingType,
): DomainListingCreatePayload {
  return {
    ...payload,
    private: {
      ...payload.private,
      editor_payload: {
        ...payload.private.editor_payload,
        schema_version: "1.0",
        source: `${domain}_wizard`,
      },
    },
  };
}

function safePayloadErrorMessage(error: DomainListingPayloadError): string {
  if (error.code === "INVALID_URL") return "Links must be valid HTTP URLs.";
  return error.message;
}

function validRevision(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 1;
}

function idempotencyKey(request: Request): string | null {
  const value = request.headers.get("idempotency-key")?.trim() ?? "";
  return IDEMPOTENCY_KEY_PATTERN.test(value) ? value : null;
}

function validMutationResult(
  result: MutationRpcResult | null,
  domain: DomainListingType,
  operation: "edit" | "status",
): result is MutationRpcResult & {
  item_id: string;
  listing_id: string;
  status: string;
  revision: number;
} {
  return Boolean(
    result &&
      result.domain === domain &&
      result.operation === operation &&
      typeof result.item_id === "string" &&
      typeof result.listing_id === "string" &&
      typeof result.status === "string" &&
      validRevision(result.revision),
  );
}

export async function updateDomainListingResponse(options: {
  request: Request;
  domain: DomainListingType;
  itemId: string;
  normalize: DomainNormalizer;
}): Promise<NextResponse> {
  const supabase = await getServerSupabase();
  if (!supabase) {
    return NextResponse.json({ error: "Listing service is unavailable." }, { status: 503 });
  }

  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth.user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const key = idempotencyKey(options.request);
  if (!key) {
    return NextResponse.json({ error: "A valid idempotency key is required." }, { status: 400 });
  }

  const body = (await options.request.json().catch(() => null)) as
    | { form?: unknown; timezone?: unknown; expectedRevision?: unknown }
    | null;
  if (!body || body.form === undefined || !validRevision(body.expectedRevision)) {
    return NextResponse.json(
      { error: "Listing form and expected revision are required." },
      { status: 400 },
    );
  }

  let payload: DomainListingCreatePayload;
  try {
    const form =
      body.form && typeof body.form === "object" && !Array.isArray(body.form)
        ? { ...(body.form as Record<string, unknown>), timezone: body.timezone }
        : body.form;
    const normalized = options.normalize(form);
    assertRequiredValueTiers(normalized, options.domain);
    payload = boundEditorPayload(normalized, options.domain);
  } catch (error) {
    if (error instanceof DomainListingPayloadError) {
      return NextResponse.json(
        { error: safePayloadErrorMessage(error), code: error.code },
        { status: 400 },
      );
    }
    return NextResponse.json({ error: "Listing form is invalid." }, { status: 400 });
  }

  const { data, error } = await supabase.rpc("update_domain_listing_v1", {
    p_domain: options.domain,
    p_item_id: options.itemId,
    p_payload: payload,
    p_expected_revision: body.expectedRevision,
    p_idempotency_key: key,
  });

  if (error) {
    const status = safeErrorStatus(error.code);
    console.error("domain_listing_update_failed", {
      domain: options.domain,
      itemId: options.itemId,
      code: error.code ?? "UNKNOWN",
      status,
    });
    return NextResponse.json(
      { error: safeErrorMessage(status, "edit"), code: error.code ?? "UNKNOWN" },
      { status },
    );
  }

  const result = data as MutationRpcResult | null;
  if (!validMutationResult(result, options.domain, "edit")) {
    console.error("domain_listing_update_invalid_response", {
      domain: options.domain,
      itemId: options.itemId,
    });
    return NextResponse.json(
      { error: "The listing service returned an invalid response." },
      { status: 502 },
    );
  }

  return NextResponse.json({
    itemId: result.item_id,
    listingId: result.listing_id,
    status: result.status,
    revision: result.revision,
    replayed: result.replayed === true,
  });
}

export async function setDomainListingStatusResponse(options: {
  request: Request;
  domain: DomainListingType;
  itemId: string;
}): Promise<NextResponse> {
  const supabase = await getServerSupabase();
  if (!supabase) {
    return NextResponse.json({ error: "Listing service is unavailable." }, { status: 503 });
  }

  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth.user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const key = idempotencyKey(options.request);
  if (!key) {
    return NextResponse.json({ error: "A valid idempotency key is required." }, { status: 400 });
  }

  const body = (await options.request.json().catch(() => null)) as
    | { status?: unknown; expectedRevision?: unknown }
    | null;
  const statusValue =
    typeof body?.status === "string" ? body.status.trim().toLowerCase() : "";
  if (!DOMAIN_STATUSES.has(statusValue) || !validRevision(body?.expectedRevision)) {
    return NextResponse.json(
      { error: "A valid lifecycle status and expected revision are required." },
      { status: 400 },
    );
  }

  const { data, error } = await supabase.rpc("set_domain_listing_status_v1", {
    p_domain: options.domain,
    p_item_id: options.itemId,
    p_status: statusValue,
    p_expected_revision: body.expectedRevision,
    p_idempotency_key: key,
  });

  if (error) {
    const responseStatus = safeErrorStatus(error.code);
    console.error("domain_listing_status_failed", {
      domain: options.domain,
      itemId: options.itemId,
      code: error.code ?? "UNKNOWN",
      status: responseStatus,
    });
    return NextResponse.json(
      {
        error: safeErrorMessage(responseStatus, "status"),
        code: error.code ?? "UNKNOWN",
      },
      { status: responseStatus },
    );
  }

  const result = data as MutationRpcResult | null;
  if (!validMutationResult(result, options.domain, "status")) {
    console.error("domain_listing_status_invalid_response", {
      domain: options.domain,
      itemId: options.itemId,
    });
    return NextResponse.json(
      { error: "The listing service returned an invalid response." },
      { status: 502 },
    );
  }

  return NextResponse.json({
    itemId: result.item_id,
    listingId: result.listing_id,
    status: result.status,
    revision: result.revision,
    replayed: result.replayed === true,
  });
}
