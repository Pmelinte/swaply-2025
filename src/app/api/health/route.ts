import { NextResponse } from "next/server";

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const hfEnabled = process.env.NEXT_PUBLIC_HF_ENABLED === "true";
  const mapsToken = Boolean(process.env.NEXT_PUBLIC_MAPS_TOKEN);
  const cloudinary = Boolean(process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME);

  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    services: {
      supabase: Boolean(supabaseUrl && supabaseKey),
      ai: hfEnabled,
      maps: mapsToken,
      cloudinary,
    },
  });
}
