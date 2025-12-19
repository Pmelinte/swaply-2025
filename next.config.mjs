/** @type {import('next').NextConfig} */
const nextConfig = {
  // Strict mode poate fi reactivat când stabilizăm complet client/server boundaries.
  reactStrictMode: false,

  // Ca să nu-ți mai pice build-ul pe Vercel din warnings ESLint.
  // (În dev tot ai lint dacă rulezi `next lint`.)
  eslint: {
    ignoreDuringBuilds: true,
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.cloudinary.com",
      },
    ],
  },

  experimental: {
    serverActions: {
      bodySizeLimit: "5mb",
    },
  },
};

export default nextConfig;
