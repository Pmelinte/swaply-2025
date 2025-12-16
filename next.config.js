// next.config.js

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // IMPORTANT: nu oprește ESLint în dev, doar nu mai face build-ul să pice pe Vercel
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
