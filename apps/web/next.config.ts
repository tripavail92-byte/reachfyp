import type { NextConfig } from "next";

const distDir = process.env.NODE_ENV === "production" ? ".next-build" : ".next-dev";

const nextConfig: NextConfig = {
  distDir,
  reactStrictMode: true,
  transpilePackages: ["@reachfyp/api", "@reachfyp/schemas", "@reachfyp/ui"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default nextConfig;
