import type { NextConfig } from "next";
import fs from "node:fs/promises";
import path from "node:path";

class CopyJsdomDefaultStylesheetPlugin {
  apply(compiler: { hooks: { afterEmit: { tapPromise: (name: string, cb: () => Promise<void>) => void } }; options: { output: { path?: string } } }) {
    compiler.hooks.afterEmit.tapPromise(
      "CopyJsdomDefaultStylesheetPlugin",
      async () => {
        const source = path.join(
          process.cwd(),
          "node_modules/jsdom/lib/jsdom/browser/default-stylesheet.css",
        );
        const outputPath = compiler.options.output.path ?? path.join(process.cwd(), ".next");
        const serverOutputPath =
          path.basename(outputPath) === "server"
            ? outputPath
            : path.join(outputPath, "server");
        const destination = path.join(
          serverOutputPath,
          "app/api/runs/[id]/browser/default-stylesheet.css",
        );

        await fs.mkdir(path.dirname(destination), { recursive: true });
        await fs.copyFile(source, destination);
      },
    );
  }
}

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
    // For App Router route handlers, this key must match the normalized route
    // path (without the trailing `/route` segment).
    "/api/runs/[id]/phase/[phaseName]": [
      "./prompts/**/*.txt",
      "./node_modules/jsdom/lib/jsdom/browser/default-stylesheet.css",
    ],
  },
  webpack: (config, { dev, isServer }) => {
    if (isServer && !dev) {
      config.plugins = config.plugins ?? [];
      config.plugins.push(new CopyJsdomDefaultStylesheetPlugin());
    }

    return config;
  },
};

export default nextConfig;
