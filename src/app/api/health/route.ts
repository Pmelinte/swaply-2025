import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { getFeatureFlag } from "@/lib/feature-flags";

interface ProviderState {
  configured: boolean;
  authorised: boolean;
  live: boolean;
}

function providerState(configured: boolean, authorised: boolean): ProviderState {
  return {
    configured,
    authorised,
    live: configured && authorised,
  };
}

export async function GET() {
  const supabaseConfigured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
  const mapsConfigured = Boolean(process.env.NEXT_PUBLIC_MAPS_TOKEN);
  const cloudinaryConfigured = Boolean(
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  );

  const groqConfigured = Boolean(process.env.GROQ_API_KEY);
  const geminiConfigured = Boolean(process.env.GEMINI_API_KEY);
  const huggingFaceConfigured = Boolean(
    process.env.HUGGINGFACE_API_KEY || process.env.HUGGINGFACE_API_TOKEN,
  );
  const paidAiAuthorised =
    process.env.SWAPLY_ENABLE_PAID_AI_PRODUCTION === "true";

  const stripeConfigured = Boolean(process.env.STRIPE_SECRET_KEY);
  const paypalConfigured = Boolean(
    process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET,
  );

  const [aiEnabled, stripeEnabled, paypalEnabled, adsEnabled] =
    await Promise.all([
      getFeatureFlag("ai_matching"),
      getFeatureFlag("stripe_payments"),
      getFeatureFlag("paypal_payments"),
      getFeatureFlag("ads_banner"),
    ]);

  const providers = {
    groq: providerState(groqConfigured, aiEnabled && paidAiAuthorised),
    gemini: providerState(geminiConfigured, aiEnabled && paidAiAuthorised),
    huggingface: providerState(huggingFaceConfigured, aiEnabled),
    stripe: providerState(stripeConfigured, stripeEnabled),
    paypal: providerState(paypalConfigured, paypalEnabled),
    ads: providerState(true, adsEnabled),
  };

  logger.info("Health check", {
    supabase: supabaseConfigured,
    ai: aiEnabled,
    liveProviders: Object.entries(providers)
      .filter(([, value]) => value.live)
      .map(([name]) => name),
  });

  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    services: {
      supabase: supabaseConfigured,
      ai: aiEnabled,
      groq: providers.groq.live,
      gemini: providers.gemini.live,
      maps: mapsConfigured,
      cloudinary: cloudinaryConfigured,
      stripe: providers.stripe.live,
      paypal: providers.paypal.live,
      ads: providers.ads.live,
    },
    providers,
    contract: {
      configured: "Provider credentials are present.",
      authorised: "Owner-controlled Production activation is enabled.",
      live: "Both configured and authorised are true.",
    },
  });
}
