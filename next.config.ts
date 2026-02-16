import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
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
