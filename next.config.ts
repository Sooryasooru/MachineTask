import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // mammoth shells out to Node-only libraries, and the import route runs on Node.
  serverExternalPackages: ["mammoth"],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
