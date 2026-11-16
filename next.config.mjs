import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: { inlineCss: true },
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Warning: This allows production builds to successfully complete even if
    // your project has type errors.
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // Production debugging - only enable source maps if debug mode is on
  productionBrowserSourceMaps: process.env.NEXT_PUBLIC_DEBUG_MODE === 'true',
  reactStrictMode: true,  // Helps identify potential problems
  
  // Cache control - generates unique build ID for each deployment
  generateBuildId: async () => {
    // Use timestamp as build ID to force cache invalidation
    return Date.now().toString();
  },
  

};

export default withNextIntl(nextConfig);