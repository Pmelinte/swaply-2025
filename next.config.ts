import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "i.pravatar.cc" },
      { protocol: "https", hostname: "flagcdn.com" },
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
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data: blob: https://res.cloudinary.com https://*.supabase.co https://images.unsplash.com https://picsum.photos https://i.pravatar.cc https://maps.googleapis.com https://flagcdn.com",
            "font-src 'self'",
            "connect-src 'self' https://*.supabase.co https://api-inference.huggingface.co https://router.huggingface.co https://api.groq.com https://generativelanguage.googleapis.com",
            "frame-src 'self' https://www.google.com https://maps.google.com",
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

export default nextConfig;
