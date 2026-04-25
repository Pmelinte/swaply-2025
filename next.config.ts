import type { NextConfig } from "next";
import withBundleAnalyzer from "@next/bundle-analyzer";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const withAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/',
        destination: '/en',
        permanent: true,
      },
    ];
  },

  // Use standalone output for Docker; Vercel handles its own packaging
  output: process.env.VERCEL ? undefined : "standalone",

  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "i.pravatar.cc" },
      { protocol: "https", hostname: "flagcdn.com" },
      { protocol: "https", hostname: "ui-avatars.com" },
    ],
  },

  headers: async () => [
    {
      source: "/(.*)",
      headers: [
        {
          key: "Content-Security-Policy",
          value: [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://va.vercel-scripts.com https://vercel.live https://www.paypal.com https://*.paypal.com https://js.braintreegateway.com https://www.paypalobjects.com",
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data: blob: https: https://res.cloudinary.com https://*.supabase.co https://images.unsplash.com https://picsum.photos https://i.pravatar.cc https://maps.googleapis.com https://flagcdn.com https://ui-avatars.com",
            "font-src 'self'",
            "connect-src 'self' https://*.supabase.co https://keaejxlwqtjjglijiplh.supabase.co/functions/v1/* https://keaejxlwqtjjglijiplh.supabase.co/rest/v1/* https://keaejxlwqtjjglijiplh.supabase.co/auth/v1/* https://keaejxlwqtjjglijiplh.supabase.co/storage/v1/* wss://keaejxlwqtjjglijiplh.supabase.co/* https://vercel.live wss://*.pusher.com https://*.pusher.com https://api-inference.huggingface.co https://router.huggingface.co https://api.groq.com https://generativelanguage.googleapis.com https://www.google-analytics.com https://*.analytics.google.com https://va.vercel-scripts.com https://api.paypal.com https://api.sandbox.paypal.com https://*.paypal.com https://*.sandbox.paypal.com https://api.cloudinary.com https://api.x.ai",
            "frame-src 'self' https://vercel.live https://vercel.com https://*.vercel.com https://*.vercel.app https://www.google.com https://maps.google.com https://www.paypal.com https://*.paypal.com https://www.sandbox.paypal.com https://*.sandbox.paypal.com",
            "object-src 'none'",
            "base-uri 'self'",
          ].join("; "),
        },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" },
      ],
    },
  ],
};

export default withNextIntl(withAnalyzer(nextConfig));
