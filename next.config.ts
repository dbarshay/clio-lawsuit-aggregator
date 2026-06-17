import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingExcludes: {
    "*": [
      "./backups/**/*",
      "./.next/dev/**/*",
      "./.next/cache/**/*",
      "./.vercel/**/*"
    ],
    "/api/admin/backups/restore-preview": [
      "./next.config.ts",
      "./next.config.js",
      "./next.config.mjs",
    ],
    "/api/admin/backups/archive-error-log": [
      "./backups/**/*",
      "./.next/dev/**/*",
      "./.next/cache/**/*",
      "./.vercel/**/*"
    ],
    "/api/admin/backups/status": [
      "./backups/**/*",
      "./.next/dev/**/*",
      "./.next/cache/**/*",
      "./.vercel/**/*"
    ],
    "/api/admin/backups/run": [
      "./backups/**/*",
      "./.next/dev/**/*",
      "./.next/cache/**/*",
      "./.vercel/**/*"
    ],
  },
};

export default nextConfig;
