import { NextResponse } from "next/server";

import {
  DomainListingPayloadError,
  type DomainListingCreatePayload,
  type DomainListingType,
} from "@/lib/listings/domainListingPayload";
import { getServerSupabase } from "@/lib/supabase/server";

const IDEMPOTENCY_KEY_PATTERN = /^[A-Za-z0-9._:-]{8,120}$/;
const VALUE_TIERS = new Set(["small", "medium", "large", "special"]);

type DomainNormalizer = (form: unknown) => DomainListingCreatePayload;

type RpcResult = {
  schema_version?: unknown;
  domain?: unknown;
  item_id?: unknown;
  listing_id?: unknown;
  replayed?: unknown;
};

function safeErrorStatus(code: string | undefined): number {
  if (code === "23505") return 409;
  if (code === "22023" || code === "22P02" || code === "23514") return 400;
  if (code === "42501") return 403;
  return 500;
}

function safeErrorMessage(status: number): string {
  if (status === 409) return "This publication request conflicts with an earlier request.";
  if (status === 400) return "The listing data is invalid or incomplete.";
  if (status === 403) return "You are not allowed to publish this listing.";
  return "The listing could not be published. Please try again.";
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
  if (error.code === "INVALID_URL") {
    return "Links must be valid HTTP URLs.";
  }
  return error.message;
}

export async function createDomainListingResponse(options: {
  request: Request;
  domain: DomainListingType;
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

  const idempotencyKey = options.request.headers.get("idempotency-key")?.trim() ?? "";
  if (!IDEMPOTENCY_KEY_PATTERN.test(idempotencyKey)) {
    return NextResponse.json({ error: "A valid idempotency key is required." }, { status: 400 });
  }

  const body = (await options.request.json().catch(() => null)) as
    | { form?: unknown; timezone?: unknown }
    | null;
  if (!body || body.form === undefined) {
    return NextResponse.json({ error: "Listing form is required." }, { status: 400 });
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

  const { data, error } = await supabase.rpc("create_domain_listing_v1", {
    p_domain: options.domain,
    p_payload: payload,
    p_idempotency_key: idempotencyKey,
  });

  if (error) {
    const status = safeErrorStatus(error.code);
    console.error("domain_listing_create_failed", {
      domain: options.domain,
      code: error.code ?? "UNKNOWN",
      status,
    });
    return NextResponse.json(
      { error: safeErrorMessage(status), code: error.code ?? "UNKNOWN" },
      { status },
    );
  }

  const result = data as RpcResult | null;
  const itemId = typeof result?.item_id === "string" ? result.item_id : null;
  const listingId = typeof result?.listing_id === "string" ? result.listing_id : null;
  const replayed = result?.replayed === true;

  if (!itemId || !listingId || result?.domain !== options.domain) {
    console.error("domain_listing_create_invalid_response", { domain: options.domain });
    return NextResponse.json(
      { error: "The listing service returned an invalid response." },
      { status: 502 },
    );
  }

  return NextResponse.json(
    {
      items: [{ id: itemId }],
      listingId,
      replayed,
    },
    { status: replayed ? 200 : 201 },
  );
}
