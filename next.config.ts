import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  async rewrites() {
    const internalApiHost = process.env.INTERNAL_API_HOST || "127.0.0.1";
    const internalApiPort = process.env.INTERNAL_API_PORT || "4001";

    return [
      {
        source: "/ping",
        destination: `http://${internalApiHost}:${internalApiPort}/ping`,
      },
      {
        source: "/api/v1/:path*",
        destination: `http://${internalApiHost}:${internalApiPort}/api/v1/:path*`,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.noitatnemucod.net',
      },
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;
