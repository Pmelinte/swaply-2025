import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const PAYPAL_WEBHOOK_ID = Deno.env.get("PAYPAL_WEBHOOK_ID");
const PAYPAL_CLIENT_ID = Deno.env.get("PAYPAL_CLIENT_ID");
const PAYPAL_CLIENT_SECRET = Deno.env.get("PAYPAL_CLIENT_SECRET");
const PAYPAL_API_BASE = Deno.env.get("PAYPAL_API_BASE") || "https://api-m.paypal.com";

/**
 * Verify PayPal webhook signature by calling PayPal's verification API.
 * Returns true if the webhook is authentic.
 */
async function verifyWebhookSignature(
  headers: Headers,
  body: string,
): Promise<boolean> {
  if (!PAYPAL_WEBHOOK_ID || !PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
    console.error("Missing PayPal configuration env vars");
    return false;
  }

  // Get OAuth token
  const tokenRes = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${btoa(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`)}`,
    },
    body: "grant_type=client_credentials",
  });

  if (!tokenRes.ok) {
    console.error("Failed to get PayPal OAuth token:", tokenRes.status);
    return false;
  }

  const { access_token } = (await tokenRes.json()) as { access_token: string };

  // Verify webhook signature
  const verifyRes = await fetch(
    `${PAYPAL_API_BASE}/v1/notifications/verify-webhook-signature`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${access_token}`,
      },
      body: JSON.stringify({
        auth_algo: headers.get("paypal-auth-algo") || "",
        cert_url: headers.get("paypal-cert-url") || "",
        transmission_id: headers.get("paypal-transmission-id") || "",
        transmission_sig: headers.get("paypal-transmission-sig") || "",
        transmission_time: headers.get("paypal-transmission-time") || "",
        webhook_id: PAYPAL_WEBHOOK_ID,
        webhook_event: JSON.parse(body),
      }),
    },
  );

  if (!verifyRes.ok) {
    console.error("PayPal verify-webhook-signature failed:", verifyRes.status);
    return false;
  }

  const result = (await verifyRes.json()) as { verification_status: string };
  return result.verification_status === "SUCCESS";
}

Deno.serve(async (req: Request) => {
  // Only accept POST
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  const body = await req.text();

  // Verify webhook signature
  const isValid = await verifyWebhookSignature(req.headers, body);
  if (!isValid) {
    console.error("Invalid PayPal webhook signature");
    return new Response(JSON.stringify({ error: "Invalid signature" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  let event: {
    event_type: string;
    resource: {
      id?: string;
      supplementary_data?: {
        related_ids?: { order_id?: string };
      };
      amount?: { value?: string; currency_code?: string };
      status?: string;
    };
  };

  try {
    event = JSON.parse(body);
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const eventType = event.event_type;
  const resource = event.resource;

  // Extract the PayPal order/capture ID to match against provider_id
  const providerId =
    resource.supplementary_data?.related_ids?.order_id ||
    resource.id ||
    "";

  if (!providerId) {
    console.warn(`No provider ID found in ${eventType} event`);
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  console.log(`PayPal webhook: ${eventType} for ${providerId}`);

  if (
    eventType === "PAYMENT.CAPTURE.COMPLETED" ||
    eventType === "CHECKOUT.ORDER.APPROVED"
  ) {
    const { error } = await supabase
      .from("payment_transactions")
      .update({
        status: "completed",
        updated_at: new Date().toISOString(),
      })
      .eq("provider_id", providerId)
      .eq("provider", "paypal");

    if (error) {
      console.error("Failed to update transaction to completed:", error.message);
    } else {
      console.log(`Transaction ${providerId} marked as completed`);
    }
  } else if (
    eventType === "PAYMENT.CAPTURE.REFUNDED" ||
    eventType === "PAYMENT.CAPTURE.REVERSED"
  ) {
    const { error } = await supabase
      .from("payment_transactions")
      .update({
        status: "refunded",
        updated_at: new Date().toISOString(),
      })
      .eq("provider_id", providerId)
      .eq("provider", "paypal");

    if (error) {
      console.error("Failed to update transaction to refunded:", error.message);
    } else {
      console.log(`Transaction ${providerId} marked as refunded`);
    }
  } else {
    console.log(`Unhandled PayPal event type: ${eventType}`);
  }

  // Always return 200 for valid webhooks to prevent PayPal retries
  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
