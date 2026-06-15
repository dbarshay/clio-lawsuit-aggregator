import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingExcludes: {
    "/api/admin/backups/restore-preview": [
      "./next.config.ts",
      "./next.config.js",
      "./next.config.mjs",
    ],
  },
};

export default nextConfig;
