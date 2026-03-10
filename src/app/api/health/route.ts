import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { getFeatureFlag } from "@/lib/feature-flags";

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const mapsToken = Boolean(process.env.NEXT_PUBLIC_MAPS_TOKEN);
  const cloudinary = Boolean(process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME);

  const groqConfigured = Boolean(process.env.GROQ_API_KEY);
  const geminiConfigured = Boolean(process.env.GEMINI_API_KEY);

  const [aiEnabled, stripeEnabled, paypalEnabled, adsEnabled] = await Promise.all([
    getFeatureFlag("ai_matching"),
    getFeatureFlag("stripe_payments"),
    getFeatureFlag("paypal_payments"),
    getFeatureFlag("ads_display"),
  ]);

  logger.info("Health check", { supabase: Boolean(supabaseUrl && supabaseKey), ai: aiEnabled });

  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    services: {
      supabase: Boolean(supabaseUrl && supabaseKey),
      ai: aiEnabled,
      groq: groqConfigured,
      gemini: geminiConfigured,
      maps: mapsToken,
      cloudinary,
      stripe: stripeEnabled,
      paypal: paypalEnabled,
      ads: adsEnabled,
    },
  });
}
