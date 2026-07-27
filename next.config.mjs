/** @type {import('next').NextConfig} */
const nextConfig = {
  // ESM-only packages used for audio-stream extraction — leave them external
  // instead of webpack-bundled, so Node's native ESM resolution handles them
  // correctly at runtime (bundling them causes ERR_REQUIRE_ESM in serverless).
  experimental: {
    serverComponentsExternalPackages: ['bgutils-js', 'jsdom', 'youtubei.js'],
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;
