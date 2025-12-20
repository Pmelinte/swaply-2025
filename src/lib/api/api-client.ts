import { headers } from "next/headers";
import { createServerClient } from "@/lib/supabase/server";

export type ApiClient = {
  id: string;
  api_key: string;
  plan: string | null;
  monthly_limit: number | null;
  requests_this_month: number | null;
};

export async function authorizeApiRequest(endpoint: string) {
  const supabase = createServerClient();
  const apiKey = headers().get("x-api-key");

  if (!apiKey) {
    return { ok: false, error: "missing_api_key" } as const;
  }

  const { data: client } = await supabase
    .from("api_clients")
    .select("*")
    .eq("api_key", apiKey)
    .maybeSingle();

  if (!client) {
    await supabase.from("api_usage_logs").insert({
      api_key: apiKey,
      endpoint,
      status: "unauthorized",
    });
    return { ok: false, error: "invalid_api_key" } as const;
  }

  const limit = client.monthly_limit ?? 0;
  const used = client.requests_this_month ?? 0;
  if (limit > 0 && used >= limit) {
    await supabase.from("api_usage_logs").insert({
      api_key: apiKey,
      endpoint,
      status: "rate_limited",
    });
    return { ok: false, error: "rate_limited" } as const;
  }

  await supabase
    .from("api_clients")
    .update({ requests_this_month: used + 1 })
    .eq("api_key", apiKey);

  await supabase.from("api_usage_logs").insert({
    api_key: apiKey,
    endpoint,
    status: "ok",
  });

  return { ok: true, client } as const;
}
