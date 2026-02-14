import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "jsdom",
    "@mozilla/readability",
    "exceljs",
  ],
};

export default nextConfig;
