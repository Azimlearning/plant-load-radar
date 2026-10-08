import type { NextConfig } from "next";

// The scaffold enabled `cacheComponents` and `partialPrefetching`. Both are opt-in and make
// server code stricter about dynamic data; this demo reads local files and has simple server
// routes, so they are off (rule 8: prefer the simpler option). Revisit with an ADR if needed.
const nextConfig: NextConfig = {
  // The dynamic pages read data/ at request time, which the build's file tracing cannot see. Without this the hosted
  // functions would start without the scenario, the manifest or the samples (ADR D-19).
  outputFileTracingIncludes: {
    "/*": ["./data/**/*"],
  },
  turbopack: {
    // Pin the project root: a stray package-lock.json higher up (e.g. in the home folder) otherwise confuses root detection.
    root: process.cwd(),
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
