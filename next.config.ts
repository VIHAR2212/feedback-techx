import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // NOTE: do NOT set `output: "standalone"` — Vercel handles Next.js
  // deployments natively and the standalone mode breaks the Vercel build
  // with "ENOENT: .next/next-server.js.nft.json".
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
