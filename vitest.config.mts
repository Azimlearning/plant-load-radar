import { defineConfig } from "vitest/config";

// Node environment: src/core and src/data are plain TypeScript with no DOM.
// Add jsdom + React Testing Library only when the first component test is written (P1).
// `resolve.tsconfigPaths` makes the "@/..." alias work natively (Vite no longer needs a plugin).
export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    environment: "node",
    include: ["src/**/*.test.{ts,tsx}", "tests/**/*.test.{ts,tsx}"],
  },
});
