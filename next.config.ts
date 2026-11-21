import type { NextConfig } from "next";

// The demo is client-rendered (state lives in the browser), so Cache Components /
// partial prerendering are off: they would only force Suspense around URL hooks.
const nextConfig: NextConfig = {
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
