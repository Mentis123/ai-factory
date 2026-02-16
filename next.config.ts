import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "exceljs",
    "@prisma/client",
    "@prisma/adapter-neon",
    "@neondatabase/serverless",
  ],
  transpilePackages: [
    // jsdom dependency tree currently mixes CJS + ESM entrypoints.
    // Force Next to bundle/transpile these modules so runtime does not attempt
    // a direct CJS require() of an ESM file on serverless (ERR_REQUIRE_ESM).
    "jsdom",
    "html-encoding-sniffer",
    "@exodus/bytes",
    "whatwg-url",
    "whatwg-mimetype",
    "p-limit",
    "yocto-queue",
  ],
  outputFileTracingIncludes: {
    "/api/runs/[id]/phase/[phaseName]": ["./prompts/**/*.txt"],
  },
};

export default nextConfig;
