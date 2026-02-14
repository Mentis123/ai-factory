import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "jsdom",
    "@mozilla/readability",
    "exceljs",
    "@prisma/client",
    "@prisma/adapter-neon",
    "@neondatabase/serverless",
  ],
  transpilePackages: [
    "p-limit",
    "yocto-queue",
  ],
  outputFileTracingIncludes: {
    "/api/runs/[id]/phase/[phaseName]": ["./prompts/**/*.txt"],
  },
};

export default nextConfig;
