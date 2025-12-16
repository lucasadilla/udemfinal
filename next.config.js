/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Enable image optimization
    formats: ['image/avif', 'image/webp'],
    // Allow images from external domains if needed
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
    ],
    // Optimize images
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  // Optimize page transitions
  experimental: {
    optimizePackageImports: ['@mantine/core', '@mantine/dates'],
  },
  // Enable faster page transitions
  reactStrictMode: true,
  // Optimize production builds
  swcMinify: true,
};

module.exports = nextConfig;
