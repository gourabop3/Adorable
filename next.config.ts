import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  devIndicators: false,
  experimental: {
    serverComponentsExternalPackages: ['@mastra/core', '@mastra/memory', '@mastra/pg'],
  },
};

export default nextConfig;
