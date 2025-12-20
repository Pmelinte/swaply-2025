import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export type ApiClient = {
  id: string;
  client_name: string | null;
  api_key: string;
  plan: string | null;
  monthly_limit: number | null;
  requests_this_month: number | null;
};

type ApiAuthResult =
  | { ok: true; client: ApiClient }
  | { ok: false; response: NextResponse };

function extractApiKey(request: Request): string | null {
  const header = request.headers.get("x-api-key");
  if (header) return header.trim();

  const auth = request.headers.get("authorization");
  if (!auth) return null;
  const match = auth.match(/Bearer\s+(.+)/i);
  return match?.[1]?.trim() ?? null;
}

export async function requireApiClient(
  request: Request,
  endpoint: string
): Promise<ApiAuthResult> {
  const apiKey = extractApiKey(request);

  if (!apiKey) {
    return {
      ok: false,
      response: NextResponse.json(
        { ok: false, error: "missing_api_key" },
        { status: 401 }
      ),
    };
  }

  const supabase = createServerClient();
  const { data: client, error } = await supabase
    .from("api_clients")
    .select("*")
    .eq("api_key", apiKey)
    .maybeSingle();

  if (error || !client) {
    return {
      ok: false,
      response: NextResponse.json(
        { ok: false, error: "invalid_api_key" },
        { status: 401 }
      ),
    };
  }

  const requestsThisMonth = client.requests_this_month ?? 0;
  const monthlyLimit = client.monthly_limit ?? 0;

  if (monthlyLimit > 0 && requestsThisMonth >= monthlyLimit) {
    await supabase.from("api_usage_logs").insert({
      api_key: client.api_key,
      endpoint,
      status: "limit_reached",
    });

    return {
      ok: false,
      response: NextResponse.json(
        { ok: false, error: "monthly_limit_reached" },
        { status: 429 }
      ),
    };
  }

  const nextCount = requestsThisMonth + 1;
  await supabase
    .from("api_clients")
    .update({ requests_this_month: nextCount })
    .eq("api_key", client.api_key);

  await supabase.from("api_usage_logs").insert({
    api_key: client.api_key,
    endpoint,
    status: "ok",
  });

  return { ok: true, client: client as ApiClient };
}
