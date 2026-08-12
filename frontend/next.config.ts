import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    '192.168.1.23',
    '192.168.1.23:3005',
    '192.168.1.7',
    '192.168.1.7:3005',
    'localhost:3005',
    '0.0.0.0:3005',
  ],
  images: {
    dangerouslyAllowSVG: true,
    localPatterns: [
      {
        pathname: '/**',
        search: '?*',
      },
      {
        pathname: '/**',
        search: '',
      },
    ],
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "4000",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "192.168.1.23",
        port: "4000",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "192.168.1.7",
        port: "4000",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "4000",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "placehold.co",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "**.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "**.amazonaws.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "**.cloudfront.net",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "**.railway.app",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "**.up.railway.app",
        pathname: "/**",
      },
    ],
  },
  async rewrites() {
    // Only used for local dev when NEXT_PUBLIC_API_BASE_URL is unset (see
    // frontend/src/lib/api/client.ts). In UAT/production the API base URL is
    // absolute (Railway URL), so this rewrite is never hit.
    return [
      {
        source: '/api/v1/:path*',
        destination: `${process.env.BACKEND_INTERNAL_URL || 'http://127.0.0.1:4000'}/api/v1/:path*`,
      },
    ];
  },
  turbopack: {
    root: path.resolve(__dirname, ".."),
  },
};

export default nextConfig;
